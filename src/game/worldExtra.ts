import * as THREE from 'three';
import { EnemySpawnConfig } from './enemy';
import { ProceduralTextureSet } from './textures';
import { AreaId, ColliderBox, InteractiveObject, WorldFlags } from './types';
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

    const ground = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(72, 48)),
      sandstoneMat
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);

    // Concentric Baori stepped terraces & central sacred lotus water disc
    const waterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0e7490,
        emissive: 0x0891b2,
        emissiveIntensity: 0.7,
        roughness: 0.18,
        metalness: 0.65,
      })
    );
    const pool = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(6.8, 32)), waterMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.04;
    root.add(pool);

    const ringOuter = new THREE.Mesh(trackGeo(new THREE.RingGeometry(8.5, 11.2, 32)), darkStoneMat);
    ringOuter.rotation.x = -Math.PI / 2;
    ringOuter.position.y = 0.03;
    root.add(ringOuter);

    // Tiered Stepwell perimeter colonnade
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

    // Symmetrical Stambha pillars around pool
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = Math.cos(a) * 11.5;
      const pz = Math.sin(a) * 11.5;
      createPillar(px, 0, pz, 5.8, sandstoneMat);
      createBrazier(Math.cos(a) * 8.2, 0, Math.sin(a) * 8.2, 0x38bdf8, i % 2 === 0, 3.0);
    }

    // Glowing Floating Lotus Emblem at center
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
      'Shattered Rishi Ashram',
      !foesCleared,
      `Banish 3 Stepwell Shadows (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0x34d399
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
      subtitle: 'Chapter IV · Tiered Waters of Chand-Baori',
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

    // Stone Ashram Courtyard
    const court = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(24, 0.4, 28)), sandstoneMat);
    court.position.set(0, 0.2, 0);
    court.receiveShadow = true;
    root.add(court);

    // Bodhi Sacred Trees around Ashram perimeter
    const trunkMat = trackMat(new THREE.MeshStandardMaterial({ map: textures.bark, roughness: 0.9 }));
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

    // Gurukul Colonnade + Central Havan Fire Altar
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
      'Obsidian Asura Rampart',
      !foesCleared,
      `Clear 3 Ashram Threats (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0xf97316
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
      subtitle: 'Chapter V · Hermitage of the Eternal Havan',
      isStoneGround: true,
      boundsRadius: 31,
      defaultSpawn: new THREE.Vector3(0, 0, 23),
      defaultYaw: Math.PI,
      groundHeightAt: (x, z) => (Math.abs(x) <= 12 && Math.abs(z) <= 14 ? 0.4 : 0),
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

    // Fortress Battlement Walls + Spikes
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

    // Colossal Obsidian Guard Pillars & War Braziers
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

    createPortalGate(
      'portal_fortress_observatory',
      0,
      0,
      -22,
      'astral_observatory',
      'Yantra Jyotish Observatory',
      !foesCleared,
      `Defeat 3 Fortress Guardians (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0xc084fc
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
      subtitle: 'Chapter VI · Rampart of the Asura Vanguard',
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

    // Samrat Yantra Monumental Sundial + Rotating Brass Celestial Armillary Spheres
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

    // 12 Zodiac Planetary Pillars
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

    createPortalGate(
      'portal_observatory_caverns',
      0,
      0,
      -23,
      'serpent_caverns',
      'Naga Patala Caverns',
      !foesCleared,
      `Banish 3 Observatory Shadows (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0x10b981
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
      subtitle: 'Chapter VII · Samrat Yantra of the Stars',
      isStoneGround: true,
      boundsRadius: 31,
      defaultSpawn: new THREE.Vector3(0, 0, 23),
      defaultYaw: Math.PI,
      groundHeightAt: () => 0,
    });
  }

  // =========================================================================
  // AREA 8: NAGA PATALA CAVERNS
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

    // Bioluminescent emerald & cyan cavern crystals + hooded serpent stambhas
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
      'Serpent guardians forged Patala crystals to hold back the final corruption. Only the Cursed Sanctum and Final Chamber remain beyond.'
    );

    createPortalGate(
      'portal_caverns_sanctum',
      0,
      0,
      -23,
      'sanctum',
      'Cursed Sanctum',
      !foesCleared,
      `Clear 3 Cavern Threats (${Math.min(3, enemiesDefeatedInAreaCount)}/3)`,
      0xf59e0b
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
      subtitle: 'Chapter VIII · Bioluminescent Patala Vaults',
      isStoneGround: true,
      boundsRadius: 30,
      defaultSpawn: new THREE.Vector3(0, 0, 23),
      defaultYaw: Math.PI,
      groundHeightAt: () => 0,
    });
  }

  return null;
}
