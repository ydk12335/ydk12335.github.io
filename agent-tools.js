/**
 * 有点困 · Agent 公共工具层
 * ---------------------------------------------------
 * 给全站 AI（塔罗/观星/易经/八字/配对/合盘/树洞）提供统一的「记忆工具」，
 * 让模型能主动：
 *   - search_memory(关键词)：检索记忆库 v2 + 聊天记录，结合画像聊天
 *   - save_memory(标题, 内容)：把新聊到的事实写入记忆库 v2（云端自动同步）
 *   - read_profile()：读取用户画像（v1 显式 + v2 亲笔 + 聊天提取）
 *
 * 依赖：treehole.js 的 TreeHole.buildProfilePrompt（若存在则用它拿画像）。
 * 数据源：sleepy_space_memory_v2（已在 supabase-config 云同步白名单）。
 */
(function () {
  'use strict';

  const LS_MEM_V2_KEY = 'sleepy_space_memory_v2';

  function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* ---------- 记忆库 v2 读写 ---------- */
  function readV2All() {
    try {
      const db = lsGet(LS_MEM_V2_KEY, {}) || {};
      return Array.isArray(db.items) ? db.items : [];
    } catch (e) { return []; }
  }
  function writeV2Item(item) {
    try {
      const db = lsGet(LS_MEM_V2_KEY, {}) || {};
      if (!Array.isArray(db.items)) db.items = [];
      db.items.unshift(Object.assign({
        id: Date.now() + '' + Math.floor(Math.random() * 1000),
        createdAt: Date.now(), source: 'agent'
      }, item));
      lsSet(LS_MEM_V2_KEY, db);   // 云同步白名单 memoryV2 → 自动上传
      return db.items[0];
    } catch (e) { return null; }
  }

  /** 去重：标题或正文与已有记忆太像就跳过 */
  function dupCheck(title, note) {
    const t = String(title || ''), n = String(note || '');
    for (const it of readV2All()) {
      const itT = String(it.title || ''), itN = String((it.data && it.data.note) || '');
      if (t && itT.indexOf(t.slice(0, 8)) >= 0) return true;
      if (n && itN && (itN.indexOf(n.slice(0, 12)) >= 0 || n.indexOf(itN.slice(0, 12)) >= 0)) return true;
    }
    return false;
  }

  /* ---------- 检索 ---------- */
  const STOP = new Set(['一个','什么','怎么','为什么','感觉','觉得','就是','真的','现在','最近','今天','明天','昨天','有点','有些','那个','这个','你们','我们','他们','自己','时候','知道','没有','不是','还是','但是','可是','然后','所以','如果','因为','不过','其实','应该','可以','可能','会','了','的','吧','吗','呢','啊','呀','啦','嘛','我','你','他','她','它','是','在','有','和','跟','对','就','都','也','很','太','好','不','要','想','说','做','看','听']);
  function tokenize(text) {
    const q = String(text || '');
    const chars = q.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').split('');
    const grams = [];
    for (let i = 0; i < chars.length; i++) {
      for (let L = 2; L <= 6; L++) {
        if (i + L > chars.length) break;
        const g = chars.slice(i, i + L).join('');
        if (STOP.has(g) || grams.indexOf(g) >= 0) continue;
        grams.push(g);
      }
    }
    return grams;
  }

  /**
   * 检索记忆库 v2 + 最近聊天记录（treehole_chat_v1）。
   * @param {string} keyword 关键词（可能是一句话，内部自动切词）
   * @param {number} limit   最多返回几条（默认 5）
   * @returns {string} 人类可读的检索结果，无结果时明确说「没找到」
   */
  function searchMemory(keyword, limit) {
    limit = limit || 5;
    const grams = tokenize(keyword);
    if (!grams.length) return '（检索词过短，无法匹配）';
    const hits = [];
    // 记忆库 v2
    readV2All().forEach(it => {
      const d = (it.data && typeof it.data === 'object') ? it.data : {};
      const text = String(it.title || '') + ' ' + String(d.note || d.content || '');
      let score = 0;
      for (const g of grams) { if (text.indexOf(g) >= 0) score += g.length; }
      if (score > 0) hits.push({ score, text: '【' + (it.title || '记忆') + '】' + String(d.note || d.content || '').slice(0, 120) });
    });
    // 聊天记录（最近 40 条）
    try {
      const chats = lsGet('treehole_chat_v1', []) || [];
      if (Array.isArray(chats)) {
        chats.slice(-40).forEach(m => {
          const text = String(m.content || '');
          let score = 0;
          for (const g of grams) { if (text.indexOf(g) >= 0) score += g.length; }
          if (score > 0) hits.push({ score, text: (m.role === 'user' ? '用户说：' : '树洞说：') + text.slice(0, 100) });
        });
      }
    } catch (e) {}
    hits.sort((a, b) => b.score - a.score);
    const top = hits.slice(0, limit).map(h => h.text);
    return top.length ? ('找到相关记忆：\n- ' + top.join('\n- ')) : '（记忆库里没有找到与「' + String(keyword).slice(0, 20) + '」相关的内容）';
  }

  /** 写入一条记忆（AI 主动保存新了解到的事实） */
  function saveMemory(title, note, type) {
    const t = String(title || '').trim().slice(0, 24);
    const n = String(note || '').trim().slice(0, 120);
    if (!t || !n || n.length < 6) return '（信息不完整，未保存）';
    if (dupCheck(t, n)) return '（已有类似记忆，未重复保存）';
    const it = writeV2Item({ type: type || 'story', title: t, data: { title: t, note: n }, createdAt: Date.now() });
    return it ? '已保存记忆：' + t + '｜' + n : '（保存失败）';
  }

  /** 读取用户画像（优先用 treehole 的 buildProfilePrompt，否则读 v2 画像条目） */
  function readProfile() {
    try {
      if (window.TreeHole && typeof window.TreeHole.buildProfilePrompt === 'function') {
        const txt = window.TreeHole.buildProfilePrompt();
        if (txt) return txt.slice(0, 2500);
      }
    } catch (e) {}
    // 兜底：读 v2 里画像/性格类条目
    const items = readV2All().filter(it => {
      const t = String(it.title || '');
      return t.indexOf('画像') >= 0 || t.indexOf('性格') >= 0 || it.type === 'traits';
    });
    if (!items.length) return '（暂无画像）';
    return items.map(it => '【' + (it.title || '画像') + '】' + String((it.data && it.data.note) || '')).join('\n').slice(0, 2500);
  }

  /**
   * 便捷注入（占卜/解读页用）：根据用户本次问题自动检索相关记忆 + 画像，
   * 拼成一段可直接塞进 system prompt 的上下文文本。不需要模型主动 tool call。
   * @param {string} query 用户本次的问题/内容
   * @returns {string} 注入文本（无相关记忆时只含画像，画像也无则返回空串）
   */
  function buildContext(query) {
    const parts = [];
    const profile = readProfile();
    if (profile && profile.indexOf('暂无画像') < 0) parts.push('【用户画像】\n' + profile);
    if (query && String(query).trim()) {
      const hit = searchMemory(String(query).trim(), 3);
      if (hit && hit.indexOf('没有找到') < 0 && hit.indexOf('检索词过短') < 0) parts.push('【与本次相关的过往记忆】\n' + hit);
    }
    return parts.join('\n\n');
  }

  /* ---------- OpenAI 格式工具定义 ---------- */
  const TOOLS = [
    {
      type: 'function',
      function: {
        name: 'search_memory',
        description: '检索用户的历史记忆（记忆库 + 聊天记录），当用户提到以前聊过的事、或你需要结合用户的画像/过往情况来回答时使用。',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string', description: '检索关键词，如"工作""他""妈妈""塔罗"等' }
          },
          required: ['keyword']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'save_memory',
        description: '把用户新说出的、值得长期记住的事实存入记忆库（身份线索、在乎的人或事、反复出现的困扰、明确偏好）。占卜流程话、寒暄不存。',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '不超过12字的标题' },
            note: { type: 'string', description: '一句话事实，不超过50字，第三人称' },
            type: { type: 'string', enum: ['story', 'traits'], description: 'story=故事/经历，traits=性格特征' }
          },
          required: ['title', 'note']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'read_profile',
        description: '读取用户的完整画像（档案、性格、状态、记忆库亲笔画像）。在回复前如需了解"这是个什么样的人"时使用。',
        parameters: { type: 'object', properties: {} }
      }
    }
  ];

  /** 统一的工具执行入口：name + args → 字符串结果 */
  async function execute(name, args) {
    args = args || {};
    switch (name) {
      case 'search_memory': return searchMemory(args.keyword || '', parseInt(args.limit, 10) || 5);
      case 'save_memory': return saveMemory(args.title, args.note, args.type);
      case 'read_profile': return readProfile();
      default: return '（未知工具：' + name + '）';
    }
  }

  window.MemoryTools = { TOOLS, execute, searchMemory, saveMemory, readProfile, buildContext };
})();
