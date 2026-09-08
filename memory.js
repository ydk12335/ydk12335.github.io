/**
 * 月下记忆库 - 纯前端本地存储
 * 使用 localStorage 存储用户信息和占卜历史
 */

const MEMORY_KEY = 'sleepy_space_memory';

// ==================== 同步到记忆库v2 ====================
function mirrorToV2(type, data) {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = 'sleepy_space_memory_v2';
    const v2 = JSON.parse(localStorage.getItem(key) || '{"items":[]}');
    if (!v2.items) v2.items = [];
    let title = '', note = '', vtype = 'story';
    if (type === 'personal' || type === 'birthday') {
      if (!data) return;
      if (type === 'birthday') {
        title = '🎂 生日';
        note = String(data);
        vtype = 'birthday';
        if (v2.items.some(i => i.source === 'birthday' && i.data.note === note)) return;
      } else {
        const parts = [];
        if (data.name) parts.push('名字：' + data.name);
        if (data.gender) parts.push('性别：' + data.gender);
        if (data.birthday) parts.push('生日：' + data.birthday);
        if (data.zodiac) parts.push('星座：' + data.zodiac);
        if (!parts.length) return;
        title = '◈ 个人档案';
        note = parts.join('；');
        vtype = 'traits';
        if (v2.items.some(i => i.source === 'personal' && i.data.note === note)) return;
      }
    } else {
      if (type === 'tarot') {
        var _q=(data.question||'').replace(/\s+/g,' ').slice(0,12);
        title = '☽ 塔罗 · ' + (_q || data.spread || '占卜');
        note = '问题：' + (data.question || '无') + '\n牌面：' + (Array.isArray(data.cards) ? data.cards.join(' / ') : (data.cards || '')) + '\n解读：' + (data.result || '');
      } else if (type === 'horoscope') {
        title = '✦ 观星 · ' + (data.sign || '');
        note = (data.date || '') + '\n' + (data.result || '');
      } else if (type === 'pair') {
        title = '⌘ 配对 · ' + (data.a || '') + ' × ' + (data.b || '');
        note = '契合度：' + (data.score || '?') + '\n' + (data.result || '');
      } else if (type === 'synastry') {
        title = '∞ 合盘 · ' + (data.a || '') + ' × ' + (data.b || '');
        note = (data.rel ? '关系：' + data.rel + '\n' : '') + (data.result || '');
      } else if (type === 'yijing') {
        vtype = 'yijing';
        var _ben = data.benName || '本卦';
        var _bian = data.bianName || '';
        var _chg = (_bian && _bian !== _ben) ? (' → ' + _bian) : '';
        title = '☯ 问卦 · ' + _ben + _chg;
        note = '问题：' + (data.question || '无') + '\n本卦：' + _ben + (data.benDetail ? '（' + data.benDetail + '）' : '');
        if (data.moving && data.moving.length) {
          note += '\n动爻：' + data.moving.join('、') + (data.movingText ? '　' + data.movingText : '');
        }
        if (_chg) {
          note += '\n变卦：' + _bian + (data.bianDetail ? '（' + data.bianDetail + '）' : '');
        }
        note += '\n解读：' + (data.result || '');
      }
      // 去重签名：同类型同标题同日期同时间
      const sig = title + '|' + (data.date || '') + '|' + (data.time || '');
      var sigVal = sig;
      // 若已存在同一条（如先摇卦后补 AI 解读），则原地更新而不是跳过
      var _exist = v2.items.find(i => i.source === type && (i.sig || '') === sig);
      if (_exist) {
        _exist.title = title;
        _exist.data = { title: title, note: note };
        _exist.createdAt = Date.now();
        localStorage.setItem(key, JSON.stringify(v2));
        return;
      }
    }
    v2.items.unshift({
      id: Date.now() + '' + Math.floor(Math.random() * 1000),
      type: vtype,
      title: title,
      data: { title: title, note: note },
      createdAt: Date.now(),
      source: type,
      sig: sigVal || 'auto'
    });
    localStorage.setItem(key, JSON.stringify(v2));
  } catch (e) {
    console.warn('mirrorToV2 失败:', e);
  }
}


// ==================== 数据结构 ====================
// {
//   user: {
//     name: '',
//     birthday: '',
//     zodiac: '',
//     gender: '男/女',
//     createdAt: timestamp
//   },
//   tarot: [{id, question, spread, cards, result, date, time}],
//   horoscope: [{id, sign, date, result}],
//   pair: [{id, a, b, score, result, date}],
//   synastry: [{id, a, b, rel, result, date}]
// }

// ==================== 基础操作 ====================
function getMemory() {
  try {
    const data = localStorage.getItem(MEMORY_KEY);
    return data ? JSON.parse(data) : createEmptyMemory();
  } catch (e) {
    console.error('读取记忆失败:', e);
    return createEmptyMemory();
  }
}

function saveMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
    return true;
  } catch (e) {
    console.error('保存记忆失败:', e);
    return false;
  }
}

function createEmptyMemory() {
  return {
    user: null,
    tarot: [],
    horoscope: [],
    pair: [],
    synastry: [],
    yijing: [],
    updatedAt: Date.now()
  };
}

// ==================== 用户信息管理 ====================
const UserManager = {
  getUser() {
    const m = getMemory();
    return m.user;
  },
  
  saveUser(info) {
    const m = getMemory();
    if (!m.user) {
      m.user = { createdAt: Date.now() };
    }
    Object.assign(m.user, info);
    m.updatedAt = Date.now();
    saveMemory(m);
    if (info.birthday) mirrorToV2('birthday', info.birthday);
    mirrorToV2('personal', m.user);
  },
  
  clearUser() {
    const m = getMemory();
    m.user = null;
    m.updatedAt = Date.now();
    saveMemory(m);
  },
  
  // 根据生日推算星座
  getZodiacByBirthday(birthday) {
    if (!birthday) return '';
    const parts = birthday.match(/(\d{4})[年./\-\/]?(\d{1,2})[月./\-\/]?(\d{1,2})/);
    if (!parts) return '';
    const month = parseInt(parts[2]);
    const day = parseInt(parts[3]);
    
    const zodiacSigns = [
      { name: '摩羯座', end: [1, 19] },
      { name: '水瓶座', end: [2, 18] },
      { name: '双鱼座', end: [3, 20] },
      { name: '白羊座', end: [4, 19] },
      { name: '金牛座', end: [5, 20] },
      { name: '双子座', end: [6, 21] },
      { name: '巨蟹座', end: [7, 22] },
      { name: '狮子座', end: [8, 22] },
      { name: '处女座', end: [9, 23] },
      { name: '天秤座', end: [10, 23] },
      { name: '天蝎座', end: [11, 22] },
      { name: '射手座', end: [12, 21] },
      { name: '摩羯座', end: [12, 31] }
    ];
    
    for (const sign of zodiacSigns) {
      if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
        return sign.name;
      }
    }
    return '';
  },
  
  // 格式化生日显示
  formatBirthday(birthday) {
    if (!birthday) return '';
    const parts = birthday.match(/(\d{4})[年./\-\/]?(\d{1,2})[月./\-\/]?(\d{1,2})/);
    if (!parts) return birthday;
    return `${parts[2]}月${parts[3]}日`;
  }
};

// ==================== 占卜历史管理 ====================
const HistoryManager = {
  // 保存塔罗占卜
  saveTarot(record) {
    const m = getMemory();
    const item = {
      id: Date.now(),
      question: record.question || '',
      spread: record.spread || '',
      cards: record.cards || [],
      result: record.result || '',
      date: record.date || this.getNowStr(),
      time: record.time || this.getNowTime()
    };
    m.tarot.unshift(item);
    // 只保留最近50条
    if (m.tarot.length > 50) m.tarot = m.tarot.slice(0, 50);
    m.updatedAt = Date.now();
    saveMemory(m);
    mirrorToV2('tarot', item);
    return item;
  },
  
  // 保存星座运势
  saveHoroscope(record) {
    const m = getMemory();
    const item = {
      id: Date.now(),
      sign: record.sign || '',
      date: record.date || this.getNowStr(),
      result: record.result || ''
    };
    m.horoscope.unshift(item);
    if (m.horoscope.length > 30) m.horoscope = m.horoscope.slice(0, 30);
    m.updatedAt = Date.now();
    saveMemory(m);
    mirrorToV2('horoscope', item);
    try{const h=JSON.parse(localStorage.getItem('astro_hist_v1')||'[]');h.unshift(item);localStorage.setItem('astro_hist_v1',JSON.stringify(h.slice(0,30)));}catch(e){}
    return item;
  },
  
  // 保存星座配对
  savePair(record) {
    const m = getMemory();
    const item = {
      id: Date.now(),
      a: record.a || '',
      b: record.b || '',
      score: record.score || '',
      result: record.result || '',
      date: record.date || this.getNowStr()
    };
    m.pair.unshift(item);
    if (m.pair.length > 30) m.pair = m.pair.slice(0, 30);
    m.updatedAt = Date.now();
    saveMemory(m);
    mirrorToV2('pair', item);
    try{const h=JSON.parse(localStorage.getItem('pair_hist_v1')||'[]');h.unshift(item);localStorage.setItem('pair_hist_v1',JSON.stringify(h.slice(0,30)));}catch(e){}
    return item;
  },
  
  // 保存星座合盘
  saveSynastry(record) {
    const m = getMemory();
    const item = {
      id: Date.now(),
      a: record.a || '',
      b: record.b || '',
      rel: record.rel || '',
      result: record.result || '',
      date: record.date || this.getNowStr()
    };
    m.synastry.unshift(item);
    if (m.synastry.length > 30) m.synastry = m.synastry.slice(0, 30);
    m.updatedAt = Date.now();
    saveMemory(m);
    mirrorToV2('synastry', item);
    try{const h=JSON.parse(localStorage.getItem('syn_hist_v1')||'[]');h.unshift(item);localStorage.setItem('syn_hist_v1',JSON.stringify(h.slice(0,30)));}catch(e){}
    return item;
  },
  
  // 保存问卦（易经六爻）
  saveYijing(record) {
    const m = getMemory();
    if (!m.yijing) m.yijing = [];
    const item = {
      id: record.id || Date.now(),
      question: record.question || '',
      ben: record.ben || '',
      benName: record.benName || '',
      benDetail: record.benDetail || '',
      bian: record.bian || '',
      bianName: record.bianName || '',
      bianDetail: record.bianDetail || '',
      moving: record.moving || [],
      movingText: record.movingText || '',
      lines: record.lines || [],
      result: record.result || '',
      date: record.date || this.getNowStr(),
      time: record.time || this.getNowTime()
    };
    const idx = m.yijing.findIndex(r => r.id === item.id);
    if (idx >= 0) m.yijing[idx] = item; else m.yijing.unshift(item);
    if (m.yijing.length > 50) m.yijing = m.yijing.slice(0, 50);
    m.updatedAt = Date.now();
    saveMemory(m);
    mirrorToV2('yijing', item);
    try{
      const h=JSON.parse(localStorage.getItem('yijing_hist_v1')||'[]');
      const hi=h.findIndex(r=>r.id===item.id);
      if(hi>=0)h[hi]=item;else h.unshift(item);
      localStorage.setItem('yijing_hist_v1',JSON.stringify(h.slice(0,50)));
    }catch(e){}
    return item;
  },
  
  // 删除单条记录
  deleteRecord(type, id) {
    const m = getMemory();
    if (m[type]) {
      m[type] = m[type].filter(r => r.id !== id);
      m.updatedAt = Date.now();
      saveMemory(m);
    }
  },
  
  // 清空所有历史
  clearHistory(type) {
    const m = getMemory();
    if (type) {
      m[type] = [];
    } else {
      m.tarot = [];
      m.horoscope = [];
      m.pair = [];
      m.synastry = [];
      m.yijing = [];
    }
    m.updatedAt = Date.now();
    saveMemory(m);
  },
  
  // 获取统计信息
  getStats() {
    const m = getMemory();
    return {
      tarot: m.tarot.length,
      horoscope: m.horoscope.length,
      pair: m.pair.length,
      synastry: m.synastry.length,
      yijing: (m.yijing || []).length,
      total: m.tarot.length + m.horoscope.length + m.pair.length + m.synastry.length + (m.yijing || []).length
    };
  },
  
  getNowStr() {
    const d = new Date();
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  },
  
  getNowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
};

// ==================== 记忆上下文（供AI提示词使用） ====================
const MemoryContext = {
  // 生成用户信息提示词片段
  getUserContext() {
    const user = UserManager.getUser();
    if (!user) return '';
    
    let ctx = '\n【用户信息】';
    if (user.name) ctx += `\n• 用户称呼：${user.name}`;
    if (user.gender) ctx += `\n• 性别：${user.gender}`;
    if (user.zodiac) ctx += `\n• 星座：${user.zodiac}`;
    if (user.birthday) ctx += `\n• 生日：${UserManager.formatBirthday(user.birthday)}`;
    return ctx;
  },
  
  // 生成历史摘要（供AI参考）
  getRecentHistory(limit = 3) {
    const m = getMemory();
    const parts = [];
    
    if (m.tarot.length > 0) {
      parts.push('【最近占卜】');
      m.tarot.slice(0, limit).forEach(r => {
        parts.push(`• ${r.date} ${r.time}：${r.question || '(无问题)'} -> ${r.spread || '(未知牌阵)'}`);
      });
    }
    
    if (m.horoscope.length > 0) {
      parts.push('【最近观星】');
      m.horoscope.slice(0, limit).forEach(r => {
        parts.push(`• ${r.date} ${r.sign}`);
      });
    }
    
    if (m.pair.length > 0) {
      parts.push('【最近配对】');
      m.pair.slice(0, limit).forEach(r => {
        parts.push(`• ${r.date} ${r.a} ✕ ${r.b} ${r.score || ''}`);
      });
    }
    
    return parts.join('\n');
  },
  
  // 生成完整的历史提示词
  getHistoryContext(maxItems = 5) {
    const m = getMemory();
    const lines = [];
    
    if (m.tarot.length > 0) {
      lines.push('【过往占卜记录】');
      m.tarot.slice(0, maxItems).forEach(r => {
        lines.push(`日期: ${r.date} ${r.time}`);
        lines.push(`问题: ${r.question || '(未提供)'}`);
        lines.push(`牌阵: ${r.spread || '(未知)'}`);
        lines.push(`结果: ${r.result ? r.result.slice(0, 100) + '...' : '(无记录)'}`);
        lines.push('---');
      });
    }
    
    return lines.join('\n');
  }
};

// ==================== 导出（浏览器环境自动挂载到 window） ====================
if (typeof window !== 'undefined') {
  window.getMemory = getMemory;
  window.saveMemory = saveMemory;
  window.mirrorToV2 = mirrorToV2;
  window.UserManager = UserManager;
  window.HistoryManager = HistoryManager;
  window.MemoryContext = MemoryContext;
}
