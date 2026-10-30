import React, { useState, useEffect, useRef } from 'react';
import { TacticalEngine, MatchConfig } from './game/engine';
import { GameBoard } from './components/GameBoard';
import { TopBar } from './components/TopBar';
import { UnitActionCard } from './components/UnitActionCard';
import { DeploymentShop } from './components/DeploymentShop';
import { CampaignView } from './components/CampaignView';
import { ArmoryTechTree } from './components/ArmoryTechTree';
import { SkirmishModal } from './components/SkirmishModal';
import { SaveManagerModal } from './components/SaveManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { UnitActionPopup } from './components/UnitActionPopup';
import { BuildingActionPopup } from './components/BuildingActionPopup';
import { GameStorageService } from './services/storage';
import { SoundEngine } from './services/audio';
import {
  UnitTypeCode,
  CampaignMission,
  ArmoryUpgrade,
  PlayerProfile,
  GraphicsSettings,
  UnitInstance,
} from './types/game';
import { FACTION_COLORS, FACTION_NAMES, BUILDING_DESCRIPTIONS, UNIT_BLUEPRINTS } from './game/constants';
import { CAMPAIGN_MISSIONS } from './game/campaignData';
import {
  Trophy,
  ArrowRight,
  Shield,
  HelpCircle,
  Coins,
  ChevronRight,
  CheckCircle2,
  Wrench,
  Sparkles,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Eye,
} from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() =>
    GameStorageService.loadProfile()
  );
  const [settings, setSettings] = useState<GraphicsSettings>(() =>
    GameStorageService.loadSettings()
  );

  const [activeTab, setActiveTab] = useState<'battle' | 'campaign' | 'armory' | 'skirmish'>('campaign');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Popups for clicked units and buildings
  const [popupUnit, setPopupUnit] = useState<UnitInstance | null>(null);
  const [popupBuilding, setPopupBuilding] = useState<UnitInstance | null>(null);

  // Admin placement tools state
  const [adminActiveTool, setAdminActiveTool] = useState<number | null>(null);
  const [adminSpawnUnit, setAdminSpawnUnit] = useState<UnitTypeCode>('B');
  const [adminSpawnFaction, setAdminSpawnFaction] = useState<number>(0);

  // Engine instance stored in ref to maintain battle state
  const engineRef = useRef<TacticalEngine | null>(null);
  const [, setTick] = useState(0);

  // Initialize engine once
  if (!engineRef.current) {
    const eng = new TacticalEngine(profile);
    eng.onStateChange = () => setTick((t) => t + 1);
    engineRef.current = eng;
    // Default initial match
    eng.initMatch({
      mapSize: 15,
      playersCount: 2,
      humanFactions: [0],
    });
  }

  const engine = engineRef.current;

  // Sync Audio Settings
  useEffect(() => {
    SoundEngine.updateVolumes(
      settings.muted,
      settings.masterVolume,
      settings.sfxVolume,
      settings.soundMode
    );
    if (engine) engine.gameSpeed = settings.gameSpeed;
  }, [settings, engine]);

  // Sync profile with engine
  useEffect(() => {
    if (engine) engine.setProfile(profile);
  }, [profile, engine]);

  const handleUpdateSettings = (newSettings: GraphicsSettings) => {
    setSettings(newSettings);
    GameStorageService.saveSettings(newSettings);
  };

  const handleProfileUpdated = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    GameStorageService.saveProfile(newProfile);
  };

  // Launch a campaign mission
  const handleLaunchCampaignMission = (mission: CampaignMission) => {
    if (!engine) return;

    engine.initMatch({
      mapSize: mission.mapSize,
      playersCount: mission.factionsCount,
      humanFactions: [0],
      startingGold: [mission.playerGold, ...Array(mission.factionsCount - 1).fill(mission.enemyGold)],
      customMines: mission.preplacedMines,
      customObstacles: mission.preplacedObstacles,
      preplacedUnits: mission.preplacedUnits,
      campaignMissionId: mission.id,
      campaignMission: mission,
      isCampaign: true,
      difficulty: mission.difficulty || (mission.chapter >= 4 ? 'expert' : mission.chapter >= 2 ? 'hard' : 'normal'),
    });

    setPopupUnit(null);
    setPopupBuilding(null);
    setActiveTab('battle');
  };

  // Launch a custom skirmish
  const handleLaunchSkirmish = (config: MatchConfig) => {
    if (!engine) return;
    engine.initMatch(config);
    setPopupUnit(null);
    setPopupBuilding(null);
    setActiveTab('battle');
  };

  // Tile Interaction Handler
  const handleTileClick = async (x: number, y: number) => {
    if (!engine || engine.busy || engine.over || engine.ctrl[engine.cur]) return;

    // 0. Admin Tool Intercept
    if (adminActiveTool) {
      if (adminActiveTool === 1) {
        // Spawn unit
        const existing = engine.unitAt(x, y);
        if (!existing) {
          const e = engine.addUnit(adminSpawnUnit, adminSpawnFaction, x, y);
          SoundEngine.play('spawn', x, y, true, true);
          engine.addSpark(x, y, FACTION_COLORS[adminSpawnFaction], 14, 3);
          engine.note = `Admin: Spawned ${engine.getBlueprint(adminSpawnUnit).n}.`;
          engine.recalculateHighlights();
          engine.triggerChange();
        }
      } else if (adminActiveTool === 2) {
        // Delete unit
        const target = engine.unitAt(x, y);
        if (target) {
          engine.triggerExplosion(target);
          engine.U = engine.U.filter((z) => z !== target);
          if (engine.sel === target) engine.sel = null;
          engine.note = `Admin: Removed ${engine.getBlueprint(target.t).n}.`;
          if (target.t === 'H') engine.eliminateFaction(target.o);
          engine.recalculateHighlights();
          engine.triggerChange();
        }
      }
      return;
    }

    // 1. Spawning a unit via Deployment Shop
    if (engine.sp) {
      const isSpawnable = engine.hl.s.some((c) => c[0] === x && c[1] === y);
      if (isSpawnable) {
        const cost = engine.getBlueprint(engine.sp).c;
        if (engine.gold[engine.cur] >= cost) {
          engine.gold[engine.cur] -= cost;
          const newUnit = engine.addUnit(engine.sp, engine.cur, x, y);
          newUnit.moved = newUnit.acted = engine.ph === 'setup' ? 0 : 1;
          SoundEngine.play('spawn', x, y, true, true);
          engine.addSpark(x, y, FACTION_COLORS[engine.cur], 14, 3);
          engine.addRing(x, y, FACTION_COLORS[engine.cur]);
          engine.note = `${engine.getBlueprint(newUnit.t).n} deployed.`;
        }
      }
      if (engine.ph !== 'setup' || engine.gold[engine.cur] < engine.getBlueprint(engine.sp).c) {
        engine.sp = null;
      }
      engine.sel = null;
      engine.recalculateHighlights();
      engine.triggerChange();
      return;
    }

    // 2. Setup Phase Refund Click
    if (engine.ph === 'setup') {
      const clickedUnit = engine.unitAt(x, y);
      if (clickedUnit && clickedUnit.o === engine.cur && !engine.getBlueprint(clickedUnit.t).bl) {
        engine.gold[engine.cur] += engine.getBlueprint(clickedUnit.t).c;
        engine.U = engine.U.filter((z) => z !== clickedUnit);
        engine.note = `${engine.getBlueprint(clickedUnit.t).n} refunded.`;
        engine.recalculateHighlights();
        engine.triggerChange();
      }
      return;
    }

    const targetUnit = engine.unitAt(x, y);
    const key = `${x},${y}`;

    // 3. Action with Selected Unit
    if (engine.sel && engine.sel.o === engine.cur && !engine.getBlueprint(engine.sel.t).bl) {
      // Capture
      if (targetUnit && engine.hl.c.includes(targetUnit)) {
        await executeUnitAction(async () => {
          await engine.captureBuilding(engine.sel!, targetUnit);
        });
        setPopupUnit(null);
        return;
      }

      // Move
      if (!engine.sel.gm && !targetUnit && engine.hl.m.has(key) && key !== `${engine.sel.x},${engine.sel.y}`) {
        await executeUnitAction(async () => {
          await engine.moveUnit(engine.sel!, key);
        });
        setPopupUnit(null);
        return;
      }

      // Attack enemy unit
      if (targetUnit && engine.hl.t.includes(targetUnit)) {
        await executeUnitAction(async () => {
          await engine.attackTarget(engine.sel!, targetUnit);
        });
        setPopupUnit(null);
        return;
      }

      // Target Ground tile
      const canGround = engine.canUnitAct(engine.sel);
      if (canGround && engine.hl.r.some((c) => c[0] === x && c[1] === y)) {
        const dest = targetUnit || { x, y, gnd: true };
        await executeUnitAction(async () => {
          await engine.attackTarget(engine.sel!, dest);
        });
        setPopupUnit(null);
        return;
      }
    }

    // 4. Clicking on a structure (HQ, Outpost, Barracks)
    if (targetUnit && engine.getBlueprint(targetUnit.t).bl) {
      SoundEngine.play('sel');
      engine.sel = null;
      setPopupUnit(null);
      setPopupBuilding(targetUnit);
      engine.recalculateHighlights();
      engine.triggerChange();
      return;
    }

    // 5. Selecting own unit
    const clickedOwnerUnit = targetUnit && targetUnit.o === engine.cur ? targetUnit : null;
    engine.selectUnit(clickedOwnerUnit);
    setPopupBuilding(null);
    setPopupUnit(null);
  };

  const executeUnitAction = async (actionFn: () => Promise<void>) => {
    if (!engine) return;
    engine.busy = true;
    engine.triggerChange();
    await actionFn();
    engine.busy = false;

    if (engine.sel && !engine.U.includes(engine.sel)) {
      engine.sel = null;
    }
    if (engine.sel && !engine.getBlueprint(engine.sel.t).bl) {
      const bp = engine.getBlueprint(engine.sel.t);
      if (!engine.canAffordAbility(engine.sel, bp.ab[engine.sel.ai || 0])) {
        engine.sel.ai = Math.max(
          0,
          bp.ab.findIndex((a) => engine.canAffordAbility(engine.sel!, a))
        );
      }
    }
    engine.recalculateHighlights();
    engine.triggerChange();

    // Check Victory Rewards
    if (engine.over && engine.winner === 0 && engine.missionId) {
      grantCampaignRewards(engine.missionId);
    }
  };

  // Handle victory rewards and record progression in Mits
  const grantCampaignRewards = (missionId: string) => {
    const existing = profile.campaignProgress[missionId];
    const mission = CAMPAIGN_MISSIONS.find((m) => m.id === missionId);
    let stars = 1;

    const completedObjectives = ['primary'];
    let bonusMits = 0;

    if (mission) {
      mission.objectives.forEach((obj) => {
        if (!obj.isBonus) return;
        let accomplished = false;
        if (obj.type === 'turn_limit') {
          if (engine.turn <= (obj.targetCount || 15)) accomplished = true;
        } else if (obj.type === 'no_friendly_losses') {
          if (engine.totalFriendlyLosses <= (obj.targetCount || 0)) accomplished = true;
        } else if (obj.type === 'capture_outposts') {
          const outposts = engine.U.filter((u) => u.t === 'O' && u.o === 0).length;
          if (outposts >= (obj.targetCount || 1)) accomplished = true;
        }

        if (accomplished) {
          stars++;
          completedObjectives.push(obj.id);
          bonusMits += obj.rewardMits || 150;
        }
      });
    } else {
      if (engine.turn <= 15) {
        stars++;
        completedObjectives.push('bonus_turns');
        bonusMits += 150;
      }
      if (engine.totalFriendlyLosses === 0) {
        stars++;
        completedObjectives.push('bonus_losses');
        bonusMits += 200;
      }
    }

    const baseRewardMits = mission ? mission.rewardMits : 400;
    const totalWonMits = baseRewardMits + bonusMits;
    const bonusIntel = existing?.completed ? 0 : (mission?.rewardIntel || 2);

    const updatedProfile: PlayerProfile = {
      ...profile,
      mits: profile.mits + totalWonMits,
      credits: (profile.credits || profile.mits) + totalWonMits,
      intel: profile.intel + bonusIntel,
      campaignProgress: {
        ...profile.campaignProgress,
        [missionId]: {
          completed: true,
          stars: Math.max(existing?.stars || 0, Math.min(3, stars)),
          bestTurns: Math.min(existing?.bestTurns || 999, engine.turn),
          completedObjectives,
        },
      },
    };

    handleProfileUpdated(updatedProfile);
  };

  // Tech Tree: Unlock Unit
  const handleUnlockUnit = (unitCode: UnitTypeCode, costMits: number) => {
    if (profile.mits < costMits) return;
    if (profile.unlockedUnits.includes(unitCode)) return;

    SoundEngine.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - costMits,
      credits: (profile.credits || profile.mits) - costMits,
      unlockedUnits: [...profile.unlockedUnits, unitCode],
    };
    handleProfileUpdated(updated);
  };

  // Tech Tree: Unlock Branch
  const handleUnlockBranch = (branchId: string, costMits: number) => {
    if (profile.mits < costMits) return;
    if (profile.unlockedBranches.includes(branchId)) return;

    SoundEngine.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - costMits,
      credits: (profile.credits || profile.mits) - costMits,
      unlockedBranches: [...profile.unlockedBranches, branchId],
    };
    handleProfileUpdated(updated);
  };

  // Tech Tree: Unlock Skin
  const handleUnlockSkin = (skinId: string, costMits: number) => {
    if (profile.mits < costMits) return;
    if (profile.unlockedSkins.includes(skinId)) return;

    SoundEngine.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - costMits,
      credits: (profile.credits || profile.mits) - costMits,
      unlockedSkins: [...profile.unlockedSkins, skinId],
      activeSkin: skinId,
    };
    handleProfileUpdated(updated);
  };

  // Tech Tree: Equip Skin
  const handleEquipSkin = (skinId: string) => {
    SoundEngine.play('sel');
    const updated: PlayerProfile = {
      ...profile,
      activeSkin: skinId,
    };
    handleProfileUpdated(updated);
  };

  // Armory Tech Upgrade
  const handlePurchaseUpgrade = (upgrade: ArmoryUpgrade) => {
    const currentLevel = profile.purchasedUpgrades[upgrade.id] || 0;
    if (currentLevel >= upgrade.maxLevel) return;
    if (profile.mits < upgrade.costMits || profile.intel < upgrade.costIntel) return;

    SoundEngine.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - upgrade.costMits,
      credits: (profile.credits || profile.mits) - upgrade.costMits,
      intel: profile.intel - upgrade.costIntel,
      purchasedUpgrades: {
        ...profile.purchasedUpgrades,
        [upgrade.id]: currentLevel + 1,
      },
    };

    handleProfileUpdated(updated);
  };

  // Refund all upgrades
  const handleResetUpgrades = () => {
    let refundMits = 0;
    let refundIntel = 0;

    Object.entries(profile.purchasedUpgrades).forEach(([id, lvl]) => {
      refundMits += 450 * lvl;
      refundIntel += 1 * lvl;
    });

    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits + refundMits,
      credits: (profile.credits || profile.mits) + refundMits,
      intel: profile.intel + refundIntel,
      purchasedUpgrades: {},
    };

    SoundEngine.play('sel');
    handleProfileUpdated(updated);
  };

  const curIncome =
    2 +
    (engine.NP > 2 && engine.cur === 1 ? 1 : 0) +
    engine.U.filter((m) => m.t === 'O' && m.o === engine.cur).length +
    (engine.cur === 0 ? engine.getUpgradeLevel('upg_logistics_subsidy') : 0);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#d6ded9] flex flex-col font-sans">
      {/* Top Bar with unboxed typography and real-time state */}
      <TopBar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        mits={profile.mits}
        intel={profile.intel}
        muted={settings.muted}
        onToggleMute={() => handleUpdateSettings({ ...settings, muted: !settings.muted })}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSaveManager={() => setIsSaveModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        isInActiveBattle={!engine.over && activeTab !== 'battle'}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* TAB 1: BATTLEFIELD */}
        {activeTab === 'battle' && (
          <div className="max-w-[1920px] w-full mx-auto p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            {/* Main Interactive Canvas Board (8-9 cols) */}
            <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-3">
              {/* Mission Directive & Live Objective Tracker OR Skirmish Advisor */}
              {engine.activeMission ? (
                <div className="p-3 bg-gradient-to-r from-[#12191e] to-[#0e1418] border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 font-bold text-xs">
                      {engine.activeMission.number}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                          OP #{engine.activeMission.number} · {engine.activeMission.codename}
                        </span>
                        {engine.activeMission.objectiveType === 'holdout' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            HOLDOUT SIEGE
                          </span>
                        ) : engine.activeMission.objectiveType === 'defend_and_attack' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            DEFEND & ATTACK
                          </span>
                        ) : engine.activeMission.objectiveType === 'counterattack' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            COUNTERATTACK
                          </span>
                        ) : engine.activeMission.objectiveType === 'destroy_vip' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            VIP HUNT
                          </span>
                        ) : engine.activeMission.objectiveType === 'capture_outposts' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            DOMINATION
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            CONQUEST
                          </span>
                        )}
                      </div>
                      <span className="text-slate-200 font-semibold text-xs block truncate mt-0.5">
                        {engine.activeMission.objectives[0]?.text || engine.activeMission.title}
                      </span>
                    </div>
                  </div>

                  {/* Live Status Tracker */}
                  <div className="flex items-center gap-3 shrink-0 text-[11px] border-t sm:border-t-0 sm:border-l border-[#243038] pt-2 sm:pt-0 sm:pl-3">
                    {engine.activeMission.objectiveType === 'holdout' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Survive:</span>
                        <span className="text-amber-400 font-bold">
                          Wave {Math.min(engine.activeMission.holdoutTurns || 10, engine.turn)} / {engine.activeMission.holdoutTurns || 10}
                        </span>
                      </div>
                    )}
                    {engine.activeMission.objectiveType === 'defend_and_attack' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Asset:</span>
                        {(() => {
                          const target = engine.U.find((u) => u.isDefendTarget);
                          return (
                            <span className={target ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>
                              {target ? `${target.hp}/${target.maxHp} HP` : 'DESTROYED'}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    {engine.activeMission.objectiveType === 'capture_outposts' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Outposts:</span>
                        <span className="text-emerald-400 font-bold">
                          {engine.U.filter((u) => u.t === 'O' && u.o === 0).length} /{' '}
                          {engine.activeMission.objectives.find((o) => o.type === 'capture_outposts')?.targetCount || 3}
                        </span>
                      </div>
                    )}
                    {engine.activeMission.objectiveType === 'destroy_vip' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">VIP Target:</span>
                        {(() => {
                          const vip = engine.U.find((u) => u.isVip && u.o !== 0);
                          return (
                            <span className={vip ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {vip ? `${vip.hp} HP` : 'ELIMINATED'}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    {engine.activeMission.objectiveType === 'counterattack' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Vanguard:</span>
                        <span className="text-purple-300 font-bold">
                          {engine.vanguardDestroyedCount} / {engine.initialVanguardCount || 4} Down
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Turn:</span>
                      <span className="text-slate-200 font-bold">{engine.turn}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#13191d] border border-[#232c32] rounded-xl flex items-center justify-between gap-3 text-xs font-mono shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 font-bold">
                      HQ
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Tactical Advisor</span>
                      <span className="text-slate-200 font-medium text-xs">
                        {engine.ctrl.every((c) => c)
                          ? 'Autonomous War in Progress: Watch the superpowers trade artillery and armor rounds.'
                          : engine.ph === 'setup'
                          ? 'Deployment Phase: Tap "Auto-Deploy & Ready" for instant combat, or recruit units on the right.'
                          : engine.ctrl[engine.cur]
                          ? `Enemy Turn: ${FACTION_NAMES[engine.cur]} is maneuvering. Keep your eye on the front lines.`
                          : engine.sel
                          ? `Unit Selected (${UNIT_BLUEPRINTS[engine.sel.t]?.n}): Tap any Blue tile to move, or Red target to attack.`
                          : 'Your Turn: Tap any friendly unit (blue outline) to move/fire, or recruit units from the shop.'}
                      </span>
                    </div>
                  </div>

                  {/* Legend badges */}
                  <div className="hidden sm:flex items-center gap-2.5 shrink-0 text-[11px]">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]" />
                      <span>Move</span>
                    </span>
                    <span className="flex items-center gap-1 text-red-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#f87171]" />
                      <span>Fire</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#facc15]" />
                      <span>Outpost</span>
                    </span>
                  </div>
                </div>
              )}

              <GameBoard
                engine={engine}
                onTileClick={handleTileClick}
                graphicsQuality={settings.quality}
              />
            </div>

            {/* Tactical Side Command Console (3-4 cols) */}
            <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4">
              {/* Primary End Turn / Ready Button or Spectator Controls */}
              <div className="sticky top-16 z-20 bg-[#0b0e11] pb-2 space-y-2">
                {engine.ctrl.every((c) => c) ? (
                  <div className="p-3 bg-[#131a1e] border border-cyan-500/40 rounded-xl shadow-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${engine.paused ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'}`} />
                      <div>
                        <span className="text-xs font-bold text-cyan-300 font-mono block">
                          SPECTATOR SIMULATION
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {engine.paused ? 'Simulation Paused' : `${engine.gameSpeed}x Speed · ${engine.NP}-Way Grand War`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          engine.paused = !engine.paused;
                          engine.triggerChange();
                        }}
                        className="py-1.5 px-3 bg-[#1b252c] hover:bg-[#23313a] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                        title={engine.paused ? 'Resume AI Simulation' : 'Pause AI Simulation'}
                      >
                        {engine.paused ? <Play className="w-3.5 h-3.5 fill-cyan-400" /> : <Pause className="w-3.5 h-3.5" />}
                        <span>{engine.paused ? 'Resume' : 'Pause'}</span>
                      </button>
                      <button
                        onClick={() => {
                          const speeds = [1, 2, 4];
                          const next = speeds[(speeds.indexOf(engine.gameSpeed) + 1) % speeds.length] || 1;
                          engine.gameSpeed = next;
                          engine.triggerChange();
                        }}
                        className="py-1.5 px-2.5 bg-[#1b252c] hover:bg-[#23313a] text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors"
                        title="Toggle Animation Speed"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>{engine.gameSpeed}x</span>
                      </button>
                    </div>
                  </div>
                ) : engine.ph === 'setup' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        engine.botAutoDeploy(engine.cur);
                        engine.endTurn();
                      }}
                      className="flex-1 py-3.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/20 uppercase tracking-wider transition-all"
                      title="Automatically deploy a balanced army and begin combat immediately"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Auto-Deploy & Ready</span>
                    </button>
                    <button
                      disabled={engine.ctrl[engine.cur] || engine.busy || engine.over}
                      onClick={() => engine.endTurn()}
                      className="flex-1 py-3.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-amber-950/20 uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <span>Confirm Deploy</span>
                      <ArrowRight className="w-4 h-4 font-bold" />
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={engine.ctrl[engine.cur] || engine.busy || engine.over}
                    onClick={() => engine.endTurn()}
                    className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-base shadow-xl shadow-amber-950/20 uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>End Turn</span>
                    <ArrowRight className="w-5 h-5 font-bold" />
                  </button>
                )}
              </div>

              {/* Faction and Turn Status Card */}
              <div
                className="bg-[#141a1e] border border-[#232c32] rounded-xl p-4 shadow-md"
                style={{ borderLeftColor: FACTION_COLORS[engine.cur], borderLeftWidth: '3px' }}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>
                    {engine.ctrl.every((c) => c)
                      ? `AI: ${FACTION_NAMES[engine.cur]}`
                      : engine.ctrl[engine.cur]
                      ? `AI (${FACTION_NAMES[engine.cur]})`
                      : engine.cur === 0
                      ? 'You (Command HQ)'
                      : `Player ${engine.cur + 1}`}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {engine.ph === 'setup' ? 'PRE-BATTLE SETUP' : `TURN ${engine.turn}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono mt-2 pt-2 border-t border-[#232c32]">
                  <span className="text-slate-400">
                    {engine.ph === 'setup' ? 'Deployment Budget' : `Income +${curIncome} / turn`}
                  </span>
                  <span className="text-amber-400 font-extrabold text-base tabular-nums">
                    {engine.gold[engine.cur]} <span className="text-xs font-normal text-slate-400">Gold</span>
                  </span>
                </div>

                {engine.note && (
                  <div className="mt-2.5 p-2 bg-[#0b0e10] border border-[#232c32] rounded text-xs text-amber-300 font-mono">
                    {engine.note}
                  </div>
                )}
              </div>

              {/* Dynamic Panel: Unit Selected, Spectator Intelligence, or Deployment Catalog */}
              {engine.sel ? (
                <UnitActionCard
                  unit={engine.sel}
                  engine={engine}
                  onSelectAbility={(idx) => engine.selectAbility(idx)}
                  onToggleGroundAim={() => engine.toggleGroundAim()}
                  onCapture={(building) => executeUnitAction(() => engine.captureBuilding(engine.sel!, building))}
                  onDeselect={() => engine.selectUnit(null)}
                  disabled={engine.busy || engine.ctrl[engine.cur]}
                />
              ) : engine.ctrl.every((c) => c) ? (
                <div className="bg-[#141a1e] border border-[#232c32] rounded-xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-[#232c32] pb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Grand War Faction Intel</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Grid {engine.N}x{engine.N}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: engine.NP }).map((_, fIdx) => {
                      const isAlive = engine.alive[fIdx];
                      const unitsCount = engine.U.filter((u) => u.o === fIdx && !engine.getBlueprint(u.t).bl).length;
                      const outpostsCount = engine.U.filter((u) => u.o === fIdx && u.t === 'O').length;
                      const hasHQ = engine.U.some((u) => u.o === fIdx && u.t === 'H');
                      const isCurrent = engine.cur === fIdx;

                      return (
                        <div
                          key={fIdx}
                          className={`p-2.5 rounded-lg border transition-all text-xs font-mono flex items-center justify-between ${
                            !isAlive
                              ? 'bg-[#0a0d0f] border-[#1b2226] opacity-40'
                              : isCurrent
                              ? 'bg-[#182329] border-cyan-500/50 shadow-sm'
                              : 'bg-[#0d1215] border-[#222a30]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: FACTION_COLORS[fIdx] }}
                            />
                            <div>
                              <div className="font-bold text-slate-200">
                                {FACTION_NAMES[fIdx]}
                                {isCurrent && isAlive ? <span className="text-cyan-400 ml-1.5">[MOVING]</span> : ''}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {isAlive ? (hasHQ ? 'Command HQ Active' : 'Forward Outpost Only') : 'ELIMINATED'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-[11px]">
                            <div className="text-slate-300">
                              {unitsCount} units · {outpostsCount} outposts
                            </div>
                            <div className="text-amber-400 font-bold">{engine.gold[fIdx]} Gold</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Tap any unit or structure on the map to inspect its real-time health, ammunition, fuel, and ability range.
                  </p>
                </div>
              ) : (
                <DeploymentShop
                  engine={engine}
                  onSelectUnitToDeploy={(code) => {
                    engine.sp = engine.sp === code ? null : code;
                    engine.recalculateHighlights();
                    engine.triggerChange();
                  }}
                  selectedUnitCode={engine.sp}
                  currentGold={engine.gold[engine.cur]}
                  onOpenArmory={() => setActiveTab('armory')}
                  disabled={engine.busy || engine.ctrl[engine.cur]}
                />
              )}

              {/* Tactical Legend */}
              <div className="p-3 bg-[#111619] rounded-xl border border-[#232c32] text-xs font-mono flex flex-wrap items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]" />
                  <span>Movement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f87171]" />
                  <span>Target Range</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#d3a85a]" />
                  <span>Deploy Zone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#facc15]" />
                  <span>Capturable</span>
                </div>
              </div>

              {/* Expandable Manual / Guide */}
              <details className="p-3.5 bg-[#111619] rounded-xl border border-[#232c32] text-xs text-slate-300 cursor-pointer">
                <summary className="font-bold font-mono text-slate-200 flex items-center justify-between">
                  <span>Field Operations Manual</span>
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </summary>
                <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-400 leading-relaxed text-[11px]">
                  <li>
                    <strong className="text-slate-200">Interactive Popups:</strong> Tap any friendly unit to open the Tactical Action Menu (Move, choose weapon ability, capture). Tap an HQ or Barracks to open the Reinforcement Spawn menu.
                  </li>
                  <li>
                    <strong className="text-slate-200">Mits Progression:</strong> Beating campaign operations awards Mits. Use Mits in the Armory to unlock 18+ advanced units and cosmetic liveries.
                  </li>
                  <li>
                    <strong className="text-slate-200">Capturing:</strong> Only infantry soldiers (Riflemen, Commandos, Shock Troopers) can capture structures. Stand next to outposts or barracks to capture.
                  </li>
                  <li>
                    <strong className="text-slate-200">Logistics:</strong> Vehicles consume fuel per step. Your HQ resupplies adjacent units every turn.
                  </li>
                </ol>
              </details>
            </div>
          </div>
        )}

        {/* TAB 2: CAMPAIGN OPERATIONS */}
        {activeTab === 'campaign' && (
          <CampaignView
            campaignProgress={profile.campaignProgress}
            unlockedBranches={profile.unlockedBranches}
            mits={profile.mits}
            onLaunchMission={handleLaunchCampaignMission}
            onUnlockBranch={handleUnlockBranch}
          />
        )}

        {/* TAB 3: ARMORY & TECH TREE */}
        {activeTab === 'armory' && (
          <ArmoryTechTree
            profile={profile}
            onUpgrade={handlePurchaseUpgrade}
            onUnlockUnit={handleUnlockUnit}
            onUnlockBranch={handleUnlockBranch}
            onUnlockSkin={handleUnlockSkin}
            onEquipSkin={handleEquipSkin}
            onResetUpgrades={handleResetUpgrades}
          />
        )}

        {/* TAB 4: CUSTOM SKIRMISH GENERATOR */}
        {activeTab === 'skirmish' && (
          <SkirmishModal onStartMatch={handleLaunchSkirmish} />
        )}
      </main>

      {/* IN-GAME CONTEXTUAL POPUPS */}
      {popupUnit && activeTab === 'battle' && (
        <UnitActionPopup
          unit={popupUnit}
          engine={engine}
          onMoveClick={() => {
            // Movement mode stays activated via highlight
          }}
          onSelectAbility={(idx) => {
            engine.selectAbility(idx);
          }}
          onCapture={(building) => {
            executeUnitAction(() => engine.captureBuilding(popupUnit, building));
          }}
          onToggleGroundAim={() => {
            engine.toggleGroundAim();
          }}
          onClose={() => setPopupUnit(null)}
          disabled={engine.busy || engine.ctrl[engine.cur]}
        />
      )}

      {popupBuilding && activeTab === 'battle' && (
        <BuildingActionPopup
          building={popupBuilding}
          engine={engine}
          onSelectUnitToDeploy={(code) => {
            engine.sp = code;
            engine.sel = null;
            engine.recalculateHighlights();
            engine.triggerChange();
          }}
          onClose={() => setPopupBuilding(null)}
          disabled={engine.busy || engine.ctrl[engine.cur]}
        />
      )}

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        engine={engine}
        profile={profile}
        onProfileUpdated={handleProfileUpdated}
        isCampaignMode={engine.isCampaignMode}
        activeTool={adminActiveTool}
        setActiveTool={setAdminActiveTool}
        adminSpawnUnit={adminSpawnUnit}
        setAdminSpawnUnit={setAdminSpawnUnit}
        adminSpawnFaction={adminSpawnFaction}
        setAdminSpawnFaction={setAdminSpawnFaction}
      />

      {/* Victory / Defeat Overlay Modal */}
      {engine.over && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#12171a] border border-[#232c32] rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
                {engine.winner === 0 ? 'Tactical Victory!' : 'Mission Defeat'}
              </h2>
              <p className="text-xs text-amber-400 font-mono font-bold mt-1">
                {engine.victoryReason || (engine.winner === 0 ? 'Operation objectives completed! Sector pacified.' : 'Friendly forces overwhelmed. Regroup and rethink tactics.')}
              </p>
            </div>

            {/* Bounty Card */}
            {engine.winner === 0 && (
              <div className="p-3 bg-[#0c1012] border border-[#232c32] rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Tactical Mits Awarded</span>
                <span className="text-amber-400 font-bold text-sm">
                  +{engine.activeMission ? engine.activeMission.rewardMits : 500} MITS
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  if (engine.activeMission) {
                    handleLaunchCampaignMission(engine.activeMission);
                  } else {
                    engine.initMatch({
                      mapSize: engine.N,
                      playersCount: engine.NP,
                      humanFactions: [0],
                      campaignMissionId: engine.missionId || undefined,
                      isCampaign: engine.isCampaignMode,
                    });
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-950/20"
              >
                Replay Mission
              </button>
              <button
                onClick={() => setActiveTab('campaign')}
                className="w-full py-3 px-4 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#28353d] font-bold rounded-xl text-xs uppercase tracking-wider font-mono"
              >
                Return to Campaign Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Manager Modal */}
      <SaveManagerModal
        currentProfile={profile}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
