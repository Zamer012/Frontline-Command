import React, { useState } from 'react';
import { CampaignMission, CampaignBranch } from '../types/game';
import { CAMPAIGN_MISSIONS, CAMPAIGN_BRANCHES } from '../game/campaignData';
import {
  Star,
  Shield,
  Lock,
  Play,
  Award,
  CheckCircle2,
  Circle,
  Coins,
  ArrowRight,
  Unlock,
  Compass,
} from 'lucide-react';

interface CampaignViewProps {
  campaignProgress: Record<
    string,
    { completed: boolean; stars: number; bestTurns?: number; completedObjectives: string[] }
  >;
  unlockedBranches: string[];
  mits: number;
  onLaunchMission: (mission: CampaignMission) => void;
  onUnlockBranch: (branchId: string, costMits: number) => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  campaignProgress,
  unlockedBranches,
  mits,
  onLaunchMission,
  onUnlockBranch,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch_iron_dawn');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('op_01_dawnbreak');

  const selectedBranch =
    CAMPAIGN_BRANCHES.find((b) => b.id === selectedBranchId) || CAMPAIGN_BRANCHES[0];

  const branchMissions = CAMPAIGN_MISSIONS.filter((m) => m.branchId === selectedBranch.id);

  const selectedMission =
    branchMissions.find((m) => m.id === selectedMissionId) || branchMissions[0] || CAMPAIGN_MISSIONS[0];

  const isBranchUnlocked = (bId: string) => {
    return unlockedBranches.includes(bId);
  };

  const isMissionUnlocked = (mission: CampaignMission) => {
    if (!isBranchUnlocked(mission.branchId)) return false;
    const missionIndexInBranch = branchMissions.findIndex((m) => m.id === mission.id);
    if (missionIndexInBranch <= 0) return true;
    const prevMission = branchMissions[missionIndexInBranch - 1];
    return !!campaignProgress[prevMission?.id]?.completed;
  };

  const totalStarsEarned = Object.values(campaignProgress).reduce(
    (sum, p) => sum + (p.stars || 0),
    0
  );
  const totalMissionsCompleted = Object.values(campaignProgress).filter(
    (p) => p.completed
  ).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Campaign Operations Banner */}
      <div className="bg-gradient-to-r from-[#141b20] to-[#101417] border border-[#232c32] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Shield className="w-4 h-4" />
            <span>THEATER OF OPERATIONS · CORE CAMPAIGN PROGRESSION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Campaign Operations
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mt-1 leading-relaxed">
            Lead your strike battalion through structured tactical operations. Victorious operations reward <strong className="text-amber-400 font-semibold">Mits</strong> to unlock advanced units and cosmetic liveries in the Armory.
          </p>
        </div>

        {/* Global Progress Strip */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#232c32] pt-4 md:pt-0 md:pl-8 text-sm font-mono shrink-0">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Campaigns Pacified</span>
            <span className="text-xl font-bold text-slate-200 tabular-nums">
              {totalMissionsCompleted} / {CAMPAIGN_MISSIONS.length}
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Stars Earned</span>
            <div className="flex items-center gap-1.5 text-xl font-bold text-amber-400 tabular-nums">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>
                {totalStarsEarned} / {CAMPAIGN_MISSIONS.length * 3}
              </span>
            </div>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Treasury</span>
            <span className="text-xl font-black text-amber-400 tabular-nums">
              {mits.toLocaleString()} <span className="text-xs font-normal text-slate-400">MITS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Beginner-Friendly Quick Start Guide Banner */}
      <div className="bg-[#111619] border border-[#232c32] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f282e] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Field Commander's Quick Guide (How To Play)
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-400 font-semibold">
            Beginner Friendly Rules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#0a0d0f] rounded-xl border border-[#1d252b] space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
              <span className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center text-xs">1</span>
              <span>Move & Fire</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Tap any friendly unit. <strong className="text-cyan-300">Blue tiles</strong> show your move range. <strong className="text-red-300">Red tiles</strong> show weapon firing range.
            </p>
          </div>

          <div className="p-3 bg-[#0a0d0f] rounded-xl border border-[#1d252b] space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
              <span className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-xs">2</span>
              <span>Capture Outposts</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Only foot soldiers (<strong className="text-amber-300">Riflemen, Medics, Anti-Tank</strong>) can capture buildings. Move next to an outpost and tap Capture for <strong className="text-emerald-400">+1 Gold/turn</strong>.
            </p>
          </div>

          <div className="p-3 bg-[#0a0d0f] rounded-xl border border-[#1d252b] space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
              <span className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
              <span>Objectives & Rules</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              In <strong className="text-blue-300">Defend & Holdout</strong>, protect your HQ Fortress at all costs. In <strong className="text-cyan-300">Assault & Conquest</strong>, you fight until your very last unit and structure falls! Earn <strong className="text-amber-400">Mits</strong> on victory.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Branch Selector Tabs */}
      {/* Campaign Branch Selector Tabs */}
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
          OPERATIONAL THEATER BRANCHES (6 THEATERS AVAILABLE)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {CAMPAIGN_BRANCHES.map((branch) => {
            const isUnlocked = isBranchUnlocked(branch.id);
            const isSelected = selectedBranchId === branch.id;
            const completedInBranch = branch.missionIds.filter(
              (id) => campaignProgress[id]?.completed
            ).length;

            return (
              <button
                key={branch.id}
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  const firstMissionId = branch.missionIds[0];
                  if (firstMissionId) setSelectedMissionId(firstMissionId);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-[#161e22] shadow-md shadow-amber-950/20'
                    : isUnlocked
                    ? 'border-[#232c32] hover:border-[#384650] bg-[#111619]'
                    : 'border-[#1b2226] bg-[#0c1012] opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      BRANCH {branch.number}
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {completedInBranch}/{branch.missionIds.length}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-200 line-clamp-1">{branch.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {branch.description}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-[#1e262c] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">{branch.missionIds.length} Ops</span>
                  {!isUnlocked && (
                    <span className="text-amber-400 font-bold">{branch.unlockCostMits} Mits</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Mission List (Left) + Briefing Terminal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mission List Nodes (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
              {selectedBranch.title} · Tactical Operations
            </h2>

            {!isBranchUnlocked(selectedBranch.id) && (
              <button
                onClick={() => onUnlockBranch(selectedBranch.id, selectedBranch.unlockCostMits)}
                disabled={mits < selectedBranch.unlockCostMits}
                className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Branch ({selectedBranch.unlockCostMits} Mits)</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {branchMissions.map((mission) => {
              const unlocked = isMissionUnlocked(mission);
              const progress = campaignProgress[mission.id];
              const isSelected = selectedMission.id === mission.id;
              const stars = progress?.stars || 0;

              return (
                <div
                  key={mission.id}
                  onClick={() => unlocked && setSelectedMissionId(mission.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    !unlocked
                      ? 'border-[#1b2226] bg-[#0c1012] opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-amber-400 bg-[#161d21] shadow-lg shadow-amber-950/20 cursor-pointer'
                      : 'border-[#232c32] hover:border-[#384650] bg-[#111619] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                          !unlocked
                            ? 'bg-[#14191c] text-slate-600 border-[#232c32]'
                            : progress?.completed
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {!unlocked ? (
                          <Lock className="w-4 h-4" />
                        ) : progress?.completed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          mission.number
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-500">
                            OP #{mission.number} · {mission.codename}
                          </span>
                          {/* Mission Objective Type Badge */}
                          {mission.objectiveType === 'holdout' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              HOLDOUT {mission.holdoutTurns ? `(${mission.holdoutTurns}T)` : ''}
                            </span>
                          ) : mission.objectiveType === 'defend_and_attack' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              DEFEND & ATTACK
                            </span>
                          ) : mission.objectiveType === 'counterattack' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              COUNTERATTACK
                            </span>
                          ) : mission.objectiveType === 'destroy_vip' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              VIP HUNT
                            </span>
                          ) : mission.objectiveType === 'capture_outposts' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              DOMINATION
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              ASSAULT
                            </span>
                          )}

                          {mission.difficulty === 'expert' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              EXPERT AI
                            </span>
                          ) : mission.difficulty === 'hard' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              HARD AI
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-400/90 border border-cyan-500/20">
                              STANDARD AI
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-200 mt-1">
                          {mission.title}
                        </h3>
                      </div>
                    </div>

                    {/* Right Star Ratings & Mits Bounty */}
                    <div className="text-right shrink-0">
                      {unlocked ? (
                        <div className="flex items-center gap-1 justify-end">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= stars
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-600">LOCKED</span>
                      )}
                      <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                        +{mission.rewardMits} MITS
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Mission Briefing Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-[#141a1e] border border-[#232c32] rounded-2xl p-6 space-y-5 sticky top-20 shadow-xl">
          <div className="border-b border-[#232c32] pb-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>OPERATION #{selectedMission.number}</span>
              <span className="text-amber-400 font-bold">{selectedMission.codename}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{selectedMission.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 mt-2">
              <span>Grid: {selectedMission.mapSize}x{selectedMission.mapSize}</span>
              <span>·</span>
              <span>Enemy: {selectedMission.enemyFactionName}</span>
              <span>·</span>
              <span
                className={
                  selectedMission.difficulty === 'expert'
                    ? 'text-red-400 font-bold'
                    : selectedMission.difficulty === 'hard'
                    ? 'text-amber-400 font-bold'
                    : 'text-cyan-400'
                }
              >
                AI: {(selectedMission.difficulty || 'normal').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Narrative Briefing */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Mission Directive
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-[#0c1012] p-3 rounded-xl border border-[#232c32]">
              {selectedMission.briefing}
            </p>
          </div>

          {/* Tactical Intel */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400/90 mb-1.5">
              Intelligence Advisory
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-[#0c1012] p-3 rounded-xl border border-[#232c32]">
              {selectedMission.intelBrief}
            </p>
          </div>

          {/* Objectives Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Operational Objectives
            </h4>
            <div className="space-y-1.5">
              {selectedMission.objectives.map((obj) => {
                const isDone =
                  campaignProgress[selectedMission.id]?.completedObjectives?.includes(
                    obj.id
                  );

                return (
                  <div
                    key={obj.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c1012] border border-[#232c32] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <span>{obj.text}</span>
                    </div>
                    {obj.isBonus && (
                      <span className="text-amber-400 text-[10px] shrink-0 font-semibold">
                        ★ +{obj.rewardMits} MITS
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mission Bounty */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1316] border border-[#232c32] text-xs font-mono">
            <span className="text-slate-400">Victory Reward</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">+{selectedMission.rewardMits} MITS</span>
              <span className="text-cyan-400 font-bold">+{selectedMission.rewardIntel} INTEL</span>
            </div>
          </div>

          {/* Launch CTA Button */}
          {isMissionUnlocked(selectedMission) ? (
            <button
              onClick={() => onLaunchMission(selectedMission)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 uppercase tracking-wider transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch Operation</span>
            </button>
          ) : (
            <div className="p-3 bg-[#0c1012] border border-amber-500/30 rounded-xl text-center text-xs font-mono text-amber-400">
              Complete preceding mission or unlock branch to launch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
