/* ================= 基础配置 ================= */
const API_BASE='https://apihub.agnes-ai.cn/v1';
const API_KEY='sk-bnT8gvJweewxMFO2oOnzNof2qpqazpKYq1spx5EulZ11vfyZ';
const MODEL='agnes-2.5-flash';

/* ================= 78张真实牌数据 =================
   img 与 tarot/cards/*.jpg 一一对应（1909年韦特塔罗扫描件） */
const MAJ_ZH=['愚者','魔术师','女祭司','女皇','皇帝','教皇','恋人','战车','力量','隐士','命运之轮','正义','倒吊人','死神','节制','恶魔','高塔','星星','月亮','太阳','审判','世界'];
const MAJ_EN=['The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged Man','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World'];
const MAJ_U=['新的开始、冒险精神、纯真与自由、无限可能','意志与行动、资源整合、心想事成的显化之力','直觉与潜意识、内在智慧、静谧神秘的觉知','丰饶与滋养、母性关怀、感官与大地的赐予','权威与秩序、稳固结构、理性掌控的力量','传统与信仰、良师引领、遵循正统之道','爱与结合、重要的抉择、价值观的共鸣','胜利的意志、全速前行、自我驾驭与征服','温柔的力量、以柔克刚、驯服内心的狮','内省与独处、智慧寻道、隐居中的明灯','命运流转、转折与周期、时来运转之契机','公正与因果、理性权衡、真相大白','换个视角、主动悬置、牺牲之后的大彻悟','结束与重生、深刻蜕变、告别昨日之我','平衡与调和、适度中庸、耐心的炼金术','束缚与执念、成瘾诱惑、直面阴影的时刻','骤然的巨变、旧结构崩塌、幻象破灭后重建','希望与疗愈、灵感的星光、信念长存','潜意识的迷雾、幻想不安、聆听梦境的真言','成功的暖阳、生命活力、喜悦与坦荡','觉醒的号角、宽恕与新生、回应天命召唤','圆满达成、旅途完整、荣耀收尾又启程'];
const MAJ_R=['鲁莽冒进、缺乏计划、散漫失序','欺骗操控、天赋误用、纸上的空谈','切断直觉、秘密郁积、言行相悖','停滞依赖、创造力枯竭、匮乏感蔓延','僵化专断、控制欲过度、铁腕失人心','教条盲从、反叛陈规、失去信仰支撑','关系的失衡、诱惑纠葛、难以取舍','失控脱轨、迷失方向、强撑的疲惫','自我怀疑、恃弱逞强、被欲望吞噬','刻意孤立、逃避现实、拒人千里','时运不济、抗拒变化、原地打转的厄环','偏私失衡、推诿责任、真相遭扭曲','无谓的牺牲、盲目拖延、悬而未决','抗拒转变、迟迟放手、苟延残喘的僵局','失衡极端、急躁偏颇、调和失效','挣脱枷锁、看清捆绑、夺回主动权','劫数迟来、摇摇欲坠的假象维持、避祸心理','星光黯淡、信心低落、理想蒙尘','迷雾渐散、谎言拆穿、走出恐惧','短暂阴翳、乐观透支、活力受阻','苛责自己、拒听呼声、逃避清算','差一步的圆满、烂尾之憾、收束拖沓'];
const CN_NUM=['','一','二','三','四','五','六','七','八','九','十'];
const RANK_ZH=['A','二','三','四','五','六','七','八','九','十','侍从','骑士','王后','国王'];
const RANK_EN=['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
const MIN_U={
c:['新情感的萌发、爱的馈赠、心灵之泉充盈','两心相印、深情互许、真挚的连结','友谊欢聚、喜讯分享、被爱包围的幸福','冷感倦怠、心不在焉、对眼前机会视若无睹','悲伤与遗憾、专注所失而忘了所有','怀旧温情、纯真的甜蜜、故人重逢','幻想纷繁、众里寻他、雾里看花的迷局','离开不再滋养的、转身踏上寻索之旅','心愿得偿、深深满足、幸福盈怀','圆满的情感殿堂、家人挚友齐聚的至福','温柔的初心、浪漫的消息、情感的试探萌芽','深情的邀约、诗意奔赴、循着心之所向','以心共情的怀抱、包容慈爱、直觉丰沛','情感的定海神针、宽厚平和、成熟的度量'],
s:['思维的锋刃出鞘、真相初现、清明一念','回避的抉择、蒙眼的静守、内心交战的十字路口','心碎之痛、锐利的悲鸣、粘连不去的伤口','休养生息、暂歇的战场、蓄力待发','硝烟背后的代价、胜之不武、意气之争','渡向风平浪静的水岸、渐远的伤害、喘息旅途','暗中的计谋、隐秘行动、未被言说的动机','自缚之茧、八刃围身、心设的牢狱','夜半惊坐、辗转难眠、被放大的忧虑','跌落谷底的黑夜尽处、物极必反的一页','求知的好奇、敏锐的观察、崭新的学习课题','雷厉风行的锋芒、直抒己见、速战速决','清醒理智的头脑、界限分明、直言不讳','以智驭局的权威、深谋远虑、孤高的判断'],
w:['创造之火的点燃、热忱迸发、全新契机','执炬远眺、胸中丘壑、盘点后的雄心','帆已升起、蓝图的延展、同盟共举','家园的庆典、坚实的欢腾、凝聚的高台','五柄交错的竞技场、良性竞争亦或纠纷摩擦','白马凯旋、掌声与捷报、耕耘后的荣光','高地的坚守、寸土不让、疲惫却顽强的防备','箭矢齐飞、迅猛推进、八方来讯','带痕的城墙后仍有火种、越挫越勇的坚毅','负重的行囊、攀坡的坚忍、责任如山','跃动的火焰种子、热血方刚、跃跃欲试','策马疾驰的勇气、事业的进击、一往无前','热烈且笃定的光芒、由内而外的自信魅力','观照全局的统帅、愿景远大、魅力型领袖'],
p:['富足之种落入沃土、可触摸的新机遇','轻盈的抛接、两手抓的弹性智慧','石阶上的匠人、精工细作、协作成器','城垣之内紧拥金币、守成安稳及其代价','风雪门外、匮乏时刻、被忽视的援手','给予与接受的天平、慷慨有度','倚锄沉思的园丁、长线耕耘、静候花开','锤凿之间日臻完美、专注打磨、勤勉精进','藤蔓深处的庄园、独立自足、配得的优雅','拱门下的丰饶、家业兴旺、物质大成','持币端详的踏实学徒、实干起步','缓辔前进的驮者、稳扎稳打、可靠而缓慢','藤蔓华盖下的丰饶、自然滋养、持家有道','石座之上的实业之王、雄厚积累、秩序繁荣']};
const MIN_R={
c:['情感的壅塞、喷泉淤堵、心门未启','关系的失衡、经年的误解、貌合神离','流言的漩涡、圈子的是非、纵乐过界','迟来的苏醒、重新张望、把握眼前的机会','抬眼望回岸上、接纳释怀、看见仍在的丰盈','走不出旧照片、理想化的昨日、俱往矣的执念','云开雾散的一刻、面向现实、有所取舍','回头的身影、旧事的拉扯、启程前的徘徊','华丽的宴席之下、表面的饱足、内心的空洞','风雨飘摇的屋顶、家的罅隙、期待与现实的落差','易碎的小情绪、青涩摇摆、敏感的表达','云端式浪漫、情绪起伏的追逐、兑现艰难','情绪的海啸、过度付出、淹没自我','内冷外凉的面具、以理压情、情感的疏离'],
s:['混沌的思绪、讥诮的舌尖、一团乱麻的计划','卸下眼罩、直面峭壁、终于摊牌的一刻','创口的收束、宽恕的开端、走出阴雨','起身离开、休整过头、真正的战场在前','放下胜负手、和解止损、拨乱反正的开始','搁浅的渡船、旧伤复发、滞碍的行程','败露的暗流、坦白以对、归还所窃','囚牢的门并未上锁、认出自设的限制、松绑放生','晨光刺入噩梦、倾诉与求助、郁云消散','冻土下积蓄的芽、至暗之后的回暖','好奇的四散、言语的松脱、三分钟热度','莽撞横冲直撞、伤人的快语、油门的滥用','锋利刀口的反噬、芥蒂于心、防御的壁垒','独断的凉意、冷酷的算计、听不见的进言'],
w:['噼啪熄灭的火种、迟迟未燃、易逝的热情','计算的停摆、远方的怯步、停滞的棋手','折戟的航线、被浪打散的同盟、等待的风','庆典散场的空椅、地基松动、过渡期的摇晃','鸣金收兵的一刻、握手言和、内部整饬','无人喝彩的白马、台侧的失意、难产的胜果','放弃高地的一瞬、寡不敌众的撤离','滞空的箭雨、迟来的信鸽、泼出的冷水','绷到极限的弓弦、疑心的沼泽、残垣后的一场空','卸重的叹息、分担委派、或被重担压垮','泯灭的火花、半途而废、噤声的热情','马蹄打滑、折返的征途、鼓点的虚张','灼人的锋芒、嫉妒的内耗、黯淡的自我怀疑','傲慢的王座、以势压人、燃烧殆尽的野心'],
p:['漏斗指缝的金砂、错失的机遇、虚假的安全','失衡的抛接、顾此失彼、疲于奔命的手艺','涣散的合作、粗糙的雕凿、名不副实的图纸','紧握出汗的钱币、守财的枷锁、患得患失','雪融后的裂缝、援助将至的微光、自我的振作','倾斜的天平、附加条件的给予、人情负债','荒废的田垄、急功近利的拔苗、错误的投入','粗滥的赶工、眼高手低、重复的徒劳','藤蔓之外自我的迷途、依附挥霍、配得感动摇','朽坏的拱梁、家业的裂隙、纷争的寒意','搁浅的算盘、眼高手低的学徒、账目的凌乱','进一步退两步、机械的日子、被封印的耐心','耗竭的照料、被遗忘的自我需要','坐在金山上仍旧不安、唯利之心、僵硬的规则']};
const SUITS={c:['圣杯','Cups'],s:['宝剑','Swords'],w:['权杖','Wands'],p:['星币','Pentacles']};
const CARDS=[];
for(let i=0;i<22;i++){CARDS.push({img:'m'+String(i).padStart(2,'0'),zh:MAJ_ZH[i],en:MAJ_EN[i],maj:true,u:MAJ_U[i],r:MAJ_R[i]});}
['c','s','w','p'].forEach(pre=>{for(let n=1;n<=14;n++){
  CARDS.push({img:pre+String(n).padStart(2,'0'),zh:SUITS[pre][0]+RANK_ZH[n-1],en:RANK_EN[n-1]+' of '+SUITS[pre][1],maj:false,u:MIN_U[pre][n-1],r:MIN_R[pre][n-1]});}});

/* ================= 牌阵 ================= */
const SPREADS=[
 {id:'one',name:'单牌指引',slots:['当下的启示'],desc:'一针见血的答案'},
 {id:'three',name:'三张时序',slots:['过去','现在','未来'],desc:'事情的前因后果'},
 {id:'five',name:'五张十字',slots:['现状','阻碍','根源','外部助力','发展趋势'],desc:'全面剖析复杂局面'},
 {id:'auto',name:'✨ AI 智能选阵',slots:null,desc:'由塔罗师判断你的问题'}];

let curSpread=SPREADS[0],drawn=[],flipCount=0,readingBusy=false;
const $=id=>document.getElementById(id);

/* ================= 深邃粒子星空 + 粒子月亮（可被打散） ================= */
(function(){
  const cv=$('stars'),ctx=cv.getContext('2d');
  const DPR=Math.min(devicePixelRatio||1,2);
  let W=0,H=0,stars=[],dust=[],moon=null;
  /* 指针位置（惯性缓动） */
  let px=-9999,py=-9999,mx=px,my=py,active=false;

  function rs(){
    W=innerWidth;H=innerHeight;
    cv.width=W*DPR;cv.height=H*DPR;
    cv.style.width=W+'px';cv.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    const n=Math.min(240,Math.floor(W*H/9000));
    stars=Array.from({length:n},()=>({
      x:Math.random()*W,y:Math.random()*H,
      z:Math.random()*.8+.2,            /* 视差深度 */
      r:(Math.random()*1.15+.3)*z01(),
      tw:Math.random()*Math.PI*2,
      ts:Math.random()*.9+.35,
      hue:Math.random()<.14?(Math.random()<.5?'#ffd9a8':'#bcd7ff'):'#fff7e0'
    }));
    moon=makeMoon();
  }
  function z01(){return .5+Math.random()*.5}

  /* 月亮：由粒子拼成（圆形内随机点+边缘更亮），被搅动后散开再聚合 */
  function makeMoon(){
    const R=Math.min(52,W*.055)+14;
    const mx0=W-Math.max(70,W*.10)-R,my0=Math.max(64,H*.075)+R;
    const cnt=Math.min(150,Math.floor(W*H/16000))+70;
    const pts=[];
    for(let i=0;i<cnt;i++){
      const a=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random())*R;
      const x=mx0+Math.cos(a)*rr,y=my0+Math.sin(a)*rr*.98;
      const edge=1-rr/R;
      pts.push({hx:x,hy:y,x,y,vx:0,vy:0,
        r:edge>0.55?(Math.random()*1.7+1.1):(Math.random()*1.25+.55),
        glow:edge,ph:Math.random()*Math.PI*2});
    }
    return {cx:mx0,cy:my0,R,pts,haze:0};
  }

  addEventListener('resize',rs);

  function setP(x,y){mx=x;my=y;if(px<-999){px=x;py=y;}active=true;}
  addEventListener('pointermove',e=>setP(e.clientX,e.clientY),{passive:true});
  addEventListener('pointerdown',e=>setP(e.clientX,e.clientY),{passive:true});
  document.addEventListener('pointerleave',()=>{active=false;});
  document.addEventListener('pointerenter',e=>{px=e.clientX;py=e.clientY;mx=px;my=py;active=true;});

  function step(){
    /* 指针惯性 */
    px+=(mx-px)*.18;py+=(my-py)*.18;
    const t=performance.now()/1000;
    ctx.clearRect(0,0,W,H);

    /* --- 星空（视差微移 + 闪烁） --- */
    const ox=(px>-999?(px/W-.5):0),oy=(py>-999?(py/H-.5):0);
    for(const s of stars){
      s.tw+=.016*s.ts;
      const a=.26+Math.sin(s.tw)*.30;
      ctx.globalAlpha=Math.max(0,a);
      ctx.fillStyle=s.hue;
      const dx=-ox*14*s.z,dy=-oy*10*s.z;
      ctx.beginPath();ctx.arc(s.x+dx,s.y+dy,s.r,0,6.284);ctx.fill();
    }

    /* --- 月亮粒子 --- */
    if(moon){
      let energy=0;
      for(const p of moon.pts){
        /* 月面缓慢呼吸 */
        const bx=Math.cos(t*.4+p.ph)*.9,by=Math.sin(t*.33+p.ph*1.7)*.9;
        /* 斥力：指针靠近则打散 */
        const ddx=p.x-px,ddy=p.y-py,d2=ddx*ddx+ddy*ddy;
        const R2=110*110;
        if(active&&d2<R2&&d2>.01){
          const d=Math.sqrt(d2),f=(1-d/110);
          p.vx+=(ddx/d)*f*2.6+(Math.random()-.5)*f*1.6;
          p.vy+=(ddy/d)*f*2.6+(Math.random()-.5)*f*1.6;
          energy=Math.max(energy,f);
        }
        /* 回归弹簧 */
        p.vx+=(p.hx+bx-p.x)*.022;
        p.vy+=(p.hy+by-p.y)*.022;
        p.vx*=.90;p.vy*=.90;
        p.x+=p.vx;p.y+=p.vy;
      }
      moon.haze+=((energy>.02?Math.min(.5,energy*.9):0)-moon.haze)*.08;
      /* 月晕 */
      const hg=ctx.createRadialGradient(moon.cx,moon.cy,moon.R*.2,moon.cx,moon.cy,moon.R*(2.5+moon.haze*1.6));
      hg.addColorStop(0,'rgba(255,236,180,'+(.14+moon.haze*.25)+')');
      hg.addColorStop(.5,'rgba(230,200,140,'+(.05+moon.haze*.10)+')');
      hg.addColorStop(1,'rgba(230,200,140,0)');
      ctx.globalAlpha=1;ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(moon.cx,moon.cy,moon.R*(2.5+moon.haze*1.6),0,6.284);ctx.fill();
      /* 粒子本体 */
      for(const p of moon.pts){
        const spd=Math.abs(p.vx)+Math.abs(p.vy);
        ctx.globalAlpha=Math.min(1,.55+p.glow*.5+spd*.06);
        ctx.fillStyle=p.glow>.55?'#fff6da':'#f3dfa2';
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.284);ctx.fill();
        if(spd>1.4){ /* 打散时的微光尾 */
          ctx.globalAlpha*= .5;
          ctx.strokeStyle='rgba(255,240,190,.5)';ctx.lineWidth=.6;
          ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*2.2,p.y-p.vy*2.2);ctx.stroke();
        }
      }
      /* 指针在月面时：扬起一点星尘 */
      if(energy>.25&&Math.random()<energy*.5){
        dust.push({x:moon.cx+(Math.random()-.5)*moon.R*2,y:moon.cy+(Math.random()-.5)*moon.R*2,
          vx:(Math.random()-.5)*1.6,vy:-Math.random()*1.3-.2,l:1,r:Math.random()*1.3+.4});
      }
    }

    /* --- 自由星尘 --- */
    for(let i=dust.length-1;i>=0;i--){
      const d=dust[i];
      d.x+=d.vx;d.y+=d.vy;d.vy-=.004;d.l-=.014;
      if(d.l<=0){dust.splice(i,1);continue;}
      ctx.globalAlpha=d.l*.8;ctx.fillStyle='#ffeec2';
      ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,6.284);ctx.fill();
    }

    ctx.globalAlpha=1;
    requestAnimationFrame(step);
  }
  rs();requestAnimationFrame(step);
})();

/* ================= 指针跟随大光晕（鼠标+触屏通用） ================= */
(function(){
  const halo=$('halo');
  let hx=innerWidth/2,hy=innerHeight/2,tx=hx,ty=hy,seen=false;
  function move(x,y){
    tx=x;ty=y;
    if(!seen){seen=true;hx=x;hy=y;halo.classList.add('on');}
  }
  addEventListener('pointermove',e=>move(e.clientX,e.clientY),{passive:true});
  addEventListener('pointerdown',e=>move(e.clientX,e.clientY),{passive:true});
  document.addEventListener('pointerleave',()=>halo.classList.remove('on'));
  document.addEventListener('pointerenter',()=>{if(seen)halo.classList.add('on');});
  (function loop(){
    hx+=(tx-hx)*.09;hy+=(ty-hy)*.09;
    halo.style.transform='translate(-50%,-50%) translate('+hx+'px,'+hy+'px)';
    requestAnimationFrame(loop);
  })();
})();

/* ================= 横竖屏适配 ================= */
function orient(){
  document.body.classList.toggle('is-landscape',innerWidth>innerHeight&&matchMedia('(max-height:540px)').matches);
}
orient();addEventListener('resize',orient);addEventListener('orientationchange',()=>setTimeout(orient,80));

/* ================= 界面初始化 ================= */
SPREADS.forEach(sp=>{
  const d=document.createElement('div');d.className='spread-chip'+(sp.id==='auto'?' sp-auto':'');
  d.innerHTML=sp.name+'<small>'+sp.desc+'</small>';
  d.onclick=()=>{document.querySelectorAll('.spread-chip').forEach(x=>x.classList.remove('active'));
    d.classList.add('active');curSpread=sp;
    if(sp.id!=='auto')$('autoNote').classList.remove('show');
    else tryAutoPick(true);};
  $('spreadSel').appendChild(d);
});
$('spreadSel').firstChild.classList.add('active');
$('question').addEventListener('input',()=>{$('qCount').textContent=$('question').value.length;
  if(curSpread.id==='auto')tryAutoPick(true);});

/* ================= AI 智能选阵（agnes-2.5-flash 判断问题） ================= */
const PICK_SYS='你是资深塔罗占卜师助手。用户会给出一个占卜问题，请从以下牌阵中选择最合适的一个：'+
  SPREADS.filter(s=>s.id!=='auto').map(s=>s.id+'（'+s.name+'，位置：'+s.slots.join('/')+'，适用：'+s.desc+'）').join('；')+
  '。判断标准：问题简短、只需一个明确答案或当日指引→选 one；涉及事情发展经过、时间线、因果关系→选 three；局面复杂、多方因素、关系纠缠、需要全面剖析→选 five。'+
  '只输出一行JSON：{"spread":"one或three或five","reason":"不超过20字的中文理由"}，不要输出任何其他内容。';
let pickSeq=0;
async function aiPickSpread(q){
  const my=++pickSeq;
  const res=await fetch(API_BASE+'/chat/completions',{method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+API_KEY},
    body:JSON.stringify({model:MODEL,messages:[{role:'system',content:PICK_SYS},{role:'user',content:q||'（用户没有写问题，想要一个当日的整体指引）'}],temperature:.3,max_tokens:512})});
  const j=await res.json();
  if(my!==pickSeq)return null;/* 已有更新的请求 */
  let txt='';
  try{txt=(j.choices[0].message.content||'').trim();}catch(e){}
  const m=txt.match(/\{[\s\S]*\}/);
  if(!m)throw new Error('bad ai answer: '+txt.slice(0,80));
  const o=JSON.parse(m[0]);
  const sp=SPREADS.find(s=>s.id===o.spread);
  if(!sp)throw new Error('unknown spread');
  return {spread:sp,reason:String(o.reason||'').slice(0,40)};
}
let pickTimer=null;
function tryAutoPick(delay){
  clearTimeout(pickTimer);
  const note=$('autoNote');
  if(curSpread.id!=='auto'){note.classList.remove('show');return;}
  const q=$('question').value.trim();
  if(!delay){/* 立即（点击芯片时） */}
  pickTimer=setTimeout(async()=>{
    note.classList.add('show');
    note.innerHTML='<span style="color:#a79ade">✦ 塔罗师正凝视你的问题，推演最合适的牌阵……</span>';
    try{
      const r=await aiPickSpread(q);
      note.innerHTML='✦ 塔罗师为你选择了「'+r.spread.name+'」 — '+escapeHtml(r.reason);
      applySpread(r.spread);
    }catch(e){
      note.innerHTML='<span style="color:#a79ade">✦ 月光暂未回应，已为你默认「三张时序」（也可手动点选）</span>';
      applySpread(SPREADS[1]);
    }
  },delay?800:0);/* 输入防抖 */
}
function applySpread(sp){
  curSpread=sp;
  document.querySelectorAll('.spread-chip').forEach(x=>{
    x.classList.toggle('active',x.textContent.indexOf(sp.name)>=0||(sp.id==='auto'?x.classList.contains('sp-auto'):x.textContent.indexOf(sp.name)===0&&x.classList.contains('active')));
  });
  /* 重新精确高亮：自动模式下不点亮具体牌阵芯片，保持AI芯片高亮 */
  document.querySelectorAll('.spread-chip').forEach(x=>{
    const isAutoChip=x.classList.contains('sp-auto');
    x.classList.toggle('active',curSpread.id==='auto'?isAutoChip:(!isAutoChip&&x.textContent.indexOf(curSpread.name)===0));
  });
}

/* ================= 牌堆 ================= */
function buildDeck(){
  const dk=$('deck');dk.innerHTML='';
  for(let i=0;i<9;i++){
    const c=document.createElement('div');c.className='dcard';
    c.innerHTML='<div class="pat"></div><div class="em">'+(i===8?'☾':'✦')+'</div>';
    c.style.transform='translateY('+(i*-0.55)+'px)';
    c.dataset.i=i;
    dk.appendChild(c);
  }
}
buildDeck();

/* ================= 洗牌（WAAPI 编排，GPU流畅） ================= */
function animateShuffle(done){
  const dcards=[...document.querySelectorAll('#deck .dcard')];
  const rect=$('deck').getBoundingClientRect();
  const spreadX=Math.min(190,rect.width*2.1);
  const ampY=Math.min(42,rect.height*.24);
  const liftZ=Math.min(120,rect.width*1.1);
  const dur=920;
  let fin=0;const total=dcards.length;
  dcards.forEach((c,i)=>{
    const dir=(i%2?1:-1)*(0.75+Math.abs(Math.sin(i*2.7))*0.45);
    const ph=Math.random()*.12;
    c.animate([
      {transform:c.style.transform||'translateY(0)',offset:0},
      {transform:'translate3d('+(spreadX*-0.52*dir)+'px,'+(ampY*-0.95)+'px,'+(liftZ*dir)+'px) rotateZ('+(17*dir)+'deg) rotateY('+(26*dir)+'deg)',offset:.30+ph},
      {transform:'translate3d('+(spreadX*0.48*dir)+'px,'+(ampY*0.62)+'px,'+(liftZ*dir*.6)+'px) rotateZ('+(-13*dir)+'deg) rotateY('+(-22*dir)+'deg)',offset:.64+ph},
      {transform:'translateY(0)',offset:1}
    ],{duration:dur+Math.floor(Math.random()*160)-80,delay:i%3*70,easing:'cubic-bezier(.42,.05,.18,.99)',fill:'forwards'})
     .onfinish=()=>{if(++fin===total)done();};
  });
}

/* ================= 流程 ================= */
$('btnStart').onclick=async()=>{
  if(readingBusy||$('btnStart').disabled)return;
  $('btnStart').disabled=true;
  /* AI 自动选阵：点开始时实时判断 */
  if(curSpread.id==='auto'){
    const note=$('autoNote');note.classList.add('show');
    note.innerHTML='<span style="color:#a79ade">✦ 塔罗师正依你的问题推演牌阵……</span>';
    try{
      const r=await aiPickSpread($('question').value.trim());
      note.innerHTML='✦ 塔罗师为你选择了「'+r.spread.name+'」 — '+escapeHtml(r.reason);
      curSpread=r.spread;
    }catch(e){
      note.innerHTML='<span style="color:#a79ade">✦ 月光暂未回应，以「三张时序」开局</span>';
      curSpread=SPREADS[1];
    }
  }
  $('btnStart').disabled=false;
  const idx=fisherYates([...CARDS.keys()]).slice(0,curSpread.slots.length);
  drawn=idx.map(i=>({card:CARDS[i],rev:Math.random()<.2}));
  $('setupPanel').style.display='none';
  $('readingBox').style.display='none';
  $('stage').style.display='block';
  $('tapHint').style.visibility='hidden';
  $('drawActions').classList.remove('on');
  $('btnRead').disabled=true;$('btnFlipAll').style.display='none';
  flipCount=0;window.scrollTo({top:0,behavior:'smooth'});
  animateShuffle(()=>setTimeout(layoutSlots,150));
};
function fisherYates(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function layoutSlots(){
  const box=$('slotsMain');box.innerHTML='';
  $('deck').style.opacity='.28';
  drawn.forEach((d,i)=>{
    const slot=document.createElement('div');slot.className='slot'+(d.rev?' reversed':'');
    slot.innerHTML='<span class="pos-tag">'+curSpread.slots[i]+'</span>'+
      '<div class="fly-wrap"><div class="card"><div class="face back"><div class="pat"></div><div class="em">✦</div></div>'+
      '<div class="face front"><img src="tarot/cards/'+d.card.img+'.jpg" alt="'+d.card.zh+'" draggable="false">'+
      (d.rev?'<span class="rev-badge">逆位</span>':'')+'</div></div></div>'+
      '<div class="card-name">'+d.card.zh+'</div><div class="card-en">'+d.card.en+'</div>';
    box.appendChild(slot);
  });
  box.style.display='';
  /* 发牌：整体同步「扇形绽放」——所有牌同时从牌堆绽放飞入位置（非逐张错位） */
  const deckEl=$('deck');
  const deckRect=deckEl.getBoundingClientRect();
  const fws=[...box.querySelectorAll('.fly-wrap')];
  const n=fws.length;
  const cx=deckRect.left+deckRect.width/2, cy=deckRect.top+deckRect.height*.2;
  /* 绽放光环：从牌堆中心扩散一圈 */
  try{
    const ring=document.createElement('div');
    ring.style.cssText='position:fixed;left:'+cx+'px;top:'+cy+'px;width:16px;height:16px;border-radius:50%;pointer-events:none;z-index:30;margin:-8px 0 0 -8px;border:2px solid rgba(240,207,130,.85);box-shadow:0 0 26px rgba(240,207,130,.55)';
    document.body.appendChild(ring);
    ring.animate([{transform:'scale(1)',opacity:.95},{transform:'scale(15)',opacity:0}],
      {duration:840,easing:'cubic-bezier(.2,.6,.3,1)'}).onfinish=()=>ring.remove();
  }catch(e){}
  /* 牌堆蓄力：先下压再回弹，随后瞬间绽放 */
  try{deckEl.animate([
    {transform:'translateX(-50%) translateY(0)'},
    {transform:'translateX(-50%) translateY(7px) scale(.96)',offset:.45},
    {transform:'translateX(-50%) translateY(0)'}
  ],{duration:400,easing:'cubic-bezier(.3,1.3,.5,1)'});}catch(e){}
  fws.forEach((fw,i)=>{
    const r=fw.getBoundingClientRect();
    const dx=cx-(r.left+r.width/2), dy=cy-r.top;
    /* 扇形起始角：中间牌角度小、两侧张开，像合拢的扇子 */
    const fan=(i-(n-1)/2)*9;
    const delay=170+i*46, dur=680;
    fw.style.transform='translate('+dx+'px,'+dy+'px) rotate('+fan+'deg) scale(.78)';
    fw.style.zIndex=20+i;
    fw.getBoundingClientRect();/*强制回流*/
    setTimeout(()=>{
      const a=fw.animate([
        {transform:'translate('+dx+'px,'+dy+'px) rotate('+fan+'deg) scale(.78)',easing:'cubic-bezier(.5,.02,.3,1)'},
        {transform:'translate('+dx*.34+'px,'+(dy*.34-46)+'px) rotate('+(fan*.3)+'deg) scale(.965)',offset:.55,easing:'cubic-bezier(.16,.68,.24,1.05)'},
        {transform:'translate(0,0) rotate(0deg) scale(1)'}
      ],{duration:dur,fill:'both'});
      a.onfinish=()=>{
        fw.style.transform='';fw.style.zIndex='';
        try{fw.animate([{filter:'brightness(1.55)'},{filter:'brightness(1)'}],{duration:520,easing:'ease-out'});}catch(e){}
        flipUpdateUI();
      };
    },delay);
  });
  box.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click',()=>{
      if(card.classList.contains('flipped'))return;
      card.classList.add('flipped');
      flipCount++;flipUpdateUI();
    });
  });
  $('btnFlipAll').style.display='';
  $('btnFlipAll').onclick=()=>box.querySelectorAll('.card:not(.flipped)').forEach((c,i)=>setTimeout(()=>c.click(),i*300));
  $('tapHint').style.visibility='';
}
let uiTick=false;
function flipUpdateUI(){
  if(uiTick)return;uiTick=true;
  requestAnimationFrame(()=>{
    uiTick=false;
    const all=document.querySelectorAll('#slotsMain .card');
    const n=document.querySelectorAll('#slotsMain .card.flipped').length;
    if(all.length&&n===all.length){
      $('tapHint').style.visibility='hidden';
      $('btnFlipAll').style.display='none';
      $('drawActions').classList.add('on');
      $('btnRead').disabled=false;
      setTimeout(()=>$('btnRead').scrollIntoView({behavior:'smooth',block:'center'}),380);
    }
  });
}
$('btnReset').onclick=backToSetup;
$('btnAgain').onclick=backToSetup;
function backToSetup(){
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{
    $('stage').style.display='none';
    $('slotsMain').style.display='none';$('slotsMain').innerHTML='';
    $('deck').style.opacity='';
    $('setupPanel').style.display='block';buildDeck();
  },380);
}

/* ================= 提示词 ================= */
function buildPrompt(){
  const now=new Date(),wd=['日','一','二','三','四','五','六'][now.getDay()];
  const q=$('question').value.trim();
  const L=[];
  L.push('【占卜信息】'+now.getFullYear()+'年'+(now.getMonth()+1)+'月'+now.getDate()+'日 星期'+wd+'，以下为求问者现场抽取的真实牌组。');
  L.push('【牌阵】'+curSpread.name+'：'+curSpread.slots.join(' | '));
  L.push('【问题】'+(q?q:'（未提供具体问题。请围绕求问者近期整体状态与当下最重要的能量线索展开解读，并在结尾温和提示：聚焦更具体的问题会让指引更精准。）'));
  L.push('【抽牌结果】');
  drawn.forEach((d,i)=>L.push((i+1)+'. '+curSpread.slots[i]+'：《'+d.card.en+'》「'+d.card.zh+'」'+(d.maj?'（大阿卡纳）':'（小阿卡纳）')+'，'+(d.rev?'逆位':'正位')+'。韦特体系通行词义——'+(d.rev?('逆位通常指向：'+d.card.r):('正位通常指向：'+d.card.u))+'。'));
  return L.join('\n');
}
const SYS_PROMPT='你是一位经验丰富、口碑极好的华人专业塔罗师，人称"月下塔罗师"。你现在收到的是一套真实的韦特塔罗抽牌结果（含日期星期、牌阵、各位置的牌、正逆位与通行词义）。请严格基于这套给出的牌进行解读，绝不虚构或替换任何一张牌。\
解读要求：\
1. 先逐张解读：按位置顺序，每一张用一个简短段落，说明该牌的核心意象如何作用于该位置（紧扣给出的正/逆位词义并自然引申，不要机械罗列关键词），小标题格式如「### 过去｜愚者·正位」；\
2. 再做整体解读：分析牌与牌之间的呼应、张力或矛盾，串联成一条清晰的叙事线回答提问者的疑问，点出症结；\
3. 给出具体可行的建议或注意事项（可分条），语气诚恳务实，不说教也不危言耸听；若涉及健康、法律、财务等严肃事项，提示寻求专业人士帮助；\
4. 结尾用「### 核心指引」小节收尾，两三句温暖有力的话。\
排版要求：使用 Markdown 小标题与分段，关键结论可用**加粗**。全程中文，总长600~900字，像一位真正懂你的人认真为你解牌。';

/* ================= AI 调用 ================= */
const STATUS_WORDS=['🌙 净手焚香，铺开牌阵……','🔮 牌面星辉流转，正在感应……','🕯️ 月光的低语流入笔尖……'];
let statusTimer=null;

async function askTarot(){
  readingBusy=true;$('btnRead').disabled=true;
  $('readingBox').style.display='block';
  $('readingText').innerHTML='';
  try{$('readingBox').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
  const st=$('aiStatus');st.textContent=STATUS_WORDS[0];
  clearInterval(statusTimer);let wi=0;
  statusTimer=setInterval(()=>st.textContent=STATUS_WORDS[++wi%STATUS_WORDS.length],3200);

  let full='',shown='';
  const renderEnd='<span class="caret"></span>';
  let doneFlag=false;

  try{
    const res=await fetch(API_BASE+'/chat/completions',{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+API_KEY},
      body:JSON.stringify({model:MODEL,messages:[{role:'system',content:SYS_PROMPT},{role:'user',content:buildPrompt()}],temperature:.85,max_tokens:2048,stream:true})});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const rd=res.body.getReader(),dec=new TextDecoder();let buf='';
    while(true){
      const r=await rd.read();if(r.done)break;
      buf+=dec.decode(r.value,{stream:true});
      const parts=buf.split('\n');buf=parts.pop()||'';
      for(const line of parts){
        const l=line.trim();
        if(!l.startsWith('data:'))continue;
        const p=l.slice(5).trim();
        if(p==='[DONE]'){buf='';break;}
        try{const j=JSON.parse(p);const d=(j.choices&&j.choices[0]&&j.choices[0].delta)||{};
          if(typeof d.content==='string'&&d.content){full+=d.content;
            shown=full;$('readingText').innerHTML=miniMD(shown)+renderEnd;}
        }catch(e){}
      }
    }
    full=full.trim();
    if(!full)throw new Error('空响应');
  }catch(err){
    console.warn('流式失败，降级：',err);
    try{
      st.textContent='🌀 更换一种方式凝神细语……';
      const res2=await fetch(API_BASE+'/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+API_KEY},
        body:JSON.stringify({model:MODEL,messages:[{role:'system',content:SYS_PROMPT},{role:'user',content:buildPrompt()}],temperature:.85,max_tokens:2048})});
      const j2=await res2.json();
      if(!res2.ok||!j2.choices)throw new Error((j2.error&&j2.error.message)||('HTTP '+res2.status));
      full=(j2.choices[0].message.content||'').trim();
      if(!full)throw new Error('空响应');
    }catch(e2){
      clearInterval(statusTimer);st.textContent='';
      $('readingText').innerHTML='<strong style="color:#ff9d9d">✕ 连接月亮的信号中断了…</strong>'+
        '<p style="color:#cbc0ea;margin-top:8px">原因：'+escapeHtml(String(e2&&e2.message||'未知错误').slice(0,160))+'</p>'+
        '<p style="color:#8a81b8;margin-top:8px">请检查网络后点击下方「换一问再来」重新占卜。</p>';
      readingBusy=false;$('btnRead').disabled=false;return;
    }
  }
  clearInterval(statusTimer);st.textContent='';
  /* 打字机呈现完整文本 */
  await new Promise(fin=>{
    const step=Math.max(2,Math.round(full.length/220));
    const iv=setInterval(()=>{
      shown=full.slice(0,Math.min(shown.length+step,full.length));
      $('readingText').innerHTML=miniMD(shown)+renderEnd;
      autoScrollReading();
      if(shown.length>=full.length){clearInterval(iv);fin();}
    },26);
  });
  $('readingText').innerHTML=miniMD(full);
  addToHistory({time:new Date().toLocaleString('zh-CN',{hour12:false}),q:$('question').value.trim(),
    spread:curSpread.name,cards:drawn.map(d=>(d.rev?'逆位「':'正位「')+d.card.zh+'」').join(' '),text:full});
  readingBusy=false;$('btnRead').disabled=false;
}
let stickyBottom=true;
setInterval(()=>{
  const rb=$('readingBox');if(rb.style.display==='none')return;
  const near=rb.scrollHeight-rb.scrollTop-rb.clientHeight<140;
  if(near!==stickyBottom&&!near)stickyBottom=near;
},600);
function autoScrollReading(){
  if(!stickyBottom)return;
  const rb=$('readingBox');
  if(rb.getBoundingClientRect().bottom<innerHeight)window.scrollBy(0,18);
}

function miniMD(md){
  let t=md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t=t.replace(/^#{1,4}\s*(.*)$/gm,'<h3>$1</h3>');
  t=t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  t=t.replace(/`([^`]+)`/g,'$1');
  return t.split(/\n{2,}/).map(b=>{
    const bt=b.trim();
    if(bt.startsWith('<h3>'))return bt.replace(/\n/g,'<br>');
    if(/^[-*·]\s/.test(bt))return '<ul>'+bt.split('\n').map(l=>' <li>'+l.replace(/^[-*·]\s*/,'')+'</li>').join('')+'</ul>';
    return bt?'<p>'+bt.replace(/\n/g,'<br>')+'</p>':'';
  }).join('');
}
function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
$('btnRead').onclick=askTarot;
$('btnSave').onclick=function(){this.textContent='✓ 已存入历史记录（右上角📜查看）';
  const b=this;setTimeout(()=>b.textContent='收藏本次解读',2200);};

/* ================= 历史 ================= */
function loadHist(){try{return JSON.parse(localStorage.getItem('tarot_hist_v1')||'[]')}catch(e){return[]}}
function addToHistory(rec){const h=loadHist();h.unshift(rec);localStorage.setItem('tarot_hist_v1',JSON.stringify(h.slice(0,50)));}
$('btnHist').onclick=function(){
  const list=$('histList'),h=loadHist();
  list.innerHTML=h.length?'':'<div style="text-align:center;color:#8a81b8;padding:24px 0">还没有占卜记录</div>';
  h.forEach(r=>{
    const d=document.createElement('div');d.className='hist-item';
    d.innerHTML='<b>'+escapeHtml(r.time)+'</b> · '+escapeHtml(r.spread)+
      '<div class="hist-cards">'+(r.q?'问：'+escapeHtml(r.q)+'<br>':'')+'⟡ '+escapeHtml(r.cards)+'</div>'+
      '<div style="max-height:84px;overflow:hidden;color:#7d74a8">'+escapeHtml(String(r.text||'').slice(0,90))+'…</div>';
    list.appendChild(d);
  });
  $('histMask').classList.add('open');
};
$('btnCloseHist').onclick=()=>$('histMask').classList.remove('open');
$('histMask').onclick=e=>{if(e.target===$('histMask'))$('histMask').classList.remove('open')};
$('btnClearHist').onclick=()=>{localStorage.removeItem('tarot_hist_v1');$('btnHist').click();};