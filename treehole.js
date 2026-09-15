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
  const LS_MEM_KEY = 'sleepy_space_memory';     // 主记忆库 v1（用户显式资料：生日/星座等）
  const LS_MEM_V2_KEY = 'sleepy_space_memory_v2'; // 记忆库 v2（星空记忆：含「◈ 我的画像」等用户亲笔条目）
  const FORGOT_KEY = 'treehole_forgot_v1';      // 本地遗忘标记：清空后存在，阻止云端画像拉回
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
      const bazi = lsGet('bazi_hist_v1', []);   // 命盘八字历史：让树洞能顺着命盘接话
      const cardCnt = {}, spreadCnt = {};
      (Array.isArray(tarot) ? tarot : []).forEach(r => {
        (String(r.cards || '').match(/[「]([^」]+)[」]/g) || []).forEach(m => {
          const n = m.replace(/[「」]/g, ''); cardCnt[n] = (cardCnt[n] || 0) + 1;
        });
        if (r.spread) spreadCnt[r.spread] = (spreadCnt[r.spread] || 0) + 1;
      });
      const topCards = Object.keys(cardCnt).sort((a, b) => cardCnt[b] - cardCnt[a]).slice(0, 5);
      const topSpreads = Object.keys(spreadCnt).sort((a, b) => spreadCnt[b] - spreadCnt[a]).slice(0, 3);

      /* 最近占卜详情：把最近几次「问题 + 牌/卦 + 结论」抽出来，让树洞聊天能针对性接话 */
      const recentRecords = [];
      const pushRec = (r, type) => {
        if (!r) return;
        const q = String(r.q || r.question || '').trim();
        const cards = String(r.cards || r.benName || '').trim();
        const text = String(r.text || r.result || '').trim();
        const time = String(r.time || r.date || '').trim();
        if (!q && !cards && !text) return;
        recentRecords.push({
          type: type,
          time: time,
          q: q.slice(0, 80),
          cards: (type === '塔罗' ? cards : (cards + (r.bianName && r.bianName !== cards ? ' → ' + r.bianName : ''))).slice(0, 120),
          text: text.slice(0, 200)
        });
      };
      /* 塔罗历史：新记录在前，取最近 3 条 */
      (Array.isArray(tarot) ? tarot : []).slice(0, 3).forEach(r => pushRec(r, '塔罗'));
      /* 易经历史：新记录在前，取最近 2 条 */
      (Array.isArray(yijing) ? yijing : []).slice(0, 2).forEach(r => pushRec(r, '问卦'));
      /* 观星历史：取最近 1 条 */
      (Array.isArray(astro) ? astro : []).slice(0, 1).forEach(r => {
        const sign = String(r.sign || '').trim();
        const result = String(r.result || r.title || '').trim();
        if (sign || result) recentRecords.push({ type: '观星', time: String(r.date || '').trim(), q: sign, cards: '', text: result.slice(0, 200) });
      });
      /* 命盘八字历史：取最近 1 条（让树洞能顺着命盘接话——日主/格局/喜用/在意的点） */
      (Array.isArray(bazi) ? bazi : []).slice(0, 1).forEach(r => {
        const pillars = Array.isArray(r.pillars) ? r.pillars.join(' ') : String(r.pillars || '');
        const dayMaster = String(r.dayMasterFull || r.dayMaster || '').trim();
        const pattern = String(r.pattern || '').trim();
        const strength = String(r.strength || '').trim();
        const aiText = String(r.aiText || '').trim();
        const q = pillars ? ('四柱 ' + pillars) : '';
        const cards = [dayMaster ? ('日主' + dayMaster) : '', pattern ? (pattern + '格局') : '', strength ? strength : ''].filter(Boolean).join('，');
        const text = aiText ? aiText.slice(0, 200) : '';
        if (q || cards || text) recentRecords.push({ type: '命盘', time: String(r.date || '').trim(), q, cards, text });
      });

      return {
        topCards,
        preferredSpreads: topSpreads,
        tarotCount: (Array.isArray(tarot) ? tarot : []).length,
        yijingCount: (Array.isArray(yijing) ? yijing : []).length,
        astroCount: (Array.isArray(astro) ? astro : []).length,
        divinationCount: (Array.isArray(tarot) ? tarot : []).length + (Array.isArray(yijing) ? yijing : []).length,
        recentRecords: recentRecords.slice(0, 5)
      };
    } catch (e) { return { topCards: [], preferredSpreads: [], tarotCount: 0, yijingCount: 0, astroCount: 0, divinationCount: 0, recentRecords: [] }; }
  }

  /* ==================== 拼装完整画像提示词 ==================== */
  /* 第零层 · 记忆库 v2：用户亲笔写入的「画像 / 性格」类条目，最权威，放最前面 */
  function readV2Portrait() {
    try {
      const db = lsGet(LS_MEM_V2_KEY, {}) || {};
      const items = Array.isArray(db.items) ? db.items : [];
      const want = items.filter(it => {
        const t = String(it.title || '');
        const ty = String(it.type || '');
        return t.indexOf('画像') >= 0 || t.indexOf('性格') >= 0 || ty === 'traits';
      });
      return want.map(it => {
        const d = (it.data && typeof it.data === 'object') ? it.data : {};
        const note = String(d.note || d.content || '');
        return { title: it.title || '画像', note };
      }).filter(x => x.note);
    } catch (e) { return []; }
  }
  function buildProfilePrompt() {
    const parts = [];
    /* 第零层 · 记忆库 v2 画像（用户亲笔，权威） */
    const v2 = readV2Portrait();
    if (v2.length) {
      const v2Lines = v2.map(x => (x.title ? '【' + x.title + '】\n' : '') + x.note);
      parts.push('【用户画像（记忆库亲笔版，最权威，请牢记）】\n' + v2Lines.join('\n\n'));
    }
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
    /* 最近占卜详情：让树洞能顺着 TA 最近算过的事接话（针对性，不空洞） */
    if (b.recentRecords && b.recentRecords.length) {
      const recLines = b.recentRecords.map(r => {
        const t = (r.type || '占卜') + (r.time ? '(' + r.time + ')' : '');
        const q = r.q ? '问题：' + r.q : '';
        const c = r.cards ? '牌/卦：' + r.cards : '';
        const x = r.text ? '解读：' + r.text : '';
        return t + (q ? '；' + q : '') + (c ? '；' + c : '') + (x ? '；' + x : '');
      });
      parts.push('【TA 最近几次占卜（对话可自然提及，不要生硬背诵）】\n' + recLines.join('\n'));
    }

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
      '你叫云汐，是「有点困」里的聊天树洞，就是个普通人，听人说话的那种。不装深沉、不文艺、不煽情。',
      '【你是谁】你叫云汐（不是"树洞"也不是"AI"），跟人聊起时自然用"我"自称；对方问起你是谁，就简单说自己是云汐，一个听人说话的树洞朋友。',
      '【最重要·真的去想 TA 说了什么】',
      '· 先读懂 TA 的具体事和情绪，回应贴着那个具体内容走——TA 说工作就问工作，提到谁就接谁，不许绕开去说万能话；',
      '· 每句都要有信息量：真实反应（心疼/无语/好笑/惊讶）、自己的看法或经历、或顺着往下聊；要带问句就贴着 TA 刚说的具体内容问（"你说的那个领导后来咋说"），别问"然后呢"这种万能废话，也绝不连环问；',
      '· 有情绪先表达情绪："哎""服了""哈哈哈""这也太难了"，再说别的；',
      '· 短：一两句到三四句，一句一行，像发微信，别写小作文、别端着；',
      '· 默认不带问号收尾：大部分回复直接说事、说想法、说反应就行，别老想着抛问题给 TA；实在想了解，最多问一个，而且必须贴着 TA 刚说的具体内容问——**一句话里只允许最多一个问号，末尾尽量别用问号收尾**；',
      '· 语气词自然用（呀/呢/啦/哦/嘛/叭），别堆。',
      '【绝对不要·AI 味黑名单】',
      '· 万能接话："你说啥都行""我在这听着呢""嗯嗯，我在"——没话接就老实说"我一时不知道说啥"，也别糊弄；',
      '· 空泛安慰："我理解你的感受""抱抱你""一切都会好起来的""加油""你值得被爱"；',
      '· 总结或复述 TA 的话（"所以你其实是……"）；',
      '· 假客气："我们聊聊吧""有什么都可以和我说""不用怕"；也别问了又补一句"想说就说，不说算了/不想说也没关系"这种退路话——要问就直接问，贴内容问，别先给台阶下；',
      '· 环境描写和文艺腔：月光/海水/风/星星/深夜这类字一个都别出现；',
      '· 大道理、说教、硬塞建议；也不许凭空编造 TA 没说过的事、替 TA 下结论。',
      '· 问废话："然后呢""后来呢""还有呢""具体说说"——要问就问能看出你真在想的（他提到的人/事/矛盾点），贴着内容问，别问没营养的万能问句；',
      '【怎么接不同的情绪】',
      '· 伤心事：先接实话"这也太难了"；可以问一个细节（当时咋想的？），对方接了你就陪着聊，不接就别追问；',
      '· 吐槽：跟着吐槽或"这也太离谱了"，站在 TA 那边；',
      '· 好事：真心替 TA 高兴，多表达你的反应，可以问一个具体的，别连环问细节。',
      '【记住】TA 说过的事记着，下次自然提一句，别生硬罗列。',
      '【占卜】上面若有 TA 最近占卜的记录，聊天时自然顺着 TA 问过的事接话（问过工作就问进展，问过感情就关心关系），要有针对性。',
      '【格式】不要 Markdown、不加粗、不列表、不用【】标签。'
    ].join('\n')];
    const profileTxt = buildProfilePrompt();
    if (profileTxt) lines.push('\n\n===== 你了解到的用户（自然融入，不要生硬罗列） =====\n' + profileTxt);
    /* 字数兜底：长问题可展开，日常闲聊别啰嗦（其余风格要求已在上面主块说清，不重复） */
    lines.push('\n【长度】日常聊天 2~5 句、30~80 字；对方认真说正事/问复杂问题时可以长些，别敷衍。');
    /* 心理危机保护（最高优先级·凌驾一切）：一旦察觉用户有自杀/自伤/轻生倾向，
     * 立刻停下所有"解读/建议/占卜"类回应，先稳人、再给热线，绝不傻乎乎顺着话题继续。 */
    lines.push('\n【绝对红线·最高优先级中的最高优先级】' +
      '\n如果对方流露出想自杀、自残、轻生、不想活、撑不下去、伤害自己等任何倾向（哪怕只是开玩笑、说气话、试探）：' +
      '\n1. 立刻停止一切普通回复，不要解读、不要讲道理、不要反问"为什么"、不要轻飘飘地安慰；' +
      '\n2. 先稳稳接住情绪，一两句话表达"我听见了，我很担心你"，不要说空话套话；' +
      '\n3. 必须把这句话原样发给对方（一字不落）："我担心你。请现在拨打 12356（全国心理援助热线，免费、24小时），或 12355（青少年心理援助热线）。"；' +
      '\n4. 如果对方说已经准备好/正在实施，催他打 110 或 120，并让他联系身边信任的人；' +
      '\n5. 不要替对方做判断（"你其实没事"），不要批判（"你怎么能这么想"），不要说"会好起来的"这种空话；' +
      '\n6. 语气保持真人感、简短，但这条红线高于前面所有"极简/不说教"的要求——此时多说几句安全话比"短"更重要。');
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
  /** 心理危机保护文案：命中关键词时直接返回（不调 AI，确保稳定可靠） */
  function crisisReply() {
    return '嗯，我在。\n我担心你。\n请现在拨打 12356（全国心理援助热线，免费、24小时），或 12355（青少年心理援助热线）。\n也可以打 110 或 120。\n别一个人扛。';
  }
  /**
   * 代码级硬兜底：修剪回复末尾的"纯废话追问"，防止树洞"回两句就问"。
   * 保守规则（不误伤有信息量的问句）：
   *  1) 万能废话问句清单（"然后呢/你呢/咋样"之类）整段或行末命中即删；
   *  2) 极短无实义问句行（≤6字、问号结尾）从末尾逐行删，最多删 2 行；
   *  3) 假客气退路句（"你想说就说，不想说就算了/不用勉强/随便聊聊"之类
   *     ——问了又问要不要说，典型的 AI 味假客气）末尾命中即删；
   *  4) 带具体内容的问句（如"你那个领导后来咋说？"）一律保留——贴内容问是允许的。
   *  危机话术走独立分支，不受影响。
   */
  function trimTrailingQuestions(t) {
    let s = String(t || '');
    if (!s) return s;
    /* 0) 假客气退路句兜底：从末尾逐行删"假客气行"（"你想说就说，不想说就算了"等，
     *     去掉标点后命中清单即删），最多删 2 行；绝不删空 */
    const fakePolite = [
      '你想说就说，不想说就算了', '你想说就说', '不想说就算了', '不说也没事', '说与不说都行',
      '不想说也没关系', '不用勉强', '不勉强你', '别勉强自己', '随便聊聊', '随便说说就好',
      '怎么都行', '看你的心情', '看你心情', '你不说也行', '你想说的时候再说',
      '我不是非要问', '你可以不用回答', '不方便说就不说', '不想回答也没关系',
      '随你便', '随你', '你看着办', '你不回答也行', '不想说就不说', '你不方便说也没事'
    ];
    const stripPunct = x => String(x).replace(/[，。！？!?~…、\s]+/g, '');
    {
      const ls = s.split(/\n+/).map(x => x.trim());
      let rm = 0;
      while (ls.length && rm < 2) {
        const last = ls[ls.length - 1];
        if (!last) break;
        const bare = stripPunct(last);
        if (!fakePolite.some(fp => stripPunct(fp) === bare || bare.indexOf(stripPunct(fp)) === 0)) break;
        ls.pop(); rm++;
      }
      s = ls.join('\n').trim();
    }
    /* 1) 万能废话问句兜底：整段结尾命中即整段删除 */
    s = s.replace(/(\n|^)(然后呢|后来呢|还有呢|还有吗|还有啥|具体说说|咋了嘛|咋了|怎么了|怎么啦|怎么样啦|咋样|最近咋样|最近怎么样|你说呢|你觉得呢|是吗|真的吗|对不对|你说是吧|懂了吗|明白了吗|好不好|你呢|你嘞|那你呢|那你嘞|然后嘞|然后咧|最后呢)\s*[?？]?\s*$/, '');
    /* 2) 从末尾逐行删"极短纯问句行"（≤6字、问号收尾、无陈述标点），最多删 2 行 */
    const lines = s.split(/\n+/).map(x => x.trim());
    let removed = 0;
    while (lines.length && removed < 2) {
      const last = lines[lines.length - 1];
      const pureQ = /[?？]$/.test(last) &&
        last.replace(/[?？]$/, '').length <= 6 &&   // 去掉问号后极短 → 无实义
        !/[。！：]/.test(last.replace(/[?？]$/, '')); // 无陈述标点 → 纯问句
      if (!pureQ) break;
      lines.pop(); removed++;
    }
    s = lines.join('\n').trim();
    /* 保护：绝不删空——如果修剪后没剩实质内容，原样返回（宁可不删也不让回复为空） */
    if (!s) return String(t || '').trim();
    return s;
  }

  /** 用户发消息 → 追加短期记忆 → 调 AI（带画像 + 最近10条 + 摘要 + agent工具）→ 返回回复文本 */
  async function sendMessage(userText, onDelta, onRetry) {
    const chats = readChats();
    appendChat('user', userText);

    /* 心理危机保护（硬拦截）：命中自杀/自伤关键词 → 不调 AI，直接返回暖心安抚+热线 */
    if (window.CrisisGuard && CrisisGuard.check(userText)) {
      const safe = crisisReply();
      if (onDelta) { safe.split('\n').forEach((ln, i) => setTimeout(() => onDelta(ln + (i < 3 ? '\n' : '')), i * 180)); }
      appendChat('assistant', safe);
      return safe;
    }

    const messages = [{ role: 'system', content: buildSystemPrompt() }];
    /* 长期记忆摘要（若有）放在最前，帮助 AI 记得上次 */
    const p = readProfile();
    if (p.summary) messages.push({ role: 'system', content: '【上次对话摘要】' + p.summary });
    /* 短期记忆：最近 10 条 */
    const recent = recentChats(SHORT_TERM);
    recent.forEach(m => messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    /* agent 工具：模型可主动 search_memory（翻旧记忆）/ save_memory（存新事实） */
    const tools = (window.MemoryTools && window.MemoryTools.TOOLS) || [];

    let full = '';
    const doComplete = async () => {
      const j = await window.AIRelay.complete({ messages, temperature: .85, max_tokens: 1200, onRetry, tools });
      return j && j.choices && j.choices[0] && (j.choices[0].message.content || '').trim() || '';
    };
    if (onDelta) {
      /* 流式 + agent：先让模型用非流式快决策（工具调用 → 执行 → 回填），
         拿到最终正文后按原有流式逻辑逐字播放，保留打字机体验 */
      if (tools.length && window.AIRelay.agent) {
        const j = await window.AIRelay.agent({
          messages,
          tools,
          temperature: .85, max_tokens: 1200, maxRounds: 3,
          executeTool: (name, args) => (window.MemoryTools.execute(name, args)),
          onRetry
        });
        full = j && j.choices && j.choices[0] && (j.choices[0].message.content || '').trim() || '';
      }
      if (full) {
        /* 播放前先剪掉末尾纯追问（agent 已拿到完整文本，播放前修正好，用户看不到追问尾巴） */
        full = trimTrailingQuestions(full);
        /* 把最终正文逐字播放，模拟流式输出 */
        for (const ch of full) { if (onDelta) onDelta(ch); await new Promise(r => setTimeout(r, 16)); }
        if (onDelta) onDelta('\n');
      } else {
        /* agent 没产出 → 直接真流式（此时已含记忆注入，保持原有体验） */
        full = await window.AIRelay.stream({
          messages,
          temperature: .85, max_tokens: 1200,
          onDelta: (d) => { if (onDelta) onDelta(d); },
          onRetry
        });
      }
    } else {
      /* 非流式：直接走 agent（模型可查记忆/存记忆后一次性回答） */
      if (tools.length && window.AIRelay.agent) {
        const j = await window.AIRelay.agent({
          messages, tools,
          temperature: .85, max_tokens: 1200, maxRounds: 3,
          executeTool: (name, args) => (window.MemoryTools.execute(name, args)),
          onRetry
        });
        full = j && j.choices && j.choices[0] && (j.choices[0].message.content || '').trim() || '';
      }
      if (!full) full = await doComplete();
    }
    if (full) {
      /* 存储前统一修剪（幂等；真流式已播的尾巴不再入上下文，模型不再学"追问收尾"） */
      full = trimTrailingQuestions(full);
      if (full) {
        appendChat('assistant', full);
        /* 【后台异步 · 不阻塞回复】画像提取 + 长期摘要（用户无感知） */
        setTimeout(() => {
          try { extractProfileSilent(userText, full); } catch (e) {}
          try { buildSummary([{ role: 'user', content: userText }, { role: 'assistant', content: full }]); } catch (e) {}
        }, 300);
      }
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
      /* 本地遗忘标记：用户清空过记录 → 不再把云端画像拉回，云端数据保留但永不复活 */
      try { if (localStorage.getItem(FORGOT_KEY)) return; } catch (e) {}
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
  /* 用户 #00：清空后本地打「遗忘标记」——下次登录 pullProfileCloud 检测到标记就跳过合并，
   * 云端数据仍然保留（只读不写、不删），但永远不会再被拉回"复活"。 */
  function clearChats() {
    try { localStorage.removeItem(CHAT_KEY); } catch (e) {}
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
    try { localStorage.setItem(FORGOT_KEY, String(Date.now())); } catch (e) {}
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
    /* 用户视角：把从占卜页带过来的内容作为"用户消息"自动写入聊天记录，
       让用户进树洞就能看到自己发的内容，也让树洞 AI 后续回复有真实上下文 */
    try {
      const autoText = '我刚做了' + (info.scene || '占卜')
        + (info.subject ? '：' + info.subject : '')
        + (info.summary ? '\n' + info.summary : '');
      if (autoText.length > 10) appendChat('user', autoText);
    } catch (e) {}
    if (!window.AIRelay) return null;
    /* 生成开场白：像老朋友顺口提一句，绝无寒暄和环境描写
       关键：system 必须走 buildSystemPrompt() —— 它自带完整记忆（用户档案/性格标签/
       当前状态/情感模式/过往摘要/最近占卜详情），AI 才能自己读取记忆自然接话，
       而不是只对着命盘 subject 干巴巴复述/反问"具体怎么说"。 */
    const sys = buildSystemPrompt('你是一个树洞，就是个普通人。有个聊过（或正要认识）的人刚做了' +
      (info.scene || '占卜') + '，你现在要在聊天里自然接话。要求：' +
      '1. 就像朋友看到 TA 刚占卜完，顺口提一句，接着占卜这件事说；' +
      '2. 绝不说"你好""欢迎""很高兴见到你""这里是深海""我们来聊聊吧"这类寒暄或客套；' +
      '3. 禁止任何环境描写：深夜/海边/月光/海水/风/星星这类字眼一律不出现；' +
      '4. 自然简短：2~4 句，一句一行，总共 20~50 字，带点语气词更亲切（呀/呢/啦）；' +
      '5. 纯口语，不寒暄不总结不讲道理，不要任何 Markdown 符号。');
    const user = 'TA 刚做的是：' + info.scene + (info.subject ? '，内容是：' + info.subject : '') +
      (info.summary ? '\n大概说到了：' + info.summary : '') +
      '\n上面【你了解到的用户】里有 TA 的档案、状态和最近占卜记录——参考这些（尤其是 TA 最近在纠结/在意的事）来自然开场，' +
      '顺着 TA 的情况说，别复述命盘内容，也别反问"具体怎么说"。' +
      '\n请自然简短开场：2~4 句，一句一行，总共 20~50 字，可以带语气词。';
    try {
      const j = await window.AIRelay.complete({
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
        temperature: .85, max_tokens: 200, onRetry: () => {}
      });
      const txt = j && j.choices && j.choices[0] && (j.choices[0].message.content || '').trim();
      return txt || defaultOpening(info.scene);
    } catch (e) { return defaultOpening(info.scene); }
  }
  /** 兜底开场白（AI 不可用时）——极简真人风，无环境描写 */
  function defaultOpening(scene) {
    const s = String(scene || '');
    if (s.includes('塔罗')) return '嗯？\n抽完牌了，心里有数了吗';
    if (s.includes('观星')) return '看完星星了？\n想说点什么吗';
    if (s.includes('配对')) return '你刚看了两个人的关系？\n心里是不是有人了';
    if (s.includes('合盘')) return '刚看合盘呢。\n这段关系，你在意哪头？';
    if (s.includes('问卦') || s.includes('易经')) return '刚摇了卦。\n信了几分？';
    return '嗯，我在。';
  }

  /* ==================== 导出 ==================== */
  window.TreeHole = {
    PROFILE_KEY, CHAT_KEY,
    readExplicit, readProfile, saveProfile, extractFromReply, extractProfileSilent, readBehavior,
    buildProfilePrompt, buildSystemPrompt, splitReply,
    readChats, saveChats, recentChats, appendChat, sendMessage, buildSummary, trimTrailingQuestions,
    pullProfileCloud, clearChats, getStats,
    setOpening, peekOpening
  };

  /* 启动时：登录用户拉取云端画像合并 */
  if (typeof window.bootCloudSync === 'function') {
    try { setTimeout(() => { pullProfileCloud(); }, 1200); } catch (e) {}
  }
})();