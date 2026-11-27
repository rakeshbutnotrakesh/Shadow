import * as THREE from 'three';
import { AudioEngine } from './audio';
import { EnemyEntity } from './enemy';
import { ColliderBox } from './types';

interface Projectile {
  mesh: THREE.Object3D;
  vel: THREE.Vector3;
  damage: number;
  life: number;
  fromPlayer: boolean;
  isArrow?: boolean;
  pierce?: boolean;
  gravity?: number;
  hitIds: Set<string>;
}

interface Shockwave {
  mesh: THREE.Mesh;
  origin: THREE.Vector3;
  radius: number;
  maxRadius: number;
  speed: number;
  damage: number;
  hitPlayer: boolean;
}

interface ParticleBurst {
  active: boolean;
  points: THREE.Points;
  posAttr: THREE.BufferAttribute;
  velocities: Float32Array;
  count: number;
  life: number;
  maxLife: number;
}

interface YaggaKund {
  group: THREE.Group;
  origin: THREE.Vector3;
  life: number;
  maxLife: number;
  pulseAccum: number;
  damagePerPulse: number;
  flames: THREE.Mesh[];
}

const _tmpVec = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);
const MAX_BURST_POOL = 14;
const MAX_BURST_PARTICLES = 24;
const MAX_SHOCKWAVES = 10;

// Shared geometries & materials to prevent WebGL shader compilation and GPU buffer churn on hits/kills
const SHARED_GEOS = {
  arrowShaft: new THREE.CylinderGeometry(0.022, 0.022, 0.95, 6),
  arrowTip: new THREE.ConeGeometry(0.055, 0.22, 6),
  arrowFletch: new THREE.BoxGeometry(0.14, 0.02, 0.18),
  pierceShaft: new THREE.CylinderGeometry(0.036, 0.036, 1.3, 6),
  pierceTip: new THREE.ConeGeometry(0.085, 0.3, 6),
  ringGround: new THREE.RingGeometry(0.55, 0.95, 24),
  ringBoss: new THREE.RingGeometry(0.8, 1.35, 32),
  sacredWave: new THREE.TorusGeometry(0.52, 0.11, 8, 20),
  enemyOrb: new THREE.OctahedronGeometry(0.28, 1),
  yaggaBase: new THREE.CylinderGeometry(0.95, 1.15, 0.26, 4),
  yaggaRing: new THREE.RingGeometry(5.3, 5.7, 32),
  yaggaFlameMain: new THREE.ConeGeometry(0.32, 1.05, 6),
  yaggaFlameSide: new THREE.ConeGeometry(0.18, 0.65, 6),
};

const SHARED_MATS = {
  arrowShaft: new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  }),
  arrowTip: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfbbf24,
    emissiveIntensity: 2.0,
    metalness: 0.9,
    roughness: 0.15,
  }),
  arrowFletch: new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 1.2,
  }),
  pierceShaft: new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  }),
  pierceTip: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfde047,
    emissiveIntensity: 2.8,
    metalness: 0.9,
    roughness: 0.1,
  }),
  sacredWave: new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  }),
  yaggaBase: new THREE.MeshStandardMaterial({
    color: 0x8b6b46,
    roughness: 0.78,
    metalness: 0.1,
  }),
  yaggaRing: new THREE.MeshBasicMaterial({
    color: 0xf97316,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  }),
  yaggaFlame: new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf97316,
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.9,
  }),
};

const orbMaterialCache = new Map<number, THREE.MeshStandardMaterial>();
function getOrbMaterial(color: number): THREE.MeshStandardMaterial {
  let mat = orbMaterialCache.get(color);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 2.2,
    });
    orbMaterialCache.set(color, mat);
  }
  return mat;
}

export class CombatSystem {
  private scene: THREE.Scene;
  private projectiles: Projectile[] = [];
  private shockwaves: Shockwave[] = [];
  private burstPool: ParticleBurst[] = [];
  private burstCursor = 0;
  private yaggas: YaggaKund[] = [];
  private warmupGroup: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initBurstPool();
  }

  private initBurstPool(): void {
    for (let i = 0; i < MAX_BURST_POOL; i++) {
      const positions = new Float32Array(MAX_BURST_PARTICLES * 3);
      const velocities = new Float32Array(MAX_BURST_PARTICLES * 3);
      const geom = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(positions, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geom.setAttribute('position', posAttr);
      geom.setDrawRange(0, 0);

      const mat = new THREE.PointsMaterial({
        color: 0xfbbf24,
        size: 0.22,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const points = new THREE.Points(geom, mat);
      points.visible = false;
      points.frustumCulled = false;
      this.scene.add(points);

      this.burstPool.push({
        active: false,
        points,
        posAttr,
        velocities,
        count: 0,
        life: 0,
        maxLife: 0.55,
      });
    }
  }

  /**
   * Adds temporary off-camera meshes using shared materials before initial renderer.compile()
   * so mid-combat hits and kills trigger zero WebGL shader compilation stalls.
   */
  public prepareWarmUp(): void {
    if (this.warmupGroup) return;
    const g = new THREE.Group();
    g.position.set(0, -100, 0);

    const m1 = new THREE.Mesh(SHARED_GEOS.arrowShaft, SHARED_MATS.arrowShaft);
    const m2 = new THREE.Mesh(SHARED_GEOS.arrowTip, SHARED_MATS.arrowTip);
    const m3 = new THREE.Mesh(SHARED_GEOS.arrowFletch, SHARED_MATS.arrowFletch);
    const m4 = new THREE.Mesh(SHARED_GEOS.sacredWave, SHARED_MATS.sacredWave);
    const m5 = new THREE.Mesh(SHARED_GEOS.enemyOrb, getOrbMaterial(0xef4444));
    const m6 = new THREE.Mesh(
      SHARED_GEOS.ringGround,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    const m7 = new THREE.Mesh(SHARED_GEOS.yaggaBase, SHARED_MATS.yaggaBase);
    const m8 = new THREE.Mesh(SHARED_GEOS.yaggaFlameMain, SHARED_MATS.yaggaFlame);
    g.add(m1, m2, m3, m4, m5, m6, m7, m8);

    // Briefly unhide one pooled burst for shader compile
    if (this.burstPool[0]) {
      this.burstPool[0].points.visible = true;
      this.burstPool[0].points.geometry.setDrawRange(0, 1);
    }

    this.scene.add(g);
    this.warmupGroup = g;
  }

  public finishWarmUp(): void {
    if (this.warmupGroup) {
      this.scene.remove(this.warmupGroup);
      this.warmupGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          const mat = (c as THREE.Mesh).material;
          if (
            mat !== SHARED_MATS.arrowShaft &&
            mat !== SHARED_MATS.arrowTip &&
            mat !== SHARED_MATS.arrowFletch &&
            mat !== SHARED_MATS.sacredWave &&
            mat !== SHARED_MATS.yaggaBase &&
            mat !== SHARED_MATS.yaggaFlame &&
            mat !== getOrbMaterial(0xef4444)
          ) {
            (mat as THREE.Material).dispose();
          }
        }
      });
      this.warmupGroup = null;
    }
    if (this.burstPool[0] && !this.burstPool[0].active) {
      this.burstPool[0].points.visible = false;
      this.burstPool[0].points.geometry.setDrawRange(0, 0);
    }
  }

  public performPlayerMelee(
    playerPos: THREE.Vector3,
    playerForward: THREE.Vector3,
    damage: number,
    enemies: EnemyEntity[],
    audio: AudioEngine,
    onEnemyKilled: (enemy: EnemyEntity) => void,
    onHitFeedback: () => void,
    reach = 3.15,
    knockback = 6.5,
    burstColor = 0xef4444
  ): void {
    let hitAny = false;
    let killedAny = false;

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.dying) continue;
      _tmpVec.subVectors(enemy.position, playerPos);
      _tmpVec.y = 0;
      const dist = _tmpVec.length();
      if (dist > reach + enemy.radius) continue;

      const dir = dist > 0.001 ? _tmpVec.clone().normalize() : new THREE.Vector3(0, 0, 1);
      const dot = dir.dot(playerForward);
      if (dot < -0.15 && dist > 1.2) continue;

      hitAny = true;
      const killed = enemy.takeDamage(damage, dir, knockback);
      this.spawnBurst(
        _tmpVec.set(enemy.position.x, enemy.position.y + 1.2, enemy.position.z),
        killed ? 0xfbbf24 : burstColor,
        killed ? 18 : 10
      );
      if (killed) {
        killedAny = true;
        onEnemyKilled(enemy);
      }
    }

    if (killedAny) {
      audio.playEnemyDeath();
    }
    if (hitAny) {
      audio.playHit(knockback >= 9);
      onHitFeedback();
    }
  }

  private createArrowMesh(withFletch: boolean): THREE.Group {
    const arrowGroup = new THREE.Group();
    const shaft = new THREE.Mesh(SHARED_GEOS.arrowShaft, SHARED_MATS.arrowShaft);
    shaft.rotation.x = Math.PI / 2;
    const tip = new THREE.Mesh(SHARED_GEOS.arrowTip, SHARED_MATS.arrowTip);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.56;
    if (withFletch) {
      const fletch = new THREE.Mesh(SHARED_GEOS.arrowFletch, SHARED_MATS.arrowFletch);
      fletch.position.z = -0.4;
      arrowGroup.add(shaft, tip, fletch);
    } else {
      arrowGroup.add(shaft, tip);
    }
    return arrowGroup;
  }

  public spawnPlayerArrow(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    audio: AudioEngine,
    playSfx = true
  ): void {
    if (playSfx) audio.playBowRelease();

    const arrowGroup = this.createArrowMesh(true);
    const flatDir = direction.clone().setY(0).normalize();
    arrowGroup.position.set(origin.x, origin.y + 1.32, origin.z).addScaledVector(flatDir, 0.7);
    arrowGroup.rotation.y = Math.atan2(flatDir.x, flatDir.z);
    this.scene.add(arrowGroup);

    const vel = flatDir.multiplyScalar(30);
    vel.y = 1.05; // Subtle upward launch so arrow arcs realistically across distance
    this.projectiles.push({
      mesh: arrowGroup,
      vel,
      damage,
      life: 1.5,
      fromPlayer: true,
      isArrow: true,
      gravity: 3.2,
      hitIds: new Set(),
    });
  }

  public spawnPiercingArrow(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    audio: AudioEngine
  ): void {
    audio.playBowRelease();
    const arrowGroup = new THREE.Group();
    const shaft = new THREE.Mesh(SHARED_GEOS.pierceShaft, SHARED_MATS.pierceShaft);
    shaft.rotation.x = Math.PI / 2;
    const tip = new THREE.Mesh(SHARED_GEOS.pierceTip, SHARED_MATS.pierceTip);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.72;
    arrowGroup.add(shaft, tip);

    const flatDir = direction.clone().setY(0).normalize();
    arrowGroup.position.set(origin.x, origin.y + 1.32, origin.z).addScaledVector(flatDir, 0.75);
    arrowGroup.rotation.y = Math.atan2(flatDir.x, flatDir.z);
    this.scene.add(arrowGroup);

    const vel = flatDir.multiplyScalar(38);
    vel.y = 0.45;
    this.projectiles.push({
      mesh: arrowGroup,
      vel,
      damage,
      life: 1.35,
      fromPlayer: true,
      isArrow: true,
      pierce: true,
      gravity: 1.4,
      hitIds: new Set(),
    });
  }

  public spawnArrowFan(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    audio: AudioEngine
  ): void {
    const flatBase = direction.clone().setY(0).normalize();
    const angles = [-0.18, 0, 0.18];
    angles.forEach((ang, idx) => {
      const dir = flatBase.clone().applyAxisAngle(_yAxis, ang);
      this.spawnPlayerArrow(origin, dir, damage, audio, idx === 0);
    });
  }

  public spawnGroundRingEffect(origin: THREE.Vector3, maxRadius: number, color: number): void {
    if (this.shockwaves.length >= MAX_SHOCKWAVES) return;
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(SHARED_GEOS.ringGround, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(origin.x, origin.y + 0.14, origin.z);
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      origin: origin.clone(),
      radius: 0.7,
      maxRadius,
      speed: maxRadius * 3.4,
      damage: 0,
      hitPlayer: true,
    });
  }

  public spawnPlayerArrowVolley(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    audio: AudioEngine
  ): void {
    const flatBase = direction.clone().setY(0).normalize();
    const angles = [-0.28, -0.14, 0, 0.14, 0.28];
    angles.forEach((ang, idx) => {
      const dir = flatBase.clone().applyAxisAngle(_yAxis, ang);
      this.spawnPlayerArrow(origin, dir, damage, audio, idx === 0);
    });
  }

  public performRadialDamage(
    center: THREE.Vector3,
    radius: number,
    damage: number,
    knockback: number,
    burstColor: number,
    enemies: EnemyEntity[],
    audio: AudioEngine,
    onEnemyKilled: (enemy: EnemyEntity) => void
  ): number {
    let hits = 0;
    let killedAny = false;
    for (const enemy of enemies) {
      if (!enemy.alive || enemy.dying) continue;
      _tmpVec.subVectors(enemy.position, center);
      _tmpVec.y = 0;
      const dist = _tmpVec.length();
      if (dist > radius + enemy.radius) continue;
      hits += 1;
      const dir = dist > 0.01 ? _tmpVec.clone().normalize() : new THREE.Vector3(0, 0, 1);
      const killed = enemy.takeDamage(damage, dir, knockback);
      this.spawnBurst(
        _tmpVec.set(enemy.position.x, enemy.position.y + 1.1, enemy.position.z),
        killed ? 0xfbbf24 : burstColor,
        killed ? 18 : 10
      );
      if (killed) {
        killedAny = true;
        onEnemyKilled(enemy);
      }
    }
    if (killedAny) {
      audio.playEnemyDeath();
    }
    if (hits > 0) {
      audio.playHit(true);
    }
    return hits;
  }

  public spawnYaggaKund(origin: THREE.Vector3, damagePerPulse: number): void {
    const group = new THREE.Group();
    group.position.set(origin.x, origin.y + 0.05, origin.z);

    const base = new THREE.Mesh(SHARED_GEOS.yaggaBase, SHARED_MATS.yaggaBase);
    base.rotation.y = Math.PI / 4;
    base.position.y = 0.13;
    group.add(base);

    const ring = new THREE.Mesh(SHARED_GEOS.yaggaRing, SHARED_MATS.yaggaRing);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    group.add(ring);

    const flames: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.36;
      const cone = new THREE.Mesh(
        i === 0 ? SHARED_GEOS.yaggaFlameMain : SHARED_GEOS.yaggaFlameSide,
        SHARED_MATS.yaggaFlame
      );
      cone.position.set(Math.cos(a) * r, i === 0 ? 0.65 : 0.48, Math.sin(a) * r);
      group.add(cone);
      flames.push(cone);
    }

    this.scene.add(group);
    this.yaggas.push({
      group,
      origin: origin.clone(),
      life: 8.5,
      maxLife: 8.5,
      pulseAccum: 0.4,
      damagePerPulse,
      flames,
    });
  }

  public hasActiveYagga(): boolean {
    return this.yaggas.length > 0;
  }

  public spawnSacredWave(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    audio: AudioEngine
  ): void {
    audio.playSacredWave();
    const mesh = new THREE.Mesh(SHARED_GEOS.sacredWave, SHARED_MATS.sacredWave);
    mesh.position.set(origin.x, origin.y + 1.15, origin.z);
    mesh.rotation.x = Math.PI / 2;
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      vel: direction.clone().setY(0).normalize().multiplyScalar(17),
      damage,
      life: 1.5,
      fromPlayer: true,
      hitIds: new Set(),
    });
  }

  public spawnEnemyOrb(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    speed: number,
    color: number
  ): void {
    const mesh = new THREE.Mesh(SHARED_GEOS.enemyOrb, getOrbMaterial(color));
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      vel: direction.clone().setY(0).normalize().multiplyScalar(speed),
      damage,
      life: 3.4,
      fromPlayer: false,
      hitIds: new Set(),
    });
  }

  public spawnBossShockwave(origin: THREE.Vector3, damage: number): void {
    if (this.shockwaves.length >= MAX_SHOCKWAVES) return;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(SHARED_GEOS.ringBoss, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(origin.x, origin.y + 0.14, origin.z);
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      origin: origin.clone(),
      radius: 1.0,
      maxRadius: 20,
      speed: 9.5,
      damage,
      hitPlayer: false,
    });
  }

  public spawnBurst(pos: THREE.Vector3, color: number, requestedCount = 14): void {
    const count = Math.min(MAX_BURST_PARTICLES, Math.max(4, requestedCount));
    let slot: ParticleBurst | undefined;
    for (let i = 0; i < this.burstPool.length; i++) {
      if (!this.burstPool[i].active) {
        slot = this.burstPool[i];
        break;
      }
    }
    if (!slot) {
      slot = this.burstPool[this.burstCursor % this.burstPool.length];
      this.burstCursor += 1;
    }

    const posArr = slot.posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3] = pos.x;
      posArr[i * 3 + 1] = pos.y;
      posArr[i * 3 + 2] = pos.z;

      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4.5;
      slot.velocities[i * 3] = Math.cos(angle) * spd;
      slot.velocities[i * 3 + 1] = 2 + Math.random() * 4;
      slot.velocities[i * 3 + 2] = Math.sin(angle) * spd;
    }

    slot.active = true;
    slot.count = count;
    slot.life = 0.55;
    slot.maxLife = 0.55;
    slot.posAttr.needsUpdate = true;
    slot.points.geometry.setDrawRange(0, count);
    const mat = slot.points.material as THREE.PointsMaterial;
    mat.color.setHex(color);
    mat.opacity = 1;
    slot.points.visible = true;
  }

  private projectileHitsWall(pos: THREE.Vector3, colliders: ColliderBox[]): boolean {
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.blocksCamera === false) continue;
      if (pos.y < c.y || pos.y > c.y + c.height) continue;
      if (c.type === 'cylinder') {
        const r = (c.radius ?? 0.6) + 0.16;
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        if (dx * dx + dz * dz < r * r) return true;
      } else {
        const hw = (c.halfW ?? 1) + 0.16;
        const hd = (c.halfD ?? 1) + 0.16;
        if (Math.abs(pos.x - c.x) < hw && Math.abs(pos.z - c.z) < hd) return true;
      }
    }
    return false;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerRadius: number,
    playerGrounded: boolean,
    enemies: EnemyEntity[],
    colliders: ColliderBox[],
    groundHeightAt: (x: number, z: number) => number,
    audio: AudioEngine,
    onPlayerDamaged: (rawDamage: number) => void,
    onEnemyKilled: (enemy: EnemyEntity) => void
  ): void {
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.gravity) {
        p.vel.y -= p.gravity * dt;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.isArrow) {
        const horiz = Math.hypot(p.vel.x, p.vel.z);
        if (horiz > 0.1) {
          p.mesh.rotation.x = -Math.atan2(p.vel.y, horiz);
        }
      } else {
        p.mesh.rotation.z += dt * 8;
        p.mesh.rotation.y += dt * 6;
      }

      let remove = p.life <= 0;
      if (!remove && p.mesh.position.y <= groundHeightAt(p.mesh.position.x, p.mesh.position.z) + 0.05) {
        this.spawnBurst(p.mesh.position, p.isArrow ? 0xd97706 : 0x38bdf8, 6);
        remove = true;
      }
      if (!remove && this.projectileHitsWall(p.mesh.position, colliders)) {
        this.spawnBurst(p.mesh.position, p.fromPlayer ? 0xfbbf24 : 0xef4444, 7);
        remove = true;
      }

      if (!remove && p.fromPlayer) {
        for (const enemy of enemies) {
          if (!enemy.alive || enemy.dying || p.hitIds.has(enemy.id)) continue;
          const dx = enemy.position.x - p.mesh.position.x;
          const dz = enemy.position.z - p.mesh.position.z;
          const hitR = enemy.radius + (p.isArrow ? 0.55 : 0.85);
          if (dx * dx + dz * dz <= hitR * hitR) {
            p.hitIds.add(enemy.id);
            const dir = p.vel.clone().setY(0).normalize();
            const killed = enemy.takeDamage(p.damage, dir, p.isArrow ? 4.5 : 7.5);
            audio.playHit(true);
            this.spawnBurst(p.mesh.position, p.isArrow ? 0x22c55e : 0xfbbf24, 12);
            if (killed) {
              audio.playEnemyDeath();
              onEnemyKilled(enemy);
            }
            if (p.isArrow && !p.pierce) {
              remove = true;
              break;
            }
          }
        }
      } else if (!remove && !p.fromPlayer) {
        const dx = playerPos.x - p.mesh.position.x;
        const dz = playerPos.z - p.mesh.position.z;
        const dy = playerPos.y + 1.0 - p.mesh.position.y;
        const hitR = playerRadius + 0.4;
        if (dx * dx + dz * dz <= hitR * hitR && Math.abs(dy) < 1.35) {
          onPlayerDamaged(p.damage);
          this.spawnBurst(p.mesh.position, 0xef4444, 10);
          remove = true;
        }
      }

      if (remove) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      const scale = sw.radius;
      sw.mesh.scale.set(scale, scale, 1);
      const mat = sw.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - sw.radius / sw.maxRadius);

      if (!sw.hitPlayer && playerGrounded && playerPos.y < sw.origin.y + 0.7) {
        const dist = Math.hypot(playerPos.x - sw.origin.x, playerPos.z - sw.origin.z);
        if (Math.abs(dist - sw.radius) < 0.9) {
          sw.hitPlayer = true;
          onPlayerDamaged(sw.damage);
        }
      }

      if (sw.radius >= sw.maxRadius) {
        this.scene.remove(sw.mesh);
        mat.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // Update pooled particle bursts
    for (let i = 0; i < this.burstPool.length; i++) {
      const b = this.burstPool[i];
      if (!b.active) continue;
      b.life -= dt;
      if (b.life <= 0) {
        b.active = false;
        b.points.visible = false;
        b.points.geometry.setDrawRange(0, 0);
        continue;
      }

      const posArr = b.posAttr.array as Float32Array;
      for (let j = 0; j < b.count; j++) {
        const idx = j * 3;
        b.velocities[idx + 1] -= 9.8 * dt;
        posArr[idx] += b.velocities[idx] * dt;
        posArr[idx + 1] += b.velocities[idx + 1] * dt;
        posArr[idx + 2] += b.velocities[idx + 2] * dt;
      }
      b.posAttr.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = Math.max(0, b.life / b.maxLife);
    }

    // Update Saint's active 3D Yagga Havan Kunds
    const timeFactor = performance.now() * 0.012;
    for (let i = this.yaggas.length - 1; i >= 0; i--) {
      const y = this.yaggas[i];
      y.life -= dt;
      y.pulseAccum -= dt;
      y.flames.forEach((fl, idx) => {
        fl.scale.y = 0.85 + Math.sin(timeFactor + idx * 1.4) * 0.25;
        fl.rotation.y += dt * 2.5;
      });
      if (y.pulseAccum <= 0) {
        y.pulseAccum = 0.85;
        this.performRadialDamage(
          y.origin,
          6.0,
          y.damagePerPulse,
          3.0,
          0xf97316,
          enemies,
          audio,
          onEnemyKilled
        );
      }
      if (y.life <= 0) {
        this.scene.remove(y.group);
        this.yaggas.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      (sw.mesh.material as THREE.Material).dispose();
    }
    this.shockwaves = [];
    for (const b of this.burstPool) {
      b.active = false;
      b.points.visible = false;
      b.points.geometry.setDrawRange(0, 0);
    }
    for (const y of this.yaggas) {
      this.scene.remove(y.group);
    }
    this.yaggas = [];
  }

  public dispose(): void {
    this.clear();
    this.finishWarmUp();
    for (const b of this.burstPool) {
      this.scene.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
    }
    this.burstPool = [];
  }
}
