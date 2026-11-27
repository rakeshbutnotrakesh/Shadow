import * as THREE from 'three';
import { EnemySpawnConfig } from './enemy';
import { ProceduralTextureSet } from './textures';
import {
  AreaId,
  ArtifactId,
  ColliderBox,
  InteractiveObject,
  WorldFlags,
} from './types';
import type { ChestWeaponDef } from './weapons';
import { buildExtendedArea } from './worldExtra';

export interface BuiltArea {
  areaId: AreaId;
  name: string;
  subtitle: string;
  isStoneGround: boolean;
  boundsRadius: number;
  defaultSpawn: THREE.Vector3;
  defaultYaw: number;
  colliders: ColliderBox[];
  interactives: InteractiveObject[];
  enemySpawns: EnemySpawnConfig[];
  groundHeightAt: (x: number, z: number) => number;
  spawnWeaponDrop: (pos: THREE.Vector3, weapon: ChestWeaponDef) => InteractiveObject;
  update: (dt: number, time: number, ancientVisionRank: number) => void;
  dispose: () => void;
}

export class WorldBuilder {
  private scene: THREE.Scene;
  private textures: ProceduralTextureSet;
  private shadowsEnabled: boolean;
  private lowSpec: boolean;

  constructor(
    scene: THREE.Scene,
    textures: ProceduralTextureSet,
    shadowsEnabled: boolean,
    lowSpec = false
  ) {
    this.scene = scene;
    this.textures = textures;
    this.shadowsEnabled = shadowsEnabled;
    this.lowSpec = lowSpec;
  }

  public setLowSpec(lowSpec: boolean, shadowsEnabled: boolean): void {
    this.lowSpec = lowSpec;
    this.shadowsEnabled = shadowsEnabled;
  }

  public buildArea(
    areaId: AreaId,
    flags: WorldFlags,
    collectedArtifacts: ArtifactId[],
    enemiesDefeatedInAreaCount = 0
  ): BuiltArea {
    const root = new THREE.Group();
    this.scene.add(root);

    const disposables: Array<{ dispose: () => void }> = [];
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposables.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposables.push(m);
      return m;
    };

    const colliders: ColliderBox[] = [];
    const interactives: InteractiveObject[] = [];
    const enemySpawns: EnemySpawnConfig[] = [];
    const animatedCallbacks: Array<(dt: number, t: number) => void> = [];
    const flickeringLights: Array<{ light: THREE.PointLight; base: number; seed: number }> = [];

    // Shared architectural helpers
    const sandstoneMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: this.textures.sandstone,
        bumpMap: this.textures.sandstoneBump,
        bumpScale: 0.045,
        roughness: 0.86,
        metalness: 0.05,
      })
    );
    const darkStoneMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: this.textures.catacombStone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.035,
        roughness: 0.82,
        metalness: 0.12,
      })
    );
    const bronzeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xc28e3a,
        roughness: 0.3,
        metalness: 0.86,
      })
    );
    const goldEmissiveMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 1.8,
        roughness: 0.25,
        metalness: 0.7,
      })
    );

    const addBoxCollider = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      blocksCamera = true
    ) => {
      colliders.push({
        type: 'box',
        x,
        y,
        z,
        halfW: w * 0.5,
        halfD: d * 0.5,
        height: h,
        blocksCamera,
      });
    };

    const addCylCollider = (
      x: number,
      y: number,
      z: number,
      r: number,
      h: number,
      blocksCamera = true
    ) => {
      colliders.push({
        type: 'cylinder',
        x,
        y,
        z,
        radius: r,
        height: h,
        blocksCamera,
      });
    };

    // Carved Indian Pillar (Stambha)
    const createPillar = (x: number, y: number, z: number, height = 5.5, mat = sandstoneMat) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const base = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.3, 0.55, 1.3)), mat);
      base.position.y = 0.275;
      base.castShadow = this.shadowsEnabled;
      base.receiveShadow = true;

      const shaft = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.42, 0.48, height - 1.2, 8)),
        mat
      );
      shaft.position.y = 0.55 + (height - 1.2) * 0.5;
      shaft.castShadow = this.shadowsEnabled;
      shaft.receiveShadow = true;

      const band = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.54, 0.54, 0.25, 8)),
        bronzeMat
      );
      band.position.y = height - 0.85;

      const cap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.4, 0.5, 1.4)), mat);
      cap.position.y = height - 0.35;
      cap.castShadow = this.shadowsEnabled;

      g.add(base, shaft, band, cap);
      root.add(g);
      addCylCollider(x, y, z, 0.65, height, true);
      return g;
    };

    // Brass Diya / Brazier
    const createBrazier = (
      x: number,
      y: number,
      z: number,
      color = 0xff9b3d,
      withLight = true,
      intensity = 3.2
    ) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);

      const stand = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.38, 0.9, 8)), sandstoneMat);
      stand.position.y = 0.45;
      const bowl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.2, 0.26, 10)), bronzeMat);
      bowl.position.y = 1.02;
      const flameMat = trackMat(
        new THREE.MeshBasicMaterial({ color })
      );
      const flame = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.18, 0.44, 6)), flameMat);
      flame.position.y = 1.32;
      g.add(stand, bowl, flame);

      if (withLight) {
        const light = new THREE.PointLight(color, intensity, 16, 1.6);
        light.position.set(0, 1.55, 0);
        g.add(light);
        flickeringLights.push({ light, base: intensity, seed: Math.random() * 10 });
      }

      animatedCallbacks.push((_dt, t) => {
        const s = 0.88 + Math.sin(t * 9 + x) * 0.14;
        flame.scale.set(1, s, 1);
      });

      root.add(g);
      addCylCollider(x, y, z, 0.42, 1.4, false);
    };

    // Ancient Vision Beacon Pillar
    const createVisionBeacon = (x: number, y: number, z: number, color = 0xfbbf24) => {
      const mat = trackMat(
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.26,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      const beacon = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.55, 18, 12, 1, true)), mat);
      beacon.position.set(x, y + 9, z);
      beacon.visible = false;
      root.add(beacon);
      return beacon;
    };

    // Sacred Artifact Pedestal
    const createArtifactShrine = (
      artifactId: ArtifactId,
      x: number,
      y: number,
      z: number,
      label: string,
      color: number,
      locked = false,
      lockReason = ''
    ) => {
      const alreadyCollected = collectedArtifacts.includes(artifactId);
      const dais = new THREE.Group();
      dais.position.set(x, y, z);

      const step1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 8)), sandstoneMat);
      step1.position.y = 0.15;
      step1.receiveShadow = true;
      const ped = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.6, 1.0, 8)), sandstoneMat);
      ped.position.y = 0.8;
      dais.add(step1, ped);

      const artifactGroup = new THREE.Group();
      artifactGroup.position.y = 1.85;

      const artMat = trackMat(
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 1.1,
          roughness: 0.22,
          metalness: 0.85,
        })
      );

      if (artifactId === 'rudraksha') {
        const bead = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.28, 1)), artMat);
        const halo = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.42, 0.03, 6, 20)), goldEmissiveMat);
        artifactGroup.add(bead, halo);
      } else if (artifactId === 'trishul_fragment') {
        const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 8)), artMat);
        const cross = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.22, 0.03, 6, 16, Math.PI)), artMat);
        cross.position.y = 0.2;
        cross.rotation.z = Math.PI;
        const tip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.06, 0.26, 6)), artMat);
        tip.position.y = 0.45;
        artifactGroup.add(shaft, cross, tip);
      } else if (artifactId === 'ancient_yantra') {
        const plate = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.32, 0)), artMat);
        const ring = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.44, 0.03, 6, 4)), goldEmissiveMat);
        artifactGroup.add(plate, ring);
      } else if (artifactId === 'sacred_mantra') {
        const scroll = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.62, 12)), artMat);
        scroll.rotation.z = 0.4;
        const ring = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.38, 0.025, 6, 20)), goldEmissiveMat);
        artifactGroup.add(scroll, ring);
      } else {
        const disc = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.34, 1)), artMat);
        const sunRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.48, 0.04, 6, 24)), goldEmissiveMat);
        artifactGroup.add(disc, sunRing);
      }

      const auraLight = new THREE.PointLight(color, 2.2, 8, 1.5);
      artifactGroup.add(auraLight);

      if (alreadyCollected) {
        artifactGroup.visible = false;
      }

      dais.add(artifactGroup);
      root.add(dais);
      addCylCollider(x, y, z, 0.65, 1.3, false);

      const beacon = createVisionBeacon(x, y, z, color);

      animatedCallbacks.push((dt, t) => {
        if (artifactGroup.visible) {
          artifactGroup.rotation.y += dt * 1.4;
          artifactGroup.position.y = 1.85 + Math.sin(t * 2.4) * 0.12;
        }
      });

      interactives.push({
        id: `artifact_${artifactId}`,
        kind: 'artifact',
        label,
        promptText: `Claim ${label}`,
        position: new THREE.Vector3(x, y + 1.0, z),
        radius: 3.1,
        mesh: artifactGroup,
        beaconMesh: beacon,
        artifactId,
        locked,
        lockReason,
        consumed: alreadyCollected,
      });
    };

    // Portal Gate (Torana Archway)
    const createPortalGate = (
      id: string,
      x: number,
      y: number,
      z: number,
      targetArea: AreaId,
      label: string,
      locked: boolean,
      lockReason: string,
      portalColor = 0xd4a34a
    ) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);

      const pL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.85, 5.2, 0.85)), sandstoneMat);
      pL.position.set(-2.1, 2.6, 0);
      pL.castShadow = this.shadowsEnabled;
      const pR = pL.clone();
      pR.position.x = 2.1;
      const lintel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.6, 0.9, 1.0)), sandstoneMat);
      lintel.position.set(0, 5.4, 0);
      const crown = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.65, 1.1, 6)), bronzeMat);
      crown.position.set(0, 6.35, 0);

      const discMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: locked ? 0x991b1b : portalColor,
          transparent: true,
          opacity: locked ? 0.35 : 0.72,
          side: THREE.DoubleSide,
        })
      );
      const disc = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(1.75, 24)), discMat);
      disc.position.set(0, 2.55, 0);

      const portalLight = new THREE.PointLight(locked ? 0xef4444 : portalColor, 2.6, 12, 1.5);
      portalLight.position.set(0, 2.6, 0.5);

      g.add(pL, pR, lintel, crown, disc, portalLight);
      root.add(g);

      addBoxCollider(x - 2.1, y, z, 0.9, 5.2, 0.9, true);
      addBoxCollider(x + 2.1, y, z, 0.9, 5.2, 0.9, true);

      animatedCallbacks.push((dt) => {
        disc.rotation.z += dt * 1.1;
      });

      interactives.push({
        id,
        kind: 'portal',
        label,
        promptText: `Enter ${label}`,
        position: new THREE.Vector3(x, y + 1.0, z),
        radius: 3.4,
        mesh: disc,
        targetArea,
        locked,
        lockReason,
      });

      return { discMat, portalLight };
    };

    // Relic Chest (Consumables + XP)
    const createRelicChest = (id: string, x: number, y: number, z: number, locked = false, lockReason = '') => {
      const opened = flags.openedChests.includes(id);
      const g = new THREE.Group();
      g.position.set(x, y, z);

      const box = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.65, 0.75)), sandstoneMat);
      box.position.y = 0.325;
      const lid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.16, 0.22, 0.8)), bronzeMat);
      lid.position.y = opened ? 0.85 : 0.72;
      lid.rotation.x = opened ? -0.9 : 0;
      g.add(box, lid);
      root.add(g);
      addBoxCollider(x, y, z, 1.15, 0.9, 0.8, false);

      const beacon = createVisionBeacon(x, y, z, 0x38bdf8);

      interactives.push({
        id,
        kind: 'chest',
        label: 'Ancient Relic Chest',
        promptText: 'Open Relic Chest',
        position: new THREE.Vector3(x, y + 0.5, z),
        radius: 2.8,
        mesh: lid,
        beaconMesh: beacon,
        consumed: opened,
        locked,
        lockReason,
      });
    };

    // Lore Stone Tablet
    const createLoreTablet = (id: string, x: number, y: number, z: number, title: string, text: string) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const slab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.0, 1.8, 0.32)), sandstoneMat);
      slab.position.y = 0.9;
      slab.castShadow = this.shadowsEnabled;
      const rune = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.65, 0.9, 0.04)),
        goldEmissiveMat
      );
      rune.position.set(0, 1.05, 0.17);
      g.add(slab, rune);
      root.add(g);
      addBoxCollider(x, y, z, 1.0, 1.8, 0.4, false);

      interactives.push({
        id,
        kind: 'lore',
        label: title,
        promptText: `Read ${title}`,
        position: new THREE.Vector3(x, y + 0.9, z),
        radius: 2.9,
        mesh: g,
        loreTitle: title,
        loreText: text,
      });
    };

    // Tapasya Trial Shrine (Summons scaled Shadow Wave for leveling up to 100)
    const createTrialShrine = (id: string, x: number, y: number, z: number) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.1, 1.35, 0.65, 8)), sandstoneMat);
      base.position.y = 0.325;
      const fireMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xff6b35,
          emissive: 0xea580c,
          emissiveIntensity: 2.1,
          roughness: 0.3,
        })
      );
      const flame = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.38, 0)), fireMat);
      flame.position.y = 1.15;
      g.add(base, flame);
      root.add(g);
      addCylCollider(x, y, z, 1.2, 1.6, false);

      animatedCallbacks.push((dt, t) => {
        flame.rotation.y += dt * 1.6;
        flame.position.y = 1.15 + Math.sin(t * 3.1) * 0.08;
      });

      interactives.push({
        id,
        kind: 'trial_shrine',
        label: 'Tapasya Trial Altar',
        promptText: 'Invoke Shadow Trial Wave',
        position: new THREE.Vector3(x, y + 0.9, z),
        radius: 3.1,
        mesh: g,
      });
    };

    // Celestial Sky Disc / Moon / Eclipse Landmark (visible in outdoor realms)
    const createSkyLandmark = (
      discColor: number,
      haloColor: number,
      isEclipse = false,
      pos: [number, number, number] = [20, 42, -52]
    ) => {
      const skyGroup = new THREE.Group();
      skyGroup.position.set(pos[0], pos[1], pos[2]);
      skyGroup.lookAt(0, 1.5, 0);

      const halo = new THREE.Mesh(
        trackGeo(new THREE.RingGeometry(4.2, 7.8, 32)),
        trackMat(
          new THREE.MeshBasicMaterial({
            color: haloColor,
            transparent: true,
            opacity: 0.24,
            side: THREE.DoubleSide,
            depthWrite: false,
            fog: false,
          })
        )
      );
      const body = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(4.0, 28)),
        trackMat(
          new THREE.MeshBasicMaterial({
            color: isEclipse ? 0x070408 : discColor,
            transparent: true,
            opacity: isEclipse ? 0.96 : 0.88,
            side: THREE.DoubleSide,
            depthWrite: false,
            fog: false,
          })
        )
      );
      body.position.z = 0.05;
      skyGroup.add(halo, body);

      if (isEclipse) {
        const corona = new THREE.Mesh(
          trackGeo(new THREE.RingGeometry(3.85, 4.45, 32)),
          trackMat(
            new THREE.MeshBasicMaterial({
              color: discColor,
              transparent: true,
              opacity: 0.85,
              side: THREE.DoubleSide,
              depthWrite: false,
              fog: false,
            })
          )
        );
        corona.position.z = 0.08;
        skyGroup.add(corona);
      }

      root.add(skyGroup);
    };

    // Atmospheric Particles helper
    const createAmbientParticles = (count: number, radius: number, height: number, color: number, size = 0.16) => {
      const actualCount = this.lowSpec ? Math.max(16, Math.round(count * 0.35)) : count;
      const positions = new Float32Array(actualCount * 3);
      for (let i = 0; i < actualCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        positions[i * 3] = Math.cos(a) * r;
        positions[i * 3 + 1] = 0.4 + Math.random() * height;
        positions[i * 3 + 2] = Math.sin(a) * r;
      }
      const geo = trackGeo(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = trackMat(
        new THREE.PointsMaterial({
          map: this.textures.particleGlow,
          color,
          size,
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      const pts = new THREE.Points(geo, mat);
      root.add(pts);
      animatedCallbacks.push((dt, t) => {
      pts.rotation.y += dt * 0.03;
        const attr = geo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < actualCount; i++) {
          const y = attr.getY(i) + Math.sin(t * 1.4 + i) * 0.004;
          attr.setY(i, y);
        }
        attr.needsUpdate = true;
      });
    };

    const spawnWeaponDrop = (pos: THREE.Vector3, weapon: ChestWeaponDef): InteractiveObject => {
      const dropGroup = new THREE.Group();
      dropGroup.position.set(pos.x, pos.y + 0.9, pos.z);

      const bladeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: weapon.accentHex,
          emissive: weapon.accentHex,
          emissiveIntensity: 1.5,
          roughness: 0.2,
          metalness: 0.85,
        })
      );
      const blade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 1.05, 0.045)), bladeMat);
      blade.rotation.z = 0.22;
      const hilt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.07, 0.08)), bronzeMat);
      hilt.position.y = -0.34;
      hilt.rotation.z = 0.22;
      const halo = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.48, 0.035, 8, 22)),
        goldEmissiveMat
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -0.45;
      const light = new THREE.PointLight(weapon.accentHex, 2.4, 8, 1.5);
      light.position.y = 0.1;

      dropGroup.add(blade, hilt, halo, light);
      root.add(dropGroup);

      const beacon = createVisionBeacon(pos.x, pos.y, pos.z, weapon.accentHex);

      const item: InteractiveObject = {
        id: `drop_${weapon.id}_${Date.now()}_${Math.floor(Math.random() * 999)}`,
        kind: 'weapon_drop',
        label: `${weapon.name} (+${weapon.powerBonus})`,
        promptText: `Collect ${weapon.rarity} Weapon: ${weapon.name} (+${weapon.powerBonus} ATK)`,
        position: new THREE.Vector3(pos.x, pos.y + 0.8, pos.z),
        radius: 3.1,
        mesh: dropGroup,
        beaconMesh: beacon,
        weaponDrop: weapon,
        consumed: false,
      };
      interactives.push(item);

      const baseY = pos.y + 0.95;
      animatedCallbacks.push((dt, t) => {
        if (!item.consumed && dropGroup.visible) {
          dropGroup.rotation.y += dt * 2.2;
          dropGroup.position.y = baseY + Math.sin(t * 3.1) * 0.16;
        }
      });

      return item;
    };

    const finalizeArea = (cfg: {
      areaId: AreaId;
      name: string;
      subtitle: string;
      isStoneGround: boolean;
      boundsRadius: number;
      defaultSpawn: THREE.Vector3;
      defaultYaw: number;
      groundHeightAt: (x: number, z: number) => number;
    }): BuiltArea => ({
      ...cfg,
      colliders,
      interactives,
      enemySpawns,
      spawnWeaponDrop,
      update: (dt, t, visionRank) => {
        animatedCallbacks.forEach((cb) => cb(dt, t));
        flickeringLights.forEach((f) => {
          f.light.intensity = f.base + Math.sin(t * 7.8 + f.seed) * 0.42;
        });
        interactives.forEach((it) => {
          if (it.beaconMesh) {
            it.beaconMesh.visible =
              !it.consumed && (it.kind === 'weapon_drop' || visionRank > 0);
          }
        });
      },
      dispose: () => {
        this.scene.remove(root);
        disposables.forEach((d) => d.dispose());
      },
    });

    const extendedBuilt = buildExtendedArea(areaId, {
      scene: this.scene,
      root,
      textures: this.textures,
      shadowsEnabled: this.shadowsEnabled,
      lowSpec: this.lowSpec,
      flags,
      enemiesDefeatedInAreaCount,
      colliders,
      interactives,
      enemySpawns,
      animatedCallbacks,
      flickeringLights,
      sandstoneMat,
      darkStoneMat,
      bronzeMat,
      goldEmissiveMat,
      trackGeo,
      trackMat,
      addBoxCollider,
      addCylCollider,
      createPillar,
      createBrazier,
      createPortalGate,
      createRelicChest,
      createLoreTablet,
      createTrialShrine,
      createAmbientParticles,
      createSkyLandmark,
      finalizeArea,
    });
    if (extendedBuilt) {
      return extendedBuilt;
    }

    // =========================================================================
    // AREA SPECIFIC BUILDERS
    // =========================================================================

    if (areaId === 'forest') {
      const fogColor = 0x07100c;
      this.scene.background = new THREE.Color(fogColor);
      this.scene.fog = new THREE.FogExp2(fogColor, 0.032);

      // Lighting (cool moonlight + warm key + ground hemi)
      const hemi = new THREE.HemisphereLight(0x3a5f58, 0x0f160f, 0.65);
      const moonDir = new THREE.DirectionalLight(0x88b4c9, 1.15);
      moonDir.position.set(18, 32, 16);
      if (this.shadowsEnabled) {
        moonDir.castShadow = true;
        moonDir.shadow.mapSize.set(1024, 1024);
        moonDir.shadow.camera.left = -35;
        moonDir.shadow.camera.right = 35;
        moonDir.shadow.camera.top = 35;
        moonDir.shadow.camera.bottom = -35;
        moonDir.shadow.bias = -0.0005;
        moonDir.shadow.normalBias = 0.02;
      }
      root.add(hemi, moonDir);

      // Extended ground (radius 85 so no floating void)
      const ground = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(85, 48)),
        trackMat(
          new THREE.MeshStandardMaterial({
            map: this.textures.forestGround,
            roughness: 0.94,
            metalness: 0.02,
          })
        )
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      root.add(ground);

      // Stone pathway along Z
      const path = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(5.2, 56)),
        trackMat(
          new THREE.MeshStandardMaterial({
            map: this.textures.stonePath,
            bumpMap: this.textures.stoneBump,
            bumpScale: 0.035,
            roughness: 0.88,
          })
        )
      );
      path.rotation.x = -Math.PI / 2;
      path.position.set(0, 0.02, 0);
      path.receiveShadow = true;
      root.add(path);

      createSkyLandmark(0xdbeafe, 0x60a5fa, false, [22, 40, -50]);

      // Instanced dense 3D forest trees (outer ring + scattered inner grove)
      const treeCoords: Array<{ x: number; z: number; s: number }> = [];
      for (let i = 0; i < 42; i++) {
        const ang = (i / 42) * Math.PI * 2;
        const r = 36 + (i % 3) * 4.5;
        treeCoords.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r, s: 1.0 + (i % 4) * 0.18 });
      }
      const innerSpots: Array<[number, number, number]> = [
        [-9, 18, 1.1], [10, 19, 1.05], [-12, 8, 1.2], [9, 6, 0.95],
        [-7, -11, 1.15], [11, -9, 1.25], [-21, 12, 1.3], [22, 14, 1.15],
        [-22, -14, 1.2], [20, -16, 1.1], [-10, -21, 1.0], [10, -21, 1.0],
        [-27, 2, 1.35], [27, -2, 1.25], [-16, 24, 1.15], [16, 24, 1.2],
      ];
      for (const [tx, tz, ts] of innerSpots) {
        treeCoords.push({ x: tx, z: tz, s: ts });
        addCylCollider(tx, 0, tz, 0.72 * ts, 7, true);
      }

      const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.62, 6.2, 8));
      const trunkMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: this.textures.bark,
          bumpMap: this.textures.barkBump,
          bumpScale: 0.06,
          roughness: 0.92,
        })
      );
      const canopyGeo = trackGeo(new THREE.DodecahedronGeometry(2.6, 1));
      const canopyMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x162b1c, roughness: 0.88 })
      );

      const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCoords.length);
      const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCoords.length);
      trunkInst.castShadow = this.shadowsEnabled;
      canopyInst.castShadow = this.shadowsEnabled;

      const dummy = new THREE.Object3D();
      const tint = new THREE.Color();
      treeCoords.forEach((t, idx) => {
        dummy.position.set(t.x, 3.1 * t.s, t.z);
        dummy.rotation.set(0, idx * 0.7, 0);
        dummy.scale.setScalar(t.s);
        dummy.updateMatrix();
        trunkInst.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(t.x, 6.4 * t.s, t.z);
        dummy.scale.set(t.s * 1.15, t.s * 0.88, t.s * 1.15);
        dummy.updateMatrix();
        canopyInst.setMatrixAt(idx, dummy.matrix);

        tint.setHSL(0.35 + (idx % 5) * 0.015, 0.35, 0.14 + (idx % 3) * 0.03);
        canopyInst.setColorAt(idx, tint);
      });
      trunkInst.instanceMatrix.needsUpdate = true;
      canopyInst.instanceMatrix.needsUpdate = true;
      if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
      trunkInst.computeBoundingSphere();
      canopyInst.computeBoundingSphere();
      root.add(trunkInst, canopyInst);

      // Natural boulders
      const rockGeo = trackGeo(new THREE.DodecahedronGeometry(1.4, 0));
      const rockMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x2f342d, roughness: 0.92 }));
      const rocks: Array<[number, number, number]> = [
        [15, 9, 1.3], [18, 12, 1.1], [-18, -2, 1.4], [-11, -6, 0.9], [14, -18, 1.2],
      ];
      for (const [rx, rz, rs] of rocks) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(rx, rs * 0.55, rz);
        rock.scale.set(rs * 1.2, rs * 0.75, rs);
        rock.rotation.y = rx;
        rock.castShadow = this.shadowsEnabled;
        rock.receiveShadow = true;
        root.add(rock);
        addCylCollider(rx, 0, rz, rs * 1.1, 2.0, false);
      }

      // Pathway Oil Diyas
      createBrazier(-3.1, 0, 18, 0xff9b3d, true, 3.2);
      createBrazier(3.1, 0, 18, 0xff9b3d, false);
      createBrazier(-3.1, 0, 2, 0xff9b3d, true, 3.2);
      createBrazier(3.1, 0, 2, 0xff9b3d, false);
      createBrazier(-3.1, 0, -16, 0xff9b3d, true, 3.2);
      createBrazier(3.1, 0, -16, 0xff9b3d, false);

      // Banyan Shrine clearing on West side (-14, -4) with Rudraksha
      createPillar(-17, 0, -7, 4.2);
      createPillar(-11, 0, -7, 4.2);
      createArtifactShrine('rudraksha', -14, 0, -4, 'Rudraksha', 0xd97706);

      // Secret chests behind boulders & west grove, Lore Tablet & Tapasya Trial Altar
      createRelicChest('chest_forest_1', 17, 0, 10);
      createRelicChest('chest_forest_2', -9, 0, 14);
      createTrialShrine('trial_forest', -6.5, 0, 15);
      createLoreTablet(
        'lore_forest',
        5.5,
        0,
        14,
        'Waystone of Kalyug',
        'When Tamas clouds the human heart, SHADOW.exe seeps from the broken seals beneath the valley. Seek the Rudraksha in the western grove, awaken the Temple of Silence, and restore the five sacred relics.'
      );

      // Portal to Temple
      createPortalGate(
        'portal_forest_temple',
        0,
        0,
        -25,
        'temple',
        'Ancient Temple',
        false,
        ''
      );

      // Enemies
      enemySpawns.push(
        { id: 'f_sw1', type: 'shadow_walker', position: new THREE.Vector3(-4, 0, 8) },
        { id: 'f_sw2', type: 'shadow_walker', position: new THREE.Vector3(5, 0, -4) },
        { id: 'f_ds1', type: 'dark_spirit', position: new THREE.Vector3(-11, 0, -1) },
        { id: 'f_sw3', type: 'shadow_walker', position: new THREE.Vector3(2, 0, -17) },
        { id: 'f_ds2', type: 'dark_spirit', position: new THREE.Vector3(12, 0, 4) }
      );

      createAmbientParticles(160, 34, 6, 0xa7f3d0, 0.18);

      return finalizeArea({
        areaId,
        name: 'Forgotten Forest',
        subtitle: 'Area 1 · Grove of Whispering Banyans',
        isStoneGround: false,
        boundsRadius: 35,
        defaultSpawn: new THREE.Vector3(0, 0, 26),
        defaultYaw: Math.PI,
        groundHeightAt: () => 0,
      });
    }

    if (areaId === 'temple') {
      const fogColor = 0x120d16;
      this.scene.background = new THREE.Color(fogColor);
      this.scene.fog = new THREE.FogExp2(fogColor, 0.025);

      const hemi = new THREE.HemisphereLight(0x7c6f9c, 0x221712, 0.72);
      const key = new THREE.DirectionalLight(0xffcf87, 1.25);
      key.position.set(16, 28, 20);
      if (this.shadowsEnabled) {
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = -32;
        key.shadow.camera.right = 32;
        key.shadow.camera.top = 32;
        key.shadow.camera.bottom = -32;
        key.shadow.bias = -0.0005;
      }
      root.add(hemi, key);

      // Extended stone courtyard
      const ground = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(75, 48)),
        trackMat(
          new THREE.MeshStandardMaterial({
            map: this.textures.forestGround,
            color: 0x3b332c,
            roughness: 0.92,
          })
        )
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      root.add(ground);

      // Elevated Mandapa Plinth (|x|<13, |z|<13, y=0.6)
      const plinth = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(26, 0.6, 26)),
        sandstoneMat
      );
      plinth.position.set(0, 0.3, 0);
      plinth.receiveShadow = true;
      root.add(plinth);

      // South & North broad steps
      const southStep = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8, 0.3, 2.2)), sandstoneMat);
      southStep.position.set(0, 0.15, 14.1);
      southStep.receiveShadow = true;
      const northStep = southStep.clone();
      northStep.position.set(0, 0.15, -14.1);
      root.add(southStep, northStep);

      // Outer Courtyard Perimeter Stone Walls (broken ruins with openings)
      const wallPositions: Array<[number, number, number, number]> = [
        [-19, 0, 8, 22], [19, 0, 8, 22], [-19, 0, -14, 16], [19, 0, -14, 16],
        [-12, -26, 14, 1.5], [12, -26, 14, 1.5],
      ];
      for (const [wx, wz, ww, wd] of wallPositions) {
        const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(ww, 4.2, wd)), sandstoneMat);
        wall.position.set(wx, 2.1, wz);
        wall.castShadow = this.shadowsEnabled;
        wall.receiveShadow = true;
        root.add(wall);
        addBoxCollider(wx, 0, wz, ww, 4.2, wd, true);
      }

      // Colonnade of Carved Stambha Pillars on Mandapa
      const pillarXY: Array<[number, number]> = [
        [-10, 10], [-10, 3], [-10, -4], [-10, -10],
        [10, 10], [10, 3], [10, -4], [10, -10],
        [-4, -10], [4, -10],
      ];
      for (const [px, pz] of pillarXY) {
        createPillar(px, 0.6, pz, 6.0);
      }

      // Towering Shikhara Spire Silhouette behind North Portal
      const shikharaGroup = new THREE.Group();
      shikharaGroup.position.set(0, 0, -31);
      for (let tier = 0; tier < 5; tier++) {
        const s = 9.5 - tier * 1.55;
        const tMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(s, 2.4, s)), sandstoneMat);
        tMesh.position.y = 1.2 + tier * 2.4;
        tMesh.castShadow = this.shadowsEnabled;
        shikharaGroup.add(tMesh);
      }
      const kalasha = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.9, 12, 10)), bronzeMat);
      kalasha.position.y = 13.4;
      shikharaGroup.add(kalasha);
      root.add(shikharaGroup);

      // Temple Braziers
      createBrazier(-5.2, 0.6, 11.2, 0xffaa44, true, 3.6);
      createBrazier(5.2, 0.6, 11.2, 0xffaa44, false);
      createBrazier(-5.2, 0.6, -9.5, 0xffaa44, true, 3.6);
      createBrazier(5.2, 0.6, -9.5, 0xffaa44, false);

      // Temple Bell Pavilion (-10.5, 0.6, 0) -> Actually at (-7, 0.6, 4) for easy reach
      const bellGroup = new THREE.Group();
      bellGroup.position.set(-7, 0.6, 5);
      const bFrameL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.35, 3.4, 0.35)), sandstoneMat);
      bFrameL.position.set(-1.1, 1.7, 0);
      const bFrameR = bFrameL.clone();
      bFrameR.position.x = 1.1;
      const bBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.8, 0.35, 0.45)), sandstoneMat);
      bBeam.position.set(0, 3.45, 0);
      const bellMesh = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.55, 0.95, 12)), bronzeMat);
      bellMesh.position.set(0, 2.55, 0);
      bellGroup.add(bFrameL, bFrameR, bBeam, bellMesh);
      root.add(bellGroup);
      addBoxCollider(-7, 0.6, 5, 2.5, 3.6, 0.8, false);

      interactives.push({
        id: 'temple_bell',
        kind: 'bell',
        label: 'Sacred Ghanta Bell',
        promptText: flags.bellRung ? 'Ring Temple Bell' : 'Ring Bell to Awaken Relic',
        position: new THREE.Vector3(-7, 1.6, 5),
        radius: 3.1,
        mesh: bellMesh,
      });

      // Mandala Puzzle Altar at center (0, 0.6, 0)
      const mandalaBase = new THREE.Group();
      mandalaBase.position.set(0, 0.6, 0);
      const altarPed = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.4, 1.7, 0.9, 12)), sandstoneMat);
      altarPed.position.y = 0.45;
      const ring1 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1.1, 0.08, 6, 24)), bronzeMat);
      ring1.rotation.x = Math.PI / 2;
      ring1.position.y = 0.96;
      const ring2 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.75, 0.06, 6, 20)), goldEmissiveMat);
      ring2.rotation.x = Math.PI / 2;
      ring2.position.y = 0.98;
      mandalaBase.add(altarPed, ring1, ring2);
      root.add(mandalaBase);
      addCylCollider(0, 0.6, 0, 1.5, 1.2, false);

      interactives.push({
        id: 'mandala_altar',
        kind: 'mandala_altar',
        label: 'Sacred Mandala Altar',
        promptText: flags.mandalaSolved ? 'Mandala Aligned' : 'Align Mandala Rings',
        position: new THREE.Vector3(0, 1.4, 0),
        radius: 3.2,
        mesh: mandalaBase,
        consumed: flags.mandalaSolved,
      });

      // Trishul Fragment on North Sanctuary Dais (unlocks when Mandala is solved)
      createArtifactShrine(
        'trishul_fragment',
        0,
        0.6,
        -8.5,
        'Trishul Fragment',
        0xf59e0b,
        !flags.mandalaSolved,
        'Align the Mandala Altar at the temple center first'
      );

      // Secret Chest unlocked by Temple Bell
      createRelicChest(
        'chest_temple_1',
        11.5,
        0.6,
        10.5,
        !flags.bellRung,
        'Ring the Courtyard Bell to unseal this chest'
      );

      createLoreTablet(
        'lore_temple',
        7,
        0.6,
        5,
        'Mandapa Inscription',
        'Three concentric rings govern time, stillness, and light. Align the Mandala Altar at the heart of the temple to release the Trishul Fragment.'
      );
      createTrialShrine('trial_temple', 0, 0, 18);

      // Exit Portal to Catacombs + Return Portal to Forgotten Forest
      createSkyLandmark(0xfde68a, 0xf59e0b, false, [18, 42, -52]);
      createPortalGate(
        'portal_temple_catacombs',
        0,
        0,
        -22,
        'catacombs',
        'Underground Catacombs',
        !collectedArtifacts.includes('trishul_fragment'),
        'Claim the Trishul Fragment to open the Catacomb Descent',
        0x38bdf8
      );
      createPortalGate(
        'portal_temple_forest',
        0,
        0,
        26.5,
        'forest',
        'Return: Forgotten Forest (Area 1)',
        false,
        '',
        0x94a3b8
      );

      enemySpawns.push(
        { id: 't_sw1', type: 'shadow_walker', position: new THREE.Vector3(-6, 0.6, 10) },
        { id: 't_tg1', type: 'temple_guardian', position: new THREE.Vector3(6, 0.6, 2) },
        { id: 't_ds1', type: 'dark_spirit', position: new THREE.Vector3(-6, 0.6, -6) },
        { id: 't_tg2', type: 'temple_guardian', position: new THREE.Vector3(5, 0.6, -8) },
        { id: 't_sw2', type: 'shadow_walker', position: new THREE.Vector3(0, 0, -17) }
      );

      createAmbientParticles(140, 28, 7, 0xfde68a, 0.16);

      const groundHeightAt = (x: number, z: number) => {
        if (Math.abs(x) <= 13 && Math.abs(z) <= 13) return 0.6;
        if (Math.abs(x) <= 4 && Math.abs(z) > 13 && Math.abs(z) <= 15.2) return 0.3;
        return 0;
      };

      return finalizeArea({
        areaId,
        name: 'Ancient Temple',
        subtitle: 'Area 2 · Mandapa of Echoing Bells',
        isStoneGround: true,
        boundsRadius: 34,
        defaultSpawn: new THREE.Vector3(0, 0, 23),
        defaultYaw: Math.PI,
        groundHeightAt,
      });
    }

    if (areaId === 'catacombs') {
      const fogColor = 0x05070c;
      this.scene.background = new THREE.Color(fogColor);
      this.scene.fog = new THREE.FogExp2(fogColor, 0.048);

      const hemi = new THREE.HemisphereLight(0x2d4059, 0x090b10, 0.48);
      root.add(hemi);

      // Subterranean Floor & Ceiling Vault
      const floor = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(64, 68)),
        trackMat(new THREE.MeshStandardMaterial({ map: this.textures.catacombStone, roughness: 0.85 }))
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      root.add(floor);

      const ceiling = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(64, 68)),
        darkStoneMat
      );
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.y = 6.2;
      root.add(ceiling);

      // Tunnel & Chamber Walls (real 3D corridors!)
      const addWall = (x: number, z: number, w: number, d: number) => {
        const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, 6.2, d)), darkStoneMat);
        mesh.position.set(x, 3.1, z);
        mesh.receiveShadow = true;
        mesh.castShadow = this.shadowsEnabled;
        root.add(mesh);
        addBoxCollider(x, 0, z, w, 6.2, d, true);
      };

      // Outer perimeter walls
      addWall(0, 29, 44, 2);
      addWall(0, -29, 44, 2);
      addWall(-22, 0, 2, 58);
      addWall(22, 0, 2, 58);

      // Interior corridor dividers creating entry hall -> west/east crypts -> central chamber -> north passage
      addWall(-11, 14, 14, 1.8);
      addWall(11, 14, 14, 1.8);
      addWall(-10, -14, 12, 1.8);
      addWall(10, -14, 12, 1.8);
      addWall(-9, 0, 1.8, 12);
      addWall(9, 0, 1.8, 12);

      // Vault Pillars
      createPillar(-4.5, 0, 7, 6.0, darkStoneMat);
      createPillar(4.5, 0, 7, 6.0, darkStoneMat);
      createPillar(-4.5, 0, -7, 6.0, darkStoneMat);
      createPillar(4.5, 0, -7, 6.0, darkStoneMat);

      // Glowing subterranean crystals & eerie braziers
      const crystalMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 1.6,
          roughness: 0.25,
        })
      );
      const crystalSpots: Array<[number, number]> = [
        [-18, -2], [18, 2], [0, 0], [-6, -20], [6, -20],
      ];
      crystalSpots.forEach(([cx, cz], i) => {
        const c = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.42, 1.6, 5)), crystalMat);
        c.position.set(cx, 0.75, cz);
        c.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.2;
        root.add(c);
        if (i < 3) {
          const l = new THREE.PointLight(0x38bdf8, 2.5, 14, 1.6);
          l.position.set(cx, 1.6, cz);
          root.add(l);
        }
      });

      createBrazier(-3.2, 0, 19, 0x38bdf8, true, 2.8);
      createBrazier(3.2, 0, 19, 0x38bdf8, false);
      createBrazier(-3.2, 0, -19, 0xff9b3d, true, 2.8);

      // Ancient Yantra in West Crypt (-15.5, 0, 0)
      createArtifactShrine('ancient_yantra', -15.5, 0, 0, 'Ancient Yantra', 0x38bdf8);

      // Secret Chests in East Crypt & South Alcove
      createRelicChest('chest_catacombs_1', 15.5, 0, 0);
      createRelicChest('chest_catacombs_2', 7.5, 0, 18);

      createLoreTablet(
        'lore_catacombs',
        0,
        0,
        18,
        'Subterranean Seal',
        'These tunnels sheltered the seekers who first mapped the Shadow Curse. Seek the Ancient Yantra in the western vault to unlock the Sunken Stepwell.'
      );
      createTrialShrine('trial_catacombs', -6, 0, 18);

      // Exit Portal to Sunken Stepwell (Chapter IV) + Return Portal to Temple
      createPortalGate(
        'portal_catacombs_stepwell',
        0,
        0,
        -24,
        'sunken_stepwell',
        'Sunken Stepwell',
        !collectedArtifacts.includes('ancient_yantra'),
        'Recover the Ancient Yantra in the West Crypt first',
        0x38bdf8
      );
      createPortalGate(
        'portal_catacombs_temple',
        0,
        0,
        26.5,
        'temple',
        'Return: Ancient Temple (Area 2)',
        false,
        '',
        0x94a3b8
      );

      enemySpawns.push(
        { id: 'c_sw1', type: 'shadow_walker', position: new THREE.Vector3(0, 0, 4) },
        { id: 'c_ab1', type: 'ancient_beast', position: new THREE.Vector3(-14, 0, 6) },
        { id: 'c_ds1', type: 'dark_spirit', position: new THREE.Vector3(14, 0, -5) },
        { id: 'c_ab2', type: 'ancient_beast', position: new THREE.Vector3(0, 0, -11) },
        { id: 'c_ds2', type: 'dark_spirit', position: new THREE.Vector3(-3, 0, -18) }
      );

      createAmbientParticles(130, 22, 5, 0x7dd3fc, 0.14);

      return finalizeArea({
        areaId,
        name: 'Underground Catacombs',
        subtitle: 'Area 3 · Vaults Beneath the Roots',
        isStoneGround: true,
        boundsRadius: 30,
        defaultSpawn: new THREE.Vector3(0, 0, 24),
        defaultYaw: Math.PI,
        groundHeightAt: () => 0,
      });
    }

    if (areaId === 'sanctum') {
      const fogColor = 0x160912;
      this.scene.background = new THREE.Color(fogColor);
      this.scene.fog = new THREE.FogExp2(fogColor, 0.026);

      const hemi = new THREE.HemisphereLight(0x9b4d5a, 0x1a0b12, 0.65);
      const rim = new THREE.DirectionalLight(0xfb923c, 1.1);
      rim.position.set(-16, 26, -14);
      if (this.shadowsEnabled) {
        rim.castShadow = true;
        rim.shadow.mapSize.set(1024, 1024);
        rim.shadow.camera.left = -32;
        rim.shadow.camera.right = 32;
        rim.shadow.camera.top = 32;
        rim.shadow.camera.bottom = -32;
      }
      root.add(hemi, rim);

      const obsMat = trackMat(
        new THREE.MeshStandardMaterial({ map: this.textures.obsidianFloor, roughness: 0.72, metalness: 0.25 })
      );

      // Abyssal mist plane below platforms
      const abyss = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(90, 40)),
        trackMat(new THREE.MeshBasicMaterial({ color: 0x0c0409 }))
      );
      abyss.rotation.x = -Math.PI / 2;
      abyss.position.y = -5;
      root.add(abyss);

      // Connected Obsidian Sanctum Islands & Bridges (player bounded nicely on walkable geometry)
      const addPlatform = (x: number, z: number, w: number, d: number) => {
        const m = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, 3, d)), obsMat);
        m.position.set(x, -1.5, z);
        m.receiveShadow = true;
        root.add(m);
      };
      addPlatform(0, 18, 14, 14); // South arrival island
      addPlatform(0, 0, 18, 18); // Central altar plaza
      addPlatform(0, 9, 6, 8); // South bridge
      addPlatform(-17, 0, 12, 12); // West monolith island
      addPlatform(-11, 0, 6, 6); // West bridge
      addPlatform(17, 0, 12, 12); // East monolith island
      addPlatform(11, 0, 6, 6); // East bridge
      addPlatform(0, -19, 14, 16); // North sanctum gate island
      addPlatform(0, -10, 6, 6); // North bridge

      // Invisible edge barriers around bridges/abyss so exploration stays crisp and fair
      addBoxCollider(-14, 0, 14, 18, 5, 10, false);
      addBoxCollider(14, 0, 14, 18, 5, 10, false);
      addBoxCollider(-14, 0, -14, 18, 5, 10, false);
      addBoxCollider(14, 0, -14, 18, 5, 10, false);

      // Broken Obsidian Pillars
      createPillar(-6.5, 0, 6.5, 6.5, obsMat);
      createPillar(6.5, 0, 6.5, 5.2, obsMat);
      createPillar(-6.5, 0, -6.5, 4.8, obsMat);
      createPillar(6.5, 0, -6.5, 6.8, obsMat);

      createBrazier(-3.5, 0, 13, 0xf97316, true, 3.2);
      createBrazier(3.5, 0, 13, 0xf97316, false);
      createBrazier(0, 0, -13, 0xef4444, true, 3.4);

      // 3 Corrupted Monoliths to Purify
      const createMonolith = (id: string, x: number, z: number, label: string) => {
        const purified = flags.purifiedMonoliths.includes(id);
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        const obelisk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.85, 4.2, 6)), obsMat);
        obelisk.position.y = 2.1;
        obelisk.castShadow = this.shadowsEnabled;
        const crystalMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: purified ? 0xfbbf24 : 0xef4444,
            emissive: purified ? 0xd97706 : 0xb91c1c,
            emissiveIntensity: 2.0,
          })
        );
        const gem = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.45, 0)), crystalMat);
        gem.position.y = 4.65;
        const light = new THREE.PointLight(purified ? 0xfbbf24 : 0xef4444, 2.4, 12, 1.5);
        light.position.y = 4.7;
        g.add(obelisk, gem, light);
        root.add(g);
        addCylCollider(x, 0, z, 0.9, 4.5, true);

        animatedCallbacks.push((dt) => {
          gem.rotation.y += dt * 1.5;
        });

        const beacon = createVisionBeacon(x, 0, z, 0xef4444);

        interactives.push({
          id,
          kind: 'monolith',
          label,
          promptText: 'Purify Corrupted Monolith',
          position: new THREE.Vector3(x, 1.2, z),
          radius: 3.3,
          mesh: g,
          beaconMesh: beacon,
          consumed: purified,
        });
      };

      createMonolith('mono_west', -17, 0, 'Western Monolith');
      createMonolith('mono_east', 17, 0, 'Eastern Monolith');
      createMonolith('mono_north', 0, -16, 'Northern Monolith');

      // Sacred Mantra at Center
      createArtifactShrine('sacred_mantra', 0, 0, 0, 'Sacred Mantra', 0xfbbf24);

      createRelicChest('chest_sanctum_1', 18, 0, 4);
      createLoreTablet(
        'lore_sanctum',
        -4.5,
        0,
        15,
        'Sanctum Vigil',
        'Three corrupted monoliths tether Kali Purusha’s eclipse seal. Purify all three pillars and claim the Sacred Mantra to breach the Final Chamber.'
      );
      createTrialShrine('trial_sanctum', 4.5, 0, 15);

      createSkyLandmark(0xef4444, 0xb91c1c, true, [-16, 38, -48]);

      // Eclipse Gate to Final Chamber + South Return Portal
      createPortalGate(
        'portal_sanctum_final',
        0,
        0,
        -24,
        'final_chamber',
        'Final Chamber',
        flags.purifiedMonoliths.length < 3,
        `Purify all 3 Monoliths (${flags.purifiedMonoliths.length}/3)`,
        0xef4444
      );
      createPortalGate(
        'portal_sanctum_prev',
        0,
        0,
        23.2,
        'realm_98',
        'Return: Eclipse Antechamber (Area 98)',
        false,
        '',
        0x94a3b8
      );

      enemySpawns.push(
        { id: 's_ab1', type: 'ancient_beast', position: new THREE.Vector3(-4, 0, 2) },
        { id: 's_tg1', type: 'temple_guardian', position: new THREE.Vector3(4, 0, -2) },
        { id: 's_ds1', type: 'dark_spirit', position: new THREE.Vector3(-16, 0, -3) },
        { id: 's_ab2', type: 'ancient_beast', position: new THREE.Vector3(16, 0, -3) },
        { id: 's_tg2', type: 'temple_guardian', position: new THREE.Vector3(0, 0, -18) }
      );

      createAmbientParticles(160, 28, 7, 0xfb7185, 0.17);

      return finalizeArea({
        areaId,
        name: 'Cursed Sanctum',
        subtitle: 'Area 99 · Bridges Above the Abyss',
        isStoneGround: true,
        boundsRadius: 27,
        defaultSpawn: new THREE.Vector3(0, 0, 22),
        defaultYaw: Math.PI,
        groundHeightAt: () => 0,
      });
    }

    // AREA 5: FINAL CHAMBER
    const fogColor = 0x11070d;
    this.scene.background = new THREE.Color(fogColor);
    this.scene.fog = new THREE.FogExp2(fogColor, 0.022);

    const hemi = new THREE.HemisphereLight(0xb45309, 0x180910, 0.72);
    const eclipseKey = new THREE.DirectionalLight(0xffb478, 1.3);
    eclipseKey.position.set(12, 28, 16);
    if (this.shadowsEnabled) {
      eclipseKey.castShadow = true;
      eclipseKey.shadow.mapSize.set(1024, 1024);
      eclipseKey.shadow.camera.left = -28;
      eclipseKey.shadow.camera.right = 28;
      eclipseKey.shadow.camera.top = 28;
      eclipseKey.shadow.camera.bottom = -28;
    }
    root.add(hemi, eclipseKey);

    // Grand Lotus-Mandala Arena Floor
    const arenaFloor = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(30, 48)),
      trackMat(
        new THREE.MeshStandardMaterial({
          map: this.textures.mandalaFloor,
          roughness: 0.68,
          metalness: 0.25,
        })
      )
    );
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.receiveShadow = true;
    root.add(arenaFloor);

    // 8 Towering Sanctum Pillars + Braziers around perimeter
    const obsPillarMat = trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.obsidianFloor, roughness: 0.75, metalness: 0.2 })
    );
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = Math.cos(a) * 21;
      const pz = Math.sin(a) * 21;
      createPillar(px, 0, pz, 8.5, obsPillarMat);
      createBrazier(Math.cos(a) * 18.5, 0, Math.sin(a) * 18.5, 0xfbbf24, i % 2 === 0, 3.6);
    }

    // Cosmic Eclipse Ring overhead
    const eclipseMesh = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(9, 0.35, 10, 48)),
      goldEmissiveMat
    );
    eclipseMesh.position.set(0, 17, -14);
    eclipseMesh.rotation.x = 0.45;
    root.add(eclipseMesh);
    animatedCallbacks.push((dt) => {
      eclipseMesh.rotation.z += dt * 0.25;
    });

    // Divine Amulet Shrine & Final Weapon Chest at Entrance Threshold
    createArtifactShrine('divine_amulet', 0, 0, 12, 'Divine Amulet', 0xfbbf24);
    createRelicChest('chest_final_1', 7, 0, 14);
    createTrialShrine('trial_final', -7, 0, 14);

    createSkyLandmark(0xfbbf24, 0xef4444, true, [0, 38, -54]);
    createPortalGate(
      'portal_final_sanctum',
      0,
      0,
      21.5,
      'sanctum',
      'Return: Cursed Sanctum (Area 99)',
      false,
      '',
      0x94a3b8
    );

    // Final Boss: Kali Purusha, Sovereign of Kalyug
    if (!flags.defeatedBosses.includes('boss_kali')) {
      enemySpawns.push({
        id: 'boss_kali',
        type: 'boss_kali',
        position: new THREE.Vector3(0, 0, -8),
      });
    }

    createAmbientParticles(180, 26, 10, 0xfbbf24, 0.19);

    return finalizeArea({
      areaId: 'final_chamber',
      name: 'Final Chamber',
      subtitle: 'Area 100 · Sanctum of the Eclipse',
      isStoneGround: true,
      boundsRadius: 24,
      defaultSpawn: new THREE.Vector3(0, 0, 18),
      defaultYaw: Math.PI,
      groundHeightAt: () => 0,
    });
  }
}
