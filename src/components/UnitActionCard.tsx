import React, { useEffect, useRef } from 'react';
import { UnitInstance, Ability } from '../types/game';
import { TacticalEngine } from '../game/engine';
import { drawUnitModel } from '../game/unitRenderer';
import { FACTION_COLORS, BUILDING_DESCRIPTIONS } from '../game/constants';
import { Shield, Zap, Crosshair, Flag, Footprints, Target, X, CheckCircle } from 'lucide-react';

interface UnitActionCardProps {
  unit: UnitInstance;
  engine: TacticalEngine;
  onSelectAbility: (index: number) => void;
  onToggleGroundAim: () => void;
  onCapture: (building: UnitInstance) => void;
  onDeselect?: () => void;
  disabled?: boolean;
}

export const UnitActionCard: React.FC<UnitActionCardProps> = ({
  unit,
  engine,
  onSelectAbility,
  onToggleGroundAim,
  onCapture,
  onDeselect,
  disabled = false,
}) => {
  const iconCanvasRef = useRef<HTMLCanvasElement>(null);
  const bp = engine.getBlueprint(unit.t);
  const isBuilding = !!bp.bl;

  useEffect(() => {
    const canvas = iconCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 5);
    const scale = 'JHOWBMAL'.includes(unit.t) ? 0.8 : 0.95;
    ctx.scale(scale, scale);
    const color = unit.o >= 0 ? FACTION_COLORS[unit.o] : '#94a3b8';
    drawUnitModel(ctx, unit.t, color, performance.now(), 0, 0);
    ctx.restore();
  }, [unit]);

  const canMove = engine.canUnitMove(unit);
  const canAct = engine.canUnitAct(unit);
  const capturableBuildings = engine.getCapturableBuildings(unit);

  const getUnitRoleDescription = (code: string) => {
    const roles: Record<string, string> = {
      R: 'Foot Infantry • Captures outposts & base structures',
      B: 'Main Battle Tank • Heavy composite armor & high-velocity 120mm cannon',
      C: 'Fast Recon Buggy • Superior movement speed and scout vision',
      T: 'Anti-Tank Squad • Shaped rockets lethal against armored vehicles',
      S: 'Precision Sniper • Long-range diagonal sniper rifle',
      A: 'Heavy Artillery • High-yield indirect howitzer firing over walls',
      K: 'Field Medic • Heals infantry HP back to full fighting strength',
      P: 'Support Supply Crew • Replenishes vehicle fuel, ammo, and repairs',
      G: 'Special Forces Commando • High firepower & structural breach charges',
      Z: 'Heavy Machine Gunner • Suppressive fire that pins enemy movement',
      N: 'Combat Engineer • Fortification repair crew and demolition specialist',
      X: 'Shock Trooper • Area flamethrower sweep with high incendiary damage',
      I: 'Stealth Infiltrator • Subsonic sniper & electromagnetic disable pulse',
      U: 'Flak Halftrack • Dual rapid autocannons lethal against air and light targets',
      Q: 'Hovercraft Raider • High-speed amphibious skimmer with pulse blasters',
      V: 'Strike Drone • High-speed autonomous kamikaze ordnance',
      M: 'Multi-Turret Tank • High cruise speed with dual explosive cannons',
      D: 'Railgun Destroyer • Electromagnetic kinetic slug that pierces heavy armor',
      Y: 'Attack Gunship • Flies freely above ground terrain with Hellfire missiles',
      F: 'Heavy Bomber • Aerial bombing platform with wide carpet blast',
      L: 'Rocket Battery • Mobile thermobaric launcher with massive collateral blast',
      E: 'EMP Jammer • Electronic warfare pulse freezing enemy vehicles',
      J: 'Titan Juggernaut • Super-heavy walking fortress with twin cannons and mortar',
    };
    return roles[code] || bp.description || 'Frontline tactical combat unit';
  };

  const formatAbilityDesc = (a: Ability) => {
    if (a.f.includes('h')) return 'Restores +2 HP, Fuel & Ammunition to ally';
    if (a.f.includes('j')) return 'Freezes enemy systems (Disabled next turn)';
    if (a.f.includes('r')) return `Repairs +${a.d} HP to friendly unit`;
    return `${a.d} Firepower Damage`;
  };

  const formatAbilityTags = (a: Ability) => {
    const tags = [
      a.f.includes('i') && 'Indirect (Fires over obstacles)',
      a.f.includes('d') && 'Diagonal Line',
      a.f.includes('s') && 'Splash Area Blast',
      a.f.includes('a') && '+2 Bonus vs Tanks & Vehicles',
      a.f.includes('b') && !a.f.includes('r') && '2x Damage vs Buildings & HQ',
      a.f.includes('u') && 'Pins Target (Cannot move next turn)',
      a.f.includes('x') && 'Kamikaze Suicide Blast',
      a.cd && `${a.cd}-Turn Recharge Cooldown`,
    ].filter(Boolean);
    return tags.join(' • ');
  };

  return (
    <div className="bg-[#141a1e] border border-[#232c32] rounded-xl p-4 chamfer-sm flex flex-col gap-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232c32] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100">{bp.n}</h3>
            {unit.o === 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                FRIENDLY
              </span>
            ) : unit.o > 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                HOSTILE
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-700/30 text-slate-300 border border-slate-700">
                NEUTRAL
              </span>
            )}
          </div>
          <p className="text-xs text-amber-300/90 font-medium mt-1">
            {getUnitRoleDescription(unit.t)}
          </p>
        </div>
        <canvas ref={iconCanvasRef} width={64} height={46} className="bg-[#0b0e10] rounded border border-[#232c32] shrink-0" />
      </div>

      {/* Action Guidance Status Banner */}
      {!isBuilding && (
        <div className="p-2.5 rounded-lg bg-[#0c1012] border border-[#232c32] text-xs font-mono">
          {canMove && canAct ? (
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Ready: Tap Blue tile to move, or Red tile to shoot</span>
            </div>
          ) : canMove ? (
            <div className="flex items-center gap-2 text-amber-300">
              <Footprints className="w-3.5 h-3.5 text-amber-400" />
              <span>Can move (tap Blue tile) • Weapons used this turn</span>
            </div>
          ) : canAct ? (
            <div className="flex items-center gap-2 text-red-300">
              <Target className="w-3.5 h-3.5 text-red-400" />
              <span>In position: Ready to fire (tap Red enemy target)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Unit turn complete (moved & acted)</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Meters */}
      <div className="space-y-2 text-xs font-mono">
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Hull Integrity (HP)</span>
            <span className="font-semibold tabular-nums">
              {unit.hp} / {unit.maxHp}
            </span>
          </div>
          <div className="h-2 w-full bg-[#0b0f12] rounded-full overflow-hidden border border-[#1b2226]">
            <div
              className={`h-full transition-all duration-300 ${
                unit.hp / unit.maxHp > 0.5 ? 'bg-emerald-500' : unit.hp / unit.maxHp > 0.25 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }}
            />
          </div>
        </div>

        {bp.fu != null && (
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Fuel Reserve (Tiles of movement)</span>
              <span className="font-semibold tabular-nums">
                {unit.fu} / {unit.maxFu}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#0b0f12] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.max(0, ((unit.fu ?? 0) / (unit.maxFu || 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {bp.am != null && (
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Munitions / Ammunition</span>
              <span className="font-semibold tabular-nums">
                {unit.am} / {unit.maxAm}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#0b0f12] rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 transition-all duration-300"
                style={{ width: `${Math.max(0, ((unit.am ?? 0) / (unit.maxAm || 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Description for Buildings */}
      {isBuilding && (
        <div className="text-xs text-slate-300 leading-relaxed bg-[#0b0f12] p-3 rounded-lg border border-[#232c32]">
          {BUILDING_DESCRIPTIONS[unit.t] || 'Military installation.'}
          {unit.t === 'W' && (
            <span className="block mt-1 text-cyan-400 font-mono">
              {unit.cd ? `Supply ready in ${unit.cd} turns` : 'Resupply ready on contact'}
            </span>
          )}
        </div>
      )}

      {/* Capture Actions */}
      {capturableBuildings.map((b) => (
        <button
          key={b.id}
          disabled={Boolean(disabled || unit.acted)}
          onClick={() => onCapture(b)}
          className="w-full py-3 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 uppercase tracking-wider disabled:opacity-40 transition-all"
        >
          <Flag className="w-4 h-4" />
          <span>Capture {engine.getBlueprint(b.t).n} (+1 Gold Income)</span>
        </button>
      ))}

      {/* Ground Aim Mode Toggle */}
      {!isBuilding && canMove && (
        <button
          disabled={disabled}
          onClick={onToggleGroundAim}
          className={`w-full py-2 px-3 border rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            unit.gm
              ? 'border-amber-400/80 bg-amber-500/15 text-amber-300'
              : 'border-[#2d373e] hover:bg-[#1a2328] text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Empty Grid Tile</span>
          </span>
          <span className="font-mono text-[11px] font-bold uppercase">{unit.gm ? 'ON' : 'OFF'}</span>
        </button>
      )}

      {/* Weapons / Ability Loadout */}
      {!isBuilding && bp.ab.length > 0 && (
        <div className="space-y-1.5 mt-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Weapon Modes</span>
            <span>Range · Cost</span>
          </div>
          {bp.ab.map((a, i) => {
            const isSelected = (unit.ai || 0) === i;
            const canAfford = engine.canAffordAbility(unit, a);

            return (
              <button
                key={i}
                disabled={disabled || !canAfford}
                onClick={() => onSelectAbility(i)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-1 ${
                  isSelected
                    ? 'border-amber-400 bg-[#212923] text-amber-300 shadow-sm'
                    : 'border-[#232c32] hover:border-[#384650] bg-[#0e1316] text-slate-300'
                } ${!canAfford ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{a.n}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Rng {a.rg} {a.a && a.a > 1 ? `· Ammo ${a.a}` : ''}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{formatAbilityDesc(a)}</span>
                  {a.cd && unit.cd > 0 ? (
                    <span className="text-cyan-400 font-mono">CD: {unit.cd}</span>
                  ) : null}
                </div>
                {formatAbilityTags(a) && (
                  <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                    {formatAbilityTags(a)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Deselect / Close Button */}
      {onDeselect && (
        <button
          onClick={onDeselect}
          className="mt-1 w-full py-2 px-3 rounded-lg border border-[#232c32] hover:bg-[#182126] text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Deselect Unit / View Recruitment</span>
        </button>
      )}
    </div>
  );
};
