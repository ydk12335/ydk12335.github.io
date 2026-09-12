/**
 * 有点困 - AI 个性化解读系统
 * 「让解读越用越准」
 * 三大能力：
 *  1. AI 学习用户历史：解读时注入用户过去 N 次占卜记录，让 AI 能说出"你最近反复抽到月亮"
 *  2. 情绪趋势分析：根据占卜记录生成"本月情绪报告"
 *  3. 个性化建议：结合用户星座 + 历史牌面，给出专属行动建议
 * 挂载：window.Personalize
 */
(function () {
  'use strict';

  const HIST_KEYS = {
    tarot: 'tarot_hist_v1',
    yijing: 'yijing_hist_v1',
    astro: 'astro_hist_v1',
    pair: 'pair_hist_v1',
    syn: 'syn_hist_v1'
  };
  const MEM_KEY = 'sleepy_space_memory';

  /* ==================== 基础工具 ==================== */
  function lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function lsGetRaw(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function getMem() {
    try { return JSON.parse(lsGetRaw(MEM_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function esc(t) {
    const d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML;
  }
  function toYMD(s) {
    if (!s) return '';
    const p = String(s).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!p) return '';
    return p[1] + '-' + String(+p[2]).padStart(2, '0') + '-' + String(+p[3]).padStart(2, '0');
  }
  function nowYMD() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function sameMonth(ymd, base) {
    if (!ymd || !base) return false;
    return ymd.slice(0, 7) === base.slice(0, 7);
  }
  function typeLabel(type) {
    return { tarot: '塔罗占卜', yijing: '易经问卦', astro: '观星', pair: '星座配对', syn: '星座合盘' }[type] || type;
  }

  /* 塔罗牌情绪倾向（-1~1，越高越明亮） */
  const CARD_MOOD = {
    '愚者': 0.6, '魔术师': 0.8, '女祭司': 0.2, '女皇': 0.9, '皇帝': 0.5,
    '教皇': 0.3, '恋人': 0.8, '战车': 0.6, '力量': 0.8, '隐士': 0.1,
    '命运之轮': 0.5, '正义': 0.4, '倒吊人': 0.1, '死神': -0.5, '节制': 0.5,
    '恶魔': -0.4, '高塔': -0.7, '星星': 0.8, '月亮': -0.2, '太阳': 1.0,
    '审判': 0.5, '世界': 0.9,
    '权杖王牌': 0.8, '权杖二': 0.5, '权杖三': 0.7, '权杖四': 0.8, '权杖五': -0.2,
    '权杖六': 0.7, '权杖七': 0.3, '权杖八': 0.7, '权杖九': -0.1, '权杖十': -0.3,
    '圣杯王牌': 0.9, '圣杯二': 0.8, '圣杯三': 0.8, '圣杯四': 0.0, '圣杯五': -0.5,
    '圣杯六': 0.6, '圣杯七': 0.3, '圣杯八': 0.4, '圣杯九': 0.7, '圣杯十': 0.8,
    '宝剑王牌': 0.4, '宝剑二': -0.1, '宝剑三': -0.7, '宝剑四': 0.2, '宝剑五': -0.5,
    '宝剑六': 0.3, '宝剑七': -0.2, '宝剑八': -0.5, '宝剑九': -0.8, '宝剑十': -0.9,
    '星币王牌': 0.6, '星币二': 0.4, '星币三': 0.6, '星币四': 0.1, '星币五': -0.5,
    '星币六': 0.6, '星币七': 0.4, '星币八': 0.6, '星币九': 0.7, '星币十': 0.7
  };

  /* 大阿卡纳专属含义（情绪报告用） */
  const MAJOR_MEANING = {
    '月亮': '迷茫、不安与潜意识浮动的夜晚，你正在看不清前路的阶段',
    '星星': '希望、疗愈与信念，你正处在重新点燃信心的时刻',
    '高塔': '突然的变动与冲击，旧秩序被打破，需要重建',
    '死神': '结束与转化，一段旧篇章正在收尾，为新开始腾出空间',
    '太阳': '明朗、成功与生命力，你正迎来一段光亮的日子',
    '恋人': '关系、选择与吸引，你在感情或重要抉择中',
    '愚者': '新的出发、冒险与未知，你正在开启一段旅程',
    '世界': '完成与圆满，一个阶段即将画上句号',
    '命运之轮': '时运流转，事情正在你无法完全掌控地转动',
    '隐士': '独处、内省与寻找答案，你需要给自己一点安静的时间',
    '倒吊人': '等待、换位与暂停，或许换个角度看事情',
    '节制': '平衡、调和与耐心，你需要慢下来找中间点',
    '恶魔': '执念、束缚与诱惑，有些东西正在困住你',
    '女皇': '滋养、丰盛与感受，你正被温柔地支持着',
    '皇帝': '秩序、掌控与责任，你需要站稳自己的立场',
    '教皇': '传统、指引与信念，你可能在寻求某种确定的答案',
    '女祭司': '直觉、沉默与潜意识，答案藏在安静里',
    '战车': '前进、意志与驾驭，你正努力掌控方向',
    '力量': '温柔而坚定的力量，你在用耐心驯服什么',
    '正义': '公平、因果与抉择，你需要为自己做一次判断',
    '魔术师': '行动力、资源与创造，你拥有把想法变成现实的能力',
    '审判': '觉醒、复盘与重生，是时候回头看看自己走过的路'
  };

  /* ==================== 1. 历史数据注入 ==================== */
  function readRecent(type, n) {
    n = n || 10;
    const arr = lsGet(HIST_KEYS[type] || type, []);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, n).map(r => summarize(type, r)).filter(Boolean);
  }

  function summarize(type, r) {
    if (!r) return null;
    try {
      if (type === 'tarot') {
        return {
          time: r.time || r.date || '',
          q: String(r.q || '').replace(/\s+/g, ' ').slice(0, 40),
          spread: r.spread || '',
          cards: String(r.cards || ''),
          text: String(r.text || '').replace(/\s+/g, ' ').slice(0, 90)
        };
      }
      if (type === 'yijing') {
        return {
          time: (r.date || '') + ' ' + (r.time || ''),
          q: String(r.question || '').replace(/\s+/g, ' ').slice(0, 40),
          gua: r.benName || r.ben || '',
          bian: (r.bianName && r.bianName !== r.benName) ? r.bianName : '',
          text: String(r.result || '').replace(/\s+/g, ' ').slice(0, 90)
        };
      }
      if (type === 'astro') {
        return {
          time: r.date || '',
          sign: r.sign || '',
          text: String(r.result || '').replace(/\s+/g, ' ').slice(0, 90)
        };
      }
      if (type === 'pair') {
        return {
          time: r.date || '',
          ab: (r.a || '') + '×' + (r.b || ''),
          score: r.score || '',
          text: String(r.result || '').replace(/\s+/g, ' ').slice(0, 90)
        };
      }
      if (type === 'syn') {
        return {
          time: r.date || '',
          ab: (r.a || '') + '×' + (r.b || ''),
          rel: r.rel || '',
          text: String(r.result || '').replace(/\s+/g, ' ').slice(0, 90)
        };
      }
      return null;
    } catch (e) { return null; }
  }

  /**
   * 生成历史上下文文本（注入 user prompt）
   * 示例：
   * 【塔罗占卜历史（最近 10 次）】
   * 1. 2026-09-10 三牌阵：正位「月亮」 问：感情
   */
  function buildHistoryContext(type, n) {
    const recs = readRecent(type, n);
    if (!recs.length) return '';
    const lines = [];
    lines.push('【' + typeLabel(type) + '历史（最近 ' + recs.length + ' 次）】');
    recs.forEach((r, i) => {
      const t = (r.time || '').slice(0, 10);
      let brief = '';
      if (type === 'tarot') brief = r.spread + (r.cards ? '：' + r.cards : '');
      else if (type === 'yijing') brief = r.gua + (r.bian ? ' → ' + r.bian : '');
      else if (type === 'astro') brief = r.sign;
      else if (type === 'pair') brief = r.ab + (r.score ? '（契合 ' + r.score + '）' : '');
      else if (type === 'syn') brief = r.ab + (r.rel ? '（' + r.rel + '）' : '');
      lines.push((i + 1) + '. ' + (t ? t + ' ' : '') + brief + (r.q ? '　问：' + r.q : ''));
    });
    return lines.join('\n');
  }

  /* ==================== 2. 情绪趋势分析 ==================== */
  function computeMoodTrend() {
    const tarot = lsGet(HIST_KEYS.tarot, []);
    if (!Array.isArray(tarot)) return null;
    const base = nowYMD();
    const scores = [];
    const cardCnt = {}, majSet = {}, reversed = { count: 0, total: 0 };
    let count = 0;

    tarot.forEach(r => {
      const d = toYMD(r.time) || toYMD(r.date);
      if (!sameMonth(d, base)) return;
      count++;
      const cards = String(r.cards || '').match(/[「]([^」]+)[」]/g) || [];
      const cardsArr = cards.map(m => m.replace(/[「」]/g, ''));
      let recScore = 0, hasScore = false;
      cardsArr.forEach(n => {
        cardCnt[n] = (cardCnt[n] || 0) + 1;
        if (MAJOR_MEANING[n]) majSet[n] = (majSet[n] || 0) + 1;
        if (CARD_MOOD[n] != null) { recScore += CARD_MOOD[n]; hasScore = true; }
      });
      if (String(r.cards || '').includes('逆位')) reversed.count++;
      if (cardsArr.length) reversed.total++;
      if (hasScore) scores.push(recScore / cardsArr.length);
    });

    const topCards = Object.keys(cardCnt).sort((a, b) => cardCnt[b] - cardCnt[a]).slice(0, 5)
      .map(n => ({ name: n, count: cardCnt[n] }));
    const major = Object.keys(majSet).sort((a, b) => majSet[b] - majSet[a]).slice(0, 3)
      .map(n => ({ name: n, count: majSet[n] }));

    let trend = 'flat';
    if (scores.length >= 4) {
      const dated = tarot
        .filter(r => sameMonth(toYMD(r.time) || toYMD(r.date), base))
        .map(r => ({ d: toYMD(r.time) || toYMD(r.date), cards: String(r.cards || '') }))
        .sort((a, b) => a.d.localeCompare(b.d));
      const half = Math.floor(dated.length / 2);
      const scoreOf = (c) => {
        const names = (String(c.cards).match(/[「]([^」]+)[」]/g) || []).map(m => m.replace(/[「」]/g, ''));
        let s = 0, n = 0;
        names.forEach(x => { if (CARD_MOOD[x] != null) { s += CARD_MOOD[x]; n++; } });
        return n ? s / n : 0;
      };
      const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      const diff = avg(dated.slice(half).map(scoreOf)) - avg(dated.slice(0, half).map(scoreOf));
      trend = diff > 0.15 ? 'up' : (diff < -0.15 ? 'down' : 'flat');
    }

    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      month: base.slice(0, 7),
      count, avg: Math.round(avg * 100) / 100, trend,
      topCards, major, reversed
    };
  }

  /* ==================== 3. 个性化建议 ==================== */
  function buildPersonalAdvice() {
    const mem = getMem();
    const user = mem.user || {};
    const zodiac = user.zodiac || '';
    const birthday = user.birthday || '';
    const tarot = lsGet(HIST_KEYS.tarot, []);
    const cardCnt = {};
    (Array.isArray(tarot) ? tarot : []).forEach(r => {
      (String(r.cards || '').match(/[「]([^」]+)[」]/g) || []).forEach(m => {
        const n = m.replace(/[「」]/g, '');
        cardCnt[n] = (cardCnt[n] || 0) + 1;
      });
    });
    const topCards = Object.keys(cardCnt).sort((a, b) => cardCnt[b] - cardCnt[a]).slice(0, 3);
    const total = (Array.isArray(tarot) ? tarot : []).length;
    const seedLines = [];
    if (zodiac) seedLines.push('【求问者星座】' + zodiac);
    if (birthday) seedLines.push('【求问者生日】' + birthday);
    if (total) seedLines.push('【历史抽牌总数】' + total + ' 次');
    if (topCards.length) {
      const meanings = topCards.map(n => n + (MAJOR_MEANING[n] ? '（' + MAJOR_MEANING[n] + '）' : ''));
      seedLines.push('【最常抽到的牌】' + meanings.join('、'));
    }
    return { zodiac, topCards, total, adviceSeed: seedLines.join('\n') };
  }

  /* ==================== 3.5 常问问题分析 ==================== */
  /* 问题类型分类器：把用户问题文本归类为常见领域 */
  const QUESTION_TYPES = [
    { name: '感情', keys: ['感情','爱情','恋爱','喜欢','分手','复合','婚姻','结婚','对象','男朋友','女朋友','暧昧','前任','心动','脱单','相亲','感情线','恋','婚'] },
    { name: '事业', keys: ['事业','工作','职场','升职','跳槽','辞职','创业','老板','同事','面试','offer','项目','职业','晋升','转行','offer','工'] },
    { name: '学业', keys: ['学业','学习','考试','考研','高考','考公','成绩','论文','毕业','学校','复习','上岸','读研','读书','学'] },
    { name: '财运', keys: ['财运','钱','赚钱','收入','投资','理财','生意','负债','加薪','金钱','财','股','基金','买'] },
    { name: '健康', keys: ['健康','身体','病','失眠','睡眠','压力','情绪','焦虑','抑郁','疲惫','累'] },
    { name: '人际', keys: ['朋友','闺蜜','兄弟','人缘','社交','信任','关系','同事','合租','室友'] },
    { name: '家庭', keys: ['家人','父母','家里','家庭','亲子','孩子','爸妈','妈','爸'] }
  ];

  function classifyQuestion(q) {
    if (!q) return '其他';
    const s = String(q);
    for (let i = 0; i < QUESTION_TYPES.length; i++) {
      const t = QUESTION_TYPES[i];
      for (let j = 0; j < t.keys.length; j++) {
        if (s.indexOf(t.keys[j]) >= 0) return t.name;
      }
    }
    return '其他';
  }

  /**
   * 统计常问问题类型（塔罗 + 易经历史）
   * 返回 { top:[{name,count}], total, topTxt }
   */
  function computeTopQuestions(limit) {
    const tarot = lsGet(HIST_KEYS.tarot, []);
    const yijing = lsGet(HIST_KEYS.yijing, []);
    const cnt = {};
    let total = 0;
    (Array.isArray(tarot) ? tarot : []).forEach(r => {
      const c = classifyQuestion(r.q);
      cnt[c] = (cnt[c] || 0) + 1; total++;
    });
    (Array.isArray(yijing) ? yijing : []).forEach(r => {
      const c = classifyQuestion(r.question);
      cnt[c] = (cnt[c] || 0) + 1; total++;
    });
    const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, limit || 3)
      .map(n => ({ name: n, count: cnt[n] }));
    const topTxt = top.map(t => t.name + (t.count > 1 ? '×' + t.count : '')).join('、');
    return { top, total, topTxt };
  }

  /* ==================== 4. 一键生成个性化 prompt 片段 ==================== */
  function buildPersonalizedPrompt(type) {
    const parts = [];
    const mem = getMem();
    const user = mem.user || {};

    const userLines = [];
    if (user.name) userLines.push('称呼：' + user.name);
    if (user.zodiac) userLines.push('星座：' + user.zodiac);
    if (user.birthday) userLines.push('生日：' + user.birthday);
    if (user.gender) userLines.push('性别：' + user.gender);
    if (user.traits) userLines.push('性格：' + user.traits);
    if (userLines.length) parts.push('【求问者档案】' + userLines.join('；'));

    const hist = buildHistoryContext(type, 10);
    if (hist) parts.push(hist);

    const mood = computeMoodTrend();
    const advice = buildPersonalAdvice();
    const obs = [];
    const qa = computeTopQuestions(3);
    if (qa && qa.total >= 3 && qa.top.length) {
      obs.push('你最近常问的方向：' + qa.topTxt + '（共 ' + qa.total + ' 次占卜记录），可以点出他最在意的事');
    }
    if (mood && mood.count >= 3) {
      const month = mood.month.replace('-', '年') + '月';
      obs.push('本月（' + month + '）你已占卜 ' + mood.count + ' 次，情绪指数 ' + mood.avg.toFixed(2) +
        '（-1~1，越高越明亮），趋势：' + (mood.trend === 'up' ? '逐渐向好' : mood.trend === 'down' ? '有所下沉' : '平稳'));
      if (mood.topCards.length) obs.push('本月高频牌：' + mood.topCards.map(c => c.name + '×' + c.count).join('、'));
      if (mood.major.length) obs.push('本月出现的关键大牌：' + mood.major.map(c => c.name + '×' + c.count).join('、'));
      if (mood.reversed.total && mood.reversed.count / mood.reversed.total > 0.5) {
        obs.push('本月逆位牌偏多（' + mood.reversed.count + '/' + mood.reversed.total + '），可能正经历一些反复与内耗');
      }
    }
    if (advice.total >= 5 && advice.topCards.length) {
      obs.push('长期来看你最常抽到：' + advice.topCards.join('、') + '，这可能是你当前生命阶段反复出现的课题');
    }
    if (obs.length) {
      parts.push('【个性化观察（供你自然融入解读，可引用具体次数/牌名）】\n' + obs.join('\n'));
    }

    return parts.length
      ? '\n\n===== 以下为求问者过往数据，请自然融入解读，不要生硬罗列，除非与本次牌面相关 =====\n' + parts.join('\n\n')
      : '';
  }

  /* ==================== 5. 情绪报告 UI ==================== */
  const MOOD_CSS = `
.pz-mask{position:fixed;inset:0;z-index:300;background:rgba(5,3,16,.55);
  backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);
  display:none;align-items:center;justify-content:center;padding:18px;animation:pzFade .28s ease}
@keyframes pzFade{from{opacity:0}to{opacity:1}}
.pz-modal{width:min(380px,94%);max-height:82vh;overflow-y:auto;overscroll-behavior:contain;
  border-radius:26px;padding:24px 20px 20px;text-align:center;
  background:rgba(24,16,44,.94);border:1px solid rgba(240,207,130,.22);
  box-shadow:0 28px 72px rgba(4,2,18,.6), inset 0 1px 0 rgba(255,255,255,.12);
  animation:pzPop .4s cubic-bezier(.16,1,.3,1);color:#f2ede0;font-family:inherit}
@keyframes pzPop{from{opacity:0;transform:scale(.92) translateY(18px)}to{opacity:1;transform:none}}
.pz-modal *{box-sizing:border-box}
.pz-title{font-size:1.02rem;color:#f0cf82;font-weight:600;letter-spacing:.14em;margin-bottom:4px}
.pz-sub{font-size:.68rem;color:rgba(240,207,130,.45);margin-bottom:16px}
.pz-gauge{position:relative;width:150px;height:150px;margin:6px auto 16px}
.pz-gauge svg{transform:rotate(-90deg)}
.pz-gauge .bg{fill:none;stroke:rgba(255,255,255,.08);stroke-width:11}
.pz-gauge .fg{fill:none;stroke-linecap:round;stroke-width:11;transition:stroke-dashoffset 1s ease}
.pz-gauge .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.pz-gauge .num b{font-size:1.7rem;color:#f0cf82;font-weight:600}
.pz-gauge .num span{font-size:.6rem;color:rgba(240,207,130,.5);letter-spacing:.18em}
.pz-row{display:flex;gap:8px;margin-top:14px;text-align:left}
.pz-card{flex:1;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);
  border-radius:14px;padding:10px 12px}
.pz-card b{display:block;font-size:.78rem;color:#f0cf82;margin-bottom:3px}
.pz-card span{font-size:.62rem;color:rgba(240,207,130,.55);line-height:1.6;display:block}
.pz-line{font-size:.72rem;color:rgba(240,207,130,.7);line-height:1.8;margin-top:12px;
  background:rgba(255,255,255,.05);border-radius:12px;padding:10px 12px;text-align:left}
.pz-line em{color:#f0cf82;font-style:normal;font-weight:600}
.pz-ai{font-size:.72rem;color:#e6d9b8;line-height:1.9;margin-top:10px;
  background:linear-gradient(165deg,rgba(255,238,196,.1),rgba(240,207,130,.04));
  border:1px solid rgba(240,207,130,.18);border-radius:12px;padding:12px 13px;text-align:left}
.pz-ai .pz-ai-tag{display:block;font-size:.6rem;color:rgba(240,207,130,.5);letter-spacing:.2em;margin-bottom:5px}
.pz-loading{font-size:.7rem;color:rgba(240,207,130,.5);padding:14px 0}
.pz-foot{margin-top:16px}
.pz-btn{padding:11px 30px;border-radius:999px;border:none;cursor:pointer;font-family:inherit;
  font-size:.76rem;letter-spacing:.12em;color:#fffbef;font-weight:600;
  background:linear-gradient(165deg,rgba(255,238,196,.38),rgba(240,207,130,.16))}
.pz-btn:active{transform:scale(.97)}
`;

  const MOOD_HTML = `
<div class="pz-mask" id="pzMask">
  <div class="pz-modal" id="pzModal">
    <div class="pz-title">☾ 本月情绪报告</div>
    <div class="pz-sub" id="pzMonth"></div>
    <div class="pz-gauge" id="pzGauge"></div>
    <div class="pz-row" id="pzCards"></div>
    <div class="pz-line" id="pzStats"></div>
    <div class="pz-ai" id="pzAI" style="display:none">
      <span class="pz-ai-tag">✦ 星语解读</span><span id="pzAIText"></span>
    </div>
    <div class="pz-loading" id="pzLoading" style="display:none">🌙 星语师正在梳理你本月的情绪脉络…</div>
    <div class="pz-foot"><button class="pz-btn" id="pzClose">收 起</button></div>
  </div>
</div>
`;

  function gaugeSVG(avg) {
    const pct = Math.max(0, Math.min(100, (avg + 1) / 2 * 100));
    const C = 2 * Math.PI * 62;
    const off = C * (1 - pct / 100);
    const hue = 200 - pct * 1.6;
    return '<svg width="150" height="150" viewBox="0 0 150 150">' +
      '<circle class="bg" cx="75" cy="75" r="62"/>' +
      '<circle class="fg" cx="75" cy="75" r="62" stroke="hsl(' + hue + ',65%,60%)" ' +
      'stroke-dasharray="' + C + '" stroke-dashoffset="' + off + '"/>' +
      '</svg>';
  }

  function moodWord(avg) {
    if (avg >= 0.55) return '明亮而丰盈';
    if (avg >= 0.25) return '温和向上';
    if (avg >= -0.1) return '平稳起伏';
    if (avg >= -0.4) return '微微低沉';
    return '灰暗负重';
  }

  /** 打开情绪报告弹窗 */
  function openMoodReport() {
    if (!document.getElementById('pzMask')) {
      const s = document.createElement('style'); s.textContent = MOOD_CSS; document.head.appendChild(s);
      document.body.insertAdjacentHTML('beforeend', MOOD_HTML);
      document.getElementById('pzClose').addEventListener('click', () => { document.getElementById('pzMask').style.display = 'none'; });
      document.getElementById('pzMask').addEventListener('click', e => { if (e.target === document.getElementById('pzMask')) document.getElementById('pzMask').style.display = 'none'; });
    }
    const mask = document.getElementById('pzMask');
    mask.style.display = 'flex';

    const mood = computeMoodTrend();
    if (!mood || mood.count === 0) {
      document.getElementById('pzMonth').textContent = nowYMD().slice(0, 7).replace('-', '年') + '月';
      document.getElementById('pzGauge').innerHTML = '';
      document.getElementById('pzCards').innerHTML = '';
      document.getElementById('pzStats').innerHTML = '这个月还没有占卜记录。<br>去塔罗抽一次牌，下个月就能看到你的情绪星图了 ☾';
      document.getElementById('pzAI').style.display = 'none';
      document.getElementById('pzLoading').style.display = 'none';
      return;
    }

    document.getElementById('pzMonth').textContent = mood.month.replace('-', '年') + '月 · 共 ' + mood.count + ' 次占卜';
    document.getElementById('pzGauge').innerHTML = gaugeSVG(mood.avg);
    const numWrap = document.createElement('div');
    numWrap.className = 'num';
    numWrap.innerHTML = '<b>' + mood.avg.toFixed(2) + '</b><span>' + moodWord(mood.avg) + '</span>';
    document.getElementById('pzGauge').appendChild(numWrap);

    let cardsHTML = '';
    if (mood.topCards.length) {
      cardsHTML += '<div class="pz-card"><b>高频牌</b>' + mood.topCards.map(c => '<span>' + esc(c.name) + ' ×' + c.count + '</span>').join('') + '</div>';
    }
    if (mood.major.length) {
      cardsHTML += '<div class="pz-card"><b>关键大牌</b>' + mood.major.map(c => '<span>' + esc(c.name) + ' ×' + c.count + '</span>').join('') + '</div>';
    }
    if (mood.reversed.total) {
      const rp = Math.round(mood.reversed.count / mood.reversed.total * 100);
      cardsHTML += '<div class="pz-card"><b>逆位占比</b><span>' + mood.reversed.count + '/' + mood.reversed.total + '（' + rp + '%）</span></div>';
    }
    document.getElementById('pzCards').innerHTML = cardsHTML || '<div class="pz-card"><b>本月</b><span>牌面偏中性，情绪波动不大</span></div>';

    const trendTxt = mood.trend === 'up' ? '↑ 上半月到下半月，情绪在回暖' : mood.trend === 'down' ? '↓ 下半月比上半月低沉了些' : '→ 情绪整体平稳';
    const statLines = [];
    if (mood.major.length) {
      statLines.push(mood.major.map(c => {
        const m = MAJOR_MEANING[c.name];
        return '<em>' + esc(c.name) + '</em>：' + (m ? esc(m) : '') + '（' + c.count + '次）';
      }).join('<br>'));
    }
    if (mood.topCards.length) {
      const notMaj = mood.topCards.filter(c => !MAJOR_MEANING[c.name]);
      if (notMaj.length) statLines.push('小牌方面，<em>' + notMaj.map(c => esc(c.name)).join('、') + '</em>反复出现。');
    }
    statLines.push(trendTxt);
    document.getElementById('pzStats').innerHTML = statLines.join('<br>');

    const aiBox = document.getElementById('pzAI'), aiText = document.getElementById('pzAIText');
    const loading = document.getElementById('pzLoading');
    aiBox.style.display = 'none'; loading.style.display = 'block';
    aiText.textContent = '';

    generateMoodText(mood).then(txt => {
      loading.style.display = 'none';
      if (txt) { aiText.textContent = txt; aiBox.style.display = 'block'; }
      else { aiBox.style.display = 'none'; }
    }).catch(() => { loading.style.display = 'none'; aiBox.style.display = 'none'; });
  }

  /** 调 AI 生成情绪报告星语（带降级） */
  async function generateMoodText(mood) {
    const sys = '你是「有点困」的星语师。用户刚生成一份本月情绪报告，请你写一段不超过120字的温柔星语解读：' +
      '点出本月情绪主线、反复出现的牌意味着什么，并给一句克制的建议。说人话、不煽情、不写"愿星光指引你"这类话。直接输出正文。';
    const userData = '本月情绪指数：' + mood.avg + '（-1~1，越高越明亮），趋势：' + mood.trend +
      '\n本月高频牌：' + (mood.topCards.map(c => c.name + '×' + c.count).join('、') || '无') +
      '\n关键大牌：' + (mood.major.map(c => c.name + '（' + (MAJOR_MEANING[c.name] || '') + '）×' + c.count).join('、') || '无') +
      '\n逆位占比：' + mood.reversed.count + '/' + mood.reversed.total +
      '\n本月共占卜：' + mood.count + ' 次';
    try {
      const j = await window.AIRelay.complete({
        temperature: .85, max_tokens: 400,
        messages: [{ role: 'system', content: sys }, { role: 'user', content: userData }],
        onRetry: () => {}
      });
      if (j.choices && j.choices[0]) return (j.choices[0].message.content || '').trim();
      return '';
    } catch (e) { return ''; }
  }

  /* ==================== 导出 ==================== */
  window.Personalize = {
    buildHistoryContext: buildHistoryContext,
    buildPersonalizedPrompt: buildPersonalizedPrompt,
    computeMoodTrend: computeMoodTrend,
    computeTopQuestions: computeTopQuestions,
    buildPersonalAdvice: buildPersonalAdvice,
    openMoodReport: openMoodReport,
    readRecent: readRecent,
    CARD_MOOD: CARD_MOOD,
    MAJOR_MEANING: MAJOR_MEANING
  };
})();
