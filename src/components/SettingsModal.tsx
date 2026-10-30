import React from 'react';
import { GraphicsSettings } from '../types/game';
import { GRAPHICS_NAMES, SPEED_MULTIPLIERS } from '../game/constants';
import { X, Sliders, Volume2, Monitor, Gauge } from 'lucide-react';

interface SettingsModalProps {
  settings: GraphicsSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: GraphicsSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12171a] border border-[#232c32] rounded-2xl w-full max-w-lg p-6 chamfer-sm shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c32] pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Battlefield Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Graphics Quality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Graphics Preset</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {GRAPHICS_NAMES[settings.quality - 1] || 'Standard'}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={settings.quality}
            onChange={(e) =>
              onUpdateSettings({ ...settings, quality: parseInt(e.target.value, 10) })
            }
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Performance</span>
            <span>Cinematic FX</span>
          </div>
        </div>

        {/* Audio Distant Profile */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audio Acoustics Profile</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 0, label: 'Fog Echo (Default)', desc: 'Muffled gunfire in fog' },
              { id: 1, label: 'Everywhere', desc: 'All battlefield sounds echo' },
              { id: 2, label: 'Muffler', desc: 'Silent in fog of war' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onUpdateSettings({ ...settings, soundMode: mode.id })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  settings.soundMode === mode.id
                    ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                    : 'border-[#232c32] bg-[#0c1012] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold font-mono">{mode.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Simulation Speed */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Combat Animation Speed</span>
          </span>
          <div className="flex gap-2">
            {SPEED_MULTIPLIERS.map((spd) => (
              <button
                key={spd}
                onClick={() => onUpdateSettings({ ...settings, gameSpeed: spd })}
                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors ${
                  settings.gameSpeed === spd
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-[#0c1012] border-[#232c32] text-slate-300 hover:bg-[#161c20]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Screen Shake Checkbox */}
        <label className="flex items-center gap-3 p-3 bg-[#0b0e10] rounded-xl border border-[#232c32] cursor-pointer">
          <input
            type="checkbox"
            checked={settings.screenShake}
            onChange={(e) =>
              onUpdateSettings({ ...settings, screenShake: e.target.checked })
            }
            className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
          />
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono">Camera Screen Shake</div>
            <div className="text-[11px] text-slate-400">
              Vibrate canvas during artillery impacts, bombs, and heavy explosions
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};
