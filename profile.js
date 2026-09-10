/**
 * 有点困 - 「我的」个人中心
 * 悬浮球点击打开；含基础信息 / 占卜统计 / 成就徽章 / 时间轴 / 设置
 * 数据来源：localStorage（tarot_hist_v1、yijing_hist_v1、astro_hist_v1、sleepy_space_memory）
 *            + Supabase auth 用户信息
 */
(function () {
  const $ = id => document.getElementById(id);
  const MEM_KEY = 'sleepy_space_memory';

  /* ==================== 数据层 ==================== */
  function getMem() { try { return JSON.parse(localStorage.getItem(MEM_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveMem(m) {
    try { localStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch (e) {}
    if (typeof window.scheduleUpload === 'function') window.scheduleUpload();
  }
  function getTarot() { try { return JSON.parse(localStorage.getItem('tarot_hist_v1') || '[]'); } catch (e) { return []; } }
  function getYijing() { try { return JSON.parse(localStorage.getItem('yijing_hist_v1') || '[]'); } catch (e) { return []; } }
  function getAstro() { try { return JSON.parse(localStorage.getItem('astro_hist_v1') || '[]'); } catch (e) { return []; } }

  const MAJ22 = ['愚者','魔术师','女祭司','女皇','皇帝','教皇','恋人','战车','力量','隐士','命运之轮','正义','倒吊人','死神','节制','恶魔','高塔','星星','月亮','太阳','审判','世界'];

  function zodiacOf(birthday) {
    if (!birthday) return '';
    const p = String(birthday).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!p) return '';
    const m = +p[2], d = +p[3];
    const S = [[1,19,'摩羯座'],[2,18,'水瓶座'],[3,20,'双鱼座'],[4,19,'白羊座'],[5,20,'金牛座'],[6,21,'双子座'],[7,22,'巨蟹座'],[8,22,'狮子座'],[9,23,'处女座'],[10,23,'天秤座'],[11,22,'天蝎座'],[12,21,'射手座'],[12,31,'摩羯座']];
    for (const s of S) if (m < s[0] || (m === s[0] && d <= s[1])) return s[2];
    return '';
  }
  function parseDay(s) {
    if (!s) return '';
    const p = String(s).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!p) return '';
    return p[1] + '-' + String(+p[2]).padStart(2, '0') + '-' + String(+p[3]).padStart(2, '0');
  }
  function esc(t) { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; }

  /* 计算到「记忆库」的相对路径（兼容子目录页面）*/
  function memHref() {
    try {
      const s = [...document.scripts].find(x => /profile\.js/.test(x.src));
      if (s) return s.src.replace(/profile\.js.*$/, '') + 'memory/';
    } catch (e) {}
    return 'memory/';
  }

  /* ==================== 统计 ==================== */
  function computeStats() {
    const tarot = getTarot(), yj = getYijing(), astro = getAstro();
    const cardCnt = {};
    tarot.forEach(r => {
      (String(r.cards || '').match(/[「]([^」]+)[」]/g) || []).forEach(m => {
        const n = m.replace(/[「」]/g, '');
        cardCnt[n] = (cardCnt[n] || 0) + 1;
      });
    });
    const topCards = Object.keys(cardCnt).sort((a, b) => cardCnt[b] - cardCnt[a]).slice(0, 3);
    const spCnt = {};
    tarot.forEach(r => { if (r.spread) spCnt[r.spread] = (spCnt[r.spread] || 0) + 1; });
    const topSpread = Object.keys(spCnt).sort((a, b) => spCnt[b] - spCnt[a])[0] || '';
    const guiCnt = {};
    yj.forEach(r => { const g = r.benName || r.ben; if (g) guiCnt[g] = (guiCnt[g] || 0) + 1; });
    const topGui = Object.keys(guiCnt).sort((a, b) => guiCnt[b] - guiCnt[a])[0] || '';
    /* 连续天数 */
    const days = new Set();
    tarot.forEach(r => { const d = parseDay(r.time) || parseDay(r.date); if (d) days.add(d); });
    yj.forEach(r => { const d = parseDay(r.date) || parseDay(r.time); if (d) days.add(d); });
    const sorted = [...days].sort();
    let best = 0, cur = 0, prev = '';
    sorted.forEach(d => {
      if (!prev) cur = 1;
      else {
        const gap = (new Date(d) - new Date(prev)) / 86400000;
        cur = gap === 1 ? cur + 1 : 1;
      }
      best = Math.max(best, cur); prev = d;
    });
    /* 集齐大阿尔卡纳 */
    const haveMaj = MAJ22.filter(n => cardCnt[n]);
    /* 最近时间 */
    const lastT = tarot[0] ? (tarot[0].time || tarot[0].date) : '';
    const lastY = yj[0] ? (yj[0].date || yj[0].time) : '';
    return {
      tarotCount: tarot.length, yjCount: yj.length, astroCount: astro.length,
      topCards, topSpread, topGui, streak: best, majCount: haveMaj.length,
      lastTime: lastT || lastY || '', tarot, yj
    };
  }

  /* ==================== 样式 ==================== */
  const PF_CSS = `
.pf-mask{position:fixed;inset:0;z-index:280;background:rgba(5,3,16,.5);
  backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);
  display:none;align-items:center;justify-content:center;padding:18px;animation:pfFade .28s ease}
@keyframes pfFade{from{opacity:0}to{opacity:1}}
.pf-modal{width:min(420px,95%);max-height:min(90vh,780px);overflow-y:auto;overscroll-behavior:contain;
  border-radius:26px;padding:22px 20px 18px;text-align:center;
  background:rgba(255,255,255,.105);
  backdrop-filter:blur(28px) saturate(190%);-webkit-backdrop-filter:blur(28px) saturate(190%);
  box-shadow:0 28px 72px rgba(4,2,18,.5), inset 0 1px 0 rgba(255,255,255,.28);
  animation:pfPop .4s cubic-bezier(.16,1,.3,1);color:#f2ede0;font-family:inherit}
@keyframes pfPop{from{opacity:0;transform:scale(.92) translateY(18px)}to{opacity:1;transform:none}}
.pf-modal *{box-sizing:border-box}
.pf-avatar{width:72px;height:72px;border-radius:50%;margin:4px auto 10px;position:relative;cursor:pointer;
  background:linear-gradient(135deg,#f0cf82,#c9a04c);color:#0a0815;font-size:1.7rem;font-weight:bold;
  display:flex;align-items:center;justify-content:center;overflow:hidden;background-size:cover;background-position:center;
  box-shadow:0 6px 22px rgba(240,207,130,.25);transition:.2s;user-select:none}
.pf-avatar:active{transform:scale(.95)}
.pf-avatar .pf-edit{position:absolute;right:0;bottom:0;width:24px;height:24px;border-radius:50%;
  background:rgba(10,8,21,.85);color:#f0cf82;font-size:.58rem;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(240,207,130,.4)}
.pf-name{font-size:1.05rem;color:#f0cf82;font-weight:600;letter-spacing:.1em;margin-bottom:3px}
.pf-since{font-size:.68rem;color:rgba(240,207,130,.45);margin-bottom:8px}
.pf-tags{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:4px}
.pf-tag{font-size:.66rem;padding:4px 11px;border-radius:999px;cursor:pointer;
  background:rgba(240,207,130,.12);color:#e8cf94;border:1px solid rgba(240,207,130,.25)}
.pf-tag:active{transform:scale(.96)}
.pf-sec{margin-top:16px;text-align:left}
.pf-sec h4{font-size:.72rem;color:rgba(240,207,130,.62);font-weight:600;letter-spacing:.2em;margin:0 0 9px}
.pf-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.pf-cell{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:13px;
  padding:9px 4px;text-align:center}
.pf-cell b{display:block;font-size:1rem;color:#f0cf82;font-weight:600;line-height:1.3}
.pf-cell span{font-size:.6rem;color:rgba(240,207,130,.45)}
.pf-cell.wide{grid-column:span 2}
.pf-line{font-size:.74rem;color:rgba(240,207,130,.72);line-height:1.75;margin-top:9px;
  background:rgba(255,255,255,.05);border-radius:12px;padding:9px 12px}
.pf-line em{color:#f0cf82;font-style:normal;font-weight:600}
.pf-badges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pf-badge{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:14px;
  padding:10px 4px;text-align:center;transition:.25s}
.pf-badge .ic{font-size:1.3rem;display:block;line-height:1.5;filter:grayscale(1);opacity:.35}
.pf-badge .tx{font-size:.58rem;color:rgba(240,207,130,.4);display:block;margin-top:3px}
.pf-badge.on{background:linear-gradient(165deg,rgba(255,238,196,.16),rgba(240,207,130,.06));
  border-color:rgba(240,207,130,.35);box-shadow:0 4px 16px rgba(240,207,130,.12)}
.pf-badge.on .ic{filter:none;opacity:1}
.pf-badge.on .tx{color:#e8cf94}
.pf-tl{display:flex;flex-direction:column;gap:6px}
.pf-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:12px;text-decoration:none;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);transition:.2s}
.pf-item:active{transform:scale(.98);background:rgba(240,207,130,.1)}
.pf-item .ic{flex:none;font-size:.95rem}
.pf-item .bd{flex:1;min-width:0;text-align:left}
.pf-item .tt{font-size:.74rem;color:#f2ede0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-item .dt{font-size:.6rem;color:rgba(240,207,130,.4);margin-top:2px}
.pf-empty{font-size:.7rem;color:rgba(240,207,130,.35);text-align:center;padding:12px 0}
.pf-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pf-btn{padding:11px;border-radius:13px;border:1px solid rgba(240,207,130,.22);cursor:pointer;
  background:rgba(255,255,255,.05);color:rgba(240,207,130,.8);font-family:inherit;font-size:.75rem;
  letter-spacing:.08em;transition:.2s}
.pf-btn:active{transform:scale(.97)}
.pf-btn.full{grid-column:span 2}
.pf-btn.danger{background:rgba(255,80,80,.09);color:rgba(255,140,140,.9);border-color:rgba(255,80,80,.25)}
.pf-foot{margin-top:14px;font-size:.72rem}
.pf-foot a{color:rgba(240,207,130,.45);text-decoration:none}
.pf-input-mask{position:fixed;inset:0;z-index:290;background:rgba(5,3,16,.55);
  backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
  display:none;align-items:center;justify-content:center;padding:24px}
.pf-input-box{width:min(320px,92%);border-radius:20px;padding:20px;
  background:rgba(30,24,50,.92);border:1px solid rgba(240,207,130,.22);
  box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center}
.pf-input-box h5{margin:0 0 12px;font-size:.82rem;color:#f0cf82;font-weight:600;letter-spacing:.1em}
.pf-input-box input{width:100%;padding:11px 13px;border-radius:12px;font-family:inherit;font-size:.85rem;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:#f2ede0;outline:none}
.pf-input-box input:focus{border-color:rgba(240,207,130,.5)}
.pf-input-row{display:flex;gap:8px;margin-top:14px}
.pf-input-row button{flex:1;padding:10px;border-radius:11px;font-family:inherit;font-size:.76rem;cursor:pointer;border:none}
.pf-input-cancel{background:rgba(255,255,255,.08);color:rgba(240,207,130,.65)}
.pf-input-ok{background:linear-gradient(165deg,rgba(255,238,196,.4),rgba(240,207,130,.18));color:#fffbef;font-weight:600}
`;

  /* ==================== HTML ==================== */
  const PF_HTML = `
<div class="pf-mask" id="pfMask">
  <div class="pf-modal" id="pfModal">
    <div class="pf-avatar" id="pfAvatar">?<span class="pf-edit">换</span></div>
    <input type="file" id="pfAvatarInput" accept="image/*" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:.01">
    <div class="pf-name" id="pfName">旅人</div>
    <div class="pf-since" id="pfSince"></div>
    <div class="pf-tags" id="pfTags"></div>

    <div class="pf-sec">
      <h4>占卜统计</h4>
      <div class="pf-grid">
        <div class="pf-cell"><b id="pfTarotN">0</b><span>塔罗</span></div>
        <div class="pf-cell"><b id="pfYjN">0</b><span>问卦</span></div>
        <div class="pf-cell"><b id="pfAstroN">0</b><span>观星</span></div>
        <div class="pf-cell"><b id="pfMajN">0/22</b><span>大牌</span></div>
        <div class="pf-cell wide"><b id="pfSpread">—</b><span>最常用牌阵</span></div>
        <div class="pf-cell wide"><b id="pfGui">—</b><span>最常问之卦</span></div>
      </div>
      <div class="pf-line" id="pfTopCards">你最常遇见：—</div>
      <div class="pf-line" id="pfLast">最近一次占卜：—</div>
    </div>

    <div class="pf-sec">
      <h4>成就徽章</h4>
      <div class="pf-badges" id="pfBadges"></div>
    </div>

    <div class="pf-sec">
      <h4>最近占卜</h4>
      <div class="pf-tl" id="pfTimeline"></div>
    </div>

    <div class="pf-sec">
      <h4>设置</h4>
      <div class="pf-actions">
        <button class="pf-btn" id="pfBtnName">修改昵称</button>
        <button class="pf-btn" id="pfBtnBirthday">设置生日</button>
        <button class="pf-btn full" id="pfBtnPwd">修改密码</button>
        <button class="pf-btn full danger" id="pfBtnOut">退出登录</button>
      </div>
    </div>

    <div class="pf-foot"><a href="#" id="pfClose">关闭</a></div>
  </div>
</div>
<div class="pf-input-mask" id="pfInputMask">
  <div class="pf-input-box">
    <h5 id="pfInputTitle">编辑</h5>
    <input id="pfInputVal" type="text">
    <div class="pf-input-row">
      <button class="pf-input-cancel" id="pfInputCancel">取消</button>
      <button class="pf-input-ok" id="pfInputOk">确定</button>
    </div>
  </div>
</div>
`;

  /* ==================== 小弹层输入 ==================== */
  let inputCb = null;
  function askInput(title, value, type, cb) {
    $('pfInputTitle').textContent = title;
    const inp = $('pfInputVal');
    inp.type = type || 'text';
    inp.value = value || '';
    $('pfInputMask').style.display = 'flex';
    inputCb = cb;
    setTimeout(() => inp.focus(), 120);
  }
  function closeInput() { $('pfInputMask').style.display = 'none'; inputCb = null; }

  /* ==================== 渲染 ==================== */
  let curUser = null;

  async function render() {
    try { curUser = await getCurrentUser(); } catch (e) { curUser = null; }
    const mem = getMem();
    const st = computeStats();

    /* 基础信息 */
    const emailPrefix = (curUser?.email || '旅人').split('@')[0];
    const displayName = curUser?.user_metadata?.display_name || mem?.user?.name || emailPrefix;
    $('pfName').textContent = displayName;
    const av = curUser?.user_metadata?.avatar || null;
    const avEl = $('pfAvatar');
    if (av) { avEl.style.backgroundImage = 'url(' + av + ')'; avEl.innerHTML = '<span class="pf-edit">换</span>'; }
    else { avEl.style.backgroundImage = ''; avEl.innerHTML = esc(displayName[0].toUpperCase()) + '<span class="pf-edit">换</span>'; }

    /* 加入时间 */
    let sinceTxt = '';
    if (curUser?.created_at) {
      const d = new Date(curUser.created_at);
      sinceTxt = '你于 ' + d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月加入有点困';
    } else if (mem?.user?.createdAt) {
      const d = new Date(mem.user.createdAt);
      sinceTxt = '你于 ' + d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月加入有点困';
    } else {
      sinceTxt = '欢迎来到有点困';
    }
    $('pfSince').textContent = sinceTxt;

    /* 标签：星座 */
    const birthday = mem?.user?.birthday || '';
    const zodiac = mem?.user?.zodiac || zodiacOf(birthday);
    const tags = [];
    if (zodiac) tags.push('✦ ' + zodiac);
    if (st.streak >= 2) tags.push('🔥 连续 ' + st.streak + ' 天');
    $('pfTags').innerHTML = tags.length
      ? tags.map(t => '<span class="pf-tag">' + esc(t) + '</span>').join('')
      : '<span class="pf-tag" id="pfTagBirth">＋ 设置生日，看看你的星座</span>';

    /* 统计 */
    $('pfTarotN').textContent = st.tarotCount;
    $('pfYjN').textContent = st.yjCount;
    $('pfAstroN').textContent = st.astroCount;
    $('pfMajN').textContent = st.majCount + '/22';
    $('pfSpread').textContent = st.topSpread || '—';
    $('pfGui').textContent = st.topGui || '—';
    $('pfTopCards').innerHTML = st.topCards.length
      ? '你最常遇见：' + st.topCards.map(c => '<em>' + esc(c) + '</em>').join('、')
      : '你还没有抽过牌，去塔罗看看？';
    $('pfLast').innerHTML = st.lastTime ? '最近一次占卜：<em>' + esc(st.lastTime) + '</em>' : '最近一次占卜：还不曾有';

    /* 徽章 */
    const badges = [
      { ic: '🌙', tx: '初入星海', on: st.tarotCount >= 1 },
      { ic: '☯', tx: '问卦者', on: st.yjCount >= 1 },
      { ic: '🔥', tx: '连续 7 天', on: st.streak >= 7 },
      { ic: '🃏', tx: '愚者之旅', on: st.majCount >= 22 },
      { ic: '💯', tx: '百次占卜', on: (st.tarotCount + st.yjCount) >= 100 },
      { ic: '✨', tx: '星尘使者', on: st.astroCount >= 1 }
    ];
    $('pfBadges').innerHTML = badges.map(b =>
      '<div class="pf-badge' + (b.on ? ' on' : '') + '"><span class="ic">' + b.ic + '</span><span class="tx">' + b.tx + '</span></div>'
    ).join('');

    /* 时间轴 */
    const items = [];
    st.tarot.slice(0, 10).forEach(r => {
      const names = (String(r.cards || '').match(/[「]([^」]+)[」]/g) || []).map(m => m.replace(/[「」]/g, ''));
      items.push({ ic: '☽', t: names.slice(0, 3).join('、') || (r.spread || '塔罗占卜'), d: r.time || r.date || '', ts: r.time || r.date || '' });
    });
    st.yj.slice(0, 10).forEach(r => {
      const g = (r.benName || '') + ((r.bianName && r.bianName !== r.benName) ? ' → ' + r.bianName : '');
      items.push({ ic: '☯', t: g ? ('问卦 · ' + g) : '易经问卦', d: r.date || r.time || '', ts: r.date || r.time || '' });
    });
    items.sort((a, b) => (parseDay(b.ts) || '').localeCompare(parseDay(a.ts) || ''));
    const top10 = items.slice(0, 10);
    $('pfTimeline').innerHTML = top10.length
      ? top10.map(it =>
        '<a class="pf-item" href="' + memHref() + '"><span class="ic">' + it.ic + '</span><span class="bd"><span class="tt">' +
        esc(it.t) + '</span><span class="dt">' + esc(it.d) + '</span></span></a>'
      ).join('')
      : '<div class="pf-empty">还没有占卜记录</div>';
  }

  /* ==================== 打开 / 关闭 ==================== */
  function openProfile() {
    if (!document.getElementById('pfMask')) {
      const s = document.createElement('style'); s.textContent = PF_CSS; document.head.appendChild(s);
      document.body.insertAdjacentHTML('beforeend', PF_HTML);
      bind();
    }
    $('pfMask').style.display = 'flex';
    $('pfModal').scrollTop = 0;
    render();
  }
  window.openProfile = openProfile;

  function bind() {
    $('pfClose').addEventListener('click', e => { e.preventDefault(); $('pfMask').style.display = 'none'; });
    $('pfMask').addEventListener('click', e => { if (e.target === $('pfMask')) $('pfMask').style.display = 'none'; });

    /* 头像 */
    $('pfAvatar').addEventListener('click', () => $('pfAvatarInput').click());
    $('pfAvatarInput').addEventListener('change', async () => {
      const f = $('pfAvatarInput').files[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) { toast('图片太大了，换张小一点的'); return; }
      toast('头像上传中…');
      try {
        const url = await window.uploadAvatar(f);
        $('pfAvatar').style.backgroundImage = 'url(' + url + ')';
        $('pfAvatar').innerHTML = '<span class="pf-edit">换</span>';
        toast('头像已更新 ✨');
      } catch (e) { toast('上传失败：' + (e.message || '再试试')); }
      $('pfAvatarInput').value = '';
    });

    /* 昵称 */
    $('pfBtnName').addEventListener('click', () => {
      askInput('修改昵称', $('pfName').textContent, 'text', async v => {
        v = (v || '').trim();
        if (!v) { toast('昵称不能为空'); return; }
        try {
          const sb = await initSupabase();
          await sb.auth.updateUser({ data: { display_name: v } });
          const mem = getMem(); if (!mem.user) mem.user = {}; mem.user.name = v; saveMem(mem);
          document.cookie = 'auth_name=' + encodeURIComponent(v) + ';path=/;max-age=31536000';
          $('pfName').textContent = v;
          toast('昵称已更新');
        } catch (e) { toast('更新失败：' + (e.message || '再试试')); }
      });
    });

    /* 生日 → 星座 */
    $('pfBtnBirthday').addEventListener('click', () => {
      askInput('设置生日（如 1998-05-20）', getMem()?.user?.birthday || '', 'text', v => {
        v = (v || '').trim();
        if (!v) { toast('请输入生日'); return; }
        const z = zodiacOf(v);
        const mem = getMem(); if (!mem.user) mem.user = {};
        mem.user.birthday = v; mem.user.zodiac = z; saveMem(mem);
        toast(z ? '星座已点亮：' + z : '已保存');
        render();
      });
    });
    $('pfTags').addEventListener('click', e => {
      if (e.target && e.target.id === 'pfTagBirth') $('pfBtnBirthday').click();
    });

    /* 密码 */
    $('pfBtnPwd').addEventListener('click', () => {
      askInput('设置新密码（至少 6 位）', '', 'password', async v => {
        if (!v || v.length < 6) { toast('密码至少 6 位'); return; }
        try { await setPassword(v); toast('密码已更新，下次用新密码登录'); }
        catch (e) { toast('修改失败：' + (e.message || '再试试')); }
      });
    });

    /* 退出登录 */
    $('pfBtnOut').addEventListener('click', async () => {
      try { await uploadSnapshot(); } catch (e) {}
      sessionStorage.removeItem('cloud_restored');
      try { await signOut(); } catch (e) {}
      location.reload();
    });

    /* 小弹层按钮 */
    $('pfInputCancel').addEventListener('click', closeInput);
    $('pfInputMask').addEventListener('click', e => { if (e.target === $('pfInputMask')) closeInput(); });
    $('pfInputOk').addEventListener('click', () => {
      const v = $('pfInputVal').value;
      const cb = inputCb; closeInput(); if (cb) cb(v);
    });
    $('pfInputVal').addEventListener('keydown', e => {
      if (e.key === 'Enter') { const v = $('pfInputVal').value; const cb = inputCb; closeInput(); if (cb) cb(v); }
    });
  }
})();
