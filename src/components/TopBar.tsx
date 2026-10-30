import React from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  Save,
  Shield,
  Star,
  Coins,
  Wrench,
  ShieldAlert,
  Compass,
  Swords,
  Crosshair,
} from 'lucide-react';

interface TopBarProps {
  currentTab: 'battle' | 'campaign' | 'armory' | 'skirmish';
  onSelectTab: (tab: 'battle' | 'campaign' | 'armory' | 'skirmish') => void;
  mits: number;
  intel: number;
  muted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenSaveManager: () => void;
  onOpenAdmin: () => void;
  isInActiveBattle: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  mits,
  intel,
  muted,
  onToggleMute,
  onOpenSettings,
  onOpenSaveManager,
  onOpenAdmin,
  isInActiveBattle,
}) => {
  return (
    <header className="border-b border-[#232c32] bg-[#0c1013]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 border border-amber-400/40">
            <Shield className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold tracking-wider text-slate-100 uppercase whitespace-nowrap block leading-tight">
              Frontline Command
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:block">Tactical Warfare</span>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-400">
          <button
            onClick={() => onSelectTab('campaign')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'campaign'
                ? 'bg-[#182126] text-amber-400 font-bold border border-amber-500/40'
                : 'hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Campaign</span>
          </button>
          <button
            onClick={() => onSelectTab('armory')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'armory'
                ? 'bg-[#182126] text-amber-400 font-bold border border-amber-500/40'
                : 'hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Armory & Tech</span>
          </button>
          <button
            onClick={() => onSelectTab('skirmish')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'skirmish'
                ? 'bg-[#182126] text-amber-400 font-bold border border-amber-500/40'
                : 'hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Sandbox War Room</span>
          </button>
          <button
            onClick={() => onSelectTab('battle')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'battle'
                ? 'bg-[#182126] text-amber-400 font-bold border border-amber-500/40'
                : 'hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Battlefield</span>
            {isInActiveBattle && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </nav>

        {/* Zone 3: Currencies & Actions */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Mits & Intel HUD */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono bg-[#0b0e10] px-2.5 py-1 rounded-lg border border-[#232c32]">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold" title="Mits (Primary progression currency)">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums text-xs sm:text-sm">{mits.toLocaleString()}</span>
              <span className="text-[10px] text-amber-400/80 uppercase">MITS</span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold" title="Research Intel Stars">
              <Star className="w-3.5 h-3.5 fill-cyan-400/30 text-cyan-400" />
              <span className="tabular-nums text-xs sm:text-sm">{intel}</span>
              <span className="text-[10px] text-cyan-400/80 uppercase hidden sm:inline">INTEL</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Admin Console Trigger */}
          <button
            onClick={onOpenAdmin}
            className="p-1.5 text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-500/20"
            title="Admin Console (Password Protected for Mits)"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          {/* Save Manager */}
          <button
            onClick={onOpenSaveManager}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Save Profile & Export JSON File"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Audio Mute */}
          <button
            onClick={onToggleMute}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Game Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zone 4: Mobile & Tablet Sub-Navigation Strip */}
      <div className="lg:hidden flex items-center justify-around border-t border-[#1e262c] px-2 py-1.5 bg-[#080b0d] text-xs font-mono">
        <button
          onClick={() => onSelectTab('campaign')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
            currentTab === 'campaign' ? 'text-amber-400 font-bold bg-[#141d21]' : 'text-slate-400'
          }`}
        >
          <Compass className="w-3 h-3" />
          <span>Campaign</span>
        </button>
        <button
          onClick={() => onSelectTab('armory')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
            currentTab === 'armory' ? 'text-amber-400 font-bold bg-[#141d21]' : 'text-slate-400'
          }`}
        >
          <Wrench className="w-3 h-3" />
          <span>Armory</span>
        </button>
        <button
          onClick={() => onSelectTab('skirmish')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
            currentTab === 'skirmish' ? 'text-amber-400 font-bold bg-[#141d21]' : 'text-slate-400'
          }`}
        >
          <Swords className="w-3 h-3" />
          <span>Sandbox</span>
        </button>
        <button
          onClick={() => onSelectTab('battle')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
            currentTab === 'battle' ? 'text-amber-400 font-bold bg-[#141d21]' : 'text-slate-400'
          }`}
        >
          <Crosshair className="w-3 h-3" />
          <span>Battle</span>
          {isInActiveBattle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>
      </div>
    </header>
  );
};
