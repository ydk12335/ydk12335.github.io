/**
 * 有点困 · AI 调用中继（经 Supabase Edge Function 转发，密钥不上前端）
 * -----------------------------------------------
 * 规则：
 *  1. 所有请求统一发往 Supabase Edge Function（sleep-ai-relay）；
 *  2. Edge Function 内部持有真实 AI 密钥（环境变量），并负责主/备线路自动切换；
 *  3. 前端只携带 Supabase 公开的 anon key（设计上可公开，供 JWT 校验）；
 *  4. 请求失败重试 5 次，界面通过 onRetry 显示「正在尝试重连」；
 *  5. 全部失败则抛错，由调用方给出最终错误提示。
 *
 * 用法：
 *  非流式：const j = await window.AIRelay.complete({ messages, temperature, max_tokens, onRetry });
 *  流式：  const full = await window.AIRelay.stream({ messages, temperature, max_tokens, onDelta, onReason, onRetry });
 *  onRetry(tierName, attempt, err)：每次重连时回调（用于界面提示）
 *  onDelta(content, full)：流式增量回调
 *  onReason(reasonText)：思考过程增量回调
 */
(function () {
  'use strict';

  // 统一走 Supabase Edge Function（密钥在服务端环境变量里，前端不带任何 sk- 密钥）
  const TIERS = [
    { name: '主线路', base: 'https://ooewxcqksrvixnslzhkw.supabase.co/functions/v1/sleep-ai-relay' }
  ];
  // Supabase 公开 anon key（设计上可公开，仅用于 Edge Function 的 JWT 校验门槛）
  const SB_ANON_KEY = 'sb_publishable_VdjiBIABpFj0RHgoXFC2wQ_NxpPt7df';
  const RETRY = 2;            // 外层对 Edge 的整体重试次数（Edge 内部已做主备切换+超时，外层 1-2 次兜底即可，避免 5 次叠加成几分钟死等）
  const TIMEOUT = 90000;      // 单次请求超时（Edge 内部已管上游超时，这里只需兜底网络层）

  /** 单次 fetch 尝试（自带超时，超时即抛错触发重试） */
  async function tryFetch(tier, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(tier.base + '/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SB_ANON_KEY,
          'apikey': SB_ANON_KEY
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        let msg = 'HTTP ' + res.status;
        try { const j = await res.json(); if (j && j.error && j.error.message) msg = j.error.message; } catch (e) {}
        const err = new Error(msg); err.status = res.status; throw err;
      }
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  /** 带重试 + 自动切换的通用外壳 */
  async function relay(fn, onRetry) {
    let lastErr = null;
    for (let t = 0; t < TIERS.length; t++) {
      const tier = TIERS[t];
      for (let a = 0; a < RETRY; a++) {
        try {
          return await fn(tier);
        } catch (e) {
          lastErr = e;
          if (onRetry) {
            try { onRetry(tier.name, a + 1, e); } catch (e2) {}
          }
        }
      }
    }
    throw lastErr || new Error('AI 连接失败');
  }

  /** 非流式补全（支持 progress SSE 进度事件解析） */
  async function complete(opts) {
    const { messages, temperature, max_tokens, onRetry, onProgress } = opts || {};
    return relay(async (tier) => {
      const body = { messages, temperature, max_tokens };
      // progress 模式：带进度事件（Edge Function 返回 SSE，逐条上报线路切换过程）
      if (onProgress) body.progress = true;
      const res = await tryFetch(tier, body);
      const ct = (res.headers.get('content-type') || '');
      // progress SSE：解析 data: {...} 事件流，遇 result 返回其 data，遇 error 抛错
      if (ct.includes('text/event-stream')) {
        const rd = res.body.getReader(), dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const r = await rd.read(); if (r.done) break;
          buf += dec.decode(r.value, { stream: true });
          const parts = buf.split('\n\n'); buf = parts.pop() || '';
          for (const chunk of parts) {
            const line = chunk.trim().replace(/^data:\s*/, '');
            if (!line) continue;
            try {
              const ev = JSON.parse(line);
              if (ev.type === 'tier_start' && onProgress) onProgress(ev.tier, 'connecting', null, ev.attempt, ev.total);
              else if (ev.type === 'tier_fail' && onProgress) onProgress(ev.tier, 'fail', ev.err, ev.attempt, ev.total);
              else if (ev.type === 'result') return ev.data;
              else if (ev.type === 'error') { const e = new Error(ev.err || 'AI 失败'); e.status = 502; throw e; }
            } catch (e) { if (e && e.status) throw e; }
          }
        }
        throw new Error('progress 流未收到 result');
      }
      return await res.json();
    }, onRetry);
  }

  /** 流式补全：返回完整文本；onDelta/onReason 为增量回调 */
  async function stream(opts) {
    const { messages, temperature, max_tokens, onDelta, onReason, onRetry } = opts || {};
    return relay(async (tier) => {
      const res = await tryFetch(tier, { messages, temperature, max_tokens, stream: true });
      const rd = res.body.getReader(), dec = new TextDecoder();
      let full = '', buf = '';
      for (;;) {
        const r = await rd.read(); if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        const parts = buf.split('\n'); buf = parts.pop() || '';
        for (const line of parts) {
          const l = line.trim();
          if (!l.startsWith('data:')) continue;
          const p = l.slice(5).trim();
          if (p === '[DONE]') break;
          try {
            const j = JSON.parse(p);
            const d = (j.choices && j.choices[0] && j.choices[0].delta) || {};
            if (d.reasoning_content && onReason) onReason(d.reasoning_content);
            if (typeof d.content === 'string' && d.content) {
              full += d.content;
              if (onDelta) onDelta(d.content, full);
            }
          } catch (e) {}
        }
      }
      full = full.trim();
      if (!full) throw new Error('空响应');
      return full;
    }, onRetry);
  }

  window.AIRelay = { complete, stream, TIERS, RETRY, relay };
})();