import * as THREE from 'three';
import { AudioEngine } from './audio';
import { getDifficultyMultipliers } from './progression';
import { ColliderBox, EnemyType } from './types';

export interface EnemySpawnConfig {
  id: string;
  type: EnemyType;
  position: THREE.Vector3;
  level?: number;
  patrolRadius?: number;
}

export type EnemyActionEvent =
  | { kind: 'melee'; damage: number; range: number; pos: THREE.Vector3; isBossShockwave?: boolean }
  | { kind: 'orb'; origin: THREE.Vector3; direction: THREE.Vector3; damage: number; speed: number; color: number }
  | { kind: 'shockwave'; origin: THREE.Vector3; damage: number }
  | { kind: 'summon'; pos: THREE.Vector3 };

const _toPlayer = new THREE.Vector3();
const _move = new THREE.Vector3();

const sharedEnemyGeoCache = new Map<string, THREE.BufferGeometry>();
function getEnemyGeo(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = sharedEnemyGeoCache.get(key);
  if (!geo) {
    geo = factory();
    sharedEnemyGeoCache.set(key, geo);
  }
  return geo;
}

export class EnemyEntity {
  public readonly id: string;
  public readonly type: EnemyType;
  public readonly group = new THREE.Group();
  public readonly position = this.group.position;
  public readonly spawnPosition: THREE.Vector3;

  public maxHealth: number;
  public health: number;
  public speed: number;
  public damage: number;
  public xpReward: number;
  public detectRadius: number;
  public attackRange: number;
  public radius: number;
  public height: number;

  public alive = true;
  public dying = false;
  public deathTimer = 0;
  public hitFlashTimer = 0;
  public stunTimer = 0;
  public bossPhase: 1 | 2 | 3 = 1;

  private state: 'idle' | 'chase' | 'windup' | 'recover' = 'idle';
  private stateTimer = 0;
  private attackCooldown = 0;
  private orbCooldown = 2.5;
  private shockwaveCooldown = 6.0;
  private summonTriggered = false;
  private patrolAngle = Math.random() * Math.PI * 2;
  private animTime = Math.random() * 10;
  private knockbackVel = new THREE.Vector3();
  private growlCooldown = 1 + Math.random() * 4;

  // Animated subparts
  private bodyGroup = new THREE.Group();
  private leftArm = new THREE.Group();
  private rightArm = new THREE.Group();
  private leftLeg = new THREE.Group();
  private rightLeg = new THREE.Group();
  private haloRing1: THREE.Mesh | null = null;
  private haloRing2: THREE.Mesh | null = null;
  private detectOutlineMesh: THREE.Mesh;
  private bodyMaterials: THREE.MeshStandardMaterial[] = [];
  private baseEmissives: Array<{ mat: THREE.MeshStandardMaterial; hex: number; intensity: number }> = [];
  private isFlashing = false;

  constructor(config: EnemySpawnConfig, scene: THREE.Scene) {
    this.id = config.id;
    this.type = config.type;
    this.spawnPosition = config.position.clone();
    this.group.position.copy(config.position);
    this.group.add(this.bodyGroup);

    const lvl = config.level ?? 1;
    const mult = getDifficultyMultipliers(lvl);

    // Stats by enemy type scaled by Difficulty Tier
    switch (config.type) {
      case 'shadow_walker':
        this.maxHealth = Math.round(70 * mult.hpMult);
        this.speed = 3.8 * mult.speedMult;
        this.damage = Math.round(13 * mult.dmgMult);
        this.xpReward = Math.round(38 * mult.xpMult);
        this.detectRadius = 16;
        this.attackRange = 2.0;
        this.radius = 0.55;
        this.height = 2.1;
        break;
      case 'dark_spirit':
        this.maxHealth = Math.round(58 * mult.hpMult);
        this.speed = 4.1 * mult.speedMult;
        this.damage = Math.round(11 * mult.dmgMult);
        this.xpReward = Math.round(44 * mult.xpMult);
        this.detectRadius = 18;
        this.attackRange = 2.2;
        this.radius = 0.5;
        this.height = 2.0;
        break;
      case 'temple_guardian':
        this.maxHealth = Math.round(140 * mult.hpMult);
        this.speed = 2.75 * mult.speedMult;
        this.damage = Math.round(22 * mult.dmgMult);
        this.xpReward = Math.round(75 * mult.xpMult);
        this.detectRadius = 15;
        this.attackRange = 2.6;
        this.radius = 0.85;
        this.height = 2.7;
        break;
      case 'ancient_beast':
        this.maxHealth = Math.round(100 * mult.hpMult);
        this.speed = 4.8 * mult.speedMult;
        this.damage = Math.round(18 * mult.dmgMult);
        this.xpReward = Math.round(62 * mult.xpMult);
        this.detectRadius = 19;
        this.attackRange = 2.2;
        this.radius = 0.7;
        this.height = 1.5;
        break;
      case 'boss_kali':
        this.maxHealth = Math.round(900 * Math.max(2.5, mult.hpMult));
        this.speed = 3.6 * Math.min(1.45, mult.speedMult);
        this.damage = Math.round(28 * Math.max(1.8, mult.dmgMult * 0.85));
        this.xpReward = Math.round(650 * mult.xpMult);
        this.detectRadius = 40;
        this.attackRange = 3.6;
        this.radius = 1.3;
        this.height = 4.4;
        break;
    }
    this.health = this.maxHealth;

    this.buildModel();

    // Shadow Detection highlight ring (visible only when Shadow Detection reaches enemy)
    this.detectOutlineMesh = new THREE.Mesh(
      getEnemyGeo(`detect_ring_${this.radius.toFixed(2)}`, () =>
        new THREE.RingGeometry(this.radius * 1.15, this.radius * 1.45, 24)
      ),
      new THREE.MeshBasicMaterial({
        color: this.type === 'boss_kali' ? 0xef4444 : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      })
    );
    this.detectOutlineMesh.rotation.x = -Math.PI / 2;
    this.detectOutlineMesh.position.y = 0.06;
    this.detectOutlineMesh.visible = false;
    this.group.add(this.detectOutlineMesh);

    scene.add(this.group);
  }

  private trackMat(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
    this.bodyMaterials.push(mat);
    this.baseEmissives.push({
      mat,
      hex: mat.emissive.getHex(),
      intensity: mat.emissiveIntensity,
    });
    return mat;
  }

  private buildModel(): void {
    const shadowObsidian = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x16121d, roughness: 0.85, metalness: 0.15 })
    );
    const darkArmor = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x26202e, roughness: 0.45, metalness: 0.72 })
    );
    const eyeCrimson = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xff2e2e,
        emissive: 0xdc2626,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      })
    );

    if (this.type === 'shadow_walker') {
      // Hunched 7-part spectral warrior
      const legGeo = getEnemyGeo('sw_leg', () => new THREE.CylinderGeometry(0.1, 0.07, 0.85, 8));
      const lLeg = new THREE.Mesh(legGeo, shadowObsidian);
      lLeg.position.y = -0.42;
      this.leftLeg.position.set(-0.18, 0.85, 0);
      this.leftLeg.add(lLeg);
      const rLeg = new THREE.Mesh(legGeo, shadowObsidian);
      rLeg.position.y = -0.42;
      this.rightLeg.position.set(0.18, 0.85, 0);
      this.rightLeg.add(rLeg);

      const torso = new THREE.Mesh(
        getEnemyGeo('sw_torso', () => new THREE.ConeGeometry(0.38, 1.05, 8)),
        shadowObsidian
      );
      torso.position.y = 1.25;
      torso.rotation.x = Math.PI;
      torso.castShadow = true;

      const head = new THREE.Mesh(
        getEnemyGeo('sw_head', () => new THREE.OctahedronGeometry(0.22, 0)),
        darkArmor
      );
      head.position.set(0, 1.82, 0.08);
      head.castShadow = true;

      // Horned crown
      const hornGeo = getEnemyGeo('sw_horn', () => new THREE.ConeGeometry(0.05, 0.34, 6));
      const hL = new THREE.Mesh(hornGeo, darkArmor);
      hL.position.set(-0.14, 2.04, 0.04);
      hL.rotation.z = 0.35;
      const hR = hL.clone();
      hR.position.x = 0.14;
      hR.rotation.z = -0.35;

      // Glowing eyes
      const eyeL = new THREE.Mesh(
        getEnemyGeo('sw_eye', () => new THREE.SphereGeometry(0.04, 6, 6)),
        eyeCrimson
      );
      eyeL.position.set(-0.07, 1.84, 0.24);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.07;

      // Clawed arms
      const armGeo = getEnemyGeo('sw_arm', () => new THREE.CylinderGeometry(0.07, 0.03, 0.9, 6));
      const lArmM = new THREE.Mesh(armGeo, shadowObsidian);
      lArmM.position.y = -0.42;
      this.leftArm.position.set(-0.36, 1.55, 0.05);
      this.leftArm.add(lArmM);
      const rArmM = new THREE.Mesh(armGeo, shadowObsidian);
      rArmM.position.y = -0.42;
      this.rightArm.position.set(0.36, 1.55, 0.05);
      this.rightArm.add(rArmM);

      this.bodyGroup.add(this.leftLeg, this.rightLeg, torso, head, hL, hR, eyeL, eyeR, this.leftArm, this.rightArm);
    } else if (this.type === 'dark_spirit') {
      const spiritMat = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          emissive: 0x1d4ed8,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0.4,
        })
      );
      const cyanEye = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0ea5e9,
          emissiveIntensity: 2.4,
        })
      );

      const mantle = new THREE.Mesh(
        getEnemyGeo('ds_mantle', () => new THREE.ConeGeometry(0.42, 1.3, 8)),
        spiritMat
      );
      mantle.position.y = 1.25;
      mantle.castShadow = true;

      const core = new THREE.Mesh(
        getEnemyGeo('ds_core', () => new THREE.OctahedronGeometry(0.24, 1)),
        cyanEye
      );
      core.position.y = 1.65;

      this.haloRing1 = new THREE.Mesh(
        getEnemyGeo('ds_halo1', () => new THREE.TorusGeometry(0.58, 0.035, 6, 20)),
        darkArmor
      );
      this.haloRing1.position.y = 1.45;
      this.haloRing2 = new THREE.Mesh(
        getEnemyGeo('ds_halo2', () => new THREE.TorusGeometry(0.45, 0.03, 6, 18)),
        cyanEye
      );
      this.haloRing2.position.y = 1.45;
      this.haloRing2.rotation.x = Math.PI / 3;

      this.bodyGroup.add(mantle, core, this.haloRing1, this.haloRing2);
    } else if (this.type === 'temple_guardian') {
      const stoneMat = this.trackMat(
        new THREE.MeshStandardMaterial({ color: 0x4b4237, roughness: 0.88, metalness: 0.12 })
      );
      const bronzeMat = this.trackMat(
        new THREE.MeshStandardMaterial({ color: 0x9c6e2c, roughness: 0.35, metalness: 0.82 })
      );
      const coreAmber = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 2.0,
        })
      );

      const legGeo = getEnemyGeo('tg_leg', () => new THREE.BoxGeometry(0.32, 0.95, 0.34));
      const lLeg = new THREE.Mesh(legGeo, stoneMat);
      lLeg.position.y = -0.46;
      this.leftLeg.position.set(-0.28, 0.95, 0);
      this.leftLeg.add(lLeg);
      const rLeg = new THREE.Mesh(legGeo, stoneMat);
      rLeg.position.y = -0.46;
      this.rightLeg.position.set(0.28, 0.95, 0);
      this.rightLeg.add(rLeg);

      const torso = new THREE.Mesh(
        getEnemyGeo('tg_torso', () => new THREE.BoxGeometry(0.95, 1.05, 0.62)),
        stoneMat
      );
      torso.position.y = 1.5;
      torso.castShadow = true;

      const chestCore = new THREE.Mesh(
        getEnemyGeo('tg_core', () => new THREE.OctahedronGeometry(0.18, 0)),
        coreAmber
      );
      chestCore.position.set(0, 1.55, 0.31);

      const pauldronGeo = getEnemyGeo('tg_pauldron', () => new THREE.DodecahedronGeometry(0.28, 0));
      const pL = new THREE.Mesh(pauldronGeo, bronzeMat);
      pL.position.set(-0.62, 1.92, 0);
      const pR = pL.clone();
      pR.position.x = 0.62;

      const head = new THREE.Mesh(
        getEnemyGeo('tg_head', () => new THREE.BoxGeometry(0.42, 0.48, 0.42)),
        bronzeMat
      );
      head.position.y = 2.28;
      head.castShadow = true;
      const visor = new THREE.Mesh(
        getEnemyGeo('tg_visor', () => new THREE.BoxGeometry(0.32, 0.08, 0.06)),
        coreAmber
      );
      visor.position.set(0, 2.32, 0.21);

      // Stone Gada / Mace on right arm
      const tgArmGeo = getEnemyGeo('tg_arm', () => new THREE.BoxGeometry(0.24, 0.9, 0.24));
      const lArmM = new THREE.Mesh(tgArmGeo, stoneMat);
      lArmM.position.y = -0.45;
      this.leftArm.position.set(-0.64, 1.85, 0);
      this.leftArm.add(lArmM);

      const rArmM = new THREE.Mesh(tgArmGeo, stoneMat);
      rArmM.position.y = -0.45;
      const maceShaft = new THREE.Mesh(
        getEnemyGeo('tg_mace_shaft', () => new THREE.CylinderGeometry(0.05, 0.05, 1.35, 8)),
        bronzeMat
      );
      maceShaft.position.set(0, -0.85, 0.35);
      maceShaft.rotation.x = Math.PI / 2;
      const maceHead = new THREE.Mesh(
        getEnemyGeo('tg_mace_head', () => new THREE.SphereGeometry(0.24, 10, 8)),
        bronzeMat
      );
      maceHead.position.set(0, -0.85, 1.0);
      this.rightArm.position.set(0.64, 1.85, 0);
      this.rightArm.add(rArmM, maceShaft, maceHead);

      this.bodyGroup.add(
        this.leftLeg,
        this.rightLeg,
        torso,
        chestCore,
        pL,
        pR,
        head,
        visor,
        this.leftArm,
        this.rightArm
      );
    } else if (this.type === 'ancient_beast') {
      // Quadruped shadow beast
      const beastBody = new THREE.Mesh(
        getEnemyGeo('ab_body', () => new THREE.BoxGeometry(0.72, 0.56, 1.45)),
        shadowObsidian
      );
      beastBody.position.set(0, 0.85, 0);
      beastBody.castShadow = true;

      // Dorsal spine ridges
      const ridgeGeo = getEnemyGeo('ab_ridge', () => new THREE.ConeGeometry(0.08, 0.28, 5));
      for (let i = 0; i < 4; i++) {
        const ridge = new THREE.Mesh(ridgeGeo, darkArmor);
        ridge.position.set(0, 1.22, -0.45 + i * 0.3);
        ridge.rotation.x = -0.35;
        this.bodyGroup.add(ridge);
      }

      const skull = new THREE.Mesh(
        getEnemyGeo('ab_skull', () => new THREE.BoxGeometry(0.48, 0.42, 0.55)),
        darkArmor
      );
      skull.position.set(0, 0.98, 0.88);
      skull.castShadow = true;

      const eyeL = new THREE.Mesh(
        getEnemyGeo('ab_eye', () => new THREE.SphereGeometry(0.055, 6, 6)),
        eyeCrimson
      );
      eyeL.position.set(-0.14, 1.05, 1.12);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.14;

      const legGeo = getEnemyGeo('ab_leg', () => new THREE.CylinderGeometry(0.09, 0.06, 0.72, 8));
      const fl = new THREE.Mesh(legGeo, shadowObsidian);
      fl.position.y = -0.35;
      this.leftLeg.position.set(-0.28, 0.72, 0.48);
      this.leftLeg.add(fl);

      const fr = new THREE.Mesh(legGeo, shadowObsidian);
      fr.position.y = -0.35;
      this.rightLeg.position.set(0.28, 0.72, 0.48);
      this.rightLeg.add(fr);

      const bl = new THREE.Mesh(legGeo, shadowObsidian);
      bl.position.y = -0.35;
      this.leftArm.position.set(-0.28, 0.72, -0.5);
      this.leftArm.add(bl);

      const br = new THREE.Mesh(legGeo, shadowObsidian);
      br.position.y = -0.35;
      this.rightArm.position.set(0.28, 0.72, -0.5);
      this.rightArm.add(br);

      this.bodyGroup.add(beastBody, skull, eyeL, eyeR, this.leftLeg, this.rightLeg, this.leftArm, this.rightArm);
    } else if (this.type === 'boss_kali') {
      // Kali Purusha, Sovereign of Kalyug (Monumental 4.4m demonic shadow-lord)
      const goldTrim = this.trackMat(
        new THREE.MeshStandardMaterial({ color: 0xb98632, roughness: 0.28, metalness: 0.88 })
      );
      const eclipseCore = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xb91c1c,
          emissiveIntensity: 2.6,
          roughness: 0.2,
        })
      );

      const legGeo = getEnemyGeo('bk_leg', () => new THREE.CylinderGeometry(0.24, 0.18, 1.45, 10));
      const lLeg = new THREE.Mesh(legGeo, darkArmor);
      lLeg.position.y = -0.72;
      this.leftLeg.position.set(-0.44, 1.45, 0);
      this.leftLeg.add(lLeg);
      const rLeg = new THREE.Mesh(legGeo, darkArmor);
      rLeg.position.y = -0.72;
      this.rightLeg.position.set(0.44, 1.45, 0);
      this.rightLeg.add(rLeg);

      const torso = new THREE.Mesh(
        getEnemyGeo('bk_torso', () => new THREE.CylinderGeometry(0.88, 0.58, 1.7, 10)),
        shadowObsidian
      );
      torso.position.y = 2.3;
      torso.castShadow = true;

      const core = new THREE.Mesh(
        getEnemyGeo('bk_core', () => new THREE.OctahedronGeometry(0.35, 0)),
        eclipseCore
      );
      core.position.set(0, 2.4, 0.58);

      const pL = new THREE.Mesh(
        getEnemyGeo('bk_pauldron', () => new THREE.ConeGeometry(0.52, 0.78, 6)),
        goldTrim
      );
      pL.position.set(-1.02, 3.02, 0);
      pL.rotation.z = 0.6;
      const pR = pL.clone();
      pR.position.x = 1.02;
      pR.rotation.z = -0.6;

      const head = new THREE.Mesh(
        getEnemyGeo('bk_head', () => new THREE.OctahedronGeometry(0.4, 1)),
        darkArmor
      );
      head.position.y = 3.45;
      const crown = new THREE.Mesh(
        getEnemyGeo('bk_crown', () => new THREE.TorusGeometry(0.44, 0.06, 6, 16)),
        goldTrim
      );
      crown.rotation.x = Math.PI / 2;
      crown.position.y = 3.72;
      // Twin shadow horns of Kali Purusha
      const hornGeo = getEnemyGeo('bk_horn', () => new THREE.ConeGeometry(0.11, 0.65, 6));
      const hornL = new THREE.Mesh(hornGeo, eclipseCore);
      hornL.position.set(-0.34, 3.95, 0);
      hornL.rotation.z = 0.42;
      const hornR = hornL.clone();
      hornR.position.x = 0.34;
      hornR.rotation.z = -0.42;

      const eyeL = new THREE.Mesh(
        getEnemyGeo('bk_eye', () => new THREE.SphereGeometry(0.07, 8, 8)),
        eclipseCore
      );
      eyeL.position.set(-0.14, 3.48, 0.34);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.14;

      // Floating Eclipse Halo Rings behind back
      this.haloRing1 = new THREE.Mesh(
        getEnemyGeo('bk_halo1', () => new THREE.TorusGeometry(1.75, 0.08, 8, 32)),
        goldTrim
      );
      this.haloRing1.position.set(0, 2.7, -0.55);
      this.haloRing2 = new THREE.Mesh(
        getEnemyGeo('bk_halo2', () => new THREE.TorusGeometry(1.32, 0.055, 8, 28)),
        eclipseCore
      );
      this.haloRing2.position.set(0, 2.7, -0.55);

      // Arms + Great Kali Yuga Halberd
      const armGeo = getEnemyGeo('bk_arm', () => new THREE.CylinderGeometry(0.19, 0.14, 1.4, 8));
      const lArmM = new THREE.Mesh(armGeo, darkArmor);
      lArmM.position.y = -0.64;
      this.leftArm.position.set(-1.02, 2.9, 0);
      this.leftArm.add(lArmM);

      const rArmM = new THREE.Mesh(armGeo, darkArmor);
      rArmM.position.y = -0.64;
      const shaft = new THREE.Mesh(
        getEnemyGeo('bk_shaft', () => new THREE.CylinderGeometry(0.065, 0.065, 2.9, 8)),
        goldTrim
      );
      shaft.position.set(0, -1.25, 0.68);
      shaft.rotation.x = Math.PI / 2;
      const blade = new THREE.Mesh(
        getEnemyGeo('bk_blade', () => new THREE.BoxGeometry(0.14, 1.05, 0.48)),
        eclipseCore
      );
      blade.position.set(0, -1.25, 1.95);
      this.rightArm.position.set(1.02, 2.9, 0);
      this.rightArm.add(rArmM, shaft, blade);

      this.bodyGroup.add(
        this.leftLeg,
        this.rightLeg,
        torso,
        core,
        pL,
        pR,
        head,
        crown,
        hornL,
        hornR,
        eyeL,
        eyeR,
        this.haloRing1,
        this.haloRing2,
        this.leftArm,
        this.rightArm
      );
    }
  }

  public takeDamage(amount: number, knockbackDir: THREE.Vector3, force = 6): boolean {
    if (!this.alive || this.dying) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitFlashTimer = 0.14;
    this.stunTimer = this.type === 'boss_kali' ? 0.05 : 0.22;
    this.knockbackVel.copy(knockbackDir).multiplyScalar(this.type === 'boss_kali' ? force * 0.22 : force);

    if (this.health <= 0) {
      this.alive = false;
      this.dying = true;
      this.deathTimer = 0.95;
      this.detectOutlineMesh.visible = false;
      return true;
    }

    if (this.type === 'boss_kali') {
      const ratio = this.health / this.maxHealth;
      if (ratio <= 0.33) this.bossPhase = 3;
      else if (ratio <= 0.66) this.bossPhase = 2;
    }

    return false;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    detectionRange: number,
    colliders: ColliderBox[],
    groundHeightAt: (x: number, z: number) => number,
    boundsRadius: number,
    audio: AudioEngine
  ): EnemyActionEvent[] {
    const events: EnemyActionEvent[] = [];
    this.animTime += dt;

    // Death animation
    if (this.dying) {
      this.deathTimer -= dt;
      const t = Math.max(0, this.deathTimer / 0.95);
      this.bodyGroup.rotation.x = (1 - t) * (Math.PI / 2);
      this.bodyGroup.scale.setScalar(0.35 + t * 0.65);
      this.position.y = groundHeightAt(this.position.x, this.position.z) - (1 - t) * 0.4;
      return events;
    }

    // Hit flash feedback (only mutate materials while flashing or when restoring once)
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (!this.isFlashing) {
        this.isFlashing = true;
        for (const m of this.bodyMaterials) {
          m.emissive.setHex(0xffffff);
          m.emissiveIntensity = 0.85;
        }
      }
    } else if (this.isFlashing) {
      this.isFlashing = false;
      for (const entry of this.baseEmissives) {
        entry.mat.emissive.setHex(entry.hex);
        entry.mat.emissiveIntensity = entry.intensity;
      }
    }

    // Distance to player
    _toPlayer.subVectors(playerPos, this.position);
    _toPlayer.y = 0;
    const distToPlayer = _toPlayer.length();

    // Shadow detection indicator
    this.detectOutlineMesh.visible = detectionRange > 0 && distToPlayer <= detectionRange;
    if (this.detectOutlineMesh.visible) {
      this.detectOutlineMesh.rotation.z += dt * 1.5;
    }

    // Apply knockback decay
    if (this.knockbackVel.lengthSq() > 0.05) {
      this.position.x += this.knockbackVel.x * dt;
      this.position.z += this.knockbackVel.z * dt;
      this.knockbackVel.multiplyScalar(Math.exp(-8 * dt));
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.animate(dt, false);
      return events;
    }

    // Ambient enemy growls when close
    this.growlCooldown -= dt;
    if (this.growlCooldown <= 0 && distToPlayer < 14) {
      audio.playEnemyGrowl(this.type);
      this.growlCooldown = 4.5 + Math.random() * 5;
    }

    // Boss special abilities (Orbs, Shockwaves, Summons)
    if (this.type === 'boss_kali' && distToPlayer < 38) {
      this.orbCooldown -= dt * (this.bossPhase === 3 ? 1.5 : 1.0);
      if (this.orbCooldown <= 0 && distToPlayer > 4.2) {
        this.orbCooldown = this.bossPhase === 1 ? 3.8 : 2.6;
        const baseDir = _toPlayer.clone().normalize();
        const count = this.bossPhase === 3 ? 3 : 1;
        for (let i = 0; i < count; i++) {
          const angleOffset = count === 3 ? (i - 1) * 0.25 : 0;
          const dir = new THREE.Vector3(
            baseDir.x * Math.cos(angleOffset) - baseDir.z * Math.sin(angleOffset),
            0,
            baseDir.x * Math.sin(angleOffset) + baseDir.z * Math.cos(angleOffset)
          );
          events.push({
            kind: 'orb',
            origin: new THREE.Vector3(this.position.x, this.position.y + 2.1, this.position.z),
            direction: dir,
            damage: 18 + this.bossPhase * 4,
            speed: 11 + this.bossPhase * 1.5,
            color: 0xef4444,
          });
        }
      }

      if (this.bossPhase >= 2) {
        this.shockwaveCooldown -= dt;
        if (this.shockwaveCooldown <= 0) {
          this.shockwaveCooldown = this.bossPhase === 3 ? 5.2 : 7.5;
          audio.playBossRoar();
          events.push({
            kind: 'shockwave',
            origin: this.position.clone(),
            damage: 24,
          });
        }
        if (!this.summonTriggered) {
          this.summonTriggered = true;
          events.push({ kind: 'summon', pos: new THREE.Vector3(this.position.x - 5, 0, this.position.z - 2) });
          events.push({ kind: 'summon', pos: new THREE.Vector3(this.position.x + 5, 0, this.position.z - 2) });
        }
      }
    }

    // Dark Spirit occasional ranged wisp
    if (this.type === 'dark_spirit' && distToPlayer > 5 && distToPlayer < 14) {
      this.orbCooldown -= dt;
      if (this.orbCooldown <= 0) {
        this.orbCooldown = 4.2;
        events.push({
          kind: 'orb',
          origin: new THREE.Vector3(this.position.x, this.position.y + 1.4, this.position.z),
          direction: _toPlayer.clone().normalize(),
          damage: 11,
          speed: 9.5,
          color: 0x38bdf8,
        });
      }
    }

    // AI state machine
    let isMoving = false;
    if (this.state === 'windup') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        events.push({
          kind: 'melee',
          damage: this.damage * (this.type === 'boss_kali' ? 1 + (this.bossPhase - 1) * 0.2 : 1),
          range: this.attackRange + 0.65,
          pos: this.position.clone(),
        });
        this.state = 'recover';
        this.stateTimer = 0.55;
        this.attackCooldown = this.type === 'ancient_beast' ? 1.15 : 1.5;
      }
    } else if (this.state === 'recover') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'chase';
      }
    } else {
      if (distToPlayer <= this.detectRadius) {
        this.state = 'chase';
        const targetAngle = Math.atan2(_toPlayer.x, _toPlayer.z);
        this.group.rotation.y = this.lerpAngle(this.group.rotation.y, targetAngle, 1 - Math.exp(-8 * dt));

        if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
          this.state = 'windup';
          this.stateTimer = this.type === 'temple_guardian' || this.type === 'boss_kali' ? 0.52 : 0.34;
          audio.playEnemyGrowl(this.type);
        } else if (distToPlayer > this.attackRange * 0.8) {
          isMoving = true;
          const phaseBoost = this.type === 'boss_kali' ? 1 + (this.bossPhase - 1) * 0.24 : 1;
          _move.copy(_toPlayer).normalize().multiplyScalar(this.speed * phaseBoost * dt);
          this.position.x += _move.x;
          this.position.z += _move.z;
        }
      } else {
        // Gentle idle patrol around spawn
        this.state = 'idle';
        this.patrolAngle += dt * 0.45;
        const targetX = this.spawnPosition.x + Math.cos(this.patrolAngle) * 2.5;
        const targetZ = this.spawnPosition.z + Math.sin(this.patrolAngle) * 2.5;
        const dx = targetX - this.position.x;
        const dz = targetZ - this.position.z;
        if (dx * dx + dz * dz > 0.25) {
          isMoving = true;
          const ang = Math.atan2(dx, dz);
          this.group.rotation.y = this.lerpAngle(this.group.rotation.y, ang, dt * 3);
          const d = Math.hypot(dx, dz);
          this.position.x += (dx / d) * this.speed * 0.38 * dt;
          this.position.z += (dz / d) * this.speed * 0.38 * dt;
        }
      }
    }

    // Clamp to colliders & ground height
    this.resolveCollisions(colliders, boundsRadius);
    this.position.y = groundHeightAt(this.position.x, this.position.z);

    this.animate(dt, isMoving);
    return events;
  }

  private animate(dt: number, isMoving: boolean): void {
    if (this.haloRing1) this.haloRing1.rotation.z += dt * 1.4;
    if (this.haloRing2) this.haloRing2.rotation.y += dt * 2.1;

    if (this.type === 'dark_spirit') {
      this.bodyGroup.position.y = Math.sin(this.animTime * 3.2) * 0.22;
      return;
    }

    if (this.state === 'windup') {
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, -2.1, 14, dt);
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -1.2, 14, dt);
    } else if (this.state === 'recover') {
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0.75, 14, dt);
    } else if (isMoving) {
      const freq = this.type === 'ancient_beast' ? 11 : 7.5;
      const swing = Math.sin(this.animTime * freq) * 0.55;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * 0.7;
      this.rightArm.rotation.x = swing * 0.7;
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0, 8, dt);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0, 8, dt);
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 8, dt);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 8, dt);
    }
  }

  private resolveCollisions(colliders: ColliderBox[], boundsRadius: number): void {
    const distSq = this.position.x * this.position.x + this.position.z * this.position.z;
    const maxR = boundsRadius - this.radius;
    if (distSq > maxR * maxR) {
      const d = Math.sqrt(distSq);
      this.position.x = (this.position.x / d) * maxR;
      this.position.z = (this.position.z / d) * maxR;
    }
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.type === 'cylinder') {
        const cr = (c.radius ?? 0.6) + this.radius;
        const dx = this.position.x - c.x;
        const dz = this.position.z - c.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < cr * cr && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          this.position.x += (dx / d) * (cr - d);
          this.position.z += (dz / d) * (cr - d);
        }
      } else {
        const hw = (c.halfW ?? 1) + this.radius;
        const hd = (c.halfD ?? 1) + this.radius;
        const dx = this.position.x - c.x;
        const dz = this.position.z - c.z;
        if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
          const ox = hw - Math.abs(dx);
          const oz = hd - Math.abs(dz);
          if (ox < oz) this.position.x += dx >= 0 ? ox : -ox;
          else this.position.z += dz >= 0 ? oz : -oz;
        }
      }
    }
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
    // Shared primitive geometries live in sharedEnemyGeoCache; only dispose per-instance materials
    for (const mat of this.bodyMaterials) {
      mat.dispose();
    }
    this.bodyMaterials = [];
    this.baseEmissives = [];
    if (Array.isArray(this.detectOutlineMesh.material)) {
      this.detectOutlineMesh.material.forEach((m) => m.dispose());
    } else {
      this.detectOutlineMesh.material.dispose();
    }
  }
}
