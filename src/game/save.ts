import { GameSettings, SaveData } from './types';

const SAVE_KEY = 'shadow_exe_kalyug_save_v1';
const SETTINGS_KEY = 'shadow_exe_kalyug_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  cameraDistance: 6.2,
  mouseSensitivity: 1.0,
  masterVolume: 0.75,
  sfxVolume: 0.85,
  ambienceVolume: 0.65,
  showMobileControls: 'auto',
  shadowsEnabled: true,
  qualityMode: 'auto',
};

export function createNewSaveData(): SaveData {
  return {
    version: 3,
    timestamp: Date.now(),
    areaId: 'forest',
    playerClass: 'warrior',
    activeWeaponName: 'Khanda Astra Sword',
    playerPosition: { x: 0, y: 0, z: 26 },
    playerYaw: 0,
    level: 1,
    xp: 0,
    health: 100,
    energy: 100,
    abilities: {},
    blessings: [],
    petId: null,
    shivaTandavaSeen: false,
    isGod: false,
    artifacts: [],
    consumables: {
      pranaElixir: 2,
      somaVial: 2,
    },
    flags: {
      discoveredAreas: ['forest'],
      bellRung: false,
      mandalaSolved: false,
      purifiedMonoliths: [],
      openedChests: [],
      defeatedBosses: [],
      loreRead: [],
      clearedPortals: [],
    },
    completedQuestIds: [],
    enemiesDefeated: 0,
    forgeShards: 2,
    forgedWeaponBonus: 0,
    forgedWeaponsCount: 0,
  };
}

export function loadSaveData(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || typeof parsed.level !== 'number' || !parsed.areaId) {
      return null;
    }
    const base = createNewSaveData();
    return {
      ...base,
      ...parsed,
      playerClass: parsed.playerClass ?? 'warrior',
      activeWeaponName: parsed.activeWeaponName ?? base.activeWeaponName,
      blessings: Array.isArray(parsed.blessings) ? parsed.blessings : [],
      petId: parsed.petId ?? null,
      shivaTandavaSeen: Boolean(parsed.shivaTandavaSeen),
      isGod: Boolean(parsed.isGod),
      forgeShards: typeof parsed.forgeShards === 'number' ? parsed.forgeShards : 2,
      forgedWeaponBonus: typeof parsed.forgedWeaponBonus === 'number' ? parsed.forgedWeaponBonus : 0,
      forgedWeaponsCount: typeof parsed.forgedWeaponsCount === 'number' ? parsed.forgedWeaponsCount : 0,
      flags: {
        ...base.flags,
        ...(parsed.flags ?? {}),
      },
    };
  } catch {
    return null;
  }
}

export function writeSaveData(data: SaveData): void {
  try {
    const payload: SaveData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function hasSavedGame(): boolean {
  return loadSaveData() !== null;
}

export function clearSaveData(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}
