/**
 * 有点困 · 成就光栅卡系统（Holographic Achievement Cards）
 * -----------------------------------------------------------
 * 稀有度：white 普通 / purple 稀有 / gold 传说
 * 交互：3D 双面 · 手动拖动翻转（rotateY 吸附）+ 双击翻面
 * 光效：跟随指针的棱彩光栅（poke-holo 思路）
 *   · white  平淡银反光 + 呼吸光晕（最低级专属）
 *   · purple 顺滑彩虹光栅（随指针流动 + 缓慢色相漂移）
 *   · gold   彩色棱镜光栅 + 旋转彩环 + 粒子 + 开卡爆发（必须彩色 + 动态）
 * 降级：低端机自动进入 lite 模式（关 backdrop-filter / conic-gradient）
 * -----------------------------------------------------------
 * 纯前端，无后端依赖；数据来源与 profile.js 一致（localStorage）。
 */
(function () {
  'use strict';

  /* =========================================================
   * 1. 稀有度配置
   * =======================================================*/
  const RARITY = {
    white:  { label: '普通', tilt: 7,  particles: 0,  vbr: [12] },
    purple: { label: '稀有', tilt: 12, particles: 12, vbr: [16, 40, 16] },
    gold:   { label: '传说', tilt: 18, particles: 26, vbr: [22, 55, 22, 55, 45] }
  };

  /* =========================================================
   * 2. 成就数据（含稀有度字段 + 判定函数）
   * =======================================================*/
  const ACHIEVEMENTS = [
    /* ---------- 白 · 普通 ---------- */
    { id: 'first_tarot', name: '初入星海', icon: '🌙', rarity: 'white',
      desc: '完成第一次塔罗占卜',
      quote: '星海辽阔，你已迈出第一步。',
      check: s => s.tarot >= 1 },

    { id: 'first_yijing', name: '问卦者', icon: '☯', rarity: 'white',
      desc: '完成第一次易经问卦',
      quote: '以心问之，天地自有回应。',
      check: s => s.yj >= 1 },

    { id: 'first_astro', name: '星尘使者', icon: '✨', rarity: 'white',
      desc: '完成第一次今日观星',
      quote: '抬头的人，总会被星光认领。',
      check: s => s.astro >= 1 },

    { id: 'ten_readings', name: '十次占卜', icon: '🎴', rarity: 'white',
      desc: '累计占卜满 10 次',
      quote: '十次叩问，你开始听懂自己的回声。',
      check: s => s.total >= 10 },

    { id: 'three_spreads', name: '牌阵行者', icon: '🧭', rarity: 'white',
      desc: '使用过 3 种不同牌阵',
      quote: '不同的路径，通往同一颗心。',
      check: s => s.spreadKinds >= 3 },

    { id: 'first_pair', name: '星缘初结', icon: '💞', rarity: 'white',
      desc: '完成一次配对或合盘',
      quote: '两颗星靠近时，会有一条线亮起来。',
      check: s => (s.pair + s.syn) >= 1 },

    { id: 'first_fav', name: '拾遗者', icon: '⭐', rarity: 'white',
      desc: '收藏第一条占卜记录',
      quote: '被记住的瞬间，才真正发生过。',
      check: s => s.fav >= 1 },

    /* ---------- 紫 · 稀有 ---------- */
    { id: 'seven_days', name: '七日之约', icon: '🔥', rarity: 'purple',
      desc: '连续 7 天留下占卜足迹',
      quote: '七日不辍，习惯已成星光。',
      check: s => s.streak >= 7 },

    { id: 'hundred', name: '百次占卜', icon: '💯', rarity: 'purple',
      desc: '累计占卜满 100 次',
      quote: '一百次问候，你成了自己的塔罗师。',
      check: s => s.total >= 100 },

    { id: 'half_major', name: '半卷星图', icon: '🃏', rarity: 'purple',
      desc: '集齐 11 张大阿尔卡纳',
      quote: '星图已展半卷，剩下的路仍在招手。',
      check: s => s.majCount >= 11 },

    { id: 'gua_20', name: '卦海拾贝', icon: '🐚', rarity: 'purple',
      desc: '问过 20 个不同卦象',
      quote: '六十四种天气里，你已见过二十种。',
      check: s => s.guaKinds >= 20 },

    { id: 'night_owl', name: '深夜问卜台', icon: '🌌', rarity: 'purple',
      desc: '在凌晨 0-5 点问过卦或抽过牌',
      quote: '夜里三点的心事，也算数。',
      check: s => s.night >= 1 },

    { id: 'astro_20', name: '星轨旅人', icon: '🔭', rarity: 'purple',
      desc: '观星满 20 次',
      quote: '你已记住二十种夜空的脾气。',
      check: s => s.astro >= 20 },

    { id: 'card_30', name: '万花筒', icon: '🌀', rarity: 'purple',
      desc: '累计抽到 30 张不同的塔罗牌',
      quote: '三十张面孔，都是你的一部分。',
      check: s => s.cardKinds >= 30 },

    /* ---------- 金 · 传说 ---------- */
    { id: 'all_major', name: '愚者之旅', icon: '🃏', rarity: 'gold',
      desc: '集齐全部 22 张大阿尔卡纳',
      quote: '从愚者到世界，你走完了整段旅程。',
      check: s => s.majCount >= 22 },

    { id: 'gua_64', name: '六十四卦全图', icon: '☯', rarity: 'gold',
      desc: '集齐全部 64 卦',
      quote: '天地万象，已在你指尖合拢成环。',
      check: s => s.guaKinds >= 64 },

    { id: 'three_hundred', name: '三百次占卜', icon: '👑', rarity: 'gold',
      desc: '累计占卜满 300 次',
      quote: '三百次叩问之后，答案已不必外求。',
      check: s => s.total >= 300 },

    { id: 'thirty_days', name: '一月不辍', icon: '🏆', rarity: 'gold',
      desc: '连续 30 天留下占卜足迹',
      quote: '三十个夜晚，你把自己点成了一盏灯。',
      check: s => s.streak >= 30 },

    /* ---------- 隐藏 · 兑换码 ---------- */
    { id: 'youdiankun', name: '有点困', icon: '😴', rarity: 'gold', hidden: true,
      art: '<svg class="ach-art" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="agMoon" x1="16" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#fff8e0"/><stop offset=".5" stop-color="#f3cf73"/>' +
        '<stop offset="1" stop-color="#b8842c"/></linearGradient></defs>' +
        '<path d="M44 9A22 22 0 1 0 44 55 18 18 0 1 1 44 9Z" fill="url(#agMoon)" fill-opacity=".2"/>' +
        '<path d="M44 9A22 22 0 1 0 44 55 18 18 0 1 1 44 9Z" fill="none" stroke="url(#agMoon)" ' +
        'stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M20.5 33q4.3 4.8 8.6 0" fill="none" stroke="url(#agMoon)" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M20.5 42q4.3 3 8.6 0" fill="none" stroke="url(#agMoon)" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M48.5 13.5l1.45 3.75 3.75 1.45-3.75 1.45-1.45 3.75-1.45-3.75-3.75-1.45 3.75-1.45z" fill="#fff3c9"/>' +
        '<path d="M53.5 32l.95 2.45 2.45.95-2.45.95-.95 2.45-.95-2.45-2.45-.95 2.45-.95z" fill="#fff3c9" fill-opacity=".78"/>' +
        '</svg>',
      desc: '输入兑换码解锁的隐藏成就',
      quote: '星河溺进深海的幻念',
      check: s => s.redeem }
  ];

  const RARE_ORDER = { white: 0, purple: 1, gold: 2 };

  /* =========================================================
   * 3. 工具 & 数据层
   * =======================================================*/
  const $ = (id) => document.getElementById(id);
  const esc = (t) => { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; };
  /** 成就图标：有手绘 SVG 用 SVG，否则用 emoji */
  const iconHtml = (a) => (a && a.art) ? a.art : esc(a ? a.icon : '');
  const arr = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (e) { return []; } };

  const MAJ22 = ['愚者', '魔术师', '女祭司', '女皇', '皇帝', '教皇', '恋人', '战车', '力量', '隐士',
    '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '高塔', '星星', '月亮', '太阳', '审判', '世界'];

  function hourOf(s) { const m = String(s || '').match(/(\d{1,2}):(\d{2})/); return m ? +m[1] : -1; }
  function dayOf(s) {
    if (!s) return '';
    const p = String(s).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    return p ? p[1] + '-' + String(+p[2]).padStart(2, '0') + '-' + String(+p[3]).padStart(2, '0') : '';
  }
  function cardsOf(rec) {
    return (String(rec.cards || '').match(/「([^」]+)」/g) || []).map(x => x.replace(/[「」]/g, ''));
  }

  /** 汇总全部统计量（供成就判定使用） */
  function compute() {
    const tarot = arr('tarot_hist_v1'), yj = arr('yijing_hist_v1'), astro = arr('astro_hist_v1'),
      pair = arr('pair_hist_v1'), syn = arr('syn_hist_v1');

    const cardCnt = {}, cardSet = new Set(), spreadSet = new Set(), guaSet = new Set();
    let night = 0, fav = 0;

    tarot.forEach(r => {
      cardsOf(r).forEach(n => { cardSet.add(n); cardCnt[n] = (cardCnt[n] || 0) + 1; });
      if (r.spread) spreadSet.add(r.spread);
      if (r.fav) fav++;
      const h = hourOf(r.time); if (h >= 0 && h < 5) night++;
    });
    yj.forEach(r => {
      if (r.benName) guaSet.add(r.benName);
      const h = hourOf(r.time); if (h >= 0 && h < 5) night++;
    });

    /* 连续天数 */
    const days = new Set();
    tarot.forEach(r => { const d = dayOf(r.time); if (d) days.add(d); });
    yj.forEach(r => { const d = dayOf(r.date) || dayOf(r.time); if (d) days.add(d); });
    const sorted = [...days].sort();
    let streak = 0, cur = 0, prev = '';
    sorted.forEach(d => {
      if (!prev) cur = 1;
      else cur = (new Date(d) - new Date(prev)) / 86400000 === 1 ? cur + 1 : 1;
      streak = Math.max(streak, cur); prev = d;
    });

    return {
      tarot: tarot.length, yj: yj.length, astro: astro.length,
      pair: pair.length, syn: syn.length,
      total: tarot.length + yj.length,
      spreadKinds: spreadSet.size,
      guaKinds: guaSet.size,
      cardKinds: cardSet.size,
      cardCnt,
      majCount: MAJ22.filter(n => cardCnt[n]).length,
      fav, night, streak, days: days.size,
      redeem: redeemUnlocked()
    };
  }

  /** 判定单个成就是否解锁 */
  function isUnlocked(ach, stats) {
    try { return !!ach.check(stats || compute()); } catch (e) { return false; }
  }

  /** 返回全部成就的实时状态（隐藏成就未解锁时不出现） */
  function list() {
    const s = compute();
    return ACHIEVEMENTS
      .map(a => ({ ...a, unlocked: isUnlocked(a, s) }))
      .filter(a => !a.hidden || a.unlocked);
  }

  /* ---------- 已读记录（NEW 标记） ---------- */
  const SEEN_KEY = 'ach_seen_v1';
  function getSeen() { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch (e) { return []; } }
  function markSeen(id) {
    const s = getSeen(); if (s.indexOf(id) < 0) {
      s.push(id);
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) {}
    }
  }

  /* ---------- 兑换码（隐藏成就） ---------- */
  const REDEEM_KEY = 'ach_redeem_v1';
  const REDEEM_CODE = 'youdiankun1314';
  function redeemUnlocked() { try { return localStorage.getItem(REDEEM_KEY) === '1'; } catch (e) { return false; } }
  function redeem(code) {
    if (String(code == null ? '' : code).trim().toLowerCase() === REDEEM_CODE) {
      try { localStorage.setItem(REDEEM_KEY, '1'); } catch (e) {}
      return true;
    }
    return false;
  }

  /* =========================================================
   * 4. 环境检测 & 降级
   * =======================================================*/
  let LITE = false;
  function detectLite() {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      const c = navigator.hardwareConcurrency || 4;
      if (c <= 4) return true;
      const m = navigator.deviceMemory;
      if (m && m <= 2) return true;
    } catch (e) {}
    return false;
  }
  LITE = detectLite();

  function applyLite() {
    document.documentElement.classList.toggle('ag-lite', LITE);
  }

  /* =========================================================
   * 5. 样式
   * =======================================================*/
  const CSS = `
/* ============ 遮罩 & 舞台 ============ */
.ag-mask{position:fixed;inset:0;z-index:500;display:none;align-items:center;justify-content:center;
  background:radial-gradient(circle at 50% 42%, rgba(22,14,44,.9), rgba(3,2,10,.97));
  perspective:1000px;animation:agFade .3s ease;padding:20px}
.ag-mask.open{display:flex}
@keyframes agFade{from{opacity:0}to{opacity:1}}

.ag-stage{position:relative;display:flex;align-items:center;justify-content:center;
  transform-style:preserve-3d}

/* ============ 卡片本体（3D 双面） ============ */
.ag-card{position:relative;width:min(300px,76vw);aspect-ratio:2.5/3.5;border-radius:20px;
  transform-style:preserve-3d;will-change:transform;
  touch-action:none;user-select:none;-webkit-user-select:none;
  cursor:grab;-webkit-tap-highlight-color:transparent;
  box-shadow:0 30px 70px rgba(0,0,0,.6);
  background:linear-gradient(160deg,#22203a,#141126)}
.ag-card.grabbing{cursor:grabbing}
.ag-card.enter{animation:agPop .72s cubic-bezier(.18,1.5,.4,1) both}
@keyframes agPop{
  0%{opacity:0;transform:perspective(900px) scale(.55) rotateY(-24deg) rotateZ(-6deg)}
  62%{opacity:1;transform:perspective(900px) scale(1.06) rotateY(8deg) rotateZ(1.5deg)}
  100%{opacity:1;transform:perspective(900px) scale(1) rotateY(0) rotateZ(0)}}

/* 双面 */
.ag-face{position:absolute;inset:0;border-radius:20px;overflow:hidden;
  transform-style:preserve-3d;
  -webkit-backface-visibility:hidden;backface-visibility:hidden}
.ag-front{transform:rotateY(0deg)}
.ag-back{transform:rotateY(180deg)}

/* 光栅层：整体 transform 位移（GPU 合成，不重绘、不卡，也不会被边框裁出界限） */
.ag-holo{position:absolute;inset:-34%;pointer-events:none;z-index:1;
  background-repeat:no-repeat;background-size:100% 100%;background-position:center;
  mix-blend-mode:screen;opacity:0;transition:opacity .35s ease;will-change:transform;
  transform:translate3d(var(--hx,0px),var(--hy,0px),0)}
/* 高光眩光：transform 位移跟随指针的反光点 */
.ag-sheen{position:absolute;inset:-46%;pointer-events:none;z-index:3;opacity:.5;
  background:radial-gradient(circle at 50% 50%,
    rgba(255,255,255,.75) 0%, rgba(255,255,255,.12) 26%, rgba(255,255,255,0) 52%);
  mix-blend-mode:screen;transition:opacity .3s;will-change:transform;
  transform:translate3d(var(--gx,0px),var(--gy,0px),0)}
.ag-edge{position:absolute;inset:0;border-radius:20px;pointer-events:none;z-index:4;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.22), inset 0 0 22px rgba(0,0,0,.45)}

/* 内容 */
.ag-inner{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;padding:26px 20px;gap:9px;
  transform:translateZ(18px)}
.ag-icon{font-size:3rem;line-height:1;filter:drop-shadow(0 6px 18px rgba(0,0,0,.5));
  transition:transform .5s cubic-bezier(.18,1.4,.4,1)}
/* 手绘 SVG 成就图标（随字号自适应） */
.ach-art{display:inline-block;width:1em;height:1em;vertical-align:-.14em;overflow:visible}
.ag-icon .ach-art{vertical-align:middle}
.ag-card:hover .ag-icon{transform:translateY(-3px) scale(1.06)}
.ag-rar{font-size:.62rem;letter-spacing:.42em;text-indent:.42em;padding:3px 12px;border-radius:999px;
  border:1px solid currentColor;opacity:.85}
.ag-name{font-size:1.22rem;letter-spacing:.16em;font-weight:600;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.6)}
.ag-desc{font-size:.72rem;line-height:1.6;color:rgba(255,255,255,.72);max-width:200px}
.ag-quote{margin-top:6px;font-family:'STKaiti','KaiTi','Songti SC',serif;font-size:.74rem;line-height:1.7;
  min-height:2.4em;max-width:210px;opacity:0;transform:translateY(6px)}
.ag-card.settled .ag-quote{animation:agQuote 1.5s ease .55s forwards}
@keyframes agQuote{to{opacity:1;transform:none}}

/* ============ 卡背内容 ============ */
.ag-inner-back{justify-content:center;gap:10px;transform:translateZ(14px)}
.ag-bk-rar{font-size:.6rem;letter-spacing:.42em;text-indent:.42em;padding:3px 12px;border-radius:999px;
  border:1px solid currentColor;opacity:.8}
.ag-bk-name{font-size:1.1rem;letter-spacing:.18em;font-weight:600;color:#fff}
.ag-bk-div{width:44px;height:1px;background:currentColor;opacity:.35;margin:2px0}
.ag-bk-desc{font-size:.72rem;line-height:1.65;opacity:.8;max-width:210px}
.ag-bk-quote{font-family:'STKaiti','KaiTi','Songti SC',serif;font-size:.74rem;line-height:1.75;
  max-width:210px;opacity:.9}
.ag-bk-no{position:absolute;left:0;right:0;bottom:16px;text-align:center;
  font-size:.55rem;letter-spacing:.34em;text-indent:.34em;opacity:.42}
.ag-bk-mark{position:absolute;right:14px;top:12px;font-size:.9rem;opacity:.5}

/* ============ 呼吸光晕（现只给最低级 · 普通） ============ */
.ag-halo{position:absolute;inset:-30px;border-radius:36px;pointer-events:none;z-index:-1;opacity:0;
  transition:opacity .6s}
.ag-halo.on{opacity:1;animation:agBreathe 4.2s ease-in-out infinite}
.ag-halo.r-white{background:radial-gradient(circle,rgba(180,200,255,.42),rgba(150,170,225,.12) 46%,rgba(0,0,0,0) 72%);
  filter:blur(22px)}
@keyframes agBreathe{
  0%,100%{transform:scale(.94);opacity:.4}
  50%{transform:scale(1.08);opacity:.85}}

/* ============ 白色 · 安静克制（保留呼吸光晕） ============ */
.ag-card[data-rarity="white"] .ag-face{
  background:linear-gradient(158deg,#2b2c40 0%,#1a1a2b 55%,#12121e 100%)}
.ag-card[data-rarity="white"] .ag-inner-back{color:#e9e6ff}
.ag-card[data-rarity="white"] .ag-holo{opacity:.5;
  background-image:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.7) 47%,
    rgba(190,210,255,.42) 54%,transparent 70%);
  mix-blend-mode:screen}
.ag-card[data-rarity="white"] .ag-sheen{opacity:.28}
.ag-card[data-rarity="white"] .ag-icon{color:#e9e6ff}
.ag-card[data-rarity="white"] .ag-name{color:#f2f0ff}
.ag-card[data-rarity="white"] .ag-rar{color:#cfcbe8}
.ag-card[data-rarity="white"] .ag-quote{color:rgba(226,222,255,.8)}

/* ============ 紫色 · 稀有（顺滑彩虹光栅） ============ */
.ag-card[data-rarity="purple"] .ag-face{
  background:linear-gradient(158deg,#3a2b5c 0%,#241a3d 52%,#160f26 100%)}
.ag-card[data-rarity="purple"] .ag-inner-back{color:#d9c6ff}
.ag-card[data-rarity="purple"] .ag-holo{opacity:.6;
  background-image:linear-gradient(115deg,
    #6a3df0 0%, #b06bff 18%, #ff8ad6 38%, #7fd4ff 58%, #6affc0 76%, #b06bff 100%);
  filter:brightness(1.12) saturate(1.25)}
.ag-card[data-rarity="purple"] .ag-sheen{opacity:.42}
.ag-card[data-rarity="purple"] .ag-icon{color:#d9c6ff;filter:drop-shadow(0 0 16px rgba(160,110,255,.6))}
.ag-card[data-rarity="purple"] .ag-name{color:#efe4ff}
.ag-card[data-rarity="purple"] .ag-rar{color:#c9a7ff}
.ag-card[data-rarity="purple"] .ag-quote{color:rgba(214,190,255,.85)}
.ag-card[data-rarity="purple"] .ag-edge{box-shadow:inset 0 0 0 1px rgba(190,150,255,.4), inset 0 0 26px rgba(80,40,140,.5)}

/* ============ 金色 · 传说（彩色 + 动态） ============ */
.ag-card[data-rarity="gold"]{
  box-shadow:0 30px 70px rgba(0,0,0,.6), 0 0 42px rgba(255,180,80,.22), 0 0 90px rgba(120,160,255,.14)}
.ag-card[data-rarity="gold"] .ag-face{
  background:linear-gradient(158deg,#3a2e14 0%,#2a2110 46%,#17120a 100%)}
.ag-card[data-rarity="gold"] .ag-inner-back{color:#ffe9a6}
.ag-card[data-rarity="gold"] .ag-bk-rar{border-color:rgba(242,208,113,.6);color:#f2d071;
  box-shadow:0 0 14px rgba(242,208,113,.25)}
.ag-card[data-rarity="gold"] .ag-bk-name{
  background:linear-gradient(100deg,#fff4c4,#f2d071,#fffbe8,#d4af37,#fff4c4);
  background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:agFlow 5s linear infinite}
.ag-card[data-rarity="gold"] .ag-bk-quote{color:#f6dd9a;text-shadow:0 0 16px rgba(242,208,113,.35)}
/* 彩色棱镜光栅：跟随指针流动（无延迟动画） */
.ag-card[data-rarity="gold"] .ag-holo{opacity:.78;
  background-image:linear-gradient(115deg,
    #ff5fb0 0%, #ffd36e 15%, #6effb0 32%, #6ec7ff 50%, #b06eff 68%, #ffd36e 84%, #ff5fb0 100%);
  filter:brightness(1.18) saturate(1.35)}
.ag-card[data-rarity="gold"] .ag-sheen{opacity:.5;
  background:radial-gradient(circle at 50% 50%,
    rgba(255,255,240,.9) 0%, rgba(255,240,180,.15) 26%, rgba(255,240,180,0) 52%)}
.ag-card[data-rarity="gold"] .ag-icon{color:#ffe9a6;
  filter:drop-shadow(0 0 22px rgba(240,200,100,.85))}
.ag-card[data-rarity="gold"] .ag-name{
  background:linear-gradient(100deg,#ffe1a8,#ff9a3d,#ffe23d,#5bff9e,#7fd4ff,#c39bff,#ffe1a8);
  background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:agFlow 5s linear infinite;font-weight:700;letter-spacing:.2em}
.ag-card[data-rarity="gold"] .ag-rar{color:#f2d071;border-color:rgba(242,208,113,.6);
  box-shadow:0 0 14px rgba(242,208,113,.25)}
.ag-card[data-rarity="gold"] .ag-desc{color:rgba(255,240,200,.82)}
.ag-card[data-rarity="gold"] .ag-quote{color:#f6dd9a;text-shadow:0 0 16px rgba(242,208,113,.4);font-size:.78rem}
.ag-card[data-rarity="gold"] .ag-edge{
  box-shadow:inset 0 0 0 1px rgba(255,235,170,.6), inset 0 0 36px rgba(120,90,20,.5)}
@keyframes agFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

/* ============ 粒子层（金色） ============ */
.ag-particles{position:absolute;inset:-46px;pointer-events:none;z-index:0;overflow:visible}
.ag-particles i{position:absolute;bottom:-10px;width:3px;height:3px;border-radius:50%;
  background:radial-gradient(circle,#fff6cf,rgba(242,208,113,0));
  box-shadow:0 0 8px rgba(242,208,113,.9);
  animation:agRise linear infinite;opacity:0}
@keyframes agRise{
  0%{opacity:0;transform:translateY(0) translateX(0) scale(.4)}
  12%{opacity:1}
  80%{opacity:.7}
  100%{opacity:0;transform:translateY(-210px) translateX(var(--drift,10px)) scale(1.15)}}

/* ============ Canvas 粒子层（星环粒子 + 无双爆发） ============ */
.ag-fx{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  pointer-events:none;z-index:5;opacity:0;transition:opacity .6s ease;display:block}
.ag-fx.on{opacity:1}

/* ============ ⑤ 开卡爆发 ============ */
.ag-flash{position:fixed;inset:0;pointer-events:none;z-index:520;opacity:0;
  background:radial-gradient(circle at 50% 45%,rgba(255,246,210,.95),rgba(242,208,113,.35) 34%,rgba(0,0,0,0) 68%)}
.ag-flash.fire{animation:agFlash .8s ease-out}
@keyframes agFlash{0%{opacity:0}14%{opacity:.9}100%{opacity:0}}
.ag-burst{position:absolute;inset:0;pointer-events:none;z-index:7;overflow:visible}
.ag-burst i{position:absolute;left:50%;top:50%;width:4px;height:4px;border-radius:50%;
  background:radial-gradient(circle,#fffbe6,rgba(242,208,113,0));
  box-shadow:0 0 10px rgba(255,230,150,.95);
  animation:agBurst .95s cubic-bezier(.15,.7,.3,1) forwards}
@keyframes agBurst{
  0%{opacity:1;transform:translate(-50%,-50%) scale(.3)}
  100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(1.1)}}

/* ============ 关闭 & 提示 ============ */
.ag-close{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);
  z-index:530;background:rgba(255,255,255,.08);border:1px solid rgba(240,207,130,.28);
  color:rgba(240,207,130,.85);font-family:inherit;font-size:.76rem;letter-spacing:.16em;
  padding:10px 26px;border-radius:999px;cursor:pointer;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.ag-close:active{transform:translateX(-50%) scale(.96)}
.ag-hint{position:fixed;left:50%;top:calc(22px + env(safe-area-inset-top,0px));transform:translateX(-50%);
  z-index:530;font-size:.68rem;color:rgba(240,207,130,.5);letter-spacing:.14em;pointer-events:none;
  animation:agFade 1s ease .5s both}

/* ============ 收藏册 ============ */
.ab-mask{position:fixed;inset:0;z-index:480;display:none;overflow-y:auto;overscroll-behavior:contain;
  background:linear-gradient(170deg,rgba(16,10,32,.98),rgba(6,4,14,.99));
  padding:26px 18px 60px}
.ab-mask.open{display:block;animation:agFade .32s ease}
.ab-head{max-width:640px;margin:0 auto 16px;text-align:center}
.ab-title{font-size:1rem;letter-spacing:.34em;color:#f0cf82;font-weight:600;margin:0 0 6px}
.ab-sub{font-size:.7rem;color:rgba(240,207,130,.45);letter-spacing:.1em}
.ab-bar{height:5px;border-radius:99px;background:rgba(255,255,255,.09);margin:12px auto 0;max-width:260px;overflow:hidden}
.ab-bar>i{display:block;height:100%;width:0;border-radius:99px;
  background:linear-gradient(90deg,#f0cf82,#fff3c9,#c9a04c);transition:width .8s cubic-bezier(.2,1,.3,1)}
.ab-redeem{display:flex;gap:8px;justify-content:center;max-width:320px;margin:16px auto 0}
.ab-redeem input{flex:1;min-width:0;font-family:inherit;font-size:.72rem;color:#f2ecd8;
  background:rgba(255,255,255,.06);border:1px solid rgba(240,207,130,.28);border-radius:999px;
  padding:9px 16px;outline:none;-webkit-appearance:none;appearance:none}
.ab-redeem input::placeholder{color:rgba(240,207,130,.4)}
.ab-redeem input:focus{border-color:rgba(240,207,130,.6);background:rgba(255,255,255,.1)}
.ab-redeem button{font-family:inherit;font-size:.72rem;letter-spacing:.18em;color:#1a1408;
  background:linear-gradient(135deg,#f2d071,#fff3c9);border:none;border-radius:999px;
  padding:9px 18px;cursor:pointer;flex:none}
.ab-redeem button:active{transform:scale(.96)}
.ab-filters{display:flex;gap:7px;justify-content:center;margin:16px 0 20px;flex-wrap:wrap}
.ab-chip{font-size:.68rem;padding:6px 15px;border-radius:999px;cursor:pointer;font-family:inherit;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:rgba(240,207,130,.6);
  transition:.22s}
.ab-chip.on{background:rgba(240,207,130,.16);border-color:rgba(240,207,130,.45);color:#f0cf82}
.ab-grid{max-width:680px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:12px}
.ab-card{position:relative;border-radius:15px;padding:16px 10px 13px;text-align:center;cursor:pointer;
  overflow:hidden;isolation:isolate;transform-style:preserve-3d;
  background:linear-gradient(160deg,#232138,#15121f);
  box-shadow:0 10px 26px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.16);
  transition:transform .25s cubic-bezier(.2,1,.3,1),box-shadow .3s;
  animation:agCardIn .5s cubic-bezier(.2,1,.3,1) both}
@keyframes agCardIn{from{opacity:0;transform:translateY(14px) scale(.94)}to{opacity:1;transform:none}}
.ab-card .ab-sheen{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:.35;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.5),rgba(255,255,255,0) 50%)}
.ab-card .ab-holo{position:absolute;inset:-15%;pointer-events:none;z-index:1;opacity:0;
  background-size:300% 300%;mix-blend-mode:screen}
.ab-card .ab-ic{position:relative;z-index:4;font-size:1.6rem;display:block;line-height:1.4}
.ab-card .ab-nm{position:relative;z-index:4;font-size:.72rem;margin-top:5px;letter-spacing:.08em;color:#e8e4ff}
.ab-card .ab-rr{position:relative;z-index:4;font-size:.56rem;margin-top:3px;letter-spacing:.2em}
.ab-card .ab-lock{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;
  font-size:1.3rem;background:rgba(8,6,16,.62);backdrop-filter:blur(2px)}
.ab-card.locked{filter:grayscale(1);opacity:.5;cursor:default}
.ab-card.locked .ab-ic{opacity:.4}
.ab-card.r-white{background:linear-gradient(160deg,#2c2d42,#181828)}
.ab-card.r-white .ab-rr{color:#b9b5d8}
.ab-card.r-purple{background:linear-gradient(160deg,#3b2c5e,#1a1330);
  box-shadow:0 10px 26px rgba(0,0,0,.42), 0 0 0 1px rgba(170,120,255,.28), inset 0 1px 0 rgba(255,255,255,.18)}
.ab-card.r-purple .ab-rr{color:#c9a7ff}
.ab-card.r-purple .ab-holo{opacity:.22;
  background-image:linear-gradient(112deg,#ff5fa8,#8b5cff,#39d0ff,#ff8ae2,#ff5fa8);animation:agFlow 8s linear infinite}
.ab-card.r-gold{background:linear-gradient(160deg,#4b3b1d,#1d1608);
  box-shadow:0 10px 26px rgba(0,0,0,.42), 0 0 0 1px rgba(242,208,113,.42), 0 0 22px rgba(242,208,113,.14),
    inset 0 1px 0 rgba(255,255,255,.22)}
.ab-card.r-gold .ab-rr{color:#f2d071}
.ab-card.r-gold .ab-nm{color:#ffeeb8}
.ab-card.r-gold .ab-holo{opacity:.42;
  background-image:linear-gradient(115deg,#7d6326,#f7e7a8,#d4af37,#fff8cf,#c9a227,#8a6d2f);
  animation:agLiquid 10s linear infinite}
.ab-card.r-gold .ab-ic{filter:drop-shadow(0 0 12px rgba(240,200,100,.85))}
.ab-card.new::after{content:'NEW';position:absolute;top:7px;right:7px;z-index:7;
  font-size:.5rem;letter-spacing:.12em;padding:2px 6px;border-radius:99px;
  background:linear-gradient(135deg,#ff6b9d,#8b5cff);color:#fff;font-weight:700}
.ab-close{position:fixed;right:16px;top:calc(16px + env(safe-area-inset-top,0px));z-index:490;
  width:38px;height:38px;border-radius:50%;border:1px solid rgba(240,207,130,.28);cursor:pointer;
  background:rgba(20,14,36,.7);color:rgba(240,207,130,.8);font-size:1rem;font-family:inherit;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}

/* ============ 低端机降级 ============ */
.ag-lite .ag-mask,.ag-lite .ab-mask,.ag-lite .ag-close,.ag-lite .ab-close{
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important}
.ag-lite .ag-halo{animation:none;opacity:.5;transform:none;
  background:radial-gradient(circle,rgba(180,200,255,.35),rgba(180,200,255,0) 70%)}
.ag-lite .ag-fx{display:none}
.ag-lite .ag-particles{display:none}
.ag-lite .ag-card[data-rarity="gold"] .ag-holo,
.ag-lite .ag-card[data-rarity="purple"] .ag-holo{animation:none}
.ag-lite .ag-card[data-rarity="gold"] .ag-name{animation:none;background-position:50% 50%}
.ag-lite .ab-card.r-purple .ab-holo,.ag-lite .ab-card.r-gold .ab-holo{animation:none;background-position:50% 50%}
.ag-lite .ag-burst{display:none}

/* ============ 徽章入口（profile 用） ============ */
.pf-badge{position:relative;font-family:inherit;cursor:pointer;appearance:none;-webkit-appearance:none;
  -webkit-tap-highlight-color:transparent;text-align:center;color:rgba(240,207,130,.75);
  line-height:1;transition:transform .22s cubic-bezier(.2,1,.3,1),box-shadow .25s,border-color .25s}
.pf-badge:not(.on){opacity:.55}
.pf-badge:active{transform:scale(.94)}
.pf-badge.r-purple.on{border-color:rgba(190,150,255,.45);
  background:linear-gradient(165deg,rgba(200,160,255,.18),rgba(120,80,200,.07));
  box-shadow:0 4px 16px rgba(150,100,255,.16)}
.pf-badge.r-gold.on{border-color:rgba(180,160,255,.42);
  background:linear-gradient(140deg,rgba(120,110,255,.22),rgba(90,70,200,.10) 55%,rgba(255,200,120,.14));
  box-shadow:0 4px 18px rgba(140,120,255,.28)}
.pf-badge.r-gold.on .tx{color:#f2d071}
.pf-badge.justnew::after{content:'';position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;
  background:#ff5fa8;box-shadow:0 0 8px #ff5fa8;animation:agPulse 1.4s ease-in-out infinite}
@keyframes agPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.55}}
.pf-more{float:right;font-size:.64rem;color:rgba(240,207,130,.55);text-decoration:none;letter-spacing:.06em}
.pf-more:active{color:#f0cf82}

/* ============ 小屏 ============ */
@media (max-width:360px){
  .ag-card{width:min(260px,74vw)}
  .ab-grid{grid-template-columns:repeat(auto-fill,minmax(112px,1fr))}
}
@media (prefers-reduced-motion: reduce){
  .ag-card.enter{animation-duration:.01ms}
  .ag-holo,.ag-halo,.ag-icon,.ab-holo{animation:none!important}
  .ag-fx{display:none}
}
`;

  /* =========================================================
   * 6. HTML 骨架
   * =======================================================*/
  const CARD_HTML = `
<div class="ag-mask" id="agMask">
  <div class="ag-stage" id="agStage">
    <div class="ag-halo" id="agHalo"></div>
    <div class="ag-particles" id="agParticles"></div>
    <div class="ag-card" id="agCard" data-rarity="white">
      <!-- 正面 -->
      <div class="ag-face ag-front">
        <div class="ag-holo"></div>
        <div class="ag-sheen"></div>
        <div class="ag-edge"></div>
        <div class="ag-inner">
          <div class="ag-icon" id="agIcon">🌙</div>
          <div class="ag-rar" id="agRar">普通</div>
          <div class="ag-name" id="agName">成就</div>
          <div class="ag-desc" id="agDesc"></div>
          <div class="ag-quote" id="agQuote"></div>
        </div>
      </div>
      <!-- 背面 -->
      <div class="ag-face ag-back">
        <div class="ag-holo"></div>
        <div class="ag-sheen"></div>
        <div class="ag-edge"></div>
        <div class="ag-inner ag-inner-back">
          <div class="ag-bk-mark" id="agBkMark">✦</div>
          <div class="ag-bk-rar" id="agBkRar">普通</div>
          <div class="ag-bk-name" id="agBkName">成就</div>
          <div class="ag-bk-desc" id="agBkDesc"></div>
          <div class="ag-bk-quote" id="agBkQuote"></div>
        </div>
        <div class="ag-bk-no" id="agBkNo"></div>
      </div>
      <canvas class="ag-fx" id="agFx"></canvas>
      <div class="ag-burst" id="agBurst"></div>
    </div>
  </div>
  <div class="ag-hint" id="agHint">拖动翻面 · 倾斜手机看体感</div>
  <button class="ag-close" id="agClose">收 起</button>
</div>
<div class="ag-flash" id="agFlash"></div>`;

  const ALBUM_HTML = `
<div class="ab-mask" id="abMask">
  <button class="ab-close" id="abClose">✕</button>
  <div class="ab-head">
    <h3 class="ab-title">成 就 收 藏 册</h3>
    <div class="ab-sub" id="abSub">已解锁 0 / 0</div>
    <div class="ab-bar"><i id="abBar"></i></div>
    <div class="ab-redeem">
      <input id="abCode" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入兑换码领取隐藏成就" />
      <button id="abRedeem" type="button">兑 换</button>
    </div>
  </div>
  <div class="ab-filters" id="abFilters">
    <button class="ab-chip on" data-f="all">全部</button>
    <button class="ab-chip" data-f="white">普通</button>
    <button class="ab-chip" data-f="purple">稀有</button>
    <button class="ab-chip" data-f="gold">传说</button>
  </div>
  <div class="ab-grid" id="abGrid"></div>
</div>`;

  /* =========================================================
   * 7. 音效 & 震动
   * =======================================================*/
  let _ac = null;
  function chime(rarity) {
    if (LITE) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      _ac = _ac || new AC();
      if (_ac.state === 'suspended') _ac.resume();
      const t0 = _ac.currentTime;
      const master = _ac.createGain();
      master.gain.value = 0.5; master.connect(_ac.destination);

      const sets = rarity === 'gold'
        ? [[1318.5, 0], [1975.5, .05], [2637, .10], [3951.1, .15]]
        : rarity === 'purple'
          ? [[1046.5, 0], [1568, .06], [2093, .12]]
          : [[880, 0], [1318.5, .05]];

      sets.forEach(([f, d]) => {
        const o = _ac.createOscillator(), g = _ac.createGain();
        o.type = rarity === 'gold' ? 'triangle' : 'sine';
        o.frequency.setValueAtTime(f, t0 + d);
        g.gain.setValueAtTime(0.0001, t0 + d);
        g.gain.exponentialRampToValueAtTime(rarity === 'gold' ? .17 : .13, t0 + d + .012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + (rarity === 'gold' ? .62 : .42));
        o.connect(g); g.connect(master);
        o.start(t0 + d); o.stop(t0 + d + .7);
      });

      if (rarity === 'gold') { /* 低频「咔」 */
        const o = _ac.createOscillator(), g = _ac.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(140, t0);
        o.frequency.exponentialRampToValueAtTime(58, t0 + .14);
        g.gain.setValueAtTime(.22, t0);
        g.gain.exponentialRampToValueAtTime(.0001, t0 + .2);
        o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + .22);
      }
    } catch (e) {}
  }
  function buzz(rarity) {
    try {
      if (navigator.vibrate && rarity !== 'white') navigator.vibrate(RARITY[rarity].vbr);
      else if (navigator.vibrate) navigator.vibrate(RARITY[rarity].vbr);
    } catch (e) {}
  }

  /* =========================================================
   * 8. 姿态输入（鼠标 + 陀螺仪）
   * =======================================================*/
  const pose = { tx: 0, ty: 0, px: 0.5, py: 0.5, dx: 0, dy: 0 };  // 目标姿态
  const cur = { x: 0.5, y: 0.5, px: 0, py: 0, tiltX: 0, tiltY: 0 };
  let rafId = null, tiltMax = 6;

  /* ---------- 3D 翻转状态 ---------- */
  let rotY = 0;        // 主旋转（度）：180 的奇偶决定正/反面
  let snapY = 0;       // 吸附目标
  let rotX = 0;        // 俯仰（度）
  let dragging = false;
  let lastInput = 0;   // 最近一次输入时间（用于静止时的微倾）

  /** 归一到 180 的整数倍（0 / ±180 / ±360 …） */
  function normalizeFlip(v) { return Math.round(v / 180) * 180; }
  /** 当前是否正被翻到背面 */
  function isShowingBack() {
    const n = Math.round(rotY / 180);
    return (((n % 2) + 2) % 2) === 1;
  }
  /** 翻面（双击 / 双触） */
  function flipCard() {
    const base = normalizeFlip(rotY);
    snapY = isShowingBack() ? base - 180 : base + 180;
  }

  function loop() {
    /* 高光层平滑：系数调大 → 跟手、不拖影 */
    cur.x += (pose.px - cur.x) * 0.40;
    cur.y += (pose.py - cur.y) * 0.40;
    cur.px += (pose.dx - cur.px) * 0.28;
    cur.py += (pose.dy - cur.py) * 0.28;

    if (!dragging) {
      /* 松手后：惯性投影 → 吸附到正/反面 */
      rotY += (snapY - rotY) * 0.18;
      if (Math.abs(snapY - rotY) < 0.3) rotY = snapY;
      /* 俯仰/侧倾由陀螺仪/鼠标接管 */
      cur.tiltX += (pose.tx - cur.tiltX) * 0.10;
      cur.tiltY += (pose.ty - cur.tiltY) * 0.10;
    } else {
      cur.tiltX = rotX; cur.tiltY = 0;
    }

    const card = $('agCard');
    if (card && $('agMask') && $('agMask').classList.contains('open')) {
      /* 静止时给一点缓慢微倾，一打开就有「活」的立体感 */
      const now = performance.now();
      const idle = !dragging && (now - lastInput > 1500);
      let swX = 0, swY = 0, swBx = 0, swBy = 0;
      if (idle) {
        const t = now * 0.001;
        swX = Math.sin(t * 0.6) * 2.2;
        swY = Math.cos(t * 0.45) * 2.8;
        swBx = Math.sin(t * 0.5) * 6;
        swBy = Math.cos(t * 0.33) * 6;
      }
      const rx = (dragging ? rotX : cur.tiltX + swX);
      const ry = rotY + (dragging ? 0 : cur.tiltY + swY);
      const pfc = Math.min(1, Math.hypot(cur.x - .5, cur.y - .5) * 2);
      const depth = 1 + pfc * 0.02 + (idle ? (Math.sin(now * 0.0008) + 1) * 0.004 : 0);
      card.style.transform =
        'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) +
        'deg) scale(' + depth.toFixed(4) + ')';
      const mx = cur.x * 100, my = cur.y * 100;
      card.style.setProperty('--mx', mx.toFixed(2) + '%');
      card.style.setProperty('--my', my.toFixed(2) + '%');
      /* 光栅流动：指针位移 + 恒定缓慢漂移 → 卡面始终有流光 */
      const idleK = idle ? 1 : 0.3;
      const hx = (cur.x - .5) * -54 + swBx * 1.7 * idleK + Math.sin(now * 0.00042) * 11;
      const hy = (cur.y - .5) * -54 + swBy * 1.7 * idleK + Math.cos(now * 0.00033) * 13;
      card.style.setProperty('--hx', hx.toFixed(2) + 'px');
      card.style.setProperty('--hy', hy.toFixed(2) + 'px');
      /* 高光点：跟手位移 */
      const gx = (cur.x - .5) * -78 + Math.sin(now * 0.0005) * 7;
      const gy = (cur.y - .5) * -78 + Math.cos(now * 0.0004) * 8;
      card.style.setProperty('--gx', gx.toFixed(2) + 'px');
      card.style.setProperty('--gy', gy.toFixed(2) + 'px');
      card.style.setProperty('--pfc', pfc.toFixed(3));
    }
    /* 收藏册里的卡也随陀螺仪流动 */
    const ab = $('abMask');
    if (ab && ab.classList.contains('open')) {
      const cx = (50 + (cur.x - .5) * 90).toFixed(1) + '%';
      const cy = (50 + (cur.y - .5) * 90).toFixed(1) + '%';
      ab.querySelectorAll('.ab-card').forEach(c => {
        c.style.setProperty('--mx', cx); c.style.setProperty('--my', cy);
      });
    }
    rafId = requestAnimationFrame(loop);
  }
  function startLoop() { if (!rafId) rafId = requestAnimationFrame(loop); }
  function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  function pointerMove(e) {
    const card = $('agCard');
    if (!card) return;
    lastInput = performance.now();
    const r = card.getBoundingClientRect();
    let px = (e.clientX - r.left) / r.width;
    let py = (e.clientY - r.top) / r.height;
    pose.px = Math.min(1, Math.max(0, px));
    pose.py = Math.min(1, Math.max(0, py));
    pose.ty = (pose.px - .5) * 2 * tiltMax;
    pose.tx = (pose.py - .5) * 2 * tiltMax;
    pose.dx = (pose.px - .5) * -18;
    pose.dy = (pose.py - .5) * -18;
  }

  /* ---------- 陀螺仪 ---------- */
  let gyroReady = false, gyroBound = false;
  function bindGyro() {
    if (gyroBound) return;
    gyroBound = true;
    window.addEventListener('deviceorientation', onOrient);
  }
  function onOrient(e) {
    const g = e.gamma == null ? 0 : e.gamma;          // 左右倾斜 -90..90
    const b = e.beta == null ? 0 : e.beta;            // 前后倾斜
    const gx = Math.max(-26, Math.min(26, g)) / 26;    // 归一化
    const bx = Math.max(-34, Math.min(34, b - 38)) / 34;
    pose.px = Math.min(1, Math.max(0, .5 + gx * .5));
    pose.py = Math.min(1, Math.max(0, .5 + bx * .5));
    pose.ty = gx * tiltMax * 1.25;
    pose.tx = bx * tiltMax;
    pose.dx = -gx * 20;
    pose.dy = -bx * 20;
    lastInput = performance.now();
    gyroReady = true;
  }
  /** 请求体感权限（iOS 13+ 必须由用户手势触发） */
  function requestGyro() {
    try {
      if (typeof DeviceOrientationEvent === 'undefined') return Promise.resolve(false);
      const req = DeviceOrientationEvent.requestPermission;
      if (typeof req === 'function') {
        return req.call(DeviceOrientationEvent).then(st => {
          if (st === 'granted') { bindGyro(); toast('体感已开启 ✦'); return true; }
          return false;
        }).catch(() => false);
      }
      bindGyro();
    } catch (e) {}
    return Promise.resolve(false);
  }

  /* =========================================================
   * 9. 粒子系统
   * =======================================================*/
  function spawnFloaters(box, n) {
    if (LITE || !box) { if (box) box.innerHTML = ''; return; }
    let html = '';
    for (let i = 0; i < n; i++) {
      const left = (Math.random() * 104 - 2).toFixed(1);
      const dur = (5 + Math.random() * 6).toFixed(2);
      const delay = (Math.random() * 6).toFixed(2);
      const drift = (Math.random() * 40 - 20).toFixed(0);
      const size = (2 + Math.random() * 2.2).toFixed(1);
      html += '<i style="left:' + left + '%;--drift:' + drift + 'px;width:' + size + 'px;height:' + size +
        'px;animation-duration:' + dur + 's;animation-delay:-' + delay + 's"></i>';
    }
    box.innerHTML = html;
  }
  function spawnBurst(box, n) {
    if (LITE || !box) return;
    let html = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * .3;
      const dist = 90 + Math.random() * 130;
      const tx = Math.cos(a) * dist, ty = Math.sin(a) * dist;
      html += '<i style="--tx:' + tx.toFixed(0) + 'px;--ty:' + ty.toFixed(0) + 'px;animation-delay:' +
        (Math.random() * .08).toFixed(2) + 's"></i>';
    }
    box.innerHTML = html;
    setTimeout(() => { box.innerHTML = ''; }, 1300);
  }

  /* ---------------------------------------------------------
   * Canvas 粒子：传说「星环」+ 可触碰「无双」爆发
   * -------------------------------------------------------*/
  const FX = { canvas: null, ctx: null, raf: 0, w: 0, h: 0, dpr: 1,
    running: false, on: false, rings: [], burst: [], sprites: {}, last: 0,
    px: null, py: null, pLast: 0 };

  /** 预渲染柔光粒子贴图（金/白两种），避免每帧 createRadialGradient 的开销 */
  function fxSprite(kind) {
    if (FX.sprites[kind]) return FX.sprites[kind];
    const s = 48, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(s * .5, s * .5, 0, s * .5, s * .5, s * .5);
    if (kind === 'w') {
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(.25, 'rgba(232,240,255,.85)');
      rg.addColorStop(.6, 'rgba(180,205,255,.3)');
      rg.addColorStop(1, 'rgba(180,205,255,0)');
    } else {
      rg.addColorStop(0, 'rgba(255,252,235,1)');
      rg.addColorStop(.22, 'rgba(255,235,170,.95)');
      rg.addColorStop(.55, 'rgba(242,208,113,.4)');
      rg.addColorStop(1, 'rgba(242,208,113,0)');
    }
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
    FX.sprites[kind] = c;
    return c;
  }

  /** 初始化画布尺寸 + 构建多层「斜置星环」粒子 */
  function fxInit() {
    const card = $('agCard'), cv = $('agFx');
    if (!card || !cv) return false;
    const cw = card.offsetWidth || 260, ch = card.offsetHeight || 364;
    const w = Math.round(cw * 1.95), h = Math.round(ch * 1.7);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    FX.w = w; FX.h = h; FX.dpr = dpr;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    FX.canvas = cv; FX.ctx = cv.getContext('2d');
    FX.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* 三层不同倾角的星环 → 叠出「斜着转」的立体感 */
    const cfg = [
      { rx: w * .40, ry: w * .112, tilt: -0.42, spd: 0.16, n: 52, size: 1.00, kind: 'g' },
      { rx: w * .325, ry: w * .092, tilt: 0.55, spd: -0.10, n: 40, size: 0.82, kind: 'g' },
      { rx: w * .47, ry: w * .140, tilt: 0.16, spd: 0.06, n: 30, size: 0.62, kind: 'w' }
    ];
    FX.rings = [];
    if (!LITE) cfg.forEach(c => {
      for (let i = 0; i < c.n; i++) {
        FX.rings.push({
          c, a: (i / c.n) * Math.PI * 2 + Math.random() * .05,
          r: (1.3 + Math.random() * 2.6) * c.size,
          spd: c.spd * (0.85 + Math.random() * 0.3),
          ph: Math.random() * Math.PI * 2,          // 闪烁相位
          tw: .45 + Math.random() * 1.0,
          ox: 0, oy: 0, vx: 0, vy: 0                // 搅动偏移 / 速度（会被指针拨动）
        });
      }
    });
    return true;
  }

  /** 在指针位置炸出一簇无双粒子 */
  function fxBurstAt(clientX, clientY, n) {
    if (!FX.on || !FX.canvas) return;
    const r = FX.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.max(0, Math.min(FX.w, (clientX - r.left) * (FX.w / r.width)));
    const y = Math.max(0, Math.min(FX.h, (clientY - r.top) * (FX.h / r.height)));
    /* 记录指针：星环粒子会被它拨动（可搅动） */
    FX.px = x; FX.py = y; FX.pLast = performance.now();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 70 + Math.random() * 340;
      FX.burst.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50,
        life: 0, max: .4 + Math.random() * .7,
        size: 5 + Math.random() * 20,
        kind: Math.random() < .28 ? 'w' : 'g'
      });
    }
    if (FX.burst.length > 300) FX.burst.splice(0, FX.burst.length - 300);
  }

  function fxFrame(now) {
    if (!FX.running || !FX.ctx) return;
    const ctx = FX.ctx, w = FX.w, h = FX.h, cx = w * .5, cy = h * .5;
    const dt = Math.min(.05, (now - FX.last) / 1000 || .016);
    FX.last = now;
    const t = now * .001;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const spr = fxSprite('g');

    /* 多层斜置星环：椭圆轨道 + 固定倾角；指针划过会把粒子「拨散」再弹回 */
    const stirring = FX.px != null && (now - FX.pLast) < 260;
    for (let i = 0; i < FX.rings.length; i++) {
      const p = FX.rings[i], c = p.c;
      const a = p.a + t * p.spd;
      const ex = Math.cos(a) * c.rx, ey = Math.sin(a) * c.ry;
      const ct = Math.cos(c.tilt), st = Math.sin(c.tilt);
      let x = cx + ex * ct - ey * st;
      let y = cy + ex * st + ey * ct;
      if (stirring) {
        const dx = x - FX.px, dy = y - FX.py, d2 = dx * dx + dy * dy, RR = 74;
        if (d2 < RR * RR && d2 > .01) {
          const d = Math.sqrt(d2), f = 1 - d / RR;
          p.vx += (dx / d) * f * 3.2 + (Math.random() - .5) * f * 1.4;
          p.vy += (dy / d) * f * 3.2 + (Math.random() - .5) * f * 1.4;
        }
      }
      /* 弹回原位（弹簧 + 阻尼） */
      p.vx += -p.ox * .075; p.vy += -p.oy * .075;
      p.vx *= .90; p.vy *= .90;
      p.ox += p.vx; p.oy += p.vy;
      x += p.ox; y += p.oy;
      const depth = (Math.sin(a) + 1) * .5;
      const tw = .5 + .5 * Math.sin(t * 2.4 * p.tw + p.ph);
      const s = p.r * (0.6 + depth * 1.5) * 3.6;
      ctx.globalAlpha = (0.16 + depth * 0.84) * tw;
      ctx.drawImage(fxSprite(c.kind), x - s * .5, y - s * .5, s, s);
    }

    /* 无双爆发：向外飞溅 + 轻微重力衰减 */
    for (let i = FX.burst.length - 1; i >= 0; i--) {
      const p = FX.burst[i];
      p.life += dt;
      if (p.life >= p.max) { FX.burst.splice(i, 1); continue; }
      p.vy += 380 * dt;
      p.vx *= .985; p.vy *= .985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = 1 - p.life / p.max;
      const s = p.size * (0.45 + k * 0.85);
      ctx.globalAlpha = k * k;
      ctx.drawImage(fxSprite(p.kind), p.x - s * .5, p.y - s * .5, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    FX.raf = requestAnimationFrame(fxFrame);
  }

  function fxStart() {
    if (LITE) return;
    const cv = $('agFx');
    if (!cv || !fxInit()) return;
    FX.on = true; FX.running = true; FX.last = performance.now();
    cv.classList.add('on');
    if (!FX.raf) FX.raf = requestAnimationFrame(fxFrame);
  }

  function fxStop() {
    FX.on = false;
    const cv = $('agFx');
    if (cv) cv.classList.remove('on');
    setTimeout(() => {                    // 等爆发粒子自然散尽再停
      if (FX.on) return;
      FX.running = false;
      if (FX.raf) { cancelAnimationFrame(FX.raf); FX.raf = 0; }
      if (FX.ctx) FX.ctx.clearRect(0, 0, FX.w, FX.h);
      FX.burst.length = 0;
    }, 700);
  }

  /** 指针在卡面任意位置划过 / 按下 → 炸出无双粒子 */
  function bindFxInput() {
    const mask = $('agMask');
    if (!mask || mask._fxBound) return;
    mask._fxBound = true;
    let last = 0;
    mask.addEventListener('pointerdown', (e) => {
      if (FX.on) fxBurstAt(e.clientX, e.clientY, 34);
    });
    mask.addEventListener('pointermove', (e) => {
      if (!FX.on) return;
      const now = performance.now();
      if (now - last < 34) return;        // 限流，避免每帧都生成一堆粒子
      last = now;
      fxBurstAt(e.clientX, e.clientY, 6);
    });
  }

  /* =========================================================
   * 10. 开卡
   * =======================================================*/
  let curAch = null;

  function ensureDom() {
    if (!document.getElementById('agMask')) {
      document.body.insertAdjacentHTML('beforeend', CARD_HTML);
      bindCard();
    }
    if (!document.getElementById('abMask')) {
      document.body.insertAdjacentHTML('beforeend', ALBUM_HTML);
      bindAlbum();
    }
  }

  function openCard(ach) {
    ensureDom();
    if (!ach) return;
    curAch = ach;
    const r = RARITY[ach.rarity] || RARITY.white;
    tiltMax = r.tilt;

    const mask = $('agMask'), card = $('agCard');
    const isGold = ach.rarity === 'gold', isHi = ach.rarity !== 'white';

    /* 内容 */
    $('agIcon').innerHTML = iconHtml(ach);
    $('agRar').textContent = r.label;
    $('agName').textContent = ach.name;
    $('agDesc').textContent = ach.desc;
    $('agQuote').textContent = ach.quote || '';
    card.setAttribute('data-rarity', ach.rarity);

    /* 姿态复位 */
    pose.tx = pose.ty = 0; pose.px = pose.py = .5; pose.dx = pose.dy = 0;
    cur.rx = cur.ry = 0; cur.x = cur.y = .5; cur.px = cur.py = 0;
    rotY = 0; snapY = 0; rotX = 0; dragging = false; lastInput = performance.now();

    /* 装饰层：呼吸光晕只留给最低级（普通），Canvas 星环只给传说 */
    const halo = $('agHalo');
    halo.className = 'ag-halo' + (ach.rarity === 'white' ? ' on r-white' : '');
    halo.style.background = ''; halo.style.filter = '';
    spawnFloaters($('agParticles'), LITE ? 0 : r.particles);

    /* 入场动画 */
    card.classList.remove('enter', 'settled');
    void card.offsetWidth;
    card.classList.add('enter');
    setTimeout(() => card.classList.add('settled'), 300);

    mask.classList.add('open');
    $('agHint').textContent = /Mobi|Android|iPhone/i.test(navigator.userAgent)
      ? '拖动翻面 · 倾斜手机看体感' : '拖动翻面 · 移动鼠标看光影';
    startLoop();

    /* 传说：启动 Canvas 星环 + 可触碰无双粒子 */
    if (isGold) fxStart(); else fxStop();

    /* 体感：Android 直接绑定；iOS 仍需用户手势（下面 touchstart 已兜底） */
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission !== 'function') bindGyro();
    } catch (e) {}

    /* 仪式：闪光 + 爆发 + 音效 + 震动 */
    chime(ach.rarity);
    buzz(ach.rarity);
    if (isGold || ach.rarity === 'purple') {
      const fl = $('agFlash');
      fl.classList.remove('fire'); void fl.offsetWidth; fl.classList.add('fire');
      setTimeout(() => fl.classList.remove('fire'), 900);
    }
    if (isGold && !LITE) setTimeout(() => spawnBurst($('agBurst'), 26), 120);

    /* 标记已读 */
    markSeen(ach.id);
    refreshBadgeDots();
  }

  function closeCard() {
    const m = $('agMask'); if (m) m.classList.remove('open');
    stopLoop();
    fxStop();
    if (window.Achievements && window.Achievements.onClose) window.Achievements.onClose();
  }

  /* 手动拖动翻转（鼠标 / 触摸通用；没陀螺仪、不会甩也能翻） */
  function bindDrag() {
    const card = $('agCard');
    if (!card || card._dragBound) return;
    card._dragBound = true;
    let pid = null, x0 = 0, ry0 = 0, t0 = 0, lt = 0, lx = 0, v = 0, moved = 0;

    const down = (e) => {
      if (!($('agMask') && $('agMask').classList.contains('open'))) return;
      pid = e.pointerId; dragging = true;
      lastInput = performance.now();
      card.classList.add('grabbing');
      x0 = e.clientX; ry0 = rotY; t0 = lastInput; lt = t0; lx = e.clientX; v = 0; moved = 0;
      try { card.setPointerCapture(pid); } catch (err) {}
      if (e.cancelable) e.preventDefault();
    };
    const move = (e) => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      moved = Math.max(moved, Math.hypot(dx, dy));
      rotY = ry0 + dx * 0.7;
      rotX = Math.max(-26, Math.min(26, -dy * 0.35));
      /* 指针位置也驱动光栅 → 触摸/拖动时同样跟手 */
      const rc = card.getBoundingClientRect();
      pose.px = Math.min(1, Math.max(0, (e.clientX - rc.left) / rc.width));
      pose.py = Math.min(1, Math.max(0, (e.clientY - rc.top) / rc.height));
      pose.ty = (pose.px - .5) * 2 * tiltMax;
      pose.tx = (pose.py - .5) * 2 * tiltMax;
      pose.dx = (pose.px - .5) * -18;
      pose.dy = (pose.py - .5) * -18;
      const now = performance.now();
      const dt = now - lt;
      if (dt > 0) { v = (e.clientX - lx) / dt; lx = e.clientX; lt = now; }
      lastInput = now;
      if (e.cancelable) e.preventDefault();
    };
    const up = (e) => {
      if (!dragging || (e.pointerId != null && e.pointerId !== pid)) return;
      dragging = false; pid = null;
      card.classList.remove('grabbing');
      try { card.releasePointerCapture(e.pointerId); } catch (err) {}
      const now = performance.now();
      if ((now - t0) < 260 && moved < 8) {
        flipCard();                        // 轻点 = 翻面
      } else {
        if (Math.abs(v) > 0.35) snapY = normalizeFlip(rotY) + (v > 0 ? 180 : -180);  // 快速甩 = 翻到下一面
        else snapY = normalizeFlip(rotY);  // 慢拖 = 吸附最近一面
      }
      rotX = 0; pose.tx = 0; pose.ty = 0; pose.dx = 0; pose.dy = 0; lastInput = now;
    };
    card.addEventListener('pointerdown', down);
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerup', up);
    card.addEventListener('pointercancel', up);
  }

  function bindCard() {
    $('agClose').addEventListener('click', closeCard);
    $('agMask').addEventListener('click', e => { if (e.target === $('agMask') || e.target === $('agStage')) closeCard(); });
    window.addEventListener('pointermove', e => { if ($('agMask').classList.contains('open')) pointerMove(e); });
    $('agMask').addEventListener('touchstart', () => { requestGyro(); }, { once: true, passive: true });
    document.addEventListener('keydown', e => {
      if (!$('agMask').classList.contains('open')) return;
      if (e.key === 'Escape') closeCard();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') flipCard();
    });
    bindDrag();
    bindFxInput();
  }

  /* =========================================================
   * 11. 徽章渲染（profile 内）
   * =======================================================*/
  function refreshBadgeDots() {
    const box = $('pfBadges'); if (!box) return;
    const seen = getSeen();
    list().forEach(a => {
      const el = box.querySelector('[data-id="' + a.id + '"]');
      if (!el) return;
      el.classList.toggle('justnew', a.unlocked && seen.indexOf(a.id) < 0);
    });
  }

  function renderBadges(box) {
    if (!box) return;
    const items = list();
    const seen = getSeen();
    box.innerHTML = items.map(a => {
      const cls = ['pf-badge', 'r-' + a.rarity];
      if (a.unlocked) cls.push('on');
      if (a.unlocked && seen.indexOf(a.id) < 0) cls.push('justnew');
      return '<button class="' + cls.join(' ') + '" data-id="' + a.id + '" title="' +
        esc(a.rarity === 'gold' ? '传说 · ' : a.rarity === 'purple' ? '稀有 · ' : '') + esc(a.name) + '">' +
        '<span class="ic">' + (a.unlocked ? iconHtml(a) : '🔒') + '</span>' +
        '<span class="tx">' + esc(a.name) + '</span></button>';
    }).join('');
    if (!box._bound) {
      box._bound = true;
      box.addEventListener('click', e => {
        const b = e.target.closest('.pf-badge'); if (!b) return;
        const a = items.find(x => x.id === b.dataset.id); if (!a) return;
        if (!a.unlocked) { toast('「' + a.name + '」 尚未解锁'); return; }
        openCard(a);
      });
    }
  }

  /* =========================================================
   * 12. 收藏册
   * =======================================================*/
  let abFilter = 'all';

  function renderAlbum() {
    const grid = $('abGrid'); if (!grid) return;
    const items = list();
    const unlocked = items.filter(a => a.unlocked).length;
    $('abSub').textContent = '已解锁 ' + unlocked + ' / ' + items.length;
    setTimeout(() => { $('abBar').style.width = (unlocked / items.length * 100).toFixed(1) + '%'; }, 60);

    const seen = getSeen();
    const shown = items
      .filter(a => abFilter === 'all' || a.rarity === abFilter)
      .sort((a, b) => (RARE_ORDER[b.rarity] - RARE_ORDER[a.rarity]) || (b.unlocked - a.unlocked));

    grid.innerHTML = shown.map((a, i) => {
      const isNew = a.unlocked && seen.indexOf(a.id) < 0;
      return '<div class="ab-card r-' + a.rarity + (a.unlocked ? '' : ' locked') + (isNew ? ' new' : '') +
        '" data-id="' + a.id + '" style="animation-delay:' + (i * 28) + 'ms">' +
        '<div class="ab-holo"></div><div class="ab-sheen"></div>' +
        '<span class="ab-ic">' + (a.unlocked ? iconHtml(a) : '🔒') + '</span>' +
        '<div class="ab-nm">' + esc(a.name) + '</div>' +
        '<div class="ab-rr">' + RARITY[a.rarity].label + '</div>' +
        (a.unlocked ? '' : '<div class="ab-lock">🔒</div>') +
        '</div>';
    }).join('');

    if (!grid._bound) {
      grid._bound = true;
      grid.addEventListener('click', e => {
        const c = e.target.closest('.ab-card'); if (!c) return;
        const a = list().find(x => x.id === c.dataset.id); if (!a) return;
        if (!a.unlocked) { toast('「' + a.name + '」 尚未解锁，继续加油 ✦'); return; }
        openCard(a);
      });
      grid.addEventListener('mousemove', e => {
        const c = e.target.closest('.ab-card'); if (!c) return;
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        c.style.setProperty('--tiltX', (-(py - .5) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--tiltY', ((px - .5) * 12).toFixed(2) + 'deg');
        c.style.transform = 'perspective(600px) rotateX(var(--tiltX)) rotateY(var(--tiltY)) translateY(-3px)';
      });
      grid.addEventListener('mouseout', e => {
        const c = e.target.closest('.ab-card'); if (!c) return;
        c.style.transform = '';
      });
      grid.addEventListener('touchstart', () => { requestGyro(); }, { once: true, passive: true });
    }
  }

  function openAlbum() {
    ensureDom();
    renderAlbum();
    $('abMask').classList.add('open');
    $('abMask').scrollTop = 0;
    startLoop();
  }
  function closeAlbum() {
    $('abMask').classList.remove('open');
    if (!($('agMask') && $('agMask').classList.contains('open'))) stopLoop();
  }

  function bindAlbum() {
    $('abClose').addEventListener('click', closeAlbum);
    $('abFilters').addEventListener('click', e => {
      const c = e.target.closest('.ab-chip'); if (!c) return;
      abFilter = c.dataset.f;
      $('abFilters').querySelectorAll('.ab-chip').forEach(x => x.classList.toggle('on', x === c));
      $('abGrid')._bound = false;
      renderAlbum();
    });
    /* 兑换码 */
    const codeInput = $('abCode');
    const doRedeem = () => {
      const ok = redeem(codeInput ? codeInput.value : '');
      if (codeInput && ok) codeInput.value = '';
      $('abGrid')._bound = false;
      renderAlbum();
      toast(ok ? '兑换成功 ✦ 解锁隐藏成就「有点困」' : '兑换码不对哦，再想想 ✦');
    };
    if ($('abRedeem')) $('abRedeem').addEventListener('click', doRedeem);
    if (codeInput) codeInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); doRedeem(); codeInput.blur(); }
    });
  }

  /* =========================================================
   * 13. 对外接口
   * =======================================================*/
  function toast(msg) {
    if (typeof window.toast === 'function') { window.toast(msg); return; }
    let el = document.getElementById('ag-toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'ag-toast';
      el.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:600;' +
        'background:rgba(10,8,25,.92);color:#f0cf82;padding:10px 22px;border-radius:20px;font-size:.82rem;' +
        'border:1px solid rgba(240,207,130,.25);transition:opacity .3s;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = msg; el.style.opacity = '1';
    clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = '0'; }, 2200);
  }

  window.Achievements = {
    RARITY, ACHIEVEMENTS, RARE_ORDER,
    compute, list, isUnlocked,
    renderBadges, openCard, openAlbum,
    requestGyro, redeem,
    get lite() { return LITE; },
    setLite(v) { LITE = !!v; applyLite(); }
  };
  /* 兼容别名 */
  window.openAchievementAlbum = openAlbum;

  /* ---------- 启动 ---------- */
  function init() {
    try {
      const s = document.createElement('style');
      s.textContent = CSS;
      document.head.appendChild(s);
      applyLite();
      ensureDom();
      /* 预热：提前注入 DOM，避免首次点击延迟 */
      document.addEventListener('touchstart', function once() {
        document.removeEventListener('touchstart', once);
      }, { once: true, passive: true });
    } catch (e) { console.warn('成就系统初始化失败', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
