/* ============================================================
 *  斗罗大陆 · 自动修炼  —— 界面层
 * ============================================================ */

const $ = id => document.getElementById(id);
const ctx_realmOf = lv => realmOf(lv);
const UI = {
  lastPaint: 0,
  tip: null,

  /* ===== 启动 ===== */
  boot() {
    this.tip = $('tip');
    this.bindTop();
    this.bindCtrl();
    this.bindTabs();
    this.bindBus();

    if (Game.hasSave() && Game.load()) {
      const off = Game.calcOffline();
      if (off) this.showOffline(off);
      this.pushLogsFromState();
      this.renderAll();
    } else {
      this.showStart();   // 选完武魂后由 start() 触发首次渲染
    }

    let last = performance.now();
    const frame = now => {
      const dt = (now - last) / 1000;
      last = now;
      if (Game.s) Game.loop(dt);
      this.paint(dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    window.addEventListener('beforeunload', () => Game.save());
    document.addEventListener('visibilitychange', () => { if (document.hidden) Game.save(); });
  },

  pushLogsFromState() {
    const box = $('logbox');
    box.innerHTML = '';
    Game.s.log.slice(0, 40).reverse().forEach(l => {
      const d = document.createElement('div');
      d.className = l.type;
      d.innerHTML = `<span class="t">${new Date(l.t).toTimeString().slice(0, 8)}</span>${l.text}`;
      box.appendChild(d);
    });
    box.scrollTop = box.scrollHeight;
  },

  /* ===== 顶部 ===== */
  bindTop() {
    $('btnSave').onclick = () => { Game.save(); this.toast('已存档'); };
    $('btnHelp').onclick = () => this.showHelp();
  },

  /* ===== 控制条 ===== */
  bindCtrl() {
    const map = { btnTrain: 'train', btnBattle: 'battle', btnRing: 'ring', btnAdvance: 'advance', btnRetreat: 'retreat', btnSell: 'sell' };
    Object.keys(map).forEach(id => {
      const el = $(id);
      if (!el) return;
      el.onclick = () => {
        Game.s.auto[map[id]] = !Game.s.auto[map[id]];
        this.paintAuto();
      };
    });
    document.querySelectorAll('.speed button').forEach(b => {
      b.onclick = () => { Game.s.speed = +b.dataset.s; this.paintSpeed(); };
    });
  },

  bindTabs() {
    document.querySelectorAll('.tabbtn').forEach(b => {
      b.onclick = () => {
        const page = b.dataset.page;
        document.querySelectorAll('.tabbtn').forEach(x => x.classList.remove('on'));
        document.querySelectorAll('.page').forEach(x => x.classList.remove('on'));
        if (page === 'home') { b.classList.add('on'); return; }
        b.classList.add('on');
        $(page).classList.add('on');
        this.renderTab(page);
      };
    });
  },

  /* ===== 事件 ===== */
  bindBus() {
    Bus.on('hit', d => this.onHit(d));
    Bus.on('log', d => {
      const box = $('logbox');
      const el = document.createElement('div');
      el.className = d.type;
      el.innerHTML = `<span class="t">${new Date().toTimeString().slice(0, 8)}</span>${d.text}`;
      box.appendChild(el);
      while (box.children.length > 90) box.removeChild(box.firstChild);
      box.scrollTop = box.scrollHeight;
    });
    Bus.on('levelup', lv => { this.renderHero(); this.renderStats(); this.renderRings(); });
    Bus.on('break', r => this.breakFx('突破 · ' + r.name));
    Bus.on('absorb', () => { this.renderRings(); this.renderBag(); this.renderHero(); });
    Bus.on('unlock', a => { this.toast('解锁新区域：' + a.name); this.renderAreas(); this.renderArea(); });
    Bus.on('kill', () => { this.renderArea(); });
    Bus.on('rebirth', () => { this.renderAll(); this.breakFx('轮回转生'); });
    Bus.on('ach', a => this.toast('成就达成：' + a.name));
    Bus.on('dead', () => this.renderBattle(true));
    Bus.on('ringdrop', () => this.renderBag());
  },

  onHit(d) {
    const floats = $('floats');
    if (floats.children.length > 14) floats.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'float ' + (d.side === 'player' ? (d.crit ? 'crit' : 'mdmg') : 'pdmg');
    el.textContent = (d.crit ? '暴击 ' : '') + fmtNum(d.dmg);
    el.style.left = (d.side === 'player' ? rnd(58, 82) : rnd(18, 42)) + '%';
    el.style.top = rnd(28, 55) + '%';
    floats.appendChild(el);
    setTimeout(() => el.remove(), 1000);

    const sp = d.side === 'player' ? $('spriteE') : $('spriteP');
    sp.classList.remove('hit-e', 'hit-p');
    void sp.offsetWidth;
    sp.classList.add(d.side === 'player' ? 'hit-e' : 'hit-p');

    if (d.skill) {
      const s = document.createElement('div');
      s.className = 'skillname';
      s.textContent = '魂技 · ' + d.skill;
      $('arena').appendChild(s);
      setTimeout(() => s.remove(), 1100);
    }
  },

  breakFx(text) {
    const el = document.createElement('div');
    el.className = 'brkfx';
    el.innerHTML = `<h1>${text}</h1>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2700);
  },

  /* ===== 每帧绘制 ===== */
  paint(dt) {
    this.lastPaint += dt;
    if (this.lastPaint < 0.06) return;
    this.lastPaint = 0;
    if (!Game.s) return;
    this.renderHeroLight();
    this.renderBattle();
    this.renderTop();
    if (this._tabAcc === undefined) this._tabAcc = 0;
    this._tabAcc += 0.06;
    if (this._tabAcc > 1.2) { this._tabAcc = 0; this.renderTab(); this.renderStats(); }
  },

  renderTop() {
    const s = Game.s;
    $('topCoin').textContent = fmtNum(s.coin);
    $('topShard').textContent = fmtNum(s.shards);
    $('topPlay').textContent = fmtTime(s.stat.play);
    const st = $('topState');
    const dead = Game.t && Game.t.dead > 0;
    st.querySelector('span').textContent = dead ? '疗伤中' : (s.auto.battle ? '猎魂中' : '修炼中');
    st.classList.toggle('off', !!dead);
  },

  renderHeroLight() {
    const s = Game.s;
    $('heroLv').textContent = s.level;
    $('heroExp').textContent = s.level >= 100 ? '已满级' : fmtNum(s.exp) + ' / ' + fmtNum(Game.expNeed(s.level));
    const need = Game.expNeed(s.level);
    const pct = s.level >= 100 ? 100 : clamp(s.exp / need * 100, 0, 100);
    const bar = $('expbar');
    bar.querySelector('i').style.width = pct + '%';
    const blocked = isBreakPoint(s.level) && s.rings.filter(Boolean).length < realmOf(s.level + 1).needRing;
    bar.classList.toggle('block', blocked);
    $('expNote').textContent = blocked
      ? `需吸收第 ${realmOf(s.level + 1).needRing} 枚魂环方可突破`
      : (s.level >= 100 ? '神力 +' + fmtNum(s.surplus) : '');
    $('expNote').classList.toggle('warn', blocked);
  },

  renderHero() {
    const s = Game.s, w = Game.wuhun(), q = Game.quality(), r = realmOf(s.level);
    $('heroName').textContent = s.name;
    $('avatar').innerHTML = HERO_PORTRAIT;
    $('avatar').style.color = w.color || '#ffd76a';
    const badge = $('realmBadge');
    badge.textContent = `${r.name} · ${s.level}级`;
    badge.style.color = r.color;
    $('wuhunTxt').innerHTML = `<b>${w.name}</b>（${w.type}）<span class="q${s.quality}">【${q.name}】</span>`;
    $('innateTxt').innerHTML = `先天魂力 <b>${s.innate}</b> 级 <small>（修炼 +${Math.round((s.innate - 1) * 7)}%）</small>`;
    $('titleTxt').textContent = Game.title().name;
    const extra = [];
    if (s.godLv > 0) extra.push(`${s.godLv} 重神位`);
    if (s.temper > 0) extra.push(`淬体 ${s.temper} 重`);
    if (s.rebirth > 0) extra.push(`转生 ${s.rebirth} 次`);
    $('rebirthTxt').textContent = extra.join(' · ');
  },

  renderStats() {
    const st = Game.st;
    const rows = [
      ['生命', fmtNum(st.maxHp)], ['攻击', fmtNum(st.atk)],
      ['防御', fmtNum(st.def)], ['速度', st.spd.toFixed(2)],
      ['暴击', fmtPct(st.crit)], ['暴伤', fmtPct(1 + st.critDmg)],
      ['吸血', fmtPct(st.lifesteal)], ['破防', fmtPct(st.penetrate)],
      ['修炼', '+' + fmtPct(st.expRate)], ['魂币', '+' + fmtPct(st.coinRate)],
      ['神位', '×' + Math.pow(1.25, Game.s.godLv).toFixed(2)], ['淬体', '×' + Math.pow(1.02, Game.s.temper).toFixed(2)],
      ['先天魂力', Game.s.innate + ' 级']
    ];
    $('statgrid').innerHTML = rows.map(([k, v]) =>
      `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
    $('powerVal').textContent = fmtNum(st.power);
    $('heroPower').textContent = fmtNum(st.power);
    $('powerAttrs').innerHTML = [
      `生命 ${fmtNum(st.maxHp)}`, `攻击 ${fmtNum(st.atk)}`, `防御 ${fmtNum(st.def)}`,
      `速度 ${st.spd.toFixed(2)}`, `暴击 ${fmtPct(st.crit)}`
    ].map(t => `<span>${t}</span>`).join('');
  },

  renderRings() {
    const s = Game.s;
    $('rings').innerHTML = s.rings.map((r, i) => {
      if (!r) {
        if (!ringUnlocked(i, s.level)) {
          return `<div class="ring-slot locked" data-slot="${i}">
            <span class="lk">🔒</span><span class="lv">Lv${RING_OPEN_LEVEL[i]}</span></div>`;
        }
        return `<div class="ring-slot" data-slot="${i}">${i + 1}</div>`;
      }
      return `<div class="ring-slot filled" data-slot="${i}" data-ring="1">
        <svg viewBox="0 0 40 40" class="spin">
          <circle cx="20" cy="20" r="14.5" fill="none" stroke="${r.color}" stroke-width="4.5"
            opacity=".92" style="filter:drop-shadow(0 0 4px ${r.glow})"/>
        </svg>
        <span class="rk">${i + 1}</span>
      </div>`;
    }).join('');
    document.querySelectorAll('#rings .ring-slot').forEach(el => {
      const i = +el.dataset.slot;
      el.onmouseenter = e => this.showRingTip(e, s.rings[i]);
      el.onmouseleave = () => this.tip.style.display = 'none';
      el.onclick = () => {
        const r = s.rings[i];
        if (!r) return;
        if (confirm(`剥离第 ${i + 1} 魂环【${r.name}】？`)) { Game.removeRing(i); this.renderAll(); }
      };
    });
  },

  showRingTip(e, r) {
    if (!r) { this.tip.style.display = 'none'; return; }
    const aff = (r.affixes || []).map(a => `${a.name} +${fmtPct(a.val)}`).join('　');
    this.tip.innerHTML = `<h5 style="color:${r.color}">${r.name}</h5>
      <div class="row">年份：<b>${fmtNum(r.year)}</b>　品质：${'★'.repeat(r.star)}</div>
      <div class="row">生命 <b>+${fmtPct(r.hpP)}</b>　攻击 <b>+${fmtPct(r.atkP)}</b>　防御 <b>+${fmtPct(r.defP)}</b></div>
      <div class="row" style="margin-top:3px">${aff}</div>
      <div class="row" style="margin-top:3px;color:#8a86a3">来源：${r.beast}${r.boss ? '（BOSS）' : ''}　点击可剥离</div>`;
    this.tip.style.display = 'block';
    const x = clamp(e.clientX + 14, 8, window.innerWidth - 266);
    const y = clamp(e.clientY + 14, 8, window.innerHeight - 130);
    this.tip.style.left = x + 'px';
    this.tip.style.top = y + 'px';
  },

  renderBattle(force) {
    const t = Game.t, s = Game.s;
    if (!t) return;
    const e = t.enemy;
    const tier = tierOfYear(e.year);
    $('enemyName').innerHTML = `${e.name}${e.isBoss ? ' <span class="badge">BOSS</span>' : ''} <small>${tier.name}·约${fmtNum(e.year)}年</small>`;
    $('spriteE').textContent = e.isBoss ? '王' : e.name.slice(0, 1);
    $('spriteE').classList.toggle('boss', e.isBoss);
    $('spriteP').textContent = s.name.slice(0, 1);
    if (this._wbadge !== s.wuhunId) {
      this._wbadge = s.wuhunId;
      $('wuhunBadge').innerHTML = WUHUN_ART[s.wuhunId] || '';
    }
    const rr = ctx_realmOf(s.level);
    $('heroName2').innerHTML = `${s.name} <small>${rr.name}${s.godLv ? ' · 神位' + s.godLv : ''}</small>`;
    const pe = clamp(e.hp / e.maxHp * 100, 0, 100);
    const pp = clamp(t.php / t.pmaxHp * 100, 0, 100);
    $('ehp').style.width = pe + '%';
    $('ehpTxt').textContent = `${fmtNum(Math.max(0, e.hp))} / ${fmtNum(e.maxHp)}`;
    $('php').style.width = pp + '%';
    $('phpTxt').textContent = `${fmtNum(Math.max(0, t.php))} / ${fmtNum(t.pmaxHp)}`;

    const m = $('deadMask');
    if (t.dead > 0) {
      m.style.display = 'grid';
      $('deadTxt').textContent = `疗伤中 ${t.dead.toFixed(1)} 秒`;
    } else if (m.style.display !== 'none') {
      m.style.display = 'none';
    }
  },

  renderArea() {
    const s = Game.s, a = Game.area();
    $('areaName').textContent = a.name;
    $('areaTag').textContent = `推荐 Lv.${a.lv} · ${a.tag}`;
    $('areaDesc').textContent = a.desc;
    $('areaWave').textContent = `第 ${Math.min(s.wave + 1, 10)} / 10 波`;
    $('waves').innerHTML = Array.from({ length: 10 }, (_, i) => {
      const cls = i < s.wave ? 'done' : (i === s.wave ? (i === 9 ? 'cur boss' : 'cur') : (i === 9 ? 'boss' : ''));
      return `<div class="wave ${cls}"></div>`;
    }).join('');
  },

  renderAreas() {
    const s = Game.s;
    $('areaSel').innerHTML = AREAS.map((a, i) => {
      const locked = i > s.maxArea;
      return `<button data-i="${i}" class="${locked ? 'lock' : ''} ${i === s.area ? 'on' : ''}" ${locked ? 'disabled' : ''}>${a.name.replace(' · ', '·')}</button>`;
    }).join('');
    document.querySelectorAll('#areaSel button').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.i;
        if (i > s.maxArea) return;
        s.area = i; s.wave = 0; s.deathStreak = 0;
        Game.resetBattle(false);
        this.renderAreas(); this.renderArea();
        this.toast('前往 ' + AREAS[i].name);
      };
    });
  },

  paintAuto() {
    const a = Game.s.auto;
    const m = { btnTrain: 'train', btnBattle: 'battle', btnRing: 'ring', btnAdvance: 'advance', btnRetreat: 'retreat', btnSell: 'sell' };
    Object.keys(m).forEach(id => {
      const el = $(id);
      if (el) el.classList.toggle('on', !!a[m[id]]);
    });
  },
  paintSpeed() {
    document.querySelectorAll('.speed button').forEach(b => b.classList.toggle('on', +b.dataset.s === Game.s.speed));
  },

  /* ===== 标签页 ===== */
  renderTab(which) {
    const cur = which || (document.querySelector('.tabbtn.on') || {}).dataset?.page;
    if (!cur || cur === 'home') return;
    if (cur === 'tabBag') this.renderBag();
    if (cur === 'tabBone') this.renderBones();
    if (cur === 'tabWuhun') this.renderWuhunTab();
    if (cur === 'tabMore') { this.renderAch(); this.renderSys(); }
  },

  renderBag() {
    const s = Game.s;
    const box = $('bagList');
    if (!s.bag.length) { box.innerHTML = `<div class="empty">尚无多余魂环。猎杀魂兽或前往猎魂商会购买。</div>`; return; }
    const list = s.bag.slice().sort((a, b) => b.year - a.year);
    box.innerHTML = list.map(r => {
      const idx = s.bag.indexOf(r);
      const aff = (r.affixes || []).map(a => `${a.name}+${fmtPct(a.val)}`).join(' ');
      const fitSlot = SLOT_BEST_TIER.findIndex(t => t === r.tier);
      return `<div class="item">
        <div class="t" style="color:${r.color}">${'★'.repeat(r.star)} ${r.tierName}魂环 <span class="y">${fmtNum(r.year)}年</span></div>
        <div class="af">生命 <b>+${fmtPct(r.hpP)}</b>　攻击 <b>+${fmtPct(r.atkP)}</b>　防御 <b>+${fmtPct(r.defP)}</b></div>
        <div class="af">${aff}</div>
        <div class="af">来源：${r.beast}</div>
        <div class="acts">
          <button class="btn sm gold" data-abs="${idx}">吸收</button>
          <button class="btn sm" data-abs="${idx}" data-slot="${fitSlot}">装到槽${fitSlot + 1}</button>
          <button class="btn sm danger" data-melt="${idx}">分解(+${1 + r.tier}碎片)</button>
        </div>
      </div>`;
    }).join('');
    box.querySelectorAll('[data-abs]').forEach(b => {
      b.onclick = () => {
        Game.absorbRing(+b.dataset.abs, b.dataset.slot !== undefined && b.dataset.slot !== '-1' ? +b.dataset.slot : undefined);
        this.renderBag(); this.renderRings(); this.renderHero(); this.renderStats();
      };
    });
    box.querySelectorAll('[data-melt]').forEach(b => {
      b.onclick = () => {
        const r = s.bag.splice(+b.dataset.melt, 1)[0];
        s.shards += 1 + r.tier;
        this.renderBag(); this.toast(`分解获得 ${1 + r.tier} 魂骨碎片`);
      };
    });
  },

  renderBones() {
    const s = Game.s;
    $('boneShards').textContent = fmtNum(s.shards);
    const sh = Game.temperShard(), co = Game.temperCoin();
    $('temperInfo').innerHTML = `当前 <b style="color:var(--gold)">${s.temper}</b> 重（全属性 ×${Math.pow(1.02, s.temper).toFixed(2)}）　本次消耗 <b>${fmtNum(sh)}</b> 碎片 + <b>${fmtNum(co)}</b> 魂币`;
    const tb = $('btnTemper');
    tb.disabled = s.shards < sh || s.coin < co;
    if (!tb._b) { tb._b = 1; tb.onclick = () => { Game.doTemper(); this.renderBones(); this.renderStats(); }; }
    $('slots').innerHTML = BONE_SLOTS.map(bs => {
      const b = s.bones[bs.key];
      if (!b) return `<div class="slot"><h6>${bs.name}</h6><div class="af">未装备</div></div>`;
      const aff = (b.affixes || []).map(a => `${a.name}+${fmtPct(a.val)}`).join('　');
      const k = 1 + b.lv * 0.22;
      const cost = Math.floor(30 * Math.pow(1.65, b.lv));
      return `<div class="slot has">
        <h6>${bs.name}${b.lv > 0 ? ` <span class="badge">+${b.lv}</span>` : ''}</h6>
        <div class="nm">${b.name}</div>
        <div class="af">生命 <b>+${fmtPct(bs.base.hp * k * b.q)}</b>　攻击 <b>+${fmtPct(bs.base.atk * k * b.q)}</b></div>
        <div class="af">防御 <b>+${fmtPct(bs.base.def * k * b.q)}</b>　速度 <b>+${fmtPct(bs.base.spd * k * b.q)}</b></div>
        <div class="af">${aff}</div>
        <div class="acts">
          <button class="btn sm gold" data-up="${bs.key}">强化(${cost}币/${2 + b.lv}片)</button>
          <button class="btn sm danger" data-off="${bs.key}">卸下</button>
        </div>
      </div>`;
    }).join('');
    $('slots').querySelectorAll('[data-up]').forEach(b => b.onclick = () => { Game.upgradeBone(b.dataset.up); this.renderBones(); this.renderStats(); });
    $('slots').querySelectorAll('[data-off]').forEach(b => b.onclick = () => { Game.unequipBone(b.dataset.off); this.renderBones(); this.renderStats(); });

    const bag = $('boneBag');
    if (!s.boneBag.length) bag.innerHTML = `<div class="empty">击败区域 BOSS 有概率掉落魂骨</div>`;
    else bag.innerHTML = s.boneBag.map((b, i) => {
      const aff = (b.affixes || []).map(a => `${a.name}+${fmtPct(a.val)}`).join('　');
      return `<div class="item">
        <div class="t">${b.name} <span class="y">品质 ${b.q}</span></div>
        <div class="af">${BONE_SLOTS.find(x => x.key === b.slot).name}</div>
        <div class="af">${aff}</div>
        <div class="acts"><button class="btn sm gold" data-eq="${i}">装备</button>
        <button class="btn sm danger" data-bm="${i}">分解(+${3 + b.area})</button></div>
      </div>`;
    }).join('');
    bag.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { Game.equipBone(+b.dataset.eq); this.renderBones(); this.renderStats(); });
    bag.querySelectorAll('[data-bm]').forEach(b => b.onclick = () => { const x = s.boneBag.splice(+b.dataset.bm, 1)[0]; s.shards += 3 + x.area; this.renderBones(); });
  },

  renderWuhunTab() {
    const s = Game.s, w = Game.wuhun();
    const q = Game.quality();
    $('wuhunNow').innerHTML = `
      <div class="slots"><div class="slot has">
        <h6>当前武魂</h6>
        <div class="wh-row"><div class="wh-art lg">${WUHUN_ART[w.id] || ''}</div>
        <div class="nm">${w.name} <span class="q${s.quality}">【${q.name}】</span></div></div>
        <div class="af">类型：${w.type}　成长倍率：<b>×${q.mul}</b></div>
        <div class="af">生命×${w.growth.hp}　攻击×${w.growth.atk}　防御×${w.growth.def}　速度×${w.growth.spd}</div>
        <div class="af" style="margin-top:4px">${w.desc}</div>
      </div></div>`;
    const cost = Game.awakeCost();
    const rate = [0, 0.55, 0.35, 0.22][s.quality];
    $('awakeInfo').innerHTML = s.quality >= 4
      ? `<span style="color:var(--gold)">武魂已至神品，觉醒圆满</span>`
      : `本次消耗 <b style="color:var(--gold)">${fmtNum(cost)}</b> 魂币，成功率 <b style="color:var(--cyan)">${(rate * 100).toFixed(0)}%</b>（失败仅损魂币）`;
    const btn = $('btnAwake');
    btn.disabled = s.quality >= 4 || s.coin < cost;
    btn.textContent = s.quality >= 4 ? '已圆满' : '武魂觉醒';
    if (!btn._b) { btn._b = 1; btn.onclick = () => { Game.awaken(); this.renderWuhunTab(); this.renderStats(); }; }

    $('btnBuyRing').onclick = () => { Game.buyRing(); this.renderBag(); this.renderWuhunTab(); this.renderHero(); };
    $('shopCost').textContent = fmtNum(Game.shopRingCost());

    const rc = Math.floor(800 * Math.pow(3, s.rebirth));
    $('btnReWuhun').textContent = `重塑武魂（${fmtNum(rc)} 魂币）`;
    $('wuhunPick').innerHTML = WUHUN_LIST.map(x => `
      <div class="wuhun-card ${x.id === s.wuhunId ? 'sel' : ''}" data-id="${x.id}">
        <div class="wh-art">${WUHUN_ART[x.id] || ''}</div>
        <h4 class="q${x.rarity}">${x.name}</h4>
        <div class="ty">${x.type}</div>
        <div class="ds">${x.desc}</div>
        <div class="gr"><span>攻 <b>${x.growth.atk}</b></span><span>血 <b>${x.growth.hp}</b></span><span>防 <b>${x.growth.def}</b></span><span>速 <b>${x.growth.spd}</b></span></div>
      </div>`).join('');
    $('wuhunPick').querySelectorAll('[data-id]').forEach(c => {
      c.onclick = () => {
        if (c.dataset.id === s.wuhunId) return;
        if (!confirm(`重塑武魂为【${WUHUN_LIST.find(x => x.id === c.dataset.id).name}】？消耗 ${fmtNum(rc)} 魂币`)) return;
        Game.changeWuhun(c.dataset.id);
        this.renderWuhunTab(); this.renderAll();
      };
    });
  },

  renderAch() {
    const s = Game.s;
    $('achList').innerHTML = ACHIEVEMENTS.map(a => `
      <div class="ach ${s.ach[a.id] ? 'got' : ''}"><b>${s.ach[a.id] ? '✦ ' : '　'}${a.name}</b><small>${a.desc}</small></div>`).join('');
    $('statList').innerHTML = `
      <div class="sysrow"><span class="l">累计击杀<small>魂兽数量</small></span><b>${fmtNum(s.stat.kills)}</b></div>
      <div class="sysrow"><span class="l">BOSS 击杀<small>通关次数</small></span><b>${fmtNum(s.stat.bossKills)}</b></div>
      <div class="sysrow"><span class="l">累计伤害<small>造成的总输出</small></span><b>${fmtNum(s.stat.dmg)}</b></div>
      <div class="sysrow"><span class="l">获得魂环<small>含已吸收</small></span><b>${fmtNum(s.stat.ringGet)}</b></div>
      <div class="sysrow"><span class="l">阵亡次数<small>疗伤记录</small></span><b>${fmtNum(s.stat.deaths)}</b></div>
      <div class="sysrow"><span class="l">游戏时长<small>在线挂机</small></span><b>${fmtTime(s.stat.play)}</b></div>
      <div class="sysrow"><span class="l">转生次数<small>轮回重修</small></span><b>${s.rebirth}</b></div>`;
  },

  renderSys() {
    const s = Game.s;
    const sw = (key, label, desc) => `
      <div class="sysrow">
        <span class="l">${label}<small>${desc}</small></span>
        <span class="switch ${s.auto[key] ? 'on' : ''}" data-sw="${key}"><i></i></span>
      </div>`;
    $('autoList').innerHTML =
      sw('train', '自动修炼', '每秒自动累积魂力经验') +
      sw('battle', '自动猎魂', '自动与魂兽战斗并拾取掉落') +
      sw('ring', '自动吸收魂环', '卡境界时自动吸收背包最优魂环') +
      sw('advance', '自动推进区域', '通关后自动前往下一区域') +
      sw('retreat', '自动退守', '连续阵亡 3 次自动退回上一区域') +
      sw('sell', '自动分解', '背包魂环超过 12 个时分解最低年份');
    $('autoList').querySelectorAll('[data-sw]').forEach(el => {
      el.onclick = () => { s.auto[el.dataset.sw] = !s.auto[el.dataset.sw]; this.renderSys(); this.paintAuto(); };
    });

    const rb = $('btnRebirth');
    const gain = Game.rebirthGain();
    rb.disabled = !Game.canRebirth();
    $('rebirthInfo').innerHTML = Game.canRebirth()
      ? `当前 ${s.level} 级可转生，折算 <b style="color:var(--gold)">${gain}</b> 层魂力。转生后等级/魂环重置，永久全属性 +18%、经验 +25%，保留魂币、魂骨、成就。`
      : `<span style="color:var(--orange)">需魂力达到 60 级（魂帝）方可轮回，当前 ${s.level} 级</span>`;
    if (!rb._b) { rb._b = 1; rb.onclick = () => { if (confirm('确定进行轮回转生？等级与魂环将重置。')) Game.doRebirth(); }; }

    if (!$('btnExport')._b) {
      $('btnExport')._b = 1;
      $('btnExport').onclick = () => {
        const txt = btoa(unescape(encodeURIComponent(JSON.stringify(Game.s))));
        $('saveText').value = txt;
        $('saveText').select();
        try { document.execCommand('copy'); this.toast('存档已复制到剪贴板'); } catch (e) { this.toast('已生成存档码，请手动复制'); }
      };
      $('btnImport').onclick = () => {
        const v = $('saveText').value.trim();
        if (!v) return this.toast('请先粘贴存档码');
        try {
          const d = JSON.parse(decodeURIComponent(escape(atob(v))));
          localStorage.setItem('douluo_idle_save_v1', JSON.stringify(d));
          location.reload();
        } catch (e) { this.toast('存档码无效'); }
      };
      $('btnReset').onclick = () => {
        if (confirm('确定删档重来？所有进度将清空。')) { Game.reset(); location.reload(); }
      };
    }
  },

  renderAll() {
    this.renderHero(); this.renderStats(); this.renderRings();
    this.renderArea(); this.renderAreas(); this.paintAuto(); this.paintSpeed();
    this.renderTab();
  },

  /* ===== 开局选武魂 ===== */
  showStart() {
    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal">
      <h2>武魂觉醒</h2>
      <p class="lead">选择你的武魂 —— 它将决定你在这片大陆的修炼之路</p>
      <div class="wuhun-grid" id="pickGrid"></div>
      <div class="center mt">
        <button class="btn primary" id="btnRandom">随机觉醒（推荐）</button>
      </div>
      <p class="hint mt center">游戏全自动：自动修炼、自动猎魂、自动吸收魂环、自动突破境界。你只需偶尔做几次关键抉择。</p>
    </div>`;
    document.body.appendChild(m);
    const grid = m.querySelector('#pickGrid');
    grid.innerHTML = WUHUN_LIST.map(x => `
      <div class="wuhun-card" data-id="${x.id}">
        <div class="wh-art">${WUHUN_ART[x.id] || ''}</div>
        <h4 class="q${x.rarity}">${x.name}</h4>
        <div class="ty">${x.type}</div>
        <div class="ds">${x.desc}</div>
        <div class="gr"><span>攻 <b>${x.growth.atk}</b></span><span>血 <b>${x.growth.hp}</b></span><span>防 <b>${x.growth.def}</b></span><span>速 <b>${x.growth.spd}</b></span></div>
      </div>`).join('');
    const start = id => {
      Game.init(id);
      m.remove();
      this.pushLogsFromState();
      this.renderAll();
      this.toast('觉醒成功，开始修炼！');
    };
    grid.querySelectorAll('[data-id]').forEach(c => c.onclick = () => start(c.dataset.id));
    m.querySelector('#btnRandom').onclick = () => start(pick(WUHUN_LIST).id);
  },

  /* ===== 离线收益 ===== */
  showOffline(o) {
    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal">
      <h2>离线修炼</h2>
      <p class="lead">你离开了 ${fmtTime(o.sec)}${o.capped ? `（收益上限 ${OFFLINE_CAP_H} 小时）` : ''}，魂力仍在自行运转</p>
      <div class="offline-list">
        <div><span>魂力经验</span><b>+${fmtNum(o.exp)}</b></div>
        <div><span>魂币</span><b>+${fmtNum(o.coin)}</b></div>
        <div><span>击杀魂兽</span><b>${fmtNum(o.kills)} 只</b></div>
        ${o.lvGain > 0 ? `<div><span>等级提升</span><b>+${o.lvGain} 级</b></div>` : ''}
      </div>
      <div class="center"><button class="btn gold" id="okOff">继续修炼</button></div>
    </div>`;
    document.body.appendChild(m);
    m.querySelector('#okOff').onclick = () => { m.remove(); this.renderAll(); };
  },

  showHelp() {
    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal">
      <h2>修炼指南</h2>
      <p class="lead">斗罗大陆 · 自动修炼</p>
      <div class="sysrow"><span class="l"><b>核心循环</b><small>自动战斗中击杀魂兽 → 获得经验与魂环 → 魂力满自动升级 → 每 10 级需吸收魂环突破境界 → 通关区域解锁更强魂兽</small></span></div>
      <div class="sysrow"><span class="l"><b>境界体系</b><small>魂士 → 魂师 → 大魂师 → 魂尊 → 魂宗 → 魂王 → 魂帝 → 魂圣 → 魂斗罗 → 封号斗罗 → 神祇（100 级）</small></span></div>
      <div class="sysrow"><span class="l"><b>魂环</b><small>年份越高加成越大；装到推荐槽位（第 1-2 环百年、3-4 千年、5-7 万年、8 十万年、9 百万年）额外 +35%</small></span></div>
      <div class="sysrow"><span class="l"><b>卡级怎么办</b><small>每 9 级（9/19/29…）需魂环才能突破。去刷 BOSS 必掉魂环，或在「武魂」页用魂币购买</small></span></div>
      <div class="sysrow"><span class="l"><b>魂骨</b><small>击败 BOSS 掉落，可消耗碎片与魂币强化</small></span></div>
      <div class="sysrow"><span class="l"><b>轮回</b><small>60 级后可转生，等级魂环重置，换取永久属性与经验加成，是长线变强的核心</small></span></div>
      <div class="sysrow"><span class="l"><b>离线</b><small>关掉页面也会继续修炼，最多累计 ${OFFLINE_CAP_H} 小时，效率 60%</small></span></div>
      <div class="center mt"><button class="btn gold" id="okH">明白了</button></div>
    </div>`;
    document.body.appendChild(m);
    m.querySelector('#okH').onclick = () => m.remove();
  }
};
