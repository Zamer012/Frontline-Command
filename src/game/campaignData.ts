import { CampaignMission, CampaignBranch } from '../types/game';

export const CAMPAIGN_BRANCHES: CampaignBranch[] = [
  {
    id: 'branch_iron_dawn',
    number: 1,
    title: 'Operation Iron Dawn',
    codename: 'SECTOR ALPHA',
    description: 'Frontline operations establishing combined-arms doctrine, bridgehead defense, and urban barricade holdouts.',
    unlockCostMits: 0,
    missionIds: ['op_01_dawnbreak', 'op_02_river_crossing', 'op_03_iron_crossroad'],
    theaterTheme: 'temperate',
  },
  {
    id: 'branch_desert_thunder',
    number: 2,
    title: 'Operation Desert Thunder',
    codename: 'SIEGE OF KARRAK',
    description: 'Scorching desert warfare demanding counterattacks against armored vanguards, railgun prototype hunts, and mineral outpost domination.',
    unlockCostMits: 300,
    requiredPriorBranchId: 'branch_iron_dawn',
    missionIds: ['op_04_desert_crucible', 'op_05_dune_strider', 'op_06_crater_basin'],
    theaterTheme: 'desert',
  },
  {
    id: 'branch_arctic_tempest',
    number: 3,
    title: 'Operation Arctic Tempest',
    codename: 'PROJECT COLDFRONT',
    description: 'Sub-zero mountain combat featuring alpine radar defense, blizzard holdouts, and frozen mountain pass counterattacks.',
    unlockCostMits: 500,
    requiredPriorBranchId: 'branch_desert_thunder',
    missionIds: ['op_07_project_overcast', 'op_08_blackout_protocol', 'op_09_glacier_chokepoint'],
    theaterTheme: 'arctic',
  },
  {
    id: 'branch_eclipse_citadel',
    number: 4,
    title: 'Operation Eclipse Citadel',
    codename: 'THE FINAL FRONTLINE',
    description: 'Assault on super-heavy fortress bastions: hunt the Colossus Juggernaut Titan, defend siege depots, and conquer continental Grand War.',
    unlockCostMits: 800,
    requiredPriorBranchId: 'branch_arctic_tempest',
    missionIds: ['op_10_titans_fall', 'op_11_citadel_bastion', 'op_12_grand_war'],
    theaterTheme: 'fortress',
  },
  {
    id: 'branch_obsidian_bastion',
    number: 5,
    title: 'Operation Obsidian Bastion',
    codename: 'VOLCANIC DEEP SIEGE',
    description: 'Hostile subterranean lava fields and magma ridges. Hold defensive lines against drone blitzes, counterattack armored breaches, and neutralize twin dreadnoughts.',
    unlockCostMits: 1100,
    requiredPriorBranchId: 'branch_eclipse_citadel',
    missionIds: ['op_13_magma_ridge', 'op_14_volcanic_breach', 'op_15_warlord_dreadnought', 'op_16_geothermal_grid'],
    theaterTheme: 'volcanic',
  },
  {
    id: 'branch_valkyrie_dawn',
    number: 6,
    title: 'Operation Valkyrie Dawn',
    codename: 'ARCHIPELAGO SOVEREIGN',
    description: 'High-stakes coastal and island warfare: amphibious beachhead defense, atoll siege holdouts, skyfall air counterstrikes, and the 4-way Apex Sovereign War.',
    unlockCostMits: 1500,
    requiredPriorBranchId: 'branch_obsidian_bastion',
    missionIds: ['op_17_beachhead_landing', 'op_18_atoll_holdout', 'op_19_skyfall_strike', 'op_20_apex_sovereign'],
    theaterTheme: 'archipelago',
  },
];

export const CAMPAIGN_MISSIONS: CampaignMission[] = [
  // ==========================================
  // --- BRANCH 1: IRON DAWN (TEMPERATE) ---
  // ==========================================
  {
    id: 'op_01_dawnbreak',
    branchId: 'branch_iron_dawn',
    number: 1,
    chapter: 1,
    title: 'Operation Dawnbreak',
    codename: 'FIRST STRIKE',
    objectiveType: 'destroy_hq',
    briefing:
      'Hostile Ironclad scouts have fortified a forward observation perimeter in the border valley. Deploy basic Riflemen and Battle Tanks, capture the neutral forward outpost to fund reinforcements, and destroy their Command Post.',
    intelBrief:
      'Infantry (Riflemen, Medics, Anti-Tank) are the only units capable of capturing structures. Stand adjacent to an outpost or barracks and issue the capture order.',
    mapSize: 15,
    playerGold: 26,
    enemyGold: 20,
    enemyFactionName: 'Ironclad Recon Wing',
    factionsCount: 2,
    rewardMits: 350,
    rewardIntel: 1,
    difficulty: 'normal',
    objectives: [
      { id: 'primary', text: 'Assault and destroy hostile Command HQ', type: 'destroy_hq' },
      { id: 'bonus_turns', text: 'Achieve victory in 12 turns or fewer', type: 'turn_limit', targetCount: 12, isBonus: true, rewardMits: 150 },
      { id: 'bonus_capture', text: 'Control forward outpost for reinforcements', type: 'capture_outposts', targetCount: 1, isBonus: true, rewardMits: 100 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 3, y: 5, w: false },
      { x: 11, y: 9, w: false },
    ],
    preplacedObstacles: [
      { x: 5, y: 6, type: 1 },
      { x: 9, y: 8, type: 1 },
      { x: 7, y: 4, type: 2 },
    ],
  },
  {
    id: 'op_02_river_crossing',
    branchId: 'branch_iron_dawn',
    number: 2,
    chapter: 1,
    title: 'River Crossing',
    codename: 'BRIDGEHEAD DEFENSE & ASSAULT',
    objectiveType: 'defend_and_attack',
    defendTargetName: 'Allied Bridgehead Outpost',
    defendTargetCoord: { x: 7, y: 10 },
    briefing:
      'DEFEND AND ATTACK: Protect your forward Bridgehead Outpost at all costs while pushing armor across the river crossings to neutralize the enemy heavy gun battery and destroy their fortress.',
    intelBrief:
      'The enemy will send attack waves down the bridge corridors. Keep an Anti-Tank team and Medic stationed near your Bridgehead Outpost to hold the line while your strike team flanks.',
    mapSize: 15,
    playerGold: 32,
    enemyGold: 28,
    enemyFactionName: 'Ironclad Border Guard',
    factionsCount: 2,
    rewardMits: 480,
    rewardIntel: 1,
    difficulty: 'normal',
    objectives: [
      { id: 'primary', text: 'Protect Bridgehead Outpost & Destroy Enemy HQ', type: 'defend_and_attack' },
      { id: 'bonus_turns', text: 'Complete operation within 14 turns', type: 'turn_limit', targetCount: 14, isBonus: true, rewardMits: 180 },
      { id: 'bonus_losses', text: 'Suffer zero friendly casualties', type: 'no_friendly_losses', isBonus: true, rewardMits: 200 },
    ],
    preplacedMines: [
      { x: 7, y: 10, w: false },
      { x: 4, y: 4, w: true },
      { x: 10, y: 4, w: false },
    ],
    preplacedObstacles: [
      // River obstacle barrier with 2 bridge gaps at x=4 and x=10
      { x: 0, y: 7, type: 2 }, { x: 1, y: 7, type: 2 }, { x: 2, y: 7, type: 2 }, { x: 3, y: 7, type: 2 },
      { x: 5, y: 7, type: 2 }, { x: 6, y: 7, type: 2 }, { x: 7, y: 7, type: 2 }, { x: 8, y: 7, type: 2 }, { x: 9, y: 7, type: 2 },
      { x: 11, y: 7, type: 2 }, { x: 12, y: 7, type: 2 }, { x: 13, y: 7, type: 2 }, { x: 14, y: 7, type: 2 },
    ],
    preplacedUnits: [
      { t: 'O', o: 0, x: 7, y: 10, hp: 12, maxHp: 12, isDefendTarget: true, name: 'Allied Bridgehead Outpost' },
    ],
  },
  {
    id: 'op_03_iron_crossroad',
    branchId: 'branch_iron_dawn',
    number: 3,
    chapter: 1,
    title: 'Iron Crossroad',
    codename: 'URBAN HOLDOUT',
    objectiveType: 'holdout',
    holdoutTurns: 10,
    briefing:
      'HOLDOUT PROTOCOL: Entrench inside the central urban intersection and hold the perimeter for 10 full turns against continuous Ironclad assault battalions! If your Command HQ survives the countdown, victory is yours.',
    intelBrief:
      'Deploy Machine Gunners and Snipers behind the concrete ruins. Use Medics to continuously triage wounded soldiers as enemy waves arrive from the northern plaza.',
    mapSize: 15,
    playerGold: 38,
    enemyGold: 36,
    enemyFactionName: 'Ironclad Citadel Guard',
    factionsCount: 2,
    rewardMits: 580,
    rewardIntel: 2,
    difficulty: 'normal',
    objectives: [
      { id: 'primary', text: 'Survive the siege for 10 turns', type: 'holdout', targetCount: 10 },
      { id: 'bonus_losses', text: 'Lose 2 or fewer friendly units during the siege', type: 'no_friendly_losses', isBonus: true, rewardMits: 220 },
      { id: 'bonus_capture', text: 'Hold the central plaza outpost', type: 'capture_outposts', targetCount: 1, isBonus: true, rewardMits: 180 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 3, y: 9, w: false },
      { x: 11, y: 9, w: false },
    ],
    preplacedObstacles: [
      // Concrete city blocks forming crossroads
      { x: 4, y: 4, type: 2 }, { x: 4, y: 5, type: 2 }, { x: 5, y: 4, type: 2 },
      { x: 10, y: 4, type: 2 }, { x: 10, y: 5, type: 2 }, { x: 9, y: 4, type: 2 },
      { x: 4, y: 10, type: 2 }, { x: 4, y: 9, type: 2 }, { x: 5, y: 10, type: 2 },
      { x: 10, y: 10, type: 2 }, { x: 10, y: 9, type: 2 }, { x: 9, y: 10, type: 2 },
    ],
  },

  // ==========================================
  // --- BRANCH 2: DESERT THUNDER (DESERT) ---
  // ==========================================
  {
    id: 'op_04_desert_crucible',
    branchId: 'branch_desert_thunder',
    number: 4,
    chapter: 2,
    title: 'Desert Crucible',
    codename: 'ARMORED COUNTERATTACK',
    objectiveType: 'counterattack',
    briefing:
      'COUNTERATTACK: Hostile armor has initiated a forward blitz, deploying tanks in the mid-desert ridges. Absorb their initial shock wave, wipe out their forward vanguard, and counterattack their desert HQ depot!',
    intelBrief:
      'Enemy tanks start with forward positioning. Position Anti-Tank missile squads and Multi FTanks in defensive hulldown postures to absorb the charge before pushing north.',
    mapSize: 15,
    playerGold: 40,
    enemyGold: 38,
    enemyFactionName: 'Ironclad Armored Vanguard',
    factionsCount: 2,
    rewardMits: 650,
    rewardIntel: 2,
    difficulty: 'hard',
    objectives: [
      { id: 'primary', text: 'Repel enemy armored vanguard and conquer desert HQ', type: 'counterattack' },
      { id: 'bonus_turns', text: 'Finish within 14 turns', type: 'turn_limit', targetCount: 14, isBonus: true, rewardMits: 250 },
      { id: 'bonus_losses', text: 'Limit casualties to 1 friendly unit or fewer', type: 'no_friendly_losses', isBonus: true, rewardMits: 250 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 4, y: 4, w: true },
      { x: 10, y: 10, w: true },
    ],
    preplacedObstacles: [
      { x: 3, y: 6, type: 1 }, { x: 4, y: 6, type: 1 },
      { x: 10, y: 6, type: 1 }, { x: 11, y: 6, type: 1 },
      { x: 7, y: 8, type: 1 },
    ],
    preplacedUnits: [
      // Hostile forward armored shock vanguard
      { t: 'B', o: 1, x: 5, y: 5 },
      { t: 'T', o: 1, x: 9, y: 5 },
      { t: 'C', o: 1, x: 7, y: 6 },
      { t: 'M', o: 1, x: 8, y: 4 },
    ],
  },
  {
    id: 'op_05_dune_strider',
    branchId: 'branch_desert_thunder',
    number: 5,
    chapter: 2,
    title: 'Dune Strider',
    codename: 'PROTOTYPE RAILGUN HUNT',
    objectiveType: 'destroy_vip',
    vipTargetName: 'Prototype Railgun Dreadnought',
    vipTargetCoord: { x: 7, y: 3 },
    briefing:
      'VIP ASSASSINATION: Enemy engineers have deployed an experimental Prototype Railgun Dreadnought to the sand dunes. It is firing hypervelocity rounds through our supply columns. Hunt it down and eliminate it!',
    intelBrief:
      'The Prototype Railgun Dreadnought has 14 HP and pierces all units in a straight line. Jam it with EMP or rush it with fast Hovercraft Skimmers to strike at point-blank range.',
    mapSize: 15,
    playerGold: 45,
    enemyGold: 42,
    enemyFactionName: 'Ironclad Heavy Tank Brigade',
    factionsCount: 2,
    rewardMits: 800,
    rewardIntel: 2,
    difficulty: 'hard',
    objectives: [
      { id: 'primary', text: 'Locate and destroy the Prototype Railgun Dreadnought', type: 'destroy_vip' },
      { id: 'bonus_turns', text: 'Eliminate prototype within 12 turns', type: 'turn_limit', targetCount: 12, isBonus: true, rewardMits: 300 },
      { id: 'bonus_capture', text: 'Capture desert fuel outpost', type: 'capture_outposts', targetCount: 1, isBonus: true, rewardMits: 200 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 2, y: 6, w: false },
      { x: 12, y: 6, w: false },
    ],
    preplacedObstacles: [
      { x: 3, y: 4, type: 1 }, { x: 4, y: 4, type: 1 },
      { x: 10, y: 4, type: 1 }, { x: 11, y: 4, type: 1 },
      { x: 6, y: 9, type: 1 }, { x: 8, y: 9, type: 1 },
    ],
    preplacedUnits: [
      { t: 'D', o: 1, x: 7, y: 3, hp: 14, maxHp: 14, isVip: true, name: 'Prototype Railgun Dreadnought' },
      { t: 'B', o: 1, x: 6, y: 3 },
      { t: 'B', o: 1, x: 8, y: 3 },
    ],
  },
  {
    id: 'op_06_crater_basin',
    branchId: 'branch_desert_thunder',
    number: 6,
    chapter: 2,
    title: 'Crater Basin',
    codename: 'OUTPOST DOMINATION',
    objectiveType: 'capture_outposts',
    briefing:
      'OUTPOST DOMINATION: A high-stakes 3-way conflict in a mineral crater basin. Instead of standard destruction, victory is achieved by capturing and controlling at least 3 strategic resource outposts simultaneously!',
    intelBrief:
      'Enemy factions will fight each other for the center. Send fast infantry in scout buggies or skimmers to capture peripheral outposts and fortify them with machine guns.',
    mapSize: 15,
    playerGold: 50,
    enemyGold: 45,
    enemyFactionName: 'Ironclad & Syndicate Alliance',
    factionsCount: 3,
    rewardMits: 950,
    rewardIntel: 3,
    difficulty: 'hard',
    objectives: [
      { id: 'primary', text: 'Capture and hold at least 3 resource outposts', type: 'capture_outposts', targetCount: 3 },
      { id: 'bonus_turns', text: 'Establish domination in under 16 turns', type: 'turn_limit', targetCount: 16, isBonus: true, rewardMits: 350 },
      { id: 'bonus_losses', text: 'Zero friendly infantry lost to enemy fire', type: 'no_friendly_losses', isBonus: true, rewardMits: 300 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 3, y: 4, w: false },
      { x: 11, y: 4, w: false },
      { x: 7, y: 11, w: false },
    ],
    preplacedObstacles: [
      // Crater rim circular obstacle ring
      { x: 6, y: 5, type: 1 }, { x: 7, y: 5, type: 1 }, { x: 8, y: 5, type: 1 },
      { x: 5, y: 7, type: 1 }, { x: 9, y: 7, type: 1 },
      { x: 6, y: 9, type: 1 }, { x: 7, y: 9, type: 1 }, { x: 8, y: 9, type: 1 },
    ],
  },

  // ==========================================
  // --- BRANCH 3: ARCTIC TEMPEST (ARCTIC) ---
  // ==========================================
  {
    id: 'op_07_project_overcast',
    branchId: 'branch_arctic_tempest',
    number: 7,
    chapter: 3,
    title: 'Project Overcast',
    codename: 'RADAR DEFENSE & AIR STRIKE',
    objectiveType: 'defend_and_attack',
    defendTargetName: 'Alpine Radar Station',
    defendTargetCoord: { x: 3, y: 11 },
    briefing:
      'DEFEND AND ATTACK: Protect the Allied Alpine Radar Station from hostile bomber wings and gunships while deploying Flak Halftracks and Strike Drones to obliterate the enemy mountain fortress.',
    intelBrief:
      'Enemy bombers will prioritize your Radar Station. Position Flak Halftracks adjacent to the station to intercept airborne targets with devastating anti-air flak.',
    mapSize: 15,
    playerGold: 48,
    enemyGold: 48,
    enemyFactionName: 'Ironclad Sky Wing',
    factionsCount: 2,
    rewardMits: 880,
    rewardIntel: 3,
    difficulty: 'hard',
    objectives: [
      { id: 'primary', text: 'Protect Alpine Radar & Neutralize Enemy Air Fortress', type: 'defend_and_attack' },
      { id: 'bonus_turns', text: 'Win in 14 turns or fewer', type: 'turn_limit', targetCount: 14, isBonus: true, rewardMits: 320 },
      { id: 'bonus_losses', text: 'Keep radar station health above 50%', type: 'no_friendly_losses', isBonus: true, rewardMits: 250 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: true },
      { x: 11, y: 10, w: false },
    ],
    preplacedObstacles: [
      { x: 4, y: 5, type: 1 }, { x: 5, y: 5, type: 1 }, { x: 6, y: 5, type: 1 },
      { x: 9, y: 8, type: 1 }, { x: 10, y: 8, type: 1 }, { x: 11, y: 8, type: 1 },
    ],
    preplacedUnits: [
      { t: 'O', o: 0, x: 3, y: 11, hp: 14, maxHp: 14, isDefendTarget: true, name: 'Allied Alpine Radar Station' },
    ],
  },
  {
    id: 'op_08_blackout_protocol',
    branchId: 'branch_arctic_tempest',
    number: 8,
    chapter: 3,
    title: 'Blackout Protocol',
    codename: 'BLIZZARD HOLDOUT',
    objectiveType: 'holdout',
    holdoutTurns: 12,
    briefing:
      'HOLDOUT PROTOCOL: A sub-zero EMP blizzard has blanketed the valley. Weather 12 turns of relentless assaults from Syndicate cyber-tanks and stealth Infiltrators until relief columns arrive!',
    intelBrief:
      'EMP pulses freeze target mechanical systems. Deploy infantry and engineers who are immune to vehicle system shutdowns to protect your Command Post.',
    mapSize: 15,
    playerGold: 54,
    enemyGold: 54,
    enemyFactionName: 'Syndicate Cyber Brigade',
    factionsCount: 2,
    rewardMits: 1050,
    rewardIntel: 3,
    difficulty: 'hard',
    objectives: [
      { id: 'primary', text: 'Survive the blizzard siege for 12 turns', type: 'holdout', targetCount: 12 },
      { id: 'bonus_losses', text: 'Keep friendly losses to 2 or fewer units', type: 'no_friendly_losses', isBonus: true, rewardMits: 380 },
      { id: 'bonus_capture', text: 'Control 2 permafrost supply depots', type: 'capture_outposts', targetCount: 2, isBonus: true, rewardMits: 300 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 3, y: 7, w: false },
      { x: 11, y: 7, w: false },
    ],
    preplacedObstacles: [
      { x: 2, y: 5, type: 1 }, { x: 2, y: 9, type: 1 },
      { x: 12, y: 5, type: 1 }, { x: 12, y: 9, type: 1 },
      { x: 6, y: 7, type: 2 }, { x: 8, y: 7, type: 2 },
    ],
  },
  {
    id: 'op_09_glacier_chokepoint',
    branchId: 'branch_arctic_tempest',
    number: 9,
    chapter: 3,
    title: 'Glacier Chokepoint',
    codename: 'MOUNTAIN AMBUSH COUNTERATTACK',
    objectiveType: 'counterattack',
    briefing:
      'COUNTERATTACK: Hostile frost guards have occupied the narrow glacier pass with an advanced ambush column. Smash through their forward roadblock and launch a decisive counterstrike on their command bunker!',
    intelBrief:
      'Use indirect Rocket Launchers and Shock Troopers to clear the enemy roadblock without exposing your tanks to anti-armor crossfires.',
    mapSize: 15,
    playerGold: 58,
    enemyGold: 58,
    enemyFactionName: 'Syndicate Frost Guard',
    factionsCount: 2,
    rewardMits: 1180,
    rewardIntel: 3,
    difficulty: 'hard',
    objectives: [
      { id: 'primary', text: 'Overcome mountain pass vanguard and destroy command bunker', type: 'counterattack' },
      { id: 'bonus_turns', text: 'Clear the pass in under 15 turns', type: 'turn_limit', targetCount: 15, isBonus: true, rewardMits: 400 },
      { id: 'bonus_capture', text: 'Capture all 3 permafrost outposts', type: 'capture_outposts', targetCount: 3, isBonus: true, rewardMits: 350 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 4, y: 4, w: false },
      { x: 10, y: 4, w: false },
    ],
    preplacedObstacles: [
      // Glacier walls channeling into center pass
      { x: 0, y: 6, type: 1 }, { x: 1, y: 6, type: 1 }, { x: 2, y: 6, type: 1 }, { x: 3, y: 6, type: 1 }, { x: 4, y: 6, type: 1 },
      { x: 10, y: 6, type: 1 }, { x: 11, y: 6, type: 1 }, { x: 12, y: 6, type: 1 }, { x: 13, y: 6, type: 1 }, { x: 14, y: 6, type: 1 },
    ],
    preplacedUnits: [
      { t: 'T', o: 1, x: 6, y: 6 },
      { t: 'T', o: 1, x: 8, y: 6 },
      { t: 'S', o: 1, x: 7, y: 5 },
      { t: 'B', o: 1, x: 7, y: 4 },
    ],
  },

  // ==========================================
  // --- BRANCH 4: ECLIPSE CITADEL (FORTRESS) ---
  // ==========================================
  {
    id: 'op_10_titans_fall',
    branchId: 'branch_eclipse_citadel',
    number: 10,
    chapter: 4,
    title: "Titan's Fall",
    codename: 'COLOSSUS BOSS HUNT',
    objectiveType: 'destroy_vip',
    vipTargetName: 'Apex Colossus Juggernaut',
    vipTargetCoord: { x: 7, y: 3 },
    briefing:
      'VIP BOSS HUNT: The Eclipse Foundry has unleashed the "Colossus Juggernaut" — a 16 HP super-heavy walking war titan armed with dual 120mm kinetic cannons and area mortar barrages. Bring it down!',
    intelBrief:
      'Juggernauts deal splash damage and absorb massive punishment. Freeze it with EMP Jammers to shut down its weapons while Railgun Destroyers deliver critical kinetic hits.',
    mapSize: 15,
    playerGold: 62,
    enemyGold: 64,
    enemyFactionName: 'Eclipse Titan Foundry',
    factionsCount: 2,
    rewardMits: 1400,
    rewardIntel: 4,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Destroy the Apex Colossus Juggernaut', type: 'destroy_vip' },
      { id: 'bonus_turns', text: 'Defeat the Titan in 14 turns or fewer', type: 'turn_limit', targetCount: 14, isBonus: true, rewardMits: 450 },
      { id: 'bonus_losses', text: 'No friendly armor lost during the fight', type: 'no_friendly_losses', isBonus: true, rewardMits: 350 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 3, y: 5, w: false },
      { x: 11, y: 5, w: false },
    ],
    preplacedObstacles: [
      { x: 4, y: 4, type: 2 }, { x: 10, y: 4, type: 2 },
      { x: 5, y: 8, type: 2 }, { x: 9, y: 8, type: 2 },
    ],
    preplacedUnits: [
      { t: 'J', o: 1, x: 7, y: 3, hp: 16, maxHp: 16, isVip: true, name: 'Apex Colossus Juggernaut' },
      { t: 'K', o: 1, x: 6, y: 2 },
      { t: 'P', o: 1, x: 8, y: 2 },
    ],
  },
  {
    id: 'op_11_citadel_bastion',
    branchId: 'branch_eclipse_citadel',
    number: 11,
    chapter: 4,
    title: 'Citadel Bastion',
    codename: 'SIEGE DEPOT DEFENSE & BREACH',
    objectiveType: 'defend_and_attack',
    defendTargetName: 'Allied Siege Depot',
    defendTargetCoord: { x: 7, y: 11 },
    briefing:
      'DEFEND AND ATTACK: The outer curtain wall of the grand Eclipse citadel is heavily fortified. Protect your Allied Siege Depot while utilizing heavy artillery and Commandos to breach the citadel gates and raze their central command.',
    intelBrief:
      'Commandos and Engineers deal double damage against reinforced gates and buildings. Keep them protected behind tanks as you breach the fortress.',
    mapSize: 15,
    playerGold: 68,
    enemyGold: 70,
    enemyFactionName: 'Eclipse Iron Citadel',
    factionsCount: 2,
    rewardMits: 1650,
    rewardIntel: 4,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Protect Siege Depot & Breach Citadel Bastion HQ', type: 'defend_and_attack' },
      { id: 'bonus_turns', text: 'Shatter the citadel in 16 turns or fewer', type: 'turn_limit', targetCount: 16, isBonus: true, rewardMits: 500 },
      { id: 'bonus_capture', text: 'Capture 3 perimeter fortresses', type: 'capture_outposts', targetCount: 3, isBonus: true, rewardMits: 400 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: true },
      { x: 3, y: 5, w: false },
      { x: 11, y: 5, w: false },
    ],
    preplacedObstacles: [
      // Fortress perimeter wall with central gate at x=7
      { x: 1, y: 5, type: 2 }, { x: 2, y: 5, type: 2 }, { x: 3, y: 5, type: 2 }, { x: 4, y: 5, type: 2 }, { x: 5, y: 5, type: 2 }, { x: 6, y: 5, type: 2 },
      { x: 8, y: 5, type: 2 }, { x: 9, y: 5, type: 2 }, { x: 10, y: 5, type: 2 }, { x: 11, y: 5, type: 2 }, { x: 12, y: 5, type: 2 }, { x: 13, y: 5, type: 2 },
    ],
    preplacedUnits: [
      { t: 'W', o: 0, x: 7, y: 11, hp: 15, maxHp: 15, isDefendTarget: true, name: 'Allied Siege Depot' },
    ],
  },
  {
    id: 'op_12_grand_war',
    branchId: 'branch_eclipse_citadel',
    number: 12,
    chapter: 4,
    title: 'Operation Omega: Grand War',
    codename: 'TOTAL CONTINENTAL CONQUEST',
    objectiveType: 'destroy_hq',
    briefing:
      'MASSIVE 30x30 THEATER: Four superpower military coalitions collide simultaneously across the continental mainland. Coordinate multiple battle groups, capture forward staging barracks, and establish undisputed global command.',
    intelBrief:
      'Capturing forward barracks on the 30x30 grid enables spawning reinforcements right on the frontlines without having to march across the entire map.',
    mapSize: 30,
    playerGold: 76,
    enemyGold: 62,
    enemyFactionName: 'Grand Coalition of Adversaries',
    factionsCount: 4,
    rewardMits: 2600,
    rewardIntel: 6,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Defeat all 3 rival superpower factions', type: 'destroy_hq' },
      { id: 'bonus_turns', text: 'Conquer the continental theater in 26 turns or fewer', type: 'turn_limit', targetCount: 26, isBonus: true, rewardMits: 800 },
      { id: 'bonus_capture', text: 'Capture at least 6 outposts or barracks', type: 'capture_outposts', targetCount: 6, isBonus: true, rewardMits: 600 },
    ],
  },

  // ==========================================
  // --- BRANCH 5: OBSIDIAN BASTION (VOLCANIC) ---
  // ==========================================
  {
    id: 'op_13_magma_ridge',
    branchId: 'branch_obsidian_bastion',
    number: 13,
    chapter: 5,
    title: 'Magma Ridge',
    codename: 'VOLCANIC RIDGE HOLDOUT',
    objectiveType: 'holdout',
    holdoutTurns: 11,
    briefing:
      'HOLDOUT PROTOCOL: Hold the high volcanic ridge for 11 turns against waves of suicide Strike Drones, Rocket Launchers, and heavy flame Shock Troopers pouring from the subterranean magma vents!',
    intelBrief:
      'The enemy uses Strike Drones that detonate on contact. Keep Flak Halftracks and Anti-Tank gunners positioned along the ridge edge to detonate drones before they reach your HQ.',
    mapSize: 15,
    playerGold: 64,
    enemyGold: 66,
    enemyFactionName: 'Obsidian Pyro Legion',
    factionsCount: 2,
    rewardMits: 1750,
    rewardIntel: 5,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Hold Magma Ridge for 11 full turns', type: 'holdout', targetCount: 11 },
      { id: 'bonus_losses', text: 'HQ takes 0 damage throughout the siege', type: 'no_friendly_losses', isBonus: true, rewardMits: 500 },
      { id: 'bonus_capture', text: 'Control 2 volcanic geothermal outposts', type: 'capture_outposts', targetCount: 2, isBonus: true, rewardMits: 400 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 3, y: 8, w: false },
      { x: 11, y: 8, w: false },
    ],
    preplacedObstacles: [
      // Volcanic rock ridges
      { x: 2, y: 6, type: 1 }, { x: 3, y: 6, type: 1 }, { x: 4, y: 6, type: 1 },
      { x: 10, y: 6, type: 1 }, { x: 11, y: 6, type: 1 }, { x: 12, y: 6, type: 1 },
      { x: 7, y: 5, type: 1 }, { x: 7, y: 9, type: 1 },
    ],
  },
  {
    id: 'op_14_volcanic_breach',
    branchId: 'branch_obsidian_bastion',
    number: 14,
    chapter: 5,
    title: 'Volcanic Breach',
    codename: 'MAGMA BREACH COUNTERATTACK',
    objectiveType: 'counterattack',
    briefing:
      'COUNTERATTACK: Obsidian assault divisions have breached the caldera perimeter. Encircle their heavy flame assault column, eliminate the breach force, and counterattack their subterranean foundry base!',
    intelBrief:
      'Enemy flame Shock Troopers sweep adjacent tiles with lingering fire. Use Artillery and long-range Railgun Destroyers to hit them from beyond their flame reach.',
    mapSize: 15,
    playerGold: 68,
    enemyGold: 70,
    enemyFactionName: 'Obsidian Heavy Armor Division',
    factionsCount: 2,
    rewardMits: 1900,
    rewardIntel: 5,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Encircle breach column and demolish subterranean fortress', type: 'counterattack' },
      { id: 'bonus_turns', text: 'Complete counterattack in 14 turns or fewer', type: 'turn_limit', targetCount: 14, isBonus: true, rewardMits: 550 },
      { id: 'bonus_losses', text: 'Lose 2 or fewer friendly units', type: 'no_friendly_losses', isBonus: true, rewardMits: 450 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: true },
      { x: 4, y: 4, w: false },
      { x: 10, y: 4, w: false },
    ],
    preplacedObstacles: [
      { x: 3, y: 7, type: 2 }, { x: 11, y: 7, type: 2 },
      { x: 5, y: 5, type: 1 }, { x: 9, y: 5, type: 1 },
    ],
    preplacedUnits: [
      { t: 'B', o: 1, x: 6, y: 6 },
      { t: 'B', o: 1, x: 8, y: 6 },
      { t: 'X', o: 1, x: 7, y: 5 },
      { t: 'A', o: 1, x: 7, y: 3 },
    ],
  },
  {
    id: 'op_15_warlord_dreadnought',
    branchId: 'branch_obsidian_bastion',
    number: 15,
    chapter: 5,
    title: "Warlord's Dreadnought",
    codename: 'TWIN DREADNOUGHT ASSASSINATION',
    objectiveType: 'destroy_vip',
    vipTargetName: 'Twin Obsidian Railgun Dreadnoughts',
    vipTargetCoord: { x: 7, y: 3 },
    briefing:
      'VIP DUAL ASSASSINATION: The Obsidian Warlord has deployed two Prototype Railgun Destroyers (Dreadnought Alpha & Beta) to defend the lava causeway. Neutralize both apex prototypes to secure the pass!',
    intelBrief:
      'Two Railgun Destroyers operating in tandem can obliterate heavy armor in one salvo. Flank through side channels and use EMP Jammers to lock down one while eliminating the other.',
    mapSize: 15,
    playerGold: 72,
    enemyGold: 74,
    enemyFactionName: 'Obsidian Dreadnought Corps',
    factionsCount: 2,
    rewardMits: 2100,
    rewardIntel: 5,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Eliminate both Prototype Railgun Dreadnoughts', type: 'destroy_vip' },
      { id: 'bonus_turns', text: 'Destroy both titans within 13 turns', type: 'turn_limit', targetCount: 13, isBonus: true, rewardMits: 600 },
      { id: 'bonus_capture', text: 'Capture the magma causeway outpost', type: 'capture_outposts', targetCount: 1, isBonus: true, rewardMits: 400 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 2, y: 5, w: false },
      { x: 12, y: 5, w: false },
    ],
    preplacedObstacles: [
      { x: 4, y: 4, type: 1 }, { x: 4, y: 8, type: 1 },
      { x: 10, y: 4, type: 1 }, { x: 10, y: 8, type: 1 },
    ],
    preplacedUnits: [
      { t: 'D', o: 1, x: 5, y: 3, hp: 14, maxHp: 14, isVip: true, name: 'Dreadnought Alpha' },
      { t: 'D', o: 1, x: 9, y: 3, hp: 14, maxHp: 14, isVip: true, name: 'Dreadnought Beta' },
      { t: 'K', o: 1, x: 7, y: 2 },
    ],
  },
  {
    id: 'op_16_geothermal_grid',
    branchId: 'branch_obsidian_bastion',
    number: 16,
    chapter: 5,
    title: 'Geothermal Power Grid',
    codename: 'GRID DOMINATION',
    objectiveType: 'capture_outposts',
    briefing:
      'OUTPOST DOMINATION: Four massive geothermal power conduits power the subterranean war machine. Capture and control all 4 geothermal outposts simultaneously to trigger an automatic grid meltdown and victory!',
    intelBrief:
      'The enemy guards each relay station with machine gun bunkers. Use Smoke and Commandos to seize the terminals rapidly while tanks screen against enemy counter-attacks.',
    mapSize: 15,
    playerGold: 74,
    enemyGold: 76,
    enemyFactionName: 'Obsidian Grid Sentinels',
    factionsCount: 2,
    rewardMits: 2300,
    rewardIntel: 5,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Capture and hold 4 geothermal relay outposts', type: 'capture_outposts', targetCount: 4 },
      { id: 'bonus_turns', text: 'Secure all 4 conduits within 15 turns', type: 'turn_limit', targetCount: 15, isBonus: true, rewardMits: 650 },
      { id: 'bonus_losses', text: 'Keep friendly losses to 2 or fewer units', type: 'no_friendly_losses', isBonus: true, rewardMits: 500 },
    ],
    preplacedMines: [
      { x: 4, y: 4, w: false },
      { x: 10, y: 4, w: false },
      { x: 4, y: 10, w: false },
      { x: 10, y: 10, w: false },
    ],
    preplacedObstacles: [
      { x: 7, y: 4, type: 2 }, { x: 7, y: 10, type: 2 },
      { x: 4, y: 7, type: 2 }, { x: 10, y: 7, type: 2 },
      { x: 7, y: 7, type: 1 },
    ],
  },

  // ==========================================
  // --- BRANCH 6: VALKYRIE DAWN (ARCHIPELAGO) ---
  // ==========================================
  {
    id: 'op_17_beachhead_landing',
    branchId: 'branch_valkyrie_dawn',
    number: 17,
    chapter: 6,
    title: 'Beachhead Landing',
    codename: 'AMPHIBIOUS BEACHHEAD DEFENSE',
    objectiveType: 'defend_and_attack',
    defendTargetName: 'Amphibious Landing Depot',
    defendTargetCoord: { x: 7, y: 12 },
    briefing:
      'DEFEND AND ATTACK: Allied landing craft have established a coastal beachhead depot at (7, 12). Protect the depot against hostile Gunship and Hovercraft counter-raids while pushing armor onto the main island to seize their fortress.',
    intelBrief:
      'Hovercraft Skimmers can traverse both land and water tiles without speed penalties. Use them to flank enemy artillery emplacements perched on coastal islands.',
    mapSize: 15,
    playerGold: 76,
    enemyGold: 78,
    enemyFactionName: 'Valkyrie Coastal Command',
    factionsCount: 2,
    rewardMits: 2500,
    rewardIntel: 6,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Protect Beachhead Landing Depot & Destroy Island Fortress', type: 'defend_and_attack' },
      { id: 'bonus_turns', text: 'Conquer island in 15 turns or fewer', type: 'turn_limit', targetCount: 15, isBonus: true, rewardMits: 700 },
      { id: 'bonus_losses', text: 'Landing depot takes 0 damage', type: 'no_friendly_losses', isBonus: true, rewardMits: 600 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: true },
      { x: 3, y: 6, w: false },
      { x: 11, y: 6, w: false },
    ],
    preplacedObstacles: [
      // Coastal water and reef obstacle corridors
      { x: 1, y: 8, type: 1 }, { x: 2, y: 8, type: 1 }, { x: 3, y: 8, type: 1 },
      { x: 11, y: 8, type: 1 }, { x: 12, y: 8, type: 1 }, { x: 13, y: 8, type: 1 },
      { x: 5, y: 6, type: 1 }, { x: 9, y: 6, type: 1 },
    ],
    preplacedUnits: [
      { t: 'W', o: 0, x: 7, y: 12, hp: 16, maxHp: 16, isDefendTarget: true, name: 'Amphibious Landing Depot' },
    ],
  },
  {
    id: 'op_18_atoll_holdout',
    branchId: 'branch_valkyrie_dawn',
    number: 18,
    chapter: 6,
    title: 'Atoll Holdout',
    codename: '360-DEGREE ATOLL SIEGE',
    objectiveType: 'holdout',
    holdoutTurns: 12,
    briefing:
      'HOLDOUT PROTOCOL: Entrench inside the central coral atoll fortress and survive 12 turns of multi-directional assaults as enemy airborne wings and amphibious hovercraft strike simultaneously from all four compass points!',
    intelBrief:
      'Enemies will converge from every flank. Pair Flak Halftracks with Railgun Destroyers and keep Medics and Suppliers centrally positioned to supply ammo and repairs.',
    mapSize: 15,
    playerGold: 80,
    enemyGold: 82,
    enemyFactionName: 'Valkyrie Strike Fleet',
    factionsCount: 2,
    rewardMits: 2750,
    rewardIntel: 6,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Hold the Atoll Fortress for 12 full turns', type: 'holdout', targetCount: 12 },
      { id: 'bonus_losses', text: 'Suffer 2 or fewer friendly unit losses', type: 'no_friendly_losses', isBonus: true, rewardMits: 750 },
      { id: 'bonus_capture', text: 'Hold both outer coral outposts', type: 'capture_outposts', targetCount: 2, isBonus: true, rewardMits: 600 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: false },
      { x: 3, y: 7, w: false },
      { x: 11, y: 7, w: false },
    ],
    preplacedObstacles: [
      // Coral reef barriers surrounding center
      { x: 5, y: 5, type: 1 }, { x: 9, y: 5, type: 1 },
      { x: 5, y: 9, type: 1 }, { x: 9, y: 9, type: 1 },
      { x: 7, y: 4, type: 2 }, { x: 7, y: 10, type: 2 },
    ],
  },
  {
    id: 'op_19_skyfall_strike',
    branchId: 'branch_valkyrie_dawn',
    number: 19,
    chapter: 6,
    title: 'Skyfall Strike',
    codename: 'AIRBORNE DROP COUNTERATTACK',
    objectiveType: 'counterattack',
    briefing:
      'COUNTERATTACK: An elite Valkyrie airborne assault battalion has paradropped directly into your mid-island staging sector. Crush the paradrop vanguard, sweep their commandos, and launch an all-out counterstrike on their coastal airfield!',
    intelBrief:
      'Enemy airborne units start close to your deployment zone. Deploy rapid-response armor and flak guns to eliminate their paratroopers before they can dig in.',
    mapSize: 15,
    playerGold: 84,
    enemyGold: 84,
    enemyFactionName: 'Valkyrie Airborne Battalion',
    factionsCount: 2,
    rewardMits: 3000,
    rewardIntel: 6,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Eliminate airborne vanguard and capture island airfield HQ', type: 'counterattack' },
      { id: 'bonus_turns', text: 'Complete counterattack within 15 turns', type: 'turn_limit', targetCount: 15, isBonus: true, rewardMits: 800 },
      { id: 'bonus_losses', text: 'Lose 1 or fewer friendly armor units', type: 'no_friendly_losses', isBonus: true, rewardMits: 650 },
    ],
    preplacedMines: [
      { x: 7, y: 7, w: true },
      { x: 3, y: 4, w: false },
      { x: 11, y: 4, w: false },
    ],
    preplacedObstacles: [
      { x: 4, y: 6, type: 1 }, { x: 10, y: 6, type: 1 },
      { x: 7, y: 5, type: 2 },
    ],
    preplacedUnits: [
      // Paradrop vanguard close to center
      { t: 'Y', o: 1, x: 4, y: 7 },
      { t: 'Y', o: 1, x: 10, y: 7 },
      { t: 'V', o: 1, x: 7, y: 8 },
      { t: 'G', o: 1, x: 7, y: 9 },
    ],
  },
  {
    id: 'op_20_apex_sovereign',
    branchId: 'branch_valkyrie_dawn',
    number: 20,
    chapter: 6,
    title: 'Operation Apex Sovereign',
    codename: 'GLOBAL DOMINION WAR',
    objectiveType: 'destroy_hq',
    briefing:
      'THE ULTIMATE CLIMAX: A massive 30x30 4-way global theater featuring the most advanced military technology. Command Juggernauts, Railgun Destroyers, Strike Fleets, and Heavy Bombers to liberate the entire planet and achieve absolute victory.',
    intelBrief:
      'All 4 superpower factions start with max economic reserves. Prioritize establishing forward barracks and coordinating combined arms armies across all fronts.',
    mapSize: 30,
    playerGold: 90,
    enemyGold: 75,
    enemyFactionName: 'Grand Alliance of Sovereign Titans',
    factionsCount: 4,
    rewardMits: 5000,
    rewardIntel: 10,
    difficulty: 'expert',
    objectives: [
      { id: 'primary', text: 'Defeat all 3 rival superpower titan factions', type: 'destroy_hq' },
      { id: 'bonus_turns', text: 'Achieve total victory in under 28 turns', type: 'turn_limit', targetCount: 28, isBonus: true, rewardMits: 1500 },
      { id: 'bonus_capture', text: 'Capture at least 8 outposts and barracks', type: 'capture_outposts', targetCount: 8, isBonus: true, rewardMits: 1200 },
    ],
  },
];
