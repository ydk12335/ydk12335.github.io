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
/* 「关系」细分类型：选中关系后显示二级选择；所有子类型统一同一色系（紫色，与 TYPE_META.relation 一致） */
const REL_SUBS = {
  couple:  { name: '情侣', shades: ['#f3e6ff', '#e0b8ff', '#b98ae0'] },  // 统一紫
  friend:  { name: '朋友', shades: ['#f3e6ff', '#e0b8ff', '#b98ae0'] },  // 统一紫
  family:  { name: '家人', shades: ['#f3e6ff', '#e0b8ff', '#b98ae0'] },  // 统一紫
  crush:   { name: '暗恋', shades: ['#f3e6ff', '#e0b8ff', '#b98ae0'] }   // 统一紫
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
    const byId = new Map(local.map(c => [c.id, c]));
    const merged = local.slice();
    let changed = 0;
    rows.forEach(r => {
      const ex = byId.get(r.id);
      const fresh = {
        id: r.id, type: r.type, title: r.title || '无题', content: r.content || '',
        author: r.author || '', vis: r.vis, owner: r.owner || '', createdAt: r.created_at,
        comments: r.comments || [], shade: r.shade != null ? r.shade : (r.color ? 1 : 1),
        anon: !!r.anon, avatar: r.avatar || '',
        sub: r.sub || '', partner_id: r.partner_id || '', partner_name: r.partner_name || '',
        partner_avatar: r.partner_avatar || '', invite_code: r.invite_code || '',
        bind_status: r.bind_status || '', bind_by: r.bind_by || '',
        bind_at: r.bind_at || '',
        x: r.x != null ? r.x : undefined, y: r.y != null ? r.y : undefined,
        r: r.r != null ? r.r : undefined
      };
      if (ex) {
        // 本地已存在：字段级合并，云端新值覆盖（partner/bind 等必须同步，否则作者端一直显示等待）
        let dirty = false;
        ['type','title','content','author','vis','owner','createdAt','shade','anon','avatar','sub','partner_id','partner_name','partner_avatar','invite_code','bind_status','bind_by','bind_at','x','y','r'].forEach(k => {
          if (fresh[k] !== undefined && fresh[k] !== ex[k]) { ex[k] = fresh[k]; dirty = true; }
        });
        // 评论合并：以云端为准（RPC 已保证评论写入云端）
        if (JSON.stringify(fresh.comments) !== JSON.stringify(ex.comments)) { ex.comments = fresh.comments; dirty = true; }
        if (dirty) changed++;
      } else {
        merged.push(fresh); byId.set(r.id, fresh); changed++;
      }
    });
    if (changed) { saveCards(merged); cards = loadCards(); renderWall(); }
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
      bind_status: c.bind_status || '', bind_by: c.bind_by || null,
      bind_at: c.bind_at || null,
      x: c.x ?? null, y: c.y ?? null, r: c.r ?? null,
      comments: c.comments || [], owner: c.owner || ''
    }, { onConflict: 'id' });
    if (error) console.warn('[wish-tree] 上传便签失败', error.message);
  } catch (e) { console.warn('[wish-tree] 上传便签异常', e); }
}
/* 上传/删除评论（公开便签任何登录用户都能评论上云；私密仅作者/搭档，RPC 兜底权限） */
async function syncCommentsCloud(c) {
  const sb = await getSbClient(); if (!sb) return;
  const user = await getCurUser(); if (!user) return;
  try {
    const { error } = await sb.rpc('sync_comments', {
      p_id: c.id,
      p_comments: c.comments || []
    });
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
/* 接受邀请：调用 SECURITY DEFINER RPC 把当前用户设为搭档；dryRun=true 时只查不绑（用于情侣唯一校验） */
async function acceptInviteByCode(code, dryRun) {
  const sb = await getSbClient(); if (!sb) return { ok: false, msg: '未登录' };
  const user = await getCurUser(); if (!user) return { ok: false, msg: '未登录' };
  try {
    if (dryRun) {
      /* 只查这张便签的类型（不绑定），用于情侣唯一校验 */
      const { data, error } = await sb.from('wish_notes').select('id, sub, type').eq('invite_code', (code || '').trim().toUpperCase()).maybeSingle();
      if (error) return { ok: false, msg: error.message };
      if (!data) return { ok: false, msg: '邀请码无效或已失效' };
      return { ok: true, note: data };
    }
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
/* 解绑关系 RPC：作者或搭档均可解绑；永久绑定(locked)不可解绑 */
async function unbindRpc(noteId) {
  const sb = await getSbClient(); if (!sb) return 'no_login';
  const user = await getCurUser(); if (!user) return 'no_login';
  try {
    const { data, error } = await sb.rpc('unbind_relation', { p_id: noteId });
    if (error) return error.message || 'rpc_error';
    return data || 'rpc_error';
  } catch (e) { return String(e); }
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
/* 永久绑定 RPC 封装：调用指定绑定函数，返回状态字符串或错误消息 */
async function bindRpc(fn, noteId) {
  const sb = await getSbClient(); if (!sb) return 'no_login';
  const user = await getCurUser(); if (!user) return 'no_login';
  try {
    const { data, error } = await sb.rpc(fn, { p_id: noteId });
    if (error) return error.message || 'rpc_error';
    return data || 'unknown';
  } catch (e) { return String(e); }
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
/* ① 敏感词（通用 + 人身攻击 + 色情 + 暴力 + 政治敏感 + 违禁 + 用户曾用名） */
const BAD_WORDS = [
  /* 人身攻击 */
  '傻逼', '煞笔', '沙比', '脑残', '智障', '弱智', '白痴', '蠢货', '废物', '垃圾货',
  '操你妈', '草泥马', '去死', '滚蛋', '贱人', '婊子', '妓女', '嫖娼', '卖淫',
  /* 暴力 / 违禁 */
  '杀人', '自杀', '贩毒', '吸毒', '毒品', '枪支', '炸药', '炸弹', '恐怖袭击',
  '赌博', '赌场', '博彩', '开奖', '六合彩', '彩票预测', '翻墙', 'vpn破解', '破解版', '外挂', '代刷',
  /* 政治敏感 */
  '习近平', '江泽民', '胡锦涛', '温家宝', '李克强', '邓xiao平', '华国锋',
  '法轮功', '六四', '天安门事件', '八九学运', '台独', '藏独', '疆独', '港独', '蒙独',
  '达赖', '热比娅', '占中', '民运', '维权', '反党', '反政府', '颠覆', '颜色革命', '和平演变',
  '邪教', '传销', '黑社会', '恐怖组织', 'isis',
  /* 用户曾用名/昵称（防止被提及；中文名直接匹配） */
  '易大可', '微易'
];
/* 用户曾用英文名缩写：独立单词边界匹配（避免误杀 hydrate/yard/yesterday 等正常英文） */
const ALIAS_RE = /(^|[^a-z0-9])(ydk|yd)([^a-z0-9]|$)/i;
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
  /* 用户曾用英文名缩写（yd/ydk 独立单词匹配，避免误杀正常英文） */
  if (ALIAS_RE.test(s)) return { bad: true, msg: '内容里包含敏感词，不能发布' };
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
let pendingInviteCode = ''; // 表单阶段已生成的关系邀请码（贴上去后沿用）
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
  /* 关系便签未绑定搭档：作者自己可见「等待通过邀请」状态 */
  let waitHTML = '';
  if (c.type === 'relation' && !c.partner_id && isMine(c)) {
    waitHTML = `<div class="wt-wait">⏳ 等待对方通过邀请</div>`;
  }
  el.innerHTML = `
    <div class="ic">${typeName(c)}</div>
    <div class="tt">${esc(c.title || '无题')}</div>
    <div class="ct">${esc((c.content || '').slice(0, 40))}${(c.content || '').length > 40 ? '…' : ''}</div>
    <div class="au">${authorHTML(c)}${partnerHTML(c)}<span class="au-dt">${lock}${fmtDate(c.createdAt).slice(5, 16)}</span></div>
    ${waitHTML}
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
  /* 永久绑定状态：locked 显示锁定标识，删除按钮隐藏 */
  const isLocked = c.bind_status === 'locked';
  $('zBadge').textContent = (c.vis === 'private' ? '私密' : '公开') + (isLocked ? ' · 🔒永久绑定' : (c.bind_status === 'pending' ? ' · ⏳绑定确认中' : ''));
  $('zDel').style.display = (isMine(c) && !isLocked) ? 'inline-block' : 'none';   // 永久绑定谁都删不了
  /* 永久绑定操作区：关系便签已绑定搭档时可发起/确认永久绑定 */
  const bindBox = $('zBind');
  const isRelation = c.type === 'relation';
  const hasPartner = !!c.partner_id;
  if (isRelation && hasPartner && canEdit(c)) {
    bindBox.style.display = '';
    if (isLocked) {
      $('zBindTip').textContent = '你们已永久绑定，这张便签永远保留 💞';
      $('zBindBtn').style.display = 'none';
    } else if (c.bind_status === 'pending') {
      const iAmBy = c.bind_by && meInfo.userId && c.bind_by === meInfo.userId;
      $('zBindTip').textContent = iAmBy ? '已发起永久绑定，等 TA 确认…' : '对方发起了永久绑定，确认后谁都删不了这张便签';
      $('zBindBtn').textContent = iAmBy ? '取消发起' : '确认永久绑定';
      $('zBindBtn').style.display = '';
    } else {
      $('zBindTip').textContent = '永久绑定后，谁都删不了这张便签（需双方确认）';
      $('zBindBtn').textContent = '永久绑定';
      $('zBindBtn').style.display = '';
    }
  } else {
    bindBox.style.display = 'none';
  }
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
/* 删除便签（本地 + 云端），仅本人可见删除按钮；永久绑定(locked)谁都删不了 */
function deleteNote() {
  const c = cards.find(x => x.id === zoomId);
  if (!c || !isMine(c)) return;
  if (c.bind_status === 'locked') { hint('这张便签已永久绑定，无法删除'); return; }
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
    return `<div class="wt-sub${on}" data-s="${k}">${meta.name}</div>`;
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
  pendingInviteCode = genInviteCode();   // 每次打开表单预生成邀请码
  $('anonBtn').classList.remove('on');
  $('anonBtn').textContent = '不匿名';
  document.querySelectorAll('.wt-vis-btn').forEach(b => b.classList.toggle('on', b.dataset.v === 'public'));
  document.querySelectorAll('#subSel .wt-sub').forEach(b => b.classList.toggle('on', b.dataset.s === 'couple'));
  renderSubSel();
  renderShadeSel();
  $('addInvite').style.display = 'none';   // 默认隐藏，选中「关系」才显示
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
    partner_id: '', partner_name: '', partner_avatar: '',
    invite_code: (type === 'relation') ? (pendingInviteCode || genInviteCode()) : ''
  };
  if (type !== 'relation') pendingInviteCode = '';   // 非关系便签清空待用邀请码
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

/* ---------- 我的关系 ---------- */
/* 计算已绑定天数（bind_at → 至今） */
function bindDays(c) {
  const t = c.bind_at || c.bindTime || '';
  if (!t) return 0;
  const d = (Date.now() - new Date(t).getTime()) / 86400000;
  return Math.max(0, Math.floor(d));
}
/* 渲染「我的关系」列表：作者/搭档视角的关系便签，显示绑定天数、永久绑定锁、解绑按钮 */
function renderRelList() {
  const box = $('relList');
  if (!box) return;
  const rels = cards.filter(c => c.type === 'relation' && c.partner_id && (isMine(c) || isPartner(c)));
  if (!rels.length) { box.innerHTML = '<div class="wt-empty">还没有绑定关系<br>输入下方邀请码加入 TA 的关系便签</div>'; return; }
  box.innerHTML = rels.map(c => {
    const subName = (c.sub && REL_SUBS[c.sub]) ? REL_SUBS[c.sub].name : '关系';
    const days = bindDays(c);
    const locked = c.bind_status === 'locked';
    const daysTxt = days > 0 ? `已绑定 ${days} 天` : '刚绑定';
    const lockTxt = locked ? ' · 🔒永久' : '';
    const partner = isPartner(c) ? (c.author || '对方') : (c.partner_name || '对方');
    const btn = locked
      ? '<span class="rel-btn" style="border-color:#8a8a8a;color:#8a8a8a;background:#f0f0f0;cursor:default">永久绑定</span>'
      : '<button type="button" class="rel-btn danger" data-unbind="' + esc(c.id) + '">解绑</button>';
    return `<div class="wt-rel-item">
      <span class="rel-dot" style="background:${noteColor(c)}">${esc(subName[0] || '关')}</span>
      <div class="rel-bd"><div class="rel-tt">${esc(c.title || '无题')}</div><div class="rel-meta">${esc(partner)} · ${esc(subName)}${lockTxt} · ${daysTxt}</div></div>
      ${btn}
    </div>`;
  }).join('');
  box.querySelectorAll('[data-unbind]').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.unbind;
      const c = cards.find(x => x.id === id);
      if (!c) return;
      if (c.bind_status === 'locked') { hint('永久绑定的关系不能解绑'); return; }
      if (!confirm('确定解绑这个关系吗？')) return;
      const r = await unbindRpc(id);
      if (r === 'unbound') {
        c.partner_id = ''; c.partner_name = ''; c.partner_avatar = '';
        saveCards(cards); renderRelList(); renderWall();
        hint('已解绑');
      } else { hint(r === 'locked' ? '永久绑定不可解绑' : (r === 'forbidden' ? '只有关系双方能解绑' : '解绑失败，再试试')); }
    };
  });
}

/* ---------- 加入关系 ---------- */
/* 输入邀请码加入关系便签：RPC 设为搭档 → 拉取该便签内容 → 本地合并显示（私密也双方可见） */
async function doJoin() {
  const code = $('joinInput').value.trim().toUpperCase();
  if (!code) { hint('先输入邀请码呀'); return; }
  const me = await getCurUser();
  if (!me) { hint('加入关系需要先登录'); hideMask('joinMask'); return; }
  /* 情侣唯一：想加入情侣关系时，检查自己是否已有情侣关系便签 */
  const r0 = await acceptInviteByCode(code, true);  // dryRun：只查不绑
  if (r0.ok && r0.note && r0.note.sub === 'couple') {
    const hasCouple = cards.some(c => c.type === 'relation' && c.sub === 'couple' && c.partner_id && (isMine(c) || isPartner(c)));
    if (hasCouple) { hint('你已经有一个情侣关系啦'); return; }
  }
  const r = await acceptInviteByCode(code);
  if (!r.ok) { hint(r.msg || '加入失败'); return; }
  hideMask('joinMask');
  /* 从云端拉取这张便签的最新内容（含私密，RLS 已允许搭档读取） */
  let note = null;
  try {
    const sb = await getSbClient();
    if (sb && r.noteId) {
      const { data } = await sb.from('wish_notes').select('*').eq('id', r.noteId).maybeSingle();
      if (data) note = data;
    }
  } catch (e) {}
  if (!note) { hint('已加入，刷新后可看到这张便签'); return; }
  /* 本地合并（不覆盖已有本地改动） */
  const local = loadCards();
  const idx = local.findIndex(x => x.id === note.id);
  const merged = {
    id: note.id, type: note.type, sub: note.sub || '', title: note.title || '无题',
    content: note.content || '', author: note.author || '', anon: !!note.anon,
    avatar: note.avatar || '', vis: note.vis || 'public', shade: note.shade != null ? note.shade : 1,
    owner: note.owner || '', createdAt: note.created_at || new Date().toISOString(),
    comments: note.comments || [], partner_id: note.partner_id || '',
    partner_name: note.partner_name || '', partner_avatar: note.partner_avatar || '',
    invite_code: note.invite_code || '', bind_status: note.bind_status || '', bind_by: note.bind_by || '',
    bind_at: note.bind_at || '',
    x: note.x != null ? note.x : undefined, y: note.y != null ? note.y : undefined,
    r: note.r != null ? note.r : undefined
  };
  if (idx >= 0) local[idx] = merged; else local.push(merged);
  saveCards(local);
  cards = local;
  renderWall();
  hint('加入成功，你们共用这张便签啦');
  renderRelList();
  showMask('joinMask');
  openZoom(note.id);
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
    /* 关系类型：表单里就生成邀请码显示，不用等贴完 */
    const inviteBox = $('addInvite');
    if (t.dataset.t === 'relation') {
      if (!pendingInviteCode) pendingInviteCode = genInviteCode();
      $('addInviteCode').textContent = pendingInviteCode;
      inviteBox.style.display = '';
    } else {
      inviteBox.style.display = 'none';
    }
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
  /* 表单里复制关系邀请码 */
  $('addInviteCopy').onclick = () => { if (pendingInviteCode) copyInviteCode(pendingInviteCode); };
  $('btnMy').onclick = openMy;
  $('myClose').onclick = () => hideMask('myMask');
  $('btnFind').onclick = () => { $('findInput').value = ''; $('findList').innerHTML = '<div class="wt-empty">输入关键词搜索</div>'; showMask('findMask'); };
  $('findClose').onclick = () => hideMask('findMask');
  $('findGo').onclick = doFind;
  $('findInput').addEventListener('keydown', e => { if (e.key === 'Enter') doFind(); });
  /* 我的关系：全局入口（显示已绑定关系 + 输入邀请码加入） */
  $('btnJoin').onclick = () => { $('joinInput').value = ''; renderRelList(); showMask('joinMask'); };
  $('joinClose').onclick = () => hideMask('joinMask');
  $('joinGo').onclick = doJoin;
  $('joinInput').addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
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
    const me = await getCurUser();
    if (!me) { hint('加入关系需要先登录'); return; }
    const r = await acceptInviteByCode(code);
    if (!r.ok) { hint(r.msg || '接受邀请失败'); return; }
    /* 从云端拉取这张便签的最新内容（含私密，RLS 已允许搭档读取） */
    let note = null;
    try {
      const sb = await getSbClient();
      if (sb && r.noteId) {
        const { data } = await sb.from('wish_notes').select('*').eq('id', r.noteId).maybeSingle();
        if (data) note = data;
      }
    } catch (e) {}
    if (note) {
      const idx = cards.findIndex(x => x.id === note.id);
      const merged = {
        id: note.id, type: note.type, sub: note.sub || '', title: note.title || '无题',
        content: note.content || '', author: note.author || '', anon: !!note.anon,
        avatar: note.avatar || '', vis: note.vis || 'public', shade: note.shade != null ? note.shade : 1,
        owner: note.owner || '', createdAt: note.created_at || new Date().toISOString(),
        comments: note.comments || [], partner_id: note.partner_id || '',
        partner_name: note.partner_name || '', partner_avatar: note.partner_avatar || '',
        invite_code: note.invite_code || '', bind_status: note.bind_status || '', bind_by: note.bind_by || '',
        x: note.x != null ? note.x : undefined, y: note.y != null ? note.y : undefined,
        r: note.r != null ? note.r : undefined
      };
      if (idx >= 0) cards[idx] = merged; else cards.push(merged);
      saveCards(cards);
    }
    renderWall();
    openZoom(c.id);
    hint('已成为搭档，你们共用这张便签啦');
  };
  /* 永久绑定按钮：发起 / 确认 / 取消（按当前状态分流） */
  $('zBindBtn').onclick = async () => {
    const c = cards.find(x => x.id === zoomId);
    if (!c || !canEdit(c)) return;
    if (c.bind_status === 'pending') {
      const iAmBy = c.bind_by && meInfo.userId && c.bind_by === meInfo.userId;
      if (iAmBy) {
        if (!confirm('取消永久绑定发起？')) return;
        const r = await bindRpc('cancel_permanent_bind', c.id);
        if (r === 'cancelled') { c.bind_status = ''; c.bind_by = ''; saveCards(cards); hint('已取消发起'); }
        else hint(r === 'forbidden' ? '只有发起人能取消' : '取消失败，再试试');
      } else {
        if (!confirm('确认永久绑定？绑定后谁都删不了这张便签')) return;
        const r = await bindRpc('confirm_permanent_bind', c.id);
        if (r === 'locked') { c.bind_status = 'locked'; saveCards(cards); hint('永久绑定成功 💞'); }
        else hint(r === 'need_other' ? '需要对方确认' : '确认失败，再试试');
      }
    } else {
      if (!confirm('发起永久绑定？对方确认后，谁都删不了这张便签')) return;
      const r = await bindRpc('request_permanent_bind', c.id);
      if (r === 'pending') { c.bind_status = 'pending'; c.bind_by = meInfo.userId; saveCards(cards); hint('已发起，等 TA 确认'); }
      else if (r === 'no_partner') hint('还没有搭档，先接受邀请成为搭档吧');
      else if (r === 'locked') hint('已永久绑定');
      else hint('发起失败，再试试');
    }
    renderWall();
    openZoom(c.id);
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
/* 可见性：公开所有人可见；私密仅作者/搭档可见；关系便签未绑定搭档时仅作者可见（等待通过邀请） */
function canSee(c) {
  if (!c) return false;
  if (c.type === 'relation' && !c.partner_id) return isMine(c);  // 关系便签未通过邀请：只有作者能看到
  return c.vis !== 'private' || canEdit(c);
}
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
