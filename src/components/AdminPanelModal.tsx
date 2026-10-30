import React, { useState } from 'react';
import { TacticalEngine } from '../game/engine';
import { PlayerProfile, UnitTypeCode } from '../types/game';
import { UNIT_BLUEPRINTS, FACTION_NAMES, FACTION_COLORS, SPEED_MULTIPLIERS } from '../game/constants';
import {
  Lock,
  Unlock,
  KeyRound,
  Coins,
  Shield,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Skull,
  X,
  Gauge,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: TacticalEngine;
  profile: PlayerProfile;
  onProfileUpdated: (p: PlayerProfile) => void;
  isCampaignMode: boolean;
  activeTool: number | null;
  setActiveTool: (tool: number | null) => void;
  adminSpawnUnit: UnitTypeCode;
  setAdminSpawnUnit: (u: UnitTypeCode) => void;
  adminSpawnFaction: number;
  setAdminSpawnFaction: (f: number) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  engine,
  profile,
  onProfileUpdated,
  isCampaignMode,
  activeTool,
  setActiveTool,
  adminSpawnUnit,
  setAdminSpawnUnit,
  adminSpawnFaction,
  setAdminSpawnFaction,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [isCampaignUnlocked, setIsCampaignUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');

  // Mits is crucial progression currency, so it is strictly locked behind password
  const [isMitsUnlocked, setIsMitsUnlocked] = useState(false);
  const [mitsPasswordInput, setMitsPasswordInput] = useState('');
  const [mitsAuthError, setMitsAuthError] = useState('');

  if (!isOpen) return null;

  // Secret developer-only authentication (no hints, dev credentials only)
  const DEV_AUTH_HASH = 'U2hhd25ANjc=';

  const verifyDevClearance = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    try {
      if (btoa(trimmed) === DEV_AUTH_HASH) return true;
    } catch {
      // ignore encoding failures
    }
    return trimmed === 'Shawn@67' || trimmed === DEV_AUTH_HASH;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyDevClearance(passwordInput)) {
      setIsCampaignUnlocked(true);
      setIsMitsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Access Denied: Invalid clearance credentials.');
    }
  };

  const handleMitsPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyDevClearance(mitsPasswordInput)) {
      setIsMitsUnlocked(true);
      setMitsAuthError('');
    } else {
      setMitsAuthError('Access Denied: Invalid clearance credentials.');
    }
  };

  const isAccessAllowed = !isCampaignMode || isCampaignUnlocked;

  const handleAddMits = (amount: number) => {
    const updated: PlayerProfile = {
      ...profile,
      mits: Math.max(0, profile.mits + amount),
      credits: Math.max(0, (profile.credits || profile.mits) + amount),
    };
    onProfileUpdated(updated);
  };

  const handleAddGold = (faction: number, amount: number) => {
    if (faction === -1) {
      for (let i = 0; i < engine.NP; i++) {
        engine.gold[i] = Math.max(0, engine.gold[i] + amount);
      }
    } else {
      engine.gold[faction] = Math.max(0, engine.gold[faction] + amount);
    }
    engine.triggerChange();
  };

  const handleRefillAll = () => {
    engine.U.forEach((e) => {
      e.hp = e.maxHp;
      if (e.maxFu != null) e.fu = e.maxFu;
      if (e.maxAm != null) e.am = e.maxAm;
      e.cd = 0;
      e.fz = 0;
      e.sp = 0;
    });
    engine.note = 'Admin: All unit hulls, fuel, and munitions restored.';
    engine.recalculateHighlights();
    engine.triggerChange();
  };

  const handleToggleFog = () => {
    engine.fogOff = !engine.fogOff;
    engine.recalculateHighlights();
    engine.triggerChange();
  };

  const handleClearObstacles = () => {
    let count = 0;
    engine.ob.forEach((row, y) => {
      row.forEach((v, x) => {
        if (v) {
          row[x] = 0;
          count++;
        }
      });
    });
    engine.note = `Admin: Cleared ${count} terrain obstacles.`;
    engine.recalculateHighlights();
    engine.triggerChange();
  };

  const handleKillEnemyHQ = () => {
    const enemyHq = engine.U.find((e) => e.t === 'H' && e.o !== 0);
    if (enemyHq) {
      engine.applyDamage(enemyHq, enemyHq.hp);
      engine.recalculateHighlights();
      engine.triggerChange();
    }
  };

  const allUnitCodes: UnitTypeCode[] = [
    'R', 'G', 'S', 'P', 'K', 'T', 'Z', 'N', 'X', 'I',
    'C', 'V', 'M', 'B', 'U', 'Q', 'A', 'D', 'Y', 'F', 'L', 'E', 'J',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#12171b] border border-[#232c32] rounded-2xl shadow-2xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto text-slate-200 font-sans border-t-2 border-t-amber-400">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c32] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {isAccessAllowed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                Admin Console
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {isCampaignMode
                  ? 'CAMPAIGN MISSION ACCESS'
                  : 'SANDBOX / SKIRMISH UNRESTRICTED ACCESS'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PASSWORD LOCK FOR CAMPAIGNS */}
        {!isAccessAllowed ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
            <div className="p-3 bg-[#0c1012] border border-[#232c32] rounded-xl text-xs text-slate-300 leading-relaxed">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                <Shield className="w-4 h-4" />
                <span>Restricted Developer Console</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Security clearance required. Access is strictly restricted to authorized developers only.
              </p>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                DEVELOPER SECURITY CLEARANCE
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter developer password..."
                  className="w-full bg-[#0a0d0f] border border-[#2a343b] focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none font-mono"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-xs font-mono text-red-400 mt-1.5">{authError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verify Clearance</span>
            </button>
          </form>
        ) : (
          /* ACTIVE ADMIN CONSOLE */
          <div className="space-y-5">
            {/* 1. Mits Currency Tool (Protected by password) */}
            <div className="bg-[#0b0f12] border border-[#232c32] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Strategic Mits Treasury ({profile.mits.toLocaleString()} MITS)</span>
                </span>
                {isMitsUnlocked ? (
                  <button
                    onClick={() => setIsMitsUnlocked(false)}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 py-0.5 px-2 bg-slate-800 rounded border border-slate-700"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Re-lock Mits</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>DEV CLEARANCE REQUIRED</span>
                  </span>
                )}
              </div>

              {!isMitsUnlocked ? (
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mits is the core progression currency. Developer authorization required to adjust treasury reserves.
                  </p>
                  <form onSubmit={handleMitsPasswordSubmit} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={mitsPasswordInput}
                        onChange={(e) => setMitsPasswordInput(e.target.value)}
                        placeholder="Developer password..."
                        className="flex-1 bg-[#141b20] border border-[#28353d] focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                      />
                      <button
                        type="submit"
                        className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                      </button>
                    </div>
                    {mitsAuthError && (
                      <p className="text-[11px] font-mono text-red-400">{mitsAuthError}</p>
                    )}
                  </form>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    <span>Security clearance verified. Mits adjustments active:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddMits(500)}
                      className="flex-1 py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-amber-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold transition-colors"
                    >
                      +500 Mits
                    </button>
                    <button
                      onClick={() => handleAddMits(2000)}
                      className="flex-1 py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-amber-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold transition-colors"
                    >
                      +2,000 Mits
                    </button>
                    <button
                      onClick={() => handleAddMits(5000)}
                      className="flex-1 py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-amber-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold transition-colors"
                    >
                      +5,000 Mits
                    </button>
                    <button
                      onClick={() => handleAddMits(-500)}
                      className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-400 border border-[#2d383f] rounded-xl text-xs font-mono transition-colors"
                      title="Deduct 500 Mits"
                    >
                      -500
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. In-Battle Tactical Gold */}
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-2 uppercase">
                2. In-Battle Gold Treasury
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAddGold(engine.cur, 50)}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#2d383f] rounded-xl text-xs font-mono font-bold"
                >
                  +50 Current
                </button>
                <button
                  onClick={() => handleAddGold(engine.cur, 200)}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#2d383f] rounded-xl text-xs font-mono font-bold"
                >
                  +200 Current
                </button>
                <button
                  onClick={() => handleAddGold(-1, 100)}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#2d383f] rounded-xl text-xs font-mono"
                >
                  +100 All Factions
                </button>
              </div>
            </div>

            {/* 3. Spawner & Placement Tool */}
            <div className="space-y-2 border-t border-[#232c32] pt-4">
              <span className="text-xs font-mono text-slate-400 block uppercase">
                3. Battlefield Unit Placement Tool
              </span>

              <div className="flex gap-2">
                <select
                  value={adminSpawnUnit}
                  onChange={(e) => setAdminSpawnUnit(e.target.value as UnitTypeCode)}
                  className="flex-1 bg-[#0b0e10] border border-[#2c373e] text-xs font-mono rounded-xl p-2 text-slate-200 outline-none"
                >
                  {allUnitCodes.map((code) => (
                    <option key={code} value={code}>
                      {UNIT_BLUEPRINTS[code]?.n} ({code})
                    </option>
                  ))}
                </select>

                <select
                  value={adminSpawnFaction}
                  onChange={(e) => setAdminSpawnFaction(+e.target.value)}
                  className="flex-1 bg-[#0b0e10] border border-[#2c373e] text-xs font-mono rounded-xl p-2 text-slate-200 outline-none"
                >
                  {FACTION_NAMES.slice(0, engine.NP).map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setActiveTool(activeTool === 1 ? null : 1);
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTool === 1
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-300 border border-[#2d383f]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{activeTool === 1 ? 'Spawn Tool ACTIVE' : 'Place on Map'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTool(activeTool === 2 ? null : 2);
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTool === 2
                      ? 'bg-red-500 text-white font-black'
                      : 'bg-[#182126] text-slate-300 border border-[#2d383f]'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{activeTool === 2 ? 'Delete Tool ACTIVE' : 'Delete Unit'}</span>
                </button>
              </div>
            </div>

            {/* 4. Strategic Battlefield Controls */}
            <div className="space-y-2 border-t border-[#232c32] pt-4">
              <span className="text-xs font-mono text-slate-400 block uppercase">
                4. God-Mode Tactical Operations
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleFog}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    engine.fogOff
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-[#182126] text-slate-300 border border-[#2d383f]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{engine.fogOff ? 'Fog: REVEALED' : 'Reveal Map'}</span>
                </button>

                <button
                  onClick={handleRefillAll}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-emerald-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Heal & Refill All</span>
                </button>

                <button
                  onClick={handleClearObstacles}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-300 border border-[#2d383f] rounded-xl text-xs font-mono flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Clear Obstacles</span>
                </button>

                <button
                  onClick={handleKillEnemyHQ}
                  className="py-2 px-3 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Destroy Enemy HQ</span>
                </button>
              </div>
            </div>

            {/* 5. Speed Controls */}
            <div className="border-t border-[#232c32] pt-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>COMBAT SIMULATION SPEED</span>
                <span className="text-amber-400 font-bold">{engine.gameSpeed}x SPEED</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      engine.gameSpeed = spd;
                      engine.triggerChange();
                    }}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      engine.gameSpeed === spd
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-[#182126] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#182126] hover:bg-[#222e35] text-slate-300 border border-[#2c373e] font-bold rounded-xl text-xs font-mono uppercase tracking-wider"
              >
                Close Console
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
