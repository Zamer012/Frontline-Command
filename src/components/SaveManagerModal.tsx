import React, { useState, useRef } from 'react';
import { PlayerProfile } from '../types/game';
import { GameStorageService } from '../services/storage';
import {
  X,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Star,
  Coins,
  Shield,
} from 'lucide-react';

interface SaveManagerModalProps {
  currentProfile: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: PlayerProfile) => void;
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  currentProfile,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [slots, setSlots] = useState(GameStorageService.listAllSlots());
  const [profileNameInput, setProfileNameInput] = useState(currentProfile.profileName);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const refreshSlots = () => {
    setSlots(GameStorageService.listAllSlots());
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSwitchSlot = (slotId: number) => {
    GameStorageService.setActiveSlotId(slotId);
    const loaded = GameStorageService.loadProfile(slotId);
    setProfileNameInput(loaded.profileName);
    onProfileUpdated(loaded);
    refreshSlots();
    showNotice('success', `Switched to Profile Slot #${slotId}`);
  };

  const handleManualSave = () => {
    const updated = {
      ...currentProfile,
      profileName: profileNameInput.trim() || `Commander ${currentProfile.slotId}`,
      lastSaved: Date.now(),
    };
    GameStorageService.saveProfile(updated);
    onProfileUpdated(updated);
    refreshSlots();
    showNotice('success', 'Profile saved locally on device.');
  };

  const handleExportFile = () => {
    GameStorageService.exportSaveFile(currentProfile);
    showNotice('success', `Exported Save File for Slot #${currentProfile.slotId} to device.`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = GameStorageService.importSaveFile(content, currentProfile.slotId);
      if (res.success && res.profile) {
        onProfileUpdated(res.profile);
        setProfileNameInput(res.profile.profileName);
        refreshSlots();
        showNotice('success', `Successfully imported save file into Slot #${currentProfile.slotId}!`);
      } else {
        showNotice('error', res.error || 'Failed to parse save file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetSlot = (slotId: number) => {
    if (window.confirm(`Are you sure you want to reset Slot #${slotId}? All progress and currencies in this slot will be erased.`)) {
      const reset = GameStorageService.resetSlot(slotId);
      if (slotId === currentProfile.slotId) {
        onProfileUpdated(reset);
        setProfileNameInput(reset.profileName);
      }
      refreshSlots();
      showNotice('success', `Slot #${slotId} has been reset.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12171a] border border-[#232c32] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 chamfer-sm shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c32] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Client Device Storage & Backups</h2>
              <p className="text-xs text-slate-400">
                Persistent local profile slots, on-device auto-save, and JSON file exports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {notification && (
          <div
            className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Active Profile Rename & Quick Save */}
        <div className="bg-[#0b0e10] p-4 rounded-xl border border-[#232c32] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Active Profile Identity
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold">
              SLOT #{currentProfile.slotId}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={profileNameInput}
              onChange={(e) => setProfileNameInput(e.target.value)}
              placeholder="Commander Call-Sign"
              className="flex-1 bg-[#141b1f] border border-[#2a353c] text-slate-200 text-sm px-3.5 py-2 rounded-lg font-mono focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleManualSave}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors uppercase tracking-wider font-mono"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* 3 Save Slots Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Device Storage Slots
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {slots.map((s) => {
              const isActive = s.slotId === currentProfile.slotId;
              const completedCount = Object.values(s.profile.campaignProgress || {}).filter(
                (m) => m.completed
              ).length;
              const stars = Object.values(s.profile.campaignProgress || {}).reduce(
                (sum, m) => sum + (m.stars || 0),
                0
              );

              return (
                <div
                  key={s.slotId}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isActive
                      ? 'border-amber-400/80 bg-[#161d22] shadow-md shadow-amber-950/20'
                      : 'border-[#232c32] bg-[#0c1012] hover:border-[#334049]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        SLOT #{s.slotId}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-200 text-sm truncate">
                      {s.profile.profileName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                      <div>Campaign: {completedCount} / 12</div>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{stars} Stars · {(s.profile.mits ?? s.profile.credits ?? 0).toLocaleString()} Mits</span>
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Saved: {new Date(s.profile.lastSaved).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#232c32] flex items-center gap-2">
                    {!isActive ? (
                      <button
                        onClick={() => handleSwitchSlot(s.slotId)}
                        className="flex-1 py-1.5 px-2 bg-[#1b2328] hover:bg-[#25323a] text-slate-200 rounded text-xs font-mono font-medium transition-colors text-center"
                      >
                        Switch
                      </button>
                    ) : (
                      <span className="flex-1 text-center py-1.5 text-xs font-mono text-slate-500">
                        Loaded
                      </span>
                    )}
                    <button
                      onClick={() => handleResetSlot(s.slotId)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      title="Reset this slot"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Physical File Import & Export Section */}
        <div className="bg-[#0b0e10] p-4 rounded-xl border border-[#232c32] space-y-3">
          <div>
            <h3 className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
              Save File Export & Import
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Save actual game data files directly onto your device hard drive or mobile storage to transfer between browsers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleExportFile}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#182126] hover:bg-[#222e36] text-amber-300 border border-[#2d3a42] rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Save File (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#182126] hover:bg-[#222e36] text-slate-200 border border-[#2d3a42] rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Import Save File (.json)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
