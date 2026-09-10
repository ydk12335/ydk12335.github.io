/**
 * 有点困 · 成就光栅卡系统（Holographic Achievement Cards）
 * -----------------------------------------------------------
 * 稀有度：white 普通 / purple 稀有 / gold 传说
 * 交互：鼠标高光跟随 + 移动端陀螺仪 + 3D 倾斜
 * 金色专属：液态金 / 粒子 / 呼吸光环 / 旋转星轨 / 开卡爆发 / 手写寄语
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
    white:  { label: '普通', tilt: 6,  particles: 0,  vbr: [12] },
    purple: { label: '稀有', tilt: 11, particles: 12, vbr: [16, 40, 16] },
    gold:   { label: '传说', tilt: 16, particles: 26, vbr: [22, 55, 22, 55, 45] }
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
      check: s => s.streak >= 30 }
  ];

  const RARE_ORDER = { white: 0, purple: 1, gold: 2 };

  /* =========================================================
   * 3. 工具 & 数据层
   * =======================================================*/
  const $ = (id) => document.getElementById(id);
  const esc = (t) => { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; };
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
      fav, night, streak, days: days.size
    };
  }

  /** 判定单个成就是否解锁 */
  function isUnlocked(ach, stats) {
    try { return !!ach.check(stats || compute()); } catch (e) { return false; }
  }

  /** 返回全部成就的实时状态 */
  function list() {
    const s = compute();
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: isUnlocked(a, s)
    }));
  }

  /* ---------- 已读记录（NEW 标记） ---------- */
  const SEEN_KEY = 'ach_seen_v1';
  function getSeen() { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch (e) { return []; } }
  function markSeen(id) {
    const s = getSeen(); if (s.indexOf(id) < 0) { s.push(id); try { localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) {} }
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
  background:radial-gradient(circle at 50% 42%, rgba(28,18,52,.72), rgba(4,2,12,.94));
  -webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);
  perspective:1000px;animation:agFade .3s ease;padding:20px}
.ag-mask.open{display:flex}
@keyframes agFade{from{opacity:0}to{opacity:1}}

.ag-stage{position:relative;display:flex;align-items:center;justify-content:center;
  transform-style:preserve-3d}

/* ============ 卡片本体 ============ */
.ag-card{position:relative;width:min(300px,76vw);aspect-ratio:2.5/3.5;border-radius:20px;
  transform-style:preserve-3d;will-change:transform;
  box-shadow:0 30px 70px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.28);
  overflow:hidden;isolation:isolate;cursor:pointer;
  background:linear-gradient(160deg,#22203a,#141126)}
.ag-card.enter{animation:agPop .72s cubic-bezier(.18,1.5,.4,1) both}
@keyframes agPop{
  0%{opacity:0;transform:perspective(800px) scale(.55) rotateX(18deg) rotateZ(-6deg)}
  62%{opacity:1;transform:perspective(800px) scale(1.06) rotateX(-3deg) rotateZ(1.5deg)}
  100%{opacity:1;transform:perspective(800px) scale(1) rotateX(0) rotateZ(0)}}

/* 液金 / 虹彩层 */
.ag-holo{position:absolute;inset:-20%;pointer-events:none;z-index:1;
  background-size:300% 300%;background-position:50% 50%;mix-blend-mode:screen;opacity:0;
  transition:opacity .5s ease;transform:translate3d(var(--px,0px),var(--py,0px),0)}
.ag-foil{position:absolute;inset:0;pointer-events:none;z-index:2;opacity:0;
  background:
    repeating-linear-gradient(105deg, rgba(255,255,255,.055) 0 1px, transparent 1px 4px);
  mix-blend-mode:overlay}
/* 高光跟随层 */
.ag-sheen{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:.5;
  background:radial-gradient(circle at var(--x,50%) var(--y,50%),
    rgba(255,255,255,.55), rgba(255,255,255,.1) 26%, rgba(255,255,255,0) 52%);
  transition:opacity .3s}
.ag-edge{position:absolute;inset:0;border-radius:20px;pointer-events:none;z-index:4;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.22), inset 0 0 22px rgba(0,0,0,.45)}

/* 内容 */
.ag-inner{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;padding:26px 20px;gap:9px;
  transform:translateZ(18px)}
.ag-icon{font-size:3rem;line-height:1;filter:drop-shadow(0 6px 18px rgba(0,0,0,.5));
  transition:transform .5s cubic-bezier(.18,1.4,.4,1)}
.ag-card:hover .ag-icon{transform:translateY(-3px) scale(1.06)}
.ag-rar{font-size:.62rem;letter-spacing:.42em;text-indent:.42em;padding:3px 12px;border-radius:999px;
  border:1px solid currentColor;opacity:.85}
.ag-name{font-size:1.22rem;letter-spacing:.16em;font-weight:600;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.6)}
.ag-desc{font-size:.72rem;line-height:1.6;color:rgba(255,255,255,.72);max-width:200px}
.ag-quote{margin-top:6px;font-family:'STKaiti','KaiTi','Songti SC',serif;font-size:.74rem;line-height:1.7;
  min-height:2.4em;max-width:210px;opacity:0;transform:translateY(6px)}
.ag-card.settled .ag-quote{animation:agQuote 1.5s ease .55s forwards}
@keyframes agQuote{to{opacity:1;transform:none}}

/* ============ 白色 · 安静克制 ============ */
.ag-card[data-rarity="white"]{
  background:linear-gradient(158deg,#2b2c40 0%,#1a1a2b 55%,#12121e 100%)}
.ag-card[data-rarity="white"] .ag-holo{opacity:.13;
  background-image:linear-gradient(112deg,transparent 34%,rgba(255,255,255,.75) 48%,transparent 62%)}
.ag-card[data-rarity="white"] .ag-sheen{opacity:.32}
.ag-card[data-rarity="white"] .ag-icon{color:#e9e6ff}
.ag-card[data-rarity="white"] .ag-name{color:#f2f0ff}
.ag-card[data-rarity="white"] .ag-rar{color:#cfcbe8}
.ag-card[data-rarity="white"] .ag-quote{color:rgba(226,222,255,.8)}

/* ============ 紫色 · 彩虹渐变 ============ */
.ag-card[data-rarity="purple"]{
  background:linear-gradient(158deg,#3a2b5c 0%,#241a3d 52%,#160f26 100%)}
.ag-card[data-rarity="purple"] .ag-holo{opacity:.34;
  background-image:linear-gradient(112deg,#ff5fa8,#8b5cff,#39d0ff,#ff8ae2,#ff5fa8);
  animation:agFlow 7s ease-in-out infinite}
.ag-card[data-rarity="purple"] .ag-sheen{opacity:.5}
.ag-card[data-rarity="purple"] .ag-icon{color:#d9c6ff;filter:drop-shadow(0 0 16px rgba(160,110,255,.6))}
.ag-card[data-rarity="purple"] .ag-name{color:#efe4ff}
.ag-card[data-rarity="purple"] .ag-rar{color:#c9a7ff}
.ag-card[data-rarity="purple"] .ag-quote{color:rgba(214,190,255,.85)}
.ag-card[data-rarity="purple"] .ag-edge{box-shadow:inset 0 0 0 1px rgba(190,150,255,.4), inset 0 0 26px rgba(80,40,140,.5)}
@keyframes agFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

/* ============ 金色 · 传说（分层克制） ============ */
.ag-card[data-rarity="gold"]{
  background:linear-gradient(158deg,#4a3a1c 0%,#2e2410 46%,#1a1408 100%)}
/* ① 液态金缓慢流动 */
.ag-card[data-rarity="gold"] .ag-holo{opacity:.58;
  background-image:linear-gradient(115deg,#7d6326,#f7e7a8,#d4af37,#fff8cf,#c9a227,#8a6d2f,#f0d989);
  animation:agLiquid 9s linear infinite}
@keyframes agLiquid{0%{background-position:0% 50%}100%{background-position:300% 50%}}
.ag-card[data-rarity="gold"] .ag-foil{opacity:.5}
.ag-card[data-rarity="gold"] .ag-sheen{opacity:.6;
  background:radial-gradient(circle at var(--x,50%) var(--y,50%),
    rgba(255,250,220,.85), rgba(255,238,180,.22) 24%, rgba(255,215,120,0) 54%)}
.ag-card[data-rarity="gold"] .ag-icon{color:#ffe9a6;
  filter:drop-shadow(0 0 22px rgba(240,200,100,.85));
  animation:agIconGlow 3.6s ease-in-out infinite}
@keyframes agIconGlow{0%,100%{filter:drop-shadow(0 0 16px rgba(240,200,100,.65))}
  50%{filter:drop-shadow(0 0 30px rgba(255,225,140,1))}}
.ag-card[data-rarity="gold"] .ag-name{
  background:linear-gradient(100deg,#fff4c4,#f2d071,#fffbe8,#d4af37,#fff4c4);
  background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:agFlow 5s linear infinite;font-weight:700;letter-spacing:.2em}
.ag-card[data-rarity="gold"] .ag-rar{color:#f2d071;border-color:rgba(242,208,113,.6);
  box-shadow:0 0 14px rgba(242,208,113,.25)}
.ag-card[data-rarity="gold"] .ag-desc{color:rgba(255,240,200,.82)}
/* ⑥ 常驻签名 · 手写体寄语 */
.ag-card[data-rarity="gold"] .ag-quote{color:#f6dd9a;text-shadow:0 0 16px rgba(242,208,113,.4);font-size:.78rem}
.ag-card[data-rarity="gold"] .ag-edge{
  box-shadow:inset 0 0 0 1px rgba(242,208,113,.55), inset 0 0 34px rgba(120,90,20,.55)}

/* ============ ② 粒子层（金色） ============ */
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

/* ============ ③ 光环层（呼吸） ============ */
.ag-halo{position:absolute;inset:-34px;border-radius:34px;pointer-events:none;z-index:-1;opacity:0;
  transition:opacity .6s}
.ag-halo.on{opacity:1;animation:agBreathe 3.8s ease-in-out infinite}
@keyframes agBreathe{
  0%,100%{transform:scale(.94);opacity:.5}
  50%{transform:scale(1.07);opacity:.95}}

/* ============ ④ 边缘层 · 旋转星轨 ============ */
.ag-ring{position:absolute;inset:-15px;border-radius:24px;padding:1.6px;pointer-events:none;z-index:5;
  opacity:0;transition:opacity .5s;
  background:conic-gradient(from 0deg,transparent 0deg,rgba(242,208,113,.95) 42deg,transparent 108deg,
    transparent 178deg,rgba(255,240,190,.8) 218deg,transparent 288deg,rgba(242,208,113,.6) 330deg,transparent 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  animation:agSpin 16s linear infinite}
.ag-ring.on{opacity:1}
@keyframes agSpin{to{transform:rotate(360deg)}}

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
  background:linear-gradient(170deg,rgba(16,10,32,.96),rgba(6,4,14,.98));
  -webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);padding:26px 18px 60px}
.ab-mask.open{display:block;animation:agFade .32s ease}
.ab-head{max-width:640px;margin:0 auto 16px;text-align:center}
.ab-title{font-size:1rem;letter-spacing:.34em;color:#f0cf82;font-weight:600;margin:0 0 6px}
.ab-sub{font-size:.7rem;color:rgba(240,207,130,.45);letter-spacing:.1em}
.ab-bar{height:5px;border-radius:99px;background:rgba(255,255,255,.09);margin:12px auto 0;max-width:260px;overflow:hidden}
.ab-bar>i{display:block;height:100%;width:0;border-radius:99px;
  background:linear-gradient(90deg,#f0cf82,#fff3c9,#c9a04c);transition:width .8s cubic-bezier(.2,1,.3,1)}
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
  background:radial-gradient(circle at var(--x,50%) var(--y,50%),rgba(255,255,255,.5),rgba(255,255,255,0) 50%)}
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
.ag-lite .ag-halo{animation:none;opacity:.55;transform:none;
  background:radial-gradient(circle,rgba(242,208,113,.35),rgba(242,208,113,0) 70%)}
.ag-lite .ag-ring{animation:none;background:none;
  box-shadow:0 0 0 1.5px rgba(242,208,113,.5), 0 0 18px rgba(242,208,113,.25)}
.ag-lite .ag-particles{display:none}
.ag-lite .ag-foil{display:none}
.ag-lite .ag-card[data-rarity="gold"] .ag-holo{animation:none;background-position:50% 50%}
.ag-lite .ag-card[data-rarity="gold"] .ag-icon{animation:none}
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
.pf-badge.r-gold.on{border-color:rgba(242,208,113,.5);
  background:linear-gradient(165deg,rgba(255,240,190,.2),rgba(200,160,60,.08));
  box-shadow:0 4px 18px rgba(242,208,113,.22)}
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
  .ag-holo,.ag-ring,.ag-halo,.ag-icon,.ab-holo{animation:none!important}
}
`;

  /* =========================================================
   * 6. HTML 骨架
   * =======================================================*/
  const CARD_HTML = `
<div class="ag-mask" id="agMask">
  <div class="ag-stage" id="agStage">
    <div class="ag-halo" id="agHalo"></div>
    <div class="ag-ring" id="agRing"></div>
    <div class="ag-particles" id="agParticles"></div>
    <div class="ag-card" id="agCard" data-rarity="white">
      <div class="ag-holo"></div>
      <div class="ag-foil"></div>
      <div class="ag-sheen"></div>
      <div class="ag-edge"></div>
      <div class="ag-inner">
        <div class="ag-icon" id="agIcon">🌙</div>
        <div class="ag-rar" id="agRar">普通</div>
        <div class="ag-name" id="agName">成就</div>
        <div class="ag-desc" id="agDesc"></div>
        <div class="ag-quote" id="agQuote"></div>
      </div>
      <div class="ag-burst" id="agBurst"></div>
    </div>
  </div>
  <div class="ag-hint" id="agHint">移动鼠标 · 倾斜手机</div>
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
  const pose = { tx: 0, ty: 0, px: 0.5, py: 0.5, dx: 0, dy: 0 };  // target / pointer
  const cur = { rx: 0, ry: 0, x: 0.5, y: 0.5, px: 0, py: 0 };
  let rafId = null, tiltMax = 6;

  function loop() {
    cur.rx += (pose.tx - cur.rx) * 0.12;
    cur.ry += (pose.ty - cur.ry) * 0.12;
    cur.x += (pose.px - cur.x) * 0.12;
    cur.y += (pose.py - cur.y) * 0.12;
    cur.px += (pose.dx - cur.px) * 0.10;
    cur.py += (pose.dy - cur.py) * 0.10;

    const card = $('agCard');
    if (card && $('agMask') && $('agMask').classList.contains('open')) {
      card.style.transform =
        'perspective(800px) rotateX(' + (-cur.rx).toFixed(2) + 'deg) rotateY(' + cur.ry.toFixed(2) + 'deg)';
      card.style.setProperty('--x', (cur.x * 100).toFixed(2) + '%');
      card.style.setProperty('--y', (cur.y * 100).toFixed(2) + '%');
      card.style.setProperty('--px', cur.px.toFixed(2) + 'px');
      card.style.setProperty('--py', cur.py.toFixed(2) + 'px');
    }
    /* 收藏册里的卡也随陀螺仪流动 */
    const ab = $('abMask');
    if (ab && ab.classList.contains('open')) {
      const cx = (50 + (cur.x - .5) * 90).toFixed(1) + '%';
      const cy = (50 + (cur.y - .5) * 90).toFixed(1) + '%';
      const ty = (cur.ry * 0.28).toFixed(2);
      const tx = (-cur.rx * 0.28).toFixed(2);
      ab.querySelectorAll('.ab-card').forEach(c => {
        c.style.setProperty('--x', cx); c.style.setProperty('--y', cy);
        c.style.setProperty('--ax', cx); c.style.setProperty('--ay', cy);
        c.style.setProperty('--tiltY', ty); c.style.setProperty('--tiltX', tx);
      });
    }
    rafId = requestAnimationFrame(loop);
  }
  function startLoop() { if (!rafId) rafId = requestAnimationFrame(loop); }
  function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  function pointerMove(e) {
    const card = $('agCard');
    if (!card) return;
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
    $('agIcon').textContent = ach.icon;
    $('agRar').textContent = r.label;
    $('agName').textContent = ach.name;
    $('agDesc').textContent = ach.desc;
    $('agQuote').textContent = ach.quote || '';
    card.setAttribute('data-rarity', ach.rarity);

    /* 姿态复位 */
    pose.tx = pose.ty = 0; pose.px = pose.py = .5; pose.dx = pose.dy = 0;
    cur.rx = cur.ry = 0; cur.x = cur.y = .5; cur.px = cur.py = 0;

    /* 装饰层 */
    $('agHalo').className = 'ag-halo' + (isGold ? ' on' : '');
    $('agRing').className = 'ag-ring' + (isGold ? ' on' : '');
    if (isGold) {
      $('agHalo').style.background =
        'radial-gradient(circle, rgba(255,228,150,.55), rgba(242,208,113,.18) 45%, rgba(242,208,113,0) 72%)';
      $('agHalo').style.filter = 'blur(26px)';
    }
    spawnFloaters($('agParticles'), LITE ? 0 : r.particles);

    /* 入场动画 */
    card.classList.remove('enter', 'settled');
    void card.offsetWidth;
    card.classList.add('enter');
    setTimeout(() => card.classList.add('settled'), 300);

    mask.classList.add('open');
    $('agHint').textContent = /Mobi|Android|iPhone/i.test(navigator.userAgent)
      ? '倾斜手机 · 光影流动' : '移动鼠标 · 感受光栅';
    startLoop();

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
    if (window.Achievements && window.Achievements.onClose) window.Achievements.onClose();
  }

  function bindCard() {
    $('agClose').addEventListener('click', closeCard);
    $('agMask').addEventListener('click', e => { if (e.target === $('agMask') || e.target === $('agStage')) closeCard(); });
    window.addEventListener('mousemove', e => { if ($('agMask').classList.contains('open')) pointerMove(e); });
    $('agMask').addEventListener('touchstart', () => { requestGyro(); }, { once: true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });
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
        '<span class="ic">' + (a.unlocked ? a.icon : '🔒') + '</span>' +
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
        '<span class="ab-ic">' + (a.unlocked ? a.icon : '🔒') + '</span>' +
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
        c.style.setProperty('--x', (px * 100).toFixed(1) + '%');
        c.style.setProperty('--y', (py * 100).toFixed(1) + '%');
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
    requestGyro,
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
