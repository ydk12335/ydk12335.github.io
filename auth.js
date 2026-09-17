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
      <button class="auth-btn-primary" id="btnLogin">登 录</button>
      <button class="auth-btn-ghost" id="btnToCode">用邮箱验证码登录</button>
      <div class="auth-footer"><a href="#" id="btnForgot">忘记密码？</a> · <a href="#" id="btnToRegister">创建账号</a> · <a href="#" id="authClose1">关闭</a></div>
      <div class="auth-legal">
        <a href="#" id="btnAgreement">《用户协议与免责声明》</a>
        <span class="auth-legal-sep">·</span>
        <a href="#" id="btnContact">有问题加我</a>
      </div>
    </div>
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
        <input class="form-input" id="regCode" type="text" placeholder="8位数字" maxlength="8" inputmode="numeric">
      </div>
      <button class="auth-btn-primary" id="btnRegVerify" style="display:none">确认并登录</button>
      <div class="auth-tip" id="regTip" style="display:none"></div>
      <div class="auth-footer" id="regResendRow" style="display:none"><a href="#" id="btnResendRegCode">没收到验证码？重新发送</a></div>
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
        <input class="form-input" id="codeInput" type="text" placeholder="8位数字" maxlength="8" inputmode="numeric">
      </div>
      <button class="auth-btn-primary" id="btnVerifyCode" style="display:none">验证登录</button>
      <div class="auth-tip" id="codeTip"></div>
      <div class="auth-footer"><a href="#" id="btnBackLogin3">返回密码登录</a> · <a href="#" id="authClose2">关闭</a></div>
    </div>

    <!-- ④ 设置密码（验证码登录成功后） -->
    <div class="auth-view" id="viewSetPwd" style="display:none">
      <div class="auth-tip">登录成功！给账号设个登录密码，以后用邮箱+密码就能快速进来 ✨</div>
      <div class="form-group">
        <label class="form-label">新密码</label>
        <input class="form-input" id="newPwd" type="password" placeholder="至少6位">
      </div>
      <div class="form-group">
        <label class="form-label">再输一遍</label>
        <input class="form-input" id="newPwd2" type="password" placeholder="确认密码">
      </div>
      <button class="auth-btn-primary" id="btnSetPwd">保存密码</button>
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
      <div class="auth-footer"><a href="#" id="btnOpenVerif">邮箱验证</a> · <a href="#" id="authClose4">关闭</a></div>
    </div>

    <!-- ⑥ 邮箱真实性验证 · 公告 -->
    <div class="auth-view" id="viewVerif" style="display:none">
      <div class="verif-badge">🛡️</div>
      <div class="auth-tip verif-tip">亲爱的用户：<br><br>
        为营造安全、纯净的使用环境，我们近期加强了账号注册与登录的管理。<br><br>
        为防止<b>批量注册</b>与<b>恶意注册</b>，保障每一位用户的账号与数据安全，\
        恳请你配合完成一次邮箱真实性验证。过程约需一分钟，<b>你的全部数据将完整保留</b>。<br><br>
        在完成验证前，本公告会在每次进入时<span style="color:#ff8080">持续提醒</span>；<b>完成验证后将不再弹出</b>。\
        感谢你的理解与配合 ✦</div>
      <button class="auth-btn-primary" id="btnVerifyCurrent">验证当前邮箱</button>
      <button class="auth-btn-ghost" id="btnEmailProblem">邮箱用不了？更换邮箱</button>
      <div class="auth-footer"><a href="#" id="authCloseV">暂不验证</a></div>
    </div>

    <!-- ⑦ 验证当前邮箱 -->
    <div class="auth-view" id="viewVerifCode" style="display:none">
      <div class="form-group">
        <label class="form-label">当前邮箱</label>
        <input class="form-input" id="verifEmail" type="email" readonly>
      </div>
      <button class="auth-btn-primary" id="btnVerifSend">发送验证码</button>
      <div class="form-group" id="verifCodeGroup" style="display:none;margin-top:14px">
        <label class="form-label">验证码</label>
        <input class="form-input" id="verifCode" type="text" placeholder="8位数字" maxlength="8" inputmode="numeric">
      </div>
      <button class="auth-btn-primary" id="btnVerifOk" style="display:none">确认验证</button>
      <div class="auth-tip" id="verifTip"></div>
      <div class="auth-footer"><a href="#" id="btnVerifBack">返回</a></div>
    </div>

    <!-- ⑧ 更换邮箱（数据保留） -->
    <div class="auth-view" id="viewChangeEmail" style="display:none">
      <div class="auth-tip" style="margin-bottom:14px">更换后账号内所有数据（记忆、占卜记录、命盘等）都会保留，只会换掉登录邮箱 ✨</div>
      <div class="form-group">
        <label class="form-label">原邮箱</label>
        <input class="form-input" id="oldEmail" type="email" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">新邮箱</label>
        <input class="form-input" id="newEmail" type="email" placeholder="输入能正常收信的新邮箱">
      </div>
      <button class="auth-btn-primary" id="btnChangeSend">发送验证码到新邮箱</button>
      <div class="form-group" id="changeCodeGroup" style="display:none;margin-top:14px">
        <label class="form-label">验证码</label>
        <input class="form-input" id="changeCode" type="text" placeholder="8位数字" maxlength="8" inputmode="numeric">
      </div>
      <button class="auth-btn-primary" id="btnChangeOk" style="display:none">确认更换</button>
      <div class="auth-tip" id="changeTip"></div>
      <div class="auth-footer"><a href="#" id="btnChangeBack">返回</a></div>
    </div>
  </div>
</div>

<!-- 用户协议 / 联系方式 全屏弹层 -->
<div class="legal-mask" id="legalMask">
  <div class="legal-panel">
    <div class="legal-head">
      <div class="legal-title" id="legalTitle">用户协议</div>
      <div class="legal-sub" id="legalSub"></div>
      <button class="legal-close" id="legalClose">✕</button>
    </div>
    <div class="legal-body" id="legalBody"></div>
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
.auth-legal{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(240,207,130,.18);
  font-size:.66rem;color:rgba(240,207,130,.4);display:flex;justify-content:center;gap:6px;flex-wrap:wrap}
.auth-legal a{color:rgba(240,207,130,.6);text-decoration:none;letter-spacing:.05em}
.auth-legal a:active{color:#f0cf82}
.auth-legal-sep{color:rgba(240,207,130,.25)}
/* 协议 / 联系方式 全屏弹层 */
.legal-mask{position:fixed;inset:0;z-index:500;background:rgba(4,2,16,.7);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  display:none;align-items:stretch;justify-content:stretch;padding:0;animation:authFade .28s ease}
.legal-panel{width:100%;height:100%;background:rgba(20,13,38,.97);color:#f2ede0;
  font-family:"Ma Shan Zheng","Xingkai SC","STXingkai","Kaiti SC","STKaiti","KaiTi","楷体",serif;
  display:flex;flex-direction:column;overflow:hidden;animation:authPop .35s cubic-bezier(.16,1,.3,1)}
.legal-head{position:relative;padding:18px 20px 13px;text-align:center;
  background:linear-gradient(165deg,rgba(255,238,196,.1),rgba(240,207,130,.03));
  border-bottom:1px solid rgba(240,207,130,.14)}
.legal-title{font-size:1.02rem;color:#f0cf82;font-weight:600;letter-spacing:.2em;text-indent:.2em}
.legal-sub{font-size:.62rem;color:rgba(240,207,130,.5);margin-top:3px}
.legal-close{position:absolute;top:12px;right:14px;width:30px;height:30px;border-radius:50%;
  border:1px solid rgba(240,207,130,.25);background:rgba(255,255,255,.04);color:#f0cf82;
  font-size:.7rem;cursor:pointer;font-family:inherit;line-height:1;transition:.2s}
.legal-close:active{transform:scale(.9);background:rgba(240,207,130,.15)}
.legal-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:16px 18px 26px;
  font-size:.74rem;color:rgba(240,207,130,.75);line-height:2}
.legal-body::-webkit-scrollbar{width:0}
.legal-body b{color:#f0cf82;font-weight:600}
.legal-body p{margin-bottom:10px}
.legal-contact{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:28px 20px;text-align:center}
.legal-contact .lc-tip{font-size:.7rem;color:rgba(240,207,130,.6);margin-bottom:14px;line-height:1.8}
.legal-contact img{display:block;width:auto;height:auto;max-width:78vw;max-height:60vh;
  -webkit-user-select:all;user-select:all;-webkit-touch-callout:default;touch-action:manipulation;
  border-radius:16px;border:2px solid rgba(240,207,130,.3);background:#fff;box-shadow:0 14px 44px rgba(0,0,0,.45)}
.legal-contact .lc-sub{font-size:.62rem;color:rgba(240,207,130,.4);margin-top:14px}
/* ===== 邮箱真实性验证 · 公告 ===== */
.verif-badge{font-size:2rem;margin:6px auto 10px;animation:verifFloat 2.4s ease-in-out infinite}
@keyframes verifFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.verif-tip{max-height:46vh;overflow-y:auto;overscroll-behavior:contain;text-align:left;
  font-size:.75rem;line-height:1.85;color:rgba(240,207,130,.72);padding:0 2px;margin-bottom:8px}
.verif-tip b{color:#f0cf82}
.verif-tip::-webkit-scrollbar{width:0}
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

  const VIEWS = { login: 'viewLogin', register: 'viewRegister', code: 'viewCode', setpwd: 'viewSetPwd', profile: 'authLogout', verif: 'viewVerif', verifcode: 'viewVerifCode', changeemail: 'viewChangeEmail' };
  const TEXT = {
    login:    ['登 录',      '登录后，你的记忆将随云端同步'],
    register: ['注 册',      '创建账号，随时同步你的记忆'],
    code:     ['验证码登录', '用邮箱收到的验证码登录'],
    setpwd:   ['设置密码',   '以后用密码就能快速登录'],
    profile:  ['我 的',      ''],
    verif:    ['邮箱验证',   '保障账号安全与数据纯净'],
    verifcode:['验证当前邮箱', '输入收到的验证码即可完成'],
    changeemail:['更换邮箱', '数据完整保留 · 凭证更新']
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

  ['authClose1', 'authCloseR', 'authClose2', 'authClose3', 'authClose4', 'authCloseV'].forEach(id =>
    $(id).addEventListener('click', e => { e.preventDefault(); close(); }));
  mask.addEventListener('click', e => { if (e.target === mask) close(); });

  // ===== 用户协议 / 联系方式（登录下方链接） =====
  const legalMask = $('legalMask');
  const legalTitle = $('legalTitle');
  const legalBody = $('legalBody');
  const legalSub = $('legalSub');
  const openLegal = (title, sub, html) => {
    if (!legalMask) return;
    legalTitle.textContent = title;
    legalSub.textContent = sub || '';
    legalBody.innerHTML = html;
    legalBody.scrollTop = 0;
    legalMask.style.display = 'flex';
  };
  const closeLegal = () => { if (legalMask) legalMask.style.display = 'none'; };
  const AGREEMENT_HTML =
    '<p><b>《用户协议与免责声明》</b></p>' +
    '<p>欢迎使用「有点困 · Sleepy Space」。在使用本站任何功能前，请仔细阅读以下条款。<b>使用本站即代表你已阅读、理解并同意本协议的全部内容。</b></p>' +
    '<p><b>一、服务性质</b><br>本站所有内容（包括但不限于塔罗占卜、星座运势、易经问卦、AI 解读等）均由人工智能生成，仅供娱乐与参考，不构成任何专业建议。</p>' +
    '<p><b>二、不作保证</b><br>所有解读结果仅供参考，不构成医疗、法律、金融、心理、投资或其他专业领域的建议。据此作出的任何决策或行动，均由你自行承担后果，与本站无关。</p>' +
    '<p><b>三、责任豁免</b><br>因使用本站内容导致的任何直接或间接损失、精神损害或误解，本站及开发者均不承担任何责任。</p>' +
    '<p><b>四、内容版权</b><br>页面设计、代码与原创内容版权归开发者所有，未经书面许可，不得复制、转载、修改或用于商业用途。</p>' +
    '<p><b>五、数据说明</b><br>未登录时，你的占卜记录仅保存在设备本地（localStorage），开发者不收集、不存储。登录后，记录会同步到你本人账号的云端存储（仅你本人可见，用于多设备恢复），开发者不会查看或收集这些内容。为保护隐私，登录成功及退出登录时都会自动清空本机缓存：未登录期间的本地记录登录后不会保留，退出后本机不残留任何记录。请妥善保管设备与账号，清除浏览器数据或关闭隐私模式窗口将导致未同步的记录丢失。</p>' +
    '<p><b>六、账号与登录</b><br>登录用于云端同步你的记忆；登录/退出时均会清空本机缓存，防止数据残留。请妥善保管账号密码，因账号保管不当造成的损失由用户自行承担。</p>' +
    '<p><b>七、协议更新</b><br>本站有权随时修改本协议。修改后的协议公布即生效，继续使用本站即视为同意更新后的协议。</p>' +
    '<p><b>八、争议解决</b><br>如发生争议，双方应友好协商解决；协商不成的，提交开发者所在地有管辖权的人民法院处理。</p>' +
    '<p><b>九、其他</b><br>凡使用本站即视为同意上述全部条款。如对本协议有任何疑问，可联系开发者咨询。</p>';
  const CONTACT_HTML =
    '<div class="legal-contact">' +
    '<div class="lc-tip">遇到问题？欢迎加我聊聊<br>反馈建议、报 bug、闲聊都行 ✦</div>' +
    '<img src="assets/qr-contact.png" alt="联系方式二维码">' +
    '<div class="lc-sub">长按识别二维码 · 添加好友</div>' +
    '</div>';

  const btnAgree = $('btnAgreement');
  if (btnAgree) btnAgree.addEventListener('click', e => {
    e.preventDefault();
    openLegal('用户协议与免责声明', '使用即代表同意', AGREEMENT_HTML);
  });
  const btnContact = $('btnContact');
  if (btnContact) btnContact.addEventListener('click', e => {
    e.preventDefault();
    openLegal('有问题加我', '长按识别二维码', CONTACT_HTML);
  });
  const legalCloseBtn = $('legalClose');
  if (legalCloseBtn) legalCloseBtn.addEventListener('click', closeLegal);
  if (legalMask) legalMask.addEventListener('click', e => { if (e.target === legalMask) closeLegal(); });

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
      /* 用户名唯一性校验：RPC 存在则前端直接拦截；RPC 缺失/失败降级为注册报错提示 */
      if (typeof window.checkUsernameTaken === 'function') {
        try {
          const taken = await window.checkUsernameTaken(username);
          if (taken) {
            toast('这个名字已经有人用啦，换一个吧');
            btn.disabled = false; btn.textContent = '注册账号';
            return;
          }
        } catch (e) { /* RPC 不存在或网络异常：跳过预检，交给注册流程兜底 */ }
      }
      /* 邮箱是否已注册：与用户名同一套 RPC 判定；已注册就别再走 signUp，直接引导去登录 */
      if (typeof window.checkEmailRegistered === 'function') {
        try {
          const registered = await window.checkEmailRegistered(email);
          if (registered) {
            toast('这个邮箱已经注册过啦，直接登录吧');
            $('loginEmail').value = email;
            showView('login');
            btn.disabled = false; btn.textContent = '注册账号';
            return;
          }
        } catch (e) { /* RPC 不存在或网络异常：跳过预检，交给注册流程兜底 */ }
      }
      const data = await registerWithEmail(email, p1, username);
      if (!data.session) {
        $('regTip').style.display = 'block';
        $('regTip').textContent = '验证码已寄往 ' + email + '，填 8 位验证码完成注册';
        $('regCodeGroup').style.display = 'block';
        $('btnRegVerify').style.display = 'block';
        $('regResendRow').style.display = 'block';
        btn.style.display = 'none';
        toast('验证码已发送，查收邮箱');
      } else {
        toast('注册成功，欢迎加入，' + username);
        close(); location.reload();
      }
    } catch (e) {
      const msg = String(e?.message || '');
      const dupName = msg.includes('duplicate') || msg.includes('unique') || msg.includes('用户名') || msg.includes('Database error saving new user');
      toast(msg.includes('already registered') ? '这个邮箱已经注册过啦，直接登录吧'
        : (dupName ? '这个名字已经有人用啦，换一个吧' : '注册失败：' + (msg || '稍后再试')));
      btn.disabled = false; btn.textContent = '注册账号';
    }
  });

  $('btnRegVerify').addEventListener('click', async () => {
    const code = $('regCode').value.trim();
    if (code.length !== 8) return toast('输入8位验证码');
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
    btn.disabled = true; btn.textContent = '检查中…';
    try {
      /* 分流：未注册 → 引导去注册；已注册 → 才发验证码（避免 OTP 静默占坑） */
      let registered = false;
      if (typeof window.checkEmailRegistered === 'function') {
        try { registered = await window.checkEmailRegistered(email); }
        catch (e) { /* RPC 不存在/网络异常：走老逻辑，直接发验证码兜底 */ }
      }
      if (!registered) {
        /* 未注册 → 跳到注册页并预填邮箱 */
        $('regEmail').value = email;
        $('regTip').style.display = 'none';
        toast('这个邮箱还没注册，先创建个账号吧');
        showView('register');
        btn.disabled = false; btn.textContent = '发送验证码';
        return;
      }
      /* 已注册 → 发验证码 */
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
      const m = String(e && e.message || '');
      /* 兜底分流：RPC 未部署时，未注册邮箱发码会被 Supabase 拒绝（otp_disabled），
         同样判定为「未注册」，引导去注册页，避免干巴巴的报错 */
      if (e && (e.code === 'otp_disabled' || m.includes('Signups not allowed'))) {
        $('regEmail').value = email;
        $('regTip').style.display = 'none';
        toast('这个邮箱还没注册，先创建个账号吧');
        showView('register');
      } else {
        toast('发送失败：' + (m || '稍后再试'));
      }
      btn.disabled = false; btn.textContent = '发送验证码';
    }
  });

  $('btnVerifyCode').addEventListener('click', async () => {
    const code = $('codeInput').value.trim();
    if (code.length !== 8) return toast('输入8位验证码');
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

  // ===== ④ 设置密码（注册完成 / 验证码登录后必填，无跳过） =====
  $('btnSetPwd').addEventListener('click', async () => {
    const p1 = $('newPwd').value, p2 = $('newPwd2').value;
    if (!p1 || p1.length < 6) return toast('密码至少6位');
    if (p1 !== p2) return toast('两次输入不一致');
    const btn = $('btnSetPwd');
    btn.disabled = true; btn.textContent = '保存中…';
    try {
      await setPassword(p1);
      toast('密码已设置，下次直接用密码登录');
      close(); location.reload();
    } catch (e) {
      const code = e && e.code ? String(e.code) : '';
      const msg = String((e && e.message) || '');
      /* 这个密码就是账号现有密码（注册时已存过）：目标已达成，直接放行，不能把用户卡死在这一页 */
      if (code === 'same_password' || msg.includes('should be different from the old password')) {
        toast('已沿用你原来的密码 ✨');
        close(); location.reload();
        return;
      }
      /* 后台若开启「Secure password change」会要求最近一次登录才让改密码 */
      if (code === 'reauthentication_needed' || msg.includes('reauthentication')) {
        toast('为安全起见，请退出后用验证码重新登录再设密码');
      } else {
        toast('保存失败：' + (msg || '再试试'));
      }
      btn.disabled = false; btn.textContent = '保存密码';
    }
  });

  /* 设密码页的「关闭」：此时已登录，关掉并刷新页面反映登录态 */
  $('authClose3').addEventListener('click', e => { e.preventDefault(); close(); location.reload(); });

  // ===== 返回 =====
  $('btnToRegister').addEventListener('click', e => {
    e.preventDefault();
    /* 回到注册第一步：隐藏验证码区，恢复「注册账号」按钮 */
    try {
      $('regCodeGroup').style.display = 'none';
      $('btnRegVerify').style.display = 'none';
      $('regResendRow').style.display = 'none';
      $('regTip').style.display = 'none';
      $('regCode').value = '';
      const rb = $('btnRegister'); rb.style.display = 'block'; rb.disabled = false; rb.textContent = '注册账号';
    } catch (err) {}
    showView('register');
  });

  /* 重新发送注册验证码（验证码过期/没收到时用，60 秒冷却） */
  $('btnResendRegCode').addEventListener('click', async e => {
    e.preventDefault();
    const email = $('regEmail').value.trim();
    if (!isEmail(email)) return toast('邮箱好像不对哦');
    const a = $('btnResendRegCode');
    if (a.dataset.busy === '1') return;
    a.dataset.busy = '1';
    a.textContent = '发送中…';
    try {
      await resendSignupCode(email);
      toast('验证码已重新发送，查收邮箱');
      let sec = 60;
      const t = setInterval(() => {
        a.textContent = sec > 0 ? sec + 's 后可重发' : '没收到验证码？重新发送';
        if (sec-- <= 0) { clearInterval(t); a.dataset.busy = ''; }
      }, 1000);
    } catch (err) {
      a.textContent = '没收到验证码？重新发送';
      a.dataset.busy = '';
      toast('重发失败：' + (err.message || '稍后再试'));
    }
  });
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
    try { await (window.flushUpload || uploadSnapshot)(); } catch (e) {}
    /* 退出即清理本地缓存（云端保留），避免在他人设备上残留记忆 */
    try { if (typeof window.clearLocalCache === 'function') window.clearLocalCache(); } catch (e) {}
    sessionStorage.removeItem('cloud_restored');
    await signOut();
    close(); location.reload();
  });

  // ===== ⑥⑦⑧ 邮箱真实性验证 · 公告 =====
  /* 视图切换（保持在登录弹窗内，复用 showView） */
  const verifCurr = { email: '', codeSent: false };
  const verifChange = { email: '', codeSent: false };

  const openVerifView = (name) => {
    try {
      if (name === 'verifcode' && verifCurr.email) $('verifEmail').value = verifCurr.email;
      if (name === 'changeemail') $('oldEmail').value = verifCurr.email;
    } catch (e) {}
    showView(name);
  };

  /* 从「我 的」页打开验证公告 */
  $('btnOpenVerif').addEventListener('click', e => {
    e.preventDefault();
    openVerifView('verif');
  });

  /* 公告 → 验证当前邮箱 */
  $('btnVerifyCurrent').addEventListener('click', e => {
    e.preventDefault();
    openVerifView('verifcode');
  });

  /* 公告 → 更换邮箱 */
  $('btnEmailProblem').addEventListener('click', e => {
    e.preventDefault();
    openVerifView('changeemail');
  });

  /* 验证当前邮箱：发送验证码 */
  $('btnVerifSend').addEventListener('click', async () => {
    const email = $('verifEmail').value.trim() || verifCurr.email;
    if (!isEmail(email)) return toast('邮箱好像不对哦');
    verifCurr.email = email;
    const btn = $('btnVerifSend');
    btn.disabled = true; btn.textContent = '发送中…';
    try {
      await sendVerificationCode(email);
      $('verifCodeGroup').style.display = 'block';
      $('btnVerifOk').style.display = 'block';
      $('verifTip').textContent = '验证码已寄往 ' + email + '，请查收';
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

  /* 验证当前邮箱：输入验证码确认 */
  $('btnVerifOk').addEventListener('click', async () => {
    const code = $('verifCode').value.trim();
    if (code.length !== 8) return toast('输入8位验证码');
    const btn = $('btnVerifOk');
    btn.disabled = true; btn.textContent = '验证中…';
    try {
      /* 用当前邮箱验证码完成一次登录态确认（type=email），再标记已验证 */
      await verifyEmailOtp(verifCurr.email, code);
      await markEmailVerified();
      toast('邮箱验证通过，谢谢你 ✨');
      close(); location.reload();
    } catch (e) {
      toast('验证码不对或已过期');
      btn.disabled = false; btn.textContent = '确认验证';
    }
  });

  /* 更换邮箱：发送验证码到新邮箱 */
  $('btnChangeSend').addEventListener('click', async () => {
    const email = $('newEmail').value.trim();
    if (!isEmail(email)) return toast('新邮箱好像不对哦');
    if (email.toLowerCase() === String(verifCurr.email).toLowerCase()) return toast('新旧邮箱一样啦，直接用上面的验证就好');
    const btn = $('btnChangeSend');
    btn.disabled = true; btn.textContent = '检查中…';
    try {
      /* 判重：新邮箱已被别人注册则拒绝 */
      if (typeof window.checkEmailRegistered === 'function') {
        try {
          const taken = await window.checkEmailRegistered(email);
          if (taken) {
            toast('这个邮箱已经注册过啦，换个新的吧');
            btn.disabled = false; btn.textContent = '发送验证码到新邮箱';
            return;
          }
        } catch (e) { /* RPC 异常则跳过预检，交给 Supabase 兜底 */ }
      }
      verifChange.email = email;
      await requestEmailChange(email);
      $('changeCodeGroup').style.display = 'block';
      $('btnChangeOk').style.display = 'block';
      $('changeTip').textContent = '验证码已寄往 ' + email + '，请查收';
      toast('验证码已发送到新邮箱');
      let sec = 60;
      clearInterval(countdown);
      const tick = () => {
        btn.textContent = sec > 0 ? sec + 's 后可重发' : '重新发送';
        if (sec-- <= 0) { clearInterval(countdown); btn.disabled = false; return; }
      };
      countdown = setInterval(tick, 1000); tick();
    } catch (e) {
      const msg = String(e?.message || '');
      toast(msg.includes('already been registered') || msg.includes('already used') ? '这个邮箱已经注册过啦，换个新的吧' : ('发送失败：' + (msg || '稍后再试')));
      btn.disabled = false; btn.textContent = '发送验证码到新邮箱';
    }
  });

  /* 更换邮箱：输入新邮箱验证码，完成换绑 */
  $('btnChangeOk').addEventListener('click', async () => {
    const code = $('changeCode').value.trim();
    if (code.length !== 8) return toast('输入8位验证码');
    const btn = $('btnChangeOk');
    btn.disabled = true; btn.textContent = '更换中…';
    try {
      await confirmEmailChange(verifChange.email, code);
      /* 换绑成功后：user id 不变，业务数据全保留；同步资料表邮箱 + 标记已验证 */
      try { await updateProfileEmail(verifChange.email); } catch (e) { console.warn('同步资料邮箱失败', e); }
      try { await markEmailVerified(); } catch (e) { console.warn('标记已验失败', e); }
      toast('邮箱已更换，数据完整保留 ✨');
      close(); location.reload();
    } catch (e) {
      toast('验证码不对或已过期');
      btn.disabled = false; btn.textContent = '确认更换';
    }
  });

  /* 返回公告 */
  $('btnVerifBack').addEventListener('click', e => { e.preventDefault(); openVerifView('verif'); });
  $('btnChangeBack').addEventListener('click', e => { e.preventDefault(); openVerifView('verif'); });

  window.openAuthMask = function() {
    const m = document.getElementById('authMask');
    if (m) m.style.display = 'flex';
  };
  window.openLegal = openLegal;
  window.closeLegal = closeLegal;
  window.CONTACT_HTML = CONTACT_HTML;
  window.agreementTitle = '用户协议与免责声明';
  window.agreementSub = '使用即代表同意';

  // ===== 启动：登录保护（云端同步由 supabase-config.js 的 bootCloudSync 统一处理） =====
  (async () => {
    const user = await getCurrentUser();
    if (user) {
      const name = user.user_metadata?.display_name || user.email?.split('@')[0] || '旅人';
      name0 = name[0].toUpperCase();
      $('userName').textContent = name;
      $('userEmail').textContent = user.email;
      showAvatar(user.user_metadata?.avatar || null);
      showView('profile');
      verifCurr.email = user.email || '';
      /* 邮箱真实性验证公告：未标记 email_verified 则自动弹出（严谨，直到完成验证）；
         「暂不验证」仅本次会话不再弹（sessionStorage），下次进入继续提醒 */
      const emailVerified = !!(user.user_metadata && user.user_metadata.email_verified);
      if (!emailVerified && !sessionStorage.getItem('verif_dismissed')) {
        mask.style.display = 'flex';
        openVerifView('verif');
      } else if (sessionStorage.getItem('open_auth')) {
        mask.style.display = 'flex';
        sessionStorage.removeItem('open_auth');
      } else {
        mask.style.display = 'none';
      }
      /* 「暂不验证」：本次会话不再自动弹 */
      try {
        $('authCloseV').addEventListener('click', () => { sessionStorage.setItem('verif_dismissed', '1'); });
      } catch (e) {}
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