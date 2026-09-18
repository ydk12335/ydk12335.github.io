/* ================================================================
   便签墙 · 画布版（可拖动 / 缩放 / 自由摆放）
   数据：localStorage['wish_tree_v1']
   功能：多墙(tab) / 公开·私密 / 放大查看 / 评论 / 我的便签 / 找便签 / 画布自由摆放
   ================================================================ */
const LS_KEY = 'wish_tree_v1';
const $ = id => document.getElementById(id);

/* ---------- 数据 ---------- */
/* 每个类型固定色相（淡色手绘风），深浅 3 档：浅 / 标准 / 深。默认取「标准」档 */
const TYPE_META = {
  bless:    { name: '祝福',  shades: ['#fff3d6', '#ffe08a', '#f5c34d'] },
  story:    { name: '故事',  shades: ['#e3eeff', '#b8d4ff', '#7fa9e0'] },
  relation: { name: '关系',  shades: ['#f3e6ff', '#e0b8ff', '#b98ae0'] },
  heart:    { name: '心事',  shades: ['#ffe8f0', '#ffd0de', '#f290b0'] }
};
/* 「关系」细分类型：选中关系后显示二级选择，各细分配独立色相（淡色手绘风） */
const REL_SUBS = {
  couple:  { name: '情侣', shades: ['#f3e6ff', '#e0b8ff', '#b98ae0'] },  // 紫
  friend:  { name: '朋友', shades: ['#e4f3ff', '#bfe0ff', '#7fb5e8'] },  // 青蓝
  family:  { name: '家人', shades: ['#ffece0', '#ffd0b0', '#f2a06a'] },  // 暖橙
  crush:   { name: '暗恋', shades: ['#fde6f2', '#f9c4e0', '#e88ab5'] }   // 粉紫
};
const REL_SUB_KEYS = Object.keys(REL_SUBS);
const SHADE_LABELS = ['浅', '标准', '深'];
/* 便签颜色由类型决定色相 + 深浅档；旧数据没存深浅就按标准档 */
const noteColor = c => {
  let meta = TYPE_META[c.type] || TYPE_META.bless;
  if (c.type === 'relation' && c.sub && REL_SUBS[c.sub]) meta = REL_SUBS[c.sub];
  const idx = (c.shade != null ? c.shade : 1);
  return meta.shades[idx] || meta.shades[1];
};
/* 类型显示名：关系带细分名 */
const typeName = c => {
  if (c.type === 'relation' && c.sub && REL_SUBS[c.sub]) return REL_SUBS[c.sub].name;
  return (TYPE_META[c.type] || TYPE_META.bless).name;
};
let curShade = 1;   // 当前选中深浅档（0 浅 / 1 标准 / 2 深）
const MAX_CARDS = 500;

/* ---------- 云端公开便签同步（Supabase wish_notes 表） ---------- */
async function getSbClient() {
  try { if (typeof initSupabase !== 'function') return null; return await initSupabase(); } catch (e) { return null; }
}
async function getCurUser() {
  const sb = await getSbClient(); if (!sb) return null;
  try { const { data: { session } } = await sb.auth.getSession(); return session?.user ?? null; } catch (e) { return null; }
}
/* 加载时拉取云端便签：公开所有人可见；登录用户额外拉自己作者/搭档的私密便签 */
async function pullCloudNotes() {
  const sb = await getSbClient(); if (!sb) return;
  try {
    const meId = meInfo.userId;
    let q = sb.from('wish_notes').select('*').order('created_at', { ascending: false }).limit(300);
    if (meId) {
      q = q.or(`vis.eq.public,user_id.eq.${meId},partner_id.eq.${meId}`);
    } else {
      q = q.eq('vis', 'public');
    }
    const { data: rows, error } = await q;
    if (error) { console.warn('[wish-tree] 拉取公开便签失败', error.message); return; }
    if (!rows || !rows.length) return;
    const local = loadCards();
    const ids = new Set(local.map(c => c.id));
    const merged = local.slice();
    let added = 0;
    rows.forEach(r => {
      if (ids.has(r.id)) return;
      merged.push({
        id: r.id, type: r.type, title: r.title || '无题', content: r.content || '',
        author: r.author || '', vis: r.vis, owner: r.owner || '', createdAt: r.created_at,
        comments: r.comments || [], shade: r.shade != null ? r.shade : (r.color ? 1 : 1),
        anon: !!r.anon, avatar: r.avatar || '',
        sub: r.sub || '', partner_id: r.partner_id || '', partner_name: r.partner_name || '',
        partner_avatar: r.partner_avatar || '', invite_code: r.invite_code || '',
        x: r.x != null ? r.x : undefined, y: r.y != null ? r.y : undefined,
        r: r.r != null ? r.r : undefined
      });
      ids.add(r.id); added++;
    });
    if (added) { saveCards(merged); cards = loadCards(); renderWall(); }
  } catch (e) { console.warn('[wish-tree] 拉取公开便签异常', e); }
}
/* 上传一张便签到云端（公开/私密都传；私密只有自己能读到）
   注意：仅作者本人可全量上传（含 user_id），搭档/他人一律不走这里，避免覆盖 user_id */
async function pushNoteCloud(c) {
  const sb = await getSbClient(); if (!sb) return;
  const user = await getCurUser();
  if (!user) return false;   // 未登录不传（本地保留）
  if (!isMine(c)) return false;  // 非本人便签禁止全量上传（防止篡改归属）
  try {
    const { error } = await sb.from('wish_notes').upsert({
      id: c.id, user_id: user.id, type: c.type, title: c.title, content: c.content,
      author: c.author, vis: c.vis, shade: c.shade != null ? c.shade : 1,
      anon: !!c.anon, avatar: c.avatar || '',
      sub: c.sub || '', partner_id: c.partner_id || null, partner_name: c.partner_name || '',
      partner_avatar: c.partner_avatar || '', invite_code: c.invite_code || '',
      x: c.x ?? null, y: c.y ?? null, r: c.r ?? null,
      comments: c.comments || [], owner: c.owner || ''
    }, { onConflict: 'id' });
    if (error) console.warn('[wish-tree] 上传便签失败', error.message);
  } catch (e) { console.warn('[wish-tree] 上传便签异常', e); }
}
/* 上传/删除评论（公开便签的评论也上云；作者和搭档都能同步，RLS 兜底权限） */
async function syncCommentsCloud(c) {
  const sb = await getSbClient(); if (!sb) return;
  const user = await getCurUser(); if (!user) return;
  if (!canEdit(c)) return;   // 仅本人/搭档可同步评论
  try {
    const { error } = await sb.from('wish_notes')
      .update({ comments: c.comments || [] }).eq('id', c.id);
    if (error) console.warn('[wish-tree] 同步评论失败', error.message);
  } catch (e) {}
}
async function deleteNoteCloud(id) {
  const sb = await getSbClient(); if (!sb) return;
  const user = await getCurUser(); if (!user) return;
  try {
    /* 仅作者本人可删（RLS 兜底：auth.uid() = user_id） */
    const { error } = await sb.from('wish_notes').delete().eq('id', id).eq('user_id', user.id);
    if (error) console.warn('[wish-tree] 删除云端便签失败', error.message);
  } catch (e) {}
}
/* ---------- 双人邀请（关系便签） ---------- */
/* 生成 8 位邀请码（大写字母+数字，去除易混字符） */
function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
/* 当前用户是否是便签的「搭档」（对方或本人） */
function isPartner(c) {
  if (!c) return false;
  return meInfo.userId && (c.partner_id === meInfo.userId);
}
/* 双人共签：本人 / 搭档都算「可操作」 */
function canEdit(c) { return isMine(c) || isPartner(c); }
/* 接受邀请：调用 SECURITY DEFINER RPC 把当前用户设为搭档 */
async function acceptInviteByCode(code) {
  const sb = await getSbClient(); if (!sb) return { ok: false, msg: '未登录' };
  const user = await getCurUser(); if (!user) return { ok: false, msg: '未登录' };
  try {
    const { data, error } = await sb.rpc('accept_invite', {
      p_code: (code || '').trim().toUpperCase(),
      p_name: meInfo.name || '',
      p_avatar: meInfo.avatar || ''
    });
    if (error) return { ok: false, msg: error.message };
    if (!data) return { ok: false, msg: '邀请码无效或已失效' };
    return { ok: true, noteId: data };
  } catch (e) { return { ok: false, msg: String(e) }; }
}
/* 把邀请码复制到剪贴板（移动端优先 Clipboard API，失败则选中文本提示） */
async function copyInviteCode(code) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code);
      hint('邀请码已复制：' + code);
      return;
    }
  } catch (e) {}
  const ta = document.createElement('textarea');
  ta.value = code; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); hint('邀请码已复制：' + code); } catch (e) { hint('邀请码：' + code); }
  document.body.removeChild(ta);
}

function loadCards() {
  try { const a = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function saveCards(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {}
}
function uid() { return 'wt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

/* ================================================================
   内容过滤器：①敏感词 ②网址/联系方式 ③塔罗类禁问问题
   命中返回 { bad:true, msg:'提示文案' }；未命中返回 { bad:false }
   ================================================================ */
const FILTER_MSG = '内容里包含不能发布的内容，换一句话试试吧';
/* ① 敏感词（通用 + 人身攻击 + 色情 + 暴力 + 违禁） */
const BAD_WORDS = [
  '傻逼', '煞笔', '沙比', '脑残', '智障', '弱智', '白痴', '蠢货', '废物', '垃圾货',
  '操你妈', '草泥马', '去死', '滚蛋', '贱人', '婊子', '妓女', '嫖娼', '卖淫',
  '杀人', '自杀', '贩毒', '吸毒', '毒品', '枪支', '炸药', '炸弹', '恐怖袭击',
  '共产党', '习大大', '法轮功', '台独', '藏独', '疆独', '邪教', '传销',
  '赌博', '赌场', '博彩', '开奖', '六合彩', '彩票预测', '翻墙', 'VPN破解', '破解版', '外挂', '代刷'
];
/* ② 网址/联系方式（http/https/www/域名/邮箱/QQ号/手机号） */
const URL_RE = /(https?:\/\/|www\.)[^\s\u4e00-\u9fa5，。！？；：、（）()""''\s]+/i;
const DOMAIN_RE = /[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?/i;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const QQ_RE = /(^|[^0-9])([1-9][0-9]{5,10})([^0-9]|$)/;
const PHONE_RE = /(^|[^0-9])(1[3-9][0-9]{9})([^0-9]|$)/;
/* ③ 塔罗类禁问：生死寿命 / 疾病确诊 / 具体时间点 / 投机赌博 / 诅咒害人 */
const TAROT_BAD = [
  '死', '死亡', '去世', '寿命', '活多久', '活几年', '何时死', '能不能活', '会不会死',
  '自杀', '杀人', '癌症', '肿瘤', '绝症', '重病', '疾病确诊', '确诊', '寿命多久',
  '什么时候', '何时', '几点', '几号', '哪一天', '哪天', '哪年',
  '彩票', '中奖', '赌博', '赌', '买马', '股票', '基金涨停', '稳赚', '暴富',
  '诅咒', '下降头', '害人', '整人', '报复', '拆散'
];
/* 综合检查：text 命中任一规则返回 { bad, msg } */
function checkContent(text) {
  const s = String(text || '');
  if (!s.trim()) return { bad: false };
  /* 敏感词精确命中 */
  for (const w of BAD_WORDS) {
    if (s.includes(w)) return { bad: true, msg: '内容里包含敏感词，不能发布' };
  }
  /* 网址 / 联系方式 */
  if (URL_RE.test(s)) return { bad: true, msg: '不能发布网址链接哦' };
  if (EMAIL_RE.test(s)) return { bad: true, msg: '不能发布邮箱/联系方式哦' };
  if (PHONE_RE.test(s)) return { bad: true, msg: '不能发布手机号哦' };
  if (QQ_RE.test(s)) return { bad: true, msg: '不能发布QQ号哦' };
  /* 纯域名（如 abc.com）单独判断，避免误杀正常中文 */
  const noCn = s.replace(/[\u4e00-\u9fa5]/g, '');
  if (DOMAIN_RE.test(noCn)) return { bad: true, msg: '不能发布网址链接哦' };
  /* 塔罗禁问 */
  for (const w of TAROT_BAD) {
    if (s.includes(w)) return { bad: true, msg: '这类问题不方便在这里问哦' };
  }
  return { bad: false };
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- 状态 ---------- */
let cards = loadCards();
let curWall = 'all';
let curVis = 'public';
let curAnon = false;         // 是否匿名（匿名不显示头像和名字）
let meInfo = { name: '', avatar: '', userId: '' };   // 当前登录用户信息（未登录为空）
let zoomId = null;
let cmtAnon = false;         // 当前评论文是否匿名
let hintTimer = null;
let placeMode = false;      // 放置模式：点画布贴上去
let pending = null;         // 等待放置的新便签数据
const NOTE_W = 190, NOTE_H = 238;

/* 启动时读取登录用户信息（名字 / 头像） */
async function loadMe() {
  try {
    if (typeof getCurrentUser !== 'function') return;
    const user = await getCurrentUser();
    if (!user) return;
    const md = user.user_metadata || {};
    meInfo.name = (md.display_name || '').trim();
    meInfo.avatar = (md.avatar || '').trim();
    meInfo.userId = user.id || '';
  } catch (e) { console.warn('[wish-tree] 读取用户信息失败', e); }
}

/* 画布视图状态 */
let scale = 1, tx = 0, ty = 0;
const canvasEl = () => $('canvas');
const viewportEl = () => $('viewport');
function applyTransform() {
  canvasEl().style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  $('zoomLbl').textContent = Math.round(scale * 100) + '%';
}
function screenToCanvas(px, py) {
  const r = viewportEl().getBoundingClientRect();
  return { x: (px - r.left - tx) / scale, y: (py - r.top - ty) / scale };
}
/* ---------- 渲染墙 ---------- */
const ROTS = [-1.6, 1.1, -0.8, 1.8, 0, -1.2, 0.9, -0.5];
/* 便签默认位置：基于 id 的确定性伪随机，散落全画布，不都堆左上角 */
function defaultPos(c) {
  let h = 0;
  const s = String(c.id || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const x = 80 + (h % 52) * 55;   // 80 ~ 2940，便签不超出画布
  const y = 80 + ((h >>> 8) % 38) * 50;   // 80 ~ 1930，便签不超出画布
  return { x, y };
}
function makeNoteEl(c, i) {
  const el = document.createElement('div');
  el.className = 'wt-note';
  el.dataset.id = c.id;
  const dp = defaultPos(c);
  el.style.left = (c.x || dp.x) + 'px';
  el.style.top = (c.y || dp.y) + 'px';
  el.style.background = `linear-gradient(165deg, ${noteColor(c)}, ${shade(noteColor(c), -22)})`;
  el.style.transform = `rotate(${(c.r != null ? c.r : ROTS[i % ROTS.length])}deg)`;
  const lock = c.vis === 'private' ? '私密 · ' : '';
  el.innerHTML = `
    <div class="ic">${typeName(c)}</div>
    <div class="tt">${esc(c.title || '无题')}</div>
    <div class="ct">${esc((c.content || '').slice(0, 40))}${(c.content || '').length > 40 ? '…' : ''}</div>
    <div class="au">${authorHTML(c)}${partnerHTML(c)}<span class="au-dt">${lock}${fmtDate(c.createdAt).slice(5, 16)}</span></div>
    <div class="wcurl"></div>`;
  el.onclick = e => { e.stopPropagation(); openZoom(c.id); };
  return el;
}
/* 作者信息条：匿名 → 只显示「匿名」；否则显示头像 + 名字 */
function authorHTML(c) {
  if (c.anon) return `<span class="av av-anon">匿</span><span class="au-nm">匿名</span>`;
  const name = (c.author || '').trim() || '匿名';
  const av = (c.avatar || '').trim();
  if (av) return `<span class="av" style="background-image:url('${esc(av)}')"></span><span class="au-nm">${esc(name)}</span>`;
  const ch = [...name][0] || '匿';
  const hue = (c.id ? [...c.id].reduce((s, x) => s + x.charCodeAt(0), 0) : 0) % 360;
  return `<span class="av av-letter" style="background:hsl(${hue},55%,62%)">${esc(ch)}</span><span class="au-nm">${esc(name)}</span>`;
}
/* 双人共签：有搭档时在作者条上追加搭档头像+名字（左右并排） */
function partnerHTML(c) {
  if (!c.partner_id || !c.partner_name) return '';
  const nm = c.partner_name || '搭档';
  const av = (c.partner_avatar || '').trim();
  if (av) return `<span class="av av-partner" style="background-image:url('${esc(av)}')"></span><span class="au-nm">${esc(nm)}</span>`;
  const ch = [...nm][0] || '搭';
  const hue = (c.partner_id ? [...c.partner_id].reduce((s, x) => s + x.charCodeAt(0), 0) : 0) % 360;
  return `<span class="av av-partner av-letter" style="background:hsl(${hue},55%,62%)">${esc(ch)}</span><span class="au-nm">${esc(nm)}</span>`;
}
function renderWall() {
  const wall = canvasEl();
  wall.querySelectorAll('.wt-note').forEach(n => n.remove());
  let list = cards.filter(c => canSee(c));
  if (curWall !== 'all') list = list.filter(c => c.type === curWall);
  list = list.slice().reverse();
  list.forEach((c, i) => wall.appendChild(makeNoteEl(c, i)));
}

/* ---------- 放大查看 ---------- */
function openZoom(id) {
  const c = cards.find(x => x.id === id);
  if (!c || !canSee(c)) return;
  zoomId = id;
  const card = $('zoomCard');
  card.style.background = `linear-gradient(165deg, ${noteColor(c)}, ${shade(noteColor(c), -22)})`;
  $('zType').textContent = typeName(c) + ' · ' + (c.vis === 'private' ? '私密' : '公开');
  $('zTitle').textContent = c.title || '无题';
  $('zContent').textContent = c.content || '';
  $('zAuthor').innerHTML = authorHTML(c) + partnerHTML(c);
  $('zDate').textContent = fmtDate(c.createdAt);
  $('zBadge').textContent = c.vis === 'private' ? '私密' : '公开';
  $('zDel').style.display = isMine(c) ? 'inline-block' : 'none';   // 删除仅作者本人
  /* 双人共签区：关系便签未绑定搭档 → 显示邀请码（本人可复制）；已绑定 → 显示搭档名 */
  const inviteBox = $('zInvite');
  if (c.type === 'relation' && !c.partner_id) {
    if (!c.invite_code) { c.invite_code = genInviteCode(); saveCards(cards); pushNoteCloud(c); }
    inviteBox.style.display = '';
    $('zInviteCode').textContent = c.invite_code;
    $('zInviteTip').textContent = isMine(c) ? '把邀请码发给 TA，接受后你们共用这张便签' : '输入邀请码加入这张便签';
    $('zInviteCopy').style.display = isMine(c) ? '' : 'none';
    $('zInviteAccept').style.display = isMine(c) ? 'none' : '';
  } else {
    inviteBox.style.display = 'none';
  }
  renderComments(c);
  $('zCmtText').value = '';
  $('cmtAnonBtn').classList.remove('on');
  cmtAnon = false;
  $('zoomMask').classList.add('show');
}
function closeZoom() { $('zoomMask').classList.remove('show'); zoomId = null; }
/* 删除便签（本地 + 云端），仅本人可见删除按钮 */
function deleteNote() {
  const c = cards.find(x => x.id === zoomId);
  if (!c || !isMine(c)) return;
  if (!confirm('确定删除这张便签吗？')) return;
  cards = cards.filter(x => x.id !== c.id);
  saveCards(cards);
  deleteNoteCloud(c.id);   // 登录用户：同步删除云端
  closeZoom();
  renderWall();
  hint('已删除');
}

/* ---------- 画布拖拽 / 缩放 ---------- */
function initCanvas() {
  const cv = canvasEl(), vp = viewportEl();
  let dragging = false, sx = 0, sy = 0, stx = 0, sty = 0, moved = false, pinchDist = null;
  vp.addEventListener('mousedown', e => {
    if (e.target.closest('.wt-note')) return;
    dragging = true; moved = false;
    sx = e.clientX; sy = e.clientY; stx = tx; sty = ty;
    cv.classList.add('dragging');
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    tx = stx + dx; ty = sty + dy;
    applyTransform();
  });
  window.addEventListener('mouseup', () => { dragging = false; cv.classList.remove('dragging'); });
  vp.addEventListener('touchstart', e => {
    if (e.touches.length === 2) { pinchDist = null; return; }
    if (e.touches.length !== 1) return;
    if (e.target.closest('.wt-note')) return;
    dragging = true; moved = false;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; stx = tx; sty = ty;
    cv.classList.add('dragging');
  }, { passive: true });
  vp.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      // 双指捏合缩放
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinchDist == null) { pinchDist = d; return; }
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(cx, cy, d / pinchDist);
      pinchDist = d;
      return;
    }
    if (!dragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    tx = stx + dx; ty = sty + dy;
    applyTransform();
  }, { passive: true });
  vp.addEventListener('touchend', () => { dragging = false; pinchDist = null; cv.classList.remove('dragging'); });
  // 滚轮缩放
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    zoomAt(e.clientX, e.clientY, factor);
  }, { passive: false });
  // 双击画布空白处放置（仅放置模式）
  vp.addEventListener('click', e => {
    if (!placeMode) return;
    if (e.target.closest('.wt-note')) return;
    placeAt(e.clientX, e.clientY);
  });
}
function zoomAt(px, py, factor) {
  const r = viewportEl().getBoundingClientRect();
  const cx = px - r.left, cy = py - r.top;
  const ns = Math.max(0.12, Math.min(3, scale * factor));
  const k = ns / scale;
  tx = cx - (cx - tx) * k;
  ty = cy - (cy - ty) * k;
  scale = ns;
  applyTransform();
}
function zoomBy(f) { zoomAt(innerWidth / 2, innerHeight / 2, f); }
function fitAll() {
  const list = cards.filter(c => canSee(c));
  if (!list.length) { scale = 0.5; tx = 60; ty = 160; applyTransform(); return; }
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  list.forEach(c => {
    const dp = defaultPos(c);
    const x = c.x || dp.x, y = c.y || dp.y;
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + NOTE_W); maxY = Math.max(maxY, y + NOTE_H);
  });
  const vw = innerWidth - 60, vh = innerHeight - 220;
  scale = Math.max(0.12, Math.min(1, Math.min(vw / (maxX - minX || 1), vh / (maxY - minY || 1))));
  tx = 30 - minX * scale;
  ty = 160 - minY * scale;
  applyTransform();
}

/* ---------- 放置模式 ---------- */
function enterPlace(c) {
  pending = c;
  placeMode = true;
  canvasEl().classList.add('place');
  $('placeBar').classList.add('show');
  hint('填好了！在画布上点一下，把便签贴到那个位置');
}
function exitPlace() {
  pending = null; placeMode = false;
  canvasEl().classList.remove('place');
  $('placeBar').classList.remove('show');
}
function placeAt(px, py) {
  if (!pending) { exitPlace(); return; }
  const pos = screenToCanvas(px, py);
  pending.x = Math.round(pos.x - NOTE_W / 2);
  pending.y = Math.round(pos.y - NOTE_H / 2);
  cards.push(pending);
  if (cards.length > MAX_CARDS) cards = cards.slice(-MAX_CARDS);
  saveCards(cards);
  const c = pending;
  exitPlace();
  renderWall();
  pushNoteCloud(c);   // 登录用户：同步上传云端（公开/私密都传，RLS 控制可见）
  hint('贴好啦');
}
/* 渲染「关系」细分选择器（选中类型是关系时显示，否则隐藏） */
function renderSubSel() {
  const box = $('subSel');
  if (!box) return;
  const type = document.querySelector('#typeSel .wt-type.on')?.dataset.t || 'bless';
  if (type !== 'relation') { box.style.display = 'none'; return; }
  box.style.display = '';
  box.innerHTML = REL_SUB_KEYS.map((k, i) => {
    const meta = REL_SUBS[k];
    const on = i === 0 ? ' on' : '';
    return `<div class="wt-sub${on}" data-s="${k}" style="--subc:${meta.shades[1]}">${meta.name}</div>`;
  }).join('');
  box.querySelectorAll('.wt-sub').forEach(d => {
    d.onclick = () => {
      document.querySelectorAll('#subSel .wt-sub').forEach(x => x.classList.remove('on'));
      d.classList.add('on');
      renderShadeSel();
    };
  });
}
/* 渲染深浅选择器：当前类型的 3 档颜色，选中档高亮 */
function renderShadeSel() {
  const sel = $('shadeSel');
  if (!sel) return;
  const type = document.querySelector('#typeSel .wt-type.on')?.dataset.t || 'bless';
  let meta = TYPE_META[type] || TYPE_META.bless;
  if (type === 'relation') {
    const sub = document.querySelector('#subSel .wt-sub.on')?.dataset.s || 'couple';
    meta = REL_SUBS[sub] || REL_SUBS.couple;
  }
  sel.innerHTML = meta.shades.map((col, i) =>
    `<div class="wt-shade${i === curShade ? ' on' : ''}" data-i="${i}" style="background:${col}"><span>${SHADE_LABELS[i]}</span></div>`
  ).join('');
  sel.querySelectorAll('.wt-shade').forEach(d => {
    d.onclick = () => {
      document.querySelectorAll('#shadeSel .wt-shade').forEach(x => x.classList.remove('on'));
      d.classList.add('on');
      curShade = +d.dataset.i;
    };
  });
}
/* ---------- 写便签 ---------- */
function openAdd() {
  $('addTitle').value = ''; $('addContent').value = '';
  $('addCnt').textContent = '0';
  curVis = 'public';
  curAnon = false;
  curShade = 1;
  $('anonBtn').classList.remove('on');
  $('anonBtn').textContent = '不匿名';
  document.querySelectorAll('.wt-vis-btn').forEach(b => b.classList.toggle('on', b.dataset.v === 'public'));
  document.querySelectorAll('#subSel .wt-sub').forEach(b => b.classList.toggle('on', b.dataset.s === 'couple'));
  renderSubSel();
  renderShadeSel();
  showMask('addMask');
}
function submitAdd() {
  const title = $('addTitle').value.trim();
  const content = $('addContent').value.trim();
  if (!title && !content) { hint('写点什么再贴呀'); return; }
  /* 内容过滤：标题 + 内容任一命中都拦截 */
  const tChk = checkContent(title);
  if (tChk.bad) { hint(tChk.msg || FILTER_MSG); return; }
  const cChk = checkContent(content);
  if (cChk.bad) { hint(cChk.msg || FILTER_MSG); return; }
  const type = document.querySelector('#typeSel .wt-type.on')?.dataset.t || 'bless';
  const sub = (type === 'relation') ? (document.querySelector('#subSel .wt-sub.on')?.dataset.s || 'couple') : '';
  const anon = curAnon;
  const c = {
    id: uid(), type, sub, shade: curShade, title: title || '无题', content,
    author: anon ? '匿名' : (meInfo.name || '匿名'),
    anon,
    avatar: (!anon && meInfo.avatar) ? meInfo.avatar : '',
    vis: curVis, owner: myOwner(), createdAt: new Date().toISOString(), comments: [],
    partner_id: '', partner_name: '', partner_avatar: '', invite_code: ''
  };
  hideMask('addMask');
  enterPlace(c);
}

/* ---------- 评论 ---------- */
function renderComments(c) {
  const box = $('zComments');
  const list = c.comments || [];
  if (!list.length) { box.innerHTML = '<div class="z-no-cmt">还没有评论</div>'; return; }
  box.innerHTML = list.map(cm => {
    const anon = !!cm.anon;
    const nm = anon ? '匿名' : ((cm.name || '').trim() || '匿名');
    const av = (!anon && cm.avatar) ? `<span class="cmt-av" style="background-image:url('${esc(cm.avatar)}')"></span>`
      : (anon ? `<span class="cmt-av av-anon">匿</span>` : `<span class="cmt-av av-anon" style="background:${cm.avColor || '#8da0b8'}">${esc([...nm][0] || '匿')}</span>`);
    return `<div class="z-cmt">${av}<div class="cmt-bd"><div class="cmt-txt">${esc(cm.text)}</div><div class="m">${esc(nm)} · ${fmtDate(cm.at).slice(5, 16)}</div></div></div>`;
  }).join('');
}
function submitComment() {
  const c = cards.find(x => x.id === zoomId);
  if (!c) return;
  const text = $('zCmtText').value.trim();
  if (!text) { hint('写点内容再评论'); return; }
  const chk = checkContent(text);
  if (chk.bad) { hint(chk.msg || FILTER_MSG); return; }
  if (!c.comments) c.comments = [];
  const anon = cmtAnon;
  c.comments.push({
    name: anon ? '匿名' : (meInfo.name || '匿名'),
    anon,
    avatar: (!anon && meInfo.avatar) ? meInfo.avatar : '',
    avColor: (!anon && !meInfo.avatar) ? 'hsl(' + ((c.id ? [...c.id].reduce((s, x) => s + x.charCodeAt(0), 0) : 0) % 360) + ',55%,62%)' : '',
    text, at: new Date().toISOString()
  });
  saveCards(cards);
  $('zCmtText').value = '';
  renderComments(c);
  syncCommentsCloud(c);   // 登录用户：评论同步上云，别人也能看到
  hint('评论成功');
}

/* ---------- 我的便签 ---------- */
function openMy() {
  const mine = cards.filter(c => isMine(c)).slice().reverse();
  const list = $('myList');
  if (!mine.length) { list.innerHTML = '<div class="wt-empty">你还没贴过便签<br>点右上角「贴一张便签」写下第一张吧</div>'; }
  else {
    list.innerHTML = mine.map(c => {
      const meta = TYPE_META[c.type] || TYPE_META.bless;
      const lock = c.vis === 'private' ? ' · 私密' : '';
      return `<div class="wt-item" data-id="${c.id}">
        <span class="dot" style="background:${noteColor(c)}"></span>
        <div class="bd"><div class="tt">${esc(c.title || '无题')}${lock}</div><div class="dt">${fmtDate(c.createdAt)}</div></div>
        <span class="go">›</span></div>`;
    }).join('');
    list.querySelectorAll('.wt-item').forEach(el => {
      el.onclick = () => { hideMask('myMask'); openZoom(el.dataset.id); };
    });
  }
  showMask('myMask');
}

/* ---------- 找便签 ---------- */
function doFind() {
  const q = $('findInput').value.trim().toLowerCase();
  const list = $('findList');
  if (!q) { list.innerHTML = '<div class="wt-empty">输入关键词搜索</div>'; return; }
  const res = cards.filter(c => canSee(c) && (((c.title || '').toLowerCase().includes(q)) || ((c.content || '').toLowerCase().includes(q))));
  if (!res.length) { list.innerHTML = '<div class="wt-empty">没有找到相关便签</div>'; return; }
  list.innerHTML = res.slice().reverse().map(c => {
    const meta = TYPE_META[c.type] || TYPE_META.bless;
    return `<div class="wt-item" data-id="${c.id}">
      <span class="dot" style="background:${noteColor(c)}"></span>
      <div class="bd"><div class="tt">${esc(c.title || '无题')}</div><div class="dt">${esc(c.author || '匿名')}</div></div>
      <span class="go">›</span></div>`;
  }).join('');
  list.querySelectorAll('.wt-item').forEach(el => {
    el.onclick = () => { hideMask('findMask'); openZoom(el.dataset.id); };
  });
}

/* ---------- 弹层 ---------- */
function showMask(id) { $(id).classList.add('show'); }
function hideMask(id) { $(id).classList.remove('show'); }
function hint(msg) {
  const el = $('wtHint');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- 绑定 ---------- */
function bind() {
  // tab 切换
  $('wallTabs').addEventListener('click', e => {
    const btn = e.target.closest('.wt-tab');
    if (!btn) return;
    document.querySelectorAll('.wt-tab').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    curWall = btn.dataset.w;
    renderWall();
  });
  // 写便签：类型
  $('typeSel').addEventListener('click', e => {
    const t = e.target.closest('.wt-type');
    if (!t) return;
    document.querySelectorAll('#typeSel .wt-type').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    renderSubSel();
    renderShadeSel();
  });
  // 写便签：公开/私密
  document.querySelectorAll('.wt-vis-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.wt-vis-btn').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      curVis = b.dataset.v;
    };
  });
  // 匿名开关
  $('anonBtn').onclick = () => {
    curAnon = !curAnon;
    $('anonBtn').classList.toggle('on', curAnon);
    $('anonBtn').textContent = curAnon ? '匿名' : '不匿名';
  };
  // 字数
  $('addContent').addEventListener('input', () => { $('addCnt').textContent = $('addContent').value.length; });
  // 按钮
  $('btnAdd').onclick = openAdd;
  $('addCancel').onclick = () => hideMask('addMask');
  $('addOk').onclick = submitAdd;
  $('btnMy').onclick = openMy;
  $('myClose').onclick = () => hideMask('myMask');
  $('btnFind').onclick = () => { $('findInput').value = ''; $('findList').innerHTML = '<div class="wt-empty">输入关键词搜索</div>'; showMask('findMask'); };
  $('findClose').onclick = () => hideMask('findMask');
  $('findGo').onclick = doFind;
  $('findInput').addEventListener('keydown', e => { if (e.key === 'Enter') doFind(); });
  // 放大查看
  $('zoomClose').onclick = closeZoom;
  $('zDel').onclick = deleteNote;
  $('zInviteCopy').onclick = () => {
    const c = cards.find(x => x.id === zoomId);
    if (c && c.invite_code) copyInviteCode(c.invite_code);
  };
  $('zInviteAccept').onclick = async () => {
    const c = cards.find(x => x.id === zoomId);
    if (!c) return;
    const code = prompt('输入邀请码（8 位）：');
    if (!code) return;
    const r = await acceptInviteByCode(code);
    if (!r.ok) { hint(r.msg || '接受邀请失败'); return; }
    /* 云端已通过 SECURITY DEFINER RPC 更新 partner 字段；本地同步更新显示 */
    c.partner_id = meInfo.userId;
    c.partner_name = meInfo.name || '';
    c.partner_avatar = meInfo.avatar || '';
    saveCards(cards);
    renderWall();
    openZoom(c.id);
    hint('已成为搭档，你们共用这张便签啦');
  };
  $('zoomMask').addEventListener('click', e => { if (e.target === $('zoomMask')) closeZoom(); });
  // 评论
  $('zCmtSend').onclick = submitComment;
  $('zCmtText').addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(); });
  // 评论匿名开关
  $('cmtAnonBtn').onclick = () => {
    cmtAnon = !cmtAnon;
    $('cmtAnonBtn').classList.toggle('on', cmtAnon);
    $('cmtAnonBtn').textContent = cmtAnon ? '匿名' : '不匿名';
  };
  // 缩放按钮
  $('zoomIn').onclick = () => zoomBy(1.2);
  $('zoomOut').onclick = () => zoomBy(1 / 1.2);
  $('zoomFit').onclick = fitAll;
  // 放置取消
  $('placeCancel').onclick = exitPlace;
}

/* ---------- 启动 ---------- */
const myOwnerKey = 'wt_owner';
function myLocalId() {
  let o = localStorage.getItem(myOwnerKey);
  if (!o) { o = 'me_' + Date.now().toString(36); localStorage.setItem(myOwnerKey, o); }
  return o;
}
/* 归属标识：登录后用 Supabase user.id（唯一、不可伪造），未登录用本地 ID */
function myOwner() { return meInfo.userId || myLocalId(); }
/* 仅本人可操作：登录用户比 user.id，兼容本地旧 ID */
function isMine(c) {
  if (!c) return false;
  return c.owner === myOwner() || (meInfo.userId && c.owner === myLocalId());
}
/* 可见性：公开所有人可见；私密仅作者/搭档可见 */
function canSee(c) { return c.vis !== 'private' || canEdit(c); }
bind();
initCanvas();
renderWall();
/* 启动读取登录用户信息（名字/头像），用于便签和评论默认署名 */
loadMe();
/* 启动拉取云端公开便签（合并显示，登录后也会拉到别人的公开便签） */
pullCloudNotes().then(() => renderWall());
/* 默认缩放 50%，打开看到中央区域全貌；fitAll 保留给「全」按钮 */
scale = 0.5;
tx = (innerWidth - 3200 * 0.5) / 2 + 60;
ty = (innerHeight - 2200 * 0.5) / 2 + 100;
applyTransform();
