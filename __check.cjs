const fs = require('fs');
const h = fs.readFileSync('h5.html', 'utf8');
let s = h.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/)[1];
s = s.replace('UI.boot();', '/*boot*/');

const store = {};
function fakeEl(id) {
  return {
    id, style: {}, dataset: {}, value: '', textContent: '', innerHTML: '', disabled: false,
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    appendChild() {}, removeChild() {}, remove() {}, insertAdjacentHTML() {},
    querySelector(sel) { return store[id + '|' + sel] || (store[id + '|' + sel] = fakeEl(id + '|' + sel)); },
    querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, focus() {}, select() {},
    getBoundingClientRect() { return { width: 0, height: 0, top: 0, left: 0 }; },
    setAttribute() {}, getAttribute() { return null; }
  };
}
const document = {
  getElementById: id => store[id] || (store[id] = fakeEl(id)),
  querySelector: sel => store['q:' + sel] || (store['q:' + sel] = fakeEl('q:' + sel)),
  querySelectorAll: () => [],
  createElement: () => fakeEl('created'),
  body: { appendChild() {}, classList: { toggle() {}, add() {}, remove() {} } },
  documentElement: {}, addEventListener() {}
};
const window = { addEventListener() {}, innerWidth: 1200 };
const localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const navigator = { userAgent: 'node' };
const confirm = () => true;

const fn = new Function('document', 'window', 'localStorage', 'navigator', 'confirm', 'requestAnimationFrame', 'setInterval', 'setTimeout', 'performance',
  s + '\nreturn { Game, UI, WUHUN_LIST };');
const api = fn(document, window, localStorage, navigator, confirm, () => {}, () => 0, () => 0, { now: () => Date.now() });
const { Game, UI } = api;

console.log('--- preview vs real (quality 1, no rings/bones) ---');
['bingdi', 'lanyin', 'huofeng', 'xuanwu'].forEach(id => {
  const p = Game.previewStats(id);
  Game.init(id, 't');
  const r = Game.st;
  const ok = p.maxHp === r.maxHp && p.atk === r.atk && p.def === r.def && Math.abs(p.spd - r.spd) < 1e-9
    && Math.abs(p.crit - r.crit) < 1e-9 && Math.abs(p.critDmg - r.critDmg) < 1e-9;
  console.log(id, 'preview', JSON.stringify({ hp: p.maxHp, atk: p.atk, def: p.def, spd: +p.spd.toFixed(3), crit: p.crit, cd: p.critDmg }),
    '| real', JSON.stringify({ hp: r.maxHp, atk: r.atk, def: r.def, spd: +r.spd.toFixed(3), crit: r.crit, cd: r.critDmg }), '| match=', ok);
});

console.log('--- render pages ---');
UI.renderWuhunTab();
console.log('wuhunNow len=', store.wuhunNow.innerHTML.length, 'has attr-box=', store.wuhunNow.innerHTML.includes('attr-box'),
  'has 当前具体属性=', store.wuhunNow.innerHTML.includes('当前具体属性'));
console.log('wuhunPick has 初始属性预览=', store.wuhunPick.innerHTML.includes('初始属性预览'),
  'count=', (store.wuhunPick.innerHTML.match(/attr-box/g) || []).length);

UI.showStart();
const grid = store['created|#pickGrid'];
console.log('pickGrid has 觉醒初始属性=', grid.innerHTML.includes('觉醒初始属性'), 'len=', grid.innerHTML.length);
const m = grid.innerHTML.match(/<b>([\d,\.]+)<\/b>/g);
console.log('numbers sample=', m && m.slice(0, 6).join(' '));

console.log('--- attrBox helper ---');
console.log(UI.attrBox('T', { maxHp: 12345, atk: 678, def: 90, spd: 1.234, crit: 0.15, critDmg: 0.95 }, 'sub').replace(/\s+/g, ' '));
