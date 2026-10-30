import { PlayerProfile, GraphicsSettings, UnitTypeCode } from '../types/game';

const STORAGE_PREFIX = 'frontline_command_';
const ACTIVE_SLOT_KEY = `${STORAGE_PREFIX}active_slot`;
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;

export const DEFAULT_SETTINGS: GraphicsSettings = {
  quality: 6,
  soundMode: 0, // 0: fog echo, 1: everywhere, 2: muffler
  masterVolume: 0.8,
  sfxVolume: 0.85,
  muted: false,
  screenShake: true,
  gameSpeed: 1,
};

export const createDefaultProfile = (slotId: number, name = `Commander ${slotId}`): PlayerProfile => ({
  slotId,
  profileName: name,
  lastSaved: Date.now(),
  mits: 250, // Starter Mits
  credits: 250, // Backwards-compatible alias
  intel: 1, // Starter research star
  unlockedUnits: ['R', 'C', 'K', 'T', 'B'], // Beginner units unlocked by default
  unlockedBranches: ['branch_iron_dawn'], // First branch unlocked
  unlockedSkins: ['skin_default'], // Default skin
  activeSkin: 'skin_default',
  campaignProgress: {},
  purchasedUpgrades: {},
  skirmishStats: {
    battles: 0,
    victories: 0,
    defeats: 0,
    enemiesEliminated: 0,
    outpostsCaptured: 0,
    totalCreditsEarned: 0,
  },
});

export class GameStorageService {
  public static getActiveSlotId(): number {
    try {
      const val = localStorage.getItem(ACTIVE_SLOT_KEY);
      if (val) {
        const id = parseInt(val, 10);
        if (id >= 1 && id <= 3) return id;
      }
    } catch {
      // fallback
    }
    return 1;
  }

  public static setActiveSlotId(slotId: number): void {
    try {
      localStorage.setItem(ACTIVE_SLOT_KEY, slotId.toString());
    } catch (e) {
      console.warn('Unable to write active slot:', e);
    }
  }

  public static loadProfile(slotId = this.getActiveSlotId()): PlayerProfile {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}slot_${slotId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          const starterUnits: UnitTypeCode[] = ['R', 'C', 'K', 'T', 'B'];
          const mitsAmount = typeof parsed.mits === 'number' ? parsed.mits : typeof parsed.credits === 'number' ? parsed.credits : 250;
          const unlockedUnits = Array.isArray(parsed.unlockedUnits) && parsed.unlockedUnits.length > 0
            ? Array.from(new Set([...starterUnits, ...parsed.unlockedUnits]))
            : starterUnits;
          const unlockedBranches = Array.isArray(parsed.unlockedBranches) && parsed.unlockedBranches.length > 0
            ? Array.from(new Set(['branch_iron_dawn', ...parsed.unlockedBranches]))
            : ['branch_iron_dawn'];
          const unlockedSkins = Array.isArray(parsed.unlockedSkins) && parsed.unlockedSkins.length > 0
            ? Array.from(new Set(['skin_default', ...parsed.unlockedSkins]))
            : ['skin_default'];

          return {
            ...createDefaultProfile(slotId),
            ...parsed,
            mits: mitsAmount,
            credits: mitsAmount,
            unlockedUnits,
            unlockedBranches,
            unlockedSkins,
            activeSkin: parsed.activeSkin || 'skin_default',
            slotId,
          };
        }
      }
    } catch (e) {
      console.warn('Error reading save profile from device:', e);
    }
    const def = createDefaultProfile(slotId);
    this.saveProfile(def);
    return def;
  }

  public static saveProfile(profile: PlayerProfile): boolean {
    try {
      const updated = {
        ...profile,
        lastSaved: Date.now(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}slot_${profile.slotId}`, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to save profile on device:', e);
      return false;
    }
  }

  public static listAllSlots(): Array<{ slotId: number; exists: boolean; profile: PlayerProfile }> {
    return [1, 2, 3].map((id) => {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}slot_${id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { slotId: id, exists: true, profile: parsed };
        }
      } catch {
        // empty
      }
      return { slotId: id, exists: false, profile: createDefaultProfile(id) };
    });
  }

  public static resetSlot(slotId: number): PlayerProfile {
    const fresh = createDefaultProfile(slotId);
    this.saveProfile(fresh);
    return fresh;
  }

  public static loadSettings(): GraphicsSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: GraphicsSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings save error:', e);
    }
  }

  /**
   * Export the current slot data as a downloadable .json file onto the user's device
   */
  public static exportSaveFile(profile: PlayerProfile): void {
    const data = JSON.stringify(
      {
        app: 'Frontline Command',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        profile,
      },
      null,
      2
    );

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `frontline_save_slot${profile.slotId}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import and validate save data from an uploaded file
   */
  public static importSaveFile(jsonString: string, targetSlotId?: number): { success: boolean; profile?: PlayerProfile; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const profileData: Partial<PlayerProfile> = parsed.profile || parsed;

      const mitsVal = typeof profileData.mits === 'number'
        ? profileData.mits
        : typeof profileData.credits === 'number'
        ? profileData.credits
        : null;

      if (mitsVal == null || typeof profileData.campaignProgress !== 'object') {
        return { success: false, error: 'Invalid save file format. Missing currency or progress data.' };
      }

      const starterUnits: UnitTypeCode[] = ['R', 'C', 'K', 'T', 'B'];
      const unlockedUnits = Array.isArray(profileData.unlockedUnits) && profileData.unlockedUnits.length > 0
        ? Array.from(new Set([...starterUnits, ...profileData.unlockedUnits]))
        : starterUnits;
      const unlockedBranches = Array.isArray(profileData.unlockedBranches) && profileData.unlockedBranches.length > 0
        ? Array.from(new Set(['branch_iron_dawn', ...profileData.unlockedBranches]))
        : ['branch_iron_dawn'];
      const unlockedSkins = Array.isArray(profileData.unlockedSkins) && profileData.unlockedSkins.length > 0
        ? Array.from(new Set(['skin_default', ...profileData.unlockedSkins]))
        : ['skin_default'];

      const slotId = targetSlotId ?? profileData.slotId ?? this.getActiveSlotId();
      const validatedProfile: PlayerProfile = {
        ...createDefaultProfile(slotId),
        ...profileData,
        slotId,
        mits: mitsVal,
        credits: mitsVal,
        unlockedUnits,
        unlockedBranches,
        unlockedSkins,
        activeSkin: profileData.activeSkin || 'skin_default',
        lastSaved: Date.now(),
      };

      this.saveProfile(validatedProfile);
      return { success: true, profile: validatedProfile };
    } catch (err: unknown) {
      return { success: false, error: (err as Error)?.message || 'Failed to parse JSON file.' };
    }
  }
}
