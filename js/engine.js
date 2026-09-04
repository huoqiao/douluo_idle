/* ============================================================
 *  斗罗大陆 · 自动修炼  —— 核心引擎
 *  状态 / 属性 / 挂机战斗 / 突破 / 掉落 / 存档 / 离线收益
 * ============================================================ */

const SAVE_KEY = 'douluo_idle_save_v1';
const OFFLINE_CAP_H = 8;      // 离线收益上限（小时）
const OFFLINE_EFF = 0.6;      // 离线效率

/* ---------- 工具 ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function fmtNum(n) {
  n = Number(n) || 0;
  const abs = Math.abs(n);
  if (abs < 10000) return abs < 10 && n % 1 !== 0 ? n.toFixed(1) : String(Math.round(n));
  if (abs < 1e8) return (n / 1e4).toFixed(2) + '万';
  if (abs < 1e12) return (n / 1e8).toFixed(2) + '亿';
  if (abs < 1e16) return (n / 1e12).toFixed(2) + '兆';
  return (n / 1e16).toFixed(2) + '京';
}
function fmtPct(v) { return (v * 100).toFixed(v * 100 < 10 ? 1 : 0) + '%'; }
function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return (h > 0 ? h + '时' : '') + (h > 0 || m > 0 ? m + '分' : '') + s + '秒';
}

/* ---------- 极简事件总线 ---------- */
const Bus = {
  map: {},
  on(ev, fn) { (this.map[ev] = this.map[ev] || []).push(fn); },
  emit(ev, data) { (this.map[ev] || []).forEach(fn => fn(data)); }
};

/* ---------- 新档 ---------- */
function createState(wuhunId, name) {
  return {
    v: 2,
    created: Date.now(),
    lastSave: Date.now(),
    name: name || (pick(NAME_POOL_A) + pick(NAME_POOL_B)),
    wuhunId: wuhunId || pick(WUHUN_LIST).id,
    quality: 1,                 // 武魂品质 1-4
    innate: rndInt(1, 10),      // 先天魂力 1-10（修炼天赋，决定修炼速度与综合战力）
    level: 1,
    exp: 0,
    godLv: 0,                   // 神位重数（满级后继续成长）
    godExp: 0,
    rings: [null, null, null, null, null, null, null, null, null],
    bag: [],                    // 未吸收魂环
    bones: { head: null, torso: null, larm: null, rarm: null, lleg: null, rleg: null, external: null },
    boneBag: [],
    shards: 0,
    temper: 0,                  // 魂骨淬体重数（永久属性加成）
    coin: 500,
    rebirth: 0,                 // 转生次数
    area: 0,
    wave: 0,
    maxArea: 0,
    deathStreak: 0,
    auto: { train: true, battle: true, ring: true, advance: true, retreat: true, sell: true, bone: true },
    speed: 1,
    stat: { kills: 0, bossKills: 0, dmg: 0, play: 0, deaths: 0, ringGet: 0 },
    ach: {},
    log: []
  };
}

/* ---------- 引擎 ---------- */
const Game = {
  s: null,
  t: null,        // 战斗临时数据
  st: null,       // 属性快照
  _saveAcc: 0,
  _secAcc: 0,

  /* ===== 初始化 ===== */
  init(wuhunId, name) {
    this.s = createState(wuhunId, name);
    this.recompute();
    this.resetBattle(true);
    this.pushLog(`【武魂觉醒】${this.wuhun().name}，先天魂力 1 级，就此踏入魂师之路。`, 'sys');
    this.save();
  },

  wuhun() { return WUHUN_LIST.find(w => w.id === this.s.wuhunId) || WUHUN_LIST[0]; },
  quality() { return WUHUN_QUALITY[this.s.quality - 1] || WUHUN_QUALITY[0]; },

  /* ===== 经验曲线（指数成长） ===== */
  expNeed(lv) { return Math.floor(100 * Math.pow(1.17, lv - 1)) + 50; },
  /* 神位：100 级后的成长通道 */
  godNeed(n) { return Math.floor(this.expNeed(100) * 1.5 * Math.pow(1.28, n)); },

  /* ===== 属性重算 ===== */
  recompute() {
    const s = this.s, w = this.wuhun(), q = this.quality();
    const lv = s.level;
    const reb = 1 + s.rebirth * 0.30;                 // 转生永久加成
    const god = Math.pow(1.25, s.godLv);              // 神位加成
    const tem = Math.pow(1.02, s.temper);             // 淬体加成

    let hp  = 3500 * Math.pow(1.088, lv - 1) * w.growth.hp  * q.mul * reb * god * tem;
    let atk = 500  * Math.pow(1.085, lv - 1) * w.growth.atk * q.mul * reb * god * tem;
    let def = 250  * Math.pow(1.080, lv - 1) * w.growth.def * q.mul * reb * god * tem;
    let spd = (0.95 + lv * 0.004 + s.godLv * 0.02) * w.growth.spd;

    let crit = 0.05, critDmg = 0.5, lifesteal = 0, penetrate = 0, expRate = 0, coinRate = 0, spdPct = 0;
    let hpP = 0, atkP = 0, defP = 0;

    const addAffix = a => {
      switch (a.key) {
        case 'crit': crit += a.val; break;
        case 'critDmg': critDmg += a.val; break;
        case 'spd': spdPct += a.val; break;
        case 'lifesteal': lifesteal += a.val; break;
        case 'expRate': expRate += a.val; break;
        case 'coinRate': coinRate += a.val; break;
        case 'penetrate': penetrate += a.val; break;
      }
    };

    // 魂环
    s.rings.forEach((r, i) => {
      if (!r) return;
      const fit = (SLOT_BEST_TIER[i] !== undefined && r.tier === SLOT_BEST_TIER[i]) ? 1.35 : 1;
      hpP += r.hpP * fit; atkP += r.atkP * fit; defP += r.defP * fit;
      (r.affixes || []).forEach(addAffix);
    });

    // 魂骨
    BONE_SLOTS.forEach(bs => {
      const b = s.bones[bs.key];
      if (!b) return;
      const k = (1 + b.lv * 0.22) * b.q;
      hpP += bs.base.hp * k; atkP += bs.base.atk * k;
      defP += bs.base.def * k; spdPct += bs.base.spd * k;
      (b.affixes || []).forEach(addAffix);
    });

    // 成就加成（每个成就 +1% 全属性）
    const achK = 1 + Object.keys(s.ach).length * 0.01;

    this.st = {
      maxHp: Math.floor(hp * (1 + hpP) * achK),
      atk:   Math.floor(atk * (1 + atkP) * achK),
      def:   Math.floor(def * (1 + defP) * achK),
      spd:   spd * (1 + spdPct),
      crit: clamp(crit, 0, 0.85),
      critDmg: critDmg,
      lifesteal: clamp(lifesteal, 0, 0.6),
      penetrate: clamp(penetrate, 0, 0.85),
      expRate: expRate,
      coinRate: coinRate,
      power: 0
    };
    // 综合战力：生命/攻击/防御/暴击/速度综合评估，并计入先天魂力天赋
    const inn = 1 + (s.innate - 1) * 0.07;
    this.st.power = Math.floor((
      this.st.maxHp * 0.30 +
      this.st.atk * 7.0 +
      this.st.def * 4.0 +
      this.st.atk * this.st.crit * this.st.critDmg * 4 +
      this.st.spd * 40
    ) * inn);

    // 同步战斗血量
    if (this.t) {
      const ratio = this.t.php / this.t.pmaxHp || 1;
      this.t.pmaxHp = this.st.maxHp;
      this.t.php = Math.min(this.st.maxHp, Math.max(1, this.t.pmaxHp * ratio));
    }
    return this.st;
  },

  /* ===== 减伤率：与双方数值量级无关，自缩放 ===== */
  reduce(defV, atkSrc) { return defV / (defV + atkSrc * 2.2 + 500); },

  /* ===== 当前区域 ===== */
  area() { return AREAS[this.s.area] || AREAS[0]; },

  /* ===== 敌人数值（不含随机名） ===== */
  statEnemy(areaIdx, wave) {
    const a = AREAS[areaIdx] || AREAS[0];
    const isBoss = wave >= 9;
    return {
      isBoss,
      hp: a.hp * (1 + wave * 0.32) * (isBoss ? a.boss.hpMul : 1),
      atk: a.atk * (1 + wave * 0.24) * (isBoss ? a.boss.atkMul : 1),
      def: a.def * (1 + wave * 0.20),
      spd: a.spd * (isBoss ? 1.1 : 1)
    };
  },

  /* 预计击杀耗时（秒）= 需要的攻击次数 × 攻击间隔（含暴击与魂技期望） */
  killTime(areaIdx, wave) {
    const e = this.statEnemy(areaIdx, wave);
    const per = this.st.atk
      * (1 - this.reduce(e.def * (1 - this.st.penetrate), this.st.atk))
      * (1 + this.st.crit * this.st.critDmg) * 1.12;
    if (!(per > 0)) return Infinity;
    return Math.max(1, Math.ceil(e.hp / per)) * (0.9 / this.st.spd);
  },

  /* 预计存活时间（秒） */
  surviveTime(areaIdx, wave) {
    const e = this.statEnemy(areaIdx, wave);
    const dps = e.atk * (1 - this.reduce(this.st.def, e.atk)) * e.spd;
    return dps <= 0 ? Infinity : this.st.maxHp / dps;
  },

  /* ===== 生成敌人 ===== */
  makeEnemy(areaIdx, wave) {
    const a = AREAS[areaIdx] || AREAS[0];
    const v = this.statEnemy(areaIdx, wave);
    return {
      name: v.isBoss ? a.boss.name : pick(a.mobs),
      isBoss: v.isBoss,
      maxHp: Math.floor(v.hp), hp: Math.floor(v.hp),
      atk: Math.floor(v.atk), def: Math.floor(v.def),
      spd: v.spd,
      wave,
      year: Math.floor(rnd(a.yearMin, a.yearMax) * (v.isBoss ? a.boss.yearMul : 1))
    };
  },

  resetBattle(full) {
    const s = this.s;
    // BOSS 前的实力评估：打不过就回去刷普通怪
    if (s.wave >= 9 && s.auto.retreat) {
      const kt = this.killTime(s.area, 9), sv = this.surviveTime(s.area, 9);
      if (!(kt < 30 && sv > kt * 1.3)) {
        if (!this._bossWarn || this._bossWarn !== s.area + '-' + Math.floor(Date.now() / 60000)) {
          this._bossWarn = s.area + '-' + Math.floor(Date.now() / 60000);
          this.pushLog(`【${AREAS[s.area].boss.name}】气息太强，暂不可敌，继续在本区历练。`, 'warn');
        }
        s.wave = 0;
      }
    }
    const e = this.makeEnemy(s.area, s.wave);
    this.t = {
      enemy: e,
      php: this.st ? this.st.maxHp : 100,
      pmaxHp: this.st ? this.st.maxHp : 100,
      pAtkTime: 0.4, eAtkTime: 1.0 / e.spd,
      dead: 0
    };
    if (full) this.t.php = this.st.maxHp;
  },

  /* ===== 主循环 ===== */
  loop(rawDt) {
    const s = this.s;
    const dt = Math.min(rawDt, 1) * s.speed;
    s.stat.play += rawDt;

    if (this.t.dead > 0) {
      this.t.dead -= dt;
      if (this.t.dead <= 0) { this.t.php = this.st.maxHp; this.resetBattle(false); }
      return;
    }

    if (s.auto.battle) this.battleTick(dt);
    if (s.auto.train) this.trainTick(dt);

    this._secAcc += rawDt;
    if (this._secAcc >= 1) { this._secAcc -= 1; this.secondTick(); }
    this._saveAcc += rawDt;
    if (this._saveAcc >= 5) { this._saveAcc = 0; this.save(); }
  },

  /* ===== 修炼：收益锚定当前区域的实战产出，避免脱离战斗独自膨胀 ===== */
  trainTick(dt) {
    const s = this.s;
    const a = this.area();
    const kt = Math.max(this.killTime(s.area, s.wave), 0.4);
    const fight = a.exp * (1 + s.wave * 0.30) / kt;      // 战斗每秒经验
    const gain = fight * 0.25 * (1 + this.st.expRate) * (1 + s.rebirth * 0.25) * (1 + (s.innate - 1) * 0.07) * dt;
    if (s.level < 100) s.exp += gain; else s.godExp += gain;
    this.checkLevel();
  },

  /* ===== 战斗 ===== */
  battleTick(dt) {
    const t = this.t;
    if (t.php < t.pmaxHp) t.php = Math.min(t.pmaxHp, t.php + t.pmaxHp * 0.06 * dt);
    t.pAtkTime -= dt;
    if (t.pAtkTime <= 0) {
      t.pAtkTime += 0.9 / this.st.spd;
      this.playerAttack();
      if (t.enemy.hp <= 0) { this.onEnemyDead(); return; }
    }
    t.eAtkTime -= dt;
    if (t.eAtkTime <= 0) {
      t.eAtkTime += 1.0 / t.enemy.spd;
      this.enemyAttack();
    }
  },

  playerAttack() {
    const s = this.s, t = this.t, st = this.st;
    const ringN = s.rings.filter(Boolean).length;
    let skill = null, mult = 1;
    if (ringN > 0 && Math.random() < 0.10 + ringN * 0.06) {
      const idx = rndInt(0, ringN - 1);
      skill = this.wuhun().skills[Math.min(idx, 8)];
      mult = 1.7 + idx * 0.35 + (s.rings[idx] ? s.rings[idx].tier * 0.25 : 0);
    }
    const isCrit = Math.random() < st.crit;
    let dmg = st.atk * mult *
      (1 - this.reduce(t.enemy.def * (1 - st.penetrate), st.atk)) *
      (isCrit ? 1 + st.critDmg : 1) * rnd(0.92, 1.08);
    dmg = Math.max(1, Math.floor(dmg));
    t.enemy.hp -= dmg;
    s.stat.dmg += dmg;
    if (st.lifesteal > 0) t.php = Math.min(t.pmaxHp, t.php + dmg * st.lifesteal);
    Bus.emit('hit', { side: 'player', dmg, crit: isCrit, skill });
  },

  enemyAttack() {
    const s = this.s, t = this.t;
    let dmg = t.enemy.atk * (1 - this.reduce(this.st.def, t.enemy.atk)) * rnd(0.9, 1.1);
    dmg = Math.max(1, Math.floor(dmg));
    t.php -= dmg;
    Bus.emit('hit', { side: 'enemy', dmg, crit: false });
    if (t.php <= 0) this.onPlayerDead();
  },

  onPlayerDead() {
    const s = this.s, t = this.t;
    s.stat.deaths++; s.deathStreak++;
    t.php = 0;
    const lost = Math.floor(s.coin * 0.03);
    s.coin = Math.max(0, s.coin - lost);
    this.pushLog(`被【${t.enemy.name}】击倒，疗伤中${lost > 0 ? `，遗失 ${fmtNum(lost)} 魂币` : ''}。`, 'bad');
    if (s.auto.retreat && s.deathStreak >= 3 && s.area > 0) {
      s.area--; s.wave = 0; s.deathStreak = 0;
      this.pushLog(`连番受挫，自动退守【${this.area().name}】。`, 'warn');
    }
    t.dead = 3;
    Bus.emit('dead');
  },

  onEnemyDead() {
    const s = this.s, t = this.t, a = this.area(), e = t.enemy;
    s.stat.kills++; s.deathStreak = 0;

    const expGain = a.exp * (1 + e.wave * 0.30) * (1 + this.st.expRate) * (e.isBoss ? 3.5 : 1) * (1 + (s.innate - 1) * 0.07);
    if (s.level < 100) s.exp += expGain; else s.godExp += expGain;

    const coinGain = a.coin * (1 + e.wave * 0.28) * (1 + this.st.coinRate) * (e.isBoss ? 4 : 1);
    s.coin += coinGain;

    // 魂环：自动迭代，槽位满时用更高年份替换最差的一枚
    if (Math.random() < (e.isBoss ? 1 : 0.08)) {
      const r = this.makeRing(e.year, e.name, e.isBoss);
      s.stat.ringGet++;
      const slot = this.bestSlotFor(r);
      if (slot >= 0) {
        const old = s.rings[slot];
        s.rings[slot] = r;
        const better = old ? r.year > old.year * 1.2 : true;
        if (better || !old) this.pushLog(`吸收第 ${slot + 1} 魂环：${r.name}（${fmtNum(r.year)}年）`, 'ring');
        if (old) {
          if (s.auto.sell) { s.shards += 1 + old.tier; }
          else s.bag.push(old);
        }
        this.recompute();
        Bus.emit('absorb', { ring: r, slot });
      } else if (s.bag.length < 12) {
        s.bag.push(r);
        this.pushLog(`获得魂环 ${r.name}（${fmtNum(r.year)}年），已存入背包`, 'ring');
        Bus.emit('ringdrop', r);
      } else if (s.auto.sell) {
        s.shards += 1 + r.tier;
      }
    }
    // 魂骨碎片
    if (Math.random() < (e.isBoss ? 1 : 0.05)) s.shards += e.isBoss ? rndInt(3, 8) : rndInt(1, 3);

    if (e.isBoss) {
      s.stat.bossKills++;
      this.pushLog(`击败 BOSS【${e.name}】！魂币 +${fmtNum(coinGain)}`, 'boss');
      if (Math.random() < 0.35) {
        const b = this.makeBone(s.area);
        const cur = s.bones[b.slot];
        const shardOf = x => 3 + x.area;
        if (!cur && s.auto.bone) {
          s.bones[b.slot] = b;
          this.pushLog(`获得并装备魂骨：${b.name}（品质 ${b.q}）`, 'bone');
        } else if (cur && s.auto.bone && b.q > cur.q) {
          s.bones[b.slot] = b;
          if (s.auto.sell) s.shards += shardOf(cur); else s.boneBag.push(cur);
          this.pushLog(`换上更好的魂骨：${b.name}（品质 ${b.q} > ${cur.q}）`, 'bone');
        } else if (s.auto.sell || s.boneBag.length >= 12) {
          s.shards += shardOf(b);
        } else {
          s.boneBag.push(b);
          this.pushLog(`BOSS 掉落魂骨：${b.name}`, 'bone');
        }
        this.recompute();
      }
      // 通关：解锁下一区域（解锁与前往分开）
      if (s.area === s.maxArea && s.area + 1 < AREAS.length) {
        s.maxArea++;
        this.pushLog(`通关【${AREAS[s.area].name}】，解锁【${AREAS[s.maxArea].name}】！`, 'sys');
        Bus.emit('unlock', AREAS[s.maxArea]);
      }
      const nextI = s.area + 1;
      if (s.auto.advance && nextI < AREAS.length && nextI <= s.maxArea &&
          this.killTime(nextI, 0) < 3 && this.surviveTime(nextI, 9) > 20) {
        s.area = nextI;
        this.pushLog(`实力足够，自动前往【${this.area().name}】`, 'sys');
      }
      s.wave = 0;
    } else {
      s.wave++;
    }

    this.checkLevel();
    this.checkAch();
    this.resetBattle(false);
    Bus.emit('kill', e);
  },

  /* ===== 魂环生成 ===== */
  makeRing(year, beastName, isBoss) {
    year = Math.max(10, Math.floor(year));
    const tier = tierOfYear(year);
    const ti = RING_TIERS.indexOf(tier);
    const p = tier.max === Infinity ? 0.5 : (year - tier.min) / (tier.max - tier.min);
    const star = clamp(1 + Math.floor(p * 5), 1, 5);
    const affN = clamp(1 + Math.floor((ti + 1) / 2), 1, 3);
    const used = new Set(), affixes = [];
    for (let i = 0; i < affN; i++) {
      let a, guard = 0;
      do { a = pick(RING_AFFIXES); guard++; } while (used.has(a.key) && guard < 20);
      used.add(a.key);
      affixes.push({ key: a.key, name: a.name, val: (a.min + Math.random() * (a.max - a.min)) * (1 + ti * 0.3) });
    }
    return {
      id: 'r' + Date.now() + Math.floor(Math.random() * 1e4),
      year, tier: ti, tierName: tier.name, color: tier.color, glow: tier.glow,
      mul: tier.mul, star, beast: beastName, boss: !!isBoss,
      hpP: tier.mul * rnd(0.7, 1.25),
      atkP: tier.mul * rnd(0.6, 1.1),
      defP: tier.mul * rnd(0.5, 0.95),
      affixes,
      name: `${tier.name} · ${beastName}魂环`
    };
  },

  /* ===== 魂骨生成 ===== */
  makeBone(areaIdx) {
    const slot = pick(BONE_SLOTS);
    const q = +(rnd(0.8, 1.4) * (1 + areaIdx * 0.28)).toFixed(2);
    const affN = clamp(1 + Math.floor(areaIdx / 2), 1, 3);
    const used = new Set(), affixes = [];
    for (let i = 0; i < affN; i++) {
      let a, guard = 0;
      do { a = pick(RING_AFFIXES); guard++; } while (used.has(a.key) && guard < 20);
      used.add(a.key);
      affixes.push({ key: a.key, name: a.name, val: (a.min + Math.random() * (a.max - a.min)) * (1 + areaIdx * 0.35) });
    }
    return {
      id: 'b' + Date.now() + Math.floor(Math.random() * 1e4),
      slot: slot.key, name: `${pick(BONE_PREFIX)}${slot.name}`,
      q, lv: 0, affixes, area: areaIdx
    };
  },

  /* ===== 升级 / 突破 / 神位 ===== */
  checkLevel() {
    const s = this.s;
    let guard = 0;
    while (s.level < 100 && guard++ < 500) {
      const need = this.expNeed(s.level);
      if (s.exp < need) break;
      if (isBreakPoint(s.level)) {
        if (s.rings.filter(Boolean).length >= realmOf(s.level + 1).needRing) {
          // 有环，正常突破
        } else if (s.auto.ring && s.bag.length > 0) {
          this.absorbBest(); continue;
        } else {
          s.exp = need;   // 顶格等待魂环
          break;
        }
      }
      s.exp -= need;
      s.level++;
      Bus.emit('levelup', s.level);
      const r = realmOf(s.level);
      if (s.level % 10 === 0) this.pushLog(`【突破】魂力达 ${s.level} 级，晋入${r.name}！`, 'sys');
      else if (s.level % 5 === 0) this.pushLog(`魂力提升至 ${s.level} 级（${r.name}）`, 'good');
      this.recompute();
      if (s.level % 10 === 0) Bus.emit('break', r);
    }
    // 满级后转神位
    if (s.level >= 100) {
      if (s.exp > 0) { s.godExp += s.exp; s.exp = 0; }
      let g = 0;
      while (s.godExp >= this.godNeed(s.godLv) && g++ < 200) {
        s.godExp -= this.godNeed(s.godLv);
        s.godLv++;
        this.pushLog(`【神位】第 ${s.godLv} 重神位已成，全属性 ×1.25！`, 'sys');
        Bus.emit('break', { name: '第 ' + s.godLv + ' 重神位' });
        this.recompute();
      }
    }
  },

  /* 为魂环寻找最佳落位：仅限已开放槽位；优先契合的空槽，其次空槽，最后替换年份最低的一枚 */
  bestSlotFor(ring) {
    const s = this.s;
    let slot = s.rings.findIndex((x, i) => !x && SLOT_BEST_TIER[i] === ring.tier && ringUnlocked(i, s.level));
    if (slot < 0) slot = s.rings.findIndex((x, i) => !x && ringUnlocked(i, s.level));
    if (slot >= 0) return slot;
    if (!s.auto.ring) return -1;
    let low = -1, lowYear = Infinity;
    s.rings.forEach((r, i) => { if (r && ringUnlocked(i, s.level) && r.year < lowYear) { lowYear = r.year; low = i; } });
    return (low >= 0 && ring.year > lowYear) ? low : -1;
  },

  absorbBest() {
    const s = this.s;
    if (!s.bag.length) return false;
    let bi = 0;
    s.bag.forEach((r, i) => { if (r.year > s.bag[bi].year) bi = i; });
    const ring = s.bag[bi];
    let slot = s.rings.findIndex((x, i) => !x && SLOT_BEST_TIER[i] === ring.tier && ringUnlocked(i, s.level));
    if (slot < 0) slot = s.rings.findIndex((x, i) => !x && ringUnlocked(i, s.level));
    if (slot < 0) return false;
    s.bag.splice(bi, 1);
    s.rings[slot] = ring;
    this.pushLog(`吸收第 ${slot + 1} 魂环：${ring.name}`, 'ring');
    this.recompute();
    Bus.emit('absorb', { ring, slot });
    return true;
  },

  absorbRing(bagIndex, slotIndex) {
    const s = this.s;
    if (bagIndex < 0 || bagIndex >= s.bag.length) return;
    const ring = s.bag[bagIndex];
    let slot = slotIndex;
    if (slot === undefined || slot === null || slot < 0 || s.rings[slot]) slot = s.rings.findIndex((x, i) => !x && ringUnlocked(i, s.level));
    if (slot >= 0 && !ringUnlocked(slot, s.level)) {
      this.pushLog(`第 ${slot + 1} 魂环需晋入${realmOf(RING_OPEN_LEVEL[slot]).name}（Lv.${RING_OPEN_LEVEL[slot]}）方可吸收`, 'warn');
      return;
    }
    if (slot < 0) { this.pushLog('魂环槽位已满，需先剥离旧魂环。', 'warn'); return; }
    s.bag.splice(bagIndex, 1);
    s.rings[slot] = ring;
    this.pushLog(`吸收第 ${slot + 1} 魂环：${ring.name}`, 'ring');
    this.recompute();
    Bus.emit('absorb', { ring, slot });
  },

  removeRing(slotIndex) {
    const s = this.s;
    const r = s.rings[slotIndex];
    if (!r) return;
    s.rings[slotIndex] = null;
    s.bag.push(r);
    this.recompute();
    Bus.emit('absorb', { ring: null, slot: slotIndex });
  },

  equipBone(bagIndex) {
    const s = this.s;
    const b = s.boneBag[bagIndex];
    if (!b) return;
    const old = s.bones[b.slot];
    s.boneBag.splice(bagIndex, 1);
    s.bones[b.slot] = b;
    if (old) s.boneBag.push(old);
    this.recompute();
    this.pushLog(`装备 ${b.name}`, 'good');
  },

  unequipBone(slot) {
    const s = this.s;
    if (!s.bones[slot]) return;
    s.boneBag.push(s.bones[slot]);
    s.bones[slot] = null;
    this.recompute();
  },

  upgradeBone(slot) {
    const s = this.s;
    const b = s.bones[slot];
    if (!b) return;
    const cost = Math.floor(this.area().coin * 8 * Math.pow(1.7, b.lv));
    const shard = 2 + b.lv;
    if (s.shards < shard) { this.pushLog('魂骨碎片不足', 'warn'); return; }
    if (s.coin < cost) { this.pushLog('魂币不足', 'warn'); return; }
    s.shards -= shard; s.coin -= cost; b.lv++;
    this.recompute();
    this.pushLog(`${b.name} 强化至 +${b.lv}`, 'good');
  },

  /* ===== 魂骨淬体：碎片的主要出口，永久属性成长 ===== */
  temperShard() { return Math.floor(20 * Math.pow(1.35, this.s.temper)); },
  temperCoin() { return Math.floor(this.area().coin * 15 * Math.pow(1.4, this.s.temper)); },
  doTemper() {
    const s = this.s;
    const sh = this.temperShard(), co = this.temperCoin();
    if (s.shards < sh) { this.pushLog(`淬体需要 ${fmtNum(sh)} 魂骨碎片`, 'warn'); return; }
    if (s.coin < co) { this.pushLog(`淬体需要 ${fmtNum(co)} 魂币`, 'warn'); return; }
    s.shards -= sh; s.coin -= co; s.temper++;
    this.recompute();
    this.pushLog(`【淬体】第 ${s.temper} 重，全属性 +2%（累计 ×${Math.pow(1.02, s.temper).toFixed(2)}）`, 'sys');
    Bus.emit('temper');
  },

  /* ===== 武魂觉醒 ===== */
  awakeCost() { return Math.floor(this.area().exp * 40 * Math.pow(8, this.s.quality - 1)); },
  awaken() {
    const s = this.s;
    if (s.quality >= 4) { this.pushLog('武魂已至神品，觉醒圆满。', 'warn'); return; }
    const cost = this.awakeCost();
    if (s.coin < cost) { this.pushLog(`觉醒需要 ${fmtNum(cost)} 魂币`, 'warn'); return; }
    const rate = [0, 0.55, 0.35, 0.22][s.quality];
    s.coin -= cost;
    if (Math.random() < rate) {
      s.quality++;
      this.pushLog(`武魂觉醒成功！${this.wuhun().name} 晋为【${this.quality().name}】`, 'sys');
      Bus.emit('awaken', true);
    } else {
      this.pushLog(`武魂觉醒失败，魂力反噬（损失 ${fmtNum(cost)} 魂币）`, 'bad');
      Bus.emit('awaken', false);
    }
    this.recompute();
  },
  changeWuhun(id) {
    const s = this.s;
    const cost = Math.floor(this.area().exp * 20 * Math.pow(3, s.rebirth));
    if (s.coin < cost) { this.pushLog(`重塑武魂需 ${fmtNum(cost)} 魂币`, 'warn'); return; }
    s.coin -= cost;
    s.wuhunId = id;
    this.recompute();
    this.pushLog(`武魂重塑为【${this.wuhun().name}】`, 'sys');
  },

  /* ===== 猎魂商会 ===== */
  shopRingCost() {
    const a = this.area();
    return Math.floor(a.exp * 1.6);
  },
  buyRing() {
    const s = this.s;
    const cost = this.shopRingCost();
    if (s.coin < cost) { this.pushLog('魂币不足', 'warn'); return; }
    s.coin -= cost;
    const a = this.area();
    const r = this.makeRing(rnd(a.yearMin, a.yearMax), pick(a.mobs) + '·商会', false);
    s.bag.push(r);
    this.pushLog(`于猎魂商会购得 ${r.name}`, 'good');
    if (s.auto.ring) this.checkLevel();
  },

  /* ===== 每秒事务 ===== */
  secondTick() {
    const s = this.s;
    // 卡境界自动吸环
    if (s.auto.ring) {
      let g = 0;
      while (s.bag.length && isBreakPoint(s.level) &&
             s.rings.filter(Boolean).length < realmOf(s.level + 1).needRing && g++ < 20) {
        if (!this.absorbBest()) break;
      }
      // 槽位有空（且已开放）且背包充裕时，优先吸收年份最低的
      const empty = s.rings.findIndex((x, i) => !x && ringUnlocked(i, s.level));
      if (empty >= 0 && s.bag.length >= 3) {
        let li = 0;
        s.bag.forEach((r, i) => { if (r.year < s.bag[li].year) li = i; });
        this.absorbRing(li, empty);
      }
    }
    // 自动分解多余魂环
    if (s.auto.sell && s.bag.length > 8) {
      for (let k = 0; k < 3 && s.bag.length > 8; k++) {
        let li = 0;
        s.bag.forEach((r, i) => { if (r.year < s.bag[li].year) li = i; });
        const r = s.bag.splice(li, 1)[0];
        s.shards += 1 + r.tier;
      }
      this.pushLog(`背包已满，自动分解多余魂环，+碎片`, 'warn');
    }
    // 自动前进：当前区域已碾压则前往下一区域
    if (s.auto.advance && s.area < s.maxArea) {
      const kt = this.killTime(s.area, 0);
      if (kt < 0.8 && this.surviveTime(s.area + 1, 9) > 20) {
        s.area++; s.wave = 0; s.deathStreak = 0;
        this.resetBattle(false);
        this.pushLog(`本区已无敌手，自动前往【${this.area().name}】`, 'sys');
        Bus.emit('area', s.area);
      }
      else if (s.area > 0 && this.surviveTime(s.area, 0) < 4) {
        s.area--; s.wave = 0; s.deathStreak = 0;
        this.resetBattle(false);
        this.pushLog(`力有不逮，退守【${this.area().name}】`, 'warn');
        Bus.emit('area', s.area);
      }
    }
    this.checkAch();
  },

  /* ===== 成就 ===== */
  checkAch() {
    const s = this.s;
    ACHIEVEMENTS.forEach(a => {
      if (!s.ach[a.id] && a.check(s)) {
        s.ach[a.id] = Date.now();
        this.pushLog(`【成就达成】${a.name} —— ${a.desc}（全属性 +1%）`, 'sys');
        Bus.emit('ach', a);
        this.recompute();
      }
    });
  },

  title() {
    let t = TITLES[0];
    TITLES.forEach(x => { if (this.st && this.st.power >= x.need) t = x; });
    return t;
  },

  /* ===== 转生 ===== */
  canRebirth() { return this.s.level >= 60; },
  rebirthGain() { return 1 + Math.floor(this.s.level / 10) + this.s.godLv * 2; },
  doRebirth() {
    const s = this.s;
    if (!this.canRebirth()) { this.pushLog('需魂力 60 级（魂帝）以上方可轮回', 'warn'); return; }
    const g = this.rebirthGain();
    s.rebirth++;
    s.level = 1; s.exp = 0; s.godLv = 0; s.godExp = 0;
    s.area = 0; s.wave = 0; s.maxArea = 0;
    s.rings = [null, null, null, null, null, null, null, null, null];
    this.recompute();
    this.resetBattle(true);
    this.pushLog(`【轮回】神位重修，第 ${s.rebirth} 次转生！永久全属性 +30%，经验 +25%（折算 ${g} 层魂力）`, 'sys');
    Bus.emit('rebirth');
    this.save();
  },

  /* ===== 日志 ===== */
  pushLog(text, type) {
    this.s.log.unshift({ t: Date.now(), text, type: type || '' });
    if (this.s.log.length > 120) this.s.log.length = 120;
    Bus.emit('log', { text, type });
  },

  /* ===== 存档 ===== */
  save() {
    if (!this.s) return;
    this.s.lastSave = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch (e) {}
  },
  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  },
  load() {
    let raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    if (!raw) return false;
    try {
      const d = JSON.parse(raw);
      const base = createState();
      this.s = Object.assign(base, d);
      this.s.auto = Object.assign(base.auto, d.auto || {});
      this.s.stat = Object.assign(base.stat, d.stat || {});
      this.s.bones = Object.assign(base.bones, d.bones || {});
      if (!Array.isArray(this.s.rings) || this.s.rings.length !== 9) this.s.rings = base.rings;
      this.s.godLv = this.s.godLv || 0;
      this.s.temper = this.s.temper || 0;
      this.s.godExp = this.s.godExp || 0;
      this.recompute();
      this.resetBattle(true);
      return true;
    } catch (e) {
      console.error('存档损坏', e);
      return false;
    }
  },
  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  },

  /* ===== 离线收益 ===== */
  calcOffline() {
    if (!this.s) return null;
    const now = Date.now();
    let sec = (now - (this.s.lastSave || now)) / 1000;
    if (sec < 60) return null;
    const raw = sec;
    sec = Math.min(sec, OFFLINE_CAP_H * 3600);
    const eff = sec * OFFLINE_EFF;

    const a = this.area();
    // 与在线完全一致：战斗产出 + 25% 修炼加成，效率按离线系数折算
    const kt = Math.max(Math.min(this.killTime(this.s.area, this.s.wave), 60), 0.4);
    const perSec = a.exp * (1 + this.s.wave * 0.30) / kt
      * 1.25 * (1 + this.st.expRate) * (1 + this.s.rebirth * 0.25);
    const exp = perSec * eff;
    const kills = eff / kt;
    const coin = a.coin * (1 + this.s.wave * 0.28) * (1 + this.st.coinRate) * kills;
    const before = this.s.level, gBefore = this.s.godLv;
    if (this.s.level < 100) this.s.exp += exp; else this.s.godExp += exp;
    this.s.coin += coin;
    this.s.stat.kills += Math.floor(kills);
    this.checkLevel();
    this.recompute();
    this.resetBattle(true);
    return { sec: raw, capped: raw > OFFLINE_CAP_H * 3600, exp, coin, kills: Math.floor(kills),
             lvGain: this.s.level - before, godGain: this.s.godLv - gBefore };
  }
};

if (typeof module !== 'undefined') {
  module.exports = { Game, fmtNum, createState };
}
if (typeof window !== 'undefined') {
  window.Game = Game; window.fmtNum = fmtNum;
}
