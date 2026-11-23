import * as THREE from 'three';
import { AudioEngine } from './audio';
import { EnemyEntity } from './enemy';

interface Projectile {
  mesh: THREE.Object3D;
  vel: THREE.Vector3;
  damage: number;
  life: number;
  fromPlayer: boolean;
  isArrow?: boolean;
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
  points: THREE.Points;
  velocities: Float32Array;
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

function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach((mt) => mt.dispose());
      } else {
        m.material.dispose();
      }
    }
  });
}

export class CombatSystem {
  private scene: THREE.Scene;
  private projectiles: Projectile[] = [];
  private shockwaves: Shockwave[] = [];
  private bursts: ParticleBurst[] = [];
  private yaggas: YaggaKund[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.dying) continue;
      _tmpVec.subVectors(enemy.position, playerPos);
      _tmpVec.y = 0;
      const dist = _tmpVec.length();
      if (dist > reach + enemy.radius) continue;

      const dir = _tmpVec.clone().normalize();
      const dot = dir.dot(playerForward);
      if (dot < -0.15 && dist > 1.2) continue;

      hitAny = true;
      const killed = enemy.takeDamage(damage, dir, knockback);
      this.spawnBurst(
        new THREE.Vector3(enemy.position.x, enemy.position.y + 1.2, enemy.position.z),
        killed ? 0xfbbf24 : burstColor,
        killed ? 20 : 12
      );
      if (killed) {
        audio.playEnemyDeath();
        onEnemyKilled(enemy);
      }
    }

    if (hitAny) {
      audio.playHit(knockback >= 9);
      onHitFeedback();
    }
  }

  public spawnPlayerArrow(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    audio: AudioEngine
  ): void {
    audio.playBowRelease();

    const arrowGroup = new THREE.Group();
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xd97706,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfbbf24,
      emissiveIntensity: 2.0,
      metalness: 0.9,
      roughness: 0.15,
    });
    const fletchMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 1.2,
    });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 6), shaftMat);
    shaft.rotation.x = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 6), tipMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.56;
    const fletch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.18), fletchMat);
    fletch.position.z = -0.4;

    arrowGroup.add(shaft, tip, fletch);
    const flatDir = direction.clone().setY(0).normalize();
    arrowGroup.position.copy(origin).add(new THREE.Vector3(0, 1.32, 0)).addScaledVector(flatDir, 0.7);
    arrowGroup.rotation.y = Math.atan2(flatDir.x, flatDir.z);
    this.scene.add(arrowGroup);

    this.projectiles.push({
      mesh: arrowGroup,
      vel: flatDir.multiplyScalar(30),
      damage,
      life: 1.4,
      fromPlayer: true,
      isArrow: true,
      hitIds: new Set(),
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
      const dir = flatBase.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
      if (idx === 0) {
        this.spawnPlayerArrow(origin, dir, damage, audio);
      } else {
        // Reuse silent spawn without stacking 5 bow audio cues at once
        const arrowGroup = new THREE.Group();
        const shaftMat = new THREE.MeshStandardMaterial({
          color: 0xfde68a,
          emissive: 0xd97706,
          emissiveIntensity: 0.9,
        });
        const tipMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfbbf24,
          emissiveIntensity: 2.0,
        });
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 6), shaftMat);
        shaft.rotation.x = Math.PI / 2;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 6), tipMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.z = 0.56;
        arrowGroup.add(shaft, tip);
        arrowGroup.position.copy(origin).add(new THREE.Vector3(0, 1.32, 0)).addScaledVector(dir, 0.7);
        arrowGroup.rotation.y = Math.atan2(dir.x, dir.z);
        this.scene.add(arrowGroup);

        this.projectiles.push({
          mesh: arrowGroup,
          vel: dir.multiplyScalar(30),
          damage,
          life: 1.4,
          fromPlayer: true,
          isArrow: true,
          hitIds: new Set(),
        });
      }
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
        new THREE.Vector3(enemy.position.x, enemy.position.y + 1.1, enemy.position.z),
        killed ? 0xfbbf24 : burstColor,
        killed ? 18 : 10
      );
      if (killed) {
        audio.playEnemyDeath();
        onEnemyKilled(enemy);
      }
    }
    if (hits > 0) {
      audio.playHit(true);
    }
    return hits;
  }

  public spawnYaggaKund(origin: THREE.Vector3, damagePerPulse: number): void {
    const group = new THREE.Group();
    group.position.set(origin.x, origin.y + 0.05, origin.z);

    // Sacred sandstone Havan Kund altar
    const kundMat = new THREE.MeshStandardMaterial({
      color: 0x8b6b46,
      roughness: 0.78,
      metalness: 0.1,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.26, 4), kundMat);
    base.rotation.y = Math.PI / 4;
    base.position.y = 0.13;
    group.add(base);

    // Outer consecrated fire ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(5.3, 5.7, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    group.add(ring);

    // Sacred Agni flames
    const flames: THREE.Mesh[] = [];
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf97316,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.36;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(i === 0 ? 0.32 : 0.18, i === 0 ? 1.05 : 0.65, 6), flameMat);
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
    const geom = new THREE.TorusGeometry(0.52, 0.11, 8, 20);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.4,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(origin).add(new THREE.Vector3(0, 1.15, 0));
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
    const geom = new THREE.OctahedronGeometry(0.28, 1);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 2.2,
    });
    const mesh = new THREE.Mesh(geom, mat);
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
    const geom = new THREE.RingGeometry(0.8, 1.35, 36);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
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

  public spawnBurst(pos: THREE.Vector3, color: number, count = 14): void {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4.5;
      velocities[i * 3] = Math.cos(angle) * spd;
      velocities[i * 3 + 1] = 2 + Math.random() * 4;
      velocities[i * 3 + 2] = Math.sin(angle) * spd;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.22,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    this.bursts.push({
      points,
      velocities,
      life: 0.55,
      maxLife: 0.55,
    });
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerRadius: number,
    playerGrounded: boolean,
    enemies: EnemyEntity[],
    audio: AudioEngine,
    onPlayerDamaged: (rawDamage: number) => void,
    onEnemyKilled: (enemy: EnemyEntity) => void
  ): void {
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (!p.isArrow) {
        p.mesh.rotation.z += dt * 8;
        p.mesh.rotation.y += dt * 6;
      }

      let remove = p.life <= 0;

      if (!remove && p.fromPlayer) {
        for (const enemy of enemies) {
          if (!enemy.alive || enemy.dying || p.hitIds.has(enemy.id)) continue;
          const dx = enemy.position.x - p.mesh.position.x;
          const dz = enemy.position.z - p.mesh.position.z;
          const hitR = enemy.radius + (p.isArrow ? 0.55 : 0.85);
          if (dx * dx + dz * dz <= hitR * hitR) {
            p.hitIds.add(enemy.id);
            const dir = p.vel.clone().normalize();
            const killed = enemy.takeDamage(p.damage, dir, p.isArrow ? 4.5 : 7.5);
            audio.playHit(true);
            this.spawnBurst(p.mesh.position.clone(), p.isArrow ? 0x22c55e : 0xfbbf24, 14);
            if (killed) {
              audio.playEnemyDeath();
              onEnemyKilled(enemy);
            }
            if (p.isArrow) {
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
          this.spawnBurst(p.mesh.position.clone(), 0xef4444, 10);
          remove = true;
        }
      }

      if (remove) {
        this.scene.remove(p.mesh);
        disposeObject3D(p.mesh);
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
        sw.mesh.geometry.dispose();
        mat.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // Update particle bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= dt;
      const posAttr = b.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let j = 0; j < posAttr.count; j++) {
        b.velocities[j * 3 + 1] -= 9.8 * dt;
        posAttr.setXYZ(
          j,
          posAttr.getX(j) + b.velocities[j * 3] * dt,
          posAttr.getY(j) + b.velocities[j * 3 + 1] * dt,
          posAttr.getZ(j) + b.velocities[j * 3 + 2] * dt
        );
      }
      posAttr.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = Math.max(0, b.life / b.maxLife);

      if (b.life <= 0) {
        this.scene.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
        this.bursts.splice(i, 1);
      }
    }

    // Update Saint's active 3D Yagga Havan Kunds
    for (let i = this.yaggas.length - 1; i >= 0; i--) {
      const y = this.yaggas[i];
      y.life -= dt;
      y.pulseAccum -= dt;
      y.flames.forEach((fl, idx) => {
        fl.scale.y = 0.85 + Math.sin(performance.now() * 0.012 + idx * 1.4) * 0.25;
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
        disposeObject3D(y.group);
        this.yaggas.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      disposeObject3D(p.mesh);
    }
    this.projectiles = [];
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      (sw.mesh.material as THREE.Material).dispose();
    }
    this.shockwaves = [];
    for (const b of this.bursts) {
      this.scene.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
    }
    this.bursts = [];
    for (const y of this.yaggas) {
      this.scene.remove(y.group);
      disposeObject3D(y.group);
    }
    this.yaggas = [];
  }
}
