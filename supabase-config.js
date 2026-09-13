/**
 * 有点困 - Supabase 配置
 * publishable key 是公开密钥，放前端没问题
 */

const SUPABASE_URL = 'https://ooewxcqksrvixnslzhkw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VdjiBIABpFj0RHgoXFC2wQ_NxpPt7df';

// Supabase 客户端（变量名避开 SDK 的全局 window.supabase）
let sbClient = null;

async function initSupabase() {
  if (sbClient) return sbClient;
  if (!window.supabase) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    document.head.appendChild(s);
    await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
  }
  sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  return sbClient;
}

/** 获取当前用户 */
async function getCurrentUser() {
  const sb = await initSupabase();
  const { data: { session } } = await sb.auth.getSession();
  return session?.user ?? null;
}

/** 退出登录 */
async function signOut() {
  if (!sbClient) return;
  await sbClient.auth.signOut();
}

/** 发送邮箱验证码（Supabase 内置 OTP） */
async function sendVerificationCode(email) {
  const sb = await initSupabase();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }  // 不存在则自动注册
  });
  if (error) throw error;
}

/** 验证验证码并登录 */
async function verifyAndLogin(email, code, username) {
  const sb = await initSupabase();
  const { data, error } = await sb.auth.verifyOtp({
    email,
    token: code,
    type: 'email'
  });
  if (error) throw error;

  // 登录成功，更新用户名
  if (username) {
    await sb.auth.updateUser({ data: { display_name: username } });
    await sb.from('profiles').upsert({
      id: data.user.id, email, username
    }, { onConflict: 'id' });
  }
  return data;
}

/** 密码登录（老用户直接进） */
async function loginWithPassword(email, password) {
  const sb = await initSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** 为当前登录用户设置/更新密码（注册后引导设置） */
async function setPassword(password) {
  const sb = await initSupabase();
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

/** 邮箱+密码注册（Supabase signUp） */
async function registerWithEmail(email, password, username) {
  const sb = await initSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name: username } }
  });
  if (error) throw error;
  return data;
}

/** 检查用户名是否已被占用（RPC，SECURITY DEFINER 绕过 RLS；函数不存在则抛错由调用方兜底） */
async function checkUsernameTaken(username) {
  if (!username || !String(username).trim()) return false;
  const sb = await initSupabase();
  const { data, error } = await sb.rpc('check_username', { uname: String(username).trim() });
  if (error) throw error;
  return !!data;
}

/** ========== 云端记忆同步（快照方案 v2 · 时间戳防覆盖） ========== */
const SNAP_TYPE = 'snapshot';
const SYNC_META_KEY = 'ss_sync_meta_v1';

/**
 * 需要同步的本地键（别名 → localStorage key）
 * ⚠️ 修复：v1 漏掉了 tarot_hist_v1（塔罗历史），导致成就/统计无法同步
 */
const SYNC_KEYS = {
  memory:   'sleepy_space_memory',
  memoryV2: 'sleepy_space_memory_v2',
  tarot:    'tarot_hist_v1',
  yijing:   'yijing_hist_v1',
  astro:    'astro_hist_v1',
  pair:     'pair_hist_v1',
  syn:      'syn_hist_v1',
  achSeen:  'ach_seen_v1',
  achRedeem:'ach_redeem_v1'
};
const SYNC_LS_KEYS = Object.values(SYNC_KEYS);

/* ---------- 元数据（每个 key 的最后修改时间 + 内容指纹） ---------- */
function readSyncMeta() {
  try { return JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function writeSyncMeta(m) { try { localStorage.setItem(SYNC_META_KEY, JSON.stringify(m)); } catch (e) {} }
/** 轻量指纹：长度 + 32位散列，用于判断内容是否真的变了 */
function sigOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return s.length + ':' + h;
}
function metaTime(meta, key) {
  const v = meta[key];
  if (v == null) return 0;
  if (typeof v === 'number') return v;      // 兼容旧格式
  return v.t || 0;
}
/** 只给「内容真的变了」的 key 打时间戳，避免误判冲突导致覆盖 */
function stampChanged() {
  const meta = readSyncMeta();
  const now = Date.now();
  SYNC_LS_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    const prev = meta[k];
    if (v == null) {
      if (prev && prev.s !== '') meta[k] = { t: now, s: '' };   // 删除墓碑
      return;
    }
    const s = sigOf(v);
    if (!prev || prev.s !== s) meta[k] = { t: now, s };
  });
  writeSyncMeta(meta);
  return meta;
}

/** ========== 上传 ========== */
async function uploadSnapshot() {
  try {
    const sb = await initSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return false;   // 未登录不传

    const meta = stampChanged();
    const items = {};
    SYNC_LS_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v != null) items[k] = v;
    });
    const payload = { v: 2, at: Date.now(), items, meta };

    const row = {
      user_id: session.user.id,
      type: SNAP_TYPE,
      title: 'memory_snapshot',
      note: JSON.stringify(payload),
      source: 'auto',
      sig: 'v2'
    };
    /* 同账号可能存在历史冗余快照：只取最新一条作为唯一「当前快照」，不再 maybeSingle 随机取行 */
    const { data: rows } = await sb.from('memories')
      .select('id').eq('user_id', session.user.id).eq('type', SNAP_TYPE)
      .order('updated_at', { ascending: false }).limit(1);
    const existing = rows && rows[0];
    if (existing?.id) {
      const { data: upd, error } = await sb.from('memories')
        .update({ note: row.note, sig: 'v2', updated_at: new Date().toISOString() })
        .eq('id', existing.id).select('id');
      if (error) throw error;
      /* 兜底：若 RLS 未开放 UPDATE 权限，update 会返回 0 行 → 退化为「删除后重建」 */
      if (!upd || upd.length === 0) {
        const { error: delErr } = await sb.from('memories').delete().eq('id', existing.id);
        if (delErr) throw delErr;
        const { error: insErr } = await sb.from('memories').insert(row);
        if (insErr) throw insErr;
        console.warn('[sync] UPDATE 被 RLS 拦截，已改用删除重建');
      }
    } else {
      const { error } = await sb.from('memories').insert(row);
      if (error) throw error;
    }
    return true;
  } catch (e) {
    console.warn('云端上传失败:', e);
    return false;
  }
}

/**
 * 彻底清空：本地同步键 + 云端快照（支持局部）。
 * 用于「一键清空 / 清空记录」类按钮：避免只清本地导致下次登录云端数据回灌。
 * @param {string[]} [onlyKeys] 可选，只清指定本地键（默认清全部同步键）
 *   全清：删除整个云端快照；
 *   局部：从云端快照 items 中移除对应 key、meta 打墓碑后写回（保留其他类型数据）。
 */
async function clearCloudSnapshot(onlyKeys) {
  const keys = onlyKeys && onlyKeys.length ? onlyKeys : SYNC_LS_KEYS;
  const isFull = !onlyKeys || !onlyKeys.length;
  /* 1. 清本地键 + 同步元数据（临时抑制写入钩子，避免触发防抖上传） */
  window.__ssSyncing = true;
  try {
    keys.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    const meta = readSyncMeta();
    const now = Date.now();
    keys.forEach(k => { meta[k] = { t: now, s: '' }; });   // 墓碑：标记为已删除
    writeSyncMeta(meta);
  } catch (e) { console.warn('[sync] 清空本地失败:', e); }
  window.__ssSyncing = false;
  /* 2. 清云端快照（已登录才需要） */
  try {
    const sb = await initSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return { ok: true, cloud: false };   // 未登录：仅本地
    /* 取最新一条快照（同账号历史冗余行不参与，避免 maybeSingle 随机取值） */
    const { data: snapRows } = await sb.from('memories')
      .select('id,note').eq('user_id', session.user.id).eq('type', SNAP_TYPE)
      .order('updated_at', { ascending: false }).limit(1);
    const snap = snapRows && snapRows[0];
    if (!snap?.id) return { ok: true, cloud: true };         // 云端本来就无快照

    if (isFull) {
      /* 全清 → 删除云端快照（RLS 拦截则退化为写入空快照） */
      const { error } = await sb.from('memories').delete().eq('id', snap.id);
      if (error) { throw error; }
    } else {
      /* 局部清空 → 保留其他 key，移除指定 key 并打墓碑后写回 */
      let payload = null;
      try { payload = JSON.parse(snap.note); } catch (e) {}
      if (payload && payload.v === 2 && payload.items) {
        keys.forEach(k => { delete payload.items[k]; });
        const curMeta = payload.meta || {};
        const now = Date.now();
        keys.forEach(k => { curMeta[k] = { t: now, s: '' }; });
        payload.meta = curMeta;
        payload.at = now;
        const { error: upErr } = await sb.from('memories')
          .update({ note: JSON.stringify(payload), sig: 'v2', updated_at: new Date().toISOString() })
          .eq('id', snap.id);
        if (upErr) throw upErr;
      }
    }
    return { ok: true, cloud: true };
  } catch (e) {
    /* RLS 兜底：删不掉就写入空快照 / 移除本地键后的空快照 */
    try {
      const sb = await initSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) return { ok: false, cloud: false, error: e };
      const emptyPayload = { v: 2, at: Date.now(), items: {}, meta: readSyncMeta() };
      if (!isFull) { keys.forEach(k => { emptyPayload.meta[k] = { t: Date.now(), s: '' }; }); }
      const { data: existRows } = await sb.from('memories')
        .select('id').eq('user_id', session.user.id).eq('type', SNAP_TYPE)
        .order('updated_at', { ascending: false }).limit(1);
      const existing = existRows && existRows[0];
      if (existing?.id) {
        await sb.from('memories')
          .update({ note: JSON.stringify(emptyPayload), sig: 'v2', updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await sb.from('memories').insert({
          user_id: session.user.id, type: SNAP_TYPE, title: 'memory_snapshot',
          note: JSON.stringify(emptyPayload), source: 'auto', sig: 'v2'
        });
      }
      return { ok: true, cloud: true, fallback: true };
    } catch (e2) {
      console.warn('[sync] 清空云端失败:', e2);
      return { ok: false, cloud: false, error: e2 };
    }
  }
}

/** ========== 下载（云端权威 · 登录只下载覆盖，绝不回传） ==========
 * 原则（用户 2026-09-14 明确）：
 *  - 云端为空（注册后第一次 / 云端被清空）→ 把本地推上去，作为云端基线；
 *  - 云端有快照 → 云端全量覆盖本地：云端有的 key 覆盖本地，云端没有的 key 从本地清掉；
 *  - 登录/启动时永不因「本地比云端新」而回传 —— 避免在他人手机上把他人残留数据写进自己的云端。
 *  - 日常本人设备的新增记录仍由 scheduleUpload（数据变动钩子）正常上传，不受影响。
 */
async function downloadSnapshot() {
  window.__ssSyncing = true;   // 抑制写入钩子，避免边下载边触发上传
  try {
    const sb = await initSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return false;
    /* 同账号存在历史冗余快照：取「最新一条」为云端权威，不再 maybeSingle 随机取行 */
    const { data: rows, error } = await sb.from('memories')
      .select('note').eq('user_id', session.user.id).eq('type', SNAP_TYPE)
      .order('updated_at', { ascending: false }).limit(1);
    if (error) throw error;
    const data = rows && rows[0];
    if (!data?.note) { await uploadSnapshot(); return false; }

    let payload;
    try { payload = JSON.parse(data.note); } catch (e) { return false; }
    if (!payload) return false;

    const localMeta = readSyncMeta();
    let changed = false;      // 本地被云端更新 → 需要刷新页面
    const now = Date.now();

    /* ---------- 旧版快照（v1：扁平结构） → 云端全量覆盖，并顺手清掉云端没有的本地残留 ---------- */
    if (payload.v !== 2 || !payload.items) {
      const legacy = {
        memory: 'sleepy_space_memory', memoryV2: 'sleepy_space_memory_v2',
        astro: 'astro_hist_v1', pair: 'pair_hist_v1',
        syn: 'syn_hist_v1', yj: 'yijing_hist_v1'
      };
      const inCloudSet = new Set(Object.values(legacy));
      Object.entries(legacy).forEach(([alias, lsKey]) => {
        const val = payload[alias];
        if (val == null || val === '') return;
        if (localStorage.getItem(lsKey) !== val) { localStorage.setItem(lsKey, val); changed = true; }
        localMeta[lsKey] = { t: now, s: sigOf(val) };
      });
      /* 云端 v1 里没有的同步 key → 本地残留，删除（云端权威） */
      SYNC_LS_KEYS.forEach(lsKey => {
        if (!inCloudSet.has(lsKey) && localStorage.getItem(lsKey) != null) {
          localStorage.removeItem(lsKey); changed = true;
        }
      });
      writeSyncMeta(localMeta);
      return changed;
    }

    /* ---------- v2：云端全量覆盖本地（不再按时间戳比较） ---------- */
    const cloudMeta = payload.meta || {};
    SYNC_LS_KEYS.forEach(lsKey => {
      const inCloud = Object.prototype.hasOwnProperty.call(payload.items, lsKey);
      const ct = metaTime(cloudMeta, lsKey);
      if (inCloud) {
        const val = payload.items[lsKey];
        if (localStorage.getItem(lsKey) !== val) { localStorage.setItem(lsKey, val); changed = true; }
        localMeta[lsKey] = { t: ct, s: sigOf(val) };
      } else {
        /* 云端没有这个 key → 本地残留，删除（云端权威） */
        if (localStorage.getItem(lsKey) != null) { localStorage.removeItem(lsKey); changed = true; }
        localMeta[lsKey] = { t: ct || now, s: '' };
      }
    });
    writeSyncMeta(localMeta);
    return changed;
  } catch (e) {
    console.warn('云端下载失败:', e);
    return false;
  } finally {
    window.__ssSyncing = false;
  }
}

/** 防抖自动上传：每次数据变动后 2 秒静默上传 */
let _syncTimer = null;
function scheduleUpload() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => { uploadSnapshot(); }, 2000);
}
/** 立即上传（关键节点用，如退出登录） */
function flushUpload() {
  clearTimeout(_syncTimer);
  return uploadSnapshot();
}

/**
 * 退出登录时清理本地缓存（云端保留）。
 * 配合「登录只下载覆盖」：退出即清空本地同步数据 + 元数据，
 * 保证在他人设备上登录后不会残留任何记忆，下次登录再从云端拉回。
 */
function clearLocalCache() {
  window.__ssSyncing = true;   // 抑制写入钩子，避免清空过程触发上传
  try {
    SYNC_LS_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    try { localStorage.removeItem(SYNC_META_KEY); } catch (e) {}
  } catch (e) { console.warn('清理本地缓存失败:', e); }
  window.__ssSyncing = false;
}

/**
 * 页面启动时自动比对云端 / 本地。
 * 任何页面（含塔罗、易经、观星等子页）都会执行，保证数据一致。
 */
async function bootCloudSync() {
  try {
    const sb = await initSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return;                        // 未登录不同步
    if (sessionStorage.getItem('cloud_restored')) return;  // 本次会话已同步过
    const changed = await downloadSnapshot();
    sessionStorage.setItem('cloud_restored', '1');
    if (changed) {
      try { if (typeof window.toast === 'function') window.toast('记忆已从云端同步 ☁'); } catch (e) {}
      setTimeout(() => location.reload(), 180);
    }
  } catch (e) {
    console.warn('云端同步启动失败:', e);
  }
}

window.uploadSnapshot = uploadSnapshot;
window.downloadSnapshot = downloadSnapshot;
window.scheduleUpload = scheduleUpload;
window.flushUpload = flushUpload;
window.bootCloudSync = bootCloudSync;
window.clearCloudSnapshot = clearCloudSnapshot;
window.clearLocalCache = clearLocalCache;

/**
 * 自动挂钩：任何页面「直接」写同步键（如 tarot/app.js 自己 setItem tarot_hist_v1）
 * 都会自动触发防抖上传，不用逐个改业务代码。
 */
(function hookStorage() {
  try {
    const origSet = localStorage.setItem.bind(localStorage);
    const origDel = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      origSet(k, v);
      if (SYNC_LS_KEYS.indexOf(k) >= 0 && !window.__ssSyncing) scheduleUpload();
    };
    localStorage.removeItem = function (k) {
      origDel(k);
      if (SYNC_LS_KEYS.indexOf(k) >= 0 && !window.__ssSyncing) scheduleUpload();
    };
  } catch (e) { console.warn('同步钩子安装失败', e); }
})();

/** 上传头像：压缩成 96px base64 存入用户元数据 */
async function uploadAvatar(file) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  const compressed = await new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 96; c.height = 96;
      const ctx = c.getContext('2d');
      // 居中裁剪成方形
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96);
      res(c.toDataURL('image/jpeg', 0.82));
    };
    img.src = dataUrl;
  });
  const sb = await initSupabase();
  const { error } = await sb.auth.updateUser({ data: { avatar: compressed } });
  if (error) throw error;
  return compressed;
}

window.uploadAvatar = uploadAvatar;
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
window.sendVerificationCode = sendVerificationCode;
window.verifyAndLogin = verifyAndLogin;
window.loginWithPassword = loginWithPassword;
window.setPassword = setPassword;
window.registerWithEmail = registerWithEmail;
window.checkUsernameTaken = checkUsernameTaken;

/* ---------- 启动：任何页面都自动做一次云地比对 ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCloudSync);
} else {
  bootCloudSync();
}