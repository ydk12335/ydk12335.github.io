/**
 * 有点困 · 成就光栅卡系统（Holographic Achievement Cards）
 * -----------------------------------------------------------
 * 稀有度：white 普通 / purple 稀有 / gold 传说 / zodiac 星座
 * 交互：3D 双面 · 手动拖动翻转（rotateY 吸附）+ 双击翻面
 * 光效：poke-holo 配方（固定渐变 + transform 扫动 + color-dodge / overlay）
 *   · white  银色全息（screen 低透明）+ 呼吸光晕
 *   · purple 冷彩虹全息
 *   · gold   全彩虹日柱（sunpillar）全息
 *   · zodiac 各星座专属配色流动底 + 缓转星座符号 + 卡外专属星图
 * 星座解锁：个人资料填入生日（或 zodiac），或观星页查看过该星座
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
    gold:   { label: '传说', tilt: 18, particles: 26, vbr: [22, 55, 22, 55, 45] },
    zodiac: { label: '星座', tilt: 15, particles: 0,  vbr: [20, 46, 20] }
  };

  /* =========================================================
   * 1.5 十二星座：专属配色 + 专属手绘星图（卡外背景用）
   *   星点坐标归一化到 0..100 的方框；lines 为星点连线索引对。
   * =======================================================*/
  const ZODIACS = [
    { key: 'aries', name: '白羊座', glyph: '♈', range: '3.21-4.19', elem: '火象 · 守护火星',
      palette: ['#ff3b30', '#ff8a3d', '#ff4d8d', '#ffd166'], quote: '我把所有的莽撞，都用来奔向你。',
      art: '<path d="M50 30C40 20 24 24 24 38c0 27 15 30 24 48"/><path d="M50 30c10-10 26-6 26 8 0 27-15 30-24 48"/><path d="M50 30v10"/>',
      stars: [[20, 55], [38, 48], [56, 44], [74, 52], [86, 40]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    { key: 'taurus', name: '金牛座', glyph: '♉', range: '4.20-5.20', elem: '土象 · 守护金星',
      palette: ['#3aa76d', '#8fe3c0', '#4fd1ff', '#ffd166'], quote: '想把最好的季节，都留给你。',
      art: '<circle cx="50" cy="58" r="17"/><path d="M50 41V27"/><path d="M33 41C21 37 17 25 25 15c5 10 15 15 25 15"/><path d="M67 41c12-4 16-16 8-26-5 10-15 15-25 15"/><circle cx="44" cy="56" r="1.9" fill="currentColor" stroke="none"/><circle cx="56" cy="56" r="1.9" fill="currentColor" stroke="none"/>',
      stars: [[15, 30], [30, 50], [45, 65], [58, 52], [72, 30], [50, 74]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]] },
    { key: 'gemini', name: '双子座', glyph: '♊', range: '5.21-6.21', elem: '风象 · 守护水星',
      palette: ['#35c4ff', '#5a7bff', '#a78bfa', '#7ff0e0'], quote: '我的心有两个人，都在念你的名字。',
      art: '<circle cx="36" cy="24" r="6"/><circle cx="64" cy="24" r="6"/><path d="M3630v44M6430v44M3038h12M5838h12M3076h12M5876h12"/><path d="M3050h12M5838h12" opacity=".35"/>',
      stars: [[30, 20], [28, 45], [34, 70], [62, 22], [66, 48], [70, 72]],
      lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3]] },
    { key: 'cancer', name: '巨蟹座', glyph: '♋', range: '6.22-7.22', elem: '水象 · 守护月亮',
      palette: ['#9ab8ff', '#b9a7ff', '#ffa8d8', '#8fe0ff'], quote: '月亮落进海里，我在潮汐里想你。',
      art: '<ellipse cx="50" cy="58" rx="16" ry="11"/><path d="M34 54C25 51 21 43 26 35c7 2 12 6 14 12"/><path d="M66 54c9-3 13-11 8-19-7 2-12 6-14 12"/><path d="M40 68l-7 8M47 70l-4 9M53 70l4 9M60 68l7 8"/>',
      stars: [[50, 25], [50, 50], [30, 72], [70, 70], [38, 32], [62, 30]],
      lines: [[0, 1], [1, 2], [1, 3], [0, 4], [0, 5]] },
    { key: 'leo', name: '狮子座', glyph: '♌', range: '7.23-8.22', elem: '火象 · 守护太阳',
      palette: ['#ffb300', '#ff8a00', '#ff5f8d', '#ffe07a'], quote: '我所有的光，只想照亮你一个人。',
      art: '<circle cx="50" cy="52" r="14"/><circle cx="50" cy="52" r="23" stroke-dasharray="6 7"/><circle cx="45" cy="50" r="1.9" fill="currentColor" stroke="none"/><circle cx="55" cy="50" r="1.9" fill="currentColor" stroke="none"/>',
      stars: [[28, 40], [34, 22], [46, 16], [58, 26], [52, 46], [70, 58], [84, 44]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6]] },
    { key: 'virgo', name: '处女座', glyph: '♍', range: '8.23-9.22', elem: '土象 · 守护水星',
      palette: ['#c9a227', '#7fd6c0', '#b9a7d6', '#e6d27a'], quote: '把每一处细节，都过成想你的样子。',
      art: '<path d="M50 80V30"/><path d="M50 30c6-9-7-12-9-6-1 4 3 8 9 10"/><path d="M50 46c9-1 12-6 12-12-6-1-11 3-12 12"/><path d="M50 46c-9-1-12-6-12-12 6-1 11 3 12 12"/><path d="M50 60c9-1 12-6 12-12-6-1-11 3-12 12"/><path d="M50 60c-9-1-12-6-12-12 6-1 11 3 12 12"/>',
      stars: [[50, 18], [46, 42], [70, 58], [30, 40], [24, 68], [66, 78]],
      lines: [[0, 1], [1, 2], [1, 3], [3, 4], [2, 5]] },
    { key: 'libra', name: '天秤座', glyph: '♎', range: '9.23-10.23', elem: '风象 · 守护金星',
      palette: ['#5aa9ff', '#7fe3d0', '#ffb3e0', '#c3b2ff'], quote: '天平的两端，都是你。',
      art: '<path d="M50 24v52"/><circle cx="50" cy="21" r="4"/><path d="M22 34h56"/><path d="M22 34l-9 16h18z"/><path d="M78 34l-9 16h18z"/><path d="M36 80h28"/>',
      stars: [[32, 40], [50, 32], [62, 46], [44, 58]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0]] },
    { key: 'scorpio', name: '天蝎座', glyph: '♏', range: '10.24-11.22', elem: '水象 · 守护冥王星',
      palette: ['#8b3bff', '#ff4d9e', '#3a5bff', '#c04bff'], quote: '我把最深的夜，留给最亮的你。',
      art: '<path d="M34 78V38h26v28c0 13 9 17 16 9"/><path d="M76 75l6-9-11-2"/><path d="M34 52h18"/>',
      stars: [[30, 20], [40, 32], [52, 38], [62, 52], [70, 68], [64, 82], [50, 86]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] },
    { key: 'sagittarius', name: '射手座', glyph: '♐', range: '11.23-12.21', elem: '火象 · 守护木星',
      palette: ['#ff6a00', '#ffd166', '#9b6bff', '#4fd1ff'], quote: '我射出的每一支箭，终点都是你。',
      art: '<path d="M26 74L74 26"/><path d="M55 26h19v19"/><path d="M36 64a20 20 0 0 0 26-26"/><path d="M26 74l-4-1M26 74l1 4" opacity=".6"/>',
      stars: [[30, 58], [26, 44], [40, 36], [58, 38], [70, 50], [64, 64], [46, 68]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [2, 6]] },
    { key: 'capricorn', name: '摩羯座', glyph: '♑', range: '12.22-1.19', elem: '土象 · 守护土星',
      palette: ['#a9744f', '#6bb8a8', '#8a7bd6', '#d1a06a'], quote: '我慢慢走，是想和你走很久。',
      art: '<path d="M26 34h40l-9 28H35z"/><path d="M28 34C18 28 20 16 30 14c4 6 4 14 0 20"/><path d="M70 68c8 6 14 2 14-6" opacity=".7"/>',
      stars: [[24, 30], [46, 24], [66, 34], [54, 56], [30, 52]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
    { key: 'aquarius', name: '水瓶座', glyph: '♒', range: '1.20-2.18', elem: '风象 · 守护天王星',
      palette: ['#2f6bff', '#56e1ff', '#a78bfa', '#7ff0e0'], quote: '我把整片银河，倒进你的梦里。',
      art: '<path d="M20 42q10-12 20 0t20 0 20 0"/><path d="M20 62q10-12 20 0t20 0 20 0"/><circle cx="30" cy="24" r="1.8" fill="currentColor" stroke="none"/><circle cx="50" cy="20" r="1.8" fill="currentColor" stroke="none"/><circle cx="70" cy="24" r="1.8" fill="currentColor" stroke="none"/>',
      stars: [[20, 36], [34, 50], [46, 34], [60, 48], [72, 32], [84, 46]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
    { key: 'pisces', name: '双鱼座', glyph: '♓', range: '2.19-3.20', elem: '水象 · 守护海王星',
      palette: ['#2b8cff', '#5a3bff', '#ff6fd8', '#4fd1ff'], quote: '两条鱼游过一整片海，只为在你的梦里相遇。',
      /* 两条手绘的鱼，首尾相望、以水波相连；整卡缓慢旋转 */
      art: '<path d="M68 34C60 24 42 24 30 34c12 10 30 10 38 0z"/>' +
        '<path d="M30 34l-13-9 2 18z"/>' +
        '<path d="M45 24c3-7 9-7 12 0"/>' +
        '<circle cx="59" cy="31" r="1.9" fill="currentColor" stroke="none"/>' +
        '<path d="M32 66c8 10 26 10 38 0-12-10-30-10-38 0z"/>' +
        '<path d="M70 66l13-9-2 18z"/>' +
        '<path d="M55 76c-3 7-9 7-12 0"/>' +
        '<circle cx="41" cy="69" r="1.9" fill="currentColor" stroke="none"/>' +
        '<path d="M17 43c8 8 8 16 0 24" opacity=".45" stroke-dasharray="4 4"/>' +
        '<path d="M83 33c-8 8-8 16 0 24" opacity=".45" stroke-dasharray="4 4"/>',
      stars: [[22, 30], [30, 48], [46, 54], [62, 46], [74, 30], [80, 52], [66, 66], [46, 60]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 2]] }
  ];
  const ZMAP = {};
  ZODIACS.forEach(z => { ZMAP[z.name] = z; });
  /** 把星座图腾包成可缩放的 SVG（stroke 跟随 currentColor） */
  function emblemSvg(z) {
    return '<svg class="zglyph" viewBox="0 0 100 100" fill="none" stroke="currentColor" ' +
      'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + z.art + '</svg>';
  }


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
    { id: 'all_major', name: '愚者之旅', icon: '🃏', rarity: 'gold', motion: 'aurora',
      desc: '集齐全部 22 张大阿尔卡纳',
      quote: '从愚者到世界，你走完了整段旅程。',
      check: s => s.majCount >= 22 },

    { id: 'gua_64', name: '六十四卦全图', icon: '☯', rarity: 'gold', motion: 'pulse',
      desc: '集齐全部 64 卦',
      quote: '天地万象，已在你指尖合拢成环。',
      check: s => s.guaKinds >= 64 },

    { id: 'three_hundred', name: '三百次占卜', icon: '👑', rarity: 'gold', motion: 'spark',
      desc: '累计占卜满 300 次',
      quote: '三百次叩问之后，答案已不必外求。',
      check: s => s.total >= 300 },

    { id: 'thirty_days', name: '一月不辍', icon: '🏆', rarity: 'gold', motion: 'flame',
      desc: '连续 30 天留下占卜足迹',
      quote: '三十个夜晚，你把自己点成了一盏灯。',
      check: s => s.streak >= 30 },

    /* ---------- 隐藏 · 兑换码 ---------- */
    { id: 'youdiankun', name: '有点困', icon: '😴', rarity: 'gold', hidden: true, motion: 'rain',
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
      desc: '',
      quote: '星河溺进深海的幻念',
      check: s => s.redeem }
  ];

  const RARE_ORDER = { white: 0, purple: 1, gold: 2, zodiac: 3 };

  /* ---------- 十二星座成就（填过生日 / 观星过该星座即解锁） ---------- */
  ZODIACS.forEach(z => {
    ACHIEVEMENTS.push({
      id: 'zodiac_' + z.key,
      name: z.name,
      icon: z.glyph,
      rarity: 'zodiac',
      zodiac: z.key,
      desc: z.range + ' · ' + z.elem,
      quote: z.quote,
      check: s => (s.signs || []).indexOf(z.name) >= 0
    });
  });

  /* =========================================================
   * 3. 工具 & 数据层
   * =======================================================*/
  const $ = (id) => document.getElementById(id);
  const esc = (t) => { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; };
  /** 成就图标：有手绘 SVG 用 SVG，否则用 emoji */
  const iconHtml = (a) => (a && a.art) ? a.art : esc(a ? a.icon : '');
  /** 取成就对应的星座定义（非星座成就返回 null） */
  const zodiacOfAch = (a) => (a && a.zodiac) ? (ZMAP[a.name] || null) : null;
  /** 把星座配色写入卡片的 CSS 变量（--z1/--z2/--z3） */
  function applyTheme(card, ach) {
    const z = zodiacOfAch(ach);
    if (z) {
      card.style.setProperty('--z1', z.palette[0]);
      card.style.setProperty('--z2', z.palette[1]);
      card.style.setProperty('--z3', z.palette[2]);
      card.style.setProperty('--z4', z.palette[3] || z.palette[1]);
    } else {
      card.style.removeProperty('--z1');
      card.style.removeProperty('--z2');
      card.style.removeProperty('--z3');
      card.style.removeProperty('--z4');
    }
    return z;
  }
  /** 生成该星座的专属星图 SVG（卡外背景用） */
  /* 星图绘制节奏：先一颗颗点出星星，再一条条连起来 */
  const SKY_START = 0.1, SKY_STAR_STEP = 0.1, SKY_LINE_STEP = 0.07;
  /** 整段星图绘制完成所需时间（秒，含最后一条线画完） */
  function skyTotal(z) {
    return SKY_START + z.stars.length * SKY_STAR_STEP +
      Math.max(0, z.lines.length - 1) * SKY_LINE_STEP + 0.45;
  }
  function skySvg(z) {
    let g = '';
    /* ① 依次点出星点（每颗错开一点，像一笔一笔点上去） */
    z.stars.forEach((s, i) => {
      const d = (SKY_START + i * SKY_STAR_STEP).toFixed(2) + 's';
      g += '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="3.4" fill="' + z.palette[1] +
        '" fill-opacity=".26" style="animation-delay:' + d + '"/>';
      g += '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="1.35" fill="#fff" style="animation-delay:' + d + '"/>';
    });
    /* ② 星点都亮起后，再沿连线一条条画出来 */
    const starsDone = SKY_START + z.stars.length * SKY_STAR_STEP;
    z.lines.forEach((l, i) => {
      const a = z.stars[l[0]], b = z.stars[l[1]];
      const d = (starsDone + i * SKY_LINE_STEP).toFixed(2) + 's';
      g += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] +
        '" stroke="' + z.palette[1] + '" stroke-width="0.5" stroke-opacity=".55" style="animation-delay:' + d + '"/>';
    });
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">' + g + '</svg>';
  }
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

  /** 生日 → 星座（与 profile.js 保持一致） */
  function zodiacOf(birthday) {
    if (!birthday) return '';
    const p = String(birthday).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!p) return '';
    const m = +p[2], d = +p[3];
    const S = [[1, 19, '摩羯座'], [2, 18, '水瓶座'], [3, 20, '双鱼座'], [4, 19, '白羊座'], [5, 20, '金牛座'],
      [6, 21, '双子座'], [7, 22, '巨蟹座'], [8, 22, '狮子座'], [9, 23, '处女座'], [10, 23, '天秤座'],
      [11, 22, '天蝎座'], [12, 21, '射手座'], [12, 31, '摩羯座']];
    for (const s of S) if (m < s[0] || (m === s[0] && d <= s[1])) return s[2];
    return '';
  }

  /** 收集用户已“点亮”的星座：资料里的生日 / zodiac，或观星历史里的 sign */
  function collectSigns() {
    const set = new Set();
    const grab = (raw) => {
      try {
        const m = JSON.parse(raw || '{}') || {};
        const u = m.user || {};
        if (u.zodiac) set.add(u.zodiac);
        const z = zodiacOf(u.birthday); if (z) set.add(z);
      } catch (e) {}
    };
    try { grab(localStorage.getItem('sleepy_space_memory')); } catch (e) {}
    try { grab(localStorage.getItem('sleepy_space_memory_v2')); } catch (e) {}
    arr('astro_hist_v1').forEach(r => { if (r && r.sign) set.add(String(r.sign).trim()); });
    try {
      const m = JSON.parse(localStorage.getItem('sleepy_space_memory') || '{}') || {};
      (m.horoscope || []).forEach(r => { if (r && r.sign) set.add(String(r.sign).trim()); });
    } catch (e) {}
    return [...set];
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
      signs: collectSigns(),
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
  transform-style:preserve-3d;transform:translateZ(0)}

/* ============ 卡片本体（3D 双面） ============ */
.ag-card{position:relative;width:min(320px,64vw);aspect-ratio:2.5/3.5;border-radius:22px;
  transform-style:preserve-3d;will-change:transform;
  touch-action:none;user-select:none;-webkit-user-select:none;
  cursor:grab;-webkit-tap-highlight-color:transparent;
  box-shadow:none;
  background:linear-gradient(160deg,#22203a,#141126);
  isolation:isolate}
.ag-card.grabbing{cursor:grabbing}
.ag-card.enter{animation:agPop .72s cubic-bezier(.18,1.5,.4,1) both}
@keyframes agPop{
  0%{opacity:0;transform:perspective(900px) scale(.55) rotateY(-24deg) rotateZ(-6deg)}
  62%{opacity:1;transform:perspective(900px) scale(1.06) rotateY(8deg) rotateZ(1.5deg)}
  100%{opacity:1;transform:perspective(900px) scale(1) rotateY(0) rotateZ(0)}}

/* 双面 */
.ag-face{position:absolute;inset:0;border-radius:22px;overflow:hidden;
  transform-style:preserve-3d;
  -webkit-backface-visibility:hidden;backface-visibility:hidden}
.ag-front{transform:rotateY(0deg)}
.ag-back{transform:rotateY(180deg)}

/* ============ 全息彩虹层（poke-holo 配方 · 性能版） ============
   固定 background-image，用 transform 位移扫动（GPU 合成，
   不再每帧重绘渐变 / 重算 filter） */
.ag-shine{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:1;
  background-repeat:no-repeat;background-size:220% 220%;
  background-position:calc(50% + var(--sxp,0) * 1%) calc(50% + var(--syp,0) * 1%);
  mix-blend-mode:screen}
/* ============ 高光眩光：固定径向渐变，靠 transform 跟随指针 ============ */
/* 眩光：圆心放在指针位置、半径拉到最远角（poke-holo 做法）→ 光从指针向整卡铺开，而非一块会跑的贴图 */
.ag-glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;
  background-image:radial-gradient(farthest-corner circle at var(--mx,50%) var(--my,50%),
    rgba(255,255,255,.5) 6%, rgba(255,255,255,.16) 28%, transparent 76%);
  mix-blend-mode:screen;
  opacity:calc(var(--pfc,0) * .5 + .12)}
.ag-edge{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:4;
  box-shadow:none}

/* ============ 专属动态层（每张卡自己的动效，data-motion 驱动） ============ */
.ag-dyn{position:absolute;inset:0;border-radius:inherit;z-index:1;pointer-events:none;
  display:none;overflow:hidden;mix-blend-mode:screen}

/* 下雨：Canvas 逐滴渲染（与主页同一套雨滴逻辑），疏密自然、不是条纹 */
.ag-rain{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;display:none}
.ag-card[data-motion="rain"] .ag-rain{display:block}
/* 雨夜卡面：深色夜空 + 万家灯火（Canvas 一次性绘制） */
.ag-city{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;display:none}
.ag-card[data-motion="rain"] .ag-city{display:block}
/* 雨夜时卡面底改为深夜色，避免露出明亮渐变 */
.ag-card[data-motion="rain"] .ag-face{background:#05070f !important}
/* 雨夜：压掉彩色流光/高光，只留一点冷色微光 */
.ag-card[data-motion="rain"] .ag-shine{opacity:.14 !important}
.ag-card[data-motion="rain"] .ag-glare{opacity:calc(var(--pfc,0) * .3 + .05) !important;
  background-image:radial-gradient(farthest-corner circle at var(--mx,50%) var(--my,50%),
    rgba(180,205,255,.35) 5%, rgba(150,180,240,.1) 30%, transparent 74%) !important}
.ag-card[data-motion="rain"] .ag-dyn{display:none !important}

/* 极光：两道柔光带缓缓漂移 */
.ag-card[data-motion="aurora"] .ag-dyn{display:block;
  background-image:
    linear-gradient(112deg, transparent 12%, rgba(120,220,255,.4) 32%, rgba(170,140,255,.22) 44%, transparent 62%),
    linear-gradient(68deg, transparent 18%, rgba(255,150,220,.34) 40%, rgba(140,255,220,.24) 56%, transparent 74%);
  background-size:150% 150%, 175% 175%;
  animation:agAurora 9s ease-in-out infinite}
@keyframes agAurora{
  0%{background-position:-35% 0, 130% 20%}
  50%{background-position:55% 34%, 42% -12%}
  100%{background-position:135% 8%, -35% 28%}}

/* 星火：细碎金点缓缓上浮 */
.ag-card[data-motion="spark"] .ag-dyn{display:block;
  background-image:
    radial-gradient(circle, rgba(255,244,208,.95) 1.4px, transparent 2px),
    radial-gradient(circle, rgba(255,224,158,.75) 1.2px, transparent 1.8px),
    radial-gradient(circle, rgba(255,255,255,.6) 1px, transparent 1.6px);
  background-size:62px 92px, 94px 132px, 42px 72px;
  animation:agSpark 3.4s linear infinite}
@keyframes agSpark{
  from{background-position:0 92px, 30px 132px, 15px 72px}
  to{background-position:0 -92px, 30px -132px, 15px -72px}}

/* 炉火：底部暖光呼吸 */
.ag-card[data-motion="flame"] .ag-dyn{display:block;
  background:radial-gradient(125% 62% at 50% 120%, rgba(255,152,64,.6), rgba(255,92,44,.26) 42%, transparent 74%);
  animation:agFlame 2.6s ease-in-out infinite}
@keyframes agFlame{
  0%,100%{opacity:.72; transform:translateY(0) scaleY(1)}
  50%{opacity:1; transform:translateY(-3%) scaleY(1.09)}}

/* 太极辉光：中心光晕缓缓明灭扩散 */
.ag-card[data-motion="pulse"] .ag-dyn{display:block;
  background:radial-gradient(circle at 50% 50%, rgba(200,232,255,.34), rgba(160,200,255,.12) 42%, transparent 66%);
  animation:agPulse 4s ease-in-out infinite}
@keyframes agPulse{
  0%,100%{opacity:.38; transform:scale(.9)}
  50%{opacity:.92; transform:scale(1.07)}}

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
.ag-halo{display:none}
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
.ag-card[data-rarity="white"] .ag-shine{opacity:.22;
  background-image:linear-gradient(115deg,
    rgba(255,255,255,.06), rgba(255,255,255,.18), rgba(200,215,255,.1),
    rgba(255,255,255,.14), rgba(255,255,255,.06));
  background-size:220% 220%}
.ag-card[data-rarity="white"] .ag-shine::after{display:none}
.ag-card[data-rarity="white"] .ag-glare{opacity:calc(var(--pfc,0) * .5 + .12)}
.ag-card[data-rarity="white"] .ag-icon{color:#e9e6ff}
.ag-card[data-rarity="white"] .ag-name{color:#f2f0ff}
.ag-card[data-rarity="white"] .ag-rar{color:#cfcbe8}
.ag-card[data-rarity="white"] .ag-quote{color:rgba(226,222,255,.8)}

/* ============ 紫色 · 稀有（顺滑彩虹光栅） ============ */
.ag-card[data-rarity="purple"] .ag-face{
  background:linear-gradient(158deg,#3a2b5c 0%,#241a3d 52%,#160f26 100%)}
.ag-card[data-rarity="purple"] .ag-inner-back{color:#d9c6ff}
.ag-card[data-rarity="purple"] .ag-shine{opacity:.62;
  background-image:linear-gradient(115deg,
    #6a3df0 0%, #b06bff 18%, #ff8ad6 38%, #7fd4ff 58%, #6affc0 76%, #b06bff 100%);
  background-size:240% 240%;
  filter:brightness(1.12) saturate(1.25)}
.ag-card[data-rarity="purple"] .ag-shine::after{display:none}
.ag-card[data-rarity="purple"] .ag-icon{color:#d9c6ff;filter:drop-shadow(0 0 16px rgba(160,110,255,.6))}
.ag-card[data-rarity="purple"] .ag-name{color:#efe4ff}
.ag-card[data-rarity="purple"] .ag-rar{color:#c9a7ff}
.ag-card[data-rarity="purple"] .ag-quote{color:rgba(214,190,255,.85)}
.ag-card[data-rarity="purple"] .ag-edge{box-shadow:none}

/* ============ 金色 · 传说（彩色 + 动态） ============ */
.ag-card[data-rarity="gold"]{
  box-shadow:none}
/* 底层：缓慢流动的浪漫多色渐变（传说） */
.ag-card[data-rarity="gold"] .ag-face{
  background:
    radial-gradient(120% 90% at 16% 12%, rgba(255,111,216,.55), transparent 58%),
    radial-gradient(120% 90% at 84% 20%, rgba(167,139,250,.5), transparent 60%),
    radial-gradient(130% 100% at 24% 88%, rgba(90,209,255,.46), transparent 62%),
    radial-gradient(120% 95% at 82% 86%, rgba(127,240,224,.42), transparent 62%),
    linear-gradient(150deg,#2a1740 0%,#160e28 55%,#0e0a1e 100%);
  background-size:200% 200%, 200% 200%, 200% 200%, 200% 200%, 100% 100%;
  animation:agGoldFlow 11s ease-in-out infinite}
@keyframes agGoldFlow{
  0%{background-position:0% 50%, 100% 50%, 0% 50%, 100% 50%, 0% 0%}
  50%{background-position:100% 50%, 0% 50%, 100% 50%, 0% 50%, 0% 0%}
  100%{background-position:0% 50%, 100% 50%, 0% 50%, 100% 50%, 0% 0%}}
.ag-card[data-rarity="gold"] .ag-inner-back{color:#ecd9ff}
.ag-card[data-rarity="gold"] .ag-bk-rar{border-color:rgba(190,150,255,.55);color:#d9b8ff;
  box-shadow:0 0 14px rgba(190,150,255,.22)}
.ag-card[data-rarity="gold"] .ag-bk-name{
  background:linear-gradient(100deg,#ffd7f2,#d9b8ff,#e6dcff,#b79bff,#ffd7f2);
  background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:agFlow 5s linear infinite}
.ag-card[data-rarity="gold"] .ag-bk-quote{color:#f0c9ff;text-shadow:0 0 16px rgba(190,150,255,.35)}
/* 浪漫流光：多色线性渐变 + 指针视差（screen 叠加，不用 conic） */
.ag-card[data-rarity="gold"] .ag-shine{opacity:.6;
  background-image:
    linear-gradient(115deg,#ff6fd8,#a78bfa,#5ad1ff,#7ff0e0,#ffd166,#ff6fd8),
    linear-gradient(115deg, transparent 34%, rgba(255,255,255,.45) 48%, transparent 64%);
  background-size:260% 260%, 240% 240%;
  background-position:
    calc(50% + var(--sxp,0) * 1.1%) calc(50% + var(--syp,0) * 1.1%),
    calc(50% + var(--sxp,0) * 1.6%) calc(50% + var(--syp,0) * 1.6%);
  mix-blend-mode:screen;
  filter:brightness(1.12) saturate(1.25)}
/* 跟随指针的柔光（screen，浪漫冷调） */
.ag-card[data-rarity="gold"] .ag-glare{
  background-image:radial-gradient(farthest-corner circle at var(--pointer-x,50%) var(--pointer-y,50%),
    rgba(255,255,255,.6) 5%, rgba(255,190,240,.3) 24%, rgba(150,180,255,.16) 46%, transparent 74%);
  mix-blend-mode:screen;
  opacity:calc(var(--pfc,0) * .6 + .18)}
.ag-card[data-rarity="gold"] .ag-shine::after{display:none}
.ag-card[data-rarity="gold"] .ag-icon{color:#ecd9ff;
  filter:drop-shadow(0 0 22px rgba(200,160,255,.8))}
.ag-card[data-rarity="gold"] .ag-name{
  background:linear-gradient(100deg,#ff9ad8,#c39bff,#9be7ff,#8ef0e0,#7fd4ff,#c39bff,#ff9ad8);
  background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:agFlow 5s linear infinite;font-weight:700;letter-spacing:.2em}
.ag-card[data-rarity="gold"] .ag-rar{color:#d9b8ff;border-color:rgba(190,150,255,.55);
  box-shadow:0 0 14px rgba(190,150,255,.22)}
.ag-card[data-rarity="gold"] .ag-desc{color:rgba(238,230,255,.85)}
.ag-card[data-rarity="gold"] .ag-quote{color:#f0c9ff;text-shadow:0 0 16px rgba(190,150,255,.4);font-size:.78rem}
.ag-card[data-rarity="gold"] .ag-edge{
  padding:2px;border-radius:22px;
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite:exclude;
  overflow:hidden}
.ag-card[data-rarity="gold"] .ag-edge::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(115deg,
    transparent 40%, rgba(255,111,216,.9) 47%, rgba(167,139,250,1) 50%,
    rgba(90,209,255,.9) 53%, transparent 60%);
  background-size:300% 300%;
  animation:agGoldTrack 6s linear infinite}
@keyframes agGoldTrack{
  0%{background-position:0% 0%}
  100%{background-position:200% 200%}}
@keyframes agFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

/* ============ 星座 · 专属卡（流动背景 + 缓转星座符号） ============ */
/* 卡外背景：该星座专属星图（由 JS 注入 SVG）
   尺寸按屏幕自适应：尽量大，但始终完整留在屏幕内（不越界） */
.ag-sky{position:absolute;left:50%;top:50%;z-index:-3;pointer-events:none;opacity:0;
  transform:translate(-50%,-50%);
  width:min(calc(100vw - 28px), 640px);aspect-ratio:1/1;
  transition:opacity .6s ease;display:flex;align-items:center;justify-content:center}
.ag-sky.on{opacity:1}
.ag-sky svg{width:100%;height:100%;overflow:visible}

/* ---- 星座卡开场序列：先连出星图 → 再浮现卡片 → 最后逐条出现文字 ---- */
.ag-stage.seq .ag-sky svg line{
  stroke-dasharray:140;stroke-dashoffset:140;
  animation:agStarDraw .45s ease-out forwards}
.ag-stage.seq .ag-sky svg circle{
  opacity:0;animation:agStarPop .35s ease-out forwards}
@keyframes agStarDraw{to{stroke-dashoffset:0}}
@keyframes agStarPop{from{opacity:0}to{opacity:1}}
/* 卡片：等星图连完再浮现（--skyDur 由 JS 按星数/线数算出） */
.ag-stage.seq .ag-card.enter{animation-delay:calc(var(--skyDur,1s) + .05s)}
/* 星象图腾：卡片出现后淡入（保留自转） */
.ag-stage.seq .ag-zmark{animation:agZspin 52s linear infinite, agFade .9s ease-out calc(var(--skyDur,1s) + .5s) both}
@keyframes agFade{from{opacity:0}to{opacity:1}}
/* 文字：最后逐条浮出 */
.ag-stage.seq .ag-front .ag-inner > *{opacity:0;animation:agTextIn .55s ease-out forwards}
.ag-stage.seq .ag-front .ag-inner > *:nth-child(1){animation-delay:calc(var(--skyDur,1s) + .72s)}
.ag-stage.seq .ag-front .ag-inner > *:nth-child(2){animation-delay:calc(var(--skyDur,1s) + .79s)}
.ag-stage.seq .ag-front .ag-inner > *:nth-child(3){animation-delay:calc(var(--skyDur,1s) + .85s)}
.ag-stage.seq .ag-front .ag-inner > *:nth-child(4){animation-delay:calc(var(--skyDur,1s) + .92s)}
.ag-stage.seq .ag-front .ag-inner > *:nth-child(5){animation-delay:calc(var(--skyDur,1s) + .99s)}
@keyframes agTextIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}

/* 流沙：几道柔和的沙色带缓慢流淌（纯 transform 位移，GPU 合成，零重绘） */
.ag-zsand{position:absolute;inset:0;border-radius:inherit;z-index:0;pointer-events:none;display:none;
  overflow:hidden}
/* 星尘点阵：多层不同颜色/大小的细小光点，缓缓漂移（静态背景，只做 transform） */
.ag-zsand::before{content:'';position:absolute;inset:-30%;
  background-image:
    radial-gradient(circle, var(--z1) 1.6px, transparent 2.1px),
    radial-gradient(circle, var(--z2) 1.3px, transparent 1.8px),
    radial-gradient(circle, var(--z3) 1.5px, transparent 2px),
    radial-gradient(circle, var(--z4) 1.7px, transparent 2.2px),
    radial-gradient(circle, #ffffff 0.9px, transparent 1.4px);
  background-size:23px 23px, 31px 31px, 37px 37px, 41px 41px, 17px 17px;
  background-position:0 0, 11px 15px, 19px 9px, 22px 7px, 6px 24px;
  animation:agSandA 19s ease-in-out infinite alternate}
/* 第二层星尘点（不同颜色/疏密，叠出丰富感；避免任何色斑边界） */
.ag-zsand::after{content:'';position:absolute;inset:-30%;
  background-image:
    radial-gradient(circle, var(--z4) 1.4px, transparent 1.9px),
    radial-gradient(circle, var(--z2) 1.1px, transparent 1.6px),
    radial-gradient(circle, var(--z3) 1.3px, transparent 1.8px),
    radial-gradient(circle, #ffffff 0.8px, transparent 1.3px);
  background-size:29px 29px, 21px 21px, 33px 33px, 14px 14px;
  background-position:9px 4px, 15px 23px, 2px 17px, 4px 11px;
  opacity:.9;
  animation:agSandB 29s ease-in-out infinite alternate}
@keyframes agSandA{
  0%{transform:translate3d(-7%,-5%,0) rotate(-4deg) scale(1.05)}
  100%{transform:translate3d(7%,6%,0) rotate(5deg) scale(1.28)}}
@keyframes agSandB{
  0%{transform:translate3d(8%,4%,0) rotate(6deg) scale(1.2)}
  100%{transform:translate3d(-6%,-6%,0) rotate(-5deg) scale(1.02)}}

/* 缓慢旋转的手绘星座图腾（取代小图标，成为卡面主体） */
.ag-zmark{position:absolute;left:50%;top:50%;z-index:2;pointer-events:none;
  width:58%;height:58%;color:rgba(255,255,255,.42);
  filter:drop-shadow(0 0 16px var(--z2));
  animation:agZspin 52s linear infinite}
.ag-zmark svg,.zglyph{width:1em;height:1em;display:inline-block;overflow:visible}
.ag-zmark svg{width:100%;height:100%}
@keyframes agZspin{
  from{transform:translate(-50%,-50%) rotate(0deg)}
  to{transform:translate(-50%,-50%) rotate(360deg)}}

.ag-card[data-rarity="zodiac"]{box-shadow:none}
.ag-card[data-rarity="zodiac"] .ag-zsand{display:block}
.ag-card[data-rarity="zodiac"] .ag-face{
  background:
    linear-gradient(150deg, rgba(8,12,26,.42), rgba(8,12,26,.26)),
    linear-gradient(135deg, var(--z1), var(--z2) 34%, var(--z4) 68%, var(--z3))}
.ag-card[data-rarity="zodiac"] .ag-inner{color:#eaf4ff}
.ag-card[data-rarity="zodiac"] .ag-icon{display:none}
.ag-card[data-rarity="zodiac"] .ag-name{color:#fff;text-shadow:0 2px 20px var(--z2)}
.ag-card[data-rarity="zodiac"] .ag-rar{color:#fff;border-color:rgba(255,255,255,.5);
  box-shadow:0 0 14px var(--z2)}
.ag-card[data-rarity="zodiac"] .ag-desc{color:rgba(230,242,255,.86)}
.ag-card[data-rarity="zodiac"] .ag-quote{color:rgba(222,240,255,.94);text-shadow:0 0 16px var(--z2)}
.ag-card[data-rarity="zodiac"] .ag-edge{
  padding:2px;border-radius:22px;
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite:exclude;
  overflow:hidden}
.ag-card[data-rarity="zodiac"] .ag-edge::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(115deg,
    transparent 40%, var(--z3) 47%, var(--z2) 50%,
    var(--z1) 53%, transparent 60%);
  background-size:300% 300%;
  animation:agGoldTrack 6s linear infinite}
.ag-card[data-rarity="zodiac"] .ag-shine{opacity:.46;
  background-image:linear-gradient(115deg,
    var(--z1) 0%, var(--z2) 22%, var(--z3) 44%, var(--z4) 66%, var(--z1) 88%, var(--z1) 100%);
  background-size:250% 250%;
  filter:brightness(1.15) saturate(1.2)}
.ag-card[data-rarity="zodiac"] .ag-shine::after{display:none}
.ag-card[data-rarity="zodiac"] .ag-inner-back{color:#eaf4ff}
.ag-card[data-rarity="zodiac"] .ag-bk-rar{color:#fff;border-color:rgba(255,255,255,.5)}
.ag-card[data-rarity="zodiac"] .ag-bk-name{color:#fff;text-shadow:0 2px 18px var(--z2)}
.ag-card[data-rarity="zodiac"] .ag-bk-quote{color:rgba(222,240,255,.92);text-shadow:0 0 14px var(--z2)}

/* 收藏册里的星座卡 */
.ab-card.r-zodiac{background:linear-gradient(160deg,#13213a,#070d18);
  border:1px solid rgba(255,255,255,.2);box-shadow:0 4px 16px var(--z2)}
.ab-card.r-zodiac .ab-rr{color:#c3dcff}
.ab-card.r-zodiac .ab-nm{color:#eef6ff}
.ab-card.r-zodiac .ab-ic{color:#dceaff;filter:drop-shadow(0 0 12px var(--z2))}
.ab-card.r-zodiac .ab-holo{opacity:.28;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%), var(--z2), transparent 62%)}
.ag-lite .ag-zsand,.ag-lite .ag-zsand::before,.ag-lite .ag-zsand::after{animation:none}
.ag-lite .ag-zmark{animation:none}
.ag-lite .ag-zmark svg{filter:none}

/* ============ 关闭 & 提示 ============ */
.ag-close{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);
  z-index:530;background:rgba(16,13,26,.92);border:1px solid rgba(240,207,130,.28);
  color:rgba(240,207,130,.85);font-family:inherit;font-size:.76rem;letter-spacing:.16em;
  padding:10px 26px;border-radius:999px;cursor:pointer}
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
  background:linear-gradient(135deg,#d9b8ff,#fff3c9);border:none;border-radius:999px;
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
  font-size:1.3rem;background:rgba(8,6,16,.85)}
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
.ab-card.r-gold .ab-rr{color:#d9b8ff}
.ab-card.r-gold .ab-nm{color:#ffeeb8}
.ab-card.r-gold .ab-holo{opacity:.42;
  background-image:linear-gradient(115deg,#7d6326,#f7e7a8,#b79bff,#fff8cf,#c9a227,#8a6d2f);
  animation:agLiquid 10s linear infinite}
.ab-card.r-gold .ab-ic{filter:drop-shadow(0 0 12px rgba(200,160,255,.8))}
.ab-card.new::after{content:'NEW';position:absolute;top:7px;right:7px;z-index:7;
  font-size:.5rem;letter-spacing:.12em;padding:2px 6px;border-radius:99px;
  background:linear-gradient(135deg,#ff6b9d,#8b5cff);color:#fff;font-weight:700}
.ab-close{position:fixed;right:16px;top:calc(16px + env(safe-area-inset-top,0px));z-index:490;
  width:38px;height:38px;border-radius:50%;border:1px solid rgba(240,207,130,.28);cursor:pointer;
  background:rgba(20,14,36,.9);color:rgba(240,207,130,.8);font-size:1rem;font-family:inherit}

/* ============ 低端机降级 ============ */
.ag-lite .ag-mask,.ag-lite .ab-mask,.ag-lite .ag-close,.ag-lite .ab-close{
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important}
.ag-lite .ag-halo{animation:none;opacity:.5;transform:none;
  background:radial-gradient(circle,rgba(180,200,255,.35),rgba(180,200,255,0) 70%)}
.ag-lite .ag-card[data-rarity="gold"] .ag-shine::after,
.ag-lite .ag-card[data-rarity="purple"] .ag-shine::after{display:none}
.ag-lite .ag-card[data-rarity="gold"] .ag-name{animation:none;background-position:50% 50%}
.ag-lite .ab-card.r-purple .ab-holo,.ag-lite .ab-card.r-gold .ab-holo{animation:none;background-position:50% 50%}

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
.pf-badge.r-gold.on .tx{color:#d9b8ff}
.pf-badge.r-zodiac.on{border-color:rgba(150,200,255,.45);
  background:linear-gradient(150deg,rgba(90,150,255,.2),rgba(20,30,60,.1));
  box-shadow:0 4px 16px rgba(90,150,255,.24)}
.pf-badge.r-zodiac.on .tx{color:#bcd8ff}
.pf-badge.justnew::after{content:'';position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;
  background:#ff5fa8;box-shadow:0 0 8px #ff5fa8;animation:agPulse 1.4s ease-in-out infinite}
@keyframes agPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.55}}
.pf-more{float:right;font-size:.64rem;color:rgba(240,207,130,.55);text-decoration:none;letter-spacing:.06em}
.pf-more:active{color:#f0cf82}

/* ============ 小屏 ============ */
@media (max-width:360px){
  .ag-card{width:min(240px,62vw)}
  .ab-grid{grid-template-columns:repeat(auto-fill,minmax(112px,1fr))}
}
@media (prefers-reduced-motion: reduce){
  .ag-card.enter{animation-duration:.01ms}
  .ag-shine,.ag-halo,.ag-icon,.ab-holo{animation:none!important}
}
`;

  /* =========================================================
   * 6. HTML 骨架
   * =======================================================*/
  const CARD_HTML = `
<div class="ag-mask" id="agMask">
  <div class="ag-stage" id="agStage">
    <div class="ag-sky" id="agSky"></div>
    <div class="ag-halo" id="agHalo"></div>
    <div class="ag-card" id="agCard" data-rarity="white">
      <!-- 正面 -->
      <div class="ag-face ag-front">
        <div class="ag-zsand"></div>
        <div class="ag-zmark" id="agZmark"></div>
        <div class="ag-dyn"></div>
        <canvas class="ag-city" id="agCity"></canvas>
        <canvas class="ag-rain" id="agRain"></canvas>
        <div class="ag-shine"></div>
        <div class="ag-glare"></div>
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
        <div class="ag-zsand"></div>
        <div class="ag-zmark"></div>
        <div class="ag-shine"></div>
        <div class="ag-glare"></div>
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
    </div>
  </div>
  <div class="ag-hint" id="agHint">拖动翻面 · 倾斜手机看体感</div>
  <button class="ag-close" id="agClose">收 起</button>
</div>`;

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
    <button class="ab-chip" data-f="zodiac">星座</button>
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
  /** 翻面已按需求关闭：卡片恒显示正面（保留函数空实现，避免残留调用报错） */
  function flipCard() {}

  function loop() {
    /* 只在这里消费最新指针坐标（rAF 节流，避免 mousemove 频率直接写样式） */
    if (pendMove) { applyPointer(pendMove); pendMove = null; }
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
        'perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) +
        'deg) scale(' + depth.toFixed(4) + ')';
      const mx = cur.x * 100, my = cur.y * 100;
      card.style.setProperty('--mx', mx.toFixed(2) + '%');
      card.style.setProperty('--my', my.toFixed(2) + '%');
      /* 全息扫动：只写百分比，CSS 用 transform 位移（GPU 合成，零重绘） */
      const drift = idle ? 1 : 0.35;
      const dxk = Math.sin(now * 0.00027) * 22;
      const dyk = Math.cos(now * 0.00021) * 26;
      const pxv = Math.min(100, Math.max(0, mx + swBx * 2.4 * drift + dxk));
      const pyv = Math.min(100, Math.max(0, my + swBy * 2.4 * drift + dyk));
      const sxp = (pxv - 50) * 0.5, syp = (pyv - 50) * 0.5;
      card.style.setProperty('--sxp', sxp.toFixed(2));
      card.style.setProperty('--syp', syp.toFixed(2));
      card.style.setProperty('--gxp', ((mx - 50) * 0.52).toFixed(2));
      card.style.setProperty('--gyp', ((my - 50) * 0.52).toFixed(2));
      card.style.setProperty('--pfc', pfc.toFixed(3));
      /* 标准化交互变量（gold.css 风格）：指针位置 + 倾斜角，供金属光层使用 */
      card.style.setProperty('--pointer-x', mx.toFixed(2) + '%');
      card.style.setProperty('--pointer-y', my.toFixed(2) + '%');
      card.style.setProperty('--tilt-x', rx.toFixed(2) + 'deg');
      card.style.setProperty('--tilt-y', ry.toFixed(2) + 'deg');
    }
    /* 卡面雨：仅在雨中渲染 */
    if (rainActive) drawRain();
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

  /* ===== 卡面雨（复用主页雨滴思路：逐滴下落 + 圆头 + 随机疏密，非条纹） ===== */
  let rainCtx = null, rainDrops = [], rainSplashes = [], rainW = 0, rainH = 0, rainActive = false;
  function newDrop(spread) {
    return { x: Math.random() * rainW,
      y: spread ? Math.random() * rainH : -12,
      l: 7 + Math.random() * 9,
      v: 5 + Math.random() * 4,
      a: .22 + Math.random() * .38,
      w: Math.random() < .3 ? 1.3 : 1,
      d: (Math.random() - .5) * .4 };
  }
  function setupRain(on) {
    const cv = $('agRain'), card = $('agCard');
    if (!cv || !card) { rainActive = false; return; }
    if (!on) {
      rainActive = false;
      if (rainCtx) { rainCtx.clearRect(0, 0, rainW, rainH); }
      return;
    }
    /* 用 offsetWidth/Height 量卡片布局尺寸：不受入场缩放动画（transform）影响，
       否则会量到动画起始的小尺寸，导致夜景只铺一小块 */
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    rainW = card.offsetWidth || 260; rainH = card.offsetHeight || 364;
    cv.width = Math.max(1, Math.round(rainW * dpr));
    cv.height = Math.max(1, Math.round(rainH * dpr));
    cv.style.width = rainW + 'px'; cv.style.height = rainH + 'px';
    rainCtx = cv.getContext('2d');
    rainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rainDrops = [];
    rainSplashes = [];
    const n = Math.max(16, Math.round(rainW * 0.14));
    for (let i = 0; i < n; i++) rainDrops.push(newDrop(true));
    drawCity();
    rainActive = true;
  }
  function drawRain() {
    if (!rainCtx) return;
    rainCtx.clearRect(0, 0, rainW, rainH);
    rainCtx.strokeStyle = 'rgba(206,226,255,1)';
    rainCtx.lineCap = 'round';
    for (const d of rainDrops) {
      d.y += d.v; d.x += d.d;
      if (d.y > rainH) {
        /* 落地：留下一圈涟漪 */
        rainSplashes.push({ x: d.x, y: rainH - 1, r: 1, a: .55 });
        const nd = newDrop(false); d.y = nd.y; d.x = nd.x;
        continue;
      } else if (d.x < -4 || d.x > rainW + 4) {
        d.x = Math.random() * rainW;
      }
      rainCtx.globalAlpha = d.a;
      rainCtx.lineWidth = d.w;
      rainCtx.beginPath();
      rainCtx.moveTo(d.x, d.y);
      rainCtx.lineTo(d.x - d.d * 2, d.y - d.l);
      rainCtx.stroke();
    }
    rainCtx.globalAlpha = 1;
    /* 地面涟漪扩散（雨落地的特效） */
    rainCtx.strokeStyle = 'rgba(228,240,255,1)';
    rainSplashes = rainSplashes.filter(s => s.a > 0 && s.y > rainH - 10);
    for (const s of rainSplashes) {
      s.r += 1.5; s.a -= 0.035; s.y -= 0.6;
      const y = Math.min(rainH, s.y);
      rainCtx.globalAlpha = Math.min(0.8, Math.max(0, s.a));
      rainCtx.lineWidth = 1;
      rainCtx.beginPath();
      rainCtx.ellipse(s.x, y, s.r, s.r * 0.26, 0, 0, 7);
      rainCtx.stroke();
      if (s.r > 4) {
        rainCtx.globalAlpha = Math.max(0, s.a * 0.45);
        rainCtx.beginPath();
        rainCtx.ellipse(s.x, y, s.r * 0.5, s.r * 0.13, 0, 0, 7);
        rainCtx.stroke();
      }
    }
    rainCtx.globalAlpha = 1;
  }

  /* ===== 雨夜卡面：深色夜空 + 万家灯火（一次性绘制，静态背景） ===== */
  function cityBuildings(c, w, h, baseY, color, winAlpha) {
    let x = -6;
    while (x < w + 6) {
      const bw = 9 + Math.random() * 22;
      const bh = (h - baseY * h) * (0.35 + Math.random() * 0.95);
      const topY = baseY * h - bh;
      c.fillStyle = color;
      c.fillRect(x, topY, bw, bh);
      /* 窗灯：密集的小暖点 → 万家灯火 */
      const cols = Math.max(1, Math.floor(bw / 3.4));
      const rows = Math.max(2, Math.floor(bh / 5.2));
      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          if (Math.random() < 0.42) {
            const wx = x + 1.2 + cc * (bw / cols);
            const wy = topY + 1.8 + r * (bh / rows);
            const a = (0.2 + Math.random() * 0.65) * winAlpha;
            const gg = 175 + Math.floor(Math.random() * 60);
            const bb = 95 + Math.floor(Math.random() * 90);
            c.fillStyle = 'rgba(255,' + gg + ',' + bb + ',' + a.toFixed(2) + ')';
            c.fillRect(wx, wy, 1.3, 1.5);
          }
        }
      }
      x += bw + 1 + Math.random() * 3;
    }
  }
  function drawCity() {
    const cv = $('agCity');
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rainW || 260, h = rainH || 364;
    cv.width = Math.max(1, Math.round(w * dpr));
    cv.height = Math.max(1, Math.round(h * dpr));
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* 夜空 */
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#070c1c');
    g.addColorStop(0.55, '#0a1226');
    g.addColorStop(1, '#05070f');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    /* 月亮柔光 */
    const mg = c.createRadialGradient(w * 0.72, h * 0.16, 0, w * 0.72, h * 0.16, h * 0.34);
    mg.addColorStop(0, 'rgba(255,240,205,.22)');
    mg.addColorStop(1, 'rgba(255,240,205,0)');
    c.fillStyle = mg;
    c.fillRect(0, 0, w, h);
    /* 远景楼群（暗、灯稀）→ 近景楼群（更暗、灯密）*/
    cityBuildings(c, w, h, 0.66, 'rgba(14,20,40,1)', 0.55);
    cityBuildings(c, w, h, 0.80, 'rgba(6,9,20,1)', 1);
    /* 地平线附近的暖色城市辉光 */
    const cg = c.createLinearGradient(0, h * 0.72, 0, h);
    cg.addColorStop(0, 'rgba(255,190,110,0)');
    cg.addColorStop(1, 'rgba(255,180,100,.16)');
    c.fillStyle = cg;
    c.fillRect(0, h * 0.72, w, h * 0.28);
  }

  /* mousemove 只记录最新坐标；真正的计算放到 rAF(loop) 里，避免高频重排/写样式 */
  let pendMove = null;
  function pointerMove(e) { pendMove = { x: e.clientX, y: e.clientY }; }
  function applyPointer(p) {
    const card = $('agCard');
    if (!card) return;
    lastInput = performance.now();
    const r = card._rect || (card._rect = card.getBoundingClientRect());
    const px = (p.x - r.left) / r.width;
    const py = (p.y - r.top) / r.height;
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
    const dEl = $('agDesc');
    dEl.textContent = ach.desc || '';
    dEl.style.display = ach.desc ? '' : 'none';
    $('agQuote').textContent = ach.quote || '';
    card.setAttribute('data-rarity', ach.rarity);
    /* 专属动态：有点困固定下雨；其余传说随机一个动效；其他卡若定义了 motion 则用它 */
    const MOTION_POOL = ['aurora', 'pulse', 'spark', 'flame', 'rain'];
    let motion = ach.motion || '';
    if (ach.rarity === 'gold' && ach.id !== 'youdiankun') {
      motion = MOTION_POOL[Math.floor(Math.random() * MOTION_POOL.length)];
    }
    card.setAttribute('data-motion', motion);

    /* 星座主题：配色变量 + 缓转图腾 SVG + 卡外专属星图 */
    const zdef = applyTheme(card, ach);
    card.querySelectorAll('.ag-zmark').forEach(el => { el.innerHTML = zdef ? emblemSvg(zdef) : ''; });
    const sky = $('agSky');
    if (sky) {
      sky.innerHTML = zdef ? skySvg(zdef) : '';
      sky.classList.toggle('on', !!zdef);
    }
    /* 星座卡专属开场序列：依次点星 → 连线 → 浮出卡 → 出文字（非星座卡关闭） */
    const stageEl = $('agStage');
    if (stageEl) {
      stageEl.classList.toggle('seq', !!zdef);
      if (zdef) stageEl.style.setProperty('--skyDur', skyTotal(zdef).toFixed(2) + 's');
      else stageEl.style.removeProperty('--skyDur');
    }

    /* 姿态复位 */
    pose.tx = pose.ty = 0; pose.px = pose.py = .5; pose.dx = pose.dy = 0;
    cur.rx = cur.ry = 0; cur.x = cur.y = .5; cur.px = cur.py = 0;
    rotY = 0; snapY = 0; rotX = 0; dragging = false; lastInput = performance.now();
    /* 装饰层：呼吸光晕只留给最低级（普通） */
    const halo = $('agHalo');
    halo.className = 'ag-halo' + (ach.rarity === 'white' ? ' on r-white' : '');
    halo.style.background = ''; halo.style.filter = '';


    /* 入场动画 */
    card.classList.remove('enter', 'settled');
    card._rect = null;              // 重新测量卡片位置（缓存失效）
    void card.offsetWidth;
    card.classList.add('enter');
    setTimeout(() => card.classList.add('settled'), 300);

    mask.classList.add('open');
    /* 卡面雨：需要卡片已展开，等一帧量好尺寸再建画布 */
    if (motion === 'rain') requestAnimationFrame(() => setupRain(true));
    else setupRain(false);
    $('agHint').textContent = /Mobi|Android|iPhone/i.test(navigator.userAgent)
      ? '倾斜手机 · 光影流动' : '移动鼠标 · 光影流动';
    startLoop();

    /* 体感：Android 直接绑定；iOS 仍需用户手势（下面 touchstart 已兜底） */
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission !== 'function') bindGyro();
    } catch (e) {}

    /* 仪式：音效 + 震动 */
    chime(ach.rarity);
    buzz(ach.rarity);

    /* 标记已读 */
    markSeen(ach.id);
    refreshBadgeDots();
  }

  function closeCard() {
    const m = $('agMask'); if (m) m.classList.remove('open');
    setupRain(false);
    stopLoop();
    if (window.Achievements && window.Achievements.onClose) window.Achievements.onClose();
  }

  /* 手动拖动翻转（鼠标 / 触摸通用；没陀螺仪、不会甩也能翻） */
  function bindDrag() {
    const card = $('agCard');
    if (!card || card._dragBound) return;
    card._dragBound = true;
    let pid = null, x0 = 0, y0 = 0, ry0 = 0, t0 = 0, lt = 0, lx = 0, v = 0, moved = 0;

    const down = (e) => {
      if (!($('agMask') && $('agMask').classList.contains('open'))) return;
      pid = e.pointerId; dragging = true;
      lastInput = performance.now();
      card.classList.add('grabbing');
      x0 = e.clientX; y0 = e.clientY; ry0 = rotY; t0 = lastInput; lt = t0; lx = e.clientX; v = 0; moved = 0;
      try { card.setPointerCapture(pid); } catch (err) {}
      if (e.cancelable) e.preventDefault();
    };
    const move = (e) => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      moved = Math.max(moved, Math.hypot(dx, dy));
      /* 翻面已关闭：拖动不再旋转卡片，仅驱动光影 */
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
      /* 翻面已关闭：松手后恒正面 */
      rotY = 0; snapY = 0; rotX = 0;
      pose.tx = 0; pose.ty = 0; pose.dx = 0; pose.dy = 0; lastInput = now;
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
    });
    bindDrag();
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
        esc(a.rarity === 'gold' ? '传说 · ' : a.rarity === 'zodiac' ? '星座 · ' : a.rarity === 'purple' ? '稀有 · ' : '') + esc(a.name) + '">' +
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
      const zdef = zodiacOfAch(a);
      const zst = zdef ? ('--z1:' + zdef.palette[0] + ';--z2:' + zdef.palette[1] + ';--z3:' + zdef.palette[2] + ';') : '';
      return '<div class="ab-card r-' + a.rarity + (a.unlocked ? '' : ' locked') + (isNew ? ' new' : '') +
        '" data-id="' + a.id + '" style="' + zst + 'animation-delay:' + (i * 28) + 'ms">' +
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
