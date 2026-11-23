import * as THREE from 'three';
import { ColliderBox } from './types';

const _pivotPos = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _probe = new THREE.Vector3();

export class ThirdPersonCamera {
  public readonly camera: THREE.PerspectiveCamera;
  public yaw = Math.PI; // Facing -Z initially (into the forest path)
  public pitch = 0.24;
  public distance = 6.2;
  public targetDistance = 6.2;
  public shakeIntensity = 0;

  private smoothPos = new THREE.Vector3(0, 4, 32);
  private smoothLook = new THREE.Vector3(0, 1.5, 24);

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.15, 160);
  }

  public setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public addRotation(deltaX: number, deltaY: number, sensitivity: number): void {
    this.yaw -= deltaX * 0.0026 * sensitivity;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch + deltaY * 0.0022 * sensitivity,
      -0.32,
      1.05
    );
  }

  public adjustDistance(delta: number): void {
    this.targetDistance = THREE.MathUtils.clamp(this.targetDistance + delta, 3.4, 10.5);
  }

  public triggerShake(amount: number): void {
    this.shakeIntensity = Math.min(0.6, Math.max(this.shakeIntensity, amount));
  }

  public snapToPlayer(playerPos: THREE.Vector3, yaw?: number): void {
    if (yaw !== undefined) this.yaw = yaw;
    _pivotPos.set(playerPos.x, playerPos.y + 1.55, playerPos.z);
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);

    this.smoothPos.set(
      _pivotPos.x - sinY * cosP * this.targetDistance,
      _pivotPos.y + sinP * this.targetDistance,
      _pivotPos.z - cosY * cosP * this.targetDistance
    );
    this.smoothLook.copy(_pivotPos);
    this.camera.position.copy(this.smoothPos);
    this.camera.lookAt(this.smoothLook);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    colliders: ColliderBox[],
    groundHeightAt: (x: number, z: number) => number,
    isSprinting: boolean
  ): void {
    this.distance = THREE.MathUtils.damp(this.distance, this.targetDistance, 10, dt);

    // Subtle sprint FOV surge
    const targetFov = isSprinting ? 68 : 62;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
      this.camera.updateProjectionMatrix();
    }

    // Over-the-shoulder slight offset for horror visibility
    const sideOffsetX = Math.cos(this.yaw) * 0.35;
    const sideOffsetZ = -Math.sin(this.yaw) * 0.35;
    _pivotPos.set(
      playerPos.x + sideOffsetX,
      playerPos.y + 1.58,
      playerPos.z + sideOffsetZ
    );

    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);

    // Camera sits behind player along -yaw direction
    const dirX = -sinY * cosP;
    const dirY = sinP;
    const dirZ = -cosY * cosP;

    // Ray-march collision check from pivot to desired distance so camera never passes through walls
    let safeDist = this.distance;
    const steps = 14;
    for (let s = 1; s <= steps; s++) {
      const d = (s / steps) * this.distance;
      _probe.set(
        _pivotPos.x + dirX * d,
        _pivotPos.y + dirY * d,
        _pivotPos.z + dirZ * d
      );
      if (this.pointHitsWall(_probe, colliders)) {
        safeDist = Math.max(1.3, ((s - 1) / steps) * this.distance);
        break;
      }
      const gY = groundHeightAt(_probe.x, _probe.z) + 0.45;
      if (_probe.y < gY) {
        safeDist = Math.max(1.4, ((s - 0.5) / steps) * this.distance);
        break;
      }
    }

    _desiredCamPos.set(
      _pivotPos.x + dirX * safeDist,
      Math.max(groundHeightAt(_pivotPos.x + dirX * safeDist, _pivotPos.z + dirZ * safeDist) + 0.45, _pivotPos.y + dirY * safeDist),
      _pivotPos.z + dirZ * safeDist
    );

    const dampFactor = 1 - Math.exp(-14 * dt);
    this.smoothPos.lerp(_desiredCamPos, dampFactor);
    this.smoothLook.lerp(_pivotPos, dampFactor);

    this.camera.position.copy(this.smoothPos);

    if (this.shakeIntensity > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 1.8);
    }

    this.camera.lookAt(this.smoothLook);
  }

  private pointHitsWall(p: THREE.Vector3, colliders: ColliderBox[]): boolean {
    const pad = 0.35;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.blocksCamera === false) continue;
      if (p.y < c.y || p.y > c.y + c.height) continue;
      if (c.type === 'cylinder') {
        const r = (c.radius ?? 0.6) + pad;
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        if (dx * dx + dz * dz < r * r) return true;
      } else {
        const hw = (c.halfW ?? 1) + pad;
        const hd = (c.halfD ?? 1) + pad;
        if (Math.abs(p.x - c.x) < hw && Math.abs(p.z - c.z) < hd) return true;
      }
    }
    return false;
  }
}
