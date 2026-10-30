import React, { useState, useRef, useEffect } from 'react';
import { ARMORY_UPGRADES } from '../game/upgradesData';
import { CAMPAIGN_BRANCHES } from '../game/campaignData';
import { ArmoryUpgrade, PlayerProfile, UnitTypeCode, CosmeticSkin } from '../types/game';
import { UNIT_BLUEPRINTS, COSMETIC_SKINS, STARTER_UNITS, FACTION_COLORS } from '../game/constants';
import { drawUnitModel } from '../game/unitRenderer';
import {
  Shield,
  Coins,
  Wrench,
  CheckCircle2,
  Lock,
  Unlock,
  Zap,
  Sparkles,
  Plane,
  Users,
  Target,
  Palette,
  Compass,
  RefreshCw,
  Star,
} from 'lucide-react';

interface ArmoryTechTreeProps {
  profile: PlayerProfile;
  onUpgrade: (upgrade: ArmoryUpgrade) => void;
  onUnlockUnit: (unitCode: UnitTypeCode, costMits: number) => void;
  onUnlockBranch: (branchId: string, costMits: number) => void;
  onUnlockSkin: (skinId: string, costMits: number) => void;
  onEquipSkin: (skinId: string) => void;
  onResetUpgrades: () => void;
}

export const ArmoryTechTree: React.FC<ArmoryTechTreeProps> = ({
  profile,
  onUpgrade,
  onUnlockUnit,
  onUnlockBranch,
  onUnlockSkin,
  onEquipSkin,
  onResetUpgrades,
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'skins' | 'branches' | 'upgrades'>('units');
  const [unitTierFilter, setUnitTierFilter] = useState<'all' | 1 | 2 | 3 | 4>('all');

  const allUnitCodes: UnitTypeCode[] = [
    'R', 'C', 'K', 'T', 'B', 'G', 'S', 'P', 'Z', 'N',
    'X', 'I', 'U', 'Q', 'V', 'M', 'A', 'D', 'Y', 'F', 'L', 'E', 'J',
  ];

  const filteredUnits = allUnitCodes.filter((code) => {
    const bp = UNIT_BLUEPRINTS[code];
    if (unitTierFilter === 'all') return true;
    return (bp?.tier || 1) === unitTierFilter;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141b20] to-[#101417] border border-[#232c32] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Wrench className="w-4 h-4" />
            <span>ARMORY R&D & FLEET FABRICATION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Armory & Tech Tree
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mt-1 leading-relaxed">
            Spend <strong className="text-amber-400 font-semibold">Mits</strong> earned from tactical campaign victories to unlock advanced military units, cosmetic unit camouflage, and campaign branch operational clearances.
          </p>
        </div>

        {/* Currency Vault Display */}
        <div className="flex flex-wrap items-center gap-6 border-t md:border-t-0 md:border-l border-[#232c32] pt-4 md:pt-0 md:pl-8 text-sm font-mono shrink-0">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Mits Currency</span>
            <div className="flex items-center gap-1.5 text-2xl font-black text-amber-400 tabular-nums">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>{profile.mits.toLocaleString()}</span>
              <span className="text-xs font-normal text-slate-400">MITS</span>
            </div>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Research Intel</span>
            <div className="flex items-center gap-1.5 text-xl font-bold text-cyan-400 tabular-nums">
              <Star className="w-4 h-4 fill-cyan-400/30 text-cyan-400" />
              <span>{profile.intel} INTEL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beginner-friendly tip */}
      <div className="p-3 bg-[#111619] border border-[#232c32] rounded-xl flex items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-400">How to use Mits:</strong> Win Campaign missions to earn Mits. Unlock units and upgrades below to deploy them in your battles.
          </span>
        </div>
      </div>

      {/* Main Navigation Segmented Control */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0f1418] rounded-xl border border-[#232c32] overflow-x-auto">
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'units'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Advanced Units ({profile.unlockedUnits.length}/{allUnitCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('skins')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'skins'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Cosmetic Skins ({profile.unlockedSkins.length}/{COSMETIC_SKINS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'branches'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Campaign Clearances ({profile.unlockedBranches.length}/{CAMPAIGN_BRANCHES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upgrades')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'upgrades'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Combat Tech Upgrades</span>
        </button>
      </div>

      {/* TAB 1: UNIT UNLOCKS */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Sub-tier filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-400 mr-1">FILTER TIER:</span>
              {(['all', 1, 2, 3, 4] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setUnitTierFilter(tier)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    unitTierFilter === tier
                      ? 'bg-[#222d34] text-amber-400 font-bold border border-amber-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier === 'all' ? 'All Tiers' : `Tier ${tier}`}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">
                {profile.unlockedUnits.length}
              </span>{' '}
              Units Unlocked ·{' '}
              <span className="text-amber-400 font-bold">
                {allUnitCodes.length - profile.unlockedUnits.length}
              </span>{' '}
              Locked
            </div>
          </div>

          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((code) => {
              const bp = UNIT_BLUEPRINTS[code];
              const isUnlocked = profile.unlockedUnits.includes(code);
              const isStarter = STARTER_UNITS.includes(code);
              const mitsCost = bp.mitsCost || 0;
              const canAfford = profile.mits >= mitsCost;

              return (
                <div
                  key={code}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? 'border-[#232c32] bg-[#12181c]'
                      : 'border-[#1b2226] bg-[#0c1012] opacity-85'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <UnitCanvasPreview unitCode={code} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-100 text-sm">{bp.n}</h3>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              T{bp.tier || 1}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            Deploy Cost: {bp.c} Gold
                          </span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-3 h-3" /> LOCKED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {bp.description || 'Frontline tactical combat unit.'}
                    </p>

                    {/* Stats strip */}
                    <div className="grid grid-cols-4 gap-1 p-2 bg-[#090c0e] rounded-lg border border-[#1e252a] text-center text-[10px] font-mono text-slate-300 mt-2.5">
                      <div>
                        <span className="text-slate-500 block">HP</span>
                        <span className="font-bold text-emerald-400">{bp.hp}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">MOVE</span>
                        <span className="font-bold text-cyan-400">{bp.mv}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">FUEL</span>
                        <span className="font-bold text-amber-400">{bp.fu ?? 'INF'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">AMMO</span>
                        <span className="font-bold text-slate-200">{bp.am ?? 'INF'}</span>
                      </div>
                    </div>

                    {/* Weapons */}
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">
                        Loadout Abilities ({bp.ab.length})
                      </span>
                      {bp.ab.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#0e1316] px-2 py-1 rounded border border-[#1c2429]"
                        >
                          <span className="text-slate-300">{a.n}</span>
                          <span className="text-amber-400">{a.d} DMG · R{a.rg}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purchase Footer */}
                  <div className="mt-4 pt-3 border-t border-[#1e262c] flex items-center justify-between">
                    <div>
                      {isUnlocked ? (
                        <span className="text-xs font-mono text-slate-400">
                          {isStarter ? 'Starter Unit (Free)' : 'Requisition Active'}
                        </span>
                      ) : (
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">RESEARCH COST</span>
                          <span className="text-sm font-mono font-bold text-amber-400">
                            {mitsCost} MITS
                          </span>
                        </div>
                      )}
                    </div>

                    {isUnlocked ? (
                      <button
                        disabled
                        className="py-1.5 px-3 rounded-lg text-xs font-mono font-bold bg-[#172025] text-slate-400 border border-[#232c32] cursor-default"
                      >
                        Ready to Deploy
                      </button>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onUnlockUnit(code, mitsCost)}
                        className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20'
                            : 'bg-[#151c20] text-slate-500 border border-[#232c32] cursor-not-allowed'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlock Unit</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COSMETIC SKINS */}
      {activeTab === 'skins' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400">
            Customize the battle paint and livery of your military forces. Unlocked skins can be equipped freely.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COSMETIC_SKINS.map((skin) => {
              const isUnlocked = profile.unlockedSkins.includes(skin.id);
              const isActive = profile.activeSkin === skin.id;
              const canAfford = profile.mits >= skin.costMits;

              return (
                <div
                  key={skin.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isActive
                      ? 'border-amber-400 bg-[#161d21] shadow-lg shadow-amber-950/20'
                      : isUnlocked
                      ? 'border-[#232c32] bg-[#12181c]'
                      : 'border-[#1b2226] bg-[#0c1012] opacity-80'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20 shadow-inner flex items-center justify-center font-bold font-mono text-xs text-white"
                          style={{ backgroundColor: skin.accentColor }}
                        >
                          <Palette className="w-4 h-4 text-slate-950" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 text-sm">{skin.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {skin.camoStyle} camouflage
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                          EQUIPPED
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-slate-500 border border-[#232c32] px-2 py-0.5 rounded">
                          LOCKED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {skin.description}
                    </p>

                    {/* Color Swatches */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <span>Accent:</span>
                        <span
                          className="w-4 h-4 rounded-full border border-white/30 inline-block"
                          style={{ backgroundColor: skin.accentColor }}
                        />
                      </div>
                      <span className="text-slate-700">·</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <span>Hull:</span>
                        <span
                          className="w-4 h-4 rounded-full border border-white/30 inline-block"
                          style={{ backgroundColor: skin.hullTone }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3.5 border-t border-[#1e262c] flex items-center justify-between">
                    <div>
                      {isUnlocked ? (
                        <span className="text-xs font-mono text-emerald-400">In Armory</span>
                      ) : (
                        <div className="text-xs font-mono font-bold text-amber-400">
                          {skin.costMits} MITS
                        </div>
                      )}
                    </div>

                    {isActive ? (
                      <button
                        disabled
                        className="py-1.5 px-3.5 rounded-lg text-xs font-mono font-bold bg-[#1b252a] text-amber-400 border border-amber-500/30 cursor-default"
                      >
                        Active Skin
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onEquipSkin(skin.id)}
                        className="py-1.5 px-3.5 rounded-lg text-xs font-mono font-bold bg-[#182227] hover:bg-[#202e35] text-slate-200 border border-[#2c373e] transition-colors"
                      >
                        Equip Livery
                      </button>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onUnlockSkin(skin.id, skin.costMits)}
                        className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20'
                            : 'bg-[#151c20] text-slate-500 border border-[#232c32] cursor-not-allowed'
                        }`}
                      >
                        Unlock Skin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPAIGN BRANCH CLEARANCES */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-mono">
            Unlock strategic campaign theaters ahead of time with Mits, or complete preceding campaign branches to unlock automatically.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMPAIGN_BRANCHES.map((branch) => {
              const isUnlocked = profile.unlockedBranches.includes(branch.id);
              const canAfford = profile.mits >= branch.unlockCostMits;

              return (
                <div
                  key={branch.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? 'border-emerald-500/40 bg-[#121917]'
                      : 'border-[#232c32] bg-[#12181c]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase text-amber-400">
                        CHAPTER {branch.number} · {branch.codename}
                      </span>
                      {isUnlocked ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> CLEARANCE GRANTED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-3 h-3" /> LOCKED THEATER
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-100">{branch.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {branch.description}
                    </p>

                    <div className="mt-3 text-xs font-mono text-slate-400">
                      <span>Missions in Branch: {branch.missionIds.length} operations</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#1e262c] flex items-center justify-between">
                    <div>
                      {isUnlocked ? (
                        <span className="text-xs font-mono text-emerald-400">
                          Active in Campaign Map
                        </span>
                      ) : (
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">THEATER CLEARANCE</span>
                          <span className="text-sm font-mono font-bold text-amber-400">
                            {branch.unlockCostMits} MITS
                          </span>
                        </div>
                      )}
                    </div>

                    {isUnlocked ? (
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Unlocked
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onUnlockBranch(branch.id, branch.unlockCostMits)}
                        className={`py-2 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20'
                            : 'bg-[#151c20] text-slate-500 border border-[#232c32] cursor-not-allowed'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlock Branch ({branch.unlockCostMits} Mits)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: COMBAT TECH UPGRADES */}
      {activeTab === 'upgrades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Permanent baseline upgrades applied to your fleet across all campaign battles and skirmishes.
            </span>
            <button
              onClick={onResetUpgrades}
              className="py-1.5 px-3 bg-[#172026] hover:bg-[#202c34] text-slate-300 border border-[#2c373e] rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset & Refund Mits</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ARMORY_UPGRADES.map((upgrade) => {
              const currentLevel = profile.purchasedUpgrades[upgrade.id] || 0;
              const isMax = currentLevel >= upgrade.maxLevel;
              const canAfford =
                profile.mits >= upgrade.costMits && profile.intel >= upgrade.costIntel;

              return (
                <div
                  key={upgrade.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isMax
                      ? 'border-emerald-500/40 bg-[#0e1614] shadow-md shadow-emerald-950/10'
                      : 'border-[#232c32] bg-[#13191d] hover:border-[#384650]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                        {upgrade.category}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3.5 h-1.5 rounded-sm ${
                              i < currentLevel ? 'bg-amber-400' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{upgrade.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {upgrade.description}
                    </p>

                    <div className="mt-3.5 p-2.5 rounded-lg bg-[#0b0f12] border border-[#232c32] text-xs font-mono text-cyan-300">
                      <div className="flex items-center gap-1.5 font-bold mb-0.5 text-slate-400 text-[10px] uppercase">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>Combat Benefit</span>
                      </div>
                      <div>{upgrade.statBonus}</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#232c32] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block">UPGRADE COST</span>
                      {isMax ? (
                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> MAX TIER
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                          <span className="text-amber-400">{upgrade.costMits} MITS</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-cyan-400">{upgrade.costIntel} INTEL</span>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={isMax || !canAfford}
                      onClick={() => onUpgrade(upgrade)}
                      className={`py-2 px-3.5 rounded-lg text-xs font-bold font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${
                        isMax
                          ? 'bg-[#1b2320] text-emerald-400 cursor-default opacity-80'
                          : canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20'
                          : 'bg-[#1b2226] text-slate-500 cursor-not-allowed border border-[#2a343a]'
                      }`}
                    >
                      {isMax ? 'Completed' : 'Upgrade'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent to render unit icon canvas
const UnitCanvasPreview: React.FC<{ unitCode: UnitTypeCode }> = ({ unitCode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 5);
    const scale = 'JHOWBMALD'.includes(unitCode) ? 0.75 : 0.9;
    ctx.scale(scale, scale);
    drawUnitModel(ctx, unitCode, '#38bdf8', performance.now(), 0, 0);
    ctx.restore();
  }, [unitCode]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={36}
      className="bg-[#0b0e10] rounded border border-[#232c32] shrink-0"
    />
  );
};
