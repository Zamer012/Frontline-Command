import React, { useState } from 'react';
import { MatchConfig } from '../game/engine';
import { Swords, Users, Bot, Globe, Shield, Play } from 'lucide-react';

interface SkirmishModalProps {
  onStartMatch: (config: MatchConfig) => void;
}

export const SkirmishModal: React.FC<SkirmishModalProps> = ({ onStartMatch }) => {
  const [selectedMode, setSelectedMode] = useState<number>(0);
  const [startingGold, setStartingGold] = useState<number>(24);
  const [fogOfWar, setFogOfWar] = useState<boolean>(true);
  const [autoDeploy, setAutoDeploy] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<'normal' | 'hard' | 'expert'>('hard');

  const modes = [
    {
      id: 0,
      title: 'Skirmish vs AI Commander',
      desc: '1v1 tactical battle against computer AI on a 15x15 sector.',
      mapSize: 15,
      players: 2,
      humans: [0],
      icon: Swords,
    },
    {
      id: 1,
      title: 'Two Players (Pass & Play)',
      desc: '1v1 local multiplayer on one device with turn cover privacy.',
      mapSize: 15,
      players: 2,
      humans: [0, 1],
      icon: Users,
    },
    {
      id: 2,
      title: 'Bot vs Bot Simulation',
      desc: 'Spectate two autonomous AI commanders fighting for victory in real-time. Zero manual deployment.',
      mapSize: 15,
      players: 2,
      humans: [],
      icon: Bot,
    },
    {
      id: 3,
      title: 'Grand War: You vs 3 AI Powers',
      desc: 'Massive 30x30 theater with 4 corner HQs and multiple central barracks.',
      mapSize: 30,
      players: 4,
      humans: [0],
      icon: Globe,
    },
    {
      id: 4,
      title: '4-Way Grand War (Spectate)',
      desc: 'Watch four autonomous AI superpowers clash across a 30x30 theater. Instant battle, zero setup.',
      mapSize: 30,
      players: 4,
      humans: [],
      icon: Bot,
    },
    {
      id: 5,
      title: 'Grand War: 4 Players Local',
      desc: '4-player hotseat conflict on one shared device.',
      mapSize: 30,
      players: 4,
      humans: [0, 1, 2, 3],
      icon: Users,
    },
  ];

  const currentMode = modes[selectedMode];
  const isBotSimulation = currentMode.humans.length === 0;

  const handleLaunch = () => {
    const m = modes[selectedMode];
    const isSim = m.humans.length === 0;
    onStartMatch({
      mapSize: m.mapSize,
      playersCount: m.players,
      humanFactions: m.humans,
      startingGold: Array(m.players).fill(m.mapSize > 15 ? startingGold * 2 : startingGold),
      autoDeploy: isSim || autoDeploy,
      fogOfWar: isSim ? false : fogOfWar,
      difficulty: aiDifficulty,
    });
  };

  const [category, setCategory] = useState<'all' | 'vs_ai' | 'spectate' | 'local'>('all');

  const filteredModes = modes.filter((m) => {
    if (category === 'all') return true;
    if (category === 'vs_ai') return m.humans.length === 1;
    if (category === 'spectate') return m.humans.length === 0;
    if (category === 'local') return m.humans.length > 1;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-[#141b20] to-[#101417] border border-[#232c32] rounded-2xl p-6 chamfer-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Shield className="w-4 h-4" />
            <span>TACTICAL WAR ROOM SANDBOX</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Custom Skirmish Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Choose single-player vs AI, local pass-and-play, or relax and spectate full-scale autonomous AI bot wars.
          </p>
        </div>

        {/* Quick Launch Button */}
        <button
          onClick={handleLaunch}
          className="py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 shrink-0 transition-all"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Launch Selected Mode</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0c1012] rounded-xl border border-[#232c32] text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            category === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Modes ({modes.length})
        </button>
        <button
          onClick={() => setCategory('vs_ai')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            category === 'vs_ai'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>You vs AI Bots</span>
        </button>
        <button
          onClick={() => setCategory('spectate')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            category === 'spectate'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Bot vs Bot (Spectate)</span>
        </button>
        <button
          onClick={() => setCategory('local')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            category === 'local'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pass & Play (1 Device)</span>
        </button>
      </div>

      {/* Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          const badge =
            mode.id === 0
              ? '⭐ Recommended Starter'
              : mode.id === 2
              ? '⚡ Instant AI Spectate'
              : mode.id === 3
              ? '🔥 Epic 4-Way War'
              : mode.id === 4
              ? '👑 4-Way AI Showdown'
              : null;

          return (
            <div
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-amber-400 bg-[#161e22] shadow-lg shadow-amber-950/20'
                  : 'border-[#232c32] bg-[#111619] hover:border-[#384650]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-[#1b2328] text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">{mode.title}</h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Grid {mode.mapSize}x{mode.mapSize} · {mode.players} Factions
                    </span>
                  </div>
                </div>

                {badge && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-12">{mode.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Battle Parameter Controls */}
      <div className="bg-[#12171a] p-5 rounded-xl border border-[#232c32] space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Match Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Starting Gold */}
          <div className="space-y-1.5 p-3 bg-[#0c1012] rounded-lg border border-[#232c32] flex flex-col justify-between">
            <div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Deployment Budget</span>
                <span className="text-amber-400 font-bold">{startingGold} Gold</span>
              </div>
              <input
                type="range"
                min={16}
                max={64}
                step={4}
                value={startingGold}
                onChange={(e) => setStartingGold(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer mt-2"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
              <span>16 (Scarcity)</span>
              <span>64 (Blitz)</span>
            </div>
          </div>

          {/* AI Intelligence Level */}
          <div className="flex flex-col justify-between p-3 bg-[#0c1012] rounded-lg border border-[#232c32]">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200 font-mono">AI Intelligence</div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    aiDifficulty === 'expert'
                      ? 'text-red-400 bg-red-500/10 border border-red-500/30'
                      : aiDifficulty === 'hard'
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                      : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                  }`}
                >
                  {aiDifficulty.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                {aiDifficulty === 'expert'
                  ? 'Expert: focus fire, screen artillery, counter-buys'
                  : aiDifficulty === 'hard'
                  ? 'Hard: pulls back low HP units, medics heal, standoff'
                  : 'Standard: basic combat & tactical retreat'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              {(['normal', 'hard', 'expert'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setAiDifficulty(lvl)}
                  className={`py-1 text-[10px] font-mono font-bold rounded border transition-colors uppercase ${
                    aiDifficulty === lvl
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Deployment Phase Toggle */}
          <div className="flex flex-col justify-between p-3 bg-[#0c1012] rounded-lg border border-[#232c32]">
            <div>
              <div className="text-xs font-bold text-slate-200 font-mono">Army Deployment</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {isBotSimulation
                  ? 'Bots deploy automatically'
                  : autoDeploy
                  ? 'Auto-deploy armies & start Turn 1'
                  : 'Manual placement tile-by-tile'}
              </div>
            </div>
            <button
              onClick={() => !isBotSimulation && setAutoDeploy(!autoDeploy)}
              disabled={isBotSimulation}
              className={`mt-2 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors ${
                isBotSimulation || autoDeploy
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isBotSimulation ? 'AUTO (BOT SIM)' : autoDeploy ? 'INSTANT COMBAT' : 'MANUAL SETUP'}
            </button>
          </div>

          {/* Fog of War Toggle */}
          <div className="flex flex-col justify-between p-3 bg-[#0c1012] rounded-lg border border-[#232c32]">
            <div>
              <div className="text-xs font-bold text-slate-200 font-mono">Fog of War</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {isBotSimulation ? 'Spectator view reveals all tiles' : 'Units reveal tiles in line of sight'}
              </div>
            </div>
            <button
              onClick={() => setFogOfWar(!fogOfWar)}
              className={`mt-2 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors ${
                !isBotSimulation && fogOfWar
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isBotSimulation ? 'REVEALED (SPECTATOR)' : fogOfWar ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 uppercase tracking-wider transition-all mt-4"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>{isBotSimulation ? 'Start Bot Simulation' : autoDeploy ? 'Instant Deploy & Start Combat' : 'Deploy to Sector'}</span>
        </button>
      </div>
    </div>
  );
};
