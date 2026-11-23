import * as THREE from 'three';
import { AudioEngine } from './audio';
import { EnemyEntity } from './enemy';
import { PetId } from './types';

export interface PetDefinition {
  id: PetId;
  name: string;
  subtitle: string;
  description: string;
  bonusText: string;
  attackDamage: number;
  attackCooldown: number;
}

export const PETS: Record<PetId, PetDefinition> = {
  nandi_vahana: {
    id: 'nandi_vahana',
    name: 'Nandi-Vahana',
    subtitle: 'Sacred Silver Bull Guardian',
    description:
      'An armored celestial bull spirit bound to Dharma. Charges shadow enemies with heavy golden horn strikes.',
    bonusText: '+15% Damage Reduction & 42 Charge Damage',
    attackDamage: 42,
    attackCooldown: 1.8,
  },
  garuda_shavaka: {
    id: 'garuda_shavaka',
    name: 'Garuda-Shavaka',
    subtitle: 'Celestial Golden Eagle',
    description:
      'A radiant sky-born eagle that glides beside you, diving upon nearby corrupted spirits with solar talons.',
    bonusText: '+15% Movement Speed & 36 Solar Dive Damage',
    attackDamage: 36,
    attackCooldown: 1.35,
  },
  vayu_simha: {
    id: 'vayu_simha',
    name: 'Vayu-Simha',
    subtitle: 'Astral Golden Lion',
    description:
      'A fierce golden-maned guardian lion that pounces on enemies in melee and empowers your Astra Blade.',
    bonusText: '+22% Attack Damage & 48 Pounce Damage',
    attackDamage: 48,
    attackCooldown: 1.5,
  },
};

export const ALL_PET_IDS: PetId[] = ['nandi_vahana', 'garuda_shavaka', 'vayu_simha'];

const _targetPos = new THREE.Vector3();
const _toTarget = new THREE.Vector3();

export class PetCompanion {
  public readonly group = new THREE.Group();
  public petId: PetId | null = null;
  private bodyGroup = new THREE.Group();
  private wingL: THREE.Mesh | null = null;
  private wingR: THREE.Mesh | null = null;
  private legs: THREE.Mesh[] = [];
  private attackTimer = 0;
  private animTime = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group.add(this.bodyGroup);
    this.group.visible = false;
    scene.add(this.group);
  }

  public setPet(petId: PetId | null, spawnNear?: THREE.Vector3): void {
    this.petId = petId;
    this.clearModel();
    if (!petId) {
      this.group.visible = false;
      return;
    }

    this.buildModel(petId);
    this.group.visible = true;
    if (spawnNear) {
      this.group.position.set(spawnNear.x - 1.6, spawnNear.y, spawnNear.z + 1.2);
    }
  }

  private clearModel(): void {
    this.wingL = null;
    this.wingR = null;
    this.legs = [];
    while (this.bodyGroup.children.length > 0) {
      const child = this.bodyGroup.children[0];
      this.bodyGroup.remove(child);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
          else m.material.dispose();
        }
      });
    }
  }

  private buildModel(petId: PetId): void {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.85,
    });
    const whiteSacredMat = new THREE.MeshStandardMaterial({
      color: 0xe2dcd0,
      roughness: 0.55,
      metalness: 0.12,
    });
    const lionMat = new THREE.MeshStandardMaterial({
      color: 0xb47b32,
      roughness: 0.65,
      metalness: 0.18,
    });
    const eyeLight = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.0,
    });

    const aura = new THREE.PointLight(0xfbbf24, 1.4, 7, 1.8);
    aura.position.set(0, 1.1, 0);
    this.bodyGroup.add(aura);

    if (petId === 'nandi_vahana') {
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.54, 1.15), whiteSacredMat);
      torso.position.set(0, 0.68, 0);
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), whiteSacredMat);
      hump.position.set(0, 0.98, 0.28);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.36, 0.48), whiteSacredMat);
      head.position.set(0, 0.84, 0.68);
      const hornGeo = new THREE.ConeGeometry(0.06, 0.34, 8);
      const hL = new THREE.Mesh(hornGeo, goldMat);
      hL.position.set(-0.18, 1.08, 0.72);
      hL.rotation.z = 0.45;
      const hR = hL.clone();
      hR.position.x = 0.18;
      hR.rotation.z = -0.45;
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.48), goldMat);
      saddle.position.set(0, 0.96, -0.05);

      const legGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.5, 8);
      [
        [-0.22, 0.25, 0.38],
        [0.22, 0.25, 0.38],
        [-0.22, 0.25, -0.38],
        [0.22, 0.25, -0.38],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, whiteSacredMat);
        leg.position.set(lx, ly, lz);
        this.legs.push(leg);
        this.bodyGroup.add(leg);
      });
      this.bodyGroup.add(torso, hump, head, hL, hR, saddle);
    } else if (petId === 'garuda_shavaka') {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.85, 8), goldMat);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 1.55, 0);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), whiteSacredMat);
      head.position.set(0, 1.65, 0.45);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), goldMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 1.63, 0.66);

      const wingGeo = new THREE.BoxGeometry(0.85, 0.05, 0.38);
      this.wingL = new THREE.Mesh(wingGeo, goldMat);
      this.wingL.position.set(-0.52, 1.62, 0.05);
      this.wingR = new THREE.Mesh(wingGeo, goldMat);
      this.wingR.position.set(0.52, 1.62, 0.05);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeLight);
      eyeL.position.set(-0.08, 1.7, 0.58);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.08;
      this.bodyGroup.add(body, head, beak, this.wingL, this.wingR, eyeL, eyeR);
    } else {
      // Vayu-Simha Golden Lion
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 1.15), lionMat);
      torso.position.set(0, 0.64, 0);
      const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), goldMat);
      mane.position.set(0, 0.82, 0.54);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.38), lionMat);
      head.position.set(0, 0.84, 0.72);
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeLight);
      eyeL.position.set(-0.1, 0.9, 0.91);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.1;

      const legGeo = new THREE.CylinderGeometry(0.075, 0.055, 0.48, 8);
      [
        [-0.2, 0.24, 0.38],
        [0.2, 0.24, 0.38],
        [-0.2, 0.24, -0.38],
        [0.2, 0.24, -0.38],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, lionMat);
        leg.position.set(lx, ly, lz);
        this.legs.push(leg);
        this.bodyGroup.add(leg);
      });
      this.bodyGroup.add(torso, mane, head, eyeL, eyeR);
    }
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerYaw: number,
    enemies: EnemyEntity[],
    groundHeightAt: (x: number, z: number) => number,
    audio: AudioEngine,
    onPetStrike: (enemy: EnemyEntity, pos: THREE.Vector3, killed: boolean) => void
  ): void {
    if (!this.petId || !this.group.visible) return;
    this.animTime += dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;

    const def = PETS[this.petId];

    // Look for nearest enemy within 13m
    let targetEnemy: EnemyEntity | null = null;
    let bestDist = 13;
    for (const e of enemies) {
      if (!e.alive || e.dying) continue;
      const d = e.position.distanceTo(playerPos);
      if (d < bestDist) {
        bestDist = d;
        targetEnemy = e;
      }
    }

    if (targetEnemy) {
      _targetPos.copy(targetEnemy.position);
    } else {
      // Follow beside player's left flank
      _targetPos.set(
        playerPos.x - Math.cos(playerYaw) * 1.85 - Math.sin(playerYaw) * 1.1,
        playerPos.y,
        playerPos.z + Math.sin(playerYaw) * 1.85 - Math.cos(playerYaw) * 1.1
      );
    }

    _toTarget.subVectors(_targetPos, this.group.position);
    _toTarget.y = 0;
    const dist = _toTarget.length();
    let isMoving = false;

    if (dist > (targetEnemy ? targetEnemy.radius + 1.25 : 0.45)) {
      isMoving = true;
      const spd = targetEnemy ? 8.8 : Math.min(9.5, 4.5 + dist * 0.9);
      _toTarget.normalize();
      this.group.position.x += _toTarget.x * spd * dt;
      this.group.position.z += _toTarget.z * spd * dt;
      const ang = Math.atan2(_toTarget.x, _toTarget.z);
      this.group.rotation.y = ang;
    } else if (targetEnemy) {
      const ang = Math.atan2(
        targetEnemy.position.x - this.group.position.x,
        targetEnemy.position.z - this.group.position.z
      );
      this.group.rotation.y = ang;

      if (this.attackTimer <= 0) {
        this.attackTimer = def.attackCooldown;
        audio.playHit(false);
        const dir = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang));
        const killed = targetEnemy.takeDamage(def.attackDamage, dir, 4.5);
        onPetStrike(targetEnemy, targetEnemy.position.clone(), killed);
        if (killed) {
          audio.playEnemyDeath();
        }
      }
    }

    // Ground & animation
    this.group.position.y = groundHeightAt(this.group.position.x, this.group.position.z);

    if (this.wingL && this.wingR) {
      const flap = Math.sin(this.animTime * 9) * 0.45;
      this.wingL.rotation.z = flap;
      this.wingR.rotation.z = -flap;
      this.bodyGroup.position.y = Math.sin(this.animTime * 3.5) * 0.16;
    } else if (this.legs.length === 4) {
      const swing = isMoving ? Math.sin(this.animTime * 11) * 0.45 : 0;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.legs[3].rotation.x = swing;
    }
  }

  public dispose(): void {
    this.clearModel();
    this.scene.remove(this.group);
  }
}
