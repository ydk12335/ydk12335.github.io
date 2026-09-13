/**
 * 有点困 · 心理危机保护（自杀/自伤倾向拦截）
 * -----------------------------------------------
 * 参考微信/知乎/B站成熟保护机制：
 *  命中高危关键词 → 立即全屏暖心保护页，不占卜、不解读、不调侃
 *  优先安抚 + 给出权威心理援助热线，引导寻求专业帮助
 *
 * 热线（权威核实）：
 *  12356 全国统一心理援助热线（国家卫健委 2024-12 设置，
 *        2025-05-01 全国统一，免费保密，7×24 小时）
 *  12355 青少年心理援助热线（共青团中央，青少年优先）
 */
(function () {
  'use strict';

  /* 高危关键词库：覆盖 自杀/自伤/轻生 等直接表达与常见变体 */
  var KEYWORDS = [
    '自杀', '自尽', '轻生', '寻死', '想死', '去死', '不想活', '活不下去',
    '不想活了', '活着没意思', '活着没意义', '没意思了', '没意义了',
    '结束生命', '结束自己', '了结', '自我了断', '一了百了', '解脱',
    '跳楼', '跳桥', '跳河', '割腕', '割脉', '上吊', '自缢', '安眠药', '烧炭',
    '吃安眠药', '吞药', '吃药自杀', '煤气自杀', '服毒', '自残', '自伤',
    '伤害自己', '弄死自己', '掐死自己', '勒死自己', '不想撑了', '撑不下去了',
    '没有活下去的勇气', '告别这个世界', '离开这个世界', '不想见到明天',
    '让我死', '放血', '撞车', '卧轨', '跳崖', '溺死', '淹死自己',
    'kill myself', 'suicide', 'end my life', 'self harm', 'cut myself'
  ];

  /* 关键词命中判定：全角/半角、空格容错 */
  function hit(text) {
    if (!text) return false;
    var t = String(text);
    for (var i = 0; i < KEYWORDS.length; i++) {
      var kw = KEYWORDS[i];
      var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      /* 允许中间夹空格/标点（如"不 想 活 了"） */
      var re = new RegExp(esc.split('').join('[\\s\\u00a0，。！？!?、,.，\\s]{0,2}'), 'i');
      if (re.test(t)) return true;
    }
    return false;
  }

  /* 全屏保护页（幂等：已显示则不重复） */
  var shown = false;
  function showCrisisPage() {
    if (shown) return;
    shown = true;
    var div = document.createElement('div');
    div.id = 'crisisPage';
    div.style.cssText = [
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;',
      'background:linear-gradient(165deg,#1a1030 0%,#2a1a45 55%,#3d2a5e 100%);',
      'padding:28px;overflow-y:auto;-webkit-overflow-scrolling:touch;',
      'font-family:inherit;text-align:center;color:#f0ead6;'
    ].join('');
    div.innerHTML =
      '<div style="max-width:420px;width:100%;animation:crisisIn .5s cubic-bezier(.16,1,.3,1)">' +
      '<div style="font-size:3rem;margin-bottom:14px">💛</div>' +
      '<h2 style="font-size:1.5rem;letter-spacing:.12em;margin-bottom:10px;color:#ffe9a8">先别急着下结论</h2>' +
      '<p style="font-size:.95rem;line-height:1.9;margin-bottom:20px;color:rgba(240,234,214,.92)">' +
      '我们听到你说的话了。<br>这一刻很难，但你不是一个人。<br>' +
      '占卜可以等，你的安全才是最重要的。</p>' +
      '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,233,168,.35);border-radius:18px;padding:16px 14px;margin-bottom:18px">' +
      '<div style="font-size:.8rem;letter-spacing:.1em;color:rgba(255,233,168,.75);margin-bottom:8px">📞 现在就可以打，免费、保密、24小时有人接</div>' +
      '<div style="font-size:1.5rem;letter-spacing:.14em;color:#ffe9a8;margin-bottom:6px;font-weight:700">12356</div>' +
      '<div style="font-size:.78rem;color:rgba(240,234,214,.8);margin-bottom:10px">全国统一心理援助热线 · 国家卫健委</div>' +
      '<div style="font-size:1.1rem;letter-spacing:.1em;color:#ffe9a8;font-weight:600">12355</div>' +
      '<div style="font-size:.78rem;color:rgba(240,234,214,.8)">青少年心理援助热线</div>' +
      '</div>' +
      '<p style="font-size:.8rem;line-height:1.8;color:rgba(240,234,214,.75);margin-bottom:22px">' +
      '如果你现在有立即伤害自己的冲动，请直接拨打 <b style="color:#fff">110</b> 或 <b style="color:#fff">120</b>，' +
      '或联系身边最近的、你信任的人。</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
      '<a href="tel:12356" style="flex:1;min-width:130px;padding:13px 10px;border-radius:999px;background:linear-gradient(135deg,#ffe9a8,#f0c96a);color:#1a1030;font-weight:700;text-decoration:none;font-size:.9rem">拨打 12356</a>' +
      '<a href="tel:12355" style="flex:1;min-width:130px;padding:13px 10px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,233,168,.4);color:#ffe9a8;font-weight:600;text-decoration:none;font-size:.9rem">拨打 12355</a>' +
      '</div>' +
      '<div style="margin-top:24px">' +
      '<button id="crisisClose" style="background:none;border:none;color:rgba(240,234,214,.5);font-size:.75rem;letter-spacing:.1em;cursor:pointer;padding:8px 14px">我还想继续看看占卜（我知道自己在做什么）</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(div);
    /* 淡入动画 */
    var st = document.createElement('style');
    st.textContent = '@keyframes crisisIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}';
    document.head.appendChild(st);
    /* 关闭按钮：允许用户自主选择（知情后继续） */
    var closeBtn = document.getElementById('crisisClose');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      try { div.remove(); } catch (e) {}
      shown = false;
    });
  }

  window.CrisisGuard = {
    hit: hit,
    check: function (text) { return hit(text); },
    show: showCrisisPage,
    KEYWORDS: KEYWORDS
  };
})();
