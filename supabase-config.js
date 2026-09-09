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
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
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

window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
window.sendVerificationCode = sendVerificationCode;
window.verifyAndLogin = verifyAndLogin;
window.loginWithPassword = loginWithPassword;
window.setPassword = setPassword;
window.registerWithEmail = registerWithEmail;