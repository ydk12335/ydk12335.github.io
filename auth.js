/**
 * 有点困 - 登录系统 v3
 * 结构参考 GitHub 登录：主入口是「密码登录」，
 * 注册 / 验证码 / 忘记密码 都是底部的次级入口，一屏只做一件事。
 */

const AUTH_HTML = `
<div class="auth-mask" id="authMask">
  <div class="auth-modal" id="authModal">
    <h3 class="auth-title" id="authTitle">登 录</h3>
    <div class="auth-subtitle" id="authSubtitle">登录后，你的记忆将随云端同步</div>

    <!-- ① 密码登录 -->
    <div class="auth-view" id="viewLogin">
      <div class="form-group">
        <label class="form-label">邮箱</label>
        <input class="form-input" id="loginEmail" type="email" placeholder="you@example.com" autocomplete="username">
      </div>
      <div class="form-group">
        <label class="form-label">密码</label>
        <input class="form-input" id="loginPwd" type="password" placeholder="你的密码" autocomplete="current-password">
      </div>
      <button class="auth-btn-primary" id="btnLogin">登 录</button>
      <button class="auth-btn-ghost" id="btnToCode">用邮箱验证码登录</button>
      <div class="auth-footer"><a href="#" id="btnForgot">忘记密码？</a> · <a href="#" id="authClose1">关闭</a></div>
    </div>

    <!-- ② 注册 -->
    <div class="auth-view" id="viewRegister" style="display:none">
      <div class="form-group">
        <label class="form-label">用户名</label>
        <input class="form-input" id="regUsername" type="text" placeholder="给自己取个名字" maxlength="20">
      </div>
      <div class="form-group">
        <label class="form-label">邮箱</label>
        <input class="form-input" id="regEmail" type="email" placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">设置密码</label>
        <input class="form-input" id="regPwd" type="password" placeholder="至少6位">
      </div>
      <div class="form-group">
        <label class="form-label">确认密码</label>
        <input class="form-input" id="regPwd2" type="password" placeholder="再输一遍">
      </div>
      <button class="auth-btn-primary" id="btnRegister">注册账号</button>
      <div class="form-group" id="regCodeGroup" style="display:none">
        <label class="form-label">邮箱验证码</label>
        <input class="form-input" id="regCode" type="text" placeholder="6位数字" maxlength="6" inputmode="numeric">
      </div>
      <button class="auth-btn-primary" id="btnRegVerify" style="display:none">确认并登录</button>
      <div class="auth-tip" id="regTip" style="display:none"></div>
      <div class="auth-footer"><a href="#" id="btnBackLogin2">已有账号？去登录</a> · <a href="#" id="authCloseR">关闭</a></div>
    </div>

    <!-- ③ 验证码登录 / 找回密码 -->
    <div class="auth-view" id="viewCode" style="display:none">
      <div class="form-group" id="codeEmailGroup">
        <label class="form-label">邮箱</label>
        <input class="form-input" id="codeEmail" type="email" placeholder="you@example.com">
      </div>
      <button class="auth-btn-primary" id="btnSendCode">发送验证码</button>
      <div class="form-group" id="codeInputGroup" style="display:none;margin-top:14px">
        <label class="form-label">验证码</label>
        <input class="form-input" id="codeInput" type="text" placeholder="6位数字" maxlength="6" inputmode="numeric">
      </div>
      <button class="auth-btn-primary" id="btnVerifyCode" style="display:none">验证登录</button>
      <div class="auth-tip" id="codeTip"></div>
      <div class="auth-footer"><a href="#" id="btnBackLogin3">返回密码登录</a> · <a href="#" id="authClose2">关闭</a></div>
    </div>

    <!-- ④ 设置密码（验证码登录成功后） -->
    <div class="auth-view" id="viewSetPwd" style="display:none">
      <div class="auth-tip">登录成功！设个密码，以后直接用密码进来 ✨</div>
      <div class="form-group">
        <label class="form-label">新密码</label>
        <input class="form-input" id="newPwd" type="password" placeholder="至少6位">
      </div>
      <div class="form-group">
        <label class="form-label">再输一遍</label>
        <input class="form-input" id="newPwd2" type="password" placeholder="确认密码">
      </div>
      <button class="auth-btn-primary" id="btnSetPwd">保存密码</button>
      <button class="auth-btn-ghost" id="btnSkipPwd">跳过，下次再说</button>
      <div class="auth-footer"><a href="#" id="authClose3">关闭</a></div>
    </div>

    <!-- ⑤ 已登录资料 -->
    <div class="auth-view" id="authLogout" style="display:none">
      <div class="user-avatar" id="userAvatar">?<div class="avatar-edit">换</div></div>
      <input type="file" id="avatarInput" accept="image/*"
        style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0.01">
      <div class="user-name" id="userName">用户</div>
      <div class="user-email" id="userEmail"></div>
      <div class="avatar-tip">点头像可更换</div>
      <button class="auth-btn-danger" id="btnSignOut">退出登录</button>
      <div class="auth-footer"><a href="#" id="authClose4">关闭</a></div>
    </div>
  </div>
</div>
`;

const AUTH_CSS = `
/* ===== 登录弹窗（公告同款居中玻璃卡片） ===== */
button,a,.w-chip,.p-card,.hbtn,.mbtn,.guaBox,.auth-modal,.uw-fab,.mu-fab{
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;
  -webkit-tap-highlight-color:transparent;outline:none}
button:focus:not(:focus-visible),a:focus:not(:focus-visible){outline:none}
.auth-mask{position:fixed;inset:0;z-index:300;background:rgba(5,3,16,.45);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;padding:20px;
  animation:authFade .3s ease}
@keyframes authFade{from{opacity:0}to{opacity:1}}
.auth-modal{width:min(380px,94%);max-height:min(88vh,720px);overflow-y:auto;
  border-radius:26px;padding:26px 24px;text-align:center;
  background:rgba(255,255,255,.11);
  backdrop-filter:blur(28px) saturate(190%);-webkit-backdrop-filter:blur(28px) saturate(190%);
  box-shadow:0 28px 72px rgba(4,2,18,.45), inset 0 1px 0 rgba(255,255,255,.3);
  animation:authPop .38s cubic-bezier(.16,1,.3,1)}
@keyframes authPop{from{opacity:0;transform:scale(.92) translateY(16px)}to{opacity:1;transform:none}}
.auth-title{font-size:1.08rem;color:#f0cf82;letter-spacing:.2em;margin-bottom:6px;font-weight:600}
.auth-subtitle{font-size:.72rem;color:rgba(240,207,130,.5);margin-bottom:20px;line-height:1.6}
.form-group{margin-bottom:14px;text-align:left}
.form-label{display:block;font-size:.64rem;color:rgba(240,207,130,.5);margin-bottom:6px;letter-spacing:.1em}
.form-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);
  border-radius:12px;padding:12px 14px;color:#f2ede0;font-size:.9rem;outline:none;font-family:inherit;box-sizing:border-box}
.form-input::placeholder{color:#8d86b5}
.form-input:focus{border-color:rgba(240,207,130,.5);box-shadow:0 0 0 3px rgba(240,207,130,.10)}
.auth-btn-primary{width:100%;padding:13px;border-radius:999px;border:none;font-family:inherit;font-size:.9rem;
  letter-spacing:.15em;cursor:pointer;margin-top:4px;color:#fffbef;font-weight:600;
  background:linear-gradient(165deg,rgba(255,238,196,.38),rgba(240,207,130,.14) 44%,rgba(198,150,74,.22));
  box-shadow:inset 0 1.5px 0 rgba(255,253,240,.45), 0 8px 24px rgba(240,207,130,.15);
  transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .25s, filter .25s;
  -webkit-tap-highlight-color:transparent}
.auth-btn-primary:hover{filter:brightness(1.12);box-shadow:inset 0 1.5px 0 rgba(255,253,240,.55), 0 10px 30px rgba(240,207,130,.3)}
.auth-btn-primary:active{transform:scale(.94);filter:brightness(.95)}
.auth-btn-primary:disabled{opacity:.4;transform:none}
.auth-btn-ghost{width:100%;padding:12px;border-radius:999px;font-family:inherit;font-size:.85rem;
  letter-spacing:.12em;cursor:pointer;margin-top:10px;transition:.2s;
  background:rgba(255,255,255,.05);color:rgba(240,207,130,.7);border:1px solid rgba(240,207,130,.18)}
.auth-btn-ghost:active{transform:scale(.97)}
.auth-btn-danger{width:100%;padding:12px;border-radius:999px;font-family:inherit;font-size:.85rem;
  letter-spacing:.12em;cursor:pointer;margin-top:12px;transition:.2s;
  background:rgba(255,80,80,.08);color:rgba(255,130,130,.85);border:1px solid rgba(255,80,80,.22)}
.auth-btn-danger:active{transform:scale(.97)}
.auth-footer{margin-top:10px;font-size:.72rem}
.auth-footer a{color:rgba(240,207,130,.45);text-decoration:none}
.auth-footer a:hover{color:#f0cf82}
.auth-tip{font-size:.75rem;color:rgba(240,207,130,.55);margin-bottom:12px;text-align:center;line-height:1.7}
.user-avatar{width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#f0cf82,#c9a04c);
  color:#0a0815;font-size:1.4rem;font-weight:bold;display:flex;align-items:center;justify-content:center;margin:14px auto 10px;
  position:relative;cursor:pointer;overflow:hidden;user-select:none;background-size:cover;background-position:center;
  transition:.2s;box-shadow:0 4px 16px rgba(240,207,130,.2)}
.user-avatar:active{transform:scale(.95)}
.user-avatar .avatar-edit{position:absolute;right:0;bottom:0;width:20px;height:20px;border-radius:50%;
  background:rgba(10,8,21,.85);color:#f0cf82;font-size:.55rem;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(240,207,130,.4)}
.avatar-tip{font-size:.64rem;color:rgba(240,207,130,.35);text-align:center;margin:-2px 0 8px}
.user-name{font-size:.98rem;color:#f0cf82;text-align:center;margin-bottom:4px;font-weight:600;letter-spacing:.08em}
.user-email{font-size:.76rem;color:rgba(240,207,130,.5);text-align:center;margin-bottom:6px;word-break:break-all}
`;

function initAuth() {
  if (document.getElementById('authMask')) return;

  // toast 兜底
  if (typeof window.toast !== 'function') {
    window.toast = function(msg) {
      let el = document.getElementById('auth-toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'auth-toast';
        el.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:rgba(10,8,25,.92);color:#f0cf82;padding:10px 22px;border-radius:20px;font-size:.82rem;z-index:9999;border:1px solid rgba(240,207,130,.25);transition:opacity .3s';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.opacity = '1';
      clearTimeout(el._t);
      el._t = setTimeout(() => el.style.opacity = '0', 2200);
    };
  }

  const style = document.createElement('style');
  style.textContent = AUTH_CSS;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend', AUTH_HTML);

  const $ = id => document.getElementById(id);
  const mask = $('authMask');
  const titleEl = $('authTitle');
  const subEl = $('authSubtitle');

  const VIEWS = { login: 'viewLogin', register: 'viewRegister', code: 'viewCode', setpwd: 'viewSetPwd', profile: 'authLogout' };
  const TEXT = {
    login:    ['登 录',      '登录后，你的记忆将随云端同步'],
    register: ['注 册',      '创建账号，随时同步你的记忆'],
    code:     ['验证码登录', '用邮箱收到的验证码登录'],
    setpwd:   ['设置密码',   '以后用密码就能快速登录'],
    profile:  ['我 的',      '']
  };
  let locked = false, countdown = null, sentEmail = '', name0 = '?';

  function showView(name) {
    Object.keys(VIEWS).forEach(k => { $(VIEWS[k]).style.display = k === name ? 'block' : 'none'; });
    titleEl.textContent = TEXT[name][0];
    subEl.textContent = TEXT[name][1];
    subEl.style.display = TEXT[name][1] ? 'block' : 'none';
    const m = $('authModal'); if (m) m.scrollTop = 0;
  }

  const close = () => { if (!locked) mask.style.display = 'none'; };
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  ['authClose1', 'authCloseR', 'authClose2', 'authClose3', 'authClose4'].forEach(id =>
    $(id).addEventListener('click', e => { e.preventDefault(); close(); }));
  mask.addEventListener('click', e => { if (e.target === mask) close(); });

  // ===== ① 密码登录 =====
  $('btnLogin').addEventListener('click', async () => {
    const email = $('loginEmail').value.trim();
    const pwd = $('loginPwd').value;
    if (!isEmail(email)) return toast('邮箱好像不对哦');
    if (!pwd) return toast('请输入密码');
    const btn = $('btnLogin');
    btn.disabled = true; btn.textContent = '登录中…';
    try {
      const data = await loginWithPassword(email, pwd);
      const name = data.user?.user_metadata?.display_name || email.split('@')[0];
      document.cookie = 'auth_name=' + encodeURIComponent(name) + ';path=/;max-age=31536000';
      toast('欢迎回来，' + name);
      close(); location.reload();
    } catch (e) {
      toast('邮箱或密码不正确');
      btn.disabled = false; btn.textContent = '登 录';
    }
  });

  // ===== ② 注册 =====
  $('btnRegister').addEventListener('click', async () => {
    const username = $('regUsername').value.trim();
    const email = $('regEmail').value.trim();
    const p1 = $('regPwd').value, p2 = $('regPwd2').value;
    if (!username) return toast('先给自己取个名字吧');
    if (!isEmail(email)) return toast('邮箱好像不对哦');
    if (!p1 || p1.length < 6) return toast('密码至少6位');
    if (p1 !== p2) return toast('两次密码不一致');
    const btn = $('btnRegister');
    btn.disabled = true; btn.textContent = '注册中…';
    try {
      const data = await registerWithEmail(email, p1, username);
      if (!data.session) {
        $('regTip').style.display = 'block';
        $('regTip').textContent = '验证码已寄往 ' + email;
        $('regCodeGroup').style.display = 'block';
        $('btnRegVerify').style.display = 'block';
        btn.style.display = 'none';
        toast('验证码已发送，查收邮箱');
      } else {
        toast('注册成功，欢迎加入，' + username);
        close(); location.reload();
      }
    } catch (e) {
      toast(e.message?.includes('already registered') ? '这个邮箱已经注册过啦，直接登录吧' : '注册失败：' + (e.message || '稍后再试'));
      btn.disabled = false; btn.textContent = '注册账号';
    }
  });

  $('btnRegVerify').addEventListener('click', async () => {
    const code = $('regCode').value.trim();
    if (code.length !== 6) return toast('输入6位验证码');
    const email = $('regEmail').value.trim();
    const username = $('regUsername').value.trim();
    try {
      await verifyAndLogin(email, code, username);
      document.cookie = 'auth_name=' + encodeURIComponent(username) + ';path=/;max-age=31536000';
      toast('注册完成，欢迎加入，' + username);
      close(); location.reload();
    } catch (e) {
      toast('验证失败：' + (e.message || '再试试'));
    }
  });

  // ===== ③ 验证码登录 / 找回密码 =====
  const resetCodeView = () => {
    $('codeEmailGroup').style.display = 'block';
    $('codeInputGroup').style.display = 'none';
    $('btnVerifyCode').style.display = 'none';
    const b = $('btnSendCode');
    b.style.display = 'block'; b.disabled = false; b.textContent = '发送验证码';
    $('codeInput').value = '';
    $('codeTip').textContent = '';
    clearInterval(countdown);
  };

  const goCode = (tip) => {
    sentEmail = '';
    $('codeEmail').value = $('loginEmail').value.trim();
    resetCodeView();
    if (tip) $('codeTip').textContent = tip;
    showView('code');
  };

  $('btnToCode').addEventListener('click', () => goCode(''));
  $('btnForgot').addEventListener('click', e => {
    e.preventDefault();
    goCode('输入注册邮箱，验证后即可重新设置密码');
    toast('验证后就能重设密码');
  });

  $('btnSendCode').addEventListener('click', async () => {
    const email = ($('codeInputGroup').style.display === 'none')
      ? $('codeEmail').value.trim()
      : sentEmail;
    if (!isEmail(email)) return toast('邮箱好像不对哦');
    sentEmail = email;
    const btn = $('btnSendCode');
    btn.disabled = true; btn.textContent = '发送中…';
    try {
      await sendVerificationCode(email);
      $('codeEmailGroup').style.display = 'none';
      $('codeInputGroup').style.display = 'block';
      $('btnVerifyCode').style.display = 'block';
      $('codeTip').textContent = '验证码已寄往 ' + email;
      toast('验证码已发送，查收邮箱');
      let sec = 60;
      clearInterval(countdown);
      const tick = () => {
        btn.textContent = sec > 0 ? sec + 's 后可重发' : '重新发送';
        if (sec-- <= 0) { clearInterval(countdown); btn.disabled = false; return; }
      };
      countdown = setInterval(tick, 1000); tick();
    } catch (e) {
      toast('发送失败：' + (e.message || '稍后再试'));
      btn.disabled = false; btn.textContent = '发送验证码';
    }
  });

  $('btnVerifyCode').addEventListener('click', async () => {
    const code = $('codeInput').value.trim();
    if (code.length !== 6) return toast('输入6位验证码');
    const btn = $('btnVerifyCode');
    btn.disabled = true; btn.textContent = '验证中…';
    try {
      await verifyAndLogin(sentEmail, code, null);
      document.cookie = 'auth_name=' + encodeURIComponent(sentEmail.split('@')[0]) + ';path=/;max-age=31536000';
      toast('登录成功！');
      showView('setpwd');
    } catch (e) {
      toast('验证码不对或已过期');
    }
    btn.disabled = false; btn.textContent = '验证登录';
  });

  // ===== ④ 设置密码 =====
  $('btnSetPwd').addEventListener('click', async () => {
    const p1 = $('newPwd').value, p2 = $('newPwd2').value;
    if (!p1 || p1.length < 6) return toast('密码至少6位');
    if (p1 !== p2) return toast('两次输入不一致');
    const btn = $('btnSetPwd');
    btn.disabled = true; btn.textContent = '保存中…';
    try {
      await setPassword(p1);
      toast('密码已保存，下次直接输密码进来');
      close(); location.reload();
    } catch (e) {
      toast('保存失败：' + (e.message || '再试试'));
      btn.disabled = false; btn.textContent = '保存密码';
    }
  });

  $('btnSkipPwd').addEventListener('click', () => { close(); location.reload(); });

  // ===== 返回 =====
  $('btnBackLogin2').addEventListener('click', e => { e.preventDefault(); showView('login'); });
  $('btnBackLogin3').addEventListener('click', e => { e.preventDefault(); resetCodeView(); showView('login'); });

  // ===== 头像上传 =====
  const avatarEl = $('userAvatar');
  const avatarInput = $('avatarInput');
  const editBadge = '<div class="avatar-edit">换</div>';
  const showAvatar = (url) => {
    if (url) {
      avatarEl.style.backgroundImage = `url(${url})`;
      avatarEl.textContent = '';
    } else {
      avatarEl.style.backgroundImage = '';
      avatarEl.textContent = name0;
    }
    avatarEl.insertAdjacentHTML('beforeend', editBadge);
  };
  avatarEl.addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast('图片太大了，换张小一点的');
    toast('头像上传中…');
    try {
      const url = await window.uploadAvatar(file);
      showAvatar(url);
      toast('头像已更新 ✨');
    } catch (e) {
      toast('上传失败：' + (e.message || '再试试'));
    }
    avatarInput.value = '';
  });

  // ===== 退出 =====
  $('btnSignOut').addEventListener('click', async () => {
    try { await uploadSnapshot(); } catch (e) {}
    sessionStorage.removeItem('cloud_restored');
    await signOut();
    close(); location.reload();
  });

  window.openAuthMask = function() {
    const m = document.getElementById('authMask');
    if (m) m.style.display = 'flex';
  };

  // ===== 启动：登录保护 + 云端同步 =====
  (async () => {
    const user = await getCurrentUser();
    if (user) {
      let synced = false;
      try { synced = await downloadSnapshot(); } catch (e) { console.warn('同步失败', e); }
      if (synced && !sessionStorage.getItem('cloud_restored')) {
        sessionStorage.setItem('cloud_restored', '1');
        toast('记忆已从云端恢复 ☁');
        location.reload();
        return;
      }
      const name = user.user_metadata?.display_name || user.email?.split('@')[0] || '旅人';
      name0 = name[0].toUpperCase();
      $('userName').textContent = name;
      $('userEmail').textContent = user.email;
      showAvatar(user.user_metadata?.avatar || null);
      showView('profile');
      if (sessionStorage.getItem('open_auth')) { mask.style.display = 'flex'; sessionStorage.removeItem('open_auth'); }
      else mask.style.display = 'none';
    } else {
      locked = true;
      showView('login');
      mask.style.display = 'flex';
    }
  })();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}