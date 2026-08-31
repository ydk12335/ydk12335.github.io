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
  let W=0,H=0,stars=[],dust=[],moon=null,planets=[];

  /* 远景星球：每次打开随机生成 2~4 颗，粒子构成（与月亮同款物理：可打散/聚合） */
  const PLANET_HUES=[
    ['#fff1cf','#f3d9a0'],  /* 暖金 */
    ['#dceaff','#b9cdf0'],  /* 冷蓝 */
    ['#f6e2f4','#d9b8e0'],  /* 淡紫玫 */
    ['#e2ffe8','#a8dcb5'],  /* 幽绿 */
    ['#ffe6d4','#f0bd9c']   /* 橙岩 */
  ];
  function makePlanets(){
    planets=[];
    const count=2+Math.floor(Math.random()*3);/* 2~4 颗 */
    /* 只落在可见天空：顶部横带（标题两侧）、底部页脚带、左右边缘带——避开中央面板 */
    const zones=[];
    if(H>560){
      /* 顶部带：避开月亮（右上） */
      zones.push({x0:W*.06,x1:W*.40,y0:H*.05,y1:H*.22});
      zones.push({x0:W*.55,x1:W*.94,y0:H*.30,y1:H*.40});
      /* 底部带：页脚区 */
      zones.push({x0:W*.10,x1:W*.90,y0:H*.86,y1:H*.95});
    }else{
      zones.push({x0:W*.08,x1:W*.92,y0:H*.06,y1:H*.24});
      zones.push({x0:W*.10,x1:W*.90,y0:H*.82,y1:H*.94});
    }
    const spots=[];
    for(let tries=0;tries<60&&spots.length<count;tries++){
      const z=zones[tries%zones.length];
      const x=z.x0+Math.random()*(z.x1-z.x0), y=z.y0+Math.random()*(z.y1-z.y0);
      const farMoon=Math.hypot(x-(W-Math.max(70,W*.10)), y-(H*.075))>W*.17;
      const farOthers=spots.every(s=>Math.hypot(x-s.x,y-s.y)>W*.16);
      if(farMoon&&farOthers)spots.push({x,y});
    }
    spots.forEach(s=>{
      const R=Math.min(30,W*.024)+10+Math.random()*14;
      const cnt=Math.max(40,Math.floor(R*R/22));
      const [cHi,cLo]=PLANET_HUES[Math.floor(Math.random()*PLANET_HUES.length)];
      const hasRing=Math.random()<.45;
      const pts=[];
      for(let i=0;i<cnt;i++){
        const a=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random())*R;
        const x=s.x+Math.cos(a)*rr,y=s.y+Math.sin(a)*rr;
        const edge=1-rr/R;
        pts.push({hx:x,hy:y,x,y,vx:0,vy:0,
          r:edge>.55?(Math.random()*1.4+.9):(Math.random()*1.0+.45),
          glow:edge,ph:Math.random()*Math.PI*2});
      }
      planets.push({cx:s.x,cy:s.y,R,pts,cHi,cLo,ring:hasRing,
        ringA:-.5+Math.random(),driftA:Math.random()*Math.PI*2,
        driftS:.03+Math.random()*.04,driftR:6+Math.random()*10,haze:0});
    });
  }
  function stepPlanets(t,px,py,active){
    for(const p of planets){
      /* 整体缓慢漂移（圆周游走） */
      const ox=Math.cos(t*p.driftS+p.driftA)*p.driftR, oy=Math.sin(t*p.driftS*.8+p.driftA)*p.driftR*.7;
      let energy=0;
      for(const q of p.pts){
        const bx=Math.cos(t*.3+q.ph)*.6,by=Math.sin(t*.25+q.ph*1.6)*.6;
        const ddx=q.x-px,ddy=q.y-py,d2=ddx*ddx+ddy*ddy,R2=90*90;
        if(active&&d2<R2&&d2>.01){
          const d=Math.sqrt(d2),f=(1-d/90);
          q.vx+=(ddx/d)*f*2.2+(Math.random()-.5)*f*1.4;
          q.vy+=(ddy/d)*f*2.2+(Math.random()-.5)*f*1.4;
          energy=Math.max(energy,f);
        }
        q.vx+=(q.hx+bx+ox-q.x)*.02;
        q.vy+=(q.hy+by+oy-q.y)*.02;
        q.vx*=.90;q.vy*=.90;
        q.x+=q.vx;q.y+=q.vy;
      }
      p.haze+=((energy>.02?Math.min(.4,energy*.8):0)-p.haze)*.08;
      /* 柔光底 */
      const gx=p.cx+ox,gy=p.cy+oy;
      const hg=ctx.createRadialGradient(gx,gy,p.R*.2,gx,gy,p.R*2.2);
      hg.addColorStop(0,hexA(p.cHi,.10+p.haze*.2));
      hg.addColorStop(1,hexA(p.cHi,0));
      ctx.globalAlpha=1;ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(gx,gy,p.R*2.2,0,6.284);ctx.fill();
      /* 行星环（随机拥有，微倾椭圆） */
      if(p.ring){
        ctx.save();
        ctx.globalAlpha=.22+p.haze*.2;
        ctx.strokeStyle=hexA(p.cLo,.7);ctx.lineWidth=1.2;
        ctx.beginPath();ctx.ellipse(gx,gy,p.R*1.7,p.R*.38,p.ringA,0,6.284);ctx.stroke();
        ctx.restore();
      }
      /* 粒子本体 */
      for(const q of p.pts){
        const spd=Math.abs(q.vx)+Math.abs(q.vy);
        ctx.globalAlpha=Math.min(1,.4+q.glow*.45+spd*.05);
        ctx.fillStyle=q.glow>.55?p.cHi:p.cLo;
        ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.284);ctx.fill();
      }
    }
  }
  function hexA(h,a){
    const n=parseInt(h.slice(1),16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
  }
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
    makePlanets();
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
    requestAnimationFrame(step);/* 先续帧 */
    if(document.querySelector('.void-escaped.on'))return;/* 彩蛋打开时暂停主页动画，省下整条渲染管线 */
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

    /* --- 星球（远景，先画，在星空之上、月亮之下） --- */
    stepPlanets(t,px,py,active);

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
      card.closest('.slot').classList.add('revealed');
      flipCount++;flipUpdateUI();
    });
  });
  $('btnFlipAll').style.display='';
  $('btnFlipAll').onclick=()=>box.querySelectorAll('.card:not(.flipped)').forEach((c,i)=>setTimeout(()=>c.click(),i*300));
  const quick=$('btnQuickFlip');
  quick.disabled=false;
  quick.onclick=()=>{
    const rest=box.querySelectorAll('.card:not(.flipped)');
    if(!rest.length)return;
    quick.disabled=true;
    rest.forEach((c,i)=>setTimeout(()=>c.click(),i*300));
  };
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
  const st=$('aiStatus');st.classList.add('thinking');
  st.innerHTML='<span class="orb-ring"></span><span class="status-word">'+STATUS_WORDS[0]+'</span>';
  clearInterval(statusTimer);let wi=0;
  statusTimer=setInterval(()=>{const w=st.querySelector('.status-word');if(w)w.textContent=STATUS_WORDS[++wi%STATUS_WORDS.length]},3200);

  let full='',shown='';
  const renderEnd='<span class="caret"></span>';
  let doneFlag=false;

  try{
    const ctrl=new AbortController();const abortT=setTimeout(()=>ctrl.abort(),120000);
    const res=await fetch(API_BASE+'/chat/completions',{method:'POST',signal:ctrl.signal,
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+API_KEY},
      body:JSON.stringify({model:MODEL,messages:[{role:'system',content:SYS_PROMPT},{role:'user',content:buildPrompt()}],temperature:.85,max_tokens:6000,stream:true})});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const rd=res.body.getReader(),dec=new TextDecoder();let buf='';
    let reasonLen=0,reasonShown=false;
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
          /* 模型思考阶段：reasoning_content 有内容但 content 还没来 */
          if(d.reasoning_content){
            reasonLen+=d.reasoning_content.length;
            if(!reasonShown){
              reasonShown=true;
              const w=st.querySelector('.status-word');
              if(w)w.textContent='🫧 塔罗师正凝神推演牌面深意……';
            }
            if(reasonLen%40<4){
              const w=st.querySelector('.status-word');
              if(w)w.textContent='🫧 塔罗师正凝神推演牌面深意……（已推演 '+Math.round(reasonLen/300)+'00 余字）';
            }
          }
          if(typeof d.content==='string'&&d.content){full+=d.content;
            shown=full;$('readingText').innerHTML=miniMD(shown)+renderEnd;}
        }catch(e){}
      }
    }
    clearTimeout(abortT);
    full=full.trim();
    if(!full)throw new Error('空响应');
  }catch(err){
    console.warn('流式失败，降级：',err);
    st.classList.add('thinking');
    try{
      st.textContent='🌀 更换一种方式凝神细语……';
      const res2=await fetch(API_BASE+'/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+API_KEY},
        body:JSON.stringify({model:MODEL,messages:[{role:'system',content:SYS_PROMPT},{role:'user',content:buildPrompt()}],temperature:.85,max_tokens:6000})});
      const j2=await res2.json();
      if(!res2.ok||!j2.choices)throw new Error((j2.error&&j2.error.message)||('HTTP '+res2.status));
      full=(j2.choices[0].message.content||'').trim();
      if(!full)throw new Error('空响应');
    }catch(e2){
      clearInterval(statusTimer);st.classList.remove('thinking');st.textContent='';
      $('readingText').innerHTML='<strong style="color:#ff9d9d">✕ 连接月亮的信号中断了…</strong>'+
        '<p style="color:#cbc0ea;margin-top:8px">原因：'+escapeHtml(String(e2&&e2.message||'未知错误').slice(0,160))+'</p>'+
        '<p style="color:#8a81b8;margin-top:8px">请检查网络后点击下方「换一问再来」重新占卜。</p>';
      readingBusy=false;$('btnRead').disabled=false;return;
    }
  }
  clearInterval(statusTimer);st.classList.remove('thinking');st.textContent='';
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

/* ---------- 公告 / 使用说明 ---------- */
const markNoticeSeen=()=>{try{localStorage.setItem('tarot_notice_seen','1')}catch(e){}};
const openNotice=()=>{$('noticeMask').classList.add('open')};
const closeNotice=()=>{$('noticeMask').classList.remove('open');markNoticeSeen();
  /* 公告关闭后：首次弹音乐询问（默认关闭，只问一次） */
  try{
    if(!localStorage.getItem('tarot_music_asked')){
      localStorage.setItem('tarot_music_asked','1');
      setTimeout(()=>{const m=$('musicAskMask');if(m)m.classList.add('open');},600);
    }
  }catch(e){}
};
$('btnNotice').onclick=openNotice;
$('btnNoticeOk').onclick=closeNotice;
$('noticeMask').onclick=e=>{if(e.target===$('noticeMask'))closeNotice()};
try{if(!localStorage.getItem('tarot_notice_seen'))setTimeout(openNotice,1200)}catch(e){}

/* ---------- 音乐播放器：夜色电台 ---------- */
(function(){
  const TRACKS=[
    {t:'烟火里的尘埃',a:'华晨宇',f:'烟火里的尘埃.mp3'},
    {t:'绅士',a:'薛之谦',f:'绅士.mp3'},
    {t:'把回忆拼好给你',a:'王贰浪',f:'把回忆拼好给你.mp3'},
    {t:'半岛铁盒',a:'周杰伦',f:'半岛铁盒.mp3'},
    {t:'轨迹',a:'周杰伦',f:'轨迹.mp3'},
    {t:'唯一',a:'G.E.M. 邓紫棋',f:'唯一.mp3'},
    {t:'暧昧',a:'薛之谦',f:'暧昧.mp3'},
    {t:'如果呢',a:'郑润泽',f:'如果呢.mp3'},
    {t:'疑心病2025 (DJ版)',a:'DJ小樂',f:'疑心病2025.mp3'},
    {t:'不能说的秘密',a:'周杰伦',f:'不能说的秘密.mp3'},
    {t:'搁浅',a:'周杰伦',f:'搁浅.mp3'},
    {t:'不值得',a:'梦飞船',f:'不值得.mp3'},
    {t:'我好像在哪见过你',a:'薛之谦',f:'我好像在哪见过你.mp3'},
    {t:'碎碎念',a:'队长',f:'碎碎念.mp3'},
    {t:'daylight',a:'未知',f:'daylight.mp3'},
    {t:'越来越不懂',a:'蔡健雅',f:'越来越不懂.mp3'},
    {t:'你还要我怎样',a:'薛之谦',f:'你还要我怎样.mp3'},
    {t:'开往春天的列车',a:'HTRE（纯音乐）',f:'开往春天的列车.flac'},
    {t:'我落泪 情绪零碎',a:'周杰伦',f:'我落泪情绪零碎.mp3'},
    {t:'夏天的风',a:'温岚',f:'夏天的风.flac'},
    {t:'意外',a:'薛之谦',f:'意外.mp3'},
    {t:'晚安',a:'颜人中',f:'晚安.mp3'},
    {t:'嘉宾',a:'张远',f:'嘉宾.mp3'},
    {t:'等你下课',a:'周杰伦 / 杨瑞代',f:'等你下课.mp3'},
    {t:'平庸 (Live)',a:'薛之谦',f:'平庸.mp3'},
    {t:'剩下的盛夏',a:'TFBOYS',f:'剩下的盛夏.flac'},
    {t:'暧昧',a:'薛之谦',f:'暧昧2.mp3'},
    {t:'第三人称',a:'买辣椒也用券',f:'第三人称.mp3'},
    {t:'陪你去流浪',a:'薛之谦',f:'陪你去流浪.mp3'},
    {t:'嗜好',a:'颜人中',f:'嗜好.mp3'},
    {t:'一个人想着一个人（说唱版）',a:'艾比利',f:'一个人想着一个人.flac'},
    {t:'11',a:'队长 / 黄礼格',f:'11.flac'},
    {t:'最好的安排',a:'曲婉婷',f:'最好的安排.mp3'},
    {t:'我想念',a:'汪苏泷',f:'我想念.flac'}
  ];
  const audio=new Audio();audio.preload='none';
  let cur=-1,playing=false,mode='list';/* list | one | rand */
  const $id=s=>document.getElementById(s);
  const fmt=s=>{s=Math.max(0,s|0);return (s/60|0)+':'+String(s%60).padStart(2,'0')};
  function renderList(){
    const box=$id('musicList');box.innerHTML='';
    TRACKS.forEach((tr,i)=>{
      const d=document.createElement('div');d.className='music-item'+(i===cur?' playing':'');
      d.innerHTML='<span><span class="mi-idx">'+String(i+1).padStart(2,'0')+'</span>'+tr.t+' <small style="opacity:.5">· '+tr.a+'</small></span>';
      d.onclick=()=>play(i);
      box.appendChild(d);
    });
  }
  function play(i){
    cur=(i+TRACKS.length)%TRACKS.length;
    audio.src='music/'+encodeURIComponent(TRACKS[cur].f);
    audio.play().then(()=>{playing=true;sync();}).catch(()=>{});
    $id('musicNow').textContent='♪ '+TRACKS[cur].t+' — '+TRACKS[cur].a;
  }
  function toggle(){
    if(cur<0){play(Math.floor(Math.random()*TRACKS.length));return;}
    if(playing){audio.pause();playing=false;}
    else{audio.play().catch(()=>{});playing=true;}
    sync();
  }
  function sync(){
    $id('iconPlay').style.display=playing?'none':'';
    $id('iconPause').style.display=playing?'':'none';
    renderList();
  }
  $id('btnMusicPlay').onclick=toggle;
  $id('btnMusicNext').onclick=()=>next(1);
  $id('btnMusicPrev').onclick=()=>next(-1);
  function next(dir){
    if(mode==='one'&&dir===1){play(cur);return;}
    if(mode==='rand'){play(Math.floor(Math.random()*TRACKS.length));return;}
    play(cur+dir);
  }
  audio.addEventListener('ended',()=>{
    if(mode==='one')play(cur);else next(1);
  });
  audio.addEventListener('timeupdate',()=>{
    if(audio.duration){$id('musicBarFill').style.width=(audio.currentTime/audio.duration*100)+'%';}
    $id('musicCur').textContent=fmt(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata',()=>{$id('musicDur').textContent=fmt(audio.duration);});
  $id('musicBar').onclick=e=>{
    if(!audio.duration)return;
    const r=e.currentTarget.getBoundingClientRect();
    audio.currentTime=(e.clientX-r.left)/r.width*audio.duration;
  };
  $id('btnMusicMode').onclick=()=>{
    mode=mode==='list'?'one':(mode==='one'?'rand':'list');
    $id('btnMusicMode').textContent='循环：'+(mode==='list'?'列表':(mode==='one'?'单曲':'随机'));
  };
  $id('btnMusic').onclick=()=>{$id('musicMask').classList.add('open');renderList();};
  $id('btnCloseMusic').onclick=()=>$id('musicMask').classList.remove('open');
  $id('musicMask').onclick=e=>{if(e.target===$id('musicMask'))$id('musicMask').classList.remove('open')};
  /* 询问弹窗的按钮（弹出时机由公告 closeNotice 触发） */
  $id('btnMusicOn').onclick=()=>{
    $id('musicAskMask').classList.remove('open');
    $id('musicMask').classList.add('open');renderList();
    play(Math.floor(Math.random()*TRACKS.length));/* 用户主动点击，浏览器允许自动播放 */
  };
  $id('btnMusicOffStyle').onclick=()=>$id('musicAskMask').classList.remove('open');
  $id('musicAskMask').onclick=e=>{if(e.target===$id('musicAskMask'))$id('musicAskMask').classList.remove('open')};
})();

/* ---------- 深空彩蛋：粒子星球（镜头拉近操控） ---------- */
(function(){
  const zone=$('voidZone');
  let layer=null,cv=null,ctx=null,rafId=0,W2=0,H2=0,DPR=1;
  let bgStars=[],planets=[],world=null;
  let camS=1,camST=1,camX=0,camY=0,camTX=0,camTY=0;
  let worldW=0,worldH=0,panX=0,panY=0,panMinX=0,panMaxX=0,panMinY=0,panMaxY=0,dragOn=false,dragX=0,dragY=0;
  let pinch0=0,ps0=1,exiting=null,zoomCX=0,zoomCY=0;
  let px=-9999,py=-9999;
  let voidClosed=false;/* 彩蛋被主动关闭后进入冷却，防止 Observer 立刻重开 */

  const HUES=[['#fff1cf','#f3d9a0'],['#dceaff','#b9cdf0'],['#f6e2f4','#d9b8e0'],
              ['#e2ffe8','#a8dcb5'],['#ffe6d4','#f0bd9c'],['#cfe6ff','#a9c4e8']];
  const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';};

  /* ---------- 星球独白：每颗星球绑定专属忧郁文案 ---------- */
  const MOOD_LINES=[
    /* 星球 / 宇宙 */
    '这颗星已经独自转了很久，久到忘了被谁看见过。',
    '它记得每一粒尘的重量，却记不清上一次有人来访。',
    '有些光走了亿年才到这里，而它只是安静地亮着。',
    '它的环里锁着一段没人听过的潮汐。',
    '据说每颗星都藏着一个没说完的句子。',
    '它不悲伤，只是习惯了和黑暗平分昼夜。',
    '尘埃落在一切之上，包括等待。',
    '它曾也想成为流星，后来学会了做一颗慢星。',
    '如果你此刻也在某处独自发光，它懂你。',
    '宇宙里所有的沉默，加起来刚好是一整晚。',
    /* 学生时代 */
    '黑板上的倒计时停在毕业那天，没人舍得擦。',
    '我们总说改天聚，后来改天变成了很多年。',
    '晚自习的灯还亮着，只是换了一批人坐在下面。',
    '那个夏天蝉声很吵，吵得我们没听见彼此说的再见。',
    '课本最后一页还夹着没传出去的纸条。',
    '校服洗到发白，就到了说再见的时候。',
    '原来教室后排看出去的天空，是再也回不去的风景。',
    /* 爱情 / 分手 */
    '有些话停在输入框里，删了又打，最后随夜色一起咽下。',
    '我们不是输给了距离，是输给了后来的沉默。',
    '你说过最亮的那颗星像你，我后来每次抬头都会先找它。',
    '分手那天天气很好，好得像什么都没发生过。',
    '爱过的人变成了习惯，戒掉习惯比爱更难。',
    '聊天记录翻到底，那年冬天突然就没有声音了。',
    '我还在用你教我的方式系鞋带。',
    '有些人只能陪你走一段夜路，天亮之前就要说再见。',
    /* 成长 / 孤独 */
    '长大后才发现，大人的崩溃都是静音的。',
    '深夜的朋友圈打了又删，最后只发了一个月亮。',
    '我们都在等一句迟到的晚安，等成了守夜人。',
    '城市那么亮，却没有一盏灯是等我回去的。',
    '小时候哭着哭着就笑了，现在笑着笑着就沉默了。',
    '所有突然的懂事，背后都有一场没人看见的哭。',
    /* 氛围 / 夜 */
    '风把窗帘吹起又放下，像一句欲言又止的话。',
    '雨停之后，路灯把积水里的世界照得很轻。',
    '末班车驶过，整条街的影子都在告别。',
    '月亮很圆的时候，适合想念一些没结果的事。',
    '钟摆声在夜里放大，像谁在替我数着睡不着的时间。',
    '旧照片会泛黄，可有些人连照片都没有留下。',
    '我们之间隔着的不是山海，是再也不必说出口的话。',
    '他后来去了很远的城市，朋友圈停在那个秋天。',
    '有些心动只有一次，第二次就成了将就。',
    '她说自己很好，深夜的歌单全是慢歌。',
    '最后一次见面没有拥抱，像两个刚好顺路的人。',
    '你不是我的人生答案，只是我最疼的一道题。',
    '我们约好常联系，然后都成了对方列表里安静的头像。',
    '喜欢一个人最大的代价，是从此不敢听某几首歌。',
    '那年的雪很大，大到盖住了所有没说出口的挽留。',
    '教室的风扇转了三年，转散了一屋子人。',
    '数学卷子最后那道题我没解出来，就像后来也没读懂你。',
    '少年时以为的来日方长，原来是后会无期。',
    '那张写着同桌名字的座位表，随旧课本一起卖掉了。',
    '青春就是一场大雨，淋湿了还想回头再淋一次。',
    '毕业那天大家都在笑，只有照片里的眼睛红了。',
    '我们像两颗轨道不同的星，亮过同一段夜空就算缘分。',
    '有些星星熄灭很多年了，光才刚刚抵达，爱也一样。',
    '它不是最亮的那颗，只是你恰好在的那个方向。',
    '宇宙从不解释沉默，星星也从不解释离开。',
    '它自转的方向和思念一样，绕了一圈又回到原地。',
    '一个星球的孤独在于：它的白天和黑夜，没有观众。',
    '它在深空里漂了太久，把经过的每一颗流星都当成了问候。',
    '别的星球有卫星作伴，它只有自己发出的光。',
    '凌晨三点的世界属于三件事：失眠、回忆和月亮。',
    '有些人适合想念，不适合再见。',
    '故事的开头都是适逢其会，结局多是各自天涯。',
    '人间烟火气最抚凡人心，可偏偏有人在烟火外。',
    '泪点低的人不是脆弱，只是把心事攒得太满。',
    '后来的我们什么都有了，却没有了我们。'
  ];
  /* 组合式扩充：场景 × 意象，再生成数百条同风格短句 */
  const MOOD_PLACES=['课桌上','末班车上','旧操场','天台上','便利店门口','雨中的站台','老家的巷口','毕业照里','空教室','宿舍楼下','医院走廊','深夜的厨房','人潮里','阳台','候机厅','旧书页间','抽屉深处','地铁站台','夏天的风里','冬天的路灯下'];
  const MOOD_IMAGES=['有半句没说完的话','还留着一个人的名字','曾放着一首没听完的歌','藏着一句没送出的晚安','有一段没走完的路','停着一个没接起的电话','落满了一句对不起','晒着再也回不去的下午','站着一个等不到的人','熄着一盏没人关的灯','吹过一阵和那年一样的风','摆着两只再没碰过的杯子','坐着两个假装陌生的人','剩下一句没兑现的承诺','躺着一张过期的电影票','结着一层没人擦的灰'];
  MOOD_PLACES.forEach(p=>MOOD_IMAGES.forEach(m=>MOOD_LINES.push(p+m+'。')));
  let moodPool=MOOD_LINES.slice();
  try{const saved=JSON.parse(localStorage.getItem('tarot_void_moods')||'[]');
    moodPool=moodPool.concat(saved.filter(s=>typeof s==='string'&&s.length>4));}catch(e){}
  let aiMoodBusy=false;
  const usedMoods=new Set();/* 全局已抽句子：星球独白与文案签共用 */
  function pickMood(used){
    const fresh=moodPool.filter(s=>!used.has(s));
    const src=fresh.length?fresh:moodPool;
    return src[Math.floor(Math.random()*src.length)];
  }
  window.__moodPool=moodPool;window.__usedMoods=usedMoods;/* 供文案签模块共用 */
  async function maybeAiMood(){
    if(aiMoodBusy||Math.random()>.5)return;
    aiMoodBusy=true;
    try{
      const res=await fetch(API_BASE+'/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+API_KEY},
        body:JSON.stringify({model:MODEL,max_tokens:2000,temperature:1.0,messages:[
          {role:'system',content:'你是一位安静的夜色诗人。输出一句中文的、简短（不超过35字）、忧郁而克制的句子。主题随机：孤独的星球、学生时代的遗憾、错过的爱情、分手后的沉默、深夜的氛围。只输出句子本身，不要引号和任何多余内容。'},
          {role:'user',content:'写一句新的，与以下这些不要重复：'+moodPool.slice(-5).join(' / ')}]})});
      const j=await res.json();
      const line=((j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'').trim().replace(/^["“”'']+|["“”'']+$/g,'');
      if(line&&line.length<=60&&!moodPool.includes(line)){
        moodPool.push(line);
        try{const mine=JSON.parse(localStorage.getItem('tarot_void_moods')||'[]');
          mine.push(line);localStorage.setItem('tarot_void_moods',JSON.stringify(mine.slice(-30)));}catch(e){}
      }
    }catch(e){/* 静默失败，本地池够用 */}
    aiMoodBusy=false;
  }

  /* 生成一颗星球：粒子均匀铺在球面上（极坐标分层，边缘更密更亮） */
  function makePlanet(sx,sy,R,hi,lo,ring,ringA){
    const pts=[];
    /* 分层填充：由内到外，每层粒子分布在环带上，视觉上均匀成球（高密度） */
    const layers=12;
    for(let li=0;li<layers;li++){
      const frac=(li+1)/layers;
      const rr=Math.sqrt(frac)*R;
      const cnt=Math.max(10,Math.round(95*frac));
      const off=Math.random()*6.28;
      for(let k=0;k<cnt;k++){
        const a=off+k/cnt*6.283+(Math.random()-.5)*.5;
        const jx=(Math.random()-.5)*R*.09,jy=(Math.random()-.5)*R*.09;
        const x=sx+Math.cos(a)*rr+jx,y=sy+Math.sin(a)*rr*.95+jy;
        const edge=1-rr/R;
        pts.push({hx:x,hy:y,x,y,vx:0,vy:0,
          r:edge>.5?Math.random()*1.4+1.0:Math.random()*.9+.5,
          glow:edge,ph:Math.random()*6.28});
      }
    }
    return {x:sx,y:sy,R,hi,lo,ring,ringA,pts,seed:Math.random()*100,entered:false};
  }

  function build(){
    layer=document.createElement('div');layer.className='void-escaped';
    layer.innerHTML='<canvas></canvas><button class="esc-back">← 返回塔罗</button>'+
      '<div class="esc-hint">拖 动 漫 游 星 野 · 点 击 星 球 深 入</div>'+
      '<div class="esc-mood" id="escMood"></div>';
    document.body.appendChild(layer);
    cv=layer.querySelector('canvas');ctx=cv.getContext('2d');
    DPR=Math.min(devicePixelRatio||1,2);

    const mkScene=()=>{
      W2=innerWidth;H2=innerHeight;
      cv.width=W2*DPR;cv.height=H2*DPR;
      cv.style.width=W2+'px';cv.style.height=H2+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      bgStars=Array.from({length:Math.min(420,Math.floor(W2*H2/5200))},()=>({
        x:Math.random()*worldW,y:Math.random()*worldH,
        r:Math.random()*1.2+.3,tw:Math.random()*6.28,ts:Math.random()*.8+.3,
        hue:Math.random()<.25?'176,208,255':'255,246,224'}));
            /* 星球：随机撒满一张 2.2×1.8 倍屏的星野（可上下左右拖动），泊松间距防重叠；每颗绑定专属文案 */
      planets=[];
      worldW=W2*2.2;worldH=H2*1.8;
      const count=14+Math.floor(Math.random()*5);/* 14~18 颗 */
      const placed=[];
      for(let tries=0;tries<800&&placed.length<count;tries++){
        const far=Math.random()<.55;/* 大小星混出层次 */
        const R=far?(Math.random()*18+14):(Math.random()*26+26);
        const x=worldW*.04+Math.random()*worldW*.92;
        const y=worldH*.06+Math.random()*worldH*.86;
        const ok=placed.every(p=>Math.hypot(x-p.x,y-p.y)>(R+p.R)*1.3+12);
        if(ok)placed.push({x,y,R});
      }
      placed.forEach((p)=>{
        const [hi,lo]=HUES[Math.floor(Math.random()*HUES.length)];
        planets.push(makePlanet(p.x,p.y,p.R,hi,lo,Math.random()<.5,Math.random()-.5));
      });
      panX=W2/2;panY=H2/2;
      panMinX=W2/2;panMaxX=worldW-W2/2;
      panMinY=H2/2;panMaxY=worldH-H2/2;
      camX=camTX=panX;camY=camTY=panY;
      /* 恢复相机 */
      if(world){
        camS=camST=world.entered?2.2:1;
        camX=camTX=world.x;camY=camTY=world.y;
      }
    };
    mkScene();
    addEventListener('resize',()=>{if(!world)mkScene();});

    /* 指针：空白处拖动=平移星野；点星球=进入；星球内=搅动 */
    const showMood=(txt)=>{
      const m=layer.querySelector('.esc-mood');
      m.textContent=txt;m.classList.add('on');
      clearTimeout(m._t);m._t=setTimeout(()=>m.classList.remove('on'),6000);
    };
    const toWorldX=(sx)=>(sx-W2/2)/camS+camX;
    const toWorldY=(sy)=>(sy-H2/2)/camS+camY;
    /* 每次点开都随机抽句（session 内尽量不重复，池子够大时同一轮不重样） */
    const enterPlanet=(pl)=>{
      world=pl;pl.entered=true;exiting=null;
      camX=pl.x;camY=pl.y;camS=Math.min(camS,1);
      camTX=pl.x;camTY=pl.y;camST=2.4;
      const line=pickMood(usedMoods);usedMoods.add(line);
      showMood(line);
      maybeAiMood();
      layer.querySelector('.esc-hint').textContent='搅 动 星 尘 · 双 指 / 滚 轮 缩 放 · 捏 小 退 出';
      layer.querySelector('.esc-back').textContent='← 退 出 星 球';
    };
    /* 全景缩放：以指针为锚点，放大到星球上即进入 */
    const zoomOverviewTo=(ns,sx,sy)=>{
      const cx=sx>-999?sx:W2/2, cy=sy>-999?sy:H2/2;
      const wx=toWorldX(cx),wy=toWorldY(cy);
      camST=ns;
      const nx=wx-(cx-W2/2)/ns, ny=wy-(cy-H2/2)/ns;
      panX=Math.min(panMaxX,Math.max(panMinX,nx));
      panY=Math.min(panMaxY,Math.max(panMinY,ny));
      /* 相机统一走 frame 里的缓动，不在这里跳变 */
      if(ns>=1.9){
        for(const pl of planets){
          if(Math.hypot(wx-pl.x,wy-pl.y)<pl.R*1.3){enterPlanet(pl);break;}
        }
      }
    };
    /* 按下星球：延迟判定——抬起时位移小才算点击进入，位移大当作拖动平移 */
    const TAP_SLOP=12;/* px，超过视为拖动 */
    let tapPl=null,tapX=0,tapY=0;
    layer.addEventListener('pointerdown',e=>{
      if(world)return;
      tapPl=null;tapX=e.clientX;tapY=e.clientY;
      const wx=toWorldX(e.clientX),wy=toWorldY(e.clientY);
      for(const pl of planets){
        if(Math.hypot(wx-pl.x,wy-pl.y)<pl.R*1.4){tapPl=pl;break;}
      }
      /* 无论起手是否在星球上，都允许拖动平移 */
      dragOn=true;dragX=e.clientX;dragY=e.clientY;
    });
    layer.addEventListener('pointermove',e=>{
      px=e.clientX;py=e.clientY;
      if(dragOn&&!world){
        const PSPD=1.6;/* 平移灵敏度：拖动距离 × 1.6 */
        panX=Math.min(panMaxX,Math.max(panMinX,panX-(e.clientX-dragX)*PSPD/camS));
        panY=Math.min(panMaxY,Math.max(panMinY,panY-(e.clientY-dragY)*PSPD/camS));
        dragX=e.clientX;dragY=e.clientY;
      }
    });
    const endDrag=(e)=>{
      /* 起手在星球上且几乎没动 → 判定为点击，进入星球 */
      if(tapPl&&e&&Math.hypot(e.clientX-tapX,e.clientY-tapY)<TAP_SLOP&&!world){
        const pl=tapPl;tapPl=null;dragOn=false;
        enterPlanet(pl);
        return;
      }
      tapPl=null;dragOn=false;
    };
    layer.addEventListener('pointerup',endDrag);
    layer.addEventListener('pointercancel',()=>{tapPl=null;dragOn=false;});
    layer.addEventListener('pointerleave',()=>{tapPl=null;dragOn=false;px=py=-9999;});

    /* 缩放：星球内=进入态缩放；全景=以指针为锚缩放，放大到星球上直接进入 */
    layer.addEventListener('wheel',e=>{
      e.preventDefault();
      if(world){
        const ns=Math.min(3.5,Math.max(1.05,camST*(e.deltaY>0?.92:1.08)));
        camST=ns;
        if(ns<=1.12)exitWorld();
      }else{
        zoomOverviewTo(Math.min(2.4,Math.max(1,camST*(e.deltaY>0?.9:1.1))),px,py);
      }
    },{passive:false});
    /* 双指：星球内=捏合缩放；全景=捏合缩放/放大到星球进入 */
    layer.addEventListener('touchstart',e=>{
      if(e.touches.length===2){
        pinch0=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        ps0=camST;
        zoomCX=(e.touches[0].clientX+e.touches[1].clientX)/2;
        zoomCY=(e.touches[0].clientY+e.touches[1].clientY)/2;
      }
    },{passive:true});
    layer.addEventListener('touchmove',e=>{
      if(e.touches.length===2&&pinch0>0&&!world){
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        zoomOverviewTo(Math.min(2.4,Math.max(1,ps0*d/pinch0)),zoomCX,zoomCY);
      }else if(world&&e.touches.length===2&&pinch0>0){
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        const ns=Math.min(3.5,Math.max(1.05,ps0*d/pinch0));
        camST=ns;
        if(ns<=1.12){pinch0=0;exitWorld();}
      }
    },{passive:true});

    function exitWorld(){
      /* 平滑退出：相机先缩回全景，动画走完再解除聚焦 */
      camST=1;camTX=panX;camTY=panY;
      exiting=world;world=null;px=py=-9999;
      const m=layer.querySelector('.esc-mood');
      if(m){clearTimeout(m._t);m.classList.remove('on');}
      layer.querySelector('.esc-hint').textContent='拖 动 漫 游 星 野 · 点 击 星 球 深 入';
      layer.querySelector('.esc-back').textContent='← 返回塔罗';
    }

    layer.querySelector('.esc-back').addEventListener('click',()=>{
      if(world){
        exitWorld();
      }else{
        layer.classList.remove('on');
        layer.style.opacity='0';
        voidClosed=true;/* 冷却：防止当前位置残留触发立刻重开 */
        window.scrollTo(0,0);/* 瞬时回顶：平滑滚动途中会路过深空触发区导致彩蛋误重开 */
      }
    });

    function frame(t){
      rafId=requestAnimationFrame(frame);
      if(!layer.classList.contains('on'))return;/* 未打开时跳过渲染，循环保持活着 */
      const tt=t/1000;
      ctx.clearRect(0,0,W2,H2);
      /* 底色 */
      const bg=ctx.createRadialGradient(W2/2,H2/2,0,W2/2,H2/2,Math.max(W2,H2)*.75);
      bg.addColorStop(0,'#050313');bg.addColorStop(1,'#010006');
      ctx.fillStyle=bg;ctx.fillRect(0,0,W2,H2);
      /* 相机缓动：未进入时跟随平移位置，进入/退出时平滑过渡 */
      const tX=world?world.x:panX, tY=world?world.y:panY;
      camS+=(camST-camS)*.06;
      camX+=(tX-camX)*.06;
      camY+=(tY-camY)*.06;
      if(exiting&&!world&&Math.abs(camS-1)<.02){exiting=null;camST=1;}/* 只清标记，相机已缓动到位，不强制吸附 */
      /* 视口裁剪：只画视野内的天体（星海 2.2×1.8 倍屏，屏外全部跳过） */
      const vw=W2/(2*camS),vh=H2/(2*camS);
      const vx0=camX-vw,vx1=camX+vw,vy0=camY-vh,vy1=camY+vh;
      ctx.save();
      ctx.translate(W2/2,H2/2);ctx.scale(camS,camS);ctx.translate(-camX,-camY);
      /* 背景星（星野坐标，随平移视差移动，仅画视野内） */
      for(const s of bgStars){
        if(s.x<vx0-20||s.x>vx1+20||s.y<vy0-20||s.y>vy1+20)continue;
        s.tw+=.02*s.ts;
        ctx.fillStyle='rgba('+s.hue+','+Math.max(0,.3+Math.sin(s.tw)*.28)+')';
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.284);ctx.fill();
      }
      /* 星球们（视野内才逐粒子处理） */
      for(const pl of planets){
        const bob=Math.sin(tt*.3+pl.seed)*4;
        const cy=pl.y+bob;
        const isWorld=world===pl;
        const wasWorld=exiting===pl;
        const phys=isWorld||wasWorld;/* 进入或退出动画期间都走平滑物理，避免粒子瞬移 */
        const vis=pl.x+pl.R*2.5>vx0&&pl.x-pl.R*2.5<vx1&&cy+pl.R*2.5>vy0&&cy-pl.R*2.5<vy1;
        if(!vis&&!isWorld&&!wasWorld)continue;
        const active=!world||isWorld;
        /* 柔光底 */
        const gl=ctx.createRadialGradient(pl.x,cy,pl.R*.3,pl.x,cy,pl.R*2.4);
        gl.addColorStop(0,hexA(pl.hi,.12));gl.addColorStop(1,hexA(pl.hi,0));
        ctx.globalAlpha=1;ctx.fillStyle=gl;
        ctx.beginPath();ctx.arc(pl.x,cy,pl.R*2.4,0,6.284);ctx.fill();
        /* 行星环 */
        if(pl.ring){
          ctx.save();ctx.translate(pl.x,cy);ctx.rotate(pl.ringA);
          ctx.strokeStyle=hexA(pl.hi,isWorld?.8:.45);ctx.lineWidth=1.4;
          ctx.beginPath();ctx.ellipse(0,0,pl.R*1.72,pl.R*.4,0,0,6.284);ctx.stroke();
          ctx.restore();
        }
        /* 粒子球体 */
        const pwx=toWorldX(px),pwy=toWorldY(py);/* 指针换算到星野坐标，保证任意位置都能搅动 */
        for(const q of pl.pts){
          const bx=Math.cos(tt*.4+q.ph)*.7,by=Math.sin(tt*.33+q.ph*1.6)*.7;
          const hx=q.hx+bx,hy=q.hy+by+bob;
          if(isWorld||wasWorld){
            const ddx=pwx-q.x,ddy=pwy-q.y,d2=ddx*ddx+ddy*ddy,R2=170*170;
            if(px>-999&&isWorld&&d2<R2&&d2>.01){
              const d=Math.sqrt(d2),f=1-d/170;
              /* 吸力平滑衰减，太近处（<24px）轻柔外撑防止叠死 */
              const s=d<24?-(1-d/24)*.9:f*.85;
              q.vx+=(ddx/d)*s+(Math.random()-.5)*f*.35;
              q.vy+=(ddy/d)*s+(Math.random()-.5)*f*.35;
            }
            q.vx+=(hx-q.x)*.0012;q.vy+=(hy-q.y)*.0012;
            q.vx*=.97;q.vy*=.97;
            q.x+=q.vx;q.y+=q.vy;
          }else{
            /* 未进入：仅呼吸（不逐帧累计物理，直接取位置） */
            q.x=hx;q.y=hy;
          }
          const a=(!world||isWorld)?Math.min(1,.5+q.glow*.5):Math.min(1,.35+q.glow*.4);
          ctx.globalAlpha=a;
          ctx.fillStyle=q.glow>.5?pl.hi:pl.lo;
          ctx.beginPath();ctx.arc(q.x,q.y,q.r/Math.max(1,camS*.5),0,6.284);ctx.fill();
        }
        /* 悬停提示圈（指针换算到星野坐标） */
        if(!world&&px>-999&&Math.hypot(toWorldX(px)-pl.x,toWorldY(py)-cy)<pl.R*1.4){
          ctx.globalAlpha=1;
          ctx.strokeStyle='rgba(240,207,130,.55)';ctx.lineWidth=1.2;
          ctx.setLineDash([5,7]);
          ctx.beginPath();ctx.arc(pl.x,cy,pl.R*1.55+Math.sin(tt*3)*3,0,6.284);ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.restore();
      ctx.globalAlpha=1;
    }
    rafId=requestAnimationFrame(frame);
  }

  function enter(){
    if(!layer)build();
    layer.classList.add('on');
    /* 入场动画：黑幕中星空缓缓浮现，相机从深处缓缓拉出 */
    layer.style.opacity='0';
    layer.style.transition='none';
    void layer.offsetWidth;
    layer.style.transition='opacity 1.2s ease';
    layer.style.opacity='1';
    camS=2.6;camST=1;camX=W2/2;camY=H2/2;
    try{localStorage.setItem('tarot_void_found','1')}catch(e){}
  }

  /* 离开触发区时解除冷却（冷却只用于关闭后的瞬间，防止原地立刻重开） */
  if('IntersectionObserver' in window){
    new IntersectionObserver(es=>{
      es.forEach(e=>{if(!e.isIntersecting&&voidClosed)voidClosed=false;});
    },{threshold:[.55]}).observe(zone);
  }

  if('IntersectionObserver' in window){
    new IntersectionObserver(es=>{
      es.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.55)enter();});
    },{threshold:[.55]}).observe(zone);
  }else{
    addEventListener('scroll',()=>{
      if(scrollY+innerHeight>=document.body.scrollHeight-80)enter();
    },{passive:true});
  }
})();

/* ---------- 文案签：氛围图 + 不重复文案抽卡 ---------- */
(function(){
  const moodPool=window.__moodPool;
  const usedMoods=window.__usedMoods;
  if(!moodPool)return;
  const quoteSeedUsed=new Set();
  function pickLine(used){
    const fresh=moodPool.filter(s=>!used.has(s));
    const src=fresh.length?fresh:moodPool;
    return src[Math.floor(Math.random()*src.length)];
  }
  async function aiLine(used){
    try{
      const res=await fetch(API_BASE+'/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+API_KEY},
        body:JSON.stringify({model:MODEL,max_tokens:2000,temperature:1.0,messages:[
          {role:'system',content:'你是一位安静的夜色诗人。输出一句中文的、简短（不超过35字）、忧郁而克制的句子。主题随机：学生时代的遗憾、错过的爱情、分手后的沉默、孤独、深夜的氛围。只输出句子本身，不要引号和任何多余内容。'},
          {role:'user',content:'写一句新的，与以下不要重复：'+moodPool.slice(-6).join(' / ')}]})});
      const j=await res.json();
      const line=((j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'').trim().replace(/^["“”'']+|["“”'']+$/g,'');
      if(line&&line.length<=60&&!moodPool.includes(line)){
        moodPool.push(line);
        try{const mine=JSON.parse(localStorage.getItem('tarot_void_moods')||'[]');
          mine.push(line);localStorage.setItem('tarot_void_moods',JSON.stringify(mine.slice(-40)));}catch(e){}
        if(!used.has(line)){used.add(line);return line;}
      }
    }catch(e){}
    return null;
  }
  const QUOTE_THEMES=[
    {tag:'学 · 憾',keys:['课','教室','黑板','毕业','校服','同桌','课本','晚自习','少年','青春','风扇','卷子','座位'],
      seed:'school',filter:'sepia(.25) saturate(.7) brightness(.85)'},
    {tag:'爱 · 别',keys:['爱','喜欢','分手','再见','吻','拥抱','告白','他','她','你','心动','挽留','挽'],
      seed:'love',filter:'saturate(.65) brightness(.8) hue-rotate(-12deg)'},
    {tag:'夜 · 寂',keys:['夜','深夜','凌晨','失眠','月亮','星星','路灯','末班','沉默','孤独','星球','宇宙','光'],
      seed:'night',filter:'saturate(.55) brightness(.7) contrast(1.1) hue-rotate(180deg)'},
    {tag:'时 · 流',keys:['风','雨','雪','季节','夏天','冬天','照片','旧','回不','后来','钟摆','尘埃','窗帘'],
      seed:'time',filter:'grayscale(.35) brightness(.85)'}
  ];
  function themeOf(line){
    for(const t of QUOTE_THEMES){
      if(t.keys.some(k=>line.includes(k)))return t;
    }
    return QUOTE_THEMES[3];
  }
  /* 本地生成氛围图（Canvas）：按主题配色绘制夜空+星点+剪影，无网络依赖 */
  const THEME_PALETTE={
    school:{sky:['#2a2440','#4a3d5c',' #8a6d6d'.trim()],glow:'#e8c9a0',stars:.55,scene:'desk'},
    love:{sky:['#1c1230','#4a2342','#7a3a52'],glow:'#f0a8b8',stars:.6,scene:'street'},
    night:{sky:['#050816','#0c1533','#1a2a55'],glow:'#cfe0ff',stars:1,scene:'moon'},
    time:{sky:['#22202e','#3a3648','#5a5468'],glow:'#d8d0c0',stars:.7,scene:'rain'}
  };
  function makeMoodArt(thKey,seedNum){
    const pal=THEME_PALETTE[thKey]||THEME_PALETTE.night;
    const cv=document.createElement('canvas');cv.width=720;cv.height=480;
    const c=cv.getContext('2d');
    /* 夜空渐变 */
    const g=c.createLinearGradient(0,0,0,480);
    g.addColorStop(0,pal.sky[0]);g.addColorStop(.55,pal.sky[1]);g.addColorStop(1,pal.sky[2]);
    c.fillStyle=g;c.fillRect(0,0,720,480);
    /* 随机数生成器（seed 决定构图，同 seed 同图） */
    let s=seedNum>>>0;
    const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
    /* 星点 */
    const n=Math.round(90*pal.stars)+40;
    for(let i=0;i<n;i++){
      const x=rnd()*720,y=rnd()*300,r=rnd()*1.4+.3;
      c.globalAlpha=.25+rnd()*.65;
      c.fillStyle=pal.glow;
      c.beginPath();c.arc(x,y,r,0,6.284);c.fill();
    }
    c.globalAlpha=1;
    /* 主光源（月亮/路灯） */
    const lx=120+rnd()*480,ly=70+rnd()*120;
    const lg=c.createRadialGradient(lx,ly,0,lx,ly,150);
    lg.addColorStop(0,pal.glow);lg.addColorStop(1,'rgba(0,0,0,0)');
    c.globalAlpha=.5;c.fillStyle=lg;
    c.beginPath();c.arc(lx,ly,150,0,6.284);c.fill();
    c.globalAlpha=.9;c.fillStyle=pal.glow;
    c.beginPath();c.arc(lx,ly,14+rnd()*10,0,6.284);c.fill();
    c.globalAlpha=1;
    /* 场景剪影 */
    c.fillStyle='rgba(5,3,14,.92)';
    const horizon=340+rnd()*60;
    if(pal.scene==='desk'){/* 教室：窗 + 课桌 */
      for(let i=0;i<3;i++){const wx=60+i*230+rnd()*30;c.fillRect(wx,horizon-150,140,110);}
      c.fillRect(0,horizon,720,480-horizon);
      for(let i=0;i<4;i++){const dx=40+i*180+rnd()*20;c.fillRect(dx,horizon-24,120,24);}
    }else if(pal.scene==='street'){/* 街灯 */
      c.fillRect(0,horizon,720,480-horizon);
      for(let i=0;i<4;i++){const sx=90+i*180+rnd()*24;c.fillRect(sx,horizon-160,4,160);
        const sg=c.createRadialGradient(sx+2,horizon-160,0,sx+2,horizon-160,60);
        sg.addColorStop(0,'rgba(240,200,140,.5)');sg.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=sg;c.beginPath();c.arc(sx+2,horizon-160,60,0,6.284);c.fill();
        c.fillStyle='rgba(5,3,14,.92)';}
    }else if(pal.scene==='rain'){/* 雨丝 + 城市 */
      for(let i=0;i<8;i++){const bw=40+rnd()*80,bx=rnd()*(720-bw);c.fillRect(bx,horizon-60-rnd()*100,bw,480);}
      c.strokeStyle='rgba(200,210,240,.25)';c.lineWidth=1;
      for(let i=0;i<70;i++){const rx=rnd()*720,ry=rnd()*480;c.beginPath();c.moveTo(rx,ry);c.lineTo(rx-6,ry+16);c.stroke();}
    }else{/* 月夜山影 */
      c.beginPath();c.moveTo(0,horizon+40);
      for(let x=0;x<=720;x+=40)c.lineTo(x,horizon-30-rnd()*80);
      c.lineTo(720,480);c.lineTo(0,480);c.closePath();c.fill();
    }
    return cv.toDataURL('image/jpeg',.85);
  }
  function draw(){
    const used=new Set(usedMoods);
    const line=pickLine(used);
    usedMoods.add(line);used.add(line);
    const el=$('quoteLine');
    el.textContent=line;
    el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
    let no=0;try{no=parseInt(localStorage.getItem('tarot_quote_no')||'0')+1;localStorage.setItem('tarot_quote_no',String(no));}catch(e){}
    $('quoteNo').textContent='— 第 '+no+' 签 · '+themeOf(line).tag+' —';
    const th=themeOf(line);
    const qt=$('quoteTag');
    if(qt){qt.textContent=th.tag;qt.style.color='rgba(240,207,130,.65)';}
    let seed='';let tries=0;
    do{seed=th.seed+Math.floor(Math.random()*1e6);}while(quoteSeedUsed.has(seed)&&tries++<50);
    quoteSeedUsed.add(seed);
    const img=$('quoteImg');
    img.style.opacity='0';
    img.onload=()=>{img.style.opacity='1';};
    img.src=makeMoodArt(QUOTE_THEMES.indexOf(th)>=0?th.seed:'night',Math.floor(Math.random()*1e9));
    aiLine(used);/* 异步补一句进池子，供下次抽 */
  }
  $('btnQuote').onclick=()=>{$('quoteMask').classList.add('open');draw();};
  $('btnQuoteAgain').onclick=draw;
  $('btnCloseQuote').onclick=()=>$('quoteMask').classList.remove('open');
  $('quoteMask').onclick=e=>{if(e.target===$('quoteMask'))$('quoteMask').classList.remove('open')};
})();

