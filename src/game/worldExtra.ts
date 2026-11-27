import * as THREE from 'three';
import { EnemySpawnConfig } from './enemy';
import { BiomeThemeId, getRealm, RealmDef } from './realms';
import { ProceduralTextureSet } from './textures';
import { AreaId, ColliderBox, EnemyType, InteractiveObject, WorldFlags } from './types';
import type { BuiltArea } from './world';

export interface AreaBuildHelpers {
  scene: THREE.Scene;
  root: THREE.Group;
  textures: ProceduralTextureSet;
  shadowsEnabled: boolean;
  lowSpec: boolean;
  flags: WorldFlags;
  enemiesDefeatedInAreaCount: number;
  colliders: ColliderBox[];
  interactives: InteractiveObject[];
  enemySpawns: EnemySpawnConfig[];
  animatedCallbacks: Array<(dt: number, t: number) => void>;
  flickeringLights: Array<{ light: THREE.PointLight; base: number; seed: number }>;
  sandstoneMat: THREE.MeshStandardMaterial;
  darkStoneMat: THREE.MeshStandardMaterial;
  bronzeMat: THREE.MeshStandardMaterial;
  goldEmissiveMat: THREE.MeshStandardMaterial;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  addBoxCollider: (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    blocksCamera?: boolean
  ) => void;
  addCylCollider: (
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    blocksCamera?: boolean
  ) => void;
  createPillar: (
    x: number,
    y: number,
    z: number,
    height?: number,
    mat?: THREE.MeshStandardMaterial
  ) => THREE.Group;
  createBrazier: (
    x: number,
    y: number,
    z: number,
    color?: number,
    withLight?: boolean,
    intensity?: number
  ) => void;
  createPortalGate: (
    id: string,
    x: number,
    y: number,
    z: number,
    targetArea: AreaId,
    label: string,
    locked: boolean,
    lockReason: string,
    portalColor?: number
  ) => { discMat: THREE.MeshBasicMaterial; portalLight: THREE.PointLight };
  createRelicChest: (
    id: string,
    x: number,
    y: number,
    z: number,
    locked?: boolean,
    lockReason?: string
  ) => void;
  createLoreTablet: (
    id: string,
    x: number,
    y: number,
    z: number,
    title: string,
    text: string
  ) => void;
  createTrialShrine: (id: string, x: number, y: number, z: number) => void;
  createAmbientParticles: (
    count: number,
    radius: number,
    height: number,
    color: number,
    size?: number
  ) => void;
  createSkyLandmark: (
    discColor: number,
    haloColor: number,
    isEclipse?: boolean,
    pos?: [number, number, number]
  ) => void;
  finalizeArea: (cfg: {
    areaId: AreaId;
    name: string;
    subtitle: string;
    isStoneGround: boolean;
    boundsRadius: number;
    defaultSpawn: THREE.Vector3;
    defaultYaw: number;
    groundHeightAt: (x: number, z: number) => number;
  }) => BuiltArea;
}

interface BiomeVisualConfig {
  fogColor: number;
  fogDensity: number;
  hemiSky: number;
  hemiGround: number;
  dirColor: number;
  floorTint: number;
  floorMode: 'forest' | 'sandstone' | 'catacomb' | 'obsidian' | 'mandala';
  accentColor: number;
  brazierColor: number;
  particleColor: number;
  portalColor: number;
  enemyTypes: EnemyType[];
}

const BIOME_VISUALS: Record<BiomeThemeId, BiomeVisualConfig> = {
  sacred_grove: {
    fogColor: 0x07130d,
    fogDensity: 0.028,
    hemiSky: 0x3b6e5c,
    hemiGround: 0x0e190f,
    dirColor: 0x99d5c9,
    floorTint: 0xffffff,
    floorMode: 'forest',
    accentColor: 0x34d399,
    brazierColor: 0xff9b3d,
    particleColor: 0xa7f3d0,
    portalColor: 0x34d399,
    enemyTypes: ['shadow_walker', 'dark_spirit', 'ancient_beast'],
  },
  stepwell_waters: {
    fogColor: 0x07131a,
    fogDensity: 0.025,
    hemiSky: 0x38bdf8,
    hemiGround: 0x0f1b22,
    dirColor: 0xa5f3fc,
    floorTint: 0xdfd8cb,
    floorMode: 'sandstone',
    accentColor: 0x06b6d4,
    brazierColor: 0x38bdf8,
    particleColor: 0x67e8f9,
    portalColor: 0x38bdf8,
    enemyTypes: ['shadow_walker', 'dark_spirit', 'temple_guardian'],
  },
  vedic_ashram: {
    fogColor: 0x11120a,
    fogDensity: 0.025,
    hemiSky: 0xfde68a,
    hemiGround: 0x1a1c10,
    dirColor: 0xffcf77,
    floorTint: 0x70634e,
    floorMode: 'forest',
    accentColor: 0xfbbf24,
    brazierColor: 0xf59e0b,
    particleColor: 0xfde047,
    portalColor: 0xfbbf24,
    enemyTypes: ['shadow_walker', 'temple_guardian', 'ancient_beast'],
  },
  himalayan_frost: {
    fogColor: 0x0b1623,
    fogDensity: 0.024,
    hemiSky: 0xbae6fd,
    hemiGround: 0x132030,
    dirColor: 0xe0f2fe,
    floorTint: 0xaec6cf,
    floorMode: 'catacomb',
    accentColor: 0x7dd3fc,
    brazierColor: 0x38bdf8,
    particleColor: 0xe0f2fe,
    portalColor: 0x7dd3fc,
    enemyTypes: ['dark_spirit', 'temple_guardian', 'ancient_beast'],
  },
  ash_cremation: {
    fogColor: 0x160a0d,
    fogDensity: 0.027,
    hemiSky: 0xfb923c,
    hemiGround: 0x170d0e,
    dirColor: 0xfdba74,
    floorTint: 0x574c4c,
    floorMode: 'catacomb',
    accentColor: 0xf97316,
    brazierColor: 0xf97316,
    particleColor: 0xfb923c,
    portalColor: 0xf97316,
    enemyTypes: ['dark_spirit', 'ancient_beast', 'shadow_walker'],
  },
  asura_citadel: {
    fogColor: 0x160708,
    fogDensity: 0.025,
    hemiSky: 0x991b1b,
    hemiGround: 0x14080a,
    dirColor: 0xfb7185,
    floorTint: 0xffffff,
    floorMode: 'obsidian',
    accentColor: 0xef4444,
    brazierColor: 0xef4444,
    particleColor: 0xfb7185,
    portalColor: 0xf43f5e,
    enemyTypes: ['temple_guardian', 'ancient_beast', 'dark_spirit'],
  },
  astral_yantra: {
    fogColor: 0x0b0a1a,
    fogDensity: 0.022,
    hemiSky: 0xa78bfa,
    hemiGround: 0x1a1526,
    dirColor: 0xfde68a,
    floorTint: 0xffffff,
    floorMode: 'mandala',
    accentColor: 0xa78bfa,
    brazierColor: 0xc084fc,
    particleColor: 0xc4b5fd,
    portalColor: 0xc084fc,
    enemyTypes: ['dark_spirit', 'temple_guardian', 'ancient_beast'],
  },
  patala_caverns: {
    fogColor: 0x04120e,
    fogDensity: 0.034,
    hemiSky: 0x10b981,
    hemiGround: 0x05100c,
    dirColor: 0x6ee7b7,
    floorTint: 0x5c7c73,
    floorMode: 'catacomb',
    accentColor: 0x10b981,
    brazierColor: 0x34d399,
    particleColor: 0x34d399,
    portalColor: 0x10b981,
    enemyTypes: ['ancient_beast', 'dark_spirit', 'temple_guardian'],
  },
  indra_swarga: {
    fogColor: 0x171207,
    fogDensity: 0.021,
    hemiSky: 0xfef08a,
    hemiGround: 0x261c0a,
    dirColor: 0xfde047,
    floorTint: 0xfde68a,
    floorMode: 'mandala',
    accentColor: 0xfbbf24,
    brazierColor: 0xfbbf24,
    particleColor: 0xfef08a,
    portalColor: 0xfbbf24,
    enemyTypes: ['temple_guardian', 'dark_spirit', 'ancient_beast'],
  },
  kalyug_abyss: {
    fogColor: 0x15060f,
    fogDensity: 0.026,
    hemiSky: 0xbe123c,
    hemiGround: 0x160710,
    dirColor: 0xfb7185,
    floorTint: 0x8f6b7a,
    floorMode: 'obsidian',
    accentColor: 0xf43f5e,
    brazierColor: 0xef4444,
    particleColor: 0xfb7185,
    portalColor: 0xef4444,
    enemyTypes: ['temple_guardian', 'ancient_beast', 'dark_spirit'],
  },
};

function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildProceduralMythicRealm(realm: RealmDef, h: AreaBuildHelpers): BuiltArea {
  const {
    scene,
    root,
    textures,
    shadowsEnabled,
    lowSpec,
    flags,
    enemiesDefeatedInAreaCount,
    enemySpawns,
    animatedCallbacks,
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
  } = h;

  const vis = BIOME_VISUALS[realm.biome];
  const rng = createSeededRng(realm.index * 9973 + 1337);
  const layoutVariant = realm.index % 4;
  const reqKills = realm.requiredKills;
  const isMilestoneWardenArea = realm.index % 10 === 0;
  const wardenKey = `warden_${realm.id}`;
  const wardenDefeated = !isMilestoneWardenArea || flags.defeatedBosses.includes(wardenKey);
  const foesCleared = enemiesDefeatedInAreaCount >= reqKills && wardenDefeated;

  scene.background = new THREE.Color(vis.fogColor);
  scene.fog = new THREE.FogExp2(vis.fogColor, vis.fogDensity);

  const hemi = new THREE.HemisphereLight(vis.hemiSky, vis.hemiGround, 0.72);
  const keyX = 16 * (rng() > 0.5 ? 1 : -1);
  const key = new THREE.DirectionalLight(vis.dirColor, 1.2);
  key.position.set(keyX, 28, 14);
  if (shadowsEnabled) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -32;
    key.shadow.camera.right = 32;
    key.shadow.camera.top = 32;
    key.shadow.camera.bottom = -32;
  }
  root.add(hemi, key);

  // Celestial Sky Landmark for all non-subterranean realms
  if (realm.biome !== 'patala_caverns') {
    const isEclipse = realm.biome === 'kalyug_abyss' || realm.biome === 'asura_citadel';
    createSkyLandmark(vis.dirColor, vis.accentColor, isEclipse, [keyX * 1.1, 40, -52]);
  }

  const floorTex =
    vis.floorMode === 'forest'
      ? textures.forestGround
      : vis.floorMode === 'sandstone'
      ? textures.sandstone
      : vis.floorMode === 'catacomb'
      ? textures.catacombStone
      : vis.floorMode === 'obsidian'
      ? textures.obsidianFloor
      : textures.mandalaFloor;

  const floorBump =
    vis.floorMode === 'sandstone'
      ? textures.sandstoneBump
      : vis.floorMode === 'catacomb' || vis.floorMode === 'obsidian'
      ? textures.stoneBump
      : undefined;

  const floorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorBump,
      bumpScale: floorBump ? 0.032 : 0,
      color: vis.floorTint,
      roughness: vis.floorMode === 'obsidian' || vis.floorMode === 'mandala' ? 0.74 : 0.9,
      metalness: vis.floorMode === 'obsidian' || vis.floorMode === 'mandala' ? 0.24 : 0.05,
    })
  );

  // Undulating natural outer terrain for outdoor landscape biomes
  const hasNaturalHills =
    realm.biome === 'sacred_grove' ||
    realm.biome === 'himalayan_frost' ||
    realm.biome === 'ash_cremation' ||
    realm.biome === 'vedic_ashram';

  const terrainPhase = realm.index * 0.73;
  const outerHillHeightAt = (x: number, z: number): number => {
    if (!hasNaturalHills) return 0;
    const r = Math.hypot(x, z);
    // Keep inner playable courtyard & N/S portal roads smoothly level
    if (r <= 21.5 || (Math.abs(x) <= 5.5 && Math.abs(z) <= 29)) return 0;
    const t = Math.min(1, (r - 21.5) / 14);
    const wave =
      Math.sin(x * 0.14 + terrainPhase) * Math.cos(z * 0.14 - terrainPhase) * 0.95 +
      Math.sin((x + z) * 0.08) * 0.65 +
      1.35;
    return Math.max(0, t * t * wave);
  };

  if (hasNaturalHills) {
    const seg = lowSpec ? 24 : 36;
    const terrainGeo = trackGeo(new THREE.PlaneGeometry(148, 148, seg, seg));
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, outerHillHeightAt(vx, vz));
    }
    terrainGeo.computeVertexNormals();
    const ground = new THREE.Mesh(terrainGeo, floorMat);
    ground.receiveShadow = true;
    root.add(ground);
  } else {
    const ground = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(74, 44)), floorMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);
  }

  const pillarMat =
    realm.biome === 'asura_citadel' || realm.biome === 'kalyug_abyss'
      ? trackMat(
          new THREE.MeshStandardMaterial({
            map: textures.obsidianFloor,
            bumpMap: textures.stoneBump,
            bumpScale: 0.03,
            roughness: 0.74,
            metalness: 0.28,
          })
        )
      : realm.biome === 'patala_caverns' || realm.biome === 'himalayan_frost'
      ? darkStoneMat
      : sandstoneMat;

  // Subterranean roof for Patala Caverns
  if (realm.biome === 'patala_caverns') {
    const ceiling = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(66, 30)), darkStoneMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8.2;
    root.add(ceiling);
  }

  // Central Architectural Feature by Biome & Layout Variant (with Stepped Stairs / Baori Curb)
  let plinthHalf = 0;
  let plinthHeight = 0;
  if (layoutVariant === 0 || realm.biome === 'vedic_ashram' || realm.biome === 'indra_swarga') {
    plinthHalf = 11;
    plinthHeight = 0.48;
    const plinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(22, plinthHeight, 22)), pillarMat);
    plinth.position.set(0, plinthHeight * 0.5, 0);
    plinth.receiveShadow = true;
    root.add(plinth);

    // North & South Stone Stairs onto the Plinth
    const southStep = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.4, plinthHeight * 0.5, 1.8)), pillarMat);
    southStep.position.set(0, plinthHeight * 0.25, plinthHalf + 0.9);
    southStep.receiveShadow = true;
    const northStep = southStep.clone();
    northStep.position.set(0, plinthHeight * 0.25, -(plinthHalf + 0.9));
    root.add(southStep, northStep);
  } else if (realm.biome === 'stepwell_waters') {
    const waterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0e7490,
        emissive: 0x0891b2,
        emissiveIntensity: 0.65,
        roughness: 0.16,
        metalness: 0.7,
      })
    );
    const curb = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(6.35, 0.28, 6, 28)), sandstoneMat);
    curb.rotation.x = Math.PI / 2;
    curb.position.y = 0.12;
    curb.receiveShadow = true;
    const pool = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(6.2, 28)), waterMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.04;
    root.add(curb, pool);
    animatedCallbacks.push((_dt, t) => {
      waterMat.emissiveIntensity = 0.58 + Math.sin(t * 2.1 + realm.index) * 0.14;
    });
  }

  // Stone pathway spine
  const path = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(4.8, 52)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.stonePath,
        bumpMap: textures.stoneBump,
        bumpScale: 0.03,
        roughness: 0.88,
      })
    )
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, 0);
  path.receiveShadow = true;
  root.add(path);

  const groundHeightAt = (x: number, z: number) => {
    if (plinthHalf > 0) {
      if (Math.abs(x) <= plinthHalf && Math.abs(z) <= plinthHalf) return plinthHeight;
      if (Math.abs(x) <= 3.2 && Math.abs(z) > plinthHalf && Math.abs(z) <= plinthHalf + 1.8) {
        return plinthHeight * 0.5;
      }
    }
    return outerHillHeightAt(x, z);
  };

  // Centerpiece Landmark
  if (realm.biome === 'astral_yantra' || realm.biome === 'indra_swarga') {
    const ringA = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(6.2, 0.18, 8, 36)), goldEmissiveMat);
    ringA.position.set(0, 10.5, 0);
    const ringB = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(4.6, 0.14, 8, 32)), bronzeMat);
    ringB.position.set(0, 10.5, 0);
    ringB.rotation.x = Math.PI / 3;
    root.add(ringA, ringB);
    animatedCallbacks.push((dt) => {
      ringA.rotation.y += dt * 0.48;
      ringB.rotation.z -= dt * 0.56;
    });
  } else if (realm.biome === 'kalyug_abyss') {
    const eclipse = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(7.2, 0.3, 8, 36)),
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xb91c1c,
          emissiveIntensity: 1.8,
        })
      )
    );
    eclipse.position.set(0, 13.5, -14);
    eclipse.rotation.x = 0.42;
    root.add(eclipse);
    animatedCallbacks.push((dt) => {
      eclipse.rotation.z += dt * 0.35;
    });
  }

  // Pillars & Braziers (Variant-dependent pattern)
  if (layoutVariant === 2) {
    const count = 8;
    const rad = 13.5;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const px = Math.cos(a) * rad;
      const pz = Math.sin(a) * rad;
      const py = groundHeightAt(px, pz);
      createPillar(px, py, pz, 5.2 + (i % 3) * 0.6, pillarMat);
      if (i % 2 === 0) {
        createBrazier(Math.cos(a) * (rad - 3.2), py, Math.sin(a) * (rad - 3.2), vis.brazierColor, i % 4 === 0, 3.0);
      }
    }
  } else {
    const zRows = layoutVariant === 1 ? [14, 5, -5, -14] : [11, 0, -11];
    const xOffset = layoutVariant === 3 ? 9.5 : 8.2;
    for (let idx = 0; idx < zRows.length; idx++) {
      const pz = zRows[idx];
      const pyL = groundHeightAt(-xOffset, pz);
      const pyR = groundHeightAt(xOffset, pz);
      createPillar(-xOffset, pyL, pz, 5.4 + (idx % 2) * 0.9, pillarMat);
      createPillar(xOffset, pyR, pz, 5.4 + (idx % 2) * 0.9, pillarMat);
      createBrazier(-4.8, groundHeightAt(-4.8, pz), pz, vis.brazierColor, idx % 2 === 0, 3.1);
      createBrazier(4.8, groundHeightAt(4.8, pz), pz, vis.brazierColor, false);
    }
  }

  // Flanking Walls on Citadel / Variant 3
  if (realm.biome === 'asura_citadel' || layoutVariant === 3) {
    const wallSpecs: Array<[number, number, number, number]> = [
      [-18.5, 2, 2.4, 30],
      [18.5, 2, 2.4, 30],
    ];
    for (const [wx, wz, ww, wd] of wallSpecs) {
      const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(ww, 5.6, wd)), pillarMat);
      wall.position.set(wx, 2.8, wz);
      wall.castShadow = shadowsEnabled;
      wall.receiveShadow = true;
      root.add(wall);
      addBoxCollider(wx, 0, wz, ww, 5.6, wd, true);
    }
  }

  // Visible Physical Perimeter Ring (so world boundaries feel real, not invisible walls)
  const perimCount = lowSpec ? 18 : 26;
  const perimGeo =
    realm.biome === 'asura_citadel' || realm.biome === 'kalyug_abyss'
      ? trackGeo(new THREE.BoxGeometry(3.4, 3.8, 2.2))
      : realm.biome === 'himalayan_frost'
      ? trackGeo(new THREE.ConeGeometry(2.3, 5.4, 5))
      : trackGeo(new THREE.DodecahedronGeometry(2.2, 0));
  const perimMat =
    realm.biome === 'himalayan_frost'
      ? trackMat(new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.35, metalness: 0.2 }))
      : realm.biome === 'asura_citadel' || realm.biome === 'kalyug_abyss'
      ? pillarMat
      : trackMat(new THREE.MeshStandardMaterial({ color: 0x2c2b29, bumpMap: textures.stoneBump, bumpScale: 0.04, roughness: 0.92 }));
  const perimCoords: Array<{ x: number; z: number; s: number; a: number }> = [];
  for (let i = 0; i < perimCount; i++) {
    const a = (i / perimCount) * Math.PI * 2;
    const px = Math.cos(a) * 32.5;
    const pz = Math.sin(a) * 32.5;
    if (Math.abs(px) < 5.5) continue; // Keep North/South Portal horizons open
    perimCoords.push({ x: px, z: pz, s: 0.85 + (i % 3) * 0.25, a });
  }
  if (perimCoords.length > 0) {
    const perimInst = new THREE.InstancedMesh(perimGeo, perimMat, perimCoords.length);
    perimInst.receiveShadow = true;
    const pDummy = new THREE.Object3D();
    perimCoords.forEach((p, idx) => {
      const py = outerHillHeightAt(p.x, p.z);
      pDummy.position.set(p.x, py + 1.25 * p.s, p.z);
      pDummy.rotation.set(0, p.a + Math.PI * 0.5, 0);
      pDummy.scale.set(p.s * 1.15, p.s * 0.95, p.s);
      pDummy.updateMatrix();
      perimInst.setMatrixAt(idx, pDummy.matrix);
    });
    perimInst.instanceMatrix.needsUpdate = true;
    perimInst.computeBoundingSphere();
    root.add(perimInst);
  }

  // Biome Props: Trees for Grove/Ashram, Crystals for Frost/Patala/Abyss, Boulders otherwise
  if (realm.biome === 'sacred_grove' || realm.biome === 'vedic_ashram') {
    const treeCount = lowSpec ? 16 : 24;
    const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.36, 0.6, 5.8, 7));
    const trunkMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.bark,
        bumpMap: textures.barkBump,
        bumpScale: 0.06,
        roughness: 0.92,
      })
    );
    const canopyGeo = trackGeo(new THREE.DodecahedronGeometry(2.5, 1));
    const canopyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: realm.biome === 'vedic_ashram' ? 0x3f6212 : 0x163020,
        roughness: 0.88,
      })
    );
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < treeCount; i++) {
      const ang = (i / treeCount) * Math.PI * 2 + rng() * 0.25;
      const rad = i < 8 ? 17 + rng() * 6 : 29 + rng() * 8;
      const tx = Math.cos(ang) * rad;
      const tz = Math.sin(ang) * rad;
      const ty = outerHillHeightAt(tx, tz);
      const ts = 0.95 + rng() * 0.35;
      dummy.position.set(tx, ty + 2.9 * ts, tz);
      dummy.rotation.set(0, ang, 0);
      dummy.scale.setScalar(ts);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tx, ty + 6.0 * ts, tz);
      dummy.scale.set(ts * 1.12, ts * 0.9, ts * 1.12);
      dummy.updateMatrix();
      canopyInst.setMatrixAt(i, dummy.matrix);
      if (i < 8) {
        addCylCollider(tx, ty, tz, 0.72 * ts, 6.2, true);
      }
    }
    trunkInst.instanceMatrix.needsUpdate = true;
    canopyInst.instanceMatrix.needsUpdate = true;
    root.add(trunkInst, canopyInst);
  } else if (
    realm.biome === 'himalayan_frost' ||
    realm.biome === 'patala_caverns' ||
    realm.biome === 'kalyug_abyss'
  ) {
    const spireMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: vis.accentColor,
        emissive: vis.accentColor,
        emissiveIntensity: 1.35,
        roughness: 0.24,
      })
    );
    const spireGeo = trackGeo(new THREE.ConeGeometry(0.75, 3.0, 5));
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.35;
      const cx = Math.cos(ang) * 16.5;
      const cz = Math.sin(ang) * 16.5;
      const cy = groundHeightAt(cx, cz);
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(cx, cy + 1.45, cz);
      spire.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.18;
      root.add(spire);
      addCylCollider(cx, cy, cz, 0.9, 3.0, false);
      if (i % 3 === 0) {
        const l = new THREE.PointLight(vis.accentColor, 2.2, 14, 1.5);
        l.position.set(cx, cy + 2.1, cz);
        root.add(l);
      }
    }
  } else {
    const rockGeo = trackGeo(new THREE.DodecahedronGeometry(1.3, 0));
    const rockMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x35312c,
        bumpMap: textures.stoneBump,
        bumpScale: 0.04,
        roughness: 0.92,
      })
    );
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.4;
      const rx = Math.cos(ang) * 17.5;
      const rz = Math.sin(ang) * 17.5;
      const ry = groundHeightAt(rx, rz);
      const rs = 0.9 + rng() * 0.45;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, ry + rs * 0.55, rz);
      rock.scale.set(rs * 1.2, rs * 0.78, rs);
      rock.rotation.y = ang;
      root.add(rock);
      addCylCollider(rx, ry, rz, rs * 1.05, 2.0, false);
    }
  }

  // Chests, Trial Shrine, Lore Tablet (seeded varied spots avoiding center obstacles)
  const chest1X = rng() > 0.5 ? -13.5 : 13.5;
  const chest2X = -chest1X;
  const chest1Z = 7 + (rng() - 0.5) * 4;
  const chest2Z = -8 + (rng() - 0.5) * 4;
  createRelicChest(`chest_${realm.id}_1`, chest1X, groundHeightAt(chest1X, chest1Z), chest1Z);
  createRelicChest(`chest_${realm.id}_2`, chest2X, groundHeightAt(chest2X, chest2Z), chest2Z);

  const trialX = rng() > 0.5 ? -6.5 : 6.5;
  const trialZ = 14.5;
  createTrialShrine(`trial_${realm.id}`, trialX, groundHeightAt(trialX, trialZ), trialZ);

  const loreX = -trialX;
  const loreZ = 14.5;
  createLoreTablet(
    `lore_${realm.id}`,
    loreX,
    groundHeightAt(loreX, loreZ),
    loreZ,
    realm.loreTitle,
    realm.loreText
  );

  // North Portal -> Next Realm (Kill-Gated + Warden-Gated on every 10th milestone area!)
  if (realm.nextAreaId) {
    const nextRealm = getRealm(realm.nextAreaId);
    const lockMsg = isMilestoneWardenArea && !wardenDefeated
      ? `Vanquish the Realm Warden & ${reqKills} Shadows (${Math.min(reqKills, enemiesDefeatedInAreaCount)}/${reqKills})`
      : `Banish ${reqKills} Realm Shadows (${Math.min(reqKills, enemiesDefeatedInAreaCount)}/${reqKills})`;
    createPortalGate(
      `portal_${realm.id}_next`,
      0,
      0,
      -23,
      realm.nextAreaId,
      `${nextRealm.name} (Area ${nextRealm.index})`,
      !foesCleared,
      lockMsg,
      vis.portalColor
    );
  }

  // South Return Portal -> Previous Realm (Always Open)
  if (realm.prevAreaId) {
    const prevRealm = getRealm(realm.prevAreaId);
    createPortalGate(
      `portal_${realm.id}_prev`,
      0,
      0,
      26.5,
      realm.prevAreaId,
      `Return: ${prevRealm.name} (Area ${prevRealm.index})`,
      false,
      '',
      0x94a3b8
    );
  }

  // Scaled Biome-Adapted Enemy Spawns (5 threats per realm, with Realm Warden on milestone 10s!)
  const enemyPositions: Array<[number, number]> = [
    [-5.5, 7.5],
    [6.5, 4.0],
    [-6.5, -5.5],
    [6.0, -9.5],
    [0, -16.0],
  ];
  enemyPositions.forEach(([ex, ez], idx) => {
    const isWardenSlot = isMilestoneWardenArea && idx === 4 && !flags.defeatedBosses.includes(wardenKey);
    const etype: EnemyType = isWardenSlot
      ? 'temple_guardian'
      : vis.enemyTypes[idx % vis.enemyTypes.length];
    const ey = groundHeightAt(ex, ez);
    enemySpawns.push({
      id: isWardenSlot ? wardenKey : `${realm.id}_e${idx + 1}`,
      type: etype,
      position: new THREE.Vector3(ex, ey, ez),
      tintHex: vis.accentColor,
      isWarden: isWardenSlot,
      wardenTitle: isWardenSlot ? `Warden of ${realm.name}` : undefined,
      scaleMult: isWardenSlot ? 1.3 : 1.0,
    });
  });

  createAmbientParticles(130, 27, 7, vis.particleColor, 0.16);

  return finalizeArea({
    areaId: realm.id,
    name: realm.name,
    subtitle: realm.subtitle,
    isStoneGround: realm.isStoneGround,
    boundsRadius: 31,
    defaultSpawn: new THREE.Vector3(0, 0, 21.5),
    defaultYaw: Math.PI,
    groundHeightAt,
  });
}

export function buildExtendedArea(areaId: AreaId, h: AreaBuildHelpers): BuiltArea | null {
  const {
    scene,
    root,
    textures,
    shadowsEnabled,
    enemiesDefeatedInAreaCount,
    enemySpawns,
    animatedCallbacks,
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
  } = h;

  const foesCleared = enemiesDefeatedInAreaCount >= 3;

  // =========================================================================
  // AREA 4: SUNKEN STEPWELL (BAORI)
  // =========================================================================
  if (areaId === 'sunken_stepwell') {
    const fogColor = 0x071319;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.025);

    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x0f1a1f, 0.72);
    const key = new THREE.DirectionalLight(0xa5f3fc, 1.15);
    key.position.set(16, 28, 12);
    if (shadowsEnabled) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -32;
      key.shadow.camera.right = 32;
      key.shadow.camera.top = 32;
      key.shadow.camera.bottom = -32;
    }
    root.add(hemi, key);

    const ground = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(72, 48)), sandstoneMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);

    const waterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0e7490,
        emissive: 0x0891b2,
        emissiveIntensity: 0.7,
        roughness: 0.16,
        metalness: 0.7,
      })
    );
    const curb = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(6.95, 0.3, 6, 32)), sandstoneMat);
    curb.rotation.x = Math.PI / 2;
    curb.position.y = 0.14;
    curb.receiveShadow = true;
    const pool = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(6.8, 32)), waterMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.04;
    root.add(curb, pool);
    animatedCallbacks.push((_dt, t) => {
      waterMat.emissiveIntensity = 0.62 + Math.sin(t * 2.1) * 0.15;
    });

    const ringOuter = new THREE.Mesh(trackGeo(new THREE.RingGeometry(8.5, 11.2, 32)), darkStoneMat);
    ringOuter.rotation.x = -Math.PI / 2;
    ringOuter.position.y = 0.03;
    root.add(ringOuter);

    createSkyLandmark(0xa5f3fc, 0x38bdf8, false, [16, 42, -52]);

    const stepCoords: Array<[number, number, number, number]> = [
      [-18, 0, 3.2, 38],
      [18, 0, 3.2, 38],
      [-12, -23, 12, 3.2],
      [12, -23, 12, 3.2],
    ];
    for (const [wx, wz, ww, wd] of stepCoords) {
      const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(ww, 5.2, wd)), sandstoneMat);
      wall.position.set(wx, 2.6, wz);
      wall.castShadow = shadowsEnabled;
      wall.receiveShadow = true;
      root.add(wall);
      addBoxCollider(wx, 0, wz, ww, 5.2, wd, true);
    }

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = Math.cos(a) * 11.5;
      const pz = Math.sin(a) * 11.5;
      createPillar(px, 0, pz, 5.8, sandstoneMat);
      createBrazier(Math.cos(a) * 8.2, 0, Math.sin(a) * 8.2, 0x38bdf8, i % 2 === 0, 3.0);
    }

    const lotus = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(0.8, 1)),
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.6,
          roughness: 0.2,
        })
      )
    );
    lotus.position.set(0, 1.4, 0);
    root.add(lotus);
    addCylCollider(0, 0, 0, 1.1, 2.0, false);
    animatedCallbacks.push((dt, t) => {
      lotus.rotation.y += dt * 1.1;
      lotus.position.y = 1.4 + Math.sin(t * 2.2) * 0.16;
    });

    createRelicChest('chest_stepwell_1', -13.5, 0, 13.5);
    createRelicChest('chest_stepwell_2', 13.5, 0, -11.5);
    createTrialShrine('trial_stepwell', -12.5, 0, -4);
    createLoreTablet(
      'lore_stepwell',
      11.5,
      0,
      9,
      'Chand-Baori Inscription',
      'Waters of remembrance gather in the sunken stone tiers. Open the Relic Chests to claim newly awakened weapons before ascending toward the Shattered Ashram.'
    );

    createPortalGate(
      'portal_stepwell_ashram',
      0,
      0,
      -23,
      'ashram_ruins',
      'Shattered Ashram (Area 5)',
      !foesCleared,
      `Banish 3 Stepwell Shadows (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0x34d399
    );
    createPortalGate(
      'portal_stepwell_prev',
      0,
      0,
      26.5,
      'catacombs',
      'Return: Underground Catacombs (Area 3)',
      false,
      '',
      0x94a3b8
    );

    enemySpawns.push(
      { id: 'sw_1', type: 'shadow_walker', position: new THREE.Vector3(-6, 0, 12) },
      { id: 'sw_2', type: 'dark_spirit', position: new THREE.Vector3(7, 0, 7) },
      { id: 'sw_3', type: 'temple_guardian', position: new THREE.Vector3(-8, 0, -9) },
      { id: 'sw_4', type: 'temple_guardian', position: new THREE.Vector3(7, 0, -14) },
      { id: 'sw_5', type: 'dark_spirit', position: new THREE.Vector3(0, 0, -17) }
    );

    createAmbientParticles(140, 28, 7, 0x67e8f9, 0.16);

    return finalizeArea({
      areaId,
      name: 'Sunken Stepwell',
      subtitle: 'Area 4 · Tiered Waters of Chand-Baori',
      isStoneGround: true,
      boundsRadius: 31,
      defaultSpawn: new THREE.Vector3(0, 0, 23),
      defaultYaw: Math.PI,
      groundHeightAt: () => 0,
    });
  }

  // =========================================================================
  // AREA 5: SHATTERED RISHI ASHRAM
  // =========================================================================
  if (areaId === 'ashram_ruins') {
    const fogColor = 0x10130a;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.026);

    const hemi = new THREE.HemisphereLight(0xfde68a, 0x161d10, 0.72);
    const sunKey = new THREE.DirectionalLight(0xffcf77, 1.25);
    sunKey.position.set(18, 30, 14);
    if (shadowsEnabled) {
      sunKey.castShadow = true;
      sunKey.shadow.mapSize.set(1024, 1024);
      sunKey.shadow.camera.left = -32;
      sunKey.shadow.camera.right = 32;
      sunKey.shadow.camera.top = 32;
      sunKey.shadow.camera.bottom = -32;
    }
    root.add(hemi, sunKey);

    const ground = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(78, 48)),
      trackMat(
        new THREE.MeshStandardMaterial({
          map: textures.forestGround,
          color: 0x4b4232,
          roughness: 0.92,
        })
      )
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);

    const court = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(24, 0.4, 28)), sandstoneMat);
    court.position.set(0, 0.2, 0);
    court.receiveShadow = true;
    const southStep = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.4, 0.2, 1.8)), sandstoneMat);
    southStep.position.set(0, 0.1, 14.9);
    const northStep = southStep.clone();
    northStep.position.set(0, 0.1, -14.9);
    root.add(court, southStep, northStep);
    createSkyLandmark(0xfde68a, 0xf59e0b, false, [18, 42, -52]);

    const trunkMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.bark,
        bumpMap: textures.barkBump,
        bumpScale: 0.06,
        roughness: 0.9,
      })
    );
    const leafMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.85 }));
    const treePositions: Array<[number, number]> = [
      [-16, 12], [16, 12], [-18, -6], [18, -6], [-15, -18], [15, -18],
    ];
    for (const [tx, tz] of treePositions) {
      const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.75, 5.5, 8)), trunkMat);
      trunk.position.set(tx, 2.75, tz);
      trunk.castShadow = shadowsEnabled;
      const canopy = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(3.1, 1)), leafMat);
      canopy.position.set(tx, 6.2, tz);
      canopy.castShadow = shadowsEnabled;
      root.add(trunk, canopy);
      addCylCollider(tx, 0, tz, 0.85, 6, true);
    }

    for (const px of [-9, 9]) {
      for (const pz of [9, 0, -9]) {
        createPillar(px, 0.4, pz, 5.4, sandstoneMat);
      }
    }
    createBrazier(-3.6, 0.4, 10, 0xfbbf24, true, 3.3);
    createBrazier(3.6, 0.4, 10, 0xfbbf24, false);
    createBrazier(0, 0.4, 0, 0xf97316, true, 4.0);
    createBrazier(-3.6, 0.4, -10, 0xfbbf24, true, 3.3);
    createBrazier(3.6, 0.4, -10, 0xfbbf24, false);

    createRelicChest('chest_ashram_1', -10.5, 0.4, 4.5);
    createRelicChest('chest_ashram_2', 10.5, 0.4, -5.5);
    createTrialShrine('trial_ashram', -6, 0.4, -7);
    createLoreTablet(
      'lore_ashram',
      6,
      0.4,
      8,
      'Rishi Hermitage Scroll',
      'Here the Saptarishis chanted Rigveda hymns before Kalyug thickened. Collect stronger box weapons and test your skill at the Tapasya Altar.'
    );

    createPortalGate(
      'portal_ashram_fortress',
      0,
      0,
      -23,
      'asura_fortress',
      'Obsidian Fortress (Area 6)',
      !foesCleared,
      `Clear 3 Ashram Threats (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0xf97316
    );
    createPortalGate(
      'portal_ashram_prev',
      0,
      0,
      26.5,
      'sunken_stepwell',
      'Return: Sunken Stepwell (Area 4)',
      false,
      '',
      0x94a3b8
    );

    enemySpawns.push(
      { id: 'ar_1', type: 'shadow_walker', position: new THREE.Vector3(-4, 0.4, 9) },
      { id: 'ar_2', type: 'ancient_beast', position: new THREE.Vector3(6, 0.4, 2) },
      { id: 'ar_3', type: 'dark_spirit', position: new THREE.Vector3(-6, 0.4, -3) },
      { id: 'ar_4', type: 'temple_guardian', position: new THREE.Vector3(5, 0.4, -10) },
      { id: 'ar_5', type: 'ancient_beast', position: new THREE.Vector3(0, 0, -17) }
    );

    createAmbientParticles(140, 28, 7, 0xfde047, 0.16);

    return finalizeArea({
      areaId,
      name: 'Shattered Ashram',
      subtitle: 'Area 5 · Hermitage of the Eternal Havan',
      isStoneGround: true,
      boundsRadius: 31,
      defaultSpawn: new THREE.Vector3(0, 0, 23),
      defaultYaw: Math.PI,
      groundHeightAt: (x, z) => {
        if (Math.abs(x) <= 12 && Math.abs(z) <= 14) return 0.4;
        if (Math.abs(x) <= 3.2 && Math.abs(z) > 14 && Math.abs(z) <= 15.8) return 0.2;
        return 0;
      },
    });
  }

  // =========================================================================
  // AREA 6: OBSIDIAN ASURA FORTRESS
  // =========================================================================
  if (areaId === 'asura_fortress') {
    const fogColor = 0x160708;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.025);

    const hemi = new THREE.HemisphereLight(0x991b1b, 0x14080a, 0.68);
    const rim = new THREE.DirectionalLight(0xfb7185, 1.2);
    rim.position.set(-16, 26, 16);
    if (shadowsEnabled) {
      rim.castShadow = true;
      rim.shadow.mapSize.set(1024, 1024);
      rim.shadow.camera.left = -32;
      rim.shadow.camera.right = 32;
      rim.shadow.camera.top = 32;
      rim.shadow.camera.bottom = -32;
    }
    root.add(hemi, rim);

    const obsMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.obsidianFloor,
        roughness: 0.72,
        metalness: 0.3,
      })
    );
    const ground = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(74, 48)), obsMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);

    const walls: Array<[number, number, number, number]> = [
      [-19, 4, 2.8, 34],
      [19, 4, 2.8, 34],
      [-11, -22, 14, 2.8],
      [11, -22, 14, 2.8],
    ];
    for (const [wx, wz, ww, wd] of walls) {
      const w = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(ww, 7.2, wd)), obsMat);
      w.position.set(wx, 3.6, wz);
      w.castShadow = shadowsEnabled;
      w.receiveShadow = true;
      root.add(w);
      addBoxCollider(wx, 0, wz, ww, 7.2, wd, true);
    }

    for (const pz of [14, 4, -6, -15]) {
      createPillar(-8.5, 0, pz, 7.5, obsMat);
      createPillar(8.5, 0, pz, 7.5, obsMat);
      createBrazier(-5.2, 0, pz, 0xef4444, pz >= 4, 3.4);
      createBrazier(5.2, 0, pz, 0xef4444, false);
    }

    createRelicChest('chest_fortress_1', -14, 0, 8);
    createRelicChest('chest_fortress_2', 14, 0, -8);
    createTrialShrine('trial_fortress', 0, 0, 10);
    createLoreTablet(
      'lore_fortress',
      -5.5,
      0,
      15,
      'Iron Rampart Stele',
      'Kalyug generals fortified this obsidian gate. Breach their guard and climb toward the celestial Yantra Observatory above.'
    );

    createSkyLandmark(0xfb7185, 0xef4444, true, [-16, 40, -52]);
    createPortalGate(
      'portal_fortress_observatory',
      0,
      0,
      -22,
      'astral_observatory',
      'Astral Observatory (Area 7)',
      !foesCleared,
      `Defeat 3 Fortress Guardians (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0xc084fc
    );
    createPortalGate(
      'portal_fortress_prev',
      0,
      0,
      26.2,
      'ashram_ruins',
      'Return: Shattered Ashram (Area 5)',
      false,
      '',
      0x94a3b8
    );

    enemySpawns.push(
      { id: 'af_1', type: 'temple_guardian', position: new THREE.Vector3(-4, 0, 4) },
      { id: 'af_2', type: 'ancient_beast', position: new THREE.Vector3(5, 0, 0) },
      { id: 'af_3', type: 'temple_guardian', position: new THREE.Vector3(-4, 0, -10) },
      { id: 'af_4', type: 'ancient_beast', position: new THREE.Vector3(5, 0, -12) },
      { id: 'af_5', type: 'dark_spirit', position: new THREE.Vector3(0, 0, -16) }
    );

    createAmbientParticles(150, 28, 8, 0xfb7185, 0.17);

    return finalizeArea({
      areaId,
      name: 'Obsidian Fortress',
      subtitle: 'Area 6 · Rampart of the Asura Vanguard',
      isStoneGround: true,
      boundsRadius: 30,
      defaultSpawn: new THREE.Vector3(0, 0, 22),
      defaultYaw: Math.PI,
      groundHeightAt: () => 0,
    });
  }

  // =========================================================================
  // AREA 7: YANTRA JYOTISH OBSERVATORY
  // =========================================================================
  if (areaId === 'astral_observatory') {
    const fogColor = 0x0b0a1a;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.022);

    const hemi = new THREE.HemisphereLight(0xa78bfa, 0x1a1526, 0.78);
    const starKey = new THREE.DirectionalLight(0xfde68a, 1.25);
    starKey.position.set(14, 30, 12);
    if (shadowsEnabled) {
      starKey.castShadow = true;
      starKey.shadow.mapSize.set(1024, 1024);
      starKey.shadow.camera.left = -32;
      starKey.shadow.camera.right = 32;
      starKey.shadow.camera.top = 32;
      starKey.shadow.camera.bottom = -32;
    }
    root.add(hemi, starKey);

    const mandalaFloor = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.mandalaFloor,
        roughness: 0.7,
        metalness: 0.25,
      })
    );
    const floor = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(46, 48)), mandalaFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);

    const gnomon = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.6, 8.2, 4)), sandstoneMat);
    gnomon.position.set(0, 4.1, 0);
    gnomon.rotation.y = Math.PI / 4;
    gnomon.castShadow = shadowsEnabled;
    root.add(gnomon);
    addCylCollider(0, 0, 0, 2.3, 8, true);

    const ringA = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(6.5, 0.18, 8, 40)), goldEmissiveMat);
    ringA.position.set(0, 11.5, 0);
    const ringB = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(5.0, 0.14, 8, 36)), bronzeMat);
    ringB.position.set(0, 11.5, 0);
    ringB.rotation.x = Math.PI / 3;
    root.add(ringA, ringB);
    animatedCallbacks.push((dt) => {
      ringA.rotation.y += dt * 0.45;
      ringB.rotation.z -= dt * 0.55;
    });

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const px = Math.cos(a) * 16;
      const pz = Math.sin(a) * 16;
      createPillar(px, 0, pz, 5.2 + (i % 3) * 0.8, sandstoneMat);
      if (i % 3 === 0) {
        createBrazier(Math.cos(a) * 13, 0, Math.sin(a) * 13, 0xa78bfa, true, 3.2);
      }
    }

    createRelicChest('chest_observatory_1', -12.5, 0, 7.5);
    createRelicChest('chest_observatory_2', 12.5, 0, -7.5);
    createTrialShrine('trial_observatory', 7.5, 0, 12);
    createLoreTablet(
      'lore_observatory',
      -7.5,
      0,
      12,
      'Jyotish Yantra Codex',
      'Aligned to the cosmic wheel of Yugas, these brass rings foretold the hour of Kali Purusha’s rise. Descend next into the Naga Patala Caverns.'
    );

    createSkyLandmark(0xfde68a, 0xa78bfa, false, [14, 42, -52]);
    createPortalGate(
      'portal_observatory_caverns',
      0,
      0,
      -23,
      'serpent_caverns',
      'Naga Caverns (Area 8)',
      !foesCleared,
      `Banish 3 Observatory Shadows (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0x10b981
    );
    createPortalGate(
      'portal_observatory_prev',
      0,
      0,
      26.5,
      'asura_fortress',
      'Return: Obsidian Fortress (Area 6)',
      false,
      '',
      0x94a3b8
    );

    enemySpawns.push(
      { id: 'ao_1', type: 'dark_spirit', position: new THREE.Vector3(-7, 0, 6) },
      { id: 'ao_2', type: 'temple_guardian', position: new THREE.Vector3(7, 0, 5) },
      { id: 'ao_3', type: 'ancient_beast', position: new THREE.Vector3(-8, 0, -6) },
      { id: 'ao_4', type: 'dark_spirit', position: new THREE.Vector3(8, 0, -7) },
      { id: 'ao_5', type: 'temple_guardian', position: new THREE.Vector3(0, 0, -16) }
    );

    createAmbientParticles(160, 28, 10, 0xc4b5fd, 0.17);

    return finalizeArea({
      areaId,
      name: 'Astral Observatory',
      subtitle: 'Area 7 · Samrat Yantra of the Stars',
      isStoneGround: true,
      boundsRadius: 31,
      defaultSpawn: new THREE.Vector3(0, 0, 23),
      defaultYaw: Math.PI,
      groundHeightAt: () => 0,
    });
  }

  // =========================================================================
  // AREA 8: NAGA PATALA CAVERNS -> LINKS TO REALM 9 OF 100
  // =========================================================================
  if (areaId === 'serpent_caverns') {
    const fogColor = 0x04120e;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.036);

    const hemi = new THREE.HemisphereLight(0x10b981, 0x05100c, 0.58);
    root.add(hemi);

    const caveMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.catacombStone,
        color: 0x1e3830,
        roughness: 0.85,
      })
    );
    const floor = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(64, 42)), caveMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);

    const ceiling = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(64, 32)), caveMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 7.5;
    root.add(ceiling);

    const crystalMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 1.8,
        roughness: 0.22,
      })
    );
    const crystalCoords: Array<[number, number]> = [
      [-15, 10], [15, 10], [-18, -2], [18, -2], [-14, -15], [14, -15],
    ];
    crystalCoords.forEach(([cx, cz], i) => {
      const cluster = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.85, 3.2, 5)), crystalMat);
      cluster.position.set(cx, 1.5, cz);
      cluster.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.22;
      root.add(cluster);
      addCylCollider(cx, 0, cz, 1.0, 3.2, false);
      if (i % 2 === 0) {
        const l = new THREE.PointLight(0x10b981, 2.8, 16, 1.5);
        l.position.set(cx, 2.2, cz);
        root.add(l);
      }
    });

    for (const pz of [12, 0, -12]) {
      createPillar(-7, 0, pz, 7.2, caveMat);
      createPillar(7, 0, pz, 7.2, caveMat);
    }
    createBrazier(-3.8, 0, 16, 0x34d399, true, 3.2);
    createBrazier(3.8, 0, -16, 0x34d399, true, 3.2);

    createRelicChest('chest_caverns_1', -14, 0, 3);
    createRelicChest('chest_caverns_2', 14, 0, -4);
    createTrialShrine('trial_caverns', 0, 0, 6);
    createLoreTablet(
      'lore_caverns',
      0,
      0,
      16,
      'Naga Patala Seal',
      'Serpent guardians forged Patala crystals to hold back the outer corruption. Beyond this gate begins the ninety-two remaining realms leading to the Cursed Sanctum.'
    );

    const realm9 = getRealm('realm_9');
    createPortalGate(
      'portal_caverns_realm9',
      0,
      0,
      -23,
      'realm_9',
      `${realm9.name} (Area 9)`,
      !foesCleared,
      `Clear 3 Cavern Threats (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0x34d399
    );
    createPortalGate(
      'portal_caverns_prev',
      0,
      0,
      26.2,
      'astral_observatory',
      'Return: Astral Observatory (Area 7)',
      false,
      '',
      0x94a3b8
    );

    enemySpawns.push(
      { id: 'nc_1', type: 'ancient_beast', position: new THREE.Vector3(-5, 0, 9) },
      { id: 'nc_2', type: 'dark_spirit', position: new THREE.Vector3(6, 0, 3) },
      { id: 'nc_3', type: 'ancient_beast', position: new THREE.Vector3(-6, 0, -8) },
      { id: 'nc_4', type: 'temple_guardian', position: new THREE.Vector3(6, 0, -11) },
      { id: 'nc_5', type: 'dark_spirit', position: new THREE.Vector3(0, 0, -17) }
    );

    createAmbientParticles(150, 26, 6.5, 0x34d399, 0.16);

    return finalizeArea({
      areaId,
      name: 'Naga Caverns',
      subtitle: 'Area 8 · Bioluminescent Patala Vaults',
      isStoneGround: true,
      boundsRadius: 30,
      defaultSpawn: new THREE.Vector3(0, 0, 23),
      defaultYaw: Math.PI,
      groundHeightAt: () => 0,
    });
  }

  // =========================================================================
  // AREAS 9..98: PROCEDURAL MYTHOLOGICAL REALMS
  // =========================================================================
  if (areaId.startsWith('realm_')) {
    const realm = getRealm(areaId);
    return buildProceduralMythicRealm(realm, h);
  }

  return null;
}
