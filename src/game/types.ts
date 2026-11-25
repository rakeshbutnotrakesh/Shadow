import * as THREE from 'three';
import { VedaMantra } from './mantras';

export type AreaId =
  | 'forest'
  | 'temple'
  | 'catacombs'
  | 'sanctum'
  | 'final_chamber';

export type GameScreen =
  | 'class_select'
  | 'menu'
  | 'playing'
  | 'paused'
  | 'inventory'
  | 'levelup'
  | 'pet_claim'
  | 'shiva_tandava'
  | 'god_ascension'
  | 'puzzle'
  | 'gameover'
  | 'victory';

export type ClassId = 'warrior' | 'blacksmith' | 'saint' | 'supporter' | 'archer';

export type DifficultyTier =
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Extreme Hard'
  | 'Hardest'
  | 'Ascended God';

export type PetId = 'nandi_vahana' | 'garuda_shavaka' | 'vayu_simha';

export type AbilityId =
  | 'divine_shield'
  | 'sacred_energy_attack'
  | 'ancient_vision'
  | 'shadow_detection'
  | 'health_regen'
  | 'movement_speed'
  | 'attack_damage'
  | 'divine_protection'
  | 'extended_flashlight'
  | 'energy_recovery';

export type ArtifactId =
  | 'rudraksha'
  | 'trishul_fragment'
  | 'ancient_yantra'
  | 'sacred_mantra'
  | 'divine_amulet';

export type EnemyType =
  | 'shadow_walker'
  | 'dark_spirit'
  | 'temple_guardian'
  | 'ancient_beast'
  | 'boss_kali';

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  description: string;
  maxRank: number;
  category: 'Active' | 'Passive' | 'Perception';
  effectPerRank: string;
}

export interface ArtifactDefinition {
  id: ArtifactId;
  name: string;
  sanskritSub: string;
  areaId: AreaId;
  lore: string;
  gameplayEffect: string;
  color: string;
}

export interface ConsumableInventory {
  pranaElixir: number;
  somaVial: number;
}

export interface WorldFlags {
  discoveredAreas: AreaId[];
  bellRung: boolean;
  mandalaSolved: boolean;
  purifiedMonoliths: string[];
  openedChests: string[];
  defeatedBosses: string[];
  loreRead: string[];
  clearedPortals: AreaId[];
}

export interface QuestObjective {
  id: string;
  label: string;
  completed: boolean;
  progress?: number;
  target?: number;
}

export interface QuestState {
  id: string;
  areaId: AreaId;
  title: string;
  description: string;
  xpReward: number;
  objectives: QuestObjective[];
  completed: boolean;
}

export interface SaveData {
  version: number;
  timestamp: number;
  areaId: AreaId;
  playerClass: ClassId;
  activeWeaponName: string;
  playerPosition: { x: number; y: number; z: number };
  playerYaw: number;
  level: number;
  xp: number;
  health: number;
  energy: number;
  abilities: Partial<Record<AbilityId, number>>;
  blessings: string[];
  petId: PetId | null;
  shivaTandavaSeen: boolean;
  isGod: boolean;
  artifacts: ArtifactId[];
  consumables: ConsumableInventory;
  flags: WorldFlags;
  completedQuestIds: string[];
  enemiesDefeated: number;
  forgeShards?: number;
  forgedWeaponBonus?: number;
  forgedWeaponsCount?: number;
}

export interface GameSettings {
  cameraDistance: number;
  mouseSensitivity: number;
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  showMobileControls: 'auto' | 'on' | 'off';
  shadowsEnabled: boolean;
  qualityMode: 'auto' | 'eco' | 'high';
}

export interface ColliderBox {
  type: 'box' | 'cylinder';
  x: number;
  y: number;
  z: number;
  halfW?: number;
  halfD?: number;
  radius?: number;
  height: number;
  blocksCamera?: boolean;
}

export interface InteractiveObject {
  id: string;
  kind:
    | 'artifact'
    | 'portal'
    | 'bell'
    | 'mandala_altar'
    | 'monolith'
    | 'chest'
    | 'lore'
    | 'shrine'
    | 'trial_shrine';
  label: string;
  promptText: string;
  position: THREE.Vector3;
  radius: number;
  mesh: THREE.Object3D;
  beaconMesh?: THREE.Object3D;
  artifactId?: ArtifactId;
  targetArea?: AreaId;
  locked?: boolean;
  lockReason?: string;
  consumed?: boolean;
  loreTitle?: string;
  loreText?: string;
}

export interface MapMarker {
  id: string;
  kind: InteractiveObject['kind'];
  label: string;
  x: number;
  z: number;
  locked: boolean;
}

export interface MapSnapshot {
  boundsRadius: number;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  enemies: Array<{ x: number; z: number; isBoss: boolean }>;
  markers: MapMarker[];
}

export interface HudSnapshot {
  screen: GameScreen;
  areaId: AreaId;
  areaName: string;
  areaSubtitle: string;
  playerClass: ClassId;
  activeWeaponName: string;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  level: number;
  xp: number;
  xpToNext: number;
  difficultyTier: DifficultyTier;
  isGod: boolean;
  petId: PetId | null;
  blessings: string[];
  blessingChoices: Array<{
    id: string;
    index: number;
    name: string;
    deity: string;
    deityRank: string;
    weaponName: string;
    weaponPower: number;
    description: string;
  }>;
  flashlightOn: boolean;
  shieldActive: boolean;
  shieldCooldown: number;
  energyAttackCooldown: number;
  heavyCooldown: number;
  spinCooldown: number;
  dashCooldown: number;
  comboStep: number;
  abilities: Partial<Record<AbilityId, number>>;
  artifacts: ArtifactId[];
  consumables: ConsumableInventory;
  activeQuest: QuestState | null;
  allQuests: QuestState[];
  interactPrompt: { label: string; promptText: string; locked?: boolean; lockReason?: string } | null;
  levelUpChoices: AbilityDefinition[];
  boss: {
    active: boolean;
    name: string;
    title: string;
    health: number;
    maxHealth: number;
    phase: 1 | 2 | 3;
  } | null;
  toast: { id: number; title: string; subtitle?: string; tone: 'gold' | 'crimson' | 'spirit' } | null;
  loreModal: { title: string; text: string } | null;
  activeVedaMantra: VedaMantra | null;
  detectedEnemyCount: number;
  pointerLocked: boolean;
  hasSave: boolean;
  enemiesDefeated: number;
  mandalaRings: [number, number, number];
  discoveredAreas: AreaId[];
  forgeShards: number;
  forgedWeaponBonus: number;
  forgedWeaponsCount: number;
  classSpecialCooldown: number;
  yaggaActive: boolean;
  map: MapSnapshot;
}

