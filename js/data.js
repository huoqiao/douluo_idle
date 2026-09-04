/* ============================================================
 *  斗罗大陆 · 自动修炼  —— 静态数据层
 *  境界 / 魂环 / 武魂 / 猎魂区域 / 魂骨 / 称号 / 词条
 * ============================================================ */

/* ---------- 一、魂力等级与境界 ---------- */
/* 每 10 级一个大境界，突破需要吸收一枚魂环 */
const REALMS = [
  { min: 1,   max: 9,   name: '魂士',     needRing: 0, color: '#b8c0cc' },
  { min: 10,  max: 19,  name: '魂师',     needRing: 1, color: '#7ee0c0' },
  { min: 20,  max: 29,  name: '大魂师',   needRing: 2, color: '#6fd3ff' },
  { min: 30,  max: 39,  name: '魂尊',     needRing: 3, color: '#8fa6ff' },
  { min: 40,  max: 49,  name: '魂宗',     needRing: 4, color: '#b98cff' },
  { min: 50,  max: 59,  name: '魂王',     needRing: 5, color: '#d97bff' },
  { min: 60,  max: 69,  name: '魂帝',     needRing: 6, color: '#ff7bd0' },
  { min: 70,  max: 79,  name: '魂圣',     needRing: 7, color: '#ff8a6b' },
  { min: 80,  max: 89,  name: '魂斗罗',   needRing: 8, color: '#ffb648' },
  { min: 90,  max: 99,  name: '封号斗罗', needRing: 9, color: '#ffe066' },
  { min: 100, max: 100, name: '神祇',     needRing: 9, color: '#ff5f6d' }
];

function realmOf(level) {
  for (let i = REALMS.length - 1; i >= 0; i--) {
    if (level >= REALMS[i].min) return REALMS[i];
  }
  return REALMS[0];
}
function realmIndex(level) {
  for (let i = REALMS.length - 1; i >= 0; i--) {
    if (level >= REALMS[i].min) return i;
  }
  return 0;
}
/* 该等级是否已到"需要魂环才能继续突破"的临界点 */
function isBreakPoint(level) {
  return level % 10 === 9 && level < 100;
}

/* ---------- 二、魂环年份档位 ---------- */
const RING_TIERS = [
  { id: 0, name: '十年',   min: 10,      max: 99,       color: '#e8e8ef', glow: 'rgba(232,232,239,.55)',  mul: 0.06 },
  { id: 1, name: '百年',   min: 100,     max: 999,      color: '#ffd24d', glow: 'rgba(255,210,77,.6)',   mul: 0.13 },
  { id: 2, name: '千年',   min: 1000,    max: 9999,     color: '#c07bff', glow: 'rgba(192,123,255,.65)', mul: 0.24 },
  { id: 3, name: '万年',   min: 10000,   max: 99999,    color: '#5a5f72', glow: 'rgba(120,128,160,.75)', mul: 0.42 },
  { id: 4, name: '十万年', min: 100000,  max: 999999,   color: '#ff4d4d', glow: 'rgba(255,77,77,.8)',    mul: 0.72 },
  { id: 5, name: '百万年', min: 1000000, max: 9999999,  color: '#ffd700', glow: 'rgba(255,215,0,.9)',    mul: 1.15 },
  { id: 6, name: '神级',   min: 10000000,max: Infinity, color: '#ff7ae0', glow: 'rgba(255,122,224,.95)', mul: 1.8 }
];
function tierOfYear(year) {
  for (let i = RING_TIERS.length - 1; i >= 0; i--) {
    if (year >= RING_TIERS[i].min) return RING_TIERS[i];
  }
  return RING_TIERS[0];
}
/* 槽位推荐年份档位（原著最佳魂环配比，契合有额外加成） */
const SLOT_BEST_TIER = [1, 1, 2, 2, 3, 3, 3, 4, 5];
/* 魂环槽位开放等级：第 N 环在晋入对应境界前一阶即可吸收
   1环=魂师(10) 2环=大魂师(20) … 9环=封号斗罗(90)，契合原著“每晋一境得一环” */
const RING_OPEN_LEVEL = [10, 20, 30, 40, 50, 60, 70, 80, 90];
/* 当前等级是否可吸收第 i 环（开放等级前一阶，便于在突破点吸环） */
function ringUnlocked(i, level) { return level >= RING_OPEN_LEVEL[i] - 1; }

/* 魂环随机词条池 */
const RING_AFFIXES = [
  { key: 'crit',    name: '暴击率',   min: 0.01, max: 0.05, fmt: 'pct' },
  { key: 'critDmg', name: '暴击伤害', min: 0.10, max: 0.60, fmt: 'pct' },
  { key: 'spd',     name: '速度',     min: 0.02, max: 0.12, fmt: 'pct' },
  { key: 'lifesteal', name: '吸血',   min: 0.01, max: 0.06, fmt: 'pct' },
  { key: 'expRate', name: '修炼速度', min: 0.03, max: 0.20, fmt: 'pct' },
  { key: 'coinRate',name: '魂币掉落', min: 0.05, max: 0.35, fmt: 'pct' },
  { key: 'penetrate', name: '破防',   min: 0.02, max: 0.15, fmt: 'pct' }
];

/* ---------- 三、武魂库 ---------- */
/* rarity: 1凡品 2地品 3天品 4神品；growth 为四维成长系数 */
const WUHUN_LIST = [
  {
    id: 'lanyin', color: '#3ddc84', name: '蓝银草', type: '控制系', rarity: 1,
    desc: '废武魂？不，是未曾觉醒的蓝银皇。',
    growth: { hp: 1.05, atk: 0.92, def: 1.05, spd: 1.00 },
    skills: ['缠绕', '寄生', '蛛网束缚', '蓝银囚笼', '蓝银霸皇枪', '蓝银真身', '蓝银领域', '蓝银灭杀', '海神之光']
  },
  {
    id: 'haotian', color: '#e0b24a', name: '昊天锤', type: '强攻系', rarity: 3,
    desc: '天下第一器武魂，一锤破万法。',
    growth: { hp: 1.10, atk: 1.38, def: 0.92, spd: 0.80 },
    skills: ['锤震四方', '乱披风', '千钧壁垒', '碎地重击', '昊天护体', '昊天真身', '大须弥锤', '炸环', '修罗神威']
  },
  {
    id: 'baihu', color: '#e9e6dd', name: '白虎', type: '强攻系', rarity: 3,
    desc: '白虎公爵府传承，攻守兼备的顶级兽武魂。',
    growth: { hp: 1.22, atk: 1.22, def: 1.15, spd: 0.90 },
    skills: ['白虎护身障', '白虎烈光波', '白虎金刚变', '白虎流星雨', '白虎魔神变', '白虎真身', '白虎破灭杀', '白虎神魔变', '白虎啸天']
  },
  {
    id: 'qibao', color: '#5fe0c0', name: '七宝琉璃塔', type: '辅助系', rarity: 3,
    desc: '七宝有名，一曰力，二曰速，三曰御……',
    growth: { hp: 1.00, atk: 0.98, def: 1.10, spd: 1.05 },
    skills: ['七宝之力', '七宝之速', '七宝之御', '七宝之魂', '七宝之攻', '七宝真身', '七宝之愈', '七宝神光', '琉璃无量']
  },
  {
    id: 'huofeng', color: '#ff8a3d', name: '火凤凰', type: '敏攻系', rarity: 2,
    desc: '浴火而生，极致之火。',
    growth: { hp: 0.95, atk: 1.28, def: 0.85, spd: 1.18 },
    skills: ['火线追击', '凤翼天翔', '烈焰焚天', '凤凰涅槃', '火凤穿云', '凤凰真身', '九天焚雷', '不死火域', '凤凰神灭']
  },
  {
    id: 'youming', color: '#b07bff', name: '幽冥灵猫', type: '敏攻系', rarity: 2,
    desc: '夜色中的一抹幽影，速度极致。',
    growth: { hp: 0.92, atk: 1.20, def: 0.88, spd: 1.30 },
    skills: ['幽冥突刺', '幽冥斩', '幽影分身', '灵猫真身', '幽冥百爪', '影杀', '幽冥领域', '猫神九命', '神影无踪']
  },
  {
    id: 'jiuxin', color: '#ff8fb0', name: '九心海棠', type: '治疗系', rarity: 2,
    desc: '生生不息，海棠不凋。',
    growth: { hp: 1.30, atk: 0.85, def: 1.20, spd: 0.95 },
    skills: ['海棠之愈', '回春术', '生命之泉', '海棠护盾', '不凋之息', '海棠真身', '万物生', '生死轮回', '海棠神恩']
  },
  {
    id: 'xuanwu', color: '#2fb6c8', name: '玄武龟', type: '防御系', rarity: 2,
    desc: '不动如山，一盾镇海。',
    growth: { hp: 1.45, atk: 0.78, def: 1.50, spd: 0.70 },
    skills: ['玄武盾', '龟甲术', '反震', '玄水壁', '玄武真身', '山海镇', '不动明王', '玄武神甲', '天地同寿']
  },
  {
    id: 'leiting', color: '#5ab8ff', name: '雷霆狼', type: '强攻系', rarity: 2,
    desc: '雷鸣一起，万兽俯首。',
    growth: { hp: 1.02, atk: 1.25, def: 0.95, spd: 1.10 },
    skills: ['雷刃', '雷霆万钧', '雷狼啸月', '紫电狂龙', '雷神之怒', '雷狼真身', '九霄雷动', '天雷灭世', '雷神降临']
  },
  {
    id: 'bingdi', color: '#7fe6ff', name: '冰碧帝皇蝎', type: '极致之冰', rarity: 4,
    desc: '极北之地的帝王，极致之冰的化身。',
    growth: { hp: 1.18, atk: 1.35, def: 1.18, spd: 1.12 },
    skills: ['冰帝之爪', '永冻之域', '冰皇护体', '极寒风暴', '冰爆术', '冰帝真身', '雪舞极冰', '绝对零度', '冰雪神位']
  }
,
  { id: 'landian', name: '蓝电霸王龙', type: '强攻系', rarity: 4, color: '#5ab8ff',
    desc: '龙神斗罗家族传承，兽武魂中的顶尖存在。',
    growth: { hp: 1.15, atk: 1.42, def: 0.95, spd: 0.92 },
    skills: ['蓝电龙爪','雷霆万钧','龙鳞护体','电光幻影','蓝电霸王','龙威','雷霆审判','蓝电神龙','雷神降临'] },
  { id: 'roushu', name: '柔骨兔', type: '敏攻系', rarity: 2, color: '#ffb3c8',
    desc: '十万年魂兽化形，柔若无骨，近身无敌。',
    growth: { hp: 0.95, atk: 1.18, def: 0.88, spd: 1.28 },
    skills: ['腰弓','魅惑','瞬移','八段摔','无敌金身','柔骨锁','兔神附体','瞬移连击','柔骨神力'] },
  { id: 'xiangchang', name: '香肠', type: '食物系', rarity: 2, color: '#d9a066',
    desc: '大陆唯一食物系器武魂，食之增益无穷。',
    growth: { hp: 1.05, atk: 0.95, def: 1.05, spd: 1.05 },
    skills: ['恢复大香肠','增幅小香肠','解毒小腊肠','飞行蘑菇肠','糖豆魂力导弹','坚固冰棍','神明呼吸巧克力','十全大补丸','食神降临'] },
  { id: 'poqiang', name: '破魂枪', type: '强攻系', rarity: 3, color: '#c0c8d8',
    desc: '一枪破万法，单兵攻坚的巅峰器武魂。',
    growth: { hp: 1.08, atk: 1.35, def: 0.98, spd: 0.95 },
    skills: ['破魂刺','枪震山河','千击百裂','破碎虚空','枪芒护体','破魂枪意','贯穿九霄','枪神领域','破天一枪'] },
  { id: 'shenglong', name: '光明圣龙', type: '强攻系', rarity: 4, color: '#ffe27a',
    desc: '光明与龙族的交融，圣洁而霸烈。',
    growth: { hp: 1.2, atk: 1.4, def: 1.1, spd: 0.95 },
    skills: ['圣龙爪','龙息净化','圣光护盾','光耀九天','圣龙真身','神圣审判','光明领域','龙神威压','光明神降'] },
  { id: 'anhu', name: '暗魔邪神虎', type: '强攻系', rarity: 4, color: '#b07bff',
    desc: '魔与虎的邪异融合，吞噬天地的凶兽。',
    growth: { hp: 1.18, atk: 1.36, def: 1.05, spd: 1.1 },
    skills: ['暗魔爪','邪神附体','吞噬天地','暗影突袭','邪神斩','恶魔之翼','暗黑领域','邪神审判','暗魔神临'] },
  { id: 'bilin', name: '碧磷蛇', type: '控制系', rarity: 3, color: '#7ee0a0',
    desc: '碧磷蛇皇一脉，毒与控制兼备。',
    growth: { hp: 1.05, atk: 1.1, def: 1.05, spd: 1.08 },
    skills: ['碧磷缠绕','剧毒喷射','蛇影迷踪','万蛇噬','碧磷护体','腐蚀领域','石化凝视','万毒归宗','碧磷蛇皇'] },
  { id: 'huolong', name: '火龙', type: '强攻系', rarity: 3, color: '#ff6a2c',
    desc: '极致之火化龙，焚尽八荒。',
    growth: { hp: 1.12, atk: 1.34, def: 1.0, spd: 0.98 },
    skills: ['龙焰吐息','烈焰爪','焚天翼','火龙护体','炎爆','龙威','九炎焚天','烈焰神域','火龙神临'] },
  { id: 'bingfeng', name: '冰凤凰', type: '敏攻系', rarity: 4, color: '#7fe6ff',
    desc: '极致之冰的凤族，羽落成霜。',
    growth: { hp: 0.98, atk: 1.32, def: 0.9, spd: 1.22 },
    skills: ['冰羽斩','凤翼冰翔','极寒吐息','冰凤涅槃','冰爆','冰凤真身','永冻领域','冰雪审判','冰凤神灭'] },
  { id: 'niumang', name: '天青牛蟒', type: '兽武魂', rarity: 3, color: '#4fb0a0',
    desc: '星斗核心的泰坦之水蟒，力镇山河。',
    growth: { hp: 1.3, atk: 1.12, def: 1.25, spd: 0.85 },
    skills: ['牛蟒摆尾','碧水镇','蟒身缠绕','天青护体','牛蟒真身','重力压制','碧波万顷','天青领域','牛蟒神躯'] }
];
const HERO_PORTRAIT = `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="hp_bg" cx="50%" cy="40%" r="72%"><stop offset="0%" stop-color="#241d33"/><stop offset="100%" stop-color="#0c0a16"/></radialGradient>
<linearGradient id="hp_skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f6d8b8"/><stop offset="100%" stop-color="#d99e78"/></linearGradient>
<linearGradient id="hp_hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a3550"/><stop offset="100%" stop-color="#15121f"/></linearGradient>
<filter id="hp_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#hp_bg)" stroke="currentColor" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".35"/>
<circle cx="60" cy="50" r="34" fill="currentColor" opacity=".14" filter="url(#hp_g)"/>
<path d="M16 114 C18 88 36 76 60 76 C84 76 102 88 104 114 Z" fill="#241d33" stroke="currentColor" stroke-width="2"/>
<path d="M60 76 L60 114" stroke="currentColor" stroke-width="1.5" opacity=".5"/>
<path d="M40 80 C46 92 46 104 42 114" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".5"/>
<path d="M80 80 C74 92 74 104 78 114" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".5"/>
<rect x="52" y="64" width="16" height="14" rx="4" fill="url(#hp_skin)"/>
<path d="M52 70 C56 76 64 76 68 70" fill="#c98f6a" opacity=".5"/>
<path d="M43 46 C43 30 77 30 77 46 C77 64 68 74 60 74 C52 74 43 64 43 46 Z" fill="url(#hp_skin)" stroke="#c98f6a" stroke-width="1"/>
<ellipse cx="43" cy="50" rx="3" ry="5" fill="url(#hp_skin)"/><ellipse cx="77" cy="50" rx="3" ry="5" fill="url(#hp_skin)"/>
<path d="M41 48 C38 24 82 24 79 48 C84 38 80 20 60 18 C40 20 36 38 41 48 Z" fill="url(#hp_hair)"/>
<path d="M44 44 C46 36 54 34 58 38 C56 34 62 33 66 38 C70 34 74 40 74 46 C70 42 66 44 62 42 C58 40 54 42 50 44 C48 42 46 44 44 44 Z" fill="url(#hp_hair)"/>
<path d="M50 28 C56 24 64 24 70 28" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".75" stroke-linecap="round"/>
<path d="M46 34 C48 30 52 28 55 30" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/>
<path d="M44 48 C40 56 41 66 45 72 C41 64 42 54 46 48 Z" fill="url(#hp_hair)"/>
<path d="M76 48 C80 56 79 66 75 72 C79 64 78 54 74 48 Z" fill="url(#hp_hair)"/>
<path d="M47 46 L56 44" stroke="#2e2238" stroke-width="2" stroke-linecap="round"/><path d="M64 44 L73 46" stroke="#2e2238" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="52" cy="51" rx="4.4" ry="3.2" fill="#fdfdff"/><circle cx="52.5" cy="51" r="2.6" fill="currentColor"/><circle cx="53" cy="50" r="1" fill="#fff"/>
<ellipse cx="68" cy="51" rx="4.4" ry="3.2" fill="#fdfdff"/><circle cx="67.5" cy="51" r="2.6" fill="currentColor"/><circle cx="68" cy="50" r="1" fill="#fff"/>
<path d="M60 53 L57.5 59 L62 59" fill="none" stroke="#c98f6a" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M55 63 Q60 67 65 63" fill="none" stroke="#b8654f" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;
const WUHUN_ART = {
  lanyin: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="ly_bg" cx="50%" cy="42%" r="70%"><stop offset="0%" stop-color="#1c4a36"/><stop offset="100%" stop-color="#071512"/></radialGradient>
<linearGradient id="ly_b" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#1f7a4a"/><stop offset="55%" stop-color="#36c873"/><stop offset="100%" stop-color="#7af0c0"/></linearGradient>
<filter id="ly_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#ly_bg)" stroke="#3ddc84" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#3ddc8466" stroke-width="1.3"/>
<g fill="none" stroke="url(#ly_b)" stroke-width="4.6" stroke-linecap="round" filter="url(#ly_g)">
<path d="M60 101 C58 75 56 52 60 25"/><path d="M60 101 C50 79 44 60 40 39"/>
<path d="M60 101 C70 79 76 60 80 39"/><path d="M60 101 C46 83 34 69 25 51"/><path d="M60 101 C74 83 86 69 95 51"/></g>
<g stroke="#9ff0c8" stroke-width="1.4" fill="none" opacity=".55" stroke-linecap="round">
<path d="M58 70 C56 58 56 46 59 34"/><path d="M50 70 C46 60 43 52 41 44"/><path d="M70 70 C74 60 77 52 79 44"/></g>
<g fill="#cffaff" filter="url(#ly_g)"><circle cx="60" cy="24" r="4.6"/><circle cx="40" cy="38" r="4"/><circle cx="80" cy="38" r="4"/><circle cx="25" cy="50" r="3.6"/><circle cx="95" cy="50" r="3.6"/></g>
<circle cx="60" cy="101" r="6" fill="#3ddc84"/>
<circle cx="50" cy="66" r="1.7" fill="#eafff1" opacity=".8"/><circle cx="72" cy="72" r="1.5" fill="#eafff1" opacity=".8"/></svg>`,
  haotian: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="ht_bg" cx="50%" cy="38%" r="72%"><stop offset="0%" stop-color="#3a2c12"/><stop offset="100%" stop-color="#120c05"/></radialGradient>
<linearGradient id="ht_h" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbe7ad"/><stop offset="45%" stop-color="#d9ad4e"/><stop offset="100%" stop-color="#8a5e22"/></linearGradient>
<linearGradient id="ht_w" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b07c3f"/><stop offset="100%" stop-color="#5e3c18"/></linearGradient>
<filter id="ht_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#ht_bg)" stroke="#e0b24a" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#e0b24a55" stroke-width="1.3"/>
<rect x="53.5" y="40" width="13" height="58" rx="6.5" fill="url(#ht_w)" stroke="#c8a25a" stroke-width="2.2"/>
<g stroke="#7a521f" stroke-width="1" opacity=".5"><line x1="57" y1="46" x2="57" y2="94"/><line x1="63" y1="46" x2="63" y2="94"/></g>
<circle cx="60" cy="99" r="6.5" fill="url(#ht_h)" stroke="#f3d988" stroke-width="2.2"/>
<rect x="33" y="25" width="54" height="31" rx="8" fill="url(#ht_h)" stroke="#f3d988" stroke-width="2.6" filter="url(#ht_g)"/>
<ellipse cx="48" cy="32" rx="11" ry="5" fill="#fff6d8" opacity=".7"/>
<g fill="#7a521f"><circle cx="40" cy="33" r="1.7"/><circle cx="80" cy="33" r="1.7"/><circle cx="40" cy="48" r="1.7"/><circle cx="80" cy="48" r="1.7"/></g>
<g stroke="#ffe9a8" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M30 64 L24 70"/><path d="M90 64 L96 70"/><path d="M30 76 L26 82"/></g></svg>`,
  baihu: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bh_bg" cx="50%" cy="40%" r="72%"><stop offset="0%" stop-color="#2a2636"/><stop offset="100%" stop-color="#0f0d15"/></radialGradient>
<linearGradient id="bh_f" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d9d3c6"/></linearGradient>
<radialGradient id="bh_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#7fe0ff"/><stop offset="100%" stop-color="#1f6fae"/></radialGradient>
<filter id="bh_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#bh_bg)" stroke="#e9e6dd" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#caa14a55" stroke-width="1.3"/>
<path d="M37 46 C33 24 51 30 55 41 Z" fill="url(#bh_f)" stroke="#caa14a" stroke-width="1.5"/>
<path d="M83 46 C87 24 69 30 65 41 Z" fill="url(#bh_f)" stroke="#caa14a" stroke-width="1.5"/>
<path d="M40 42 C37 30 49 33 52 40 Z" fill="#f4b8c8"/><path d="M80 42 C83 30 71 33 68 40 Z" fill="#f4b8c8"/>
<path d="M60 30 C37 30 29 50 32 69 C35 87 47 96 60 96 C73 96 85 87 88 69 C91 50 83 30 60 30 Z" fill="url(#bh_f)" stroke="#d4cdbd" stroke-width="1.6"/>
<g stroke="#23232b" stroke-width="3.6" fill="none" stroke-linecap="round">
<path d="M44 40 C48 49 48 53 45 60"/><path d="M36 55 C42 61 42 65 38 71"/><path d="M76 40 C72 49 72 53 75 60"/><path d="M84 55 C78 61 78 65 82 71"/>
<path d="M60 37 L60 50"/><path d="M52 44 L56 53"/><path d="M68 44 L64 53"/></g>
<g><ellipse cx="50" cy="62" rx="6" ry="5.4" fill="url(#bh_e)" stroke="#1a1a22" stroke-width="1.2"/><ellipse cx="70" cy="62" rx="6" ry="5.4" fill="url(#bh_e)" stroke="#1a1a22" stroke-width="1.2"/>
<circle cx="50" cy="62.5" r="2.5" fill="#0c0c12"/><circle cx="70" cy="62.5" r="2.5" fill="#0c0c12"/><circle cx="51.4" cy="60.6" r="1.5" fill="#fff"/><circle cx="71.4" cy="60.6" r="1.5" fill="#fff"/></g>
<path d="M55 74 L65 74 L60 81 Z" fill="#d98aa0" stroke="#b06a80" stroke-width="1"/>
<path d="M60 81 L60 86" stroke="#caa14a" stroke-width="2"/><path d="M60 86 C56 90 52 89 50 86 M60 86 C64 90 68 89 70 86" stroke="#caa14a" stroke-width="1.6" fill="none"/>
<g stroke="#e8e4da" stroke-width="1" opacity=".65"><path d="M52 78 L33 74"/><path d="M52 82 L33 85"/><path d="M68 78 L87 74"/><path d="M68 82 L87 85"/></g></svg>`,
  qibao: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="qp_bg" cx="50%" cy="40%" r="72%"><stop offset="0%" stop-color="#10302c"/><stop offset="100%" stop-color="#051412"/></radialGradient>
<linearGradient id="qp_j" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e2f7f0"/><stop offset="100%" stop-color="#7fd6c6"/></linearGradient>
<filter id="qp_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#qp_bg)" stroke="#5fe0c0" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#5fe0c055" stroke-width="1.3"/>
<line x1="60" y1="22" x2="60" y2="42" stroke="#5fe0c0" stroke-width="2.6"/>
<circle cx="60" cy="20" r="4.8" fill="#ffd76a" filter="url(#qp_g)"/>
<g fill="url(#qp_j)" stroke="#5fe0c0" stroke-width="1.7">
<path d="M43 84 L77 84 L72 95 L48 95 Z"/><path d="M46 71 L74 71 L69 83 L51 83 Z"/>
<path d="M49 58 L71 58 L66 70 L54 70 Z"/><path d="M52 47 L68 47 L63 57 L57 57 Z"/></g>
<g fill="#bfe9df" stroke="#5fe0c0" stroke-width="1.4">
<path d="M39 84 Q60 78 81 84 Q72 89 60 89 Q48 89 39 84 Z"/><path d="M42 71 Q60 66 78 71 Q70 75 60 75 Q50 75 42 71 Z"/>
<path d="M45 58 Q60 54 75 58 Q68 61 60 61 Q52 61 45 58 Z"/><path d="M48 47 Q60 44 72 47 Q66 50 60 50 Q54 50 48 47 Z"/></g>
<g stroke="#2f9e8c" stroke-width="1.3" opacity=".8"><line x1="54" y1="83" x2="54" y2="94"/><line x1="66" y1="83" x2="66" y2="94"/><line x1="56" y1="70" x2="56" y2="82"/><line x1="64" y1="70" x2="64" y2="82"/><line x1="58" y1="57" x2="58" y2="69"/><line x1="62" y1="57" x2="62" y2="69"/></g>
<g fill="#e9fffa"><circle cx="60" cy="89" r="1.5"/><circle cx="60" cy="76" r="1.4"/><circle cx="60" cy="63" r="1.3"/></g></svg>`,
  huofeng: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="hf_bg" cx="50%" cy="46%" r="72%"><stop offset="0%" stop-color="#3a160c"/><stop offset="100%" stop-color="#140704"/></radialGradient>
<linearGradient id="hf_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd07a"/><stop offset="55%" stop-color="#ff8a3d"/><stop offset="100%" stop-color="#e8491f"/></linearGradient>
<linearGradient id="hf_w" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffb866"/><stop offset="100%" stop-color="#e8491f"/></linearGradient>
<linearGradient id="hf_t" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffe6a0"/><stop offset="100%" stop-color="#ff7a2c"/></linearGradient>
<filter id="hf_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#hf_bg)" stroke="#ff8a3d" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#ff8a3d55" stroke-width="1.3"/>
<g fill="none" stroke="url(#hf_t)" stroke-width="4.2" stroke-linecap="round" filter="url(#hf_g)"><path d="M60 84 C52 100 48 110 56 117"/><path d="M60 84 C60 102 60 112 60 119"/><path d="M60 84 C68 100 72 110 64 117"/></g>
<path d="M56 52 C35 42 21 54 17 73 C36 62 50 62 60 67 Z" fill="url(#hf_w)" stroke="#ffae5a" stroke-width="1.5"/>
<path d="M64 52 C85 42 99 54 103 73 C84 62 70 62 60 67 Z" fill="url(#hf_w)" stroke="#ffae5a" stroke-width="1.5"/>
<g stroke="#ffd089" stroke-width="1" fill="none" opacity=".7"><path d="M29 61 C40 58 50 61 58 65"/><path d="M91 61 C80 58 70 61 62 65"/></g>
<path d="M60 35 C50 50 53 71 60 87 C67 71 70 50 60 35 Z" fill="url(#hf_b)" stroke="#ffb866" stroke-width="1.6"/>
<ellipse cx="60" cy="59" rx="5" ry="11" fill="#ffe3a8" opacity=".55"/>
<circle cx="60" cy="33" r="6.5" fill="url(#hf_b)" stroke="#ffb866" stroke-width="1.4"/>
<path d="M60 27 C57 19 63 17 60 11 C65 18 67 23 62 28 Z" fill="#ffd76a"/>
<path d="M60 33 L67 36 L60 39 Z" fill="#ffcf6a"/>
<circle cx="58" cy="32" r="1.7" fill="#2a1206"/></svg>`,
  youming: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="ym_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#241c3e"/><stop offset="100%" stop-color="#0b0a15"/></radialGradient>
<linearGradient id="ym_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a3360"/><stop offset="100%" stop-color="#171327"/></linearGradient>
<radialGradient id="ym_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#e6c4ff"/><stop offset="100%" stop-color="#a865ff"/></radialGradient>
<filter id="ym_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#ym_bg)" stroke="#b07bff" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#b07bff55" stroke-width="1.3"/>
<g fill="none" stroke="#b07bff" opacity=".35" stroke-width="2" filter="url(#ym_g)"><path d="M29 40 C19 50 21 65 30 73"/><path d="M91 40 C101 50 99 65 90 73"/></g>
<path d="M44 96 C40 71 48 55 60 55 C72 55 80 71 76 96 Z" fill="url(#ym_b)" stroke="#7a5cc0" stroke-width="1.6"/>
<path d="M54 93 C53 77 56 67 60 65 C64 67 67 77 66 93 Z" fill="#473e6e" opacity=".55"/>
<path d="M75 92 C95 88 97 67 84 59 C90 70 86 81 73 83" fill="none" stroke="url(#ym_b)" stroke-width="4.2" stroke-linecap="round"/>
<circle cx="60" cy="45" r="18.5" fill="url(#ym_b)" stroke="#7a5cc0" stroke-width="1.6"/>
<path d="M44 40 L40 21 L58 33 Z" fill="url(#ym_b)" stroke="#7a5cc0" stroke-width="1.4"/><path d="M76 40 L80 21 L62 33 Z" fill="url(#ym_b)" stroke="#7a5cc0" stroke-width="1.4"/>
<path d="M46 36 L44 27 L53 34 Z" fill="#b07bff" opacity=".5"/><path d="M74 36 L76 27 L67 34 Z" fill="#b07bff" opacity=".5"/>
<ellipse cx="53" cy="47" rx="4" ry="6" fill="url(#ym_e)" filter="url(#ym_g)"/><ellipse cx="67" cy="47" rx="4" ry="6" fill="url(#ym_e)" filter="url(#ym_g)"/>
<ellipse cx="53" cy="47" rx="1.6" ry="4" fill="#160c28"/><ellipse cx="67" cy="47" rx="1.6" ry="4" fill="#160c28"/>
<path d="M58 54 L62 54 L60 58 Z" fill="#d8a0e0"/>
<g stroke="#cbb6f0" stroke-width=".9" opacity=".6"><path d="M56 56 L39 53"/><path d="M56 59 L39 62"/><path d="M64 56 L81 53"/><path d="M64 59 L81 62"/></g></svg>`,
  jiuxin: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="jx_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#3a142a"/><stop offset="100%" stop-color="#150810"/></radialGradient>
<linearGradient id="jx_p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffc2da"/><stop offset="100%" stop-color="#ef6f9c"/></linearGradient>
<radialGradient id="jx_c" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ff9ec0"/><stop offset="100%" stop-color="#ff4f85"/></radialGradient>
<filter id="jx_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#jx_bg)" stroke="#ff8fb0" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#ff8fb055" stroke-width="1.3"/>
<g fill="#e87aa6" stroke="#ff6f9c" stroke-width="1.1" opacity=".85">
<ellipse cx="60" cy="36" rx="11" ry="18" transform="rotate(36 60 60)"/><ellipse cx="60" cy="36" rx="11" ry="18" transform="rotate(108 60 60)"/><ellipse cx="60" cy="36" rx="11" ry="18" transform="rotate(180 60 60)"/><ellipse cx="60" cy="36" rx="11" ry="18" transform="rotate(252 60 60)"/><ellipse cx="60" cy="36" rx="11" ry="18" transform="rotate(324 60 60)"/></g>
<g fill="url(#jx_p)" stroke="#ff6f9c" stroke-width="1.5">
<ellipse cx="60" cy="36" rx="11.5" ry="18"/><ellipse cx="60" cy="36" rx="11.5" ry="18" transform="rotate(72 60 60)"/><ellipse cx="60" cy="36" rx="11.5" ry="18" transform="rotate(144 60 60)"/><ellipse cx="60" cy="36" rx="11.5" ry="18" transform="rotate(216 60 60)"/><ellipse cx="60" cy="36" rx="11.5" ry="18" transform="rotate(288 60 60)"/></g>
<g stroke="#ffd6e6" stroke-width=".8" fill="none" opacity=".6"><path d="M60 44 L60 54"/><path d="M60 44 L66 52"/><path d="M60 44 L54 52"/><path d="M60 44 L70 50"/><path d="M60 44 L50 50"/></g>
<circle cx="60" cy="58" r="9" fill="url(#jx_c)" stroke="#ffd0e0" stroke-width="1.4" filter="url(#jx_g)"/>
<g stroke="#ffe6a0" stroke-width="1.1"><line x1="60" y1="58" x2="54" y2="49"/><line x1="60" y1="58" x2="66" y2="49"/><line x1="60" y1="58" x2="60" y2="45"/></g>
<circle cx="54" cy="49" r="1.7" fill="#ffe6a0"/><circle cx="66" cy="49" r="1.7" fill="#ffe6a0"/><circle cx="60" cy="45" r="1.7" fill="#ffe6a0"/>
<path d="M56 56 C53 51 58 50 60 55 C62 50 67 51 64 56" fill="none" stroke="#ffd0e0" stroke-width="1.2"/></svg>`,
  xuanwu: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="xw_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#103138"/><stop offset="100%" stop-color="#05131a"/></radialGradient>
<linearGradient id="xw_s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2f8a96"/><stop offset="100%" stop-color="#145a64"/></linearGradient>
<filter id="xw_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#xw_bg)" stroke="#2fb6c8" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#2fb6c855" stroke-width="1.3"/>
<g fill="none" stroke="#2fb6c8" opacity=".3" stroke-width="1.5"><path d="M22 92 Q32 86 42 92"/><path d="M78 92 Q88 86 98 92"/></g>
<ellipse cx="33" cy="78" rx="9" ry="6" fill="url(#xw_s)" stroke="#46c8d8" stroke-width="1.4"/><ellipse cx="87" cy="78" rx="9" ry="6" fill="url(#xw_s)" stroke="#46c8d8" stroke-width="1.4"/>
<path d="M27 66 C27 39 93 39 93 66 C93 83 27 83 27 66 Z" fill="url(#xw_s)" stroke="#46c8d8" stroke-width="2.4"/>
<path d="M27 66 C27 83 93 83 93 66" fill="none" stroke="#1c6b76" stroke-width="3"/>
<g fill="none" stroke="#7fe0ec" stroke-width="1.7" opacity=".9"><path d="M60 45 L74 56 L74 71 L60 81 L46 71 L46 56 Z"/><path d="M46 56 L33 63"/><path d="M74 56 L87 63"/><path d="M60 81 L60 91"/><path d="M39 58 C44 51 53 51 57 58"/><path d="M63 58 C67 51 76 51 81 58"/></g>
<circle cx="60" cy="63" r="3.2" fill="#bff4ff" opacity=".85"/>
<ellipse cx="60" cy="90" rx="9.5" ry="7.5" fill="url(#xw_s)" stroke="#46c8d8" stroke-width="1.6"/>
<circle cx="56" cy="89" r="1.9" fill="#cffaff"/><circle cx="64" cy="89" r="1.9" fill="#cffaff"/>
<path d="M60 96 C60 102 58 106 62 109" fill="none" stroke="#46c8d8" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  leiting: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="lt_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#142a44"/><stop offset="100%" stop-color="#070f1c"/></radialGradient>
<linearGradient id="lt_f" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3f6a9e"/><stop offset="100%" stop-color="#16233e"/></linearGradient>
<radialGradient id="lt_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#dff2ff"/><stop offset="100%" stop-color="#3aa0ff"/></radialGradient>
<filter id="lt_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#lt_bg)" stroke="#5ab8ff" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#5ab8ff55" stroke-width="1.3"/>
<g fill="none" stroke="#5ab8ff" opacity=".35" stroke-width="2" filter="url(#lt_g)"><path d="M25 36 C17 44 21 55 30 59"/><path d="M95 36 C103 44 99 55 90 59"/></g>
<path d="M30 25 L45 25 L37 42 L51 42 L26 67 L36 48 L25 48 Z" fill="#ffe14d" stroke="#fff3a0" stroke-width=".9" opacity=".95"/>
<path d="M44 33 L40 15 L57 28 Z" fill="url(#lt_f)" stroke="#5ab8ff" stroke-width="1.4"/><path d="M76 33 L80 15 L63 28 Z" fill="url(#lt_f)" stroke="#5ab8ff" stroke-width="1.4"/>
<path d="M42 46 C38 30 52 24 60 28 C68 24 82 30 78 46 C84 58 74 75 60 77 C46 75 36 58 42 46 Z" fill="url(#lt_f)" stroke="#5ab8ff" stroke-width="1.7"/>
<path d="M44 55 L36 60 L46 62 Z" fill="url(#lt_f)"/><path d="M76 55 L84 60 L74 62 Z" fill="url(#lt_f)"/>
<path d="M55 59 L65 59 L69 79 L51 79 Z" fill="#16213a" stroke="#2b3a5c" stroke-width="1.2"/>
<path d="M60 76 L60 85" stroke="#16213a" stroke-width="2.4"/><ellipse cx="60" cy="83" rx="4" ry="3" fill="#0c1626"/>
<ellipse cx="51" cy="50" rx="4.6" ry="4.2" fill="url(#lt_e)" filter="url(#lt_g)"/><ellipse cx="69" cy="50" rx="4.6" ry="4.2" fill="url(#lt_e)" filter="url(#lt_g)"/>
<ellipse cx="51" cy="50" rx="1.9" ry="3" fill="#0c1626"/><ellipse cx="69" cy="50" rx="1.9" ry="3" fill="#0c1626"/>
<path d="M56 57 L64 57 L60 64 Z" fill="#cfe9ff"/></svg>`,
  bingdi: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bd_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#0e353d"/><stop offset="100%" stop-color="#05161a"/></radialGradient>
<linearGradient id="bd_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3fb6cc"/><stop offset="100%" stop-color="#136b7a"/></linearGradient>
<filter id="bd_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#bd_bg)" stroke="#7fe6ff" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#7fe6ff55" stroke-width="1.3"/>
<g fill="none" stroke="#7fe6ff" opacity=".3" stroke-width="1.5"><path d="M28 32 L35 39 L28 46 L21 39 Z"/><path d="M92 32 L99 39 L92 46 L85 39 Z"/><path d="M60 20 L66 27 L60 34 L54 27 Z"/></g>
<path d="M40 60 C29 53 25 64 34 71 C29 62 39 59 45 64" fill="none" stroke="url(#bd_b)" stroke-width="4.2" stroke-linecap="round" filter="url(#bd_g)"/>
<path d="M80 60 C91 53 95 64 86 71 C91 62 81 59 75 64" fill="none" stroke="url(#bd_b)" stroke-width="4.2" stroke-linecap="round"/>
<path d="M34 71 L27 76 M86 71 L93 76" stroke="#7fe6ff" stroke-width="2.2" stroke-linecap="round"/>
<ellipse cx="60" cy="67" rx="15.5" ry="11.5" fill="url(#bd_b)" stroke="#7fe6ff" stroke-width="2.2"/>
<path d="M45 65 L75 65" stroke="#bff4ff" opacity=".5" stroke-width="1.2"/>
<ellipse cx="60" cy="50" rx="10.5" ry="8.5" fill="#23899a" stroke="#7fe6ff" stroke-width="1.7"/>
<circle cx="56" cy="49" r="2" fill="#cffaff"/><circle cx="64" cy="49" r="2" fill="#cffaff"/>
<g stroke="#7fe6ff" stroke-width="2" fill="none" opacity=".8"><path d="M47 75 L39 84"/><path d="M54 78 L50 88"/><path d="M66 78 L70 88"/><path d="M73 75 L81 84"/></g>
<path d="M60 77 C57 91 71 97 77 85 C83 74 72 71 74 81" fill="none" stroke="url(#bd_b)" stroke-width="4.2" stroke-linecap="round" filter="url(#bd_g)"/>
<circle cx="74" cy="79" r="4" fill="#bff4ff"/><path d="M74 75 L74 70" stroke="#7fe6ff" stroke-width="1.8" stroke-linecap="round"/></svg>`
,
  landian: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="ld_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#142a44"/><stop offset="100%" stop-color="#070f1c"/></radialGradient>
<linearGradient id="ld_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5aa6e0"/><stop offset="100%" stop-color="#1f4f8a"/></linearGradient>
<radialGradient id="ld_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#dff2ff"/><stop offset="100%" stop-color="#3aa0ff"/></radialGradient>
<filter id="ld_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#ld_bg)" stroke="#5ab8ff" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#5ab8ff55" stroke-width="1.3"/>
<g fill="none" stroke="#5ab8ff" opacity=".35" stroke-width="2" filter="url(#ld_g)"><path d="M25 36 C17 44 21 55 30 59"/><path d="M95 36 C103 44 99 55 90 59"/></g>
<path d="M40 40 C34 26 50 24 60 30 C70 24 86 28 80 42 C88 52 80 66 66 70 C70 56 66 48 60 46 C54 48 50 56 54 70 C40 66 32 52 40 40 Z" fill="url(#ld_b)" stroke="#5ab8ff" stroke-width="1.7"/>
<path d="M44 30 L40 16 L52 26 Z" fill="url(#ld_b)" stroke="#5ab8ff" stroke-width="1.4"/><path d="M76 30 L80 16 L68 26 Z" fill="url(#ld_b)" stroke="#5ab8ff" stroke-width="1.4"/>
<path d="M50 52 L70 52 L66 64 L54 64 Z" fill="#16233e"/><path d="M54 64 L56 59 L58 64 L60 59 L62 64 L64 59 L66 64 Z" fill="#cfe9ff"/>
<ellipse cx="54" cy="46" rx="4" ry="4" fill="url(#ld_e)" filter="url(#ld_g)"/><ellipse cx="70" cy="46" rx="4" ry="4" fill="url(#ld_e)" filter="url(#ld_g)"/>
<circle cx="54" cy="46" r="2" fill="#0c1626"/><circle cx="70" cy="46" r="2" fill="#0c1626"/>
<path d="M30 30 L42 30 L36 44 L48 44 L26 66 L34 48 L26 48 Z" fill="#ffe14d" stroke="#fff3a0" stroke-width=".9"/></svg>`,
  roushu: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="ro_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#3a1626"/><stop offset="100%" stop-color="#150810"/></radialGradient>
<linearGradient id="ro_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd0e0"/><stop offset="100%" stop-color="#ef7ba6"/></linearGradient>
<filter id="ro_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#ro_bg)" stroke="#ffb3c8" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#ffb3c855" stroke-width="1.3"/>
<ellipse cx="60" cy="80" rx="22" ry="18" fill="url(#ro_b)" stroke="#ff9ec0" stroke-width="1.6"/>
<circle cx="60" cy="52" r="18" fill="url(#ro_b)" stroke="#ff9ec0" stroke-width="1.6"/>
<path d="M48 44 C42 18 52 14 56 36 Z" fill="url(#ro_b)" stroke="#ff9ec0" stroke-width="1.4"/><path d="M72 44 C78 18 68 14 64 36 Z" fill="url(#ro_b)" stroke="#ff9ec0" stroke-width="1.4"/>
<path d="M50 40 C46 22 53 19 55 35 Z" fill="#ffd0e0" opacity=".55"/><path d="M70 40 C74 22 67 19 65 35 Z" fill="#ffd0e0" opacity=".55"/>
<circle cx="53" cy="52" r="4" fill="#2a2233"/><circle cx="67" cy="52" r="4" fill="#2a2233"/><circle cx="54" cy="50.5" r="1.5" fill="#fff"/><circle cx="68" cy="50.5" r="1.5" fill="#fff"/>
<path d="M57 58 L63 58 L60 62 Z" fill="#ff7aa8"/>
<ellipse cx="48" cy="96" rx="7" ry="4" fill="url(#ro_b)"/><ellipse cx="72" cy="96" rx="7" ry="4" fill="url(#ro_b)"/></svg>`,
  xiangchang: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="xc_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#33241a"/><stop offset="100%" stop-color="#140d08"/></radialGradient>
<linearGradient id="xc_b" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e6b97e"/><stop offset="100%" stop-color="#a06a36"/></linearGradient>
<filter id="xc_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#xc_bg)" stroke="#d9a066" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#d9a06655" stroke-width="1.3"/>
<path d="M30 50 C30 36 50 34 56 44 C60 52 50 60 56 68 C62 76 48 84 52 92 C56 98 72 96 72 88" fill="none" stroke="url(#xc_b)" stroke-width="14" stroke-linecap="round" filter="url(#xc_g)"/>
<path d="M33 47 C33 38 49 36 54 44" fill="none" stroke="#f0c89a" stroke-width="3" opacity=".6"/>
<circle cx="30" cy="50" r="5" fill="#b97a44"/><circle cx="72" cy="88" r="5" fill="#b97a44"/>
<circle cx="44" cy="46" r="2" fill="#ffe6c8" opacity=".7"/><circle cx="58" cy="70" r="2" fill="#ffe6c8" opacity=".7"/>
<path d="M60 86 L60 96" stroke="#d9a066" stroke-width="1.5" opacity=".5"/></svg>`,
  poqiang: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="pq_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#2a2e38"/><stop offset="100%" stop-color="#0e1016"/></radialGradient>
<linearGradient id="pq_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f2f5fb"/><stop offset="100%" stop-color="#aab2c4"/></linearGradient>
<linearGradient id="pq_s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b98a52"/><stop offset="100%" stop-color="#6e4d28"/></linearGradient>
<filter id="pq_g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#pq_bg)" stroke="#c0c8d8" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#c0c8d855" stroke-width="1.3"/>
<rect x="57" y="44" width="6" height="64" rx="3" fill="url(#pq_s)" stroke="#9aa2b4" stroke-width="1.6"/>
<path d="M60 16 L71 44 L49 44 Z" fill="url(#pq_b)" stroke="#e8edf6" stroke-width="2" filter="url(#pq_g)"/>
<path d="M60 22 L60 44" stroke="#b8c0d0" stroke-width="1"/>
<path d="M47 46 L73 46" stroke="#c0c8d8" stroke-width="4" stroke-linecap="round"/>
<path d="M60 46 C56 54 64 60 60 70" fill="none" stroke="#ff5e6d" stroke-width="2.6" opacity=".8"/>
<circle cx="60" cy="18" r="3" fill="#fff" filter="url(#pq_g)"/></svg>`,
  shenglong: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="sl_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#3a3214"/><stop offset="100%" stop-color="#16110a"/></radialGradient>
<linearGradient id="sl_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffe9a0"/><stop offset="100%" stop-color="#e0ac3a"/></linearGradient>
<radialGradient id="sl_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#fff6d0"/><stop offset="100%" stop-color="#ffcf4d"/></radialGradient>
<filter id="sl_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#sl_bg)" stroke="#ffe27a" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#ffe27a55" stroke-width="1.3"/>
<circle cx="60" cy="54" r="30" fill="#ffe27a" opacity=".12" filter="url(#sl_g)"/>
<path d="M40 42 C34 28 52 26 62 32 C72 26 86 30 80 44 C88 54 80 68 66 72 C70 58 66 50 60 48 C54 50 50 58 54 72 C40 68 32 54 40 42 Z" fill="url(#sl_b)" stroke="#ffe27a" stroke-width="1.7"/>
<path d="M46 32 L42 16 L54 28 Z" fill="url(#sl_b)" stroke="#ffe27a" stroke-width="1.4"/><path d="M74 32 L78 16 L66 28 Z" fill="url(#sl_b)" stroke="#ffe27a" stroke-width="1.4"/>
<path d="M50 54 L70 54 L66 66 L54 66 Z" fill="#2a2410"/><path d="M54 66 L56 61 L58 66 L60 61 L62 66 L64 61 L66 66 Z" fill="#fff3c4"/>
<ellipse cx="54" cy="47" rx="4" ry="4" fill="url(#sl_e)" filter="url(#sl_g)"/><ellipse cx="70" cy="47" rx="4" ry="4" fill="url(#sl_e)" filter="url(#sl_g)"/>
<circle cx="54" cy="47" r="2" fill="#1a1400"/><circle cx="70" cy="47" r="2" fill="#1a1400"/></svg>`,
  anhu: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="ah_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#1e1430"/><stop offset="100%" stop-color="#0a0712"/></radialGradient>
<linearGradient id="ah_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5a3f8e"/><stop offset="100%" stop-color="#1c1230"/></linearGradient>
<radialGradient id="ah_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#e6c4ff"/><stop offset="100%" stop-color="#a865ff"/></radialGradient>
<filter id="ah_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#ah_bg)" stroke="#b07bff" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#b07bff55" stroke-width="1.3"/>
<circle cx="60" cy="58" r="30" fill="#b07bff" opacity=".12" filter="url(#ah_g)"/>
<path d="M38 46 C34 26 51 32 55 43 Z" fill="url(#ah_b)" stroke="#b07bff" stroke-width="1.4"/><path d="M82 46 C86 26 69 32 65 43 Z" fill="url(#ah_b)" stroke="#b07bff" stroke-width="1.4"/>
<path d="M44 40 C42 31 50 33 52 39 Z" fill="#7a3bb0" opacity=".5"/>
<path d="M60 30 C38 30 30 50 33 69 C36 87 48 96 60 96 C72 96 84 87 87 69 C90 50 82 30 60 30 Z" fill="url(#ah_b)" stroke="#9a5fe0" stroke-width="1.7"/>
<g stroke="#160a24" stroke-width="3.6" fill="none" stroke-linecap="round"><path d="M44 40 C48 49 48 53 45 60"/><path d="M36 55 C42 61 42 65 38 71"/><path d="M76 40 C72 49 72 53 75 60"/><path d="M84 55 C78 61 78 65 82 71"/><path d="M60 37 L60 50"/><path d="M52 44 L56 53"/><path d="M68 44 L64 53"/></g>
<ellipse cx="50" cy="62" rx="6" ry="5" fill="url(#ah_e)" filter="url(#ah_g)"/><ellipse cx="70" cy="62" rx="6" ry="5" fill="url(#ah_e)" filter="url(#ah_g)"/>
<circle cx="50" cy="62.5" r="2.3" fill="#0a0018"/><circle cx="70" cy="62.5" r="2.3" fill="#0a0018"/>
<path d="M55 73 L65 73 L60 80 Z" fill="#b07bff"/><path d="M55 74 L58 74 L56 80 Z" fill="#e8d8ff"/><path d="M62 74 L65 74 L63 80 Z" fill="#e8d8ff"/></svg>`,
  bilin: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="bl_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#11301f"/><stop offset="100%" stop-color="#06140d"/></radialGradient>
<linearGradient id="bl_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7ee0a0"/><stop offset="100%" stop-color="#2f8a5a"/></linearGradient>
<radialGradient id="bl_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#d6ffe8"/><stop offset="100%" stop-color="#5fe0a0"/></radialGradient>
<filter id="bl_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#bl_bg)" stroke="#7ee0a0" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#7ee0a055" stroke-width="1.3"/>
<path d="M30 78 C30 60 50 58 56 68 C60 76 48 82 54 90 C60 98 78 94 82 84" fill="none" stroke="url(#bl_b)" stroke-width="11" stroke-linecap="round" filter="url(#bl_g)"/>
<path d="M54 68 C58 54 74 50 80 58 C86 64 82 72 74 72 C80 66 70 64 68 70 C66 74 58 74 54 68 Z" fill="url(#bl_b)" stroke="#7ee0a0" stroke-width="1.7"/>
<path d="M80 60 L90 56 M88 58 L93 58" stroke="#ff5e6d" stroke-width="1.5" stroke-linecap="round"/>
<ellipse cx="70" cy="60" rx="3" ry="3.5" fill="url(#bl_e)" filter="url(#bl_g)"/><circle cx="70" cy="60" r="1.6" fill="#06200f"/>
<path d="M40 74 C44 68 50 68 54 72" stroke="#bff5d0" stroke-width="2" opacity=".5" fill="none"/></svg>`,
  huolong: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="hl_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#3a160c"/><stop offset="100%" stop-color="#140704"/></radialGradient>
<linearGradient id="hl_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffb866"/><stop offset="100%" stop-color="#e8491f"/></linearGradient>
<radialGradient id="hl_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffe6a0"/><stop offset="100%" stop-color="#ff7a2c"/></radialGradient>
<filter id="hl_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#hl_bg)" stroke="#ff6a2c" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#ff6a2c55" stroke-width="1.3"/>
<circle cx="60" cy="54" r="30" fill="#ff6a2c" opacity=".12" filter="url(#hl_g)"/>
<path d="M40 42 C34 28 52 26 62 32 C72 26 86 30 80 44 C88 54 80 68 66 72 C70 58 66 50 60 48 C54 50 50 58 54 72 C40 68 32 54 40 42 Z" fill="url(#hl_b)" stroke="#ff6a2c" stroke-width="1.7"/>
<path d="M46 32 L42 16 L54 28 Z" fill="url(#hl_b)" stroke="#ff6a2c" stroke-width="1.4"/><path d="M74 32 L78 16 L66 28 Z" fill="url(#hl_b)" stroke="#ff6a2c" stroke-width="1.4"/>
<path d="M50 54 L70 54 L66 66 L54 66 Z" fill="#3a1206"/><path d="M54 66 L56 61 L58 66 L60 61 L62 66 L64 61 L66 66 Z" fill="#ffd07a"/>
<ellipse cx="54" cy="47" rx="4" ry="4" fill="url(#hl_e)" filter="url(#hl_g)"/><ellipse cx="70" cy="47" rx="4" ry="4" fill="url(#hl_e)" filter="url(#hl_g)"/>
<circle cx="54" cy="47" r="2" fill="#1a0a00"/><circle cx="70" cy="47" r="2" fill="#1a0a00"/>
<g fill="none" stroke="#ffb24d" stroke-width="2.5" opacity=".7" stroke-linecap="round"><path d="M30 40 C24 48 28 56 34 60"/><path d="M90 40 C96 48 92 56 86 60"/></g></svg>`,
  bingfeng: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="bf_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#0e353d"/><stop offset="100%" stop-color="#05161a"/></radialGradient>
<linearGradient id="bf_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bff4ff"/><stop offset="100%" stop-color="#3fb6cc"/></linearGradient>
<linearGradient id="bf_w" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9fe6f4"/><stop offset="100%" stop-color="#2f8aa0"/></linearGradient>
<linearGradient id="bf_t" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e6ffff"/><stop offset="100%" stop-color="#7fe6ff"/></linearGradient>
<filter id="bf_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#bf_bg)" stroke="#7fe6ff" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#7fe6ff55" stroke-width="1.3"/>
<g fill="none" stroke="url(#bf_t)" stroke-width="4" stroke-linecap="round" filter="url(#bf_g)"><path d="M60 84 C52 100 48 110 56 117"/><path d="M60 84 C60 102 60 112 60 119"/><path d="M60 84 C68 100 72 110 64 117"/></g>
<path d="M56 52 C35 42 21 54 17 73 C36 62 50 62 60 67 Z" fill="url(#bf_w)" stroke="#7fe6ff" stroke-width="1.5"/>
<path d="M64 52 C85 42 99 54 103 73 C84 62 70 62 60 67 Z" fill="url(#bf_w)" stroke="#7fe6ff" stroke-width="1.5"/>
<path d="M60 35 C50 50 53 71 60 87 C67 71 70 50 60 35 Z" fill="url(#bf_b)" stroke="#7fe6ff" stroke-width="1.6"/>
<ellipse cx="60" cy="59" rx="5" ry="11" fill="#cffaff" opacity=".55"/>
<circle cx="60" cy="33" r="6.5" fill="url(#bf_b)" stroke="#7fe6ff" stroke-width="1.4"/>
<path d="M60 27 C57 19 63 17 60 11 C65 18 67 23 62 28 Z" fill="#bff4ff"/>
<path d="M60 33 L67 36 L60 39 Z" fill="#bff4ff"/><circle cx="58" cy="32" r="1.7" fill="#06262e"/>
<path d="M30 50 L36 56 L30 62 L24 56 Z" fill="#bff4ff" opacity=".5"/><path d="M90 50 L96 56 L90 62 L84 56 Z" fill="#bff4ff" opacity=".5"/></svg>`,
  niumang: `<svg viewBox="0 0 120 120" class="wa" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="nm_bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="#0e352f"/><stop offset="100%" stop-color="#05140f"/></radialGradient>
<linearGradient id="nm_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5fd0bc"/><stop offset="100%" stop-color="#1f7a6a"/></linearGradient>
<radialGradient id="nm_e" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#d6fff2"/><stop offset="100%" stop-color="#4fb0a0"/></radialGradient>
<filter id="nm_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="60" cy="60" r="57" fill="url(#nm_bg)" stroke="#4fb0a0" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="#4fb0a055" stroke-width="1.3"/>
<path d="M28 82 C28 64 48 60 54 72 C58 82 46 88 54 96 C62 104 80 98 84 88" fill="none" stroke="url(#nm_b)" stroke-width="12" stroke-linecap="round" filter="url(#nm_g)"/>
<path d="M52 70 C48 52 70 48 76 60 C82 70 74 80 64 80 C72 72 66 70 64 76 C60 80 54 80 52 70 Z" fill="url(#nm_b)" stroke="#4fb0a0" stroke-width="1.7"/>
<path d="M52 58 C46 46 50 40 56 48" fill="none" stroke="#4fb0a0" stroke-width="4" stroke-linecap="round"/>
<path d="M74 58 C80 46 76 40 70 48" fill="none" stroke="#4fb0a0" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="62" cy="64" rx="3" ry="3.5" fill="url(#nm_e)" filter="url(#nm_g)"/><circle cx="62" cy="64" r="1.6" fill="#06262e"/>
<circle cx="66" cy="70" r="2" fill="#06262e"/><circle cx="72" cy="70" r="2" fill="#06262e"/>
<path d="M40 78 C44 72 50 72 54 76" stroke="#bff0e6" stroke-width="2" opacity=".5" fill="none"/></svg>`
};

const WUHUN_QUALITY = [
  { id: 1, name: '凡品', mul: 1.00, color: '#b8c0cc' },
  { id: 2, name: '地品', mul: 1.35, color: '#7ee0c0' },
  { id: 3, name: '天品', mul: 1.90, color: '#8fa6ff' },
  { id: 4, name: '神品', mul: 2.80, color: '#ffd700' }
];

/* ---------- 四、猎魂区域 ---------- */
/* 每个区域 10 波，第 10 波为魂兽 BOSS，通关解锁下一区域 */
const AREAS = [
  {
    id: 0, name: '星斗大森林 · 外围', lv: 6, tag: '新手',
    hp: 2600, atk: 210, def: 525, spd: 0.85,
    yearMin: 42, yearMax: 420, exp: 55, coin: 38,
    mobs: ['风狒狒', '曼陀罗蛇', '幽冥狼', '孤竹', '闪豹', '双头火豹', '铁甲犀'],
    boss: { name: '十年 · 曼陀罗蛇王', hpMul: 2.6, atkMul: 1.5, yearMul: 1.6 },
    desc: '森林边缘，低阶魂兽出没之地。'
  },
  {
    id: 1, name: '星斗大森林 · 混合区', lv: 18, tag: '进阶',
    hp: 10400, atk: 840, def: 2100, spd: 0.92,
    yearMin: 180, yearMax: 1800, exp: 198, coin: 137,
    mobs: ['暗金恐爪熊', '大力金刚吼', '嗜血狂狼', '飞天螳螂', '雷豹', '紫灵貂'],
    boss: { name: '千年 · 暗金恐爪熊', hpMul: 2.7, atkMul: 1.55, yearMul: 1.7 },
    desc: '各族魂兽混杂，杀机四伏。'
  },
  {
    id: 2, name: '星斗大森林 · 核心区', lv: 30, tag: '凶险',
    hp: 41600, atk: 3360, def: 8400, spd: 0.99,
    yearMin: 900, yearMax: 9000, exp: 713, coin: 493,
    mobs: ['人面魔蛛', '大地之王', '银英兽', '独角巨犀', '青影狼王', '三眼金猊'],
    boss: { name: '万年 · 人面魔蛛', hpMul: 2.8, atkMul: 1.6, yearMul: 1.8 },
    desc: '千年魂兽成群，稍有不慎便是陨落。'
  },
  {
    id: 3, name: '落日森林 · 深处', lv: 42, tag: '危机',
    hp: 166400, atk: 13440, def: 33600, spd: 1.05,
    yearMin: 5000, yearMax: 48000, exp: 2566, coin: 1775,
    mobs: ['邪魔虎鲸', '冰蚕', '独角铁犀', '地狱魔龙', '风魔妖猿', '噬魂蛛皇'],
    boss: { name: '万年 · 邪魔虎鲸王', hpMul: 2.9, atkMul: 1.65, yearMul: 1.9 },
    desc: '日落之地，凶兽的乐园。'
  },
  {
    id: 4, name: '极北之地', lv: 54, tag: '绝境',
    hp: 665600, atk: 53760, def: 134400, spd: 1.12,
    yearMin: 30000, yearMax: 260000, exp: 9238, coin: 6390,
    mobs: ['冰熊王', '雪女', '极寒冰鸟', '冰爆魔熊', '雪魄魔狼', '泰坦雪魔'],
    boss: { name: '十万年 · 泰坦雪魔王', hpMul: 3.0, atkMul: 1.7, yearMul: 2.0 },
    desc: '极致之冰的国度，人类禁区。'
  },
  {
    id: 5, name: '海神岛 · 神光', lv: 66, tag: '试炼',
    hp: 2660000, atk: 215040, def: 537600, spd: 1.18,
    yearMin: 150000, yearMax: 900000, exp: 33257, coin: 23000,
    mobs: ['魔魂大白鲨', '邪魔虎鲸', '深海魔鲸', '海蛇王', '人鱼守卫', '海神圣卫'],
    boss: { name: '十万年 · 深海魔鲸王', hpMul: 3.1, atkMul: 1.75, yearMul: 2.1 },
    desc: '海神九考，一步一登天。'
  },
  {
    id: 6, name: '星斗深处 · 凶兽巢', lv: 80, tag: '禁忌',
    hp: 10660000, atk: 860160, def: 2150400, spd: 1.25,
    yearMin: 600000, yearMax: 6e6, exp: 119725, coin: 82800,
    mobs: ['帝天', '碧姬', '万妖王', '熊君', '赤王', '紫姬'],
    boss: { name: '百万年 · 金眼黑龙王', hpMul: 3.2, atkMul: 1.8, yearMul: 2.2 },
    desc: '凶兽汇聚，帝天在此。'
  },
  {
    id: 7, name: '神界 · 神位传承', lv: 94, tag: '成神',
    hp: 42600000, atk: 3440000, def: 8601600, spd: 1.32,
    yearMin: 8e6, yearMax: 6e7, exp: 431000, coin: 298000,
    mobs: ['神界守卫', '堕落天使', '元素神使', '虚空巨兽', '神罚骑士', '秩序神官'],
    boss: { name: '神位 · 神界执法者', hpMul: 3.0, atkMul: 1.7, yearMul: 2.4 },
    desc: '成神之路的最后一关。'
  }
];

/* ---------- 五、魂骨 ---------- */
const BONE_SLOTS = [
  { key: 'head',     name: '头部魂骨',   base: { hp: 0.16, atk: 0.05, def: 0.10, spd: 0.02 } },
  { key: 'torso',    name: '躯干魂骨',   base: { hp: 0.24, atk: 0.06, def: 0.16, spd: 0.02 } },
  { key: 'larm',     name: '左臂魂骨',   base: { hp: 0.10, atk: 0.16, def: 0.06, spd: 0.03 } },
  { key: 'rarm',     name: '右臂魂骨',   base: { hp: 0.10, atk: 0.18, def: 0.05, spd: 0.03 } },
  { key: 'lleg',     name: '左腿魂骨',   base: { hp: 0.12, atk: 0.06, def: 0.08, spd: 0.12 } },
  { key: 'rleg',     name: '右腿魂骨',   base: { hp: 0.12, atk: 0.06, def: 0.08, spd: 0.12 } },
  { key: 'external', name: '外附魂骨',   base: { hp: 0.14, atk: 0.22, def: 0.10, spd: 0.10 } }
];
const BONE_PREFIX = ['魂兽', '千年', '万年', '凶兽', '神赐', '太古'];

/* ---------- 六、称号（按累计战力解锁） ---------- */
const TITLES = [
  { need: 0,       name: '初入魂师界' },
  { need: 2000,    name: '小有名气' },
  { need: 20000,   name: '一方魂师' },
  { need: 2e5,     name: '魂宗强者' },
  { need: 2e6,     name: '威震一方' },
  { need: 2e7,     name: '魂帝至尊' },
  { need: 2e8,     name: '大陆传说' },
  { need: 2e9,     name: '巅峰斗罗' },
  { need: 2e10,    name: '半神之境' },
  { need: 2e11,    name: '神位继承人' },
  { need: 2e12,    name: '位面之主' }
];

/* ---------- 七、成就 ---------- */
const ACHIEVEMENTS = [
  { id: 'lv20',  name: '初露锋芒',   desc: '等级达到 20',       check: s => s.level >= 20 },
  { id: 'lv50',  name: '魂王之姿',   desc: '等级达到 50',       check: s => s.level >= 50 },
  { id: 'lv80',  name: '魂斗罗',     desc: '等级达到 80',       check: s => s.level >= 80 },
  { id: 'lv100', name: '百级成神',   desc: '等级达到 100',      check: s => s.level >= 100 },
  { id: 'ring9', name: '九环皆备',   desc: '集齐 9 枚魂环',     check: s => s.rings.filter(Boolean).length >= 9 },
  { id: 'wmy',   name: '万年魂环',   desc: '吸收一枚万年魂环',  check: s => s.rings.some(r => r && r.year >= 10000) },
  { id: 'swmy',  name: '十万年魂环', desc: '吸收十万年魂环',    check: s => s.rings.some(r => r && r.year >= 100000) },
  { id: 'bone7', name: '全身魂骨',   desc: '集齐 6 块魂骨',     check: s => BONE_SLOTS.filter(b => s.bones[b.key]).length >= 6 },
  { id: 'samsara', name: '轮回重生', desc: '完成第一次转生',    check: s => s.rebirth >= 1 },
  { id: 'kill1k', name: '猎魂千头',  desc: '累计击杀 1000 只魂兽', check: s => s.stat.kills >= 1000 },
  { id: 'area5', name: '涉足极北',   desc: '解锁极北之地',      check: s => s.maxArea >= 4 },
  { id: 'area8', name: '登临神界',   desc: '解锁神界',          check: s => s.maxArea >= 7 }
];

/* ---------- 八、名字池（开局随机） ---------- */
const NAME_POOL_A = ['唐', '萧', '林', '叶', '楚', '秦', '洛', '沐', '沈', '顾', '苏', '江'];
const NAME_POOL_B = ['三', '炎', '动', '凡', '轩', '寒', '尘', '清', '羽', '夜', '辰', '澜', '冥', '霄'];

if (typeof module !== 'undefined') {
  module.exports = { REALMS, RING_TIERS, WUHUN_LIST, WUHUN_QUALITY, WUHUN_ART, HERO_PORTRAIT, RING_OPEN_LEVEL, AREAS, BONE_SLOTS, ACHIEVEMENTS, TITLES };
}
