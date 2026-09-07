/**
 * 月下记忆库 - 纯前端本地存储
 * 使用 localStorage 存储用户信息和占卜历史
 */

const MEMORY_KEY = 'sleepy_space_memory';

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
      total: m.tarot.length + m.horoscope.length + m.pair.length + m.synastry.length
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
        parts.push(`• ${r.date} ${r.time}：${r.question || '(无问题)} -> ${r.spread || '(未知牌阵)'}`);
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
  window.UserManager = UserManager;
  window.HistoryManager = HistoryManager;
  window.MemoryContext = MemoryContext;
}
