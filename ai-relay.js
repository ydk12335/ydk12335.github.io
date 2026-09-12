/**
 * 有点困 · AI 调用中继（经 Supabase Edge Function 转发，密钥不上前端）
 * -----------------------------------------------
 * 规则：
 *  1. 所有请求统一发往 Supabase Edge Function（sleep-ai-relay）；
 *  2. Edge Function 内部持有真实 AI 密钥（环境变量），并负责主/备线路自动切换；
 *  3. 前端只携带 Supabase 公开的 anon key（设计上可公开，供 JWT 校验）；
 *  4. 请求失败重试 2 次，界面通过 onRetry 显示「正在尝试重连」；
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
  const TIMEOUT = 148000;     // 单次请求超时（覆盖 Edge 最坏链路：主 50s×2 + 备 8s×4+间隔 ≈ 137s，留余量且不超平台 150s）

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
  /* 注意：agnes 主线路不支持真实 SSE 流式（stream:true 直连超时无输出）。
     因此 stream() 内部改走非流式补全拿到完整文本，再按字符分片模拟 onDelta 增量回调。
     对调用方透明（返回完整文本 + onDelta 逐段回调），同时规避主线路流式必挂的问题。 */
  async function stream(opts) {
    const { messages, temperature, max_tokens, onDelta, onRetry } = opts || {};
    // 非流式拿完整结果（progress 模式返回 chat.completion JSON）
    const j = await complete({ messages, temperature, max_tokens, onRetry });
    let txt = '';
    try { txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim(); } catch (e) {}
    if (!txt) throw new Error('空响应');
    // 按小片分发，模拟打字机增量
    if (onDelta) {
      const step = Math.max(8, Math.round(txt.length / 120));
      for (let i = 0; i < txt.length; i += step) {
        onDelta(txt.slice(i, i + step), txt.slice(0, i + step));
      }
    }
    return txt;
  }

  window.AIRelay = { complete, stream, TIERS, RETRY, relay };
})();