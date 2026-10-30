import {
  UnitTypeCode,
  UnitInstance,
  Ability,
  FxItem,
  Particle,
  ScorchMark,
  PlayerProfile,
  CampaignMission,
} from '../types/game';
import {
  UNIT_BLUEPRINTS,
  AIR_UNITS,
  FACTION_PERKS,
  FACTION_NAMES,
  FACTION_COLORS,
} from './constants';
import { SoundEngine } from '../services/audio';

export interface MatchConfig {
  mapSize: number; // 15 or 30
  playersCount: number; // 2, 3, or 4
  humanFactions: number[]; // e.g. [0] for player vs bots, [0, 1] for hotseat, [] for spectate
  startingGold?: number[];
  playerPerks?: number[];
  customObstacles?: Array<{ x: number; y: number; type: number }>;
  customMines?: Array<{ x: number; y: number; w?: boolean }>;
  preplacedUnits?: Array<{
    t: UnitTypeCode;
    o: number;
    x: number;
    y: number;
    hp?: number;
    maxHp?: number;
    isVip?: boolean;
    isDefendTarget?: boolean;
    name?: string;
  }>;
  campaignMissionId?: string;
  campaignMission?: CampaignMission;
  isCampaign?: boolean;
  difficulty?: 'normal' | 'hard' | 'expert';
  autoDeploy?: boolean; // Instantly auto-deploy starting armies and begin combat immediately
  fogOfWar?: boolean; // Control fog of war setting
}

export class TacticalEngine {
  public N: number = 15;
  public C: number = 50; // cell dimension
  public difficulty: 'normal' | 'hard' | 'expert' = 'normal';
  public U: UnitInstance[] = [];
  public ob: number[][] = [];
  public mines: Array<{ x: number; y: number; w: boolean }> = [];
  public gold: number[] = [24, 24];
  public cur: number = 0;
  public view: number = 0;
  public ph: 'setup' | 'play' | 'over' = 'setup';
  public turn: number = 1;
  public alive: boolean[] = [true, true];
  public ctrl: boolean[] = [false, true]; // true = bot, false = human
  public NP: number = 2;
  public sel: UnitInstance | null = null;
  public sp: UnitTypeCode | null = null;
  public busy: boolean = false;
  public over: boolean = false;
  public winner: number | null = null;
  public victoryReason: string = '';
  public fogOff: boolean = false;
  public note: string = '';
  public shake: number = 0;
  public flash: number = 0;

  // Campaign Objectives Tracking
  public activeMission: CampaignMission | null = null;
  public holdoutTurnsRemaining: number = 0;
  public defendTargets: UnitInstance[] = [];
  public vipTargets: UnitInstance[] = [];
  public initialVanguardCount: number = 0;
  public vanguardDestroyedCount: number = 0;

  // Effects & Render elements
  public pt: Particle[] = [];
  public fx: FxItem[] = [];
  public scorch: ScorchMark[] = [];
  public gen: number = 0;
  public paused: boolean = false;
  public gameSpeed: number = 1;

  // Highlights
  public hl: {
    m: Map<string, { x: number; y: number; p: string | null }>;
    r: Array<[number, number]>;
    t: UnitInstance[];
    s: Array<[number, number]>;
    c: UnitInstance[];
  } = { m: new Map(), r: [], t: [], s: [], c: [] };

  public profile: PlayerProfile | null = null;
  public missionId: string | null = null;
  public isCampaignMode: boolean = false;
  public turnCasualties: { friendly: number; enemy: number } = { friendly: 0, enemy: 0 };
  public totalFriendlyLosses: number = 0;
  public onStateChange?: () => void;

  constructor(profile?: PlayerProfile) {
    this.profile = profile || null;
  }

  public setProfile(profile: PlayerProfile): void {
    this.profile = profile;
  }

  public isUnitUnlocked(t: UnitTypeCode): boolean {
    if (!this.profile) return true;
    if (!this.isCampaignMode) return true;
    return this.profile.unlockedUnits?.includes(t) ?? true;
  }

  public getUpgradeLevel(upgradeId: string): number {
    return this.profile?.purchasedUpgrades[upgradeId] || 0;
  }

  public getBlueprint(t: UnitTypeCode) {
    return UNIT_BLUEPRINTS[t];
  }

  private isInfantry(u: UnitInstance): boolean {
    const bp = this.getBlueprint(u.t);
    return !bp.bl && bp.fu == null;
  }

  public getCost(a: Ability): number {
    return a.a ?? 1;
  }

  public canAffordAbility(u: UnitInstance, a: Ability): boolean {
    return (!a.cd || !u.cd) && (u.am == null || u.am >= this.getCost(a));
  }

  public getMaxHealth(t: UnitTypeCode, owner: number): number {
    let base = this.getBlueprint(t).hp;
    if (owner === 0 && this.profile) {
      if (this.isInfantry({ t } as UnitInstance)) {
        base += this.getUpgradeLevel('upg_infantry_armor');
      }
      if ('MBJ'.includes(t)) {
        base += this.getUpgradeLevel('upg_reactive_plating') * 2;
      }
    }
    return base;
  }

  public getMaxAmmo(t: UnitTypeCode, owner: number): number | undefined {
    const base = this.getBlueprint(t).am;
    if (base == null) return undefined;
    if (owner === 0 && this.profile) {
      return base + this.getUpgradeLevel('upg_extended_ammo') * 2;
    }
    return base;
  }

  public getMaxFuel(t: UnitTypeCode, owner: number): number | undefined {
    const base = this.getBlueprint(t).fu;
    if (base == null) return undefined;
    if (owner === 0 && this.profile) {
      return base + this.getUpgradeLevel('upg_high_octane_fuel') * 3;
    }
    return base;
  }

  public getMoveReach(u: UnitInstance): number {
    let base = this.getBlueprint(u.t).mv;
    if (u.o === 0 && this.profile) {
      if (u.t === 'V') {
        base += this.getUpgradeLevel('upg_drone_overdrive');
      }
    }
    return Math.min(base, u.fu ?? 99);
  }

  public getVisionReach(u: UnitInstance): number {
    let base = this.getBlueprint(u.t).v;
    if (u.o === 0 && this.profile) {
      base += this.getUpgradeLevel('upg_radar_recon');
    }
    return base;
  }

  public inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.N && y < this.N;
  }

  public unitAt(x: number, y: number): UnitInstance | undefined {
    return this.U.find((e) => e.hp > 0 && e.x === x && e.y === y);
  }

  public addUnit(t: UnitTypeCode, o: number, x: number, y: number): UnitInstance {
    const maxHp = this.getMaxHealth(t, o);
    const maxFu = this.getMaxFuel(t, o);
    const maxAm = this.getMaxAmmo(t, o);

    const e: UnitInstance = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      t,
      o,
      x,
      y,
      rx: x,
      ry: y,
      hp: maxHp,
      maxHp,
      fu: maxFu,
      maxFu,
      am: maxAm,
      maxAm,
      moved: 0,
      acted: 0,
      cd: 0,
      wx: 0,
      ph: Math.random() * 3000,
      dr: x < this.N / 2 ? 1 : -1,
      rc: 0,
      mw: 0,
    };
    this.U.push(e);
    return e;
  }

  public initMatch(config: MatchConfig): void {
    this.gen++;
    this.paused = false;
    this.N = config.mapSize;
    this.NP = config.playersCount;
    this.ctrl = Array(this.NP)
      .fill(true)
      .map((_, i) => !config.humanFactions.includes(i));
    this.alive = Array(this.NP).fill(true);
    this.over = false;
    this.winner = null;
    this.view = 0;
    this.cur = 0;
    this.turn = 1;
    this.sel = null;
    this.sp = null;
    this.busy = false;
    this.shake = 0;
    this.flash = 0;
    this.pt = [];
    this.fx = [];
    this.scorch = [];
    this.missionId = config.campaignMissionId || null;
    this.isCampaignMode = !!config.campaignMissionId;
    this.difficulty = config.difficulty || 'normal';
    this.turnCasualties = { friendly: 0, enemy: 0 };
    this.totalFriendlyLosses = 0;

    // Obstacles array
    this.ob = Array.from({ length: this.N }, () => Array(this.N).fill(0));

    // Capture points (Mines / Outposts)
    const HQP_4: Array<[number, number]> = [
      [15, 28],
      [1, 15],
      [14, 1],
      [28, 14],
    ];
    const GM_4 = [[14, 14], [8, 8], [4, 13]].flatMap(([x, y]) =>
      [0, 1, 2, 3].map((k) => {
        let a = x,
          b = y;
        for (let i = 0; i < k; i++) [a, b] = [29 - b, a];
        return [a, b];
      })
    );

    if (config.customMines) {
      this.mines = config.customMines.map((m) => ({ x: m.x, y: m.y, w: !!m.w }));
    } else {
      const defaultMines =
        this.NP > 2 ? GM_4 : [[7, 7], [3, 5], [11, 9], [11, 5], [3, 9]];
      this.mines = defaultMines.map(([x, y], i) => ({
        x,
        y,
        w: this.NP > 2 ? i > 3 && i < 8 : i === 0,
      }));
    }

    // Procedural Obstacles
    if (config.customObstacles) {
      config.customObstacles.forEach((o) => {
        if (this.inBounds(o.x, o.y)) this.ob[o.y][o.x] = o.type;
      });
    } else {
      let seed = Math.floor(Math.random() * 1e9);
      const rand = () =>
        ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

      const safeTile = (x: number, y: number) =>
        (this.NP > 2
          ? HQP_4.some(([a, b]) => Math.abs(a - x) <= 5 && Math.abs(b - y) <= 5)
          : (y <= 2 && x >= 4 && x <= 10) || (y >= 12 && x >= 4 && x <= 10)) ||
        this.mines.some((m) => Math.abs(m.x - x) <= 1 && Math.abs(m.y - y) <= 1);

      if (this.NP > 2) {
        for (let y = 0; y < 15; y++) {
          for (let x = 0; x < 15; x++) {
            if (!safeTile(x, y) && rand() < 0.16) {
              const v = rand() < 0.5 ? 1 : 2;
              [[x, y], [29 - y, x], [29 - x, 29 - y], [y, 29 - x]].forEach(
                ([a, b]) => (this.ob[b][a] = v)
              );
            }
          }
        }
      } else {
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < this.N; x++) {
            if (!safeTile(x, y) && !safeTile(14 - x, 14 - y) && rand() < 0.17) {
              this.ob[y][x] = this.ob[14 - y][14 - x] = rand() < 0.5 ? 1 : 2;
            }
          }
        }
      }
    }

    // Initialize units
    this.U = [];
    const hqPositions = this.NP > 2 ? HQP_4 : [[7, 14], [7, 0]];
    for (let i = 0; i < this.NP; i++) {
      const [hx, hy] = hqPositions[i];
      this.addUnit('H', i, hx, hy);
    }

    // Add Outposts and Barracks
    this.mines.forEach((m) => {
      const b = this.addUnit(m.w ? 'W' : 'O', -1, m.x, m.y);
      b.hp = Math.ceil(this.getBlueprint(b.t).hp / 2);
    });

    // Initialize Campaign Objectives & Preplaced Units
    this.defendTargets = [];
    this.vipTargets = [];
    this.initialVanguardCount = 0;
    this.vanguardDestroyedCount = 0;
    this.activeMission = config.campaignMission || null;

    if (config.preplacedUnits && config.preplacedUnits.length > 0) {
      config.preplacedUnits.forEach((pu) => {
        if (!this.unitAt(pu.x, pu.y)) {
          const u = this.addUnit(pu.t, pu.o, pu.x, pu.y);
          if (pu.hp != null) {
            u.hp = pu.hp;
            u.maxHp = pu.maxHp || Math.max(u.maxHp, pu.hp);
          }
          if (pu.isVip) {
            u.isVip = true;
            this.vipTargets.push(u);
          }
          if (pu.isDefendTarget) {
            u.isDefendTarget = true;
            this.defendTargets.push(u);
          }
          if (pu.name) {
            u.customName = pu.name;
          }
          if (pu.o > 0 && !this.getBlueprint(pu.t).bl) {
            this.initialVanguardCount++;
          }
        }
      });
    }

    if (this.activeMission?.objectiveType === 'holdout') {
      this.holdoutTurnsRemaining = this.activeMission.holdoutTurns || 10;
    }

    // Starting Gold
    let startGold = config.startingGold || Array(this.NP).fill(this.NP > 2 ? 48 : 24);
    if (this.NP > 2) startGold = startGold.map((g, i) => (i === 0 ? g + 10 : g));

    // Logistics Upgrade Bonus
    if (this.profile) {
      const logBonus = this.getUpgradeLevel('upg_logistics_subsidy') * 6;
      startGold[0] += logBonus;
    }

    this.gold = [...startGold];

    const isSimulation = this.ctrl.every((c) => c);
    const autoDeployAll = !!config.autoDeploy || isSimulation;

    if (config.fogOfWar !== undefined) {
      this.fogOff = !config.fogOfWar;
    } else if (isSimulation) {
      this.fogOff = true;
    }

    if (autoDeployAll) {
      for (let i = 0; i < this.NP; i++) {
        this.botAutoDeploy(i);
      }
      this.beginCombat();
      if (this.ctrl[this.cur]) {
        setTimeout(() => {
          if (!this.over && this.ctrl[this.cur]) {
            this.botTurn();
          }
        }, 150);
      }
    } else {
      let firstHuman = 0;
      while (firstHuman < this.NP && this.ctrl[firstHuman]) {
        this.botAutoDeploy(firstHuman);
        firstHuman++;
      }
      if (firstHuman < this.NP) {
        this.cur = firstHuman;
        this.view = firstHuman;
        this.ph = 'setup';
        this.note = this.NP > 2
          ? `Faction ${this.cur + 1} (${FACTION_NAMES[this.cur]}): Deploy your forces, then tap Confirm Deployment.`
          : 'Deployment Phase: Place units adjacent to your HQ, then press Ready.';
        this.recalculateHighlights();
        this.triggerChange();
      } else {
        this.beginCombat();
        setTimeout(() => {
          if (!this.over && this.ctrl[this.cur]) {
            this.botTurn();
          }
        }, 150);
      }
    }
  }

  public triggerChange(): void {
    if (this.onStateChange) this.onStateChange();
  }

  public getVisibilityMap(viewerFaction: number): boolean[] {
    const v = Array(this.N * this.N).fill(this.fogOff);
    if (this.fogOff) return v;

    this.U.forEach((e) => {
      if (e.o !== viewerFaction) return;
      const r = this.getVisionReach(e) + 1;
      for (let y = e.y - r; y <= e.y + r; y++) {
        for (let x = e.x - r; x <= e.x + r; x++) {
          if (this.inBounds(x, y) && Math.abs(x - e.x) + Math.abs(y - e.y) <= r) {
            v[y * this.N + x] = true;
          }
        }
      }
    });
    return v;
  }

  public reachMap(u: UnitInstance): Map<string, { x: number; y: number; p: string | null }> {
    const m = new Map<string, { x: number; y: number; p: string | null }>([
      [u.x + ',' + u.y, { x: u.x, y: u.y, p: null }],
    ]);
    const maxMv = this.getMoveReach(u);

    if (AIR_UNITS.includes(u.t)) {
      for (let y = 0; y < this.N; y++) {
        for (let x = 0; x < this.N; x++) {
          if (
            Math.abs(x - u.x) + Math.abs(y - u.y) <= maxMv &&
            !this.ob[y][x] &&
            !this.unitAt(x, y)
          ) {
            m.set(x + ',' + y, { x, y, p: u.x + ',' + u.y });
          }
        }
      }
      return m;
    }

    const D4 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    let frontier: Array<[number, number]> = [[u.x, u.y]];

    for (let d = 0; d < maxMv; d++) {
      const nextFrontier: Array<[number, number]> = [];
      for (const [x, y] of frontier) {
        for (const [dx, dy] of D4) {
          const X = x + dx;
          const Y = y + dy;
          const k = X + ',' + Y;
          if (
            !this.inBounds(X, Y) ||
            this.ob[Y][X] ||
            this.unitAt(X, Y) ||
            m.has(k)
          )
            continue;
          m.set(k, { x: X, y: Y, p: x + ',' + y });
          nextFrontier.push([X, Y]);
        }
      }
      frontier = nextFrontier;
    }
    return m;
  }

  public hasLineOfSight(x: number, y: number, X: number, Y: number): boolean {
    const n = Math.max(Math.abs(X - x), Math.abs(Y - y));
    for (let i = 1; i < n; i++) {
      const checkX = Math.round(x + ((X - x) * i) / n);
      const checkY = Math.round(y + ((Y - y) * i) / n);
      if (this.ob[checkY][checkX]) return false;
    }
    return true;
  }

  public canTarget(u: UnitInstance, x: number, y: number, X: number, Y: number, a?: Ability): boolean {
    const ab = a || this.getActiveAbility(u);
    if (!ab) return false;
    const dx = Math.abs(X - x);
    const dy = Math.abs(Y - y);
    const isDiag = ab.f.includes('d');
    const dist = isDiag ? Math.max(dx, dy) : dx + dy;
    if (!dist || dist > ab.rg || (isDiag && dx !== dy)) return false;
    return ab.f.includes('i') || this.hasLineOfSight(x, y, X, Y);
  }

  public getActiveAbility(u: UnitInstance): Ability {
    const bp = this.getBlueprint(u.t);
    return bp.ab[u.ai || 0] || bp.ab[0];
  }

  public getValidTargets(u: UnitInstance, x = u.x, y = u.y, checkVisibility = true): UnitInstance[] {
    const vis = checkVisibility ? this.getVisibilityMap(this.view) : null;
    const a = this.getActiveAbility(u);
    if (!a) return [];

    const isHeal = a.f.includes('h') || a.f.includes('r');
    const isBuilding = (e: UnitInstance) => !!this.getBlueprint(e.t).bl;

    return this.U.filter((e) => {
      if (e.hp <= 0) return false;
      if (isHeal) {
        if (e.o !== u.o) return false;
        if (!this.canTarget(u, x, y, e.x, e.y, a)) return false;
        if (a.f.includes('h')) {
          const bp = this.getBlueprint(e.t);
          return (
            !isBuilding(e) &&
            (e.hp < e.maxHp ||
              (bp.fu != null && (e.fu ?? 0) < (e.maxFu ?? 0)) ||
              (bp.am != null && (e.am ?? 0) < (e.maxAm ?? 0)))
          );
        } else {
          return a.f.includes('b')
            ? isBuilding(e) && e.hp < e.maxHp
            : !isBuilding(e) && e.hp < e.maxHp;
        }
      } else {
        if (e.o === u.o) return false;
        if (e.o < 0 && isBuilding(e)) return false;
        if (a.f.includes('j') && (isBuilding(e) || e.fz)) return false;
        if (vis && !vis[e.y * this.N + e.x]) return false;
        return this.canTarget(u, x, y, e.x, e.y, a);
      }
    });
  }

  public getDeployZone(o: number): Array<[number, number]> {
    const z: Array<[number, number]> = [];
    const r =
      this.ph === 'setup'
        ? this.NP > 2
          ? 3
          : 2
        : this.NP > 2 && o === 3
        ? 2
        : 1;

    this.U.filter(
      (b) => b.o === o && (b.t === 'H' || (b.t === 'W' && this.ph !== 'setup'))
    ).forEach((b) => {
      const q = b.t === 'W' ? 1 : r;
      for (let y = b.y - q; y <= b.y + q; y++) {
        for (let x = b.x - q; x <= b.x + q; x++) {
          if (
            this.inBounds(x, y) &&
            !this.ob[y][x] &&
            !this.unitAt(x, y) &&
            !z.some((c) => c[0] === x && c[1] === y)
          ) {
            z.push([x, y]);
          }
        }
      }
    });
    return z;
  }

  public getCapturableBuildings(u: UnitInstance, x = u.x, y = u.y): UnitInstance[] {
    if (!this.isInfantry(u) || u.acted || u.hp <= 0) return [];
    return this.U.filter(
      (b) =>
        b.hp > 0 &&
        this.getBlueprint(b.t).bl &&
        b.o !== u.o &&
        Math.max(Math.abs(b.x - x), Math.abs(b.y - y)) <= 1
    );
  }

  public canUnitMove(u: UnitInstance): boolean {
    return !u.moved && !('AL'.includes(u.t) && u.acted) && this.getMoveReach(u) > 0;
  }

  public canUnitAct(u: UnitInstance): boolean {
    const bp = this.getBlueprint(u.t);
    return (
      !bp.bl &&
      !u.acted &&
      !('AL'.includes(u.t) && u.moved) &&
      bp.ab.some((a) => this.canAffordAbility(u, a))
    );
  }

  public recalculateHighlights(): void {
    this.hl = { m: new Map(), r: [], t: [], s: [], c: [] };

    if (this.sp || this.ph === 'setup') {
      this.hl.s = this.getDeployZone(this.cur);
    } else if (this.sel && !this.getBlueprint(this.sel.t).bl && this.sel.o === this.cur) {
      this.hl.c = this.getCapturableBuildings(this.sel);
      if (this.canUnitMove(this.sel) && !this.sel.gm) {
        this.hl.m = this.reachMap(this.sel);
      }
      if (this.canUnitAct(this.sel)) {
        const ab = this.getActiveAbility(this.sel);
        for (let y = 0; y < this.N; y++) {
          for (let x = 0; x < this.N; x++) {
            if (this.canTarget(this.sel, this.sel.x, this.sel.y, x, y, ab)) {
              this.hl.r.push([x, y]);
            }
          }
        }
        this.hl.t = this.getValidTargets(this.sel, this.sel.x, this.sel.y, true);
      }
    }
  }

  public selectUnit(u: UnitInstance | null): void {
    if (this.busy || this.over) return;
    this.sel = u && u.o === this.cur ? u : null;
    this.sp = null;
    if (this.sel) {
      SoundEngine.play('sel');
      if (!this.getBlueprint(this.sel.t).bl) {
        this.sel.gm = 0;
        this.sel.ai = Math.max(
          0,
          this.getBlueprint(this.sel.t).ab.findIndex((a) =>
            this.canAffordAbility(this.sel!, a)
          )
        );
      }
    }
    this.recalculateHighlights();
    this.triggerChange();
  }

  public selectAbility(index: number): void {
    if (!this.sel || this.busy) return;
    const bp = this.getBlueprint(this.sel.t);
    if (bp.ab[index] && this.canAffordAbility(this.sel, bp.ab[index])) {
      this.sel.ai = index;
      this.recalculateHighlights();
      this.triggerChange();
    }
  }

  public toggleGroundAim(): void {
    if (!this.sel || this.busy || this.over) return;
    this.sel.gm = this.sel.gm ? 0 : 1;
    SoundEngine.play('sel');
    this.recalculateHighlights();
    this.triggerChange();
  }

  public async moveUnit(u: UnitInstance, k: string): Promise<void> {
    SoundEngine.play(AIR_UNITS.includes(u.t) ? 'fly' : 'mv', u.x, u.y, true, true);
    const m = this.reachMap(u);
    const path: Array<{ x: number; y: number; p: string | null }> = [];
    let curStep: { x: number; y: number; p: string | null } | undefined = m.get(k);
    while (curStep) {
      path.unshift(curStep);
      curStep = curStep.p ? m.get(curStep.p) : undefined;
    }

    u.mw = 1;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      if (b.x !== a.x) u.dr = b.x > a.x ? 1 : -1;
      const vis = this.getVisibilityMap(this.view)[u.y * this.N + u.x];
      const dur = !vis ? 1 : AIR_UNITS.includes(u.t) ? 50 : 110;
      await this.tween(dur, (t) => {
        u.rx = a.x + (b.x - a.x) * t;
        u.ry = a.y + (b.y - a.y) * t;
      });
      this.addSpark(a.x, a.y, AIR_UNITS.includes(u.t) ? '#e2e8f0' : '#d6c7a1', 4, 1.5, 3);
    }

    u.x = u.rx = path[path.length - 1].x;
    u.y = u.ry = path[path.length - 1].y;
    u.moved = 1;

    if (u.fu != null) {
      const stepCost = AIR_UNITS.includes(u.t)
        ? Math.abs(u.x - path[0].x) + Math.abs(u.y - path[0].y)
        : path.length - 1;
      u.fu = Math.max(0, u.fu - stepCost);
      if (u.fu === 0) this.addFloatingText(u, 'OUT OF FUEL', '#fbbf24');
    }
    u.mw = 0;
  }

  public async attackTarget(u: UnitInstance, target: { x: number; y: number; gnd?: boolean }): Promise<void> {
    const a = this.getActiveAbility(u);
    if (!a) return;

    await this.shootAnimation(u, target);

    if (u.am != null) {
      const cost = this.getCost(a);
      u.am = Math.max(0, u.am - cost);
      if (u.am === 0) this.addFloatingText(u, 'OUT OF AMMO', '#d3a85a');
    }
    if (a.cd) u.cd = a.cd;

    const targetUnit = this.unitAt(target.x, target.y);

    if (a.f.includes('j') && targetUnit && !target.gnd) {
      targetUnit.fz = 1;
      this.addFloatingText(targetUnit, 'JAMMED', '#7fc4d6');
      this.addSpark(targetUnit.x, targetUnit.y, '#7fc4d6', 26, 5);
      this.addRing(targetUnit.x, targetUnit.y, '#7fc4d6');
      this.note = `${this.getBlueprint(targetUnit.t).n} disabled for next turn.`;
    } else if (a.f.includes('h') && targetUnit) {
      const bp = this.getBlueprint(targetUnit.t);
      targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + 2);
      if (targetUnit.fu != null && targetUnit.maxFu != null) targetUnit.fu = targetUnit.maxFu;
      if (targetUnit.am != null && targetUnit.maxAm != null) targetUnit.am = targetUnit.maxAm;
      this.addFloatingText(targetUnit, '+2 RESUPPLY', '#8fbf7a');
      this.addSpark(targetUnit.x, targetUnit.y, '#8fbf7a', 20, 3);
      this.addRing(targetUnit.x, targetUnit.y, '#8fbf7a');
      this.note = `Supplier replenished ${bp.n}.`;
    } else if (a.f.includes('r') && targetUnit) {
      let repairAmt = a.d;
      if (u.o === 0 && this.profile) {
        if (u.t === 'K') repairAmt += this.getUpgradeLevel('upg_medical_triage');
        if (u.t === 'N') repairAmt += this.getUpgradeLevel('upg_combat_engineering') * 2;
      }
      const actual = Math.min(repairAmt, targetUnit.maxHp - targetUnit.hp);
      targetUnit.hp += actual;
      this.addFloatingText(targetUnit, `+${actual} HP`, '#8fbf7a');
      this.addSpark(targetUnit.x, targetUnit.y, '#8fbf7a', 20, 3);
      this.addRing(targetUnit.x, targetUnit.y, '#8fbf7a');
      this.note = `${this.getBlueprint(targetUnit.t).n} field repaired.`;
    } else {
      let victims: UnitInstance[] = [];
      if (a.f.includes('s')) {
        victims = this.U.filter(
          (x) =>
            x.o !== u.o &&
            (x.o >= 0 || !this.getBlueprint(x.t).bl) &&
            Math.abs(x.x - target.x) + Math.abs(x.y - target.y) < 2
        );
      } else if (targetUnit && !target.gnd) {
        victims = [targetUnit];
      }

      this.note =
        a.n + (victims.length ? ' fired.' : ' missed: tile was empty.');
      if (!victims.length) {
        this.addFloatingText(target, 'MISS', '#9aa59d');
      }

      victims.forEach((v) => {
        let dmg = a.d;
        if (a.f.includes('a') && v.fu != null) dmg += 2; // Anti-vehicle
        if (a.f.includes('b') && this.getBlueprint(v.t).bl) dmg += a.d; // Demolition double

        // Player Upgrades
        if (u.o === 0 && this.profile) {
          if ('AL'.includes(u.t)) dmg += this.getUpgradeLevel('upg_heavy_ordnance');
          if (u.t === 'V' && a.f.includes('x')) dmg += this.getUpgradeLevel('upg_drone_overdrive') * 2;
          if (u.t === 'G' && a.f.includes('b') && this.getBlueprint(v.t).bl) {
            dmg += this.getUpgradeLevel('upg_combat_engineering') * 2;
          }
        }

        this.applyDamage(v, dmg, u);
      });

      if (a.f.includes('u')) {
        victims.forEach((v) => {
          if (!this.getBlueprint(v.t).bl && this.U.includes(v)) {
            v.sp = 1;
            this.addFloatingText(v, 'PINNED', '#d3a85a');
          }
        });
      }

      if (a.f.includes('x')) {
        u.hp = 0;
        this.triggerExplosion(u);
        this.U = this.U.filter((z) => z !== u);
      }
    }

    u.acted = 1;
    u.gm = 0;
  }

  public async captureBuilding(u: UnitInstance, b: UnitInstance): Promise<void> {
    const was = b.o;
    const isHq = b.t === 'H';
    const vis = this.getVisibilityMap(this.view)[b.y * this.N + b.x];

    if (b.x !== u.x) u.dr = b.x > u.x ? 1 : -1;
    await this.tween(vis ? 300 : 1, (k) => (u.wx = Math.sin(k * 40) * 2 * (1 - k)));
    u.wx = 0;

    b.o = u.o;
    b.hp = Math.ceil(this.getBlueprint(b.t).hp / 2);
    b.cd = b.t === 'W' ? 3 : 0;

    SoundEngine.play('cap', b.x, b.y, true, true);
    this.addRing(b.x, b.y, '#facc15');
    this.addSpark(b.x, b.y, '#facc15', 26, 4, 4);

    u.moved = u.acted = 1;
    this.addFloatingText(u, 'CAPTURED', '#facc15');
    this.note = `${this.getBlueprint(b.t).n} captured by ${u.o === 0 ? 'Friendly' : 'Hostile'} forces!`;

    if (this.profile && u.o === 0) {
      this.profile.skirmishStats.outpostsCaptured++;
    }

    // Check Outpost Domination Objective
    if (this.activeMission?.objectiveType === 'capture_outposts' && u.o === 0) {
      const outpostsControlled = this.U.filter((x) => x.t === 'O' && x.o === 0).length;
      const targetCount =
        this.activeMission.objectives.find((o) => o.type === 'capture_outposts')?.targetCount || 3;
      if (outpostsControlled >= targetCount) {
        this.handleVictory(0, `OUTPOST DOMINATION: Captured and controlled ${outpostsControlled}/${targetCount} strategic outposts!`);
        return;
      }
    }

    if (isHq) {
      this.eliminateFaction(was);
    }
  }

  public applyDamage(v: UnitInstance, d: number, attacker?: UnitInstance): void {
    if (!this.U.includes(v)) return;
    v.hp -= d;
    v.fl = performance.now();
    SoundEngine.play('hit', v.x, v.y);
    this.addFloatingText(v, `-${d}`, '#f87171');
    this.addSpark(v.x, v.y, '#f87171', 8, 3);

    if (v.hp <= 0) {
      this.note += ` ${this.getBlueprint(v.t).n} destroyed!`;
      this.triggerExplosion(v, attacker && 'AL'.includes(attacker.t));
      this.U = this.U.filter((x) => x !== v);

      if (v.o === 0) {
        this.totalFriendlyLosses++;
        this.turnCasualties.friendly++;
        // Check if player lost a mission-critical defend target
        if (v.isDefendTarget) {
          this.handleDefeat(`MISSION FAILED: Critical asset "${v.customName || 'Allied Installation'}" was destroyed!`);
          return;
        }
      } else {
        this.turnCasualties.enemy++;
        if (this.profile) this.profile.skirmishStats.enemiesEliminated++;

        // Check VIP Prototype Boss Elimination
        if (v.isVip) {
          const vipsLeft = this.U.filter((u) => u.isVip && u.o !== 0 && u.hp > 0).length;
          if (vipsLeft === 0 && this.activeMission?.objectiveType === 'destroy_vip') {
            this.handleVictory(0, `VIP DESTROYED: Prototype "${v.customName || 'Boss Target'}" has been eliminated!`);
            return;
          }
        }

        if (this.initialVanguardCount > 0) {
          this.vanguardDestroyedCount++;
        }
      }

      if (v.t === 'H') {
        this.eliminateFaction(v.o);
      }
    }
  }

  public eliminateFaction(o: number): void {
    this.alive[o] = false;
    this.note += ` Faction ${o} eliminated!`;
    this.U.filter((e) => e.o === o && !this.getBlueprint(e.t).bl).forEach((e) =>
      this.addSpark(e.x, e.y, '#f87171', 8, 3)
    );
    this.U = this.U.filter((e) => e.o !== o || this.getBlueprint(e.t).bl);
    this.U.forEach((e) => {
      if (e.o === o) {
        e.o = -1;
        e.hp = Math.min(e.hp, Math.ceil(this.getBlueprint(e.t).hp / 2));
      }
    });

    if (this.sel && this.sel.o === o) this.sel = null;

    if (o === 0) {
      this.handleDefeat('COMMAND OVERRUN: Your HQ Fortress has fallen!');
      return;
    }

    const remaining = this.alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
    if (remaining.length === 1) {
      this.handleVictory(remaining[0], remaining[0] === 0 ? 'HOSTILE HQ NEUTRALIZED' : 'SECTOR OVERRUN');
    } else if (remaining.every((i) => this.ctrl[i])) {
      this.handleVictory(remaining[0], remaining[0] === 0 ? 'HOSTILE HQ NEUTRALIZED' : 'SECTOR OVERRUN');
    }
  }

  public handleDefeat(reason: string = 'MISSION FAILED'): void {
    if (this.over) return;
    this.over = true;
    this.winner = 1;
    this.victoryReason = reason;
    SoundEngine.play('lose');
    if (this.profile && this.profile.skirmishStats) {
      this.profile.skirmishStats.defeats++;
      this.profile.skirmishStats.battles++;
    }
    this.recalculateHighlights();
    this.triggerChange();
  }

  public handleVictory(w: number, reason: string = 'HOSTILE HQ DESTROYED'): void {
    if (this.over) return;
    this.over = true;
    this.winner = w;
    this.victoryReason = reason;
    const isPlayerWin = w === 0;

    SoundEngine.play(isPlayerWin ? 'win' : 'lose');

    // Rewards & progression calculation
    if (this.profile) {
      if (isPlayerWin) {
        if (this.profile.skirmishStats) this.profile.skirmishStats.victories++;
        const goldPrize = 150 + (this.NP > 2 ? 200 : 100);
        this.profile.mits = (this.profile.mits || 0) + goldPrize;
        this.profile.credits = this.profile.mits;
        if (this.profile.skirmishStats) this.profile.skirmishStats.totalCreditsEarned += goldPrize;
      } else {
        if (this.profile.skirmishStats) this.profile.skirmishStats.defeats++;
      }
      if (this.profile.skirmishStats) this.profile.skirmishStats.battles++;
    }

    this.recalculateHighlights();
    this.triggerChange();
  }

  public endTurn(): void {
    if (this.busy || this.over) return;
    this.sel = null;
    this.sp = null;

    if (this.ph === 'setup') {
      let nextFaction = this.cur + 1;
      while (nextFaction < this.NP && this.ctrl[nextFaction]) {
        this.botAutoDeploy(nextFaction);
        nextFaction++;
      }
      if (nextFaction < this.NP) {
        this.cur = nextFaction;
        this.view = nextFaction;
        this.recalculateHighlights();
        this.triggerChange();
      } else {
        this.beginCombat();
        if (this.ctrl[this.cur]) {
          setTimeout(() => {
            if (!this.over && this.ctrl[this.cur]) {
              this.botTurn();
            }
          }, 150);
        }
      }
      return;
    }

    const prevCur = this.cur;
    do {
      this.cur = (this.cur + 1) % this.NP;
    } while (!this.alive[this.cur]);

    SoundEngine.play('turn');
    if (this.cur <= prevCur) {
      this.turn++;

      // Holdout Objective Check
      if (this.activeMission?.objectiveType === 'holdout' && this.alive[0]) {
        const targetTurns = this.activeMission.holdoutTurns || 10;
        this.holdoutTurnsRemaining = Math.max(0, targetTurns - this.turn);
        if (this.turn > targetTurns) {
          this.handleVictory(0, `HOLDOUT SUCCESS: You survived all ${targetTurns} assault waves!`);
          return;
        }
      }
    }

    // Income calculation
    let income = 2;
    if (this.NP > 2 && this.cur === 1) income += 1;
    income += this.U.filter((m) => m.t === 'O' && m.o === this.cur).length;
    if (this.cur === 0 && this.profile) {
      income += this.getUpgradeLevel('upg_logistics_subsidy');
    }
    this.gold[this.cur] += income;

    // Refresh units
    this.U.forEach((e) => {
      if (e.o === this.cur) {
        e.moved = 0;
        e.acted = 0;
        if (e.cd > 0) e.cd--;
        if (e.fz) {
          e.moved = 1;
          e.acted = 1;
          e.fz = 0;
        }
        if (e.sp) {
          e.moved = 1;
          e.sp = 0;
        }
      }
    });

    // Building supply checks
    this.U.forEach((e) => {
      if (e.o !== this.cur || this.getBlueprint(e.t).bl) return;
      const isNear = (h: UnitInstance) =>
        h.o === this.cur && Math.abs(h.x - e.x) < 2 && Math.abs(h.y - e.y) < 2;
      const hq = this.U.some((h) => h.t === 'H' && isNear(h));
      const br = this.U.find((h) => h.t === 'W' && !h.cd && isNear(h));

      const needsSupply =
        (e.maxFu != null && (e.fu ?? 0) < e.maxFu) ||
        (e.maxAm != null && (e.am ?? 0) < e.maxAm);

      if (hq || (br && needsSupply)) {
        if (e.maxFu != null) e.fu = e.maxFu;
        if (e.maxAm != null) e.am = e.maxAm;
        if (!hq && br) br.us = 1;
        if (hq && this.NP > 2 && this.cur === 2) {
          e.hp = Math.min(e.maxHp, e.hp + 1);
        }
      }
    });

    this.U.forEach((b) => {
      if (b.us) {
        b.us = 0;
        b.cd = 3;
        this.addFloatingText(b, 'SUPPLY RECHARGE', '#8fbf7a');
        this.addRing(b.x, b.y, '#8fbf7a');
      }
    });

    this.note = '';
    this.recalculateHighlights();
    this.triggerChange();

    if (this.ctrl[this.cur]) {
      this.botTurn();
    }
  }

  public beginCombat(): void {
    SoundEngine.play('go');
    this.ph = 'play';
    this.cur = 0;
    const firstHuman = this.ctrl.findIndex((c) => !c);
    this.view = firstHuman >= 0 ? firstHuman : 0;
    this.turn = 1;
    this.U.forEach((e) => {
      e.moved = 0;
      e.acted = 0;
    });
    const isSim = this.ctrl.every((c) => c);
    this.note = isSim
      ? 'Autonomous simulation active. Spectating AI battle.'
      : 'Battle commences! Unspent deployment gold carries forward.';
    this.recalculateHighlights();
    this.triggerChange();
  }

  public botAutoDeploy(faction: number, maxUnits?: number): void {
    const maxN = maxUnits ?? (this.NP > 2 ? 24 : 14);
    const center = (this.N - 1) / 2;
    const cdist = (c: [number, number]) => (c[0] - center) ** 2 + (c[1] - center) ** 2;

    const isHard = this.difficulty === 'hard' || this.difficulty === 'expert';

    // In hard mode, prioritize synergistic combat squads with support units
    const balancedComposition: UnitTypeCode[] = isHard
      ? ['T', 'R', 'G', 'S', 'K', 'T', 'A', 'P', 'B', 'C', 'Y', 'Z', 'M', 'R']
      : ['B', 'M', 'R', 'G', 'S', 'T', 'A', 'Y', 'C', 'L', 'Z', 'U', 'Q', 'D', 'X', 'K', 'P', 'N'];

    for (let i = 0; i < maxN; i++) {
      const affordable = balancedComposition.filter(
        (t) =>
          this.getBlueprint(t).c <= this.gold[faction] &&
          (!'PEKN'.includes(t) || !this.U.some((e) => e.o === faction && e.t === t))
      );
      if (!affordable.length) break;
      const zone = this.getDeployZone(faction).sort((a, b) => cdist(a) - cdist(b));
      if (!zone.length) break;

      let pickUnit: UnitTypeCode;
      if (isHard) {
        if (i === 0 && affordable.includes('T')) pickUnit = 'T';
        else if (i === 1 && affordable.includes('R')) pickUnit = 'R';
        else if (i === 2 && affordable.includes('G')) pickUnit = 'G';
        else if (i === 3 && affordable.includes('K')) pickUnit = 'K';
        else if (i === 4 && affordable.includes('A')) pickUnit = 'A';
        else pickUnit = affordable[Math.floor(Math.random() * affordable.length)];
      } else {
        pickUnit =
          affordable.includes('B') && Math.random() < 0.35
            ? 'B'
            : affordable[Math.floor(Math.random() * affordable.length)];
      }

      const pickTile = zone[Math.floor(Math.random() * Math.min(zone.length, 6))];

      this.gold[faction] -= this.getBlueprint(pickUnit).c;
      const u = this.addUnit(pickUnit, faction, pickTile[0], pickTile[1]);
      u.moved = 0;
      u.acted = 0;
    }
    this.recalculateHighlights();
    this.triggerChange();
  }

  // BFS Pathfinding distance field from a specific coordinate
  public distanceField(gx: number, gy: number): number[] {
    const d = new Array(this.N * this.N).fill(999);
    if (!this.inBounds(gx, gy)) return d;
    d[gy * this.N + gx] = 0;
    let frontier: Array<[number, number]> = [[gx, gy]];
    const D4 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    while (frontier.length > 0) {
      const nextFrontier: Array<[number, number]> = [];
      for (const [x, y] of frontier) {
        for (const [dx, dy] of D4) {
          const X = x + dx;
          const Y = y + dy;
          if (this.inBounds(X, Y) && !this.ob[Y][X] && d[Y * this.N + X] === 999) {
            d[Y * this.N + X] = d[y * this.N + x] + 1;
            nextFrontier.push([X, Y]);
          }
        }
      }
      frontier = nextFrontier;
    }
    return d;
  }

  // Calculate incoming enemy threat to a given board tile
  public getEnemyThreatAt(targetFaction: number, x: number, y: number): { threatScore: number; threateningEnemiesCount: number } {
    let threatScore = 0;
    let threateningEnemiesCount = 0;

    for (const enemy of this.U) {
      if (enemy.o === targetFaction || enemy.o < 0 || enemy.hp <= 0) continue;
      if (this.getBlueprint(enemy.t).bl) continue;

      const bp = this.getBlueprint(enemy.t);
      const maxRange = Math.max(...bp.ab.map((a) => a.rg));
      const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);

      if (dist <= maxRange) {
        threatScore += 6 + (bp.d || 2);
        threateningEnemiesCount++;
      } else if (dist <= maxRange + bp.mv) {
        threatScore += 2;
      }
    }

    return { threatScore, threateningEnemiesCount };
  }

  // 1. Support & Medical rescue action
  private async botSupportDecision(u: UnitInstance): Promise<boolean> {
    const isMedic = u.t === 'K';
    const isSupplier = u.t === 'P';
    const isEngineer = u.t === 'N';
    if (!isMedic && !isSupplier && !isEngineer) return false;

    const m = this.reachMap(u);
    const here = `${u.x},${u.y}`;

    // Scan for friendly units needing aid
    const alliesNeedingHelp = this.U.filter((e) => {
      if (e.o !== u.o || e.hp <= 0 || e === u) return false;
      const isB = !!this.getBlueprint(e.t).bl;
      if (isMedic) {
        return !isB && e.hp < e.maxHp;
      }
      if (isSupplier) {
        const bp = this.getBlueprint(e.t);
        const lowFuel = bp.fu != null && (e.fu ?? 0) <= 2;
        const lowAmmo = bp.am != null && (e.am ?? 0) === 0;
        return !isB && (e.hp < e.maxHp || lowFuel || lowAmmo);
      }
      if (isEngineer) {
        return (isB && e.hp < e.maxHp) || (!isB && e.hp < e.maxHp);
      }
      return false;
    });

    if (!alliesNeedingHelp.length) return false;

    // Prioritize critical patients
    alliesNeedingHelp.sort((a, b) => {
      const aMissing = (a.maxHp - a.hp) / a.maxHp;
      const bMissing = (b.maxHp - b.hp) / b.maxHp;
      const aVal = (a.t === 'H' ? 6 : 'TAJ'.includes(a.t) ? 4 : 2) + aMissing * 5;
      const bVal = (b.t === 'H' ? 6 : 'TAJ'.includes(b.t) ? 4 : 2) + bMissing * 5;
      return bVal - aVal;
    });

    const primePatient = alliesNeedingHelp[0];

    // Check if support ability can reach patient from any reachable move
    const bp = this.getBlueprint(u.t);
    let bestHealAction: { key: string; patient: UnitInstance; abilityIndex: number; score: number } | null = null;

    if (this.canUnitAct(u)) {
      for (let i = 0; i < bp.ab.length; i++) {
        const a = bp.ab[i];
        if (!this.canAffordAbility(u, a)) continue;
        const isHeal = a.f.includes('h') || a.f.includes('r');
        if (!isHeal) continue;
        u.ai = i;

        for (const [k, c] of m.entries()) {
          for (const patient of alliesNeedingHelp) {
            if (!this.canTarget(u, c.x, c.y, patient.x, patient.y, a)) continue;
            const missingHp = patient.maxHp - patient.hp;
            let sc = missingHp * 4;
            if (patient.t === 'H') sc += 15;
            if ('TYAL'.includes(patient.t)) sc += 8;
            if (patient.hp <= 2) sc += 12;

            const { threatScore } = this.getEnemyThreatAt(u.o, c.x, c.y);
            sc -= threatScore * 2;

            if (!bestHealAction || sc > bestHealAction.score) {
              bestHealAction = { key: k, patient, abilityIndex: i, score: sc };
            }
          }
        }
      }
      u.ai = 0;
    }

    if (bestHealAction) {
      if (bestHealAction.key !== here) {
        await this.moveUnit(u, bestHealAction.key);
      }
      u.ai = bestHealAction.abilityIndex;
      await this.attackTarget(u, bestHealAction.patient);
      u.ai = 0;
      this.addFloatingText(u, 'MEDIC ASSIST', '#8fbf7a');
      return true;
    }

    // If out of range to heal this turn, move towards prime patient safely
    if (this.canUnitMove(u)) {
      const dField = this.distanceField(primePatient.x, primePatient.y);
      let bestDist = dField[u.y * this.N + u.x];
      let bestKey = here;

      for (const [k, c] of m.entries()) {
        const d = dField[c.y * this.N + c.x];
        const { threatScore } = this.getEnemyThreatAt(u.o, c.x, c.y);
        const adjDist = d + (threatScore > 4 ? 3 : 0);
        if (adjDist < bestDist) {
          bestDist = adjDist;
          bestKey = k;
        }
      }

      if (bestKey !== here) {
        await this.moveUnit(u, bestKey);
        return true;
      }
    }

    return false;
  }

  // 2. Tactical Retreat / Pull-back when low on HP or supplies
  private async botRetreatDecision(u: UnitInstance): Promise<boolean> {
    const isCriticallyDamaged =
      u.hp <= Math.ceil(u.maxHp * 0.45) ||
      (u.maxHp > 3 && u.hp <= 3) ||
      (u.maxHp <= 3 && u.hp <= 1);
    const isOutOfSupplies =
      (u.am != null && u.am === 0) || (u.fu != null && u.fu <= 1);

    if (!isCriticallyDamaged && !isOutOfSupplies) return false;
    if (!this.canUnitMove(u)) return false;

    const m = this.reachMap(u);
    const here = `${u.x},${u.y}`;
    const currentThreat = this.getEnemyThreatAt(u.o, u.x, u.y);

    const friendlyHQ = this.U.find((e) => e.t === 'H' && e.o === u.o);
    const friendlyMedic = this.U.find((e) => e.o === u.o && e.t === 'K' && e.hp > 0);
    const friendlySupplier = this.U.find((e) => e.o === u.o && e.t === 'P' && e.hp > 0);
    const friendlyDepot = this.U.find((e) => e.o === u.o && e.t === 'W' && !e.cd);

    const retreatTarget = isOutOfSupplies
      ? friendlySupplier || friendlyDepot || friendlyHQ
      : friendlyMedic || friendlyHQ || friendlyDepot;

    const bp = this.getBlueprint(u.t);

    // Evaluate reachable retreat tiles
    let bestRetreatKey = here;
    let highestSafetyScore = -9999;

    const enemies = this.U.filter(
      (e) => e.o !== u.o && e.o >= 0 && !this.getBlueprint(e.t).bl && e.hp > 0
    );

    for (const [k, c] of m.entries()) {
      const { threatScore, threateningEnemiesCount } = this.getEnemyThreatAt(u.o, c.x, c.y);
      let score = -threatScore * 10 - threateningEnemiesCount * 15;

      // Absolute safety bonus: tile outside of enemy reach
      if (threatScore === 0) {
        score += 60;
      }

      // Distance from hostile front
      if (enemies.length) {
        const minEnemyDist = Math.min(
          ...enemies.map((e) => Math.hypot(e.x - c.x, e.y - c.y))
        );
        score += minEnemyDist * 6;
      }

      // Distance towards recovery anchor (Medic, HQ, Depot)
      if (retreatTarget) {
        const distToAnchor = Math.hypot(c.x - retreatTarget.x, c.y - retreatTarget.y);
        score -= distToAnchor * 4;
        if (distToAnchor <= 1.5) score += 30; // Direct contact with repair/medical zone
      }

      // Friendly screen cover: reward being near healthy allies
      const nearbyHealthyAllies = this.U.filter(
        (e) =>
          e.o === u.o &&
          e !== u &&
          !this.getBlueprint(e.t).bl &&
          e.hp > e.maxHp * 0.5 &&
          Math.hypot(e.x - c.x, e.y - c.y) <= 2
      );
      score += nearbyHealthyAllies.length * 6;

      if (score > highestSafetyScore) {
        highestSafetyScore = score;
        bestRetreatKey = k;
      }
    }

    // Pull back if we can escape danger or move toward medical recovery
    if (bestRetreatKey !== here && (currentThreat.threatScore > 0 || retreatTarget)) {
      await this.moveUnit(u, bestRetreatKey);
      this.addFloatingText(u, 'FALLING BACK', '#38bdf8');
      this.note = `${bp.n} pulled back to save hull & recover.`;

      // If unit can still act safely from its new position without exposing itself:
      if (this.canUnitAct(u)) {
        bp.ab.forEach((a, i) => {
          if (!this.canAffordAbility(u, a)) return;
          u.ai = i;
          const targets = this.getValidTargets(u, u.x, u.y, false);
          if (targets.length) {
            targets.sort((a1, b1) => a1.hp - b1.hp);
            u.ai = i;
            this.attackTarget(u, targets[0]);
            u.ai = 0;
          }
        });
        u.ai = 0;
      }
      return true;
    }

    return false;
  }

  // 3. Standoff Artillery positioning
  private async botArtilleryDecision(u: UnitInstance): Promise<boolean> {
    if (!'ALY'.includes(u.t)) return false;
    const enemies = this.U.filter(
      (e) => e.o !== u.o && e.o >= 0 && !this.getBlueprint(e.t).bl && e.hp > 0
    );
    if (!enemies.length) return false;

    const closestEnemy = [...enemies].sort(
      (a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)
    )[0];

    const currentDist = Math.hypot(closestEnemy.x - u.x, closestEnemy.y - u.y);

    // If enemy is within close range (<= 2.5 tiles) and artillery can back off to standoff range:
    if (currentDist <= 2.5 && this.canUnitMove(u)) {
      const m = this.reachMap(u);
      const bp = this.getBlueprint(u.t);
      const maxRg = Math.max(...bp.ab.map((a) => a.rg));
      let bestTile = `${u.x},${u.y}`;
      let bestScore = -999;

      for (const [k, c] of m.entries()) {
        const d = Math.hypot(closestEnemy.x - c.x, closestEnemy.y - c.y);
        if (d > currentDist && d <= maxRg) {
          const los = this.hasLineOfSight(c.x, c.y, closestEnemy.x, closestEnemy.y);
          const { threatScore } = this.getEnemyThreatAt(u.o, c.x, c.y);
          const score = d * 5 - threatScore * 6 + (los ? 15 : 0);
          if (score > bestScore) {
            bestScore = score;
            bestTile = k;
          }
        }
      }

      if (bestTile !== `${u.x},${u.y}`) {
        await this.moveUnit(u, bestTile);
        this.addFloatingText(u, 'STANDOFF FIRE', '#fbbf24');
        return true;
      }
    }

    return false;
  }

  private async waitIfPaused(): Promise<void> {
    while (this.paused) {
      await this.sleep(100);
    }
  }

  public async botTurn(): Promise<void> {
    const curGen = this.gen;
    const o = this.cur;
    this.busy = true;
    this.triggerChange();

    await this.sleep(400);
    await this.waitIfPaused();

    const friendlyUnits = this.U.filter((e) => e.o === o && !this.getBlueprint(e.t).bl);
    for (const u of friendlyUnits) {
      if (this.over || curGen !== this.gen) return;
      await this.waitIfPaused();
      await this.botUnitDecision(u);
      await this.sleep(100);
    }

    if (this.over || curGen !== this.gen) return;
    await this.waitIfPaused();

    // Bot Reinforcements with Counter-Intelligence
    const hq = this.U.find((e) => e.t === 'H' && e.o === o);
    if (hq) {
      const isHard = this.difficulty === 'hard' || this.difficulty === 'expert';
      const enemyUnits = this.U.filter(
        (e) => e.o !== o && e.o >= 0 && !this.getBlueprint(e.t).bl && e.hp > 0
      );
      const friendlyTroops = this.U.filter(
        (e) => e.o === o && !this.getBlueprint(e.t).bl && e.hp > 0
      );
      const hasDamagedAllies = friendlyTroops.some((e) => e.hp < e.maxHp * 0.7);
      const hasMedic = friendlyTroops.some((e) => e.t === 'K');
      const hasSupplier = friendlyTroops.some((e) => e.t === 'P');
      const enemyHasAir = enemyUnits.some((e) => AIR_UNITS.includes(e.t));
      const enemyHasArmor = enemyUnits.some((e) => 'TAYJL'.includes(e.t) || e.fu != null);

      const maxRecruits = isHard ? 4 : 3;

      for (let i = 0; i < maxRecruits; i++) {
        const zone = this.getDeployZone(o);
        if (!zone.length) break;

        let preferredType: UnitTypeCode | null = null;
        if (isHard) {
          if (hasDamagedAllies && !hasMedic && this.gold[o] >= this.getBlueprint('K').c) {
            preferredType = 'K'; // Deploy field medic!
          } else if (hasDamagedAllies && !hasSupplier && this.gold[o] >= this.getBlueprint('P').c && Math.random() < 0.6) {
            preferredType = 'P'; // Deploy supplier!
          } else if (enemyHasAir && !friendlyTroops.some((e) => e.t === 'Z') && this.gold[o] >= this.getBlueprint('Z').c) {
            preferredType = 'Z'; // Deploy anti-air flak!
          } else if (enemyHasArmor && this.gold[o] >= this.getBlueprint('G').c && Math.random() < 0.5) {
            preferredType = 'G'; // Deploy anti-tank infantry!
          } else if (this.gold[o] >= this.getBlueprint('T').c && Math.random() < 0.6) {
            preferredType = 'T'; // Deploy heavy battle tank!
          } else if (this.gold[o] >= this.getBlueprint('A').c && Math.random() < 0.4) {
            preferredType = 'A'; // Deploy artillery!
          }
        }

        const candidates: UnitTypeCode[] = isHard
          ? ['T', 'B', 'A', 'G', 'M', 'R', 'K', 'C', 'Y']
          : ['B', 'M', 'R', 'G', 'T', 'A', 'C', 'Y'];

        const affordable = candidates.filter((t) => this.getBlueprint(t).c <= this.gold[o]);
        if (!affordable.length && !preferredType) break;

        const pick =
          preferredType && this.getBlueprint(preferredType).c <= this.gold[o]
            ? preferredType
            : affordable[Math.floor(Math.random() * affordable.length)];

        if (!pick) break;
        this.gold[o] -= this.getBlueprint(pick).c;
        const e = this.addUnit(pick, o, zone[0][0], zone[0][1]);
        e.moved = 1;
        e.acted = 1;
        this.addSpark(zone[0][0], zone[0][1], FACTION_COLORS[o], 12, 3);
      }
    }

    await this.sleep(250);
    if (curGen !== this.gen) return;
    this.busy = false;
    if (!this.over) this.endTurn();
  }

  private async botUnitDecision(u: UnitInstance): Promise<void> {
    if (u.moved && u.acted) return;

    // A. Support Unit logic: Medics, Suppliers, Engineers heal & sustain
    const supportDone = await this.botSupportDecision(u);
    if (supportDone) return;

    // B. Critical Unit Pull-Back: Save wounded units & retreat to heal
    const retreatDone = await this.botRetreatDecision(u);
    if (retreatDone) return;

    // C. Artillery Standoff Maneuver
    const standoffDone = await this.botArtilleryDecision(u);
    if (standoffDone) return;

    const m = this.reachMap(u);
    const here = `${u.x},${u.y}`;

    // 1. Capture opportunity for infantry
    if (this.isInfantry(u) && !u.acted) {
      let bestCap: [string, UnitInstance] | null = null;
      let highestScore = 0;
      const hereCoord = m.get(here) || { x: u.x, y: u.y, p: null };
      const moveOpts: Array<[string, { x: number; y: number; p: string | null }]> = u.moved
        ? [[here, hereCoord]]
        : Array.from(m.entries());

      for (const [k, c] of moveOpts) {
        for (const b of this.getCapturableBuildings(u, c.x, c.y)) {
          const score = b.t === 'H' ? 12 : b.o >= 0 ? 8 : b.t === 'W' ? 6 : 5;
          if (score > highestScore) {
            highestScore = score;
            bestCap = [k, b];
          }
        }
      }
      if (bestCap) {
        if (bestCap[0] !== here) await this.moveUnit(u, bestCap[0]);
        await this.captureBuilding(u, bestCap[1]);
        return;
      }
    }

    // 2. Coordinated Attack & Focus-Fire Opportunity
    const bp = this.getBlueprint(u.t);
    let bestAttack: [string, UnitInstance, number] | null = null;
    let maxAttackScore = -1;
    const hereCoord = m.get(here) || { x: u.x, y: u.y, p: null };
    const attackMoveOpts: Array<[string, { x: number; y: number; p: string | null }]> = 'AL'.includes(u.t)
      ? [[here, hereCoord]]
      : Array.from(m.entries());

    if (this.canUnitAct(u)) {
      bp.ab.forEach((a, i) => {
        if (!this.canAffordAbility(u, a)) return;
        u.ai = i;
        for (const [k, c] of attackMoveOpts) {
          for (const e of this.getValidTargets(u, c.x, c.y, false)) {
            const isKill = e.hp <= a.d;
            let sc = Math.min(e.hp, a.d) * 2;
            if (isKill) sc += 18; // Focus fire kill
            if (e.t === 'H') sc += 14; // HQ target
            if ('TAJY'.includes(e.t)) sc += 8; // Heavy armor & artillery
            if (e.t === 'K' || e.t === 'P') sc += 6; // Enemy medics & suppliers
            if (a.f.includes('a') && e.fu != null) sc += 5; // Anti-vehicle bonus
            if (a.f.includes('b') && this.getBlueprint(e.t).bl) sc += a.d * 2; // Demolition bonus
            if (a.f.includes('j') && !e.fz) sc += 12; // EMP Jamming high-value targets

            // Position safety bonus
            const { threatScore } = this.getEnemyThreatAt(u.o, c.x, c.y);
            sc -= threatScore * 1.5;

            if (sc > maxAttackScore) {
              maxAttackScore = sc;
              bestAttack = [k, e, i];
            }
          }
        }
      });
      u.ai = 0;
    }

    if (bestAttack) {
      if (bestAttack[0] !== here) await this.moveUnit(u, bestAttack[0]);
      u.ai = bestAttack[2];
      await this.attackTarget(u, bestAttack[1]);
      u.ai = 0;
      return;
    }

    // 3. Tactical Advance using BFS pathfinding around obstacles
    if (!this.canUnitMove(u)) return;
    const enemies = this.U.filter(
      (e) => e.o !== u.o && (this.isInfantry(u) || e.o >= 0 || !this.getBlueprint(e.t).bl) && e.hp > 0
    );
    if (!enemies.length) return;

    enemies.sort(
      (a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)
    );
    const target = enemies[0];

    const dField = this.distanceField(target.x, target.y);
    let bestDist = dField[u.y * this.N + u.x];
    let bestKey = here;

    for (const [k, c] of m.entries()) {
      if (!c) continue;
      const d = dField[c.y * this.N + c.x];
      const { threatScore } = this.getEnemyThreatAt(u.o, c.x, c.y);
      const adjustedDistance = d + (threatScore > 8 ? 4 : 0);
      if (adjustedDistance < bestDist) {
        bestDist = adjustedDistance;
        bestKey = k;
      }
    }

    if (bestKey !== here) {
      await this.moveUnit(u, bestKey);
    }
  }

  // Animation & Particle Helpers
  public async tween(durationMs: number, fn: (k: number) => void): Promise<void> {
    const adjDuration = durationMs / this.gameSpeed;
    const start = performance.now();
    return new Promise((resolve) => {
      const step = () => {
        const k = Math.min(1, (performance.now() - start) / adjDuration);
        fn(k);
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      step();
    });
  }

  public sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms / this.gameSpeed));
  }

  public addSpark(x: number, y: number, c: string, n = 10, sp = 3, s = 3): void {
    for (let i = 0; i < n && this.pt.length < 500; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * sp;
      this.pt.push({
        x: (x + 0.5) * this.C,
        y: (y + 0.5) * this.C,
        gx: x,
        gy: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 0.4,
        l: 1,
        d: 0.02 + Math.random() * 0.03,
        c,
        s: s * (0.5 + Math.random()),
      });
    }
  }

  public addRing(x: number, y: number, c: string, R = 70): void {
    const item: FxItem = { id: Math.random().toString(), f: 'r', x, y, k: 0, c, R };
    this.fx.push(item);
    this.tween(600, (k) => (item.k = k)).then(() => {
      this.fx = this.fx.filter((z) => z !== item);
    });
  }

  public addFloatingText(target: { x: number; y: number }, text: string, c: string): void {
    const item: FxItem = {
      id: Math.random().toString(),
      f: 't',
      x: target.x,
      y: target.y,
      s: text,
      c,
      k: 0,
    };
    this.fx.push(item);
    this.tween(750, (k) => (item.k = k)).then(() => {
      this.fx = this.fx.filter((z) => z !== item);
    });
  }

  public triggerExplosion(v: { x: number; y: number; t?: UnitTypeCode }, isBig = false): void {
    const isHq = v.t === 'H';
    SoundEngine.play('boom', v.x, v.y);
    this.addSpark(v.x, v.y, '#fbbf24', 35, 6, 5);
    this.addSpark(v.x, v.y, '#f97316', 22, 5, 5);
    this.addRing(v.x, v.y, '#fbbf24');
    this.addRing(v.x, v.y, '#f97316');
    this.scorch.push({ x: v.x, y: v.y, r: isHq ? 24 : 18, a: 0.4 });
    if (this.scorch.length > 70) this.scorch.shift();
    this.flash = Math.max(this.flash, isHq ? 0.7 : 0.4);
    this.shake = Math.max(this.shake, isHq ? 20 : 10);
  }

  public async shootAnimation(u: UnitInstance, target: { x: number; y: number }): Promise<void> {
    const vis = this.getVisibilityMap(this.view);
    const seen = vis[u.y * this.N + u.x] || vis[target.y * this.N + target.x];
    const t = u.t;
    const shotColors: Record<string, string> = {
      R: '#fde047',
      M: '#fb923c',
      A: '#f97316',
      S: '#e2e8f0',
      B: '#f87171',
      P: '#4ade80',
      C: '#fde047',
      L: '#fb7185',
      F: '#fbbf24',
      E: '#22d3ee',
      G: '#fde047',
      Y: '#fbbf24',
      J: '#f87171',
      T: '#fb7185',
      Z: '#fde047',
      V: '#fbbf24',
      D: '#22d3ee',
      U: '#fde047',
      Q: '#38bdf8',
      I: '#94a3b8',
      X: '#f97316',
    };
    const c = shotColors[t] || '#fde047';

    if (target.x !== u.x) u.dr = target.x > u.x ? 1 : -1;
    await this.tween(seen ? 250 : 1, (k) => (u.wx = Math.sin(k * 50) * 3 * (1 - k)));
    u.wx = 0;
    u.rc = 1;
    this.addSpark(u.x, u.y, c, 10, 4, 3);
    SoundEngine.play(t, u.x, u.y, seen);

    const isBeam = 'SED'.includes(t);
    const projectile: FxItem = {
      id: Math.random().toString(),
      f: 'p',
      ox: u.x,
      oy: u.y,
      x: u.x,
      y: u.y,
      c,
      r: 'ABLJD'.includes(t) ? 7 : 3,
      l: isBeam,
      h: 0,
      seen,
      k: 0,
    };
    this.fx.push(projectile);

    const travelTimes: Record<string, number> = {
      S: 120,
      R: 180,
      A: 500,
      B: 340,
      L: 480,
      C: 150,
      D: 100,
      U: 160,
      Q: 140,
      I: 110,
      X: 190,
    };
    const travelTime = !seen ? 1 : travelTimes[t] || 240;

    await this.tween(travelTime, (k) => {
      projectile.x = u.x + (target.x - u.x) * k;
      projectile.y = u.y + (target.y - u.y) * k;
      projectile.h = 'AL'.includes(t) ? Math.sin(k * Math.PI) * 60 : 0;
    });
    this.fx = this.fx.filter((z) => z !== projectile);

    const isArtillery = 'AL'.includes(t);
    const explosion: FxItem = {
      id: Math.random().toString(),
      f: 'e',
      x: target.x,
      y: target.y,
      k: 0,
      c,
      seen,
      b: 'ABL'.includes(t),
      big: isArtillery,
    };
    if (seen) {
      this.addSpark(target.x, target.y, c, isArtillery ? 25 : 12, 5, 4);
      if (isArtillery) this.shake = Math.max(this.shake, 12);
    }
    this.fx.push(explosion);
    await this.tween(seen ? (isArtillery ? 450 : 220) : 1, (k) => (explosion.k = k));
    this.fx = this.fx.filter((z) => z !== explosion);
  }
}
