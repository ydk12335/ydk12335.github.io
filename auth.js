/**
 * 有点困 - 登录系统 v2
 * 双模式：密码登录 / 验证码登录 + 注册后设置密码
 */

const AUTH_HTML = `
<div class="auth-mask" id="authMask">
  <div class="auth-modal">
    <h3 class="auth-title">登 录</h3>
    <div class="auth-subtitle">登录后，你的记忆将随云端同步</div>

    <!-- 登录模式切换 -->
    <div class="auth-tabs" id="authTabs">
      <div class="auth-tab-slider" id="tabSlider"></div>
      <button class="auth-tab active" data-mode="password">密码登录</button>
      <button class="auth-tab" data-mode="code">验证码登录</button>
      <button class="auth-tab" data-mode="register">注 册</button>
    </div>

    <!-- 步骤A: 账号输入（密码/验证码共用） -->
    <div id="step1">
      <div class="form-group">
        <label class="form-label" id="usernameLabel">用户名</label>
        <input class="form-input" id="authUsername" type="text" placeholder="给自己取个名字" maxlength="20">
      </div>
      <div class="form-group">
        <label class="form-label">邮箱</label>
        <input class="form-input" id="authEmail" type="email" placeholder="you@example.com">
      </div>
      <div class="form-group" id="pwdGroup">
        <label class="form-label">密码</label>
        <input class="form-input" id="authPwd" type="password" placeholder="至少6位">
      </div>
      <button class="auth-btn-primary" id="btnLogin">登 录</button>
      <button class="auth-btn-ghost" id="btnSendCode" style="display:none">发送验证码</button>
      <div class="auth-tip" id="forgotTip" style="display:none;margin-top:8px">💡 忘记密码？切到上方「验证码登录」，用邮箱验证码进来后就能重新设置密码</div>
      <div class="auth-footer"><a href="#" id="btnForgot">忘记密码？</a> · <a href="#" id="authClose1">关闭</a></div>
    </div>

    <!-- 步骤R: 注册 -->
    <div id="stepR" style="display:none">
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
      <div class="auth-tip" id="regTip" style="display:none"></div>
      <div class="form-group" id="regCodeGroup" style="display:none">
        <label class="form-label">邮箱验证码</label>
        <input class="form-input" id="regCode" type="text" placeholder="6位数字" maxlength="6" inputmode="numeric">
      </div>
      <button class="auth-btn-primary" id="btnRegVerify" style="display:none">确认注册</button>
      <div class="auth-footer"><a href="#" id="authCloseR">关闭</a></div>
    </div>

    <!-- 步骤B: 验证码 -->
    <div id="step2" style="display:none">
      <div class="form-group">
        <label class="form-label">验证码</label>
        <input class="form-input" id="authCode" type="text" placeholder="6位数字" maxlength="6" inputmode="numeric">
      </div>
      <div class="auth-tip" id="codeTip"></div>
      <button class="auth-btn-primary" id="btnVerify">验证登录</button>
      <button class="auth-btn-ghost" id="btnBack">返回修改</button>
      <div class="auth-footer"><a href="#" id="authClose2">关闭</a></div>
    </div>

    <!-- 步骤C: 设置密码（新用户验证码登录成功后） -->
    <div id="step3" style="display:none">
      <div class="auth-tip">首次登录，设一个密码吧<br>以后就可以直接密码进入 ✨</div>
      <div class="form-group">
        <label class="form-label">设置密码</label>
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

    <!-- 已登录 -->
    <div id="authLogout" style="display:none">
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
/* 全局：禁止蓝色选区/长按高亮（按钮和交互元素） */
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
  border:none;
  backdrop-filter:blur(28px) saturate(190%);-webkit-backdrop-filter:blur(28px) saturate(190%);
  box-shadow:0 28px 72px rgba(4,2,18,.45), inset 0 1px 0 rgba(255,255,255,.3);
  animation:authPop .38s cubic-bezier(.16,1,.3,1)}
@keyframes authPop{from{opacity:0;transform:scale(.92) translateY(16px)}to{opacity:1;transform:none}}
.auth-title{font-size:1.08rem;color:#f0cf82;letter-spacing:.2em;margin-bottom:6px;font-weight:600}
.auth-subtitle{font-size:.72rem;color:rgba(240,207,130,.5);margin-bottom:20px;line-height:1.6}
.auth-tabs{display:flex;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);
  border-radius:999px;padding:4px;margin-bottom:18px;position:relative}
.auth-tab{flex:1;padding:9px 0;border:none;border-radius:999px;background:transparent;
  color:rgba(240,207,130,.5);font-family:inherit;font-size:.78rem;letter-spacing:.1em;cursor:pointer;
  transition:color .3s cubic-bezier(.4,0,.2,1);position:relative;z-index:1;user-select:none;-webkit-tap-highlight-color:transparent}
.auth-tab.active{color:#fffbef;font-weight:600}
.auth-tab-slider{position:absolute;top:4px;bottom:4px;border-radius:999px;z-index:0;
  background:linear-gradient(165deg,rgba(255,238,196,.28),rgba(240,207,130,.1));
  border:1px solid rgba(255,240,205,.3);
  box-shadow:0 2px 12px rgba(240,207,130,.18), inset 0 1px 0 rgba(255,255,255,.15);
  transition:left .38s cubic-bezier(.34,1.3,.5,1), width .38s cubic-bezier(.34,1.3,.5,1);
  pointer-events:none}
.form-group{margin-bottom:14px;text-align:left}
.form-label{display:block;font-size:.64rem;color:rgba(240,207,130,.5);margin-bottom:6px;letter-spacing:.1em}
.form-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);
  border-radius:12px;padding:12px 14px;color:#f2ede0;font-size:.9rem;outline:none;font-family:inherit;box-sizing:border-box}
.form-input::placeholder{color:#8d86b5}
.form-input:focus{border-color:rgba(240,207,130,.5);box-shadow:0 0 0 3px rgba(240,207,130,.10)}
.auth-btn-primary{width:100%;padding:13px;border-radius:999px;border:none;font-family:inherit;font-size:.9rem;
  letter-spacing:.15em;cursor:pointer;margin-top:4px;color:#fffbef;font-weight:600;
  background:linear-gradient(165deg,rgba(255,238,196,.38),rgba(240,207,130,.14) 44%,rgba(198,150,74,.22));
  border:none;
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

  const mask = document.getElementById('authMask');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const stepR = document.getElementById('stepR');
  const logoutView = document.getElementById('authLogout');
  const tabs = document.getElementById('authTabs');
  const pwdGroup = document.getElementById('pwdGroup');
  const btnLogin = document.getElementById('btnLogin');
  const btnSendCode = document.getElementById('btnSendCode');
  let mode = 'password';   // password | code
  let sentEmail = '', sentUsername = '', countdown = null, locked = false, isNewUser = false;

  const showStep = n => {
    step1.style.display = n === 1 ? 'block' : 'none';
    stepR.style.display = n === 5 ? 'block' : 'none';
    step2.style.display = n === 2 ? 'block' : 'none';
    step3.style.display = n === 3 ? 'block' : 'none';
    logoutView.style.display = n === 4 ? 'block' : 'none';
  };

  // 模式切换（带滑块动画）
  const tabSlider = document.getElementById('tabSlider');
  const moveSlider = (tab, animate = true) => {
    if (!tab || !tabSlider) return;
    tabSlider.style.transition = animate ? '' : 'none';
    tabSlider.style.left = tab.offsetLeft + 'px';
    tabSlider.style.width = tab.offsetWidth + 'px';
    if (!animate) requestAnimationFrame(() => tabSlider.style.transition = '');
  };
  tabs.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => {
    mode = t.dataset.mode;
    tabs.querySelectorAll('.auth-tab').forEach(x => x.classList.toggle('active', x === t));
    moveSlider(t);
    pwdGroup.style.display = mode === 'password' ? 'block' : 'none';
    btnLogin.style.display = mode === 'password' ? 'block' : 'none';
    btnSendCode.style.display = mode === 'code' ? 'block' : 'none';
    if (mode === 'register') showStep(5); else showStep(1);
    clearInterval(countdown);
    if (mode === 'code') { btnSendCode.disabled = false; btnSendCode.textContent = '发送验证码'; }
  }));
  // 初始定位（不播动画）
  moveSlider(tabs.querySelector('.auth-tab.active'), false);

  // 忘记密码：切到验证码登录并提示
  const forgotTip = document.getElementById('forgotTip');
  const btnForgot = document.getElementById('btnForgot');
  btnForgot._show = false;
  btnForgot.addEventListener('click', e => {
    e.preventDefault();
    btnForgot._show = true;
    const codeTab = tabs.querySelector('.auth-tab[data-mode="code"]');
    if (codeTab) codeTab.click();
    forgotTip.style.display = 'block';
    toast('用邮箱验证码登录后，即可重新设置密码');
  });
  // 切到密码登录时隐藏提示
  tabs.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => {
    if (forgotTip) forgotTip.style.display = (t.dataset.mode === 'code' && btnForgot._show) ? 'block' : 'none';
  }));

  const close = () => { if (!locked) mask.style.display = 'none'; };
  ['authClose1', 'authCloseR', 'authClose2', 'authClose3', 'authClose4'].forEach(id =>
    document.getElementById(id).addEventListener('click', e => { e.preventDefault(); close(); }));
  mask.addEventListener('click', e => { if (e.target === mask) close(); });

  const readAccount = () => {
    sentUsername = document.getElementById('authUsername').value.trim();
    sentEmail = document.getElementById('authEmail').value.trim();
    if (!sentUsername) { toast('先给自己取个名字吧'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sentEmail)) { toast('邮箱好像不对哦'); return false; }
    return true;
  };

  // 密码登录
  btnLogin.addEventListener('click', async () => {
    if (!readAccount()) return;
    const pwd = document.getElementById('authPwd').value;
    if (!pwd || pwd.length < 6) return toast('密码至少6位');
    btnLogin.disabled = true; btnLogin.textContent = '登录中…';
    try {
      const data = await loginWithPassword(sentEmail, pwd);
      const meta = data.user?.user_metadata?.display_name;
      document.cookie = 'auth_name=' + encodeURIComponent(sentUsername) + ';path=/;max-age=31536000';
      toast('欢迎回来，' + (meta || sentUsername));
      close(); location.reload();
    } catch (e) {
      toast(e.message?.includes('Invalid login') ? '邮箱或密码不对哦' : '登录失败：' + (e.message || '再试试'));
      btnLogin.disabled = false; btnLogin.textContent = '登 录';
    }
  });

  // ===== 注册流程 =====
  document.getElementById('btnRegister').addEventListener('click', async () => {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const p1 = document.getElementById('regPwd').value;
    const p2 = document.getElementById('regPwd2').value;
    if (!username) return toast('先给自己取个名字吧');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('邮箱好像不对哦');
    if (!p1 || p1.length < 6) return toast('密码至少6位');
    if (p1 !== p2) return toast('两次密码不一致');

    const btn = document.getElementById('btnRegister');
    btn.disabled = true; btn.textContent = '注册中…';
    try {
      const data = await registerWithEmail(email, p1, username);
      if (!data.session) {
        // 需要邮箱确认：显示验证码输入
        document.getElementById('regTip').style.display = 'block';
        document.getElementById('regTip').textContent = '验证码已寄往 ' + email + '，确认后即完成注册';
        document.getElementById('regCodeGroup').style.display = 'block';
        document.getElementById('btnRegVerify').style.display = 'block';
        btn.style.display = 'none';
        toast('验证码已发送，查收邮箱');
      } else {
        // 直接注册成功（项目关闭了邮箱确认时）
        toast('注册成功，欢迎加入，' + username);
        close(); location.reload();
      }
    } catch (e) {
      toast(e.message?.includes('already registered') ? '这个邮箱已经注册过啦，直接登录吧' : '注册失败：' + (e.message || '稍后再试'));
      btn.disabled = false; btn.textContent = '注册账号';
    }
  });

  // 注册验证码确认
  document.getElementById('btnRegVerify').addEventListener('click', async () => {
    const code = document.getElementById('regCode').value.trim();
    if (code.length !== 6) return toast('输入6位验证码');
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    try {
      await verifyAndLogin(email, code, username);
      toast('注册完成，欢迎加入，' + username);
      close(); location.reload();
    } catch (e) {
      toast('验证失败：' + (e.message || '再试试'));
    }
  });

  // 发送验证码
  btnSendCode.addEventListener('click', async () => {
    if (!readAccount()) return;
    btnSendCode.disabled = true; btnSendCode.textContent = '发送中…';
    try {
      await sendVerificationCode(sentEmail);
      showStep(2);
      document.getElementById('codeTip').textContent = '验证码已寄往 ' + sentEmail;
      toast('验证码已发送，查收邮箱');
      let sec = 60;
      clearInterval(countdown);
      const tick = () => {
        btnSendCode.textContent = sec > 0 ? `${sec}s 后重发` : '发送验证码';
        if (sec-- <= 0) { clearInterval(countdown); btnSendCode.disabled = false; return; }
      };
      countdown = setInterval(tick, 1000); tick();
    } catch (e) {
      toast('发送失败：' + (e.message || '稍后再试'));
      btnSendCode.disabled = false; btnSendCode.textContent = '发送验证码';
    }
  });

  // 验证码登录
  document.getElementById('btnVerify').addEventListener('click', async () => {
    const code = document.getElementById('authCode').value.trim();
    if (code.length !== 6) return toast('输入6位验证码');
    try {
      await verifyAndLogin(sentEmail, code, sentUsername);
      document.cookie = 'auth_name=' + encodeURIComponent(sentUsername) + ';path=/;max-age=31536000';
      // 检查是否已设过密码：从 session 拿不到该信息，统一引导设置（已设过可直接跳过）
      isNewUser = true;
      showStep(3);
      toast('登录成功！');
    } catch (e) {
      toast('验证失败：' + (e.message || '再试试'));
    }
  });

  document.getElementById('btnBack').addEventListener('click', () => {
    showStep(1);
    // 恢复倒计时状态
    if (mode === 'code') { btnSendCode.style.display = 'block'; btnLogin.style.display = 'none'; }
  });

  // 设置密码
  document.getElementById('btnSetPwd').addEventListener('click', async () => {
    const p1 = document.getElementById('newPwd').value;
    const p2 = document.getElementById('newPwd2').value;
    if (!p1 || p1.length < 6) return toast('密码至少6位');
    if (p1 !== p2) return toast('两次输入不一致');
    const btn = document.getElementById('btnSetPwd');
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

  // 跳过设置密码
  document.getElementById('btnSkipPwd').addEventListener('click', () => {
    close(); location.reload();
  });

  // ===== 头像上传 =====
  const avatarEl = document.getElementById('userAvatar');
  const avatarInput = document.getElementById('avatarInput');
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
  let name0 = '?';
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

  // 退出
  document.getElementById('btnSignOut').addEventListener('click', async () => {
    // 退出前把最新本地数据推上云端，防丢失
    try { await uploadSnapshot(); } catch (e) {}
    sessionStorage.removeItem('cloud_restored');
    await signOut();
    close(); location.reload();
  });

  window.openAuthMask = function() {
    const m = document.getElementById('authMask');
    if (m) m.style.display = 'flex';
  };

  // 全局登录保护
  (async () => {
    const user = await getCurrentUser();
    if (user) {
      // 云端同步：云端有快照→下载替换本地；云端为空→首次把本地上传
      let synced = false;
      try { synced = await downloadSnapshot(); } catch (e) { console.warn('同步失败', e); }
      if (synced && !sessionStorage.getItem('cloud_restored')) {
        sessionStorage.setItem('cloud_restored', '1');
        toast('记忆已从云端恢复 ☁');
        location.reload();   // 替换后刷新，让所有模块读到新数据
        return;
      }
      const name = user.user_metadata?.display_name || user.email?.split('@')[0] || '旅人';
      name0 = name[0].toUpperCase();
      document.getElementById('userName').textContent = name;
      document.getElementById('userEmail').textContent = user.email;
      showAvatar(user.user_metadata?.avatar || null);
      showStep(4);
      /* 点过悬浮球才打开资料弹窗 */
      if (sessionStorage.getItem('open_auth')) { mask.style.display = 'flex'; sessionStorage.removeItem('open_auth'); }
      else mask.style.display = 'none';
    } else {
      locked = true;
      mask.style.display = 'flex';   // 未登录：强制弹登录，必须登录才能用
    }
  })();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}