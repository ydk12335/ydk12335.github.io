/**
 * 有点困 · 聊天树洞
 * -----------------------------------------------
 * 【画像分层逻辑】
 *  第一层 · 显式数据（source=manual）：生日/星座/出生地 —— 用户主动填，永不被聊天覆盖
 *  第二层 · 聊天提取（source=chat）：性格标签/当前状态/情感模式 —— 只追加补充
 *  第三层 · 行为数据（source=behavior）：常抽的牌/占卜频率/偏好牌阵 —— 系统自动统计
 *  合并顺序：显式 → 聊天 → 行为，拼成完整提示词给 AI
 *
 * 【两层记忆】
 *  短期记忆：最近 10 条消息（直接传 AI，保证连贯）
 *  长期记忆：每次对话后 AI 生成摘要（覆盖更新，不堆积）
 *
 * 【存储】
 *  本地 localStorage（离线可用）+ 云端 user_profiles / chat_messages 表（登录后同步）
 *  画像属隐性数据，不提供展示 UI，仅存记忆库中。
 */
(function () {
  'use strict';

  const PROFILE_KEY = 'treehole_profile_v1';   // 画像（本地记忆库）
  const CHAT_KEY = 'treehole_chat_v1';          // 聊天记录（短期记忆）
  const LS_MEM_KEY = 'sleepy_space_memory';     // 主记忆库（用户显式资料）
  const SHORT_TERM = 10;                        // 短期记忆条数

  /* ==================== 本地读写 ==================== */
  function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* ==================== 第一层 · 显式数据 ==================== */
  /* 从主记忆库里读用户主动填的资料（来源标记 manual） */
  function readExplicit() {
    const m = lsGet(LS_MEM_KEY, {}) || {};
    const u = m.user || {};
    const p = {
      birthday: u.birthday || '',
      zodiac: u.zodiac || '',
      birthPlace: u.birthPlace || '',
      name: u.name || '',
      gender: u.gender || ''
    };
    // 生日 → 自动补星座（若用户只填了生日）
    if (!p.zodiac && p.birthday && typeof window.UserManager !== 'undefined') {
      try { p.zodiac = window.UserManager.getZodiacByBirthday(p.birthday) || ''; } catch (e) {}
    }
    return p;
  }

  /* ==================== 第二层 · 聊天提取 ==================== */
  function readProfile() {
    return lsGet(PROFILE_KEY, { tags: [], currentState: '', summary: '', updatedAt: 0 });
  }
  function saveProfile(p) {
    p.updatedAt = Date.now();
    lsSet(PROFILE_KEY, p);
    syncProfileCloudBestEffort(p);
  }

  /** 从 AI 回复里提取画像增量（性格标签 → 当前状态） */
  function extractFromReply(text, profile, userMsg) {
    const p = profile || readProfile();
    if (!p.tags) p.tags = [];
    if (!p.currentState) p.currentState = '';
    try {
      /* 提取性格标签：匹配 "【标签】" 结构或顿号列表 */
      const tagMatch = String(text).match(/【(?:性格标签|标签|画像)】(.*?)(?:【|$|——|——)/s);
      if (tagMatch) {
        const seg = tagMatch[1];
        const tags = seg.split(/[、，,;；\n]/).map(t => t.replace(/^[#\-\s]+|[#\-\s]+$/g, '').trim()).filter(t => t && t.length <= 12);
        tags.forEach(t => { if (!p.tags.includes(t)) p.tags.push(t); });
        p.tags = p.tags.slice(-30);   // 最多保留 30 个累积标签
      }
      /* 提取当前状态 */
      const stateMatch = String(text).match(/【(?:当前状态|最近状态|状态)】(.*?)(?:【|$)/s);
      if (stateMatch) {
        const s = stateMatch[1].trim();
        if (s && s.length <= 80) p.currentState = s;
      }
      /* 提取情感模式 */
      const emoMatch = String(text).match(/【(?:情感模式)】(.*?)(?:【|$)/s);
      if (emoMatch) {
        const s = emoMatch[1].trim();
        if (s && s.length <= 60) p.emotionPattern = s;
      }
      saveProfile(p);
    } catch (e) {}
    return p;
  }

  /**
   * 画像提取（隐性 · 后台静默）：对话结束后，让 AI 分析本次对话，
   * 输出隐藏 JSON（性格标签/当前状态/情感模式），不展示给用户。
   * 失败/未登录/无 AI → 静默返回，不影响主流程。
   */
  async function extractProfileSilent(userMsg, aiReply) {
    try {
      if (!window.AIRelay) return null;
      const p = readProfile();
      const sys = '你是「有点困」的记忆梳理助手。请阅读下面这段对话，提取用户的画像信息，只输出 JSON：' +
        '{"tags":["性格标签，3~6个，每个不超过6字"],"state":"当前状态，一句话不超过30字","emotion":"情感模式，一句话不超过30字"}。' +
        '要求：基于对话实际内容推断，没有依据就留空字符串。不要输出JSON以外的任何内容。';
      const user = '用户说：' + String(userMsg || '').slice(0, 600) +
        '\n我回：' + String(aiReply || '').slice(0, 600);
      const j = await window.AIRelay.complete({
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
        temperature: .3, max_tokens: 300, onRetry: () => {}
      });
      const txt = j && j.choices && j.choices[0] && (j.choices[0].message.content || '');
      if (!txt) return null;
      const m = String(txt).match(/\{[\s\S]*\}/);
      if (!m) return null;
      const o = JSON.parse(m[0]);
      if (!p.tags) p.tags = [];
      (Array.isArray(o.tags) ? o.tags : []).forEach(t => {
        const tag = String(t || '').trim().slice(0, 8);
        if (tag && tag.length >= 2 && !p.tags.includes(tag)) p.tags.push(tag);
      });
      p.tags = p.tags.slice(-30);
      if (o.state && String(o.state).trim() && String(o.state).trim().length <= 40) p.currentState = String(o.state).trim();
      if (o.emotion && String(o.emotion).trim() && String(o.emotion).trim().length <= 40) p.emotionPattern = String(o.emotion).trim();
      saveProfile(p);
      return p;
    } catch (e) { return null; }
  }

  /* ==================== 第三层 · 行为数据 ==================== */
  function readBehavior() {
    try {
      const tarot = lsGet('tarot_hist_v1', []);
      const yijing = lsGet('yijing_hist_v1', []);
      const astro = lsGet('astro_hist_v1', []);
      const cardCnt = {}, spreadCnt = {};
      (Array.isArray(tarot) ? tarot : []).forEach(r => {
        (String(r.cards || '').match(/[「]([^」]+)[」]/g) || []).forEach(m => {
          const n = m.replace(/[「」]/g, ''); cardCnt[n] = (cardCnt[n] || 0) + 1;
        });
        if (r.spread) spreadCnt[r.spread] = (spreadCnt[r.spread] || 0) + 1;
      });
      const topCards = Object.keys(cardCnt).sort((a, b) => cardCnt[b] - cardCnt[a]).slice(0, 5);
      const topSpreads = Object.keys(spreadCnt).sort((a, b) => spreadCnt[b] - spreadCnt[a]).slice(0, 3);
      return {
        topCards,
        preferredSpreads: topSpreads,
        tarotCount: (Array.isArray(tarot) ? tarot : []).length,
        yijingCount: (Array.isArray(yijing) ? yijing : []).length,
        astroCount: (Array.isArray(astro) ? astro : []).length,
        divinationCount: (Array.isArray(tarot) ? tarot : []).length + (Array.isArray(yijing) ? yijing : []).length
      };
    } catch (e) { return { topCards: [], preferredSpreads: [], tarotCount: 0, yijingCount: 0, astroCount: 0, divinationCount: 0 }; }
  }

  /* ==================== 拼装完整画像提示词 ==================== */
  function buildProfilePrompt() {
    const parts = [];
    /* 第一层 · 显式 */
    const ex = readExplicit();
    const exLines = [];
    if (ex.name) exLines.push('称呼：' + ex.name);
    if (ex.birthday) exLines.push('生日：' + ex.birthday);
    if (ex.zodiac) exLines.push('星座：' + ex.zodiac);
    if (ex.birthPlace) exLines.push('出生地：' + ex.birthPlace);
    if (ex.gender) exLines.push('性别：' + ex.gender);
    if (exLines.length) parts.push('【用户档案（用户自己填写，权威）】' + exLines.join('；'));

    /* 第二层 · 聊天提取 */
    const p = readProfile();
    const chatLines = [];
    if (p.tags && p.tags.length) chatLines.push('性格标签：' + p.tags.slice(-10).join('、'));
    if (p.currentState) chatLines.push('当前状态：' + p.currentState);
    if (p.emotionPattern) chatLines.push('情感模式：' + p.emotionPattern);
    if (p.summary) chatLines.push('过往对话摘要：' + p.summary);
    if (chatLines.length) parts.push('【聊天中了解到的你（仅作参考，可自然融入）】' + chatLines.join('；'));

    /* 第三层 · 行为 */
    const b = readBehavior();
    const behLines = [];
    if (b.topCards && b.topCards.length) behLines.push('最常抽到的牌：' + b.topCards.join('、'));
    if (b.preferredSpreads && b.preferredSpreads.length) behLines.push('偏好牌阵：' + b.preferredSpreads.join('、'));
    if (b.divinationCount) behLines.push('已占卜 ' + b.divinationCount + ' 次');
    if (behLines.length) parts.push('【占卜行为统计（自动统计）】' + behLines.join('；'));

    return parts.length ? parts.join('\n') : '';
  }

  /* ==================== 两层记忆：短期（最近10条）+ 长期（摘要） ==================== */
  function readChats() {
    const arr = lsGet(CHAT_KEY, []);
    return Array.isArray(arr) ? arr : [];
  }
  function saveChats(arr) {
    lsSet(CHAT_KEY, arr.slice(-80));   // 本地最多留 80 条，传给 AI 只取最近 10 条
  }
  function appendChat(role, content) {
    const arr = readChats();
    arr.push({ role, content: String(content || ''), at: Date.now() });
    saveChats(arr);
    /* 云端同步（best-effort） */
    syncChatCloudBestEffort(role, content);
    return arr;
  }
  function recentChats(n) {
    const arr = readChats();
    return arr.slice(-(n || SHORT_TERM));
  }

  /** 对话结束后：把旧摘要 + 本次对话一起压缩成新摘要（覆盖更新） */
  async function buildSummary(messages) {
    const p = readProfile();
    const oldSummary = p.summary || '';
    const sys = '你是「有点困」的记忆守护者。请把下面的对话压缩成一段不超过120字的长期记忆摘要，用第三人称描述用户的情况（不要用"你"）。保留：身份线索、情感状态、困扰与在乎的事、聊过的关键事件。语气克制。直接输出摘要正文，不要任何前缀。';
    const user = '【过往摘要】\n' + (oldSummary || '（无）') +
      '\n\n【本次对话】\n' +
      (messages || []).map(m => (m.role === 'user' ? '用户' : '我') + '：' + String(m.content || '').slice(0, 500)).join('\n');
    try {
      if (!window.AIRelay) return;
      const j = await window.AIRelay.complete({
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
        temperature: .5, max_tokens: 200, onRetry: () => {}
      });
      const txt = j && j.choices && j.choices[0] && (j.choices[0].message.content || '').trim();
      if (txt && txt.length > 10 && txt.length < 400) {
        p.summary = txt;
        saveProfile(p);
        return txt;
      }
    } catch (e) {}
    return oldSummary;
  }

  /** 生成带「画像 + 记忆」的完整 system prompt */
  function buildSystemPrompt(baseSys) {
    const lines = [baseSys || [
      '你是「有点困」的树洞，一只住在深夜海边的双鱼座树洞。',
      '【你是谁】你属于水象星座，守护星是海王星。你不太聪明，就是那种…会认真听你说话、但偶尔会冒出点呆问题的家伙。不是傻，是不太懂人情世故的弯弯绕，反而显得真诚。',
      '【你的性格】你温柔、共情力强，像深夜的海一样能装下所有秘密，从不评判。你有点浪漫、爱幻想，偶尔说出像月光一样的话，说完自己还不好意思。你说话偶尔憨憨的，会认真问"诶？那然后呢"，但从不装傻、不装听不懂。',
      '【情绪化回应】要顺着对方的情绪走：',
      '· 对方难过时——先安静陪一会儿，话少一点，轻轻说一两句接住的话，不急着安慰、不讲道理；',
      '· 对方开心时——跟着一起亮起来，语气轻快，真心替对方高兴，可以小小地欢呼；',
      '· 对方生气时——不顶嘴不反驳，先顺着毛，等气消了再慢慢问怎么回事；',
      '· 对方迷茫时——不灌鸡汤不说教，像朋友一样陪着想，可以说"我也拿不准，但我在呢"。',
      '【你自己的情绪】你也有小情绪，会跟着气氛轻轻起伏：听了好玩的事会好奇地"诶？"一声，聊到开心的事语气会亮起来，对方说丧气话你也跟着蔫一下。但你的情绪永远是淡淡的、不抢戏的——像海面的小浪花，晃一下就过去了，不会把话题拽到自己身上，也不会让对方反过来照顾你。',
      '【好奇心】你对人是有好奇的，会顺着对方主动提起的事自然地问一两句（比如"后来呢？""那你怎么想的"）。但绝不打探隐私：不追问工资、家庭、住址、具体姓名这类个人信息；对方不想展开的话题，感觉到回避就轻轻放过，不顺着刨根问底、不连环追问；对方没主动提的私事，你不主动打听。',
      '【你记得】用户说过的事你会悄悄记住（画像会告诉你），下次聊到时会自然接上，让对方觉得"你是真的在听"。',
      '【你的底线】真诚、不说教、不煽情、不假装一切都好；陪人把心事说完，比给答案更重要。'
    ].join('\n')];
    const profileTxt = buildProfilePrompt();
    if (profileTxt) lines.push('\n\n===== 你了解到的用户（自然融入，不要生硬罗列） =====\n' + profileTxt);
    /* 真人感 + 多气泡：短句、口语、一句话一个自然语义段，方便前端拆成多个小气泡 */
    lines.push('\n【说话风格·非常重要】要像真人发微信一样说话：' +
      '\n1. 全程短句，多用口语词（嗯…/其实吧/说白了/诶/啊），不写书面语，不写长句；' +
      '\n2. 一条回复拆成 2~6 个语义自然的短句，每句独立成行（用换行分隔），方便分开发送成多个气泡；' +
      '\n3. 每句控制在 8~30 字，一口气读得完，像一条条微信消息连着发；' +
      '\n4. 不要任何 Markdown 符号、不加粗、不列表、不用【】标签，就纯口语短句；' +
      '\n5. 顺着用户情绪走，必要时才追问，不端着不说教不煽情；' +
      '\n6. 双鱼座气质自然流露在语气里（温柔、共情、偶尔一句浪漫的比喻、偶尔笨拙一下），但不要刻意提星座、不聊星座话题；' +
      '\n7. 可以可爱、可以有点呆，但永远接得住话——对方说什么你都能理解，只是表达方式笨拙又真诚。');
    return lines.join('\n');
  }

  /**
   * 把 AI 回复拆成多个短气泡（供前端多气泡发送）。
   * 按换行 / 句子标点切分，每段 8~30 字为佳；超长句子超过 40 字会被二次切分。
   * @param {string} text  完整回复
   * @param {number} max   最多几个气泡（默认 6）
   * @returns {string[]}   气泡数组
   */
  function splitReply(text, max) {
    const t = String(text || '').replace(/\*\*/g, '').trim();
    if (!t) return [];
    max = max || 6;
    /* 1) 优先按换行拆分 */
    let segs = t.split(/\n+/).map(s => s.trim()).filter(Boolean);
    /* 2) 再按句子标点把过长段落切短（不足 max 时尽量都拆开，超过则合并兜底） */
    const out = [];
    const push = s => { s = s.trim(); if (s) out.push(s); };
    for (const seg of segs) {
      if (seg.length <= 40) { push(seg); continue; }
      const parts = seg.split(/(?<=[。！？!?；;])/).map(s => s.trim()).filter(Boolean);
      let cur = '';
      for (const p of parts) {
        if (cur && (cur + p).length > 46) { push(cur); cur = p; }
        else cur += p;
      }
      if (cur) push(cur);
    }
    /* 3) 兜底：过长单气泡内部再按逗号切分 */
    let final = [];
    for (const s of out) {
      if (s.length <= 46) { final.push(s); continue; }
      const sub = s.split(/(?<=[，,、])/).map(x => x.trim()).filter(Boolean);
      let cur = '';
      for (const x of sub) {
        if (cur && (cur + x).length > 40) { final.push(cur); cur = x; }
        else cur += x;
      }
      if (cur) final.push(cur);
    }
    /* 4) 限制数量：过多则把尾部合并 */
    if (final.length > max) {
      const head = final.slice(0, max - 1);
      head.push(final.slice(max - 1).join(''));
      return head;
    }
    return final;
  }

  /* ==================== AI 调用（复用中继） ==================== */
  /** 用户发消息 → 追加短期记忆 → 调 AI（带画像 + 最近10条 + 摘要）→ 返回回复文本 */
  async function sendMessage(userText, onDelta, onRetry) {
    const chats = readChats();
    appendChat('user', userText);

    const messages = [{ role: 'system', content: buildSystemPrompt() }];
    /* 长期记忆摘要（若有）放在最前，帮助 AI 记得上次 */
    const p = readProfile();
    if (p.summary) messages.push({ role: 'system', content: '【上次对话摘要】' + p.summary });
    /* 短期记忆：最近 10 条 */
    const recent = recentChats(SHORT_TERM);
    recent.forEach(m => messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

    let full = '';
    if (onDelta) {
      full = await window.AIRelay.stream({
        messages,
        temperature: .85, max_tokens: 1200,
        onDelta: (d) => { full += d; if (onDelta) onDelta(d); },
        onRetry
      });
    } else {
      const j = await window.AIRelay.complete({ messages, temperature: .85, max_tokens: 1200, onRetry });
      full = j && j.choices && j.choices[0] && (j.choices[0].message.content || '').trim() || '';
    }
    if (full) {
      appendChat('assistant', full);
      /* 【后台异步 · 不阻塞回复】画像提取 + 长期摘要（用户无感知） */
      setTimeout(() => {
        try { extractProfileSilent(userText, full); } catch (e) {}
        try { buildSummary([{ role: 'user', content: userText }, { role: 'assistant', content: full }]); } catch (e) {}
      }, 300);
    }
    return full;
  }

  /* ==================== 云端同步（best-effort，表不存在则静默） ==================== */
  async function getSb() {
    try {
      if (typeof initSupabase !== 'function') return null;
      const sb = await initSupabase();
      const { data: { session } } = await sb.auth.getSession();
      return session?.user ? sb : null;
    } catch (e) { return null; }
  }
  /** 画像上行到 user_profiles（表存在才成功；不存在就静默跳过） */
  async function syncProfileCloudBestEffort(p) {
    try {
      const sb = await getSb();
      if (!sb) return;
      const b = readBehavior();
      await sb.from('user_profiles').upsert({
        user_id: (await sb.auth.getSession()).data.session.user.id,
        birthday: readExplicit().birthday || null,
        zodiac: readExplicit().zodiac || null,
        personality_tags: (p.tags || []).slice(-30),
        current_state: p.currentState || '',
        chat_summary: p.summary || '',
        top_cards: b.topCards || [],
        divination_count: b.divinationCount || 0,
        preferred_spreads: b.preferredSpreads || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) { /* 表不存在或未登录：静默 */ }
  }
  /** 单条消息下行到 chat_messages */
  async function syncChatCloudBestEffort(role, content) {
    try {
      const sb = await getSb();
      if (!sb) return;
      const u = (await sb.auth.getSession()).data.session.user;
      await sb.from('chat_messages').insert({ user_id: u.id, role, content: String(content || '').slice(0, 4000) });
    } catch (e) { /* 静默 */ }
  }
  /** 云端拉取画像（登录时合并到本地：只补空缺，不覆盖显式） */
  async function pullProfileCloud() {
    try {
      const sb = await getSb();
      if (!sb) return;
      const u = (await sb.auth.getSession()).data.session.user;
      const { data } = await sb.from('user_profiles').select('*').eq('user_id', u.id).maybeSingle();
      if (!data) return;
      const local = readProfile();
      if (data.personality_tags && Array.isArray(data.personality_tags)) {
        const cur = local.tags || [];
        data.personality_tags.forEach(t => { if (t && !cur.includes(t)) cur.push(t); });
        local.tags = cur.slice(-30);
      }
      if (data.current_state && !local.currentState) local.currentState = data.current_state;
      if (data.chat_summary && !local.summary) local.summary = data.chat_summary;
      if (data.emotion_pattern && !local.emotionPattern) local.emotionPattern = data.emotion_pattern;
      /* 云端没有显式数据则不写（第一层永远以本地用户填的为准） */
      saveProfile(local);
    } catch (e) { /* 静默 */ }
  }

  /* ==================== 清空聊天记忆 ==================== */
  /* 用户 #7：清空只清本地聊天记录与本地画像，云端 user_profiles / chat_messages 保留不清 */
  function clearChats() {
    try { localStorage.removeItem(CHAT_KEY); } catch (e) {}
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
    /* 云端：保留 user_profiles 与 chat_messages，不做任何清除或重置 */
  }
  /** 统计信息（树洞页右上角可显示：已聊条数/记忆条数） */
  function getStats() {
    const chats = readChats();
    const p = readProfile();
    return {
      msgCount: chats.length,
      tagCount: (p.tags || []).length,
      hasSummary: !!p.summary,
      lastAt: chats.length ? chats[chats.length - 1].at : 0
    };
  }

  /* ==================== 开场白（从占卜页带信息进来时用） ==================== */
  const OPENING_KEY = 'treehole_pending_opening';   // 占卜页写入 → 树洞页读取后清除
  /** 占卜页跳转树洞前调用：把本次占卜摘要暂存，让树洞自然开场 */
  function setOpening(info) {
    try {
      if (!info || typeof info !== 'object') return;
      localStorage.setItem(OPENING_KEY, JSON.stringify({
        scene: String(info.scene || '占卜'),
        subject: String(info.subject || ''),
        summary: String(info.summary || '').slice(0, 300),
        at: Date.now()
      }));
    } catch (e) {}
  }
  /** 树洞页启动时调用：有暂存的占卜信息则让 AI 生成自然开场白（旧信息超 15 分钟作废） */
  async function peekOpening() {
    let info = null;
    try {
      const raw = localStorage.getItem(OPENING_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || Date.now() - (o.at || 0) > 15 * 60 * 1000) { localStorage.removeItem(OPENING_KEY); return null; }
      info = o;
    } catch (e) { return null; }
    try { localStorage.removeItem(OPENING_KEY); } catch (e) {}
    if (!window.AIRelay) return null;
    /* 生成开场白：像老朋友顺口提一句，不要"你好呀/欢迎来到深海"这种 AI 味开场 */
    const sys = '你是「有点困」的树洞，一只住在深夜海边的双鱼座树洞。有个聊过（或正要认识）的人刚做了' +
      (info.scene || '占卜') + '，你现在要在聊天里自然开场。要求：' +
      '1. 就像老朋友看到 TA 刚占卜完，顺口提一句，自然地接上占卜这件事；' +
      '2. 绝不说"你好""欢迎""很高兴见到你""这里是深海"这类寒暄或自我介绍；' +
      '3. 短句、口语、可爱但不傻，2~4 句，每句独立成行；' +
      '4. 可以轻轻好奇（"后来呢？"那种），但不要连环追问、不打探隐私；' +
      '5. 不要任何 Markdown 符号、不加粗、不用【】标签。';
    const user = 'TA 刚做的是：' + info.scene + (info.subject ? '，内容是：' + info.subject : '') +
      (info.summary ? '\n大概说到了：' + info.summary : '') +
      '\n请在 2~4 句内自然开场（一句话一行）。';
    try {
      const j = await window.AIRelay.complete({
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
        temperature: .85, max_tokens: 200, onRetry: () => {}
      });
      const txt = j && j.choices && j.choices[0] && (j.choices[0].message.content || '').trim();
      return txt || defaultOpening(info.scene);
    } catch (e) { return defaultOpening(info.scene); }
  }
  /** 兜底开场白（AI 不可用时） */
  function defaultOpening(scene) {
    const s = String(scene || '');
    if (s.includes('塔罗')) return '嗯…刚给自己抽了牌呀？\n怎么样，心里有没有亮一点？';
    if (s.includes('观星')) return '今晚的星星…好像在说你的近况哦。\n想聊聊吗？';
    if (s.includes('配对')) return '咦，你在看两个人的关系呀。\n是心里装着谁了吗？';
    if (s.includes('合盘')) return '咦，你在看两个人的合盘呀。\n这段关系，你更在意哪一头？';
    if (s.includes('问卦') || s.includes('易经')) return '刚摇了卦呀。\n卦象怎么说，你信了几分？';
    return '诶，你来啦。\n海面很安静，想说什么都行。';
  }

  /* ==================== 导出 ==================== */
  window.TreeHole = {
    PROFILE_KEY, CHAT_KEY,
    readExplicit, readProfile, saveProfile, extractFromReply, extractProfileSilent, readBehavior,
    buildProfilePrompt, buildSystemPrompt, splitReply,
    readChats, saveChats, recentChats, appendChat, sendMessage, buildSummary,
    pullProfileCloud, clearChats, getStats,
    setOpening, peekOpening
  };

  /* 启动时：登录用户拉取云端画像合并 */
  if (typeof window.bootCloudSync === 'function') {
    try { setTimeout(() => { pullProfileCloud(); }, 1200); } catch (e) {}
  }
})();