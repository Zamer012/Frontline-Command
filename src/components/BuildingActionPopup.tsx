import React, { useRef, useEffect, useState } from 'react';
import { UnitInstance, UnitTypeCode } from '../types/game';
import { TacticalEngine } from '../game/engine';
import { drawUnitModel } from '../game/unitRenderer';
import { FACTION_COLORS, FACTION_NAMES, BUILDING_DESCRIPTIONS, STARTER_UNITS } from '../game/constants';
import {
  Building2,
  Coins,
  Shield,
  Zap,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface BuildingActionPopupProps {
  building: UnitInstance;
  engine: TacticalEngine;
  onSelectUnitToDeploy: (unitCode: UnitTypeCode) => void;
  onClose: () => void;
  disabled?: boolean;
}

export const BuildingActionPopup: React.FC<BuildingActionPopupProps> = ({
  building,
  engine,
  onSelectUnitToDeploy,
  onClose,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deploy'>('overview');
  const iconCanvasRef = useRef<HTMLCanvasElement>(null);
  const bp = engine.getBlueprint(building.t);
  const isOwner = building.o === engine.cur;
  const isHqOrBarracks = building.t === 'H' || building.t === 'W';
  const currentGold = engine.gold[engine.cur];

  useEffect(() => {
    const canvas = iconCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 5);
    ctx.scale(0.85, 0.85);
    const color = building.o >= 0 ? FACTION_COLORS[building.o] : '#94a3b8';
    drawUnitModel(ctx, building.t, color, performance.now(), 0, 0);
    ctx.restore();
  }, [building]);

  // Candidate units for deployment
  const deployableUnits: UnitTypeCode[] = [
    'R', 'C', 'K', 'T', 'B', 'G', 'S', 'P', 'Z', 'N',
    'X', 'I', 'U', 'Q', 'V', 'M', 'A', 'D', 'Y', 'F', 'L', 'E', 'J',
  ];

  const availableUnits = deployableUnits.filter((code) => engine.isUnitUnlocked(code));

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="pointer-events-auto bg-[#13191d]/95 backdrop-blur-md border border-[#2d373e] rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full text-slate-200 font-sans border-t-2 border-t-amber-400">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c32] pb-3 mb-4">
          <div className="flex items-center gap-3">
            <canvas
              ref={iconCanvasRef}
              width={60}
              height={44}
              className="bg-[#0b0e10] rounded-lg border border-[#232c32]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{bp.n}</h3>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: building.o >= 0 ? `${FACTION_COLORS[building.o]}20` : '#94a3b820',
                    color: building.o >= 0 ? FACTION_COLORS[building.o] : '#94a3b8',
                  }}
                >
                  {building.o >= 0 ? FACTION_NAMES[building.o] : 'Neutral'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {building.t === 'H'
                  ? 'Main Command Headquarters'
                  : building.t === 'W'
                  ? 'Forward Armory & Barracks'
                  : 'Strategic Resource Outpost'}
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

        {/* Structure Status Stats */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0b0f12] border border-[#232c32] text-xs font-mono mb-4">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">STRUCTURAL INTEGRITY</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400 tabular-nums">
                {building.hp} / {building.maxHp} HP
              </span>
              <div className="flex-1 h-1.5 bg-[#172026] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(building.hp / building.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">INCOME GENERATION</span>
            <span className="font-bold text-amber-400">
              {building.t === 'H' ? '+2 Gold / turn' : building.t === 'O' ? '+1 Gold / turn' : '0 Gold / turn'}
            </span>
          </div>
        </div>

        {/* Tactical Sub-Actions for Owned Facilities */}
        {isOwner && isHqOrBarracks ? (
          <div>
            {/* Tabs for Deploy vs Logistics */}
            <div className="flex items-center gap-1 p-1 bg-[#0c1012] rounded-xl border border-[#232c32] mb-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Logistics & Supply</span>
              </button>
              <button
                onClick={() => setActiveTab('deploy')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'deploy'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Spawn Unit ({availableUnits.length})</span>
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#0c1012] border border-[#232c32] rounded-xl text-xs text-slate-300 leading-relaxed">
                  <p>{BUILDING_DESCRIPTIONS[building.t]}</p>
                  {building.t === 'W' && (
                    <div className="mt-2 text-cyan-400 font-mono text-[11px] flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {building.cd
                          ? `Automated field supply ready in ${building.cd} turns.`
                          : 'Automated field supply armed! Friendly units within 1 tile are resupplied.'}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('deploy')}
                  disabled={disabled}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deploy Reinforcements Near {bp.n}</span>
                </button>
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>UNLOCKED COMBAT UNITS</span>
                  <span className="text-amber-400 font-bold">{currentGold} GOLD AVAIL</span>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableUnits.map((code) => {
                    const uBp = engine.getBlueprint(code);
                    const canAfford = currentGold >= uBp.c;

                    return (
                      <button
                        key={code}
                        disabled={disabled || !canAfford}
                        onClick={() => {
                          onSelectUnitToDeploy(code);
                          onClose();
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          canAfford
                            ? 'border-[#232c32] hover:border-amber-400 bg-[#0c1012] hover:bg-[#161d21] cursor-pointer'
                            : 'border-[#1b2226] bg-[#090c0e] opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs text-slate-200">
                          <span className="truncate">{uBp.n}</span>
                          <span className="font-mono text-amber-400 text-xs shrink-0">{uBp.c}G</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                          <span>HP {uBp.hp}</span>
                          <span>MV {uBp.mv}</span>
                          <span>{uBp.ab.length} Wpn</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-[#0c1012] border border-[#232c32] rounded-xl text-xs text-slate-300 leading-relaxed">
              <p>{BUILDING_DESCRIPTIONS[building.t]}</p>
              <div className="mt-2.5 text-amber-400 font-mono text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {building.o === engine.cur
                    ? 'Captured outpost provides +1 Gold turn income.'
                    : 'To capture, move friendly infantry adjacent to this structure and tap Capture.'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-[#182126] hover:bg-[#202c34] text-slate-300 border border-[#2c373e] font-bold rounded-xl text-xs font-mono uppercase tracking-wider"
            >
              Close Directive
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
