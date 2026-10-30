import React, { useState } from 'react';
import { UnitTypeCode } from '../types/game';
import { TacticalEngine } from '../game/engine';
import { AIR_UNITS, UNIT_BLUEPRINTS } from '../game/constants';
import { Shield, Plane, Users, Truck, Wrench, Lock, CheckCircle2 } from 'lucide-react';

interface DeploymentShopProps {
  engine: TacticalEngine;
  onSelectUnitToDeploy: (unitCode: UnitTypeCode) => void;
  selectedUnitCode: UnitTypeCode | null;
  currentGold: number;
  onOpenArmory?: () => void;
  disabled?: boolean;
}

export const DeploymentShop: React.FC<DeploymentShopProps> = ({
  engine,
  onSelectUnitToDeploy,
  selectedUnitCode,
  currentGold,
  onOpenArmory,
  disabled = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'infantry' | 'armor' | 'air' | 'support'>('all');

  const unitCodes: UnitTypeCode[] = [
    'R', 'C', 'K', 'T', 'B', 'G', 'S', 'P', 'Z', 'N',
    'X', 'I', 'U', 'Q', 'V', 'M', 'A', 'D', 'Y', 'F', 'L', 'E', 'J',
  ];

  const getCategory = (code: UnitTypeCode): 'infantry' | 'armor' | 'air' | 'support' => {
    if (AIR_UNITS.includes(code) || code === 'C' || code === 'Q') return 'air';
    if ('MBALJD'.includes(code)) return 'armor';
    if ('PKNE'.includes(code)) return 'support';
    return 'infantry';
  };

  const filteredCodes = unitCodes.filter((code) => {
    if (filter === 'all') return true;
    return getCategory(code) === filter;
  });

  const getUnitQuickRole = (code: UnitTypeCode): string => {
    switch (code) {
      case 'R': return 'Foot Infantry (Captures outposts)';
      case 'B': return 'Main Battle Tank (Heavy armor & cannon)';
      case 'C': return 'Scout Buggy (Fast recon & wide sight)';
      case 'T': return 'Anti-Tank (Lethal vs armored vehicles)';
      case 'S': return 'Sniper (Long-range diagonal fire)';
      case 'A': return 'Artillery (Indirect long-range shells)';
      case 'K': return 'Medic (Heals infantry HP)';
      case 'P': return 'Supplier (Replenishes fuel & ammo)';
      case 'G': return 'Commando (Elite assault & breaching)';
      case 'Z': return 'Machine Gunner (Pins enemy movement)';
      case 'N': return 'Combat Engineer (Structure repair)';
      case 'X': return 'Shock Trooper (Incendiary flamethrower)';
      case 'I': return 'Infiltrator (Stealth recon & EMP)';
      case 'U': return 'Flak Halftrack (Anti-aircraft autocannon)';
      case 'Q': return 'Hovercraft (Amphibious raider)';
      case 'V': return 'Strike Drone (Autonomous kamikaze)';
      case 'M': return 'Multi Tank (Cruiser with dual cannons)';
      case 'D': return 'Railgun Destroyer (Pierces heavy armor)';
      case 'Y': return 'Attack Gunship (Airborne missile gunner)';
      case 'F': return 'Bomber (Heavy carpet ordnance)';
      case 'L': return 'Rocket Launcher (Thermobaric blast)';
      case 'E': return 'EMP Jammer (Disables mechanical units)';
      case 'J': return 'Juggernaut (Titanic fortress war engine)';
      default: return 'Combat unit';
    }
  };

  const selectedBlueprint = selectedUnitCode ? engine.getBlueprint(selectedUnitCode) : null;

  return (
    <div className="bg-[#141a1e] border border-[#232c32] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#232c32] pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            Recruit Reinforcements
          </h3>
          <p className="text-[11px] text-slate-400">
            Build units and deploy on gold tiles near your HQ
          </p>
        </div>
        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 block uppercase">Treasury</span>
          <span className="text-base font-extrabold text-amber-400 tabular-nums">
            {currentGold} <span className="text-xs font-normal text-slate-400">GOLD</span>
          </span>
        </div>
      </div>

      {/* Active Placement Guidance Banner */}
      {selectedBlueprint && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs font-mono animate-pulse">
          <div>
            <div className="font-bold text-amber-300">
              Ready to Deploy: {selectedBlueprint.n} ({selectedBlueprint.c}G)
            </div>
            <div className="text-[11px] text-slate-300">
              Tap any highlighted Gold tile on the map adjacent to your HQ.
            </div>
          </div>
          <button
            onClick={() => onSelectUnitToDeploy(selectedUnitCode!)}
            className="py-1 px-2.5 bg-slate-900/80 hover:bg-slate-900 text-amber-300 rounded border border-amber-500/30 text-xs shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0e1316] rounded-lg border border-[#232c32] overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Units
        </button>
        <button
          onClick={() => setFilter('infantry')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'infantry'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3 h-3" />
          Infantry
        </button>
        <button
          onClick={() => setFilter('armor')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'armor'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3 h-3" />
          Armor
        </button>
        <button
          onClick={() => setFilter('air')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'air'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plane className="w-3 h-3" />
          Air / Recon
        </button>
        <button
          onClick={() => setFilter('support')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'support'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-3 h-3" />
          Support
        </button>
      </div>

      {/* Grid of Units with plain descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
        {filteredCodes.map((code) => {
          const bp = engine.getBlueprint(code);
          const maxHp = engine.getMaxHealth(code, engine.cur);
          const isSelected = selectedUnitCode === code;
          const isUnlocked = engine.isUnitUnlocked(code);
          const canAfford = currentGold >= bp.c;
          const quickRole = getUnitQuickRole(code);

          if (!isUnlocked) {
            return (
              <div
                key={code}
                onClick={onOpenArmory}
                className="p-2.5 rounded-xl border border-[#1b2226] bg-[#0c1012] opacity-60 flex flex-col justify-between text-left cursor-pointer hover:border-[#2d3840] transition-colors"
                title="Locked in Armory. Tap to view tech tree."
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-400">{bp.n}</span>
                    <span className="text-[10px] font-mono text-amber-400/80 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> {bp.mitsCost} Mits
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{quickRole}</p>
                </div>
                <div className="text-[10px] font-mono text-cyan-400 mt-2">
                  Unlock in Armory →
                </div>
              </div>
            );
          }

          return (
            <button
              key={code}
              disabled={disabled || !canAfford}
              onClick={() => onSelectUnitToDeploy(code)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-950/20'
                  : 'border-[#232c32] hover:border-[#384650] bg-[#0e1316]'
              } ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-100">{bp.n}</span>
                  <span className="font-mono font-black text-xs text-amber-400 bg-[#161d20] px-1.5 py-0.5 rounded border border-amber-500/20">
                    {bp.c}G
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-2 line-clamp-1">
                  {quickRole}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-[#1b2327]">
                <span className="text-emerald-400 font-bold">{maxHp} HP</span>
                <span className="text-cyan-400 font-bold">Mv {bp.mv}</span>
                <span>{bp.ab.length} Wpn</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
