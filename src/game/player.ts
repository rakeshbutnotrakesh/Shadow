import * as THREE from 'three';
import { AudioEngine } from './audio';
import { PLAYER_CLASSES } from './classes';
import { ComputedPlayerStats } from './progression';
import { ClassId, ColliderBox } from './types';

export type AttackFormat = 'quick' | 'heavy' | 'spin' | 'dash';

export interface PlayerInputState {
  forward: number; // -1..1
  right: number; // -1..1
  sprint: boolean;
  jump: boolean;
  attack: boolean;
  heavyAttack: boolean;
  spinAttack: boolean;
  dashAttack: boolean;
  sacredAttack: boolean;
  shield: boolean;
  flashlightToggle: boolean;
  interact: boolean;
}

const _moveDir = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _targetQuat = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);

export class PlayerController {
  public readonly group = new THREE.Group();
  public readonly position = this.group.position;
  public velocity = new THREE.Vector3();
  public yaw = 0; // Facing direction in radians
  public grounded = true;
  public radius = 0.45;
  public height = 1.85;

  public health = 100;
  public energy = 100;
  public flashlightOn = true;
  public playerClass: ClassId = 'warrior';

  public attackTimer = 0;
  public attackCooldown = 0;
  public heavyCooldown = 0;
  public spinCooldown = 0;
  public dashCooldown = 0;
  public activeAttackFormat: AttackFormat = 'quick';
  public attackCombo = 0;
  public attackHitTriggered = false;

  public shieldTimer = 0;
  public shieldCooldown = 0;
  public energyAttackCooldown = 0;
  public hurtFlashTimer = 0;

  // Articulated parts for animation
  private bodyPivot = new THREE.Group();
  private torsoGroup = new THREE.Group();
  private headGroup = new THREE.Group();
  private leftArmPivot = new THREE.Group();
  private rightArmPivot = new THREE.Group();
  private leftLegPivot = new THREE.Group();
  private rightLegPivot = new THREE.Group();
  private weaponMountGroup = new THREE.Group();
  private sashMat: THREE.MeshStandardMaterial;
  private swordBladeMat: THREE.MeshStandardMaterial;
  private bronzeMat: THREE.MeshStandardMaterial;
  private shieldMesh: THREE.Mesh;
  private godHaloGroup = new THREE.Group();
  private godHaloInner: THREE.Mesh;
  private godHaloOuter: THREE.Mesh;
  private isGodMode = false;
  private lanternLensMat: THREE.MeshStandardMaterial;
  public flashlight: THREE.SpotLight;
  public flashlightTarget = new THREE.Object3D();
  private ambientAuraLight: THREE.PointLight;

  private walkPhase = 0;
  private stepAccumulator = 0;
  private sprintExhausted = false;

  constructor(scene: THREE.Scene) {
    this.group.add(this.bodyPivot);

    // Materials with calibrated PBR contrast
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x221c2a,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.sashMat = new THREE.MeshStandardMaterial({
      color: 0x8a2c22,
      roughness: 0.72,
      metalness: 0.08,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x8c5b3e,
      roughness: 0.62,
      metalness: 0.02,
    });
    this.bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xc9963b,
      roughness: 0.28,
      metalness: 0.86,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x151218,
      roughness: 0.9,
      metalness: 0.04,
    });
    this.swordBladeMat = new THREE.MeshStandardMaterial({
      color: 0xf4d58d,
      emissive: 0xd4942a,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.92,
    });
    this.lanternLensMat = new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      emissive: 0xffb84d,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
    });

    // 1. Contact shadow beneath feet
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0,0,0,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.025;
    this.group.add(contactShadow);

    // 2. Legs (pivoted at hip y = 0.85)
    const buildLeg = (side: -1 | 1) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.15, 0.85, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.44, 10), clothMat);
      thigh.position.y = -0.22;
      thigh.castShadow = true;
      pivot.add(thigh);

      const greave = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.34, 10), this.bronzeMat);
      greave.position.y = -0.58;
      greave.castShadow = true;
      pivot.add(greave);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.24), hairMat);
      boot.position.set(0, -0.79, 0.04);
      boot.castShadow = true;
      pivot.add(boot);

      return pivot;
    };
    this.leftLegPivot = buildLeg(-1);
    this.rightLegPivot = buildLeg(1);
    this.bodyPivot.add(this.leftLegPivot, this.rightLegPivot);

    // 3. Torso + Waist Sash + Angavastram
    this.torsoGroup.position.set(0, 0.86, 0);
    this.bodyPivot.add(this.torsoGroup);

    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.16, 12), this.bronzeMat);
    waist.position.y = 0.07;
    waist.castShadow = true;
    this.torsoGroup.add(waist);

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.52, 12), clothMat);
    chest.position.y = 0.38;
    chest.castShadow = true;
    this.torsoGroup.add(chest);

    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.34), this.sashMat);
    sash.position.set(0, 0.42, 0.02);
    sash.rotation.z = 0.42;
    sash.castShadow = true;
    this.torsoGroup.add(sash);

    const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.bronzeMat);
    pauldronL.position.set(-0.27, 0.58, 0);
    pauldronL.scale.set(1, 0.7, 1);
    const pauldronR = pauldronL.clone();
    pauldronR.position.x = 0.27;
    this.torsoGroup.add(pauldronL, pauldronR);

    // 4. Head + Topknot + Tilak
    this.headGroup.position.set(0, 0.7, 0);
    this.torsoGroup.add(this.headGroup);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.1, 8), skinMat);
    neck.position.y = 0.02;
    this.headGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 12), skinMat);
    head.position.y = 0.17;
    head.scale.set(0.92, 1.05, 0.98);
    head.castShadow = true;
    this.headGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.162, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    hair.position.set(0, 0.19, -0.02);
    hair.rotation.x = -0.22;
    this.headGroup.add(hair);

    const topknot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), hairMat);
    topknot.position.set(0, 0.34, -0.06);
    this.headGroup.add(topknot);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.016, 6, 18), this.bronzeMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.23;
    this.headGroup.add(band);

    // 5. Left Arm + Sacred Lantern (Flashlight)
    this.leftArmPivot.position.set(-0.3, 0.56, 0);
    this.torsoGroup.add(this.leftArmPivot);

    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.48, 8), skinMat);
    lArm.position.y = -0.22;
    lArm.castShadow = true;
    this.leftArmPivot.add(lArm);

    const lBracer = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.065, 0.18, 8), this.bronzeMat);
    lBracer.position.y = -0.36;
    this.leftArmPivot.add(lBracer);

    // Sacred Brass Lantern
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, -0.49, 0.1);
    const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 8), this.bronzeMat);
    lanternBody.rotation.x = Math.PI / 2;
    const lanternLens = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.03, 10), this.lanternLensMat);
    lanternLens.rotation.x = Math.PI / 2;
    lanternLens.position.z = 0.085;
    lanternGroup.add(lanternBody, lanternLens);
    this.leftArmPivot.add(lanternGroup);
    this.leftArmPivot.rotation.x = -0.65;

    // 6. Right Arm + Dynamic Class Weapon Mount
    this.rightArmPivot.position.set(0.3, 0.56, 0);
    this.torsoGroup.add(this.rightArmPivot);

    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.48, 8), skinMat);
    rArm.position.y = -0.22;
    rArm.castShadow = true;
    this.rightArmPivot.add(rArm);

    const rBracer = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.066, 0.18, 8), this.bronzeMat);
    rBracer.position.y = -0.36;
    this.rightArmPivot.add(rBracer);

    this.weaponMountGroup.position.set(0, -0.46, 0.06);
    this.rightArmPivot.add(this.weaponMountGroup);
    this.rebuildClassWeapon('warrior');

    // 7. Divine Shield Aura
    this.shieldMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 1),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.85,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      })
    );
    this.shieldMesh.position.y = 1.0;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    // 8. Flashlight SpotLight + soft player visibility aura
    this.flashlight = new THREE.SpotLight(0xffe2a8, 4.5, 26, Math.PI / 5.2, 0.45, 1.3);
    this.flashlight.position.set(-0.25, 1.35, 0.35);
    this.flashlight.castShadow = false; // Keep shadow casters <= 3 for crisp frame times
    this.flashlightTarget.position.set(0, 1.0, 12);
    this.group.add(this.flashlight, this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.ambientAuraLight = new THREE.PointLight(0xffb85c, 1.15, 7.5, 1.8);
    this.ambientAuraLight.position.set(0, 1.5, 0.2);
    this.group.add(this.ambientAuraLight);

    // 9. Ascended God Cosmic Halo (Unlocked at Level 100)
    const godMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.9,
    });
    this.godHaloOuter = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.04, 8, 32), godMat);
    this.godHaloInner = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.03, 6, 8), godMat);
    this.godHaloGroup.position.set(0, 1.55, -0.32);
    this.godHaloGroup.add(this.godHaloOuter, this.godHaloInner);
    this.godHaloGroup.visible = false;
    this.torsoGroup.add(this.godHaloGroup);

    scene.add(this.group);
  }

  public setClassAppearance(classId: ClassId): void {
    this.playerClass = classId;
    const cls = PLAYER_CLASSES[classId] ?? PLAYER_CLASSES.warrior;
    this.sashMat.color.setHex(cls.accentHex);
    this.swordBladeMat.emissive.setHex(cls.accentHex);
    this.rebuildClassWeapon(classId);
  }

  public setWeaponAccent(accentHex: number): void {
    this.swordBladeMat.emissive.setHex(accentHex);
    this.swordBladeMat.color.setHex(accentHex);
  }

  private rebuildClassWeapon(classId: ClassId): void {
    while (this.weaponMountGroup.children.length > 0) {
      const child = this.weaponMountGroup.children[0];
      this.weaponMountGroup.remove(child);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (m.material !== this.bronzeMat && m.material !== this.swordBladeMat) {
            if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
            else m.material.dispose();
          }
        }
      });
    }

    this.weaponMountGroup.rotation.set(Math.PI * 0.45, 0, 0);

    if (classId === 'blacksmith') {
      // Heavy Consecrated Forge Hammer
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 1.05, 8), this.bronzeMat);
      shaft.position.y = 0.42;
      const headBlock = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.24), this.bronzeMat);
      headBlock.position.y = 0.96;
      const emberCore = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.14), this.swordBladeMat);
      emberCore.position.y = 0.96;
      this.weaponMountGroup.add(shaft, headBlock, emberCore);
    } else if (classId === 'saint') {
      // Sacred Brahma-Danda Staff with Golden Crescent
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 1.35, 8), this.bronzeMat);
      staff.position.y = 0.55;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.024, 8, 18), this.swordBladeMat);
      ring.position.y = 1.28;
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), this.swordBladeMat);
      orb.position.y = 1.28;
      this.weaponMountGroup.add(staff, ring, orb);
    } else if (classId === 'supporter') {
      // Radiant Lotus Chakra Scepter
      const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.95, 8), this.bronzeMat);
      wand.position.y = 0.4;
      const chakra = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), this.swordBladeMat);
      chakra.position.y = 0.98;
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), this.swordBladeMat);
      gem.position.y = 0.98;
      this.weaponMountGroup.add(wand, chakra, gem);
    } else if (classId === 'archer') {
      // Curved Sacred Kodanda Bow + String + Nocked Arrow
      this.weaponMountGroup.rotation.set(0, 0, 0);
      const bowArc = new THREE.Mesh(
        new THREE.TorusGeometry(0.56, 0.03, 8, 22, Math.PI * 1.08),
        this.bronzeMat
      );
      bowArc.rotation.y = Math.PI / 2;
      bowArc.rotation.z = -Math.PI * 0.54;
      bowArc.position.set(0, 0.1, 0.12);

      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), this.swordBladeMat);
      grip.position.set(0, 0.1, 0.25);

      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.1, 6), this.swordBladeMat);
      string.position.set(0, 0.1, -0.05);

      const nockedArrow = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.78, 6), this.swordBladeMat);
      nockedArrow.rotation.x = Math.PI / 2;
      nockedArrow.position.set(0, 0.1, 0.34);

      this.weaponMountGroup.add(bowArc, grip, string, nockedArrow);
    } else {
      // Warrior Khanda Astra Sword (composite 4-part sword)
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.22, 8), this.bronzeMat);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.06), this.bronzeMat);
      guard.position.y = 0.12;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.96, 0.02), this.swordBladeMat);
      blade.position.y = 0.62;
      blade.castShadow = true;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 4), this.swordBladeMat);
      tip.position.y = 1.18;
      tip.rotation.y = Math.PI / 4;
      this.weaponMountGroup.add(hilt, guard, blade, tip);
    }
  }

  public setGodMode(enabled: boolean): void {
    this.isGodMode = enabled;
    this.godHaloGroup.visible = enabled;
    this.ambientAuraLight.intensity = enabled ? 3.2 : 1.15;
    this.ambientAuraLight.distance = enabled ? 14 : 7.5;
    this.ambientAuraLight.color.setHex(enabled ? 0xfde047 : 0xffb85c);
  }

  public resetForArea(pos: THREE.Vector3, yaw: number): void {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.group.rotation.y = yaw;
    this.grounded = true;
  }

  public getForwardDirection(out = new THREE.Vector3()): THREE.Vector3 {
    out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    return out;
  }

  public update(
    dt: number,
    input: PlayerInputState,
    cameraYaw: number,
    cameraPitch: number,
    stats: ComputedPlayerStats,
    colliders: ColliderBox[],
    groundHeightAt: (x: number, z: number) => number,
    boundsRadius: number,
    audio: AudioEngine,
    isStoneGround: boolean
  ): {
    triggerMeleeHit: boolean;
    attackFormat: AttackFormat;
    comboStep: number;
    lowEnergyFor?: string;
  } {
    let triggerMeleeHit = false;
    let lowEnergyFor: string | undefined;

    // Cooldowns & timers
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.heavyCooldown > 0) this.heavyCooldown = Math.max(0, this.heavyCooldown - dt);
    if (this.spinCooldown > 0) this.spinCooldown = Math.max(0, this.spinCooldown - dt);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.shieldCooldown > 0) this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
    if (this.energyAttackCooldown > 0) this.energyAttackCooldown = Math.max(0, this.energyAttackCooldown - dt);
    if (this.hurtFlashTimer > 0) this.hurtFlashTimer = Math.max(0, this.hurtFlashTimer - dt);

    // Passive Regen
    if (stats.healthRegenPerSec > 0 && this.health > 0 && this.health < stats.maxHealth) {
      this.health = Math.min(stats.maxHealth, this.health + stats.healthRegenPerSec * dt);
    }

    // Flashlight toggle
    if (input.flashlightToggle) {
      this.flashlightOn = !this.flashlightOn;
    }
    this.flashlight.visible = this.flashlightOn;
    this.flashlight.distance = stats.flashlightRange;
    this.flashlight.angle = stats.flashlightAngle;
    this.flashlight.intensity = this.flashlightOn ? stats.flashlightIntensity : 0;
    this.lanternLensMat.emissiveIntensity = this.flashlightOn ? 2.0 : 0.1;

    // Aim flashlight pitch slightly with camera pitch
    this.flashlightTarget.position.set(
      0,
      Math.max(-4, Math.min(5, 1.15 + Math.sin(cameraPitch) * 6)),
      12
    );

    // Shield expiration
    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      this.shieldMesh.visible = this.shieldTimer > 0;
      this.shieldMesh.rotation.y += dt * 1.8;
      this.shieldMesh.rotation.x += dt * 0.9;
    } else {
      this.shieldMesh.visible = false;
    }

    if (this.isGodMode) {
      this.godHaloOuter.rotation.z += dt * 1.3;
      this.godHaloInner.rotation.z -= dt * 2.1;
    }

    // Movement vector relative to camera yaw
    _camForward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw)).normalize();
    _camRight.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw)).normalize();

    _moveDir.set(0, 0, 0);
    _moveDir.addScaledVector(_camForward, input.forward);
    _moveDir.addScaledVector(_camRight, -input.right);

    const isMoving = _moveDir.lengthSq() > 0.01;
    if (isMoving) {
      _moveDir.normalize();
    }

    if (this.energy <= 1) {
      this.sprintExhausted = true;
    } else if (this.energy >= 12) {
      this.sprintExhausted = false;
    }
    const canSprint = input.sprint && isMoving && !this.sprintExhausted && this.energy > 1;
    if (canSprint) {
      this.energy = Math.max(0, this.energy - stats.sprintCostPerSec * dt);
    } else {
      this.energy = Math.min(stats.maxEnergy, this.energy + stats.energyRegenPerSec * dt);
    }

    const baseSpeed = canSprint ? 8.6 : 5.1;
    const speed = baseSpeed * stats.moveSpeedMultiplier * (this.attackTimer > 0.12 ? 0.65 : 1.0);

    const targetVx = _moveDir.x * speed;
    const targetVz = _moveDir.z * speed;

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, 14, dt);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVz, 14, dt);

    // Jump & gravity
    if (input.jump && this.grounded) {
      this.velocity.y = 7.6;
      this.grounded = false;
    }
    this.velocity.y -= 20.5 * dt;

    // Integrate X/Z with sliding collision
    const nextX = this.position.x + this.velocity.x * dt;
    const nextZ = this.position.z + this.velocity.z * dt;
    const resolved = this.resolveCollisions(nextX, nextZ, colliders, boundsRadius);
    this.position.x = resolved.x;
    this.position.z = resolved.z;

    // Integrate Y against ground height with smooth step-up on stairs/slopes
    const wasGrounded = this.grounded;
    const fallSpeed = -this.velocity.y;
    const prevY = this.position.y;
    this.position.y += this.velocity.y * dt;
    const groundY = groundHeightAt(this.position.x, this.position.z);

    if (wasGrounded && this.velocity.y <= 0.1 && groundY >= prevY - 0.18 && groundY <= prevY + 0.72) {
      this.position.y = THREE.MathUtils.damp(prevY, groundY, 24, dt);
      this.velocity.y = 0;
      this.grounded = true;
    } else if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.grounded = true;
      if (!wasGrounded && fallSpeed > 5.5) {
        audio.playFootstep(isStoneGround, true);
      }
    } else {
      this.grounded = false;
    }

    // Rotate character toward movement direction (or camera forward during attack)
    if (this.attackTimer > 0) {
      this.yaw = cameraYaw;
    } else if (isMoving) {
      const targetYaw = Math.atan2(_moveDir.x, _moveDir.z);
      _targetQuat.setFromAxisAngle(_upAxis, targetYaw);
      this.group.quaternion.slerp(_targetQuat, 1 - Math.exp(-12 * dt));
      this.yaw = Math.atan2(
        2 * (this.group.quaternion.y * this.group.quaternion.w),
        1 - 2 * this.group.quaternion.y * this.group.quaternion.y
      );
    }
    if (this.attackTimer > 0) {
      _targetQuat.setFromAxisAngle(_upAxis, this.yaw);
      this.group.quaternion.slerp(_targetQuat, 1 - Math.exp(-18 * dt));
    }

    // Attack Formats Initiation
    if (input.heavyAttack && this.heavyCooldown <= 0 && this.attackTimer <= 0.1) {
      if (this.energy >= 14) {
        this.energy -= 14;
        this.activeAttackFormat = 'heavy';
        this.attackTimer = 0.44;
        this.heavyCooldown = 1.6 * stats.abilityCooldownMultiplier;
        this.attackCooldown = Math.max(this.attackCooldown, 0.36);
        this.attackHitTriggered = false;
        if (this.playerClass !== 'archer') audio.playSwing();
      } else {
        lowEnergyFor = 'Need 14 Energy for Heavy Attack';
      }
    } else if (input.spinAttack && this.spinCooldown <= 0 && this.attackTimer <= 0.1) {
      if (this.energy >= 18) {
        this.energy -= 18;
        this.activeAttackFormat = 'spin';
        this.attackTimer = 0.48;
        this.spinCooldown = 2.6 * stats.abilityCooldownMultiplier;
        this.attackCooldown = Math.max(this.attackCooldown, 0.4);
        this.attackHitTriggered = false;
        if (this.playerClass !== 'archer') audio.playSwing();
      } else {
        lowEnergyFor = 'Need 18 Energy for Spin Burst';
      }
    } else if (input.dashAttack && this.dashCooldown <= 0 && this.attackTimer <= 0.1) {
      if (this.energy >= 12) {
        this.energy -= 12;
        this.activeAttackFormat = 'dash';
        this.attackTimer = 0.32;
        this.dashCooldown = 2.0 * stats.abilityCooldownMultiplier;
        this.attackCooldown = Math.max(this.attackCooldown, 0.3);
        this.attackHitTriggered = false;
        const dashSign = this.playerClass === 'archer' ? -15 : 19;
        this.velocity.x = _camForward.x * dashSign;
        this.velocity.z = _camForward.z * dashSign;
        if (this.playerClass !== 'archer') audio.playSwing();
      } else {
        lowEnergyFor = 'Need 12 Energy for Dash Strike';
      }
    } else if (input.attack && this.attackCooldown <= 0) {
      this.activeAttackFormat = 'quick';
      this.attackTimer = 0.34;
      this.attackCooldown = stats.attackCooldown;
      this.attackCombo = (this.attackCombo + 1) % 3;
      this.attackHitTriggered = false;
      if (this.playerClass !== 'archer') {
        audio.playSwing();
      }
    }

    if (this.attackTimer > 0) {
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      const hitAt =
        this.activeAttackFormat === 'heavy'
          ? 0.25
          : this.activeAttackFormat === 'spin'
          ? 0.3
          : this.activeAttackFormat === 'dash'
          ? 0.18
          : 0.22;
      if (!this.attackHitTriggered && this.attackTimer <= hitAt) {
        this.attackHitTriggered = true;
        triggerMeleeHit = true;
      }
    }

    // Animate procedural rig
    this.animateRig(dt, isMoving, canSprint, audio, isStoneGround);

    return {
      triggerMeleeHit,
      attackFormat: this.activeAttackFormat,
      comboStep: this.attackCombo,
      lowEnergyFor,
    };
  }

  private animateRig(
    dt: number,
    isMoving: boolean,
    isSprinting: boolean,
    audio: AudioEngine,
    isStoneGround: boolean
  ): void {
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);

    if (isMoving && this.grounded) {
      const strideRate = isSprinting ? 13 : 8.5;
      this.walkPhase += dt * strideRate;
      this.stepAccumulator += dt * strideRate;
      if (this.stepAccumulator >= Math.PI) {
        this.stepAccumulator -= Math.PI;
        audio.playFootstep(isStoneGround, isSprinting);
      }
      const swing = Math.sin(this.walkPhase) * (isSprinting ? 0.72 : 0.48);
      this.leftLegPivot.rotation.x = swing;
      this.rightLegPivot.rotation.x = -swing;
      this.bodyPivot.position.y = Math.abs(Math.cos(this.walkPhase)) * 0.05;
      this.torsoGroup.rotation.x = isSprinting ? 0.16 : 0.06;
    } else if (!this.grounded) {
      this.leftLegPivot.rotation.x = THREE.MathUtils.damp(this.leftLegPivot.rotation.x, 0.35, 10, dt);
      this.rightLegPivot.rotation.x = THREE.MathUtils.damp(this.rightLegPivot.rotation.x, -0.28, 10, dt);
      this.bodyPivot.position.y = THREE.MathUtils.damp(this.bodyPivot.position.y, 0, 10, dt);
    } else {
      this.walkPhase += dt * 2.2;
      this.leftLegPivot.rotation.x = THREE.MathUtils.damp(this.leftLegPivot.rotation.x, 0, 10, dt);
      this.rightLegPivot.rotation.x = THREE.MathUtils.damp(this.rightLegPivot.rotation.x, 0, 10, dt);
      this.bodyPivot.position.y = Math.sin(this.walkPhase) * 0.015;
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0, 10, dt);
    }

    // Left arm holds lantern forward steadily
    const lanternBob = isMoving ? Math.sin(this.walkPhase) * 0.08 : Math.sin(this.walkPhase) * 0.02;
    this.leftArmPivot.rotation.x = -0.72 + lanternBob;

    // Right arm swing / bow aim / multi-format animation
    if (this.attackTimer > 0) {
      if (this.playerClass === 'archer') {
        this.rightArmPivot.rotation.x = this.activeAttackFormat === 'heavy' ? -1.58 : -1.42;
        this.rightArmPivot.rotation.z = this.activeAttackFormat === 'spin' ? 0.35 : 0.05;
        this.torsoGroup.rotation.y = -0.22;
        this.bodyPivot.rotation.y = 0;
        this.swordBladeMat.emissiveIntensity = this.activeAttackFormat === 'heavy' ? 2.6 : 1.65;
      } else if (this.activeAttackFormat === 'spin') {
        const p = 1 - this.attackTimer / 0.48;
        this.bodyPivot.rotation.y = p * Math.PI * 2;
        this.rightArmPivot.rotation.x = -1.35;
        this.rightArmPivot.rotation.z = 1.15;
        this.torsoGroup.rotation.y = 0.4;
        this.swordBladeMat.emissiveIntensity = 2.2;
      } else if (this.activeAttackFormat === 'heavy') {
        const p = 1 - this.attackTimer / 0.44;
        const overhead = THREE.MathUtils.lerp(-2.55, 0.45, Math.min(1, p * 1.35));
        this.bodyPivot.rotation.y = 0;
        this.rightArmPivot.rotation.x = overhead;
        this.rightArmPivot.rotation.z = 0.05;
        this.torsoGroup.rotation.x = p > 0.45 ? 0.28 : -0.15;
        this.swordBladeMat.emissiveIntensity = 2.4;
      } else if (this.activeAttackFormat === 'dash') {
        this.bodyPivot.rotation.y = 0;
        this.rightArmPivot.rotation.x = -1.55;
        this.rightArmPivot.rotation.z = 0.1;
        this.torsoGroup.rotation.x = 0.32;
        this.torsoGroup.rotation.y = -0.35;
        this.swordBladeMat.emissiveIntensity = 2.0;
      } else {
        this.bodyPivot.rotation.y = 0;
        const p = 1 - this.attackTimer / 0.34; // 0 -> 1
        const swingAngle =
          this.attackCombo === 0
            ? THREE.MathUtils.lerp(-1.8, 0.9, Math.min(1, p * 1.45))
            : this.attackCombo === 1
            ? THREE.MathUtils.lerp(0.9, -1.6, Math.min(1, p * 1.45))
            : THREE.MathUtils.lerp(-2.2, 1.3, Math.min(1, p * 1.5));
        this.rightArmPivot.rotation.x = -1.35;
        this.rightArmPivot.rotation.z = swingAngle * 0.65;
        this.torsoGroup.rotation.y = swingAngle * 0.35;
        this.swordBladeMat.emissiveIntensity = this.attackCombo === 2 ? 2.0 : 1.4;
      }
    } else {
      this.bodyPivot.rotation.y = THREE.MathUtils.damp(this.bodyPivot.rotation.y, 0, 14, dt);
      const armWalk = isMoving ? -Math.sin(this.walkPhase) * 0.4 * Math.min(1, horizSpeed / 5) : 0;
      const baseHold = this.playerClass === 'archer' ? -0.55 : armWalk - 0.18;
      this.rightArmPivot.rotation.x = THREE.MathUtils.damp(this.rightArmPivot.rotation.x, baseHold, 12, dt);
      this.rightArmPivot.rotation.z = THREE.MathUtils.damp(this.rightArmPivot.rotation.z, 0.08, 12, dt);
      this.torsoGroup.rotation.y = THREE.MathUtils.damp(this.torsoGroup.rotation.y, 0, 12, dt);
      this.swordBladeMat.emissiveIntensity = 0.45;
    }
  }

  private resolveCollisions(
    x: number,
    z: number,
    colliders: ColliderBox[],
    boundsRadius: number
  ): { x: number; z: number } {
    let rx = x;
    let rz = z;
    const r = this.radius;

    // Circular world boundary
    const distSq = rx * rx + rz * rz;
    const maxR = boundsRadius - r;
    if (distSq > maxR * maxR) {
      const d = Math.sqrt(distSq);
      rx = (rx / d) * maxR;
      rz = (rz / d) * maxR;
    }

    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (this.position.y > c.y + c.height) continue;

      if (c.type === 'cylinder') {
        const cr = (c.radius ?? 0.6) + r;
        const dx = rx - c.x;
        const dz = rz - c.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < cr * cr && d2 > 0.00001) {
          const d = Math.sqrt(d2);
          const push = cr - d;
          rx += (dx / d) * push;
          rz += (dz / d) * push;
        }
      } else {
        const hw = (c.halfW ?? 1) + r;
        const hd = (c.halfD ?? 1) + r;
        const dx = rx - c.x;
        const dz = rz - c.z;
        if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
          const ox = hw - Math.abs(dx);
          const oz = hd - Math.abs(dz);
          if (ox < oz) {
            rx += dx >= 0 ? ox : -ox;
          } else {
            rz += dz >= 0 ? oz : -oz;
          }
        }
      }
    }

    return { x: rx, z: rz };
  }
}
