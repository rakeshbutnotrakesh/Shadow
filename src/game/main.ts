import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AudioEngine } from './audio';
import {
  BLESSINGS_BY_ID,
  GodBlessing,
  pickOneEasyStarterBlessing,
  pickThreeRandomBlessings,
} from './blessings';
import { ThirdPersonCamera } from './camera';
import { FORGE_RECIPES, PLAYER_CLASSES } from './classes';
import { CombatSystem } from './combat';
import { EnemyEntity } from './enemy';
import { ARTIFACTS } from './inventory';
import { pickRandomVedaMantra, VedaMantra } from './mantras';
import { PetCompanion, PETS } from './pet';
import { PlayerController } from './player';
import {
  ComputedPlayerStats,
  computePlayerStats,
  getDifficultyTier,
  getXpToNext,
  MAX_LEVEL,
} from './progression';
import { buildAreaQuests } from './quests';
import { getRealm, TOTAL_AREAS } from './realms';
import {
  createNewSaveData,
  hasSavedGame,
  loadSaveData,
  loadSettings,
  writeSaveData,
  writeSettings,
} from './save';
import { createProceduralTextures, disposeTextures, ProceduralTextureSet } from './textures';
import {
  AbilityId,
  AreaId,
  ArtifactId,
  ClassId,
  ConsumableInventory,
  EnemyType,
  GameScreen,
  GameSettings,
  HudSnapshot,
  InteractiveObject,
  PetId,
  QuestState,
  SaveData,
  WorldFlags,
} from './types';
import { InputManager } from './ui';
import { CHEST_WEAPONS, rollRandomBoxWeapon } from './weapons';
import { BuiltArea, WorldBuilder } from './world';

const _fwd = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function detectEcoHardware(): boolean {
  try {
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
    const isTouchOrSmall =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
    return isTouchOrSmall || cores <= 4 || mem <= 4;
  } catch {
    return false;
  }
}

export class KalyugGameEngine {
  private container: HTMLElement;
  private onHudUpdate: (snapshot: HudSnapshot) => void;

  private isSoftwareGl: boolean;
  private ecoHardware: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private envTexture: THREE.Texture;
  private textures: ProceduralTextureSet;
  private worldBuilder: WorldBuilder;
  private audio = new AudioEngine();
  private camCtrl: ThirdPersonCamera;
  private player: PlayerController;
  private pet: PetCompanion;
  private combat: CombatSystem;
  public input: InputManager;

  private currentArea: BuiltArea | null = null;
  private enemies: EnemyEntity[] = [];
  private settings: GameSettings;

  // RPG / Game State (Choose Character 1st Priority, 1..100 Levels, Distinct Class Paths)
  private screen: GameScreen = 'class_select';
  private areaId: AreaId = 'forest';
  private playerClass: ClassId = 'warrior';
  private activeWeaponName: string = PLAYER_CLASSES.warrior.weaponName;
  private level = 1;
  private xp = 0;
  private abilities: Partial<Record<AbilityId, number>> = {};
  private blessings: string[] = [];
  private petId: PetId | null = null;
  private shivaTandavaSeen = false;
  private isGod = false;
  private artifacts: ArtifactId[] = [];
  private consumables: ConsumableInventory = { pranaElixir: 2, somaVial: 2 };
  private flags: WorldFlags = createNewSaveData().flags;
  private completedQuestIds: string[] = [];
  private enemiesDefeated = 0;
  private enemiesDefeatedInArea: Partial<Record<AreaId, number>> = {};
  private cachedQuests: QuestState[] = [];
  private questsDirty = true;

  private stats: ComputedPlayerStats;
  private blessingChoices: GodBlessing[] = [];
  private pendingLevelUps = 0;
  private pendingPetClaim = false;
  private pendingShivaTandava = false;
  private pendingGodAscension = false;

  private nearbyInteractive: InteractiveObject | null = null;
  private loreModal: { title: string; text: string } | null = null;
  private mandalaRings: [number, number, number] = [2, 1, 3];
  private toast: HudSnapshot['toast'] = null;
  private toastTimer = 0;
  private toastCounter = 0;
  private detectedEnemyCount = 0;
  private trialCooldown = 0;
  private classSpecialCooldown = 0;
  private forgeShards = 2;
  private forgedWeaponBonus = 0;
  private forgedWeaponsCount = 0;
  private collectedWeaponIds: string[] = [];
  private equippedChestWeaponId: string | null = null;
  private chestWeaponBonus = 0;
  private activeVedaMantra: VedaMantra | null = null;
  private vedaMantraTimer = 0;

  private timer = new THREE.Timer();
  private elapsedTime = 0;
  private hudEmitAccum = 0;
  private frameId = 0;
  private disposed = false;
  private detachInputs: (() => void) | null = null;
  private onToggleMap?: () => void;
  private hasSaveCached = hasSavedGame();
  private saveQueued = false;
  private saveFlushTimer = 0;
  private needsStaticRender = true;
  private lastEmittedScreen: GameScreen = 'class_select';

  constructor(
    container: HTMLElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onToggleMap?: () => void
  ) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.onToggleMap = onToggleMap;
    this.settings = loadSettings();
    this.isSoftwareGl = detectSoftwareWebGL();
    this.ecoHardware = detectEcoHardware();
    const isEco = this.isEcoMode();
    const effectiveShadows = !this.isSoftwareGl && !isEco && this.settings.shadowsEnabled;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && !isEco,
      powerPreference: isEco ? 'low-power' : 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      isEco ? Math.min(window.devicePixelRatio, 1.15) : Math.min(window.devicePixelRatio, 1.5)
    );
    this.renderer.shadowMap.enabled = effectiveShadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    this.textures = createProceduralTextures(this.renderer, isEco);
    this.worldBuilder = new WorldBuilder(
      this.scene,
      this.textures,
      effectiveShadows,
      isEco
    );

    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camCtrl = new ThirdPersonCamera(aspect);
    this.camCtrl.targetDistance = this.settings.cameraDistance;
    this.camCtrl.distance = this.settings.cameraDistance;

    this.player = new PlayerController(this.scene);
    this.pet = new PetCompanion(this.scene);
    this.combat = new CombatSystem(this.scene);
    this.stats = this.recomputeStats();

    this.input = new InputManager(() => this.screen === 'playing');
    this.detachInputs = this.input.attach(this.renderer.domElement);

    this.audio.setVolumes(
      this.settings.masterVolume,
      this.settings.sfxVolume,
      this.settings.ambienceVolume
    );

    this.loadArea('forest', false);

    this.audio.setOnUnlocked(() => {
      this.audio.startMusic();
    });
    this.audio.init();
    this.audio.setMusicContext('menu');
    this.audio.startMusic();

    if (!this.isSoftwareGl) {
      this.combat.prepareWarmUp();
      this.renderer.compile(this.scene, this.camCtrl.camera);
      this.combat.finishWarmUp();
    }

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);

    this.timer.connect(document);
    this.emitHud();
    this.startLoop();
  }

  private recomputeStats(): ComputedPlayerStats {
    this.stats = computePlayerStats(
      this.level,
      this.abilities,
      this.artifacts,
      this.blessings,
      this.petId,
      this.shivaTandavaSeen,
      this.isGod,
      this.playerClass,
      this.forgedWeaponBonus,
      this.chestWeaponBonus
    );
    return this.stats;
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
  };

  private handleResize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camCtrl.setAspect(w / h);
    this.renderer.setSize(w, h);
    this.needsStaticRender = true;
  };

  // =========================================================================
  // PUBLIC ACTIONS
  // =========================================================================

  private isEcoMode(): boolean {
    return (
      this.isSoftwareGl ||
      this.settings.qualityMode === 'eco' ||
      (this.settings.qualityMode === 'auto' && this.ecoHardware)
    );
  }

  public isAudioRunning(): boolean {
    return this.audio.isRunning();
  }

  public replayVedaMantra(): void {
    if (!this.activeVedaMantra) return;
    this.audio.playVedaMantraChant(this.activeVedaMantra.swaraHz);
  }

  public forgeBlacksmithWeapon(recipeId: string): void {
    if (this.playerClass !== 'blacksmith') return;
    const recipe = FORGE_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    if (this.forgeShards < recipe.shardCost) {
      this.showToast(
        'Need More Forge Shards',
        `${recipe.name} requires ${recipe.shardCost} Shards (have ${this.forgeShards})`,
        'crimson'
      );
      this.emitHud();
      return;
    }

    this.forgeShards -= recipe.shardCost;
    this.forgedWeaponsCount += 1;
    this.forgedWeaponBonus += recipe.powerGain;
    this.activeWeaponName = `${recipe.name} (+${this.forgedWeaponBonus + this.chestWeaponBonus})`;
    this.recomputeStats();
    this.audio.playAnvilForge();
    this.combat.spawnBurst(
      this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
      0xf97316,
      24
    );
    this.showToast(
      `Forged: ${recipe.name}`,
      `+${recipe.powerGain} Weapon Power (Total Forged Bonus +${this.forgedWeaponBonus})`,
      'gold'
    );
    this.grantXp(45);
    this.saveProgress();
    this.emitHud();
  }

  public equipChestWeapon(weaponId: string): void {
    if (!this.collectedWeaponIds.includes(weaponId)) return;
    const wpn = CHEST_WEAPONS.find((w) => w.id === weaponId);
    if (!wpn) return;
    this.equippedChestWeaponId = wpn.id;
    this.chestWeaponBonus = wpn.powerBonus;
    this.activeWeaponName = `${wpn.name} (+${wpn.powerBonus})`;
    this.player.setWeaponAccent(wpn.accentHex);
    this.recomputeStats();
    this.audio.playAnvilForge();
    this.showToast(
      `Equipped: ${wpn.name}`,
      `${wpn.rarity} Box Weapon · +${wpn.powerBonus} Attack Power`,
      'gold'
    );
    this.saveProgress();
    this.emitHud();
  }

  public performSaintYagga(): void {
    if (this.screen !== 'playing' || this.playerClass !== 'saint') return;
    if (this.classSpecialCooldown > 0) {
      this.showToast('Ritual Resting', `Ready in ${this.classSpecialCooldown.toFixed(1)}s`, 'spirit');
      return;
    }
    if (this.player.energy < 20) {
      this.showToast('Low Energy', 'Need 20 Energy to ignite Yagga', 'crimson');
      return;
    }
    this.player.energy -= 20;
    this.classSpecialCooldown = 7.5 * this.stats.abilityCooldownMultiplier;
    const pulseDmg = (26 + this.stats.weaponFlatBonus * 0.5) * this.stats.damageMultiplier;
    this.combat.spawnYaggaKund(this.player.position, pulseDmg);
    this.audio.playYaggaIgnition();
    this.showToast('Sacred Yagga Ignited', 'Agni Kund burns nearby shadows for 8.5s', 'gold');
    this.grantXp(25);
    this.emitHud();
  }

  public performSaintMantra(): void {
    if (this.screen !== 'playing' || this.playerClass !== 'saint') return;
    if (this.classSpecialCooldown > 0) {
      this.showToast('Mantra Cooldown', `Ready in ${this.classSpecialCooldown.toFixed(1)}s`, 'spirit');
      return;
    }
    this.classSpecialCooldown = 5.5 * this.stats.abilityCooldownMultiplier;
    this.activeVedaMantra = pickRandomVedaMantra(this.activeVedaMantra?.id);
    this.vedaMantraTimer = 6.5;
    this.audio.playVedaMantraChant(this.activeVedaMantra.swaraHz);

    const dmg = (42 + this.stats.weaponFlatBonus * 0.7) * this.stats.damageMultiplier;
    const hits = this.combat.performRadialDamage(
      this.player.position,
      7.2,
      dmg,
      8.0,
      0xfbbf24,
      this.enemies,
      this.audio,
      this.handleEnemyKilled
    );
    this.player.energy = Math.min(this.stats.maxEnergy, this.player.energy + 40);
    this.combat.spawnBurst(
      this.player.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
      0xfde047,
      20
    );
    this.showToast(
      `Mantra Chanted: ${this.activeVedaMantra.veda}`,
      `+40 Energy · Purifying Wave hit ${hits} foe${hits === 1 ? '' : 's'}`,
      'gold'
    );
    this.emitHud();
  }

  public performSaintPuja(): void {
    if (this.screen !== 'playing' || this.playerClass !== 'saint') return;
    if (this.classSpecialCooldown > 0) {
      this.showToast('Puja Cooldown', `Ready in ${this.classSpecialCooldown.toFixed(1)}s`, 'spirit');
      return;
    }
    if (this.player.energy < 15) {
      this.showToast('Low Energy', 'Need 15 Energy to perform Puja', 'crimson');
      return;
    }
    this.player.energy -= 15;
    this.classSpecialCooldown = 8.0 * this.stats.abilityCooldownMultiplier;
    const heal = Math.max(35, Math.round(this.stats.maxHealth * 0.35));
    this.player.health = Math.min(this.stats.maxHealth, this.player.health + heal);
    this.player.shieldTimer = Math.max(this.player.shieldTimer, 4.5);
    this.audio.playBell();
    this.combat.spawnBurst(
      this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
      0x38bdf8,
      20
    );
    this.showToast('Sacred Puja Complete', `+${heal} Health · +4.5s Divine Protection`, 'spirit');
    this.grantXp(25);
    this.emitHud();
  }

  public performClassAction(): void {
    if (this.screen !== 'playing') return;

    if (this.playerClass === 'saint') {
      this.performSaintYagga();
      return;
    }

    if (this.classSpecialCooldown > 0) {
      this.showToast('Ability Resting', `Ready in ${this.classSpecialCooldown.toFixed(1)}s`, 'spirit');
      return;
    }

    if (this.playerClass === 'blacksmith') {
      // Craft highest affordable weapon recipe; if 0 shards, temper-strike enemies to extract 1 Shard!
      const affordable = [...FORGE_RECIPES].reverse().find((r) => this.forgeShards >= r.shardCost);
      if (affordable) {
        this.classSpecialCooldown = 3.0;
        this.forgeBlacksmithWeapon(affordable.id);
        return;
      }
      this.classSpecialCooldown = 5.0;
      this.audio.playAnvilForge();
      const dmg = (36 + this.stats.weaponFlatBonus * 0.7) * this.stats.damageMultiplier;
      this.combat.performRadialDamage(
        this.player.position,
        4.5,
        dmg,
        11.0,
        0xf97316,
        this.enemies,
        this.audio,
        this.handleEnemyKilled
      );
      this.forgeShards += 1;
      this.showToast('Anvil Temper Strike', 'Extracted +1 Forge Shard! Ready to craft weapon.', 'gold');
      this.emitHud();
      return;
    }

    if (this.playerClass === 'warrior') {
      if (this.player.energy < 20) {
        this.showToast('Low Energy', 'Need 20 Energy for War Cleave', 'crimson');
        return;
      }
      this.player.energy -= 20;
      this.classSpecialCooldown = 4.5 * this.stats.abilityCooldownMultiplier;
      const dmg = (48 + this.stats.weaponFlatBonus * 1.15) * this.stats.damageMultiplier;
      const hits = this.combat.performRadialDamage(
        this.player.position,
        5.5,
        dmg,
        11.0,
        0xef4444,
        this.enemies,
        this.audio,
        this.handleEnemyKilled
      );
      this.camCtrl.triggerShake(0.24);
      this.combat.spawnBurst(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xfbbf24, 18);
      this.showToast('Kshatriya War Cleave!', `Struck ${hits} corrupted foe${hits === 1 ? '' : 's'}`, 'gold');
      this.emitHud();
      return;
    }

    if (this.playerClass === 'archer') {
      if (this.player.energy < 20) {
        this.showToast('Low Energy', 'Need 20 Energy for Arrow Volley', 'crimson');
        return;
      }
      this.player.energy -= 20;
      this.classSpecialCooldown = 4.2 * this.stats.abilityCooldownMultiplier;
      this.player.yaw = this.camCtrl.yaw;
      this.player.getForwardDirection(_fwd);
      const dmg = (28 + this.stats.weaponFlatBonus) * this.stats.damageMultiplier;
      this.combat.spawnPlayerArrowVolley(this.player.position, _fwd, dmg, this.audio);
      this.showToast('Kodanda Arrow Volley!', '5 Sacred Arrows loosed', 'gold');
      this.emitHud();
      return;
    }

    if (this.playerClass === 'supporter') {
      if (this.player.energy < 18) {
        this.showToast('Low Energy', 'Need 18 Energy for Prana Pulse', 'crimson');
        return;
      }
      this.player.energy -= 18;
      this.classSpecialCooldown = 6.5 * this.stats.abilityCooldownMultiplier;
      const heal = Math.round(this.stats.maxHealth * 0.4);
      this.player.health = Math.min(this.stats.maxHealth, this.player.health + heal);
      this.player.shieldTimer = Math.max(this.player.shieldTimer, 4.0);
      this.audio.playShieldActivate();
      this.combat.spawnBurst(this.player.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x38bdf8, 22);
      this.showToast('Prana Sanctuary Pulse', `+${heal} Health & +4s Kavach Shield`, 'spirit');
      this.emitHud();
    }
  }

  public openClassSelect(): void {
    this.audio.init();
    this.audio.startMusic();
    this.input.releasePointerLock();
    this.input.clearKeys();
    this.screen = 'class_select';
    this.emitHud();
  }

  public startNewGame(chosenClass: ClassId = 'warrior'): void {
    this.audio.init();
    this.audio.startMusic();
    const fresh = createNewSaveData();
    const cls = PLAYER_CLASSES[chosenClass] ?? PLAYER_CLASSES.warrior;
    // Level 1 begins with an Easy God or Rishi Blessing + their Sacred Weapon
    const starterBlessing = pickOneEasyStarterBlessing();
    fresh.playerClass = chosenClass;
    fresh.blessings = [starterBlessing.id];
    fresh.activeWeaponName = `${cls.weaponName} · ${starterBlessing.weaponName}`;
    this.applySaveData(fresh);
    this.audio.setMusicContext(this.areaId);
    this.screen = 'playing';
    this.showToast(
      `Lv 1 ${starterBlessing.deity}: ${starterBlessing.weaponName}`,
      `${cls.name} · ${starterBlessing.name}`,
      'gold'
    );
    this.saveProgress();
    this.emitHud();
  }

  public continueGame(): void {
    this.audio.init();
    this.audio.startMusic();
    const saved = loadSaveData();
    if (!saved) {
      this.startNewGame();
      return;
    }
    this.applySaveData(saved);
    this.audio.setMusicContext(this.areaId);
    this.screen = 'playing';
    this.showToast(
      'Journey Resumed',
      `Level ${this.level} (${getDifficultyTier(this.level, this.isGod)})`,
      'gold'
    );
    this.emitHud();
  }

  private applySaveData(data: SaveData): void {
    this.areaId = data.areaId;
    this.playerClass = data.playerClass ?? 'warrior';
    this.level = data.level;
    this.xp = data.xp;
    this.abilities = { ...data.abilities };
    this.blessings = [...(data.blessings ?? [])];
    if (this.blessings.length === 0) {
      this.blessings.push(pickOneEasyStarterBlessing().id);
    }
    const cls = PLAYER_CLASSES[this.playerClass] ?? PLAYER_CLASSES.warrior;
    this.activeWeaponName = data.activeWeaponName || cls.weaponName;
    this.petId = data.petId ?? null;
    this.shivaTandavaSeen = Boolean(data.shivaTandavaSeen);
    this.isGod = Boolean(data.isGod || this.level >= 100);
    this.artifacts = [...data.artifacts];
    this.consumables = { ...data.consumables };
    this.flags = {
      discoveredAreas: [...data.flags.discoveredAreas],
      bellRung: data.flags.bellRung,
      mandalaSolved: data.flags.mandalaSolved,
      purifiedMonoliths: [...data.flags.purifiedMonoliths],
      openedChests: [...data.flags.openedChests],
      defeatedBosses: [...data.flags.defeatedBosses],
      loreRead: [...data.flags.loreRead],
      clearedPortals: [...data.flags.clearedPortals],
    };
    this.completedQuestIds = [...data.completedQuestIds];
    this.enemiesDefeated = data.enemiesDefeated ?? 0;
    this.enemiesDefeatedInArea = { ...(data.enemiesDefeatedInArea ?? {}) };
    this.questsDirty = true;
    this.forgeShards = data.forgeShards ?? 2;
    this.forgedWeaponBonus = data.forgedWeaponBonus ?? 0;
    this.forgedWeaponsCount = data.forgedWeaponsCount ?? 0;
    this.collectedWeaponIds = [...(data.collectedWeaponIds ?? [])];
    this.equippedChestWeaponId = data.equippedChestWeaponId ?? null;
    this.chestWeaponBonus = data.chestWeaponBonus ?? 0;
    this.classSpecialCooldown = 0;

    this.syncMilestoneAbilities();
    this.recomputeStats();
    this.loadArea(
      data.areaId,
      true,
      new THREE.Vector3(data.playerPosition.x, data.playerPosition.y, data.playerPosition.z),
      data.playerYaw
    );

    this.player.setClassAppearance(this.playerClass);
    if (this.equippedChestWeaponId) {
      const wpn = CHEST_WEAPONS.find((w) => w.id === this.equippedChestWeaponId);
      if (wpn) this.player.setWeaponAccent(wpn.accentHex);
    }
    this.player.setGodMode(this.isGod);
    this.pet.setPet(this.petId, this.player.position);
    this.player.health = Math.min(this.stats.maxHealth, Math.max(15, data.health));
    this.player.energy = Math.min(this.stats.maxEnergy, data.energy);

    this.pendingLevelUps = 0;
    this.blessingChoices = [];
    this.pendingPetClaim = false;
    this.pendingShivaTandava = false;
    this.pendingGodAscension = false;
    this.loreModal = null;
  }

  private syncMilestoneAbilities(): void {
    // Automatically unlock/rank core abilities along the 100-level journey
    if (this.level >= 2) this.abilities.sacred_energy_attack = Math.min(5, Math.max(this.abilities.sacred_energy_attack ?? 0, 1 + Math.floor(this.level / 20)));
    if (this.level >= 3) this.abilities.divine_shield = Math.min(5, Math.max(this.abilities.divine_shield ?? 0, 1 + Math.floor(this.level / 22)));
    if (this.level >= 5) this.abilities.ancient_vision = Math.min(3, Math.max(this.abilities.ancient_vision ?? 0, 1 + Math.floor(this.level / 35)));
    if (this.level >= 8) this.abilities.shadow_detection = Math.min(3, Math.max(this.abilities.shadow_detection ?? 0, 1 + Math.floor(this.level / 35)));
    if (this.level >= 10) this.abilities.extended_flashlight = Math.min(5, Math.max(this.abilities.extended_flashlight ?? 0, 1 + Math.floor(this.level / 20)));
  }

  public saveProgress(): void {
    const payload: SaveData = {
      version: 3,
      timestamp: Date.now(),
      areaId: this.areaId,
      playerClass: this.playerClass,
      activeWeaponName: this.activeWeaponName,
      playerPosition: {
        x: Number(this.player.position.x.toFixed(2)),
        y: Number(this.player.position.y.toFixed(2)),
        z: Number(this.player.position.z.toFixed(2)),
      },
      playerYaw: Number(this.player.yaw.toFixed(2)),
      level: this.level,
      xp: this.xp,
      health: Math.round(this.player.health),
      energy: Math.round(this.player.energy),
      abilities: { ...this.abilities },
      blessings: [...this.blessings],
      petId: this.petId,
      shivaTandavaSeen: this.shivaTandavaSeen,
      isGod: this.isGod,
      artifacts: [...this.artifacts],
      consumables: { ...this.consumables },
      flags: {
        ...this.flags,
        discoveredAreas: [...this.flags.discoveredAreas],
        purifiedMonoliths: [...this.flags.purifiedMonoliths],
        openedChests: [...this.flags.openedChests],
        defeatedBosses: [...this.flags.defeatedBosses],
        loreRead: [...this.flags.loreRead],
        clearedPortals: [...this.flags.clearedPortals],
      },
      completedQuestIds: [...this.completedQuestIds],
      enemiesDefeated: this.enemiesDefeated,
      enemiesDefeatedInArea: { ...this.enemiesDefeatedInArea },
      forgeShards: this.forgeShards,
      forgedWeaponBonus: this.forgedWeaponBonus,
      forgedWeaponsCount: this.forgedWeaponsCount,
      collectedWeaponIds: [...this.collectedWeaponIds],
      equippedChestWeaponId: this.equippedChestWeaponId,
      chestWeaponBonus: this.chestWeaponBonus,
    };
    writeSaveData(payload);
    this.hasSaveCached = true;
    this.saveQueued = false;
    this.saveFlushTimer = 0;
  }

  private queueSave(): void {
    this.saveQueued = true;
    if (this.saveFlushTimer <= 0) {
      this.saveFlushTimer = 1.2;
    }
  }

  public manualSave(): void {
    this.saveProgress();
    this.showToast('Progress Saved', 'Saved safely to LocalStorage', 'spirit');
    this.emitHud();
  }

  public setScreen(next: GameScreen): void {
    if (next !== 'playing') {
      this.input.releasePointerLock();
      this.input.clearKeys();
      if (this.saveQueued) {
        this.saveProgress();
      }
      this.needsStaticRender = true;
    }
    this.screen = next;
    this.emitHud();
  }

  public returnToMenu(): void {
    this.saveProgress();
    this.input.releasePointerLock();
    this.input.clearKeys();
    this.audio.setMusicContext('menu');
    this.screen = 'menu';
    this.emitHud();
  }

  public selectGodBlessing(blessingId: string): void {
    if (this.screen !== 'levelup') return;
    if (!this.blessings.includes(blessingId)) {
      this.blessings.push(blessingId);
    }
    const def = BLESSINGS_BY_ID[blessingId];
    if (def && !this.equippedChestWeaponId && this.forgedWeaponsCount === 0) {
      this.activeWeaponName = def.weaponName;
    }
    this.recomputeStats();
    this.player.health = this.stats.maxHealth;
    this.player.energy = this.stats.maxEnergy;

    if (def) {
      this.showToast(
        `${def.deity}: ${def.weaponName}`,
        `${def.name} (+${def.weaponPower} Weapon Power)`,
        'gold'
      );
    }

    this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1);
    if (this.pendingLevelUps > 0) {
      const targetLvl = Math.min(MAX_LEVEL, this.level - (this.pendingLevelUps - 1));
      this.blessingChoices = pickThreeRandomBlessings(this.blessings, targetLvl);
      this.emitHud();
      return;
    }

    this.blessingChoices = [];
    this.advanceMilestoneModals();
  }

  private advanceMilestoneModals(): void {
    if (this.pendingPetClaim && !this.petId) {
      this.pendingPetClaim = false;
      this.screen = 'pet_claim';
      this.emitHud();
      return;
    }
    if (this.pendingShivaTandava && !this.shivaTandavaSeen) {
      this.pendingShivaTandava = false;
      this.shivaTandavaSeen = true;
      this.audio.playTandavaDamaru();
      this.recomputeStats();
      this.screen = 'shiva_tandava';
      this.saveProgress();
      this.emitHud();
      return;
    }
    if (this.pendingGodAscension && !this.isGod) {
      this.pendingGodAscension = false;
      this.isGod = true;
      this.player.setGodMode(true);
      this.audio.playGodAscension();
      this.recomputeStats();
      this.player.health = this.stats.maxHealth;
      this.player.energy = this.stats.maxEnergy;
      this.screen = 'god_ascension';
      this.saveProgress();
      this.emitHud();
      return;
    }

    this.screen = 'playing';
    this.saveProgress();
    this.emitHud();
  }

  public claimPet(petId: PetId): void {
    if (this.screen !== 'pet_claim') return;
    this.petId = petId;
    this.pet.setPet(petId, this.player.position);
    this.audio.playArtifactPickup();
    this.recomputeStats();
    this.showToast(
      `Companion Joined: ${PETS[petId].name}`,
      PETS[petId].bonusText,
      'gold'
    );
    this.advanceMilestoneModals();
  }

  public closeShivaTandava(): void {
    this.advanceMilestoneModals();
  }

  public replayTandavaAudio(): void {
    this.audio.playTandavaDamaru();
  }

  public closeGodAscension(): void {
    this.screen = 'playing';
    this.saveProgress();
    this.emitHud();
  }

  public invokeShadowTrialWave(): void {
    if (this.screen !== 'playing' || !this.currentArea) return;
    if (this.trialCooldown > 0) {
      this.showToast('Trial Cooldown', `Wait ${this.trialCooldown.toFixed(1)}s to summon next wave`, 'spirit');
      return;
    }
    this.trialCooldown = 4.0;
    const activeNonBoss = this.enemies.filter((e) => e.alive && e.type !== 'boss_kali').length;
    if (activeNonBoss >= 10) {
      this.showToast('Wave Active', 'Defeat existing shadow threats first', 'crimson');
      return;
    }

    const types: EnemyType[] =
      this.level < 15
        ? ['shadow_walker', 'dark_spirit', 'shadow_walker']
        : this.level < 50
        ? ['shadow_walker', 'dark_spirit', 'temple_guardian', 'ancient_beast']
        : ['temple_guardian', 'ancient_beast', 'dark_spirit', 'temple_guardian'];

    const count = 4;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const r = Math.min(this.currentArea.boundsRadius - 3, 9 + Math.random() * 4);
      const sx = THREE.MathUtils.clamp(
        this.player.position.x + Math.cos(ang) * r,
        -this.currentArea.boundsRadius + 2,
        this.currentArea.boundsRadius - 2
      );
      const sz = THREE.MathUtils.clamp(
        this.player.position.z + Math.sin(ang) * r,
        -this.currentArea.boundsRadius + 2,
        this.currentArea.boundsRadius - 2
      );
      const sy = this.currentArea.groundHeightAt(sx, sz);
      this.enemies.push(
        new EnemyEntity(
          {
            id: `trial_${Date.now()}_${i}`,
            type: types[i % types.length],
            position: new THREE.Vector3(sx, sy, sz),
            level: this.level,
          },
          this.scene
        )
      );
    }

    this.audio.playBossRoar();
    this.showToast(
      `Shadow Trial Summoned (${getDifficultyTier(this.level, this.isGod)})`,
      `${count} enemies scaled to Level ${this.level}`,
      'crimson'
    );
    this.emitHud();
  }

  public rotateMandalaRing(ringIndex: 0 | 1 | 2): void {
    if (this.screen !== 'puzzle') return;
    this.mandalaRings[ringIndex] = (this.mandalaRings[ringIndex] + 1) % 4;
    this.audio.playHit(false);
    if (this.mandalaRings[0] === 0 && this.mandalaRings[1] === 0 && this.mandalaRings[2] === 0) {
      this.flags.mandalaSolved = true;
      this.audio.playArtifactPickup();
      this.screen = 'playing';
      if (this.currentArea) {
        for (const it of this.currentArea.interactives) {
          if (it.id === 'mandala_altar') {
            it.consumed = true;
            it.promptText = 'Mandala Aligned';
          }
          if (it.id === 'artifact_trishul_fragment') {
            it.locked = false;
          }
        }
      }
      this.showToast('Mandala Aligned!', 'The Trishul Fragment seal is broken', 'gold');
      this.grantXp(160);
      this.saveProgress();
    }
    this.emitHud();
  }

  public closeLoreModal(): void {
    this.loreModal = null;
    this.emitHud();
  }

  public useConsumable(kind: 'prana' | 'soma'): void {
    if (kind === 'prana') {
      if (this.consumables.pranaElixir <= 0 || this.player.health >= this.stats.maxHealth) return;
      this.consumables.pranaElixir -= 1;
      const healAmount = Math.max(45, Math.round(this.stats.maxHealth * 0.35));
      this.player.health = Math.min(this.stats.maxHealth, this.player.health + healAmount);
      this.audio.playShieldActivate();
      this.combat.spawnBurst(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x22c55e, 14);
      this.showToast('Prana Elixir Consumed', `+${healAmount} Health restored`, 'spirit');
    } else {
      if (this.consumables.somaVial <= 0 || this.player.energy >= this.stats.maxEnergy) return;
      this.consumables.somaVial -= 1;
      const enAmount = Math.max(55, Math.round(this.stats.maxEnergy * 0.45));
      this.player.energy = Math.min(this.stats.maxEnergy, this.player.energy + enAmount);
      this.audio.playSacredWave();
      this.combat.spawnBurst(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x38bdf8, 14);
      this.showToast('Soma Vial Consumed', `+${enAmount} Energy restored`, 'spirit');
    }
    this.emitHud();
  }

  public travelToDiscoveredArea(target: AreaId): void {
    if (!this.flags.discoveredAreas.includes(target)) return;
    this.audio.playPortal();
    this.loadArea(target, true);
    this.screen = 'playing';
    this.saveProgress();
    this.emitHud();
  }

  public updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
    writeSettings(this.settings);
    this.camCtrl.targetDistance = this.settings.cameraDistance;
    this.audio.setVolumes(
      this.settings.masterVolume,
      this.settings.sfxVolume,
      this.settings.ambienceVolume
    );
    const isEco = this.isEcoMode();
    const effectiveShadows = !this.isSoftwareGl && !isEco && this.settings.shadowsEnabled;
    this.renderer.setPixelRatio(isEco ? 1 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = effectiveShadows;
    this.worldBuilder.setLowSpec(isEco, effectiveShadows);
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  // =========================================================================
  // AREA LOADING & DISPOSAL
  // =========================================================================

  private loadArea(
    areaId: AreaId,
    setPlayerPos: boolean,
    customPos?: THREE.Vector3,
    customYaw?: number
  ): void {
    this.combat.clear();
    for (const e of this.enemies) {
      e.dispose(this.scene);
    }
    this.enemies = [];
    if (this.currentArea) {
      this.currentArea.dispose();
      this.currentArea = null;
    }

    this.areaId = areaId;
    if (!this.flags.discoveredAreas.includes(areaId)) {
      this.flags.discoveredAreas.push(areaId);
      this.grantXp(75);
    }
    this.questsDirty = true;

    const realmDef = getRealm(areaId);
    const built = this.worldBuilder.buildArea(
      areaId,
      this.flags,
      this.artifacts,
      this.enemiesDefeatedInArea[areaId] ?? 0
    );
    this.currentArea = built;

    const spawnLevel = Math.max(
      this.level,
      Math.min(this.level + 8, realmDef.recommendedLevel)
    );
    for (const spawn of built.enemySpawns) {
      this.enemies.push(new EnemyEntity({ ...spawn, level: spawnLevel }, this.scene));
    }

    const pos = customPos ?? built.defaultSpawn;
    const yaw = customYaw ?? built.defaultYaw;
    if (setPlayerPos) {
      this.player.resetForArea(pos, yaw);
      this.camCtrl.snapToPlayer(pos, yaw);
      this.pet.setPet(this.petId, pos);
    } else {
      this.player.resetForArea(built.defaultSpawn, built.defaultYaw);
      this.camCtrl.snapToPlayer(built.defaultSpawn, built.defaultYaw);
    }

    this.audio.setAreaAmbience(areaId);
    if (this.screen !== 'menu' && this.screen !== 'class_select') {
      this.audio.setMusicContext(areaId);
    }
  }

  // =========================================================================
  // GAMEPLAY SYSTEMS
  // =========================================================================

  private grantXp(amount: number): void {
    if (this.level >= MAX_LEVEL) return;
    this.xp += amount;
    let threshold = getXpToNext(this.level);
    let leveled = false;

    while (this.level < MAX_LEVEL && this.xp >= threshold) {
      this.xp -= threshold;
      this.level += 1;
      this.pendingLevelUps += 1;
      leveled = true;

      if (this.level >= 50 && !this.petId) {
        this.pendingPetClaim = true;
      }
      if (this.level >= 90 && !this.shivaTandavaSeen) {
        this.pendingShivaTandava = true;
      }
      if (this.level >= 100 && !this.isGod) {
        this.pendingGodAscension = true;
      }

      threshold = getXpToNext(this.level);
    }

    if (leveled) {
      this.audio.playLevelUp();
      this.activeVedaMantra = pickRandomVedaMantra(this.activeVedaMantra?.id);
      this.vedaMantraTimer = 7.5;
      this.audio.playVedaMantraChant(this.activeVedaMantra.swaraHz);
      this.syncMilestoneAbilities();
      this.recomputeStats();
      this.player.health = this.stats.maxHealth;
      this.player.energy = this.stats.maxEnergy;
      const firstChoiceLevel = Math.min(MAX_LEVEL, this.level - (this.pendingLevelUps - 1));
      this.blessingChoices = pickThreeRandomBlessings(this.blessings, firstChoiceLevel);
      this.input.releasePointerLock();
      this.input.clearKeys();
      this.screen = 'levelup';
      this.needsStaticRender = true;
      this.queueSave();
      this.emitHud();
    }
  }

  private getQuests(): QuestState[] {
    if (this.questsDirty || this.cachedQuests.length === 0) {
      this.cachedQuests = buildAreaQuests(
        this.flags,
        this.artifacts,
        this.enemiesDefeatedInArea,
        this.completedQuestIds
      );
      this.questsDirty = false;
    }
    return this.cachedQuests;
  }

  private checkQuestCompletions(): void {
    this.questsDirty = true;
    const quests = this.getQuests();
    let anyCompleted = false;
    for (const q of quests) {
      if (q.completed && !this.completedQuestIds.includes(q.id)) {
        this.completedQuestIds.push(q.id);
        this.showToast(`Quest Completed: ${q.title}`, `+${q.xpReward} XP`, 'gold');
        this.grantXp(q.xpReward);
        anyCompleted = true;
      }
    }
    if (anyCompleted) {
      this.questsDirty = true;
      this.queueSave();
    }
  }

  private handleEnemyKilled = (enemy: EnemyEntity): void => {
    this.enemiesDefeated += 1;
    const areaKills = (this.enemiesDefeatedInArea[this.areaId] ?? 0) + 1;
    this.enemiesDefeatedInArea[this.areaId] = areaKills;
    this.questsDirty = true;
    this.grantXp(enemy.xpReward);

    if (enemy.isWarden && !this.flags.defeatedBosses.includes(enemy.id)) {
      this.flags.defeatedBosses.push(enemy.id);
      this.forgeShards += 2;
    }

    // Unseal kill-gated (and milestone Warden-gated) portals across Realms 4..98
    const realmDef = getRealm(this.areaId);
    const wardenKey = `warden_${this.areaId}`;
    const isWardenArea = realmDef.index > 0 && realmDef.index % 10 === 0 && realmDef.index < 99;
    const wardenCleared = !isWardenArea || this.flags.defeatedBosses.includes(wardenKey);
    let unsealedPortalLabel = '';

    if (realmDef.requiredKills > 0 && this.currentArea) {
      for (const it of this.currentArea.interactives) {
        if (it.kind === 'portal' && it.locked) {
          if (areaKills >= realmDef.requiredKills && wardenCleared) {
            it.locked = false;
            it.lockReason = '';
            const mat = (it.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.color.setHex(0xd4a34a);
            mat.opacity = 0.75;
            unsealedPortalLabel = it.label;
          } else if (isWardenArea && !wardenCleared) {
            it.lockReason = `Vanquish the Realm Warden & ${realmDef.requiredKills} Shadows (${Math.min(realmDef.requiredKills, areaKills)}/${realmDef.requiredKills})`;
          } else {
            it.lockReason = `Banish ${realmDef.requiredKills} Shadows in this realm (${areaKills}/${realmDef.requiredKills})`;
          }
        }
      }
    }

    if (enemy.isWarden) {
      this.showToast(
        `${enemy.wardenTitle ?? 'Realm Warden'} Vanquished!`,
        unsealedPortalLabel
          ? `+2 Forge Shards · ${unsealedPortalLabel} Unsealed!`
          : '+2 Bonus Forge Shards · Milestone Trophy Claimed',
        'gold'
      );
    } else if (unsealedPortalLabel) {
      this.showToast('Portal Unsealed!', `Proceed to ${unsealedPortalLabel} [E]`, 'gold');
    }

    if (this.playerClass === 'blacksmith' || Math.random() < 0.45) {
      this.forgeShards += 1;
    }

    if (Math.random() < 0.38) {
      if (Math.random() < 0.55) {
        this.consumables.pranaElixir += 1;
        this.showToast('Found Prana Elixir', '+1 Healing Elixir', 'spirit');
      } else {
        this.consumables.somaVial += 1;
        this.showToast('Found Soma Vial', '+1 Energy Vial', 'spirit');
      }
    }

    if (enemy.type === 'boss_kali') {
      if (!this.flags.defeatedBosses.includes('boss_kali')) {
        this.flags.defeatedBosses.push('boss_kali');
      }
      this.audio.playGodAscension();
      this.checkQuestCompletions();
      this.saveProgress();
      setTimeout(() => {
        if (!this.disposed) {
          this.input.releasePointerLock();
          this.screen = 'victory';
          this.needsStaticRender = true;
          this.emitHud();
        }
      }, 1200);
      return;
    }

    this.checkQuestCompletions();
    this.queueSave();
  };

  private handlePlayerDamaged = (rawDamage: number): void => {
    if (this.screen !== 'playing' || this.player.health <= 0) return;

    let dmg = rawDamage * (1 - this.stats.damageReduction);
    if (this.player.shieldTimer > 0) {
      dmg *= 1 - this.stats.shieldAbsorption;
      this.combat.spawnBurst(this.player.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xfbbf24, 10);
    }

    this.player.health = Math.max(0, this.player.health - Math.max(1, Math.round(dmg)));
    this.player.hurtFlashTimer = 0.25;
    this.camCtrl.triggerShake(0.28);
    this.audio.playPlayerHurt();

    if (this.player.health <= 0) {
      this.input.releasePointerLock();
      this.input.clearKeys();
      this.screen = 'gameover';
      this.emitHud();
    }
  };

  private handleInteraction(obj: InteractiveObject): void {
    if (obj.locked) {
      this.showToast('Sealed', obj.lockReason || 'Cannot interact yet', 'crimson');
      return;
    }

    if (obj.kind === 'trial_shrine') {
      this.invokeShadowTrialWave();
      return;
    }

    if (obj.kind === 'artifact' && obj.artifactId && !obj.consumed) {
      obj.consumed = true;
      obj.mesh.visible = false;
      if (!this.artifacts.includes(obj.artifactId)) {
        this.artifacts.push(obj.artifactId);
      }
      this.audio.playArtifactPickup();
      this.combat.spawnBurst(obj.position.clone(), 0xfbbf24, 24);
      this.recomputeStats();
      this.player.health = Math.min(this.stats.maxHealth, this.player.health + 40);

      if (this.currentArea) {
        for (const it of this.currentArea.interactives) {
          if (
            it.kind === 'portal' &&
            ((obj.artifactId === 'trishul_fragment' && it.targetArea === 'catacombs') ||
              (obj.artifactId === 'ancient_yantra' && it.targetArea === 'sunken_stepwell'))
          ) {
            it.locked = false;
            const mat = (it.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.color.setHex(0xd4a34a);
            mat.opacity = 0.72;
          }
        }
      }

      const artDef = ARTIFACTS[obj.artifactId];
      this.showToast(`Artifact Claimed: ${artDef.name}`, artDef.gameplayEffect, 'gold');
      this.grantXp(140);
      this.checkQuestCompletions();
      this.saveProgress();
    } else if (obj.kind === 'bell') {
      this.audio.playBell();
      this.camCtrl.triggerShake(0.18);
      if (!this.flags.bellRung) {
        this.flags.bellRung = true;
        if (this.currentArea) {
          for (const it of this.currentArea.interactives) {
            if (it.id === 'chest_temple_1') it.locked = false;
          }
        }
        this.showToast('Temple Bell Awakened', 'A sealed Relic Chest in the courtyard opened!', 'gold');
        this.grantXp(90);
        this.checkQuestCompletions();
        this.saveProgress();
      } else {
        this.showToast('Sacred Resonance', 'The bronze ghanta echoes across the stones', 'spirit');
      }
    } else if (obj.kind === 'mandala_altar') {
      if (this.flags.mandalaSolved) {
        this.showToast('Mandala Aligned', 'The sacred seal is already restored', 'spirit');
      } else {
        this.input.releasePointerLock();
        this.input.clearKeys();
        this.mandalaRings = [2, 1, 3];
        this.screen = 'puzzle';
      }
    } else if (obj.kind === 'monolith' && !obj.consumed) {
      obj.consumed = true;
      if (!this.flags.purifiedMonoliths.includes(obj.id)) {
        this.flags.purifiedMonoliths.push(obj.id);
      }
      this.audio.playArtifactPickup();
      this.combat.spawnBurst(obj.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xfbbf24, 24);
      obj.mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.emissive && mat.emissive.getHex() !== 0) {
            mat.color.setHex(0xfbbf24);
            mat.emissive.setHex(0xd97706);
          }
        } else if ((child as THREE.PointLight).isPointLight) {
          (child as THREE.PointLight).color.setHex(0xfbbf24);
        }
      });

      if (this.flags.purifiedMonoliths.length >= 3 && this.currentArea) {
        for (const it of this.currentArea.interactives) {
          if (it.id === 'portal_sanctum_final') {
            it.locked = false;
            it.lockReason = '';
            const mat = (it.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.color.setHex(0xf59e0b);
            mat.opacity = 0.75;
          }
        }
        this.showToast('Eclipse Gate Unsealed!', 'Proceed north to face Kali Purusha', 'gold');
      } else {
        this.showToast(
          'Monolith Purified',
          `${this.flags.purifiedMonoliths.length}/3 Sanctum Seals cleansed`,
          'gold'
        );
      }
      this.grantXp(120);
      this.checkQuestCompletions();
      this.saveProgress();
    } else if (obj.kind === 'chest' && !obj.consumed) {
      obj.consumed = true;
      if (!this.flags.openedChests.includes(obj.id)) {
        this.flags.openedChests.push(obj.id);
      }
      obj.mesh.position.y = 0.85;
      obj.mesh.rotation.x = -0.9;
      this.consumables.pranaElixir += 2;
      this.consumables.somaVial += 1;
      this.forgeShards += 2;
      this.audio.playArtifactPickup();
      this.combat.spawnBurst(obj.position.clone(), 0xfbbf24, 22);

      // Drop a random 3D weapon right beside the chest for the player to collect & equip!
      if (this.currentArea) {
        const dropped = rollRandomBoxWeapon(this.level, this.areaId, this.collectedWeaponIds);
        const dirToPlayer = new THREE.Vector3()
          .subVectors(this.player.position, obj.position)
          .setY(0);
        if (dirToPlayer.lengthSq() < 0.01) dirToPlayer.set(0, 0, 1);
        dirToPlayer.normalize();
        const dropPos = obj.position
          .clone()
          .addScaledVector(dirToPlayer, 1.75);
        dropPos.y = this.currentArea.groundHeightAt(dropPos.x, dropPos.z);
        this.currentArea.spawnWeaponDrop(dropPos, dropped);
        this.showToast(
          `Box Dropped: ${dropped.name}!`,
          `${dropped.rarity} (+${dropped.powerBonus} ATK) · Walk over or press [E] to collect!`,
          'gold'
        );
      } else {
        this.showToast('Relic Chest Opened', '+2 Prana · +1 Soma · +2 Forge Shards · +80 XP', 'spirit');
      }
      this.grantXp(80);
      this.saveProgress();
    } else if (obj.kind === 'weapon_drop' && !obj.consumed) {
      this.collectDroppedWeapon(obj);
    } else if (obj.kind === 'lore') {
      this.audio.playShieldActivate();
      this.loreModal = {
        title: obj.loreTitle ?? obj.label,
        text: obj.loreText ?? '',
      };
      if (!this.flags.loreRead.includes(obj.id)) {
        this.flags.loreRead.push(obj.id);
        this.grantXp(45);
      }
      this.input.releasePointerLock();
    } else if (obj.kind === 'portal' && obj.targetArea) {
      const currentIdx = getRealm(this.areaId).index;
      const targetIdx = getRealm(obj.targetArea).index;
      this.audio.playPortal();
      this.loadArea(obj.targetArea, true);
      if (targetIdx < currentIdx && this.currentArea) {
        const returnZ = obj.targetArea === 'forest' || obj.targetArea === 'sanctum' ? -20 : -18.5;
        const returnPos = new THREE.Vector3(0, this.currentArea.groundHeightAt(0, returnZ), returnZ);
        this.player.resetForArea(returnPos, 0);
        this.camCtrl.snapToPlayer(returnPos, 0);
        this.pet.setPet(this.petId, returnPos);
      }
      this.showToast(
        `Entered ${this.currentArea?.name ?? ''}`,
        this.currentArea?.subtitle ?? '',
        'gold'
      );
      this.saveProgress();
    }

    this.emitHud();
  }

  private collectDroppedWeapon(obj: InteractiveObject): void {
    const weapon = obj.weaponDrop;
    if (!weapon || obj.consumed) return;
    obj.consumed = true;
    obj.mesh.visible = false;

    const alreadyOwned = this.collectedWeaponIds.includes(weapon.id);
    if (!alreadyOwned) {
      this.collectedWeaponIds.push(weapon.id);
    }

    if (alreadyOwned) {
      this.forgeShards += 2;
      this.audio.playAnvilForge();
      this.combat.spawnBurst(obj.position.clone(), weapon.accentHex, 20);
      this.showToast(
        `Duplicate Relic Salvaged: ${weapon.name}`,
        '+2 Forge Shards & +35 XP added to Satchel',
        'spirit'
      );
      this.grantXp(35);
    } else if (!this.equippedChestWeaponId || weapon.powerBonus >= this.chestWeaponBonus) {
      this.equippedChestWeaponId = weapon.id;
      this.chestWeaponBonus = weapon.powerBonus;
      this.activeWeaponName = `${weapon.name} (+${weapon.powerBonus})`;
      this.player.setWeaponAccent(weapon.accentHex);
      this.recomputeStats();
      this.audio.playAnvilForge();
      this.combat.spawnBurst(obj.position.clone(), weapon.accentHex, 26);
      this.showToast(
        `Collected & Equipped: ${weapon.name}`,
        `${weapon.rarity} Weapon (+${weapon.powerBonus} ATK) — Ready for battle!`,
        'gold'
      );
      this.grantXp(50);
    } else {
      this.audio.playArtifactPickup();
      this.combat.spawnBurst(obj.position.clone(), weapon.accentHex, 18);
      this.showToast(
        `Stored in Satchel: ${weapon.name}`,
        `${weapon.rarity} (+${weapon.powerBonus} ATK) · Kept stronger weapon (+${this.chestWeaponBonus} ATK)`,
        'spirit'
      );
      this.grantXp(50);
    }

    this.saveProgress();
    this.emitHud();
  }

  private showToast(title: string, subtitle: string, tone: 'gold' | 'crimson' | 'spirit'): void {
    this.toastCounter += 1;
    this.toast = { id: this.toastCounter, title, subtitle, tone };
    this.toastTimer = 3.6;
  }

  // =========================================================================
  // RENDER LOOP
  // =========================================================================

  private startLoop(): void {
    const tick = (timestamp?: number) => {
      if (this.disposed) return;

      this.timer.update(timestamp);
      const dt = Math.min(0.05, this.timer.getDelta());
      this.elapsedTime += dt;

      this.step(dt);

      const isActiveScene =
        this.screen === 'playing' || this.screen === 'menu' || this.screen === 'class_select';
      if (isActiveScene || this.needsStaticRender) {
        this.needsStaticRender = false;
        this.renderer.render(this.scene, this.camCtrl.camera);
      }

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const isActiveScene =
      this.screen === 'playing' || this.screen === 'menu' || this.screen === 'class_select';
    if (!isActiveScene) {
      this.frameId = window.setTimeout(cb, 100);
      return;
    }
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    let polls = 0;
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      polls += 1;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (sync && state === gl.UNSIGNALED && polls < 8) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 45);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private step(dt: number): void {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toast = null;
      }
    }
    if (this.screen === 'playing' && this.vedaMantraTimer > 0) {
      this.vedaMantraTimer -= dt;
      if (this.vedaMantraTimer <= 0) {
        this.activeVedaMantra = null;
      }
    }
    if (this.trialCooldown > 0) {
      this.trialCooldown = Math.max(0, this.trialCooldown - dt);
    }
    if (this.classSpecialCooldown > 0) {
      this.classSpecialCooldown = Math.max(0, this.classSpecialCooldown - dt);
    }

    const sys = this.input.consumeSystemActions();
    if (sys.pause) {
      if (this.loreModal) {
        this.loreModal = null;
        this.emitHud();
      } else if (this.screen === 'playing') {
        this.setScreen('paused');
      } else if (this.screen === 'paused' || this.screen === 'inventory' || this.screen === 'puzzle') {
        this.setScreen('playing');
      }
    }
    if (sys.inventory) {
      if (this.screen === 'playing') this.setScreen('inventory');
      else if (this.screen === 'inventory') this.setScreen('playing');
    }
    if (sys.toggleMap && this.screen === 'playing') {
      this.input.releasePointerLock();
      this.input.clearKeys();
      this.onToggleMap?.();
    }
    if (this.screen === 'playing') {
      if (sys.usePrana) this.useConsumable('prana');
      if (sys.useSoma) this.useConsumable('soma');
      if (sys.invokeTrial) this.invokeShadowTrialWave();
      if (sys.classAction) this.performClassAction();
      if (sys.saintMantra) this.performSaintMantra();
      if (sys.saintPuja) this.performSaintPuja();
    }

    if (this.saveQueued) {
      this.saveFlushTimer -= dt;
      if (this.saveFlushTimer <= 0) {
        this.saveProgress();
      }
    }

    if (
      this.currentArea &&
      (this.screen === 'playing' || this.screen === 'menu' || this.screen === 'class_select')
    ) {
      this.currentArea.update(dt, this.elapsedTime, this.stats.ancientVisionRank);
    }

    if (this.screen === 'menu' || this.screen === 'class_select') {
      this.camCtrl.yaw += dt * 0.09;
      this.camCtrl.pitch = 0.28;
      this.camCtrl.update(
        dt,
        new THREE.Vector3(0, 1.5, 4),
        [],
        () => 0,
        false
      );
      return;
    }

    if (this.screen !== 'playing' || !this.currentArea) {
      if (this.screen !== this.lastEmittedScreen) {
        this.emitHud();
      }
      return;
    }

    const camDeltas = this.input.consumeCameraDeltas();
    if (camDeltas.dx !== 0 || camDeltas.dy !== 0) {
      this.camCtrl.addRotation(camDeltas.dx, camDeltas.dy, this.settings.mouseSensitivity);
    }
    if (camDeltas.wheel !== 0) {
      this.camCtrl.adjustDistance(camDeltas.wheel);
    }

    const pInput = this.input.consumePlayerInput();
    if (pInput.sacredAttack && this.stats.hasSacredAttack && this.player.energyAttackCooldown <= 0) {
      if (this.player.energy >= 24) {
        this.player.energy -= 24;
        this.player.energyAttackCooldown = 2.4 * this.stats.abilityCooldownMultiplier;
        this.player.yaw = this.camCtrl.yaw;
        this.player.getForwardDirection(_fwd);
        this.combat.spawnSacredWave(
          this.player.position,
          _fwd,
          this.stats.sacredAttackDamage,
          this.audio
        );
      } else {
        this.showToast('Low Energy', 'Need 24 Energy for Sacred Wave', 'crimson');
      }
    }

    if (pInput.shield && this.stats.hasDivineShield && this.player.shieldCooldown <= 0) {
      if (this.player.energy >= 28) {
        this.player.energy -= 28;
        this.player.shieldTimer = this.stats.shieldDuration;
        this.player.shieldCooldown = 8.5 * this.stats.abilityCooldownMultiplier;
        if (this.playerClass === 'supporter') {
          this.player.health = Math.min(
            this.stats.maxHealth,
            this.player.health + Math.round(this.stats.maxHealth * 0.15)
          );
        }
        this.audio.playShieldActivate();
        this.showToast(
          'Divine Shield Active',
          this.playerClass === 'supporter' ? 'Damage reduced & +15% Health healed' : 'Incoming shadow damage reduced',
          'gold'
        );
      } else {
        this.showToast('Low Energy', 'Need 28 Energy for Divine Shield', 'crimson');
      }
    }

    const { triggerMeleeHit, attackFormat, comboStep, lowEnergyFor } = this.player.update(
      dt,
      pInput,
      this.camCtrl.yaw,
      this.camCtrl.pitch,
      this.stats,
      this.currentArea.colliders,
      this.currentArea.groundHeightAt,
      this.currentArea.boundsRadius,
      this.audio,
      this.currentArea.isStoneGround
    );

    if (lowEnergyFor) {
      this.showToast('Low Energy', lowEnergyFor, 'crimson');
    }

    if (triggerMeleeHit) {
      this.player.getForwardDirection(_fwd);
      const baseAttackDamage = (28 + this.stats.weaponFlatBonus) * this.stats.damageMultiplier;
      const burstCol = this.playerClass === 'blacksmith' ? 0xf97316 : 0xef4444;

      if (this.stats.isBowClass) {
        if (attackFormat === 'heavy') {
          this.combat.spawnPiercingArrow(this.player.position, _fwd, baseAttackDamage * 1.9, this.audio);
          this.camCtrl.triggerShake(0.16);
        } else if (attackFormat === 'spin') {
          this.combat.spawnArrowFan(this.player.position, _fwd, baseAttackDamage * 1.1, this.audio);
        } else if (attackFormat === 'dash') {
          this.combat.spawnPlayerArrow(this.player.position, _fwd, baseAttackDamage * 1.35, this.audio);
          this.combat.spawnGroundRingEffect(this.player.position, 2.4, 0x22c55e);
        } else {
          const comboMult = comboStep === 2 ? 1.25 : 1.0;
          this.combat.spawnPlayerArrow(this.player.position, _fwd, baseAttackDamage * comboMult, this.audio);
        }
      } else {
        if (attackFormat === 'heavy') {
          this.combat.performPlayerMelee(
            this.player.position,
            _fwd,
            baseAttackDamage * 1.85,
            this.enemies,
            this.audio,
            this.handleEnemyKilled,
            () => this.camCtrl.triggerShake(0.26),
            this.stats.meleeReach + 1.1,
            this.stats.knockback + 4.5,
            0xfbbf24
          );
          this.combat.spawnGroundRingEffect(this.player.position, 3.6, 0xf97316);
        } else if (attackFormat === 'spin') {
          this.combat.performRadialDamage(
            this.player.position,
            this.stats.meleeReach + 1.3,
            baseAttackDamage * 1.35,
            9.0,
            0xfbbf24,
            this.enemies,
            this.audio,
            this.handleEnemyKilled
          );
          this.combat.spawnGroundRingEffect(this.player.position, 4.4, 0xfbbf24);
          this.camCtrl.triggerShake(0.18);
        } else if (attackFormat === 'dash') {
          this.combat.performPlayerMelee(
            this.player.position,
            _fwd,
            baseAttackDamage * 1.45,
            this.enemies,
            this.audio,
            this.handleEnemyKilled,
            () => this.camCtrl.triggerShake(0.18),
            this.stats.meleeReach + 0.9,
            this.stats.knockback + 2.5,
            0x38bdf8
          );
          this.combat.spawnGroundRingEffect(this.player.position, 2.8, 0x38bdf8);
        } else {
          const comboMult = comboStep === 2 ? 1.28 : 1.0;
          this.combat.performPlayerMelee(
            this.player.position,
            _fwd,
            baseAttackDamage * comboMult,
            this.enemies,
            this.audio,
            this.handleEnemyKilled,
            () => this.camCtrl.triggerShake(this.playerClass === 'blacksmith' ? 0.2 : 0.14),
            this.stats.meleeReach,
            this.stats.knockback,
            comboStep === 2 ? 0xfbbf24 : burstCol
          );
        }
      }
    }

    // Update 3D Companion Pet (Level 50+)
    this.pet.update(
      dt,
      this.player.position,
      this.player.yaw,
      this.enemies,
      this.currentArea.groundHeightAt,
      this.audio,
      (enemy, pos, killed) => {
        this.combat.spawnBurst(pos.add(new THREE.Vector3(0, 1.0, 0)), 0xfbbf24, 10);
        if (killed) {
          this.handleEnemyKilled(enemy);
        }
      }
    );

    const isSprinting =
      pInput.sprint && (Math.abs(pInput.forward) > 0 || Math.abs(pInput.right) > 0) && this.player.energy > 4;
    this.camCtrl.update(
      dt,
      this.player.position,
      this.currentArea.colliders,
      this.currentArea.groundHeightAt,
      isSprinting
    );

    // Soft enemy-to-enemy separation so packs fan out naturally instead of overlapping identically
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i];
      if (!a.alive || a.dying) continue;
      for (let j = i + 1; j < this.enemies.length; j++) {
        const b = this.enemies[j];
        if (!b.alive || b.dying) continue;
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const minSep = a.radius + b.radius + 0.35;
        const distSq = dx * dx + dz * dz;
        if (distSq < minSep * minSep) {
          const dist = Math.sqrt(distSq);
          const nx = dist > 0.001 ? dx / dist : 1;
          const nz = dist > 0.001 ? dz / dist : 0;
          const push = (minSep - dist) * 0.42;
          a.position.x -= nx * push;
          a.position.z -= nz * push;
          b.position.x += nx * push;
          b.position.z += nz * push;
        }
      }
    }

    let detectedCount = 0;
    const newlySummoned: EnemyEntity[] = [];

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.dying && enemy.deathTimer <= 0) {
        enemy.dispose(this.scene);
        this.enemies.splice(i, 1);
        continue;
      }

      const events = enemy.update(
        dt,
        this.player.position,
        this.stats.shadowDetectionRange,
        this.currentArea.colliders,
        this.currentArea.groundHeightAt,
        this.currentArea.boundsRadius,
        this.audio
      );

      if (enemy.alive && this.stats.shadowDetectionRange > 0) {
        const d = enemy.position.distanceTo(this.player.position);
        if (d <= this.stats.shadowDetectionRange) detectedCount += 1;
      }

      for (const ev of events) {
        if (ev.kind === 'melee') {
          const dist = Math.hypot(
            this.player.position.x - ev.pos.x,
            this.player.position.z - ev.pos.z
          );
          if (dist <= ev.range) {
            this.handlePlayerDamaged(ev.damage);
          }
        } else if (ev.kind === 'orb') {
          this.combat.spawnEnemyOrb(ev.origin, ev.direction, ev.damage, ev.speed, ev.color);
        } else if (ev.kind === 'shockwave') {
          this.combat.spawnBossShockwave(ev.origin, ev.damage);
        } else if (ev.kind === 'summon') {
          newlySummoned.push(
            new EnemyEntity(
              {
                id: `summon_${Date.now()}_${Math.random()}`,
                type: 'dark_spirit',
                position: ev.pos,
                level: this.level,
              },
              this.scene
            )
          );
        }
      }
    }
    this.detectedEnemyCount = detectedCount;
    if (newlySummoned.length > 0) {
      this.enemies.push(...newlySummoned);
    }

    this.combat.update(
      dt,
      this.player.position,
      this.player.radius,
      this.player.grounded,
      this.enemies,
      this.currentArea.colliders,
      this.currentArea.groundHeightAt,
      this.audio,
      this.handlePlayerDamaged,
      this.handleEnemyKilled
    );

    let closest: InteractiveObject | null = null;
    let closestDist = Infinity;
    for (const it of this.currentArea.interactives) {
      if (it.consumed && it.kind !== 'bell' && it.kind !== 'lore' && it.kind !== 'trial_shrine') continue;
      const d = this.player.position.distanceTo(it.position);
      if (it.kind === 'weapon_drop' && d <= 1.55) {
        this.collectDroppedWeapon(it);
        continue;
      }
      if (d <= it.radius && d < closestDist) {
        closest = it;
        closestDist = d;
      }
    }
    this.nearbyInteractive = closest;

    if (pInput.interact && closest) {
      this.handleInteraction(closest);
    }

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= (this.isEcoMode() ? 0.14 : 0.08)) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }
  }

  private emitHud(): void {
    this.lastEmittedScreen = this.screen;
    const allQuests = this.getQuests();
    const activeQuest =
      allQuests.find((q) => q.areaId === this.areaId) ??
      allQuests.find((q) => !q.completed) ??
      null;

    const realmDef = getRealm(this.areaId);
    const bossEntity = this.enemies.find((e) => (e.type === 'boss_kali' || e.isWarden) && e.alive);

    this.onHudUpdate({
      screen: this.screen,
      areaId: this.areaId,
      areaIndex: realmDef.index,
      totalAreas: TOTAL_AREAS,
      areaName: this.currentArea?.name ?? realmDef.name,
      areaSubtitle: this.currentArea?.subtitle ?? realmDef.subtitle,
      playerClass: this.playerClass,
      activeWeaponName: this.activeWeaponName,
      health: Math.ceil(this.player.health),
      maxHealth: this.stats.maxHealth,
      energy: Math.floor(this.player.energy),
      maxEnergy: this.stats.maxEnergy,
      level: this.level,
      xp: this.xp,
      xpToNext: getXpToNext(this.level),
      difficultyTier: getDifficultyTier(this.level, this.isGod),
      isGod: this.isGod,
      petId: this.petId,
      blessings: [...this.blessings],
      blessingChoices: this.blessingChoices.map((b) => ({
        id: b.id,
        index: b.index,
        name: b.name,
        deity: b.deity,
        deityRank: b.deityRank,
        weaponName: b.weaponName,
        weaponPower: b.weaponPower,
        description: b.description,
      })),
      flashlightOn: this.player.flashlightOn,
      shieldActive: this.player.shieldTimer > 0,
      shieldCooldown: Number(this.player.shieldCooldown.toFixed(1)),
      energyAttackCooldown: Number(this.player.energyAttackCooldown.toFixed(1)),
      heavyCooldown: Number(this.player.heavyCooldown.toFixed(1)),
      spinCooldown: Number(this.player.spinCooldown.toFixed(1)),
      dashCooldown: Number(this.player.dashCooldown.toFixed(1)),
      comboStep: this.player.attackCombo,
      abilities: { ...this.abilities },
      artifacts: [...this.artifacts],
      consumables: { ...this.consumables },
      activeQuest,
      allQuests,
      interactPrompt: this.nearbyInteractive
        ? {
            label: this.nearbyInteractive.label,
            promptText: this.nearbyInteractive.promptText,
            locked: this.nearbyInteractive.locked,
            lockReason: this.nearbyInteractive.lockReason,
          }
        : null,
      levelUpChoices: [],
      boss: bossEntity
        ? {
            active: true,
            name: bossEntity.isWarden ? (bossEntity.wardenTitle ?? 'Realm Warden') : 'Kali Purusha',
            title: bossEntity.isWarden ? 'Milestone Guardian' : 'Sovereign of Kalyug',
            health: Math.ceil(bossEntity.health),
            maxHealth: bossEntity.maxHealth,
            phase: bossEntity.isWarden ? 1 : bossEntity.bossPhase,
          }
        : null,
      toast: this.toast,
      loreModal: this.loreModal,
      detectedEnemyCount: this.detectedEnemyCount,
      pointerLocked: this.input.pointerLocked,
      hasSave: this.hasSaveCached,
      enemiesDefeated: this.enemiesDefeated,
      mandalaRings: [...this.mandalaRings] as [number, number, number],
      discoveredAreas: [...this.flags.discoveredAreas],
      activeVedaMantra: this.activeVedaMantra,
      forgeShards: this.forgeShards,
      forgedWeaponBonus: this.forgedWeaponBonus,
      forgedWeaponsCount: this.forgedWeaponsCount,
      collectedWeaponIds: [...this.collectedWeaponIds],
      equippedChestWeaponId: this.equippedChestWeaponId,
      chestWeaponBonus: this.chestWeaponBonus,
      classSpecialCooldown: Number(this.classSpecialCooldown.toFixed(1)),
      yaggaActive: this.combat.hasActiveYagga(),
      map: {
        boundsRadius: this.currentArea?.boundsRadius ?? 48,
        playerX: this.player.position.x,
        playerZ: this.player.position.z,
        playerYaw: this.player.yaw,
        enemies: this.enemies
          .filter((e) => e.alive && !e.dying)
          .map((e) => ({
            x: e.position.x,
            z: e.position.z,
            isBoss: e.type === 'boss_kali' || e.isWarden,
          })),
        markers: (this.currentArea?.interactives ?? [])
          .filter((it) => !it.consumed || it.kind === 'portal' || it.kind === 'bell' || it.kind === 'trial_shrine')
          .map((it) => ({
            id: it.id,
            kind: it.kind,
            label: it.label,
            x: it.position.x,
            z: it.position.z,
            locked: Boolean(it.locked),
          })),
      },
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.detachInputs?.();
    this.timer.dispose();

    this.combat.dispose();
    for (const e of this.enemies) e.dispose(this.scene);
    this.pet.dispose();
    this.currentArea?.dispose();
    disposeTextures(this.textures);
    this.envTexture.dispose();
    this.audio.dispose();
    this.renderer.dispose();
  }
}
