/* ============================================================
   夜色电台 · 塔罗同款音乐播放器（自包含版）
   在任意页面 </body> 前引入：
   <script src="/music-widget.js"></script>
   样式/弹层/逻辑全部自带，自动适配任意目录深度
   ============================================================ */
(function(){
  if(window.__MU_WIDGET__)return;window.__MU_WIDGET__=1;
  var $=s=>document.querySelector(s);
  /* 目录深度自适应：根路径 -> ''，/astro/ -> '../'，/astro/pair/ -> '../../' */
  var seg=location.pathname.replace(/\/[^\/]*$/,'').split('/').filter(Boolean);
  var pre='';for(var i=0;i<seg.length;i++)pre+='../';

  /* ---------- 样式（塔罗同款） ---------- */
  var css=document.createElement('style');
  css.textContent=[
    '.mu-fab{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom));right:16px;z-index:9000;',
    'width:42px;height:42px;border-radius:50%;border:1px solid rgba(240,207,130,.3);',
    'background:rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    'color:#f0cf82;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'transition:all .3s;box-shadow:0 4px 16px rgba(0,0,0,.35)}',
    '.mu-fab:active{transform:scale(.92);background:rgba(240,207,130,.14)}',
    '.mu-fab.on{border-color:rgba(240,207,130,.7);box-shadow:0 0 14px rgba(240,207,130,.35)}',
    '.mu-mask{position:fixed;inset:0;z-index:9001;background:rgba(5,3,18,.7);backdrop-filter:blur(6px);',
    '-webkit-backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:18px}',
    '.mu-mask.open{display:flex}',
    '.mu-modal{width:min(480px,94%);max-height:min(84vh,700px);display:flex;flex-direction:column;',
    'background:rgba(16,10,38,.9);border:1px solid rgba(240,207,130,.25);border-radius:22px;padding:20px;',
    'box-shadow:0 22px 56px rgba(4,2,18,.6)}',
    '.mu-modal h3{margin:0 0 8px;color:#f0cf82;font-size:1.02rem;letter-spacing:.5em;text-indent:.5em;text-align:center;font-weight:500}',
    '.mu-body{flex:1;overflow-y:auto;min-height:0;-webkit-overflow-scrolling:touch}',
    '.mu-now{text-align:center;font-size:.95rem;color:#f0cf82;letter-spacing:.08em;margin:6px 0 14px;min-height:1.4em}',
    '.mu-ctl{display:flex;justify-content:center;align-items:center;gap:18px;margin-bottom:12px}',
    '.mu-btn{width:46px;height:46px;border-radius:50%;font-size:1rem;cursor:pointer;color:#f0cf82;',
    'border:1px solid rgba(240,207,130,.32);background:rgba(255,255,255,.06);transition:all .25s}',
    '.mu-btn:active{transform:scale(.92)}',
    '.mu-btn--main{width:62px;height:62px;display:flex;align-items:center;justify-content:center;',
    'background:linear-gradient(160deg,rgba(240,207,130,.22),rgba(240,207,130,.08));',
    'border-color:rgba(240,207,130,.55);box-shadow:0 6px 20px rgba(240,207,130,.18)}',
    '.mu-bar{position:relative;height:18px;cursor:pointer;display:flex;align-items:center}',
    '.mu-bar::before{content:"";position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);height:5px;border-radius:99px;background:rgba(255,255,255,.08)}',
    '.mu-bar-fill{position:absolute;left:0;top:50%;transform:translateY(-50%);height:5px;width:0%;border-radius:99px;pointer-events:none;',
    'background:linear-gradient(90deg,rgba(240,207,130,.5),rgba(240,207,130,.9));transition:width .15s linear}',
    '.mu-time{display:flex;justify-content:space-between;font-size:.68rem;color:#8f86b8;margin:6px 2px 12px}',
    '.mu-list{border-top:1px solid rgba(240,207,130,.15);padding-top:8px}',
    '.mu-efx{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin:14px 2px 4px}',
    '.mu-efx .mu-efx-label{font-size:.78rem;color:#8b82b0;letter-spacing:1px;margin-right:2px}',
    '.mu-chip{padding:6px 13px;font-size:.78rem;border-radius:999px;cursor:pointer;',
    'background:rgba(255,255,255,.06);color:#b9b1dd;border:1px solid rgba(255,255,255,.12);transition:.25s;white-space:nowrap}',
    '.mu-chip.on{background:rgba(180,150,255,.26);color:#fff;border-color:rgba(180,150,255,.7);box-shadow:0 0 12px rgba(180,150,255,.35)}',
    '.mu-item{display:flex;justify-content:space-between;align-items:center;padding:9px 10px;border-radius:10px;',
    'font-size:.86rem;color:#d8d0ef;cursor:pointer;transition:background .2s}',
    '.mu-item:active{background:rgba(240,207,130,.08)}',
    '.mu-item.playing{color:#f0cf82;background:rgba(240,207,130,.12)}',
    '.mu-item .mi-idx{opacity:.45;font-size:.75rem;margin-right:8px}',
    '.mu-foot{text-align:center;margin-top:12px;flex:none;display:flex;gap:10px;justify-content:center}',
    '.mu-foot button{padding:9px 18px;border-radius:12px;border:1px solid rgba(240,207,130,.3);',
    'background:rgba(240,207,130,.08);color:#f0cf82;font-size:.85rem;cursor:pointer;font-family:inherit}'
  ].join('');
  document.head.appendChild(css);

  /* ---------- 悬浮按钮 ---------- */
  var fab=document.createElement('button');
  fab.className='mu-fab';fab.title='音乐';fab.textContent='🎵';
  document.body.appendChild(fab);

  /* ---------- 弹层 ---------- */
  var mask=document.createElement('div');mask.className='mu-mask';
  mask.innerHTML=
    '<div class="mu-modal"><h3>音 乐</h3><div class="mu-body">'+
    '<div class="mu-now" id="muNow">未在播放</div>'+
    '<div class="mu-ctl">'+
    '<button class="mu-btn" id="muPrev">⏮</button>'+
    '<button class="mu-btn mu-btn--main" id="muPlay"><svg id="muIconPlay" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15c0 .8.9 1.3 1.6.9l12-7.5c.6-.4.6-1.4 0-1.8l-12-7.5C7.9 3.2 7 3.7 7 4.5z"/></svg><svg id="muIconPause" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg></button>'+
    '<button class="mu-btn" id="muNext">⏭</button></div>'+
    '<div class="mu-bar" id="muBar"><div class="mu-bar-fill" id="muBarFill"></div></div>'+
    '<div class="mu-time"><span id="muCur">0:00</span><span id="muDur">0:00</span></div>'+
    '<div class="mu-list" id="muList"></div>'+
    '<div class="mu-efx" id="muEfx"><span class="mu-efx-label">音效</span>'+
    '<button class="mu-chip on" data-efx="none">原声</button>'+
    '<button class="mu-chip" data-efx="surround">双耳环绕</button>'+
    '<button class="mu-chip" data-efx="bass">低音增强</button>'+
    '<button class="mu-chip" data-efx="echo">回声</button>'+
    '<button class="mu-chip" data-efx="space">空间感</button></div></div>'+
    '<div class="mu-foot"><button id="muMode">循环：列表</button><button id="muClose">关 闭</button></div></div>';
  document.body.appendChild(mask);

  var $id=s=>document.getElementById(s);
  var nowEl=$id('muNow'),listEl=$id('muList'),fill=$id('muBarFill'),bar=$id('muBar'),
      curEl=$id('muCur'),durEl=$id('muDur'),playBtn=$id('muPlay'),
      iconPlay=$id('muIconPlay'),iconPause=$id('muIconPause');

  /* ---------- 歌单 ---------- */
  var TRACKS=[];
  var FALLBACK=['11.mp3','daylight.mp3','一个人想着一个人.mp3','不值得.mp3','不能说的秘密.mp3',
    '你还要我怎样.mp3','剩下的盛夏.mp3','半岛铁盒.mp3','唯一.mp3','嗜好.mp3',
    '嘉宾.mp3','夏天的风.mp3','如果呢.mp3','平庸.mp3','开往春天的列车.mp3',
    '意外.mp3','我好像在哪见过你.mp3','把回忆拼好给你.mp3','晚安.mp3','暧昧.mp3',
    '暧昧2.mp3','烟火里的尘埃.mp3','疑心病2025.mp3','碎碎念.mp3','第三人称.mp3',
    '等你下课.mp3','绅士.mp3','越来越不懂.mp3','轨迹.mp3','陪你去流浪.mp3'];
  var EXT=/\.[a-z0-9]+$/i;
  async function loadTracks(){
    var fs=[];
    try{
      var res=await fetch(pre+'music/',{cache:'no-store'});
      if(res.ok){
        var html=await res.text(),re=/href="([^"]+)"/g,m;
        while((m=re.exec(html))){
          var n=m[1];try{n=decodeURIComponent(n);}catch(e){}
          if(/\.(mp3|flac|wav|m4a|aac|ogg)$/i.test(n)&&!n.startsWith('?')&&!n.startsWith('/'))fs.push(n);
        }
      }
    }catch(e){}
    TRACKS=(fs.length?fs:FALLBACK).map(f=>({t:f.replace(EXT,'').trim()||f,f:f}));
    renderList();
  }

  /* ---------- 音频 + 音效（塔罗同款） ---------- */
  var audio=new Audio();audio.preload='none';
  var efx='none',actx=null,srcNode=null,master=null,
      panNode=null,bassNode=null,efxDelay=null,efxDelayGain=null,efxFbGain=null,
      spaceDelay=null,spaceGain=null,surroundRaf=0,surroundPhase=0;
  function ensureAudio(){
    if(actx)return actx;
    try{
      actx=new (window.AudioContext||window.webkitAudioContext)();
      srcNode=actx.createMediaElementSource(audio);
      master=actx.createGain();master.gain.value=1;
      srcNode.connect(master);master.connect(actx.destination);
    }catch(e){}
    return actx;
  }
  function applyEfx(){
    var a=ensureAudio();if(!a)return;
    if(a.state==='suspended'){try{a.resume();}catch(e){}}
    if(surroundRaf){cancelAnimationFrame(surroundRaf);surroundRaf=0;}
    if(panNode){try{panNode.disconnect();}catch(e){}panNode=null;}
    if(bassNode){try{bassNode.disconnect();}catch(e){}bassNode=null;}
    if(efxDelay){try{efxDelay.disconnect();}catch(e){}efxDelay=null;}
    if(efxDelayGain){try{efxDelayGain.disconnect();}catch(e){}efxDelayGain=null;}
    if(efxFbGain){try{efxFbGain.disconnect();}catch(e){}efxFbGain=null;}
    if(spaceDelay){try{spaceDelay.disconnect();}catch(e){}spaceDelay=null;}
    if(spaceGain){try{spaceGain.disconnect();}catch(e){}spaceGain=null;}
    srcNode.disconnect();srcNode.connect(master);
    if(efx==='surround'){
      panNode=a.createStereoPanner();panNode.pan.value=0;
      srcNode.disconnect();srcNode.connect(panNode);panNode.connect(master);
      surroundPhase=0;
      var step=()=>{if(!panNode)return;surroundPhase+=.035;
        try{panNode.pan.setTargetAtTime(Math.sin(surroundPhase)*.82,a.currentTime,.06);}catch(e){}
        surroundRaf=requestAnimationFrame(step);};
      surroundRaf=requestAnimationFrame(step);
    }else if(efx==='bass'){
      bassNode=a.createBiquadFilter();bassNode.type='lowshelf';bassNode.frequency.value=160;bassNode.gain.value=9;
      srcNode.disconnect();srcNode.connect(bassNode);bassNode.connect(master);
    }else if(efx==='echo'){
      efxDelay=a.createDelay(1.0);efxDelay.delayTime.value=.32;
      efxFbGain=a.createGain();efxFbGain.gain.value=.38;
      efxDelayGain=a.createGain();efxDelayGain.gain.value=.42;
      srcNode.connect(efxDelay);efxDelay.connect(efxFbGain);efxFbGain.connect(efxDelay);
      efxDelay.connect(efxDelayGain);efxDelayGain.connect(master);
    }else if(efx==='space'){
      spaceDelay=a.createDelay(1.0);spaceDelay.delayTime.value=.12;
      spaceGain=a.createGain();spaceGain.gain.value=.34;
      var spaceFb=a.createGain();spaceFb.gain.value=.30;
      spaceDelay.connect(spaceFb);spaceFb.connect(spaceDelay);
      srcNode.connect(spaceDelay);spaceDelay.connect(spaceGain);spaceGain.connect(master);
      bassNode=a.createBiquadFilter();bassNode.type='highpass';bassNode.frequency.value=85;
      srcNode.disconnect();srcNode.connect(bassNode);bassNode.connect(master);
    }
  }
  document.querySelectorAll('#muEfx .mu-chip').forEach(c=>{
    c.onclick=()=>{efx=c.dataset.efx;applyEfx();
      document.querySelectorAll('#muEfx .mu-chip').forEach(x=>x.classList.toggle('on',x.dataset.efx===efx));};
  });

  /* ---------- 播放控制 ---------- */
  var cur=-1,playing=false,mode='list';
  var fmt=s=>{s=Math.max(0,s|0);return (s/60|0)+':'+String(s%60).padStart(2,'0')};
  function validDur(){return isFinite(audio.duration)&&audio.duration>0;}
  function renderList(){
    listEl.innerHTML='';
    if(!TRACKS.length){listEl.innerHTML='<div style="opacity:.5;text-align:center;padding:14px;font-size:.85rem;color:#d8d0ef">暂无歌曲</div>';return;}
    TRACKS.forEach((tr,i)=>{
      var d=document.createElement('div');d.className='mu-item'+(i===cur?' playing':'');
      d.innerHTML='<span><span class="mi-idx">'+String(i+1).padStart(2,'0')+'</span>'+tr.t+'</span>';
      d.onclick=()=>play(i);
      listEl.appendChild(d);
    });
  }
  function sync(){
    iconPlay.style.display=playing?'none':'';
    iconPause.style.display=playing?'':'none';
    fab.classList.toggle('on',playing);
    renderList();
  }
  function play(i){
    if(!TRACKS.length)return;
    if(efx!=='none'){var a=ensureAudio();if(a&&a.state==='suspended')a.resume();applyEfx();}
    cur=(i+TRACKS.length)%TRACKS.length;
    audio.src=pre+'music/'+encodeURIComponent(TRACKS[cur].f);
    var p=audio.play();
    if(p!==undefined){
      p.then(()=>{playing=true;sync();}).catch((e)=>{
        /* 浏览器阻止自动播放时仍更新UI状态 */
        console.log('play blocked:',e.name);
        playing=true;sync();
      });
    }
    nowEl.textContent='♪ '+TRACKS[cur].t;
  }
  function toggle(){
    if(efx!=='none'){var a=ensureAudio();if(a&&a.state==='suspended')a.resume();}
    if(cur<0){play(Math.floor(Math.random()*TRACKS.length));return;}
    if(playing){audio.pause();playing=false;sync();return;}
    var p=audio.play();
    playing=true;
    if(p!==undefined)p.then(()=>sync()).catch((e)=>console.log('toggle play blocked:',e.name));
    sync();
  }
  function next(dir){
    if(cur<0){play(Math.floor(Math.random()*TRACKS.length));return;}
    if(mode==='one'&&dir===1){play(cur);return;}
    play(cur+dir);
  }
  audio.addEventListener('ended',()=>{if(mode==='one')play(cur);else next(1);});
  audio.addEventListener('play',()=>{playing=true;sync();});
  audio.addEventListener('pause',()=>{playing=false;sync();});
  audio.addEventListener('timeupdate',()=>{
    if(validDur())fill.style.width=(audio.currentTime/audio.duration*100)+'%';
    if(isFinite(audio.currentTime))curEl.textContent=fmt(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata',()=>{durEl.textContent=validDur()?fmt(audio.duration):'--:--';});
  var seeking=false,seekRatio=0;
  function seekAt(e){
    var r=bar.getBoundingClientRect();
    seekRatio=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    fill.style.width=(seekRatio*100)+'%';
    if(validDur())curEl.textContent=fmt(seekRatio*audio.duration);
  }
  function commitSeek(){
    if(!seeking||!validDur())return;
    var t=seekRatio*audio.duration;
    if(isFinite(t)){try{audio.currentTime=t;}catch(e){}}
  }
  bar.addEventListener('pointerdown',e=>{seeking=true;fill.style.transition='none';seekAt(e);bar.setPointerCapture&&bar.setPointerCapture(e.pointerId);});
  bar.addEventListener('pointermove',e=>{if(seeking)seekAt(e);});
  bar.addEventListener('pointerup',e=>{seekAt(e);commitSeek();seeking=false;fill.style.transition='';});
  bar.addEventListener('pointercancel',()=>{seeking=false;fill.style.transition='';});

  $id('muPlay').onclick=toggle;
  $id('muNext').onclick=()=>next(1);
  $id('muPrev').onclick=()=>next(-1);
  $id('muMode').onclick=()=>{
    mode=mode==='list'?'one':(mode==='one'?'rand':'list');
    $id('muMode').textContent='循环：'+(mode==='list'?'列表':(mode==='one'?'单曲':'随机'));
  };
  $id('muClose').onclick=()=>mask.classList.remove('open');
  mask.onclick=e=>{if(e.target===mask)mask.classList.remove('open');};
  fab.onclick=()=>{mask.classList.add('open');loadTracks();};
  loadTracks();
})();