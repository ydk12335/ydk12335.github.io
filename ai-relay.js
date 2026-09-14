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
    const { messages, temperature, max_tokens, onRetry, onProgress, tools, tool_choice } = opts || {};
    return relay(async (tier) => {
      const body = { messages, temperature, max_tokens };
      // 透传工具定义（agnes-2.5-flash 支持 function calling，Edge Function 纯透传）
      if (tools && tools.length) body.tools = tools;
      if (tool_choice) body.tool_choice = tool_choice;
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

  /** 流式补全：走 Edge Function 的真实 SSE（stream:true），逐 token 回调 */
  /* 说明：新版 Edge Function 主线路 agnes-2.5-flash 支持真实 SSE 流式，
     会逐 token 下发 delta.reasoning_content（思考过程）与 delta.content（正文）。
     onReason(reasonFull)：思考过程累计全文（用于「已推理 X 字」进度提示）
     onDelta(content, full)：正文增量与累计全文 */
  async function stream(opts) {
    const { messages, temperature, max_tokens, onDelta, onReason, onRetry, tools, tool_choice } = opts || {};
    return relay(async (tier) => {
      const body = { messages, temperature, max_tokens, stream: true };
      if (tools && tools.length) body.tools = tools;
      if (tool_choice) body.tool_choice = tool_choice;
      const res = await tryFetch(tier, body);
      const ct = (res.headers.get('content-type') || '');
      /* 兜底：若上游未按 SSE 返回，则整包 JSON 解析 */
      if (!ct.includes('text/event-stream')) {
        const j = await res.json();
        const msg = (j && j.choices && j.choices[0] && j.choices[0].message) || {};
        const txt = (msg.content || '').trim();
        if (msg.reasoning_content && onReason) onReason(msg.reasoning_content);
        if (!txt) throw new Error('空响应');
        if (onDelta) onDelta(txt, txt);
        return txt;
      }
      const rd = res.body.getReader(), dec = new TextDecoder();
      let buf = '', full = '', reason = '';
      let streamErr = null;   // 记录流中途异常（不立即抛，等读完已收到的内容）
      for (;;) {
        let r;
        try { r = await rd.read(); }
        catch (e) { streamErr = e; break; }   // 读流出错：保留已收到的内容，不丢结果
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const chunk of parts) {
          const line = chunk.trim().replace(/^data:\s*/, '');
          if (!line || line === '[DONE]') continue;
          let ev; try { ev = JSON.parse(line); } catch (e) { continue; }
          const d = ev.choices && ev.choices[0] && ev.choices[0].delta;
          if (!d) continue;
          if (d.reasoning_content) { reason += d.reasoning_content; if (onReason) onReason(reason); }
          if (d.content) { full += d.content; if (onDelta) onDelta(d.content, full); }
        }
      }
      /* 关键修复：只要流式已产出内容，就视为成功返回——
         避免「结果已显示完、流末尾被掐断」时抛错触发重试，
         重试又把已显示的内容覆盖成 loading/中断提示。 */
      if (full.trim()) return full;
      if (streamErr) throw streamErr;
      throw new Error('空响应');
    }, onRetry);
  }

  /**
   * Agent 循环：模型可主动调用工具，前端执行后把结果回填，直到模型产出最终正文。
   * - 每轮非流式（快，模型先决策要不要查记忆）
   * - 若返回 tool_calls → 执行每个工具 → 把结果作为 tool 消息续发 → 下一轮
   * - 最多 maxRounds 轮（默认 4），防止死循环
   * @param {object} opts
   * @param {Array}  opts.messages      对话消息（会复制，不污染原数组）
   * @param {Array}  opts.tools         工具定义（OpenAI 格式）
   * @param {Function} opts.executeTool async (name, args) => string  执行工具，返回结果字符串
   * @param {Function} opts.onTool      每轮工具执行后回调 (name, args, result)，用于 UI 提示
   * @param {number}  opts.maxRounds    最大轮数
   * @returns {Promise<object>} 最终完整响应 { choices, usage }
   */
  async function agent(opts) {
    const { messages, tools, executeTool, onTool, onRetry, maxRounds, temperature, max_tokens } = opts || {};
    if (!Array.isArray(tools) || !tools.length || typeof executeTool !== 'function') {
      // 没工具就当普通 complete 用
      return complete({ messages, temperature, max_tokens, onRetry });
    }
    const rounds = Math.max(1, maxRounds || 4);
    const msgs = (messages || []).slice();
    for (let i = 0; i < rounds; i++) {
      const j = await complete({ messages: msgs, temperature, max_tokens, tools, tool_choice: 'auto', onRetry });
      const msg = j && j.choices && j.choices[0] && j.choices[0].message;
      const calls = (msg && msg.tool_calls) || [];
      if (!calls.length) return j;   // 模型直接回答 → 完成
      // 记录 assistant 的 tool_calls 消息
      msgs.push({ role: 'assistant', content: msg.content || '', tool_calls: calls });
      for (const call of calls) {
        const fn = call.function || {};
        let result = '';
        try {
          const args = JSON.parse(fn.arguments || '{}');
          result = await executeTool(fn.name, args);
        } catch (e) { result = '工具执行失败: ' + (e && e.message || e); }
        if (onTool) { try { onTool(fn.name, JSON.parse(fn.arguments || '{}'), result); } catch (e2) {} }
        msgs.push({ role: 'tool', tool_call_id: call.id, content: String(result).slice(0, 4000) });
      }
    }
    // 超过轮数：返回最后一轮（可能是 tool_calls，调用方自行处理）
    const j = await complete({ messages: msgs, temperature, max_tokens, tools, tool_choice: 'none', onRetry });
    return j;
  }

  window.AIRelay = { complete, stream, agent, TIERS, RETRY, relay };
})();