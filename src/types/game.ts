/**
 * Frontline Command - Tactical Warfare Game Types
 */

export type UnitTypeCode =
  | 'H' // HQ
  | 'O' // Outpost
  | 'W' // Barracks
  | 'R' // Riflemen
  | 'G' // Commando
  | 'S' // Sniper
  | 'P' // Supplier
  | 'K' // Medic
  | 'T' // Anti-Tank
  | 'Z' // Machine Gunner
  | 'N' // Engineer
  | 'C' // Scout
  | 'V' // Strike Drone
  | 'M' // Multi FTank
  | 'B' // Battle Tank
  | 'A' // Artillery
  | 'Y' // Gunship
  | 'F' // Bomber
  | 'L' // Rocket Launcher
  | 'E' // EMP Jammer
  | 'J' // Juggernaut
  | 'D' // Railgun Destroyer (Heavy Anti-Armor)
  | 'U' // Flak Halftrack (Anti-Air & Light Suppression)
  | 'Q' // Hovercraft Skimmer (Rapid Amphibious Raider)
  | 'I' // Infiltrator (Stealth Operative & Recon)
  | 'X'; // Shock Trooper (Flamethrower Assault)

export interface Ability {
  n: string; // name
  d: number; // damage / repair amount
  rg: number; // range
  f: string; // flags: 'i' (indirect), 'd' (diagonal), 's' (splash), 'a' (anti-armor), 'b' (anti-building), 'r' (repair), 'h' (resupply), 'j' (jam/EMP), 'u' (pin), 'x' (suicide/kamikaze)
  a?: number; // ammo cost (default 1)
  cd?: number; // cooldown turns
}

export interface UnitBlueprint {
  n: string; // name
  hp: number;
  c: number; // deployment cost in gold
  mv: number; // movement reach
  fu?: number; // fuel capacity
  am?: number; // ammo capacity
  v: number; // vision / fog-of-war reach
  bl?: number; // 1 if building, undefined if unit
  ab: Ability[];
  d: number; // max damage
  tier?: 1 | 2 | 3 | 4; // 1: Starter, 2: Tactical, 3: Advanced, 4: Heavy/Apex
  mitsCost?: number; // Cost in Mits to unlock in tech tree (0 for starter units)
  description?: string;
}

export interface UnitInstance {
  id: string;
  t: UnitTypeCode;
  o: number; // owner faction index (0: Blue/Player, 1: Red/Enemy, 2: Amber, 3: Violet, -1: Neutral)
  x: number;
  y: number;
  rx: number; // interpolated render x
  ry: number; // interpolated render y
  hp: number;
  maxHp: number;
  fu?: number;
  maxFu?: number;
  am?: number;
  maxAm?: number;
  moved: number;
  acted: number;
  cd: number; // ability cooldown timer
  wx: number; // weapon recoil shake
  ph: number; // animation phase
  dr: number; // direction (1: right, -1: left)
  rc: number; // recoil counter
  mw: number; // moving walk flag
  fz?: number; // 1 if jammed/frozen
  sp?: number; // 1 if pinned
  fl?: number; // flash timestamp on damage
  ai?: number; // active selected ability index
  gm?: number; // ground aim mode (target empty tile)
  us?: number; // supply used flag (for barracks)
  isVip?: boolean; // Mission VIP target
  isDefendTarget?: boolean; // Mission structure or unit that player must protect
  customName?: string; // e.g. "Colossus Titan", "Allied Relay Station"
}

export interface CellCoord {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  gx: number;
  gy: number;
  vx: number;
  vy: number;
  gv?: number; // gravity
  l: number; // life (0..1)
  d: number; // decay rate
  c: string; // color
  s: number; // size
  gr?: number; // ground smoke flag
}

export interface ScorchMark {
  x: number;
  y: number;
  r: number;
  a: number;
}

export interface FxItem {
  id: string;
  f: 'r' | 't' | 'l' | 'p' | 'e'; // ring, text, light, projectile, explosion
  x: number;
  y: number;
  ox?: number;
  oy?: number;
  c: string;
  s?: string; // text
  k: number; // progress (0..1)
  R?: number; // ring radius
  r?: number; // projectile radius
  l?: boolean; // laser beam
  h?: number; // projectile arc height
  b?: boolean; // big blast
  big?: boolean; // artillery massive shock
  seen?: boolean;
}

export type CampaignObjectiveType =
  | 'destroy_hq'
  | 'holdout'
  | 'defend_and_attack'
  | 'counterattack'
  | 'destroy_vip'
  | 'capture_outposts'
  | 'turn_limit'
  | 'no_friendly_losses'
  | 'destroy_all';

export interface CampaignObjective {
  id: string;
  text: string;
  type: CampaignObjectiveType;
  targetCount?: number;
  isBonus?: boolean;
  rewardMits?: number;
}

export interface CampaignMission {
  id: string;
  branchId: string;
  number: number;
  chapter: number;
  title: string;
  codename: string;
  briefing: string;
  intelBrief: string;
  objectiveType: 'destroy_hq' | 'holdout' | 'defend_and_attack' | 'counterattack' | 'destroy_vip' | 'capture_outposts';
  holdoutTurns?: number;
  defendTargetName?: string;
  defendTargetCoord?: { x: number; y: number };
  vipTargetName?: string;
  vipTargetCoord?: { x: number; y: number };
  mapSize: number; // 15 or 30
  playerGold: number;
  enemyGold: number;
  enemyFactionName: string;
  factionsCount: number; // 2, 3, or 4
  rewardMits: number;
  rewardIntel: number;
  difficulty?: 'normal' | 'hard' | 'expert';
  objectives: CampaignObjective[];
  preplacedMines?: Array<{ x: number; y: number; w?: boolean }>;
  preplacedObstacles?: Array<{ x: number; y: number; type: number }>;
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
}

export interface CampaignBranch {
  id: string;
  number: number;
  title: string;
  codename: string;
  description: string;
  unlockCostMits: number;
  requiredPriorBranchId?: string;
  missionIds: string[];
  theaterTheme: 'temperate' | 'desert' | 'arctic' | 'fortress' | 'volcanic' | 'archipelago';
}

export interface CosmeticSkin {
  id: string;
  name: string;
  description: string;
  costMits: number;
  accentColor: string;
  hullTone: string;
  camoStyle: string;
}

export interface ArmoryUpgrade {
  id: string;
  category: 'infantry' | 'armor' | 'aviation' | 'logistics' | 'tactics';
  title: string;
  description: string;
  costMits: number;
  costIntel: number;
  maxLevel: number;
  statBonus: string;
}

export interface PlayerProfile {
  slotId: number;
  profileName: string;
  lastSaved: number;
  mits: number; // Core currency (Mits) earned from campaigns and used in tech tree
  credits?: number; // Backwards-compatible alias
  intel: number; // Tech Research Stars
  unlockedUnits: UnitTypeCode[]; // Unit codes unlocked for player deployment
  unlockedBranches: string[]; // Branch IDs unlocked for campaign operations
  unlockedSkins: string[]; // Cosmetic skin IDs unlocked
  activeSkin: string; // Currently equipped skin ID
  campaignProgress: Record<
    string,
    {
      completed: boolean;
      stars: number;
      bestTurns?: number;
      completedObjectives: string[];
    }
  >;
  purchasedUpgrades: Record<string, number>; // upgradeId -> level
  skirmishStats: {
    battles: number;
    victories: number;
    defeats: number;
    enemiesEliminated: number;
    outpostsCaptured: number;
    totalCreditsEarned: number;
  };
}

export interface GraphicsSettings {
  quality: number; // 1 to 10
  soundMode: number; // 0: default (distant fog echo), 1: everywhere, 2: muffler (fog silent)
  masterVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  muted: boolean;
  screenShake: boolean;
  gameSpeed: number; // 0.5, 1, 2, 4
}
