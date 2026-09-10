/**
 * 有点困 - 全站用户悬浮球（可拖动 · 悬停展开 · 水玻璃）
 * 已登录：头像（悬停展开显示用户名）；未登录：隐藏
 */
(function(){
  function getSession(){
    try{
      for(var k in localStorage){
        if(k.indexOf('sb-')===0 && k.indexOf('-auth-token')>0){
          var t=JSON.parse(localStorage.getItem(k));
          if(t&&t.access_token&&t.user)return t;
        }
      }
    }catch(e){}
    return null;
  }
  function ensureToast(){
    if(typeof window.toast==='function')return;
    window.toast=function(msg){
      var el=document.getElementById('auth-toast');
      if(!el){el=document.createElement('div');el.id='auth-toast';
        el.style.cssText='position:fixed;top:24px;left:50%;transform:translateX(-50%);background:rgba(10,8,25,.92);color:#f0cf82;padding:10px 22px;border-radius:20px;font-size:.82rem;z-index:99999;border:1px solid rgba(240,207,130,.25);transition:opacity .3s;pointer-events:none';
        document.body.appendChild(el);}
      el.textContent=msg;el.style.opacity='1';
      clearTimeout(el._t);el._t=setTimeout(function(){el.style.opacity='0';},2200);
    };
  }
  /* 通用拖动（贴边吸留 + 防误触点击） */
  function makeDraggable(el,onTap,onDragEnd){
    var dragging=false,moved=false,sx=0,sy=0,ox=0,oy=0;
    var pos=null;
    try{pos=JSON.parse(localStorage.getItem('uw_pos_'+el.id));}catch(e){}
    if(pos){
      el.style.left=pos.x+'px';el.style.top=pos.y+'px';el.style.right='auto';el.style.bottom='auto';
    }
    function down(x,y){
      dragging=true;moved=false;
      /* 记住按下前的展开状态（供点击判断），再收起 */
      el._wasOpen=el.classList.contains('expanded')||el.classList.contains('pinned');
      el.classList.remove('expanded','pinned');
      var r=el.getBoundingClientRect();
      ox=r.left;oy=r.top;sx=x;sy=y;
      el.style.transition='none';
    }
    function move(x,y){
      if(!dragging)return;
      var dx=x-sx,dy=y-sy;
      if(Math.abs(dx)>6||Math.abs(dy)>6)moved=true;
      var nx=ox+dx,ny=oy+dy;
      nx=Math.max(6,Math.min(window.innerWidth-el.offsetWidth-6,nx));
      ny=Math.max(6,Math.min(window.innerHeight-el.offsetHeight-6,ny));
      el.style.left=nx+'px';el.style.top=ny+'px';
      el.style.right='auto';el.style.bottom='auto';
    }
    function up(){
      if(!dragging)return;
      dragging=false;
      el.style.transition='';
      if(moved){
        /* 拖动结束：贴边吸留 + 定格展开 */
        var r=el.getBoundingClientRect();
        var cx=r.left+r.width/2;
        var nx=(cx<window.innerWidth/2)?10:window.innerWidth-r.width-10;
        el.style.transition='left .3s cubic-bezier(.22,1,.36,1)';
        el.style.left=nx+'px';
        setTimeout(function(){el.style.transition='';},320);
        try{localStorage.setItem('uw_pos_'+el.id,JSON.stringify({x:nx,y:r.top}));}catch(e){}
        /* 定格展开：吸边后保持展开状态 */
        setTimeout(function(){
          el.classList.add('expanded','pinned');
        },300);
      }else if(onTap)onTap();
    }
    var lastTouch=0;
    el.addEventListener('touchstart',function(e){lastTouch=Date.now();down(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
    el.addEventListener('touchmove',function(e){move(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
    el.addEventListener('touchend',function(){lastTouch=Date.now();up();});
    /* 触摸后浏览器会模拟 mouse 事件，500ms 内忽略，防止双触发 */
    el.addEventListener('mousedown',function(e){if(Date.now()-lastTouch<500)return;down(e.clientX,e.clientY);});
    document.addEventListener('mousemove',function(e){if(Date.now()-lastTouch<500)return;move(e.clientX,e.clientY);});
    document.addEventListener('mouseup',function(e){if(Date.now()-lastTouch<500)return;up();});
  }
  function init(){
    if(document.getElementById('uwFab'))return;
    ensureToast();
    var css=document.createElement('style');
    css.textContent=[
      '.uw-fab{position:fixed;top:calc(62px + env(safe-area-inset-top,0px));left:14px;z-index:9000;',
      'display:flex;align-items:center;gap:8px;height:42px;padding:3px;border-radius:999px;',
      'border:none;',
      'background:linear-gradient(160deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,.08) 100%);',
      'backdrop-filter:blur(24px) saturate(200%) brightness(1.08);-webkit-backdrop-filter:blur(24px) saturate(200%) brightness(1.08);',
      'box-shadow:inset 0 1.5px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(255,255,255,.08), 0 6px 24px rgba(0,0,0,.32);',
      'cursor:pointer;font-family:inherit;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:none;',
      'max-width:42px;transition:max-width .35s cubic-bezier(.22,1,.36,1),box-shadow .3s,background .3s}',
      '@media(hover:hover){.uw-fab:hover{max-width:170px;background:linear-gradient(160deg,rgba(255,255,255,.28) 0%,rgba(255,255,255,.12) 100%);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.5),inset 0 -1px 0 rgba(255,255,255,.12), 0 8px 28px rgba(240,207,130,.18)}',
      '.uw-fab:hover .uw-name{opacity:1;transform:translateX(0)}}',
      '.uw-fab:focus,.uw-fab:focus-visible{outline:none}',
      '.uw-av{width:36px;height:36px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;',
      'background:linear-gradient(135deg,#f0cf82,#c9a04c);color:#0a0815;font-size:.95rem;font-weight:bold;',
      'background-size:cover;background-position:center}',
      '.uw-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f6eecf;font-size:.82rem;letter-spacing:.12em;',
      'padding-right:10px;margin-left:2px;',
      'opacity:0;transform:translateX(-8px) scaleX(.9);transform-origin:left;transition:opacity .3s .1s,transform .35s cubic-bezier(.22,1,.36,1) .1s;min-width:0}',
      '.uw-fab.expanded .uw-name{opacity:1;transform:translateX(0) scaleX(1)}',
      '.uw-fab.expanded{max-width:190px;padding-right:12px}',
      '@media(hover:none){.uw-fab{max-width:42px}}'
    ].join('');
    document.head.appendChild(css);

    var btn=document.createElement('button');
    btn.className='uw-fab';btn.id='uwFab';btn.title='账号';
    var av=document.createElement('span');av.className='uw-av';av.id='uwAv';av.textContent='👤';
    var nm=document.createElement('span');nm.className='uw-name';nm.id='uwName';
    btn.appendChild(av);btn.appendChild(nm);
    document.body.appendChild(btn);

    var s=getSession();
    if(s&&s.user){
      var u=s.user;
      var name=(u.user_metadata&&u.user_metadata.display_name)||((u.email||'旅人').split('@'))[0]||'旅人';
      nm.textContent=name;
      var url=u.user_metadata&&u.user_metadata.avatar;
      if(url){av.style.backgroundImage='url('+url+')';av.textContent='';}
      else av.textContent=name[0].toUpperCase();
makeDraggable(btn,function(){
        /* 点击逻辑：按下前是否已展开（_wasOpen），已展开则直接打开资料 */
        if(el0WasOpen(btn)){
          if(typeof window.openAuthMask==='function')window.openAuthMask();
          else{var co=function(){if(typeof window.openAuthMask==='function')window.openAuthMask();else setTimeout(co,100);};co();}
          return;
        }
        /* 未展开：第一下展开显示名字，2.6秒后收回 */
        btn.classList.add('expanded');
        clearTimeout(btn._ct);
        btn._ct=setTimeout(function(){if(!btn.classList.contains('pinned'))btn.classList.remove('expanded');},2600);
      });
    }else{
      btn.style.display='none';
    }
  }
  function el0WasOpen(btn){
    /* down() 把按下前状态存在 _wasOpen；若为 true 则同时清掉定格 */
    if(btn._wasOpen){btn.classList.remove('pinned','expanded');btn._wasOpen=false;return true;}
    return btn.classList.contains('expanded')||btn.classList.contains('pinned');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();