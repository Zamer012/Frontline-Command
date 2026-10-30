import React, { useRef, useEffect } from 'react';
import { UnitInstance, Ability } from '../types/game';
import { TacticalEngine } from '../game/engine';
import { drawUnitModel } from '../game/unitRenderer';
import { FACTION_COLORS } from '../game/constants';
import {
  Footprints,
  Crosshair,
  Flag,
  Zap,
  X,
  Target,
  Fuel,
  Battery,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface UnitActionPopupProps {
  unit: UnitInstance;
  engine: TacticalEngine;
  onMoveClick: () => void;
  onSelectAbility: (idx: number) => void;
  onCapture: (building: UnitInstance) => void;
  onToggleGroundAim: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export const UnitActionPopup: React.FC<UnitActionPopupProps> = ({
  unit,
  engine,
  onMoveClick,
  onSelectAbility,
  onCapture,
  onToggleGroundAim,
  onClose,
  disabled = false,
}) => {
  const iconCanvasRef = useRef<HTMLCanvasElement>(null);
  const bp = engine.getBlueprint(unit.t);
  const canMove = engine.canUnitMove(unit);
  const canAct = engine.canUnitAct(unit);
  const capturableBuildings = engine.getCapturableBuildings(unit);
  const activeAbility = engine.getActiveAbility(unit);

  useEffect(() => {
    const canvas = iconCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 6);
    const scale = 'JHOWBMAL'.includes(unit.t) ? 0.8 : 0.95;
    ctx.scale(scale, scale);
    const color = unit.o >= 0 ? FACTION_COLORS[unit.o] : '#94a3b8';
    drawUnitModel(ctx, unit.t, color, performance.now(), 0, 0);
    ctx.restore();
  }, [unit]);

  const formatAbilityDesc = (a: Ability) => {
    if (a.f.includes('h')) return 'Restores 2 HP, Fuel, Ammo';
    if (a.f.includes('j')) return 'Disables target next turn';
    if (a.f.includes('r')) return `Repairs ${a.d} HP`;
    return `${a.d} Damage`;
  };

  const formatTags = (a: Ability) => {
    const list = [
      a.f.includes('i') && 'Indirect',
      a.f.includes('d') && 'Diagonal',
      a.f.includes('s') && 'Splash Area',
      a.f.includes('a') && '+2 vs Vehicles',
      a.f.includes('b') && !a.f.includes('r') && '2x vs Structures',
      a.f.includes('u') && 'Pins Target',
      a.f.includes('x') && 'Kamikaze',
      a.cd && `${a.cd}-Turn CD`,
    ].filter(Boolean);
    return list.join(' · ');
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="pointer-events-auto bg-[#13191d]/95 backdrop-blur-md border border-[#2d373e] rounded-2xl shadow-2xl p-4 sm:p-5 max-w-sm w-full text-slate-200 font-sans border-t-2 border-t-amber-400">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c32] pb-3 mb-3">
          <div className="flex items-center gap-3">
            <canvas
              ref={iconCanvasRef}
              width={56}
              height={42}
              className="bg-[#0b0e10] rounded-lg border border-[#232c32]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{bp.n}</h3>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Tier {bp.tier || 1}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {canMove ? 'Move Ready' : 'Movement Spent'} · {canAct ? 'Weapons Ready' : 'Action Spent'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vital Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#0b0f12] border border-[#232c32] text-xs font-mono text-center mb-3">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">HULL</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {unit.hp} / {unit.maxHp}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">FUEL</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {unit.fu != null ? `${unit.fu}/${unit.maxFu}` : 'INF'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">AMMO</span>
            <span className="font-bold text-cyan-400 tabular-nums">
              {unit.am != null ? `${unit.am}/${unit.maxAm}` : 'INF'}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2 mb-3">
          {/* Move Button */}
          <button
            disabled={disabled || !canMove}
            onClick={() => {
              onMoveClick();
              onClose();
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all ${
              canMove
                ? 'bg-[#1b262d] hover:bg-[#23323b] text-cyan-300 border border-cyan-500/40 shadow-md'
                : 'bg-[#111619] text-slate-500 border border-[#232c32] opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-cyan-400" />
              <span>Move Unit (Reach: {engine.getMoveReach(unit)} tiles)</span>
            </span>
            <span className="text-[10px] font-mono font-normal text-slate-400">Tap Blue Tile</span>
          </button>

          {/* Capture Button (if adjacent) */}
          {capturableBuildings.map((b) => (
            <button
              key={b.id}
              disabled={disabled || Boolean(unit.acted)}
              onClick={() => {
                onCapture(b);
                onClose();
              }}
              className="w-full py-2.5 px-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 animate-pulse"
            >
              <Flag className="w-4 h-4" />
              <span>Capture {engine.getBlueprint(b.t).n}!</span>
            </button>
          ))}
        </div>

        {/* Weapon Abilities List */}
        {bp.ab.length > 0 && (
          <div className="space-y-1.5 border-t border-[#232c32] pt-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>ARM WEAPON / ABILITY</span>
              <span>DAMAGE · RANGE</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {bp.ab.map((a, i) => {
                const isSelected = (unit.ai || 0) === i;
                const canAfford = engine.canAffordAbility(unit, a);

                return (
                  <button
                    key={i}
                    disabled={disabled || !canAfford || !canAct}
                    onClick={() => {
                      onSelectAbility(i);
                      onClose();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-950/20'
                        : 'border-[#232c32] hover:border-[#384650] bg-[#0c1012] text-slate-300'
                    } ${!canAfford || !canAct ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>{a.n}</span>
                      </span>
                      <span className="font-mono text-xs text-amber-400">
                        {a.d} DMG · R{a.rg}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{formatAbilityDesc(a)}</span>
                      {a.a && a.a > 1 && <span>Cost: {a.a} Ammo</span>}
                    </div>

                    {formatTags(a) && (
                      <span className="text-[10px] text-cyan-400/90 font-mono mt-0.5">
                        {formatTags(a)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ground Aim Mode Option */}
        <div className="mt-3 pt-2.5 border-t border-[#232c32] flex items-center justify-between">
          <button
            disabled={disabled || !canAct}
            onClick={() => {
              onToggleGroundAim();
            }}
            className={`text-xs font-mono py-1.5 px-3 rounded-lg border flex items-center gap-2 transition-colors ${
              unit.gm
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-[#28333a] hover:bg-[#182126] text-slate-400'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Target Ground Tile: {unit.gm ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 py-1.5 px-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
