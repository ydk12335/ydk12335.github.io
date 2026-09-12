/**
 * 有点困 · AI 调用中继（自动切换备用 API）
 * -----------------------------------------------
 * 规则：
 *  1. 每次请求都从【主线路】开始（不记忆上次备用，避免烧备用额度）；
 *  2. 主线路失败重试 5 次，界面通过 onRetry 显示「正在尝试重连」；
 *  3. 主线路 5 次全败才切【备用线路】（仅本次请求），备用同样重试 5 次；
 *  4. 两条线路都失败则抛错，由调用方给出最终错误提示。
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

  const TIERS = [
    { name: '主线路', base: 'https://apihub.agnes-ai.cn/v1', key: 'sk-bnT8gvJweewxMFO2oOnzNof2qpqazpKYq1spx5EulZ11vfyZ', model: 'agnes-3.0-flash' },
    { name: '备用线路', base: 'https://token.sensenova.cn/v1', key: 'sk-q7arlLmUCx1r1gyuK9dyrGgZ987iuyNI', model: 'deepseek-v4-flash' }
  ];
  const RETRY = 5;            // 每条线路内重试次数
  const TIMEOUT = 120000;     // 单次请求超时（与 tarot 原 120s 一致）

  /** 单次 fetch 尝试（自带超时，超时即抛错触发重试） */
  async function tryFetch(tier, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(tier.base + '/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tier.key },
        body: JSON.stringify(Object.assign({ model: tier.model }, body))
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

  /** 非流式补全 */
  async function complete(opts) {
    const { messages, temperature, max_tokens, onRetry } = opts || {};
    return relay(async (tier) => {
      const res = await tryFetch(tier, { messages, temperature, max_tokens });
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