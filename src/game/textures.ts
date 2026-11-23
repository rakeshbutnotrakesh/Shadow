import * as THREE from 'three';

export interface ProceduralTextureSet {
  sandstone: THREE.CanvasTexture;
  forestGround: THREE.CanvasTexture;
  stonePath: THREE.CanvasTexture;
  catacombStone: THREE.CanvasTexture;
  obsidianFloor: THREE.CanvasTexture;
  bark: THREE.CanvasTexture;
  mandalaFloor: THREE.CanvasTexture;
  particleGlow: THREE.CanvasTexture;
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  maxAniso: number,
  isColor = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = Math.min(8, maxAniso);
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(
  renderer: THREE.WebGLRenderer,
  lowMemory = false
): ProceduralTextureSet {
  const maxAniso = lowMemory ? 2 : renderer.capabilities.getMaxAnisotropy();
  const sz = lowMemory ? 256 : 512;
  const sc = lowMemory ? 0.5 : 1;

  // 1. Carved Sandstone (Indian Temple Architecture)
  const [sandCanvas, sandCtx] = makeCanvas(sz);
  sandCtx.fillStyle = '#6f553b';
  sandCtx.fillRect(0, 0, sz, sz);
  const sandSpecks = lowMemory ? 900 : 4500;
  for (let i = 0; i < sandSpecks; i++) {
    const x = Math.random() * sz;
    const y = Math.random() * sz;
    const v = 85 + Math.floor(Math.random() * 45);
    sandCtx.fillStyle = `rgba(${v + 18}, ${v}, ${v - 24}, 0.16)`;
    sandCtx.fillRect(x, y, 2 + Math.random() * 4 * sc, 2 + Math.random() * 3 * sc);
  }
  sandCtx.strokeStyle = 'rgba(32, 22, 14, 0.65)';
  sandCtx.lineWidth = lowMemory ? 2 : 3;
  const step = 128 * sc;
  for (let row = 0; row < 4; row++) {
    const y = row * step;
    sandCtx.beginPath();
    sandCtx.moveTo(0, y);
    sandCtx.lineTo(sz, y);
    sandCtx.stroke();
    const offset = row % 2 === 0 ? 0 : step * 0.5;
    for (let col = 0; col < 4; col++) {
      const x = (col * step + offset) % sz;
      sandCtx.beginPath();
      sandCtx.moveTo(x, y);
      sandCtx.lineTo(x, y + step);
      sandCtx.stroke();
      sandCtx.strokeStyle = 'rgba(180, 140, 92, 0.14)';
      sandCtx.strokeRect(x + 14 * sc, y + 14 * sc, 100 * sc, 100 * sc);
      sandCtx.strokeStyle = 'rgba(32, 22, 14, 0.65)';
    }
  }
  const sandstone = finalizeTexture(sandCanvas, 2, 2, maxAniso, true);

  // 2. Forest Ground (Dark damp moss, loam & roots)
  const [forestCanvas, forestCtx] = makeCanvas(sz);
  forestCtx.fillStyle = '#1b2418';
  forestCtx.fillRect(0, 0, sz, sz);
  const forestSpecks = lowMemory ? 1200 : 6000;
  for (let i = 0; i < forestSpecks; i++) {
    const x = Math.random() * sz;
    const y = Math.random() * sz;
    const g = 28 + Math.floor(Math.random() * 38);
    const r = Math.floor(g * 0.72);
    const b = Math.floor(g * 0.55);
    forestCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
    forestCtx.fillRect(x, y, 3 * sc + Math.random() * 4 * sc, 3 * sc + Math.random() * 4 * sc);
  }
  // Subtle dry leaf flecks
  const leafCount = lowMemory ? 100 : 400;
  for (let i = 0; i < leafCount; i++) {
    forestCtx.fillStyle = 'rgba(82, 58, 32, 0.28)';
    forestCtx.fillRect(Math.random() * sz, Math.random() * sz, 4 * sc, 2 * sc);
  }
  const forestGround = finalizeTexture(forestCanvas, 18, 18, maxAniso, true);

  // 3. Ancient Stone Path
  const [pathCanvas, pathCtx] = makeCanvas(sz);
  pathCtx.fillStyle = '#3d3730';
  pathCtx.fillRect(0, 0, sz, sz);
  const tileStep = 64 * sc;
  const tilePad = 3 * sc;
  const tileInner = 58 * sc;
  for (let y = 0; y < sz; y += tileStep) {
    for (let x = 0; x < sz; x += tileStep) {
      const shade = 52 + Math.floor(Math.random() * 26);
      pathCtx.fillStyle = `rgb(${shade + 8}, ${shade + 3}, ${shade - 4})`;
      pathCtx.fillRect(x + tilePad, y + tilePad, tileInner, tileInner);
      pathCtx.strokeStyle = 'rgba(22, 32, 18, 0.55)';
      pathCtx.lineWidth = lowMemory ? 1.5 : 2;
      pathCtx.strokeRect(x + tilePad, y + tilePad, tileInner, tileInner);
    }
  }
  const stonePath = finalizeTexture(pathCanvas, 4, 16, maxAniso, true);

  // 4. Catacomb Damp Slate
  const [catCanvas, catCtx] = makeCanvas(sz);
  catCtx.fillStyle = '#24272d';
  catCtx.fillRect(0, 0, sz, sz);
  const catSpecks = lowMemory ? 700 : 3500;
  for (let i = 0; i < catSpecks; i++) {
    const v = 25 + Math.floor(Math.random() * 35);
    catCtx.fillStyle = `rgba(${v}, ${v + 4}, ${v + 10}, 0.25)`;
    catCtx.fillRect(Math.random() * sz, Math.random() * sz, 4 * sc, 3 * sc);
  }
  catCtx.strokeStyle = 'rgba(10, 12, 16, 0.75)';
  catCtx.lineWidth = lowMemory ? 2 : 3;
  for (let i = 0; i <= sz; i += tileStep) {
    catCtx.beginPath();
    catCtx.moveTo(0, i);
    catCtx.lineTo(sz, i);
    catCtx.stroke();
    catCtx.beginPath();
    catCtx.moveTo(i, 0);
    catCtx.lineTo(i, sz);
    catCtx.stroke();
  }
  const catacombStone = finalizeTexture(catCanvas, 6, 6, maxAniso, true);

  // 5. Obsidian Sanctum Floor
  const [obsCanvas, obsCtx] = makeCanvas(sz);
  obsCtx.fillStyle = '#141118';
  obsCtx.fillRect(0, 0, sz, sz);
  const obsSpecks = lowMemory ? 500 : 2500;
  for (let i = 0; i < obsSpecks; i++) {
    const v = 18 + Math.floor(Math.random() * 24);
    obsCtx.fillStyle = `rgba(${v + 8}, ${v}, ${v + 14}, 0.25)`;
    obsCtx.fillRect(Math.random() * sz, Math.random() * sz, 3 * sc, 3 * sc);
  }
  obsCtx.strokeStyle = 'rgba(180, 110, 45, 0.22)';
  obsCtx.lineWidth = lowMemory ? 1.5 : 2;
  for (let i = 64 * sc; i < sz; i += 128 * sc) {
    obsCtx.strokeRect(i - 48 * sc, i - 48 * sc, 96 * sc, 96 * sc);
  }
  const obsidianFloor = finalizeTexture(obsCanvas, 8, 8, maxAniso, true);

  // 6. Bark
  const barkSz = lowMemory ? 128 : 256;
  const [barkCanvas, barkCtx] = makeCanvas(barkSz);
  barkCtx.fillStyle = '#2d2016';
  barkCtx.fillRect(0, 0, barkSz, barkSz);
  const barkLines = lowMemory ? 55 : 120;
  for (let i = 0; i < barkLines; i++) {
    const x = Math.random() * barkSz;
    barkCtx.strokeStyle = i % 2 === 0 ? 'rgba(18, 12, 8, 0.55)' : 'rgba(68, 48, 32, 0.35)';
    barkCtx.lineWidth = (2 + Math.random() * 3) * sc;
    barkCtx.beginPath();
    barkCtx.moveTo(x, 0);
    barkCtx.lineTo(x + (Math.random() - 0.5) * 14 * sc, barkSz);
    barkCtx.stroke();
  }
  const bark = finalizeTexture(barkCanvas, 2, 4, maxAniso, true);

  // 7. Mandala Floor Relief (Final Chamber)
  const manSz = lowMemory ? 512 : 1024;
  const mSc = lowMemory ? 0.5 : 1;
  const [manCanvas, manCtx] = makeCanvas(manSz);
  manCtx.fillStyle = '#17131c';
  manCtx.fillRect(0, 0, manSz, manSz);
  const cx = manSz / 2;
  const cy = manSz / 2;
  manCtx.strokeStyle = 'rgba(212, 163, 74, 0.42)';
  manCtx.lineWidth = lowMemory ? 2.5 : 4;
  [120, 210, 320, 430, 480].forEach((r) => {
    manCtx.beginPath();
    manCtx.arc(cx, cy, r * mSc, 0, Math.PI * 2);
    manCtx.stroke();
  });
  // Lotus petals
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    manCtx.save();
    manCtx.translate(cx, cy);
    manCtx.rotate(a);
    manCtx.beginPath();
    manCtx.moveTo(120 * mSc, 0);
    manCtx.quadraticCurveTo(220 * mSc, 45 * mSc, 320 * mSc, 0);
    manCtx.quadraticCurveTo(220 * mSc, -45 * mSc, 120 * mSc, 0);
    manCtx.strokeStyle = 'rgba(212, 163, 74, 0.32)';
    manCtx.stroke();
    manCtx.restore();
  }
  // Yantra triangle geometry
  manCtx.strokeStyle = 'rgba(184, 58, 45, 0.45)';
  manCtx.lineWidth = lowMemory ? 2 : 3;
  for (let k = 0; k < 2; k++) {
    manCtx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = (i / 3) * Math.PI * 2 + (k * Math.PI) / 3 - Math.PI / 2;
      const px = cx + Math.cos(a) * (195 * mSc);
      const py = cy + Math.sin(a) * (195 * mSc);
      if (i === 0) manCtx.moveTo(px, py);
      else manCtx.lineTo(px, py);
    }
    manCtx.stroke();
  }
  const mandalaFloor = finalizeTexture(manCanvas, 1, 1, maxAniso, true);
  mandalaFloor.wrapS = THREE.ClampToEdgeWrapping;
  mandalaFloor.wrapT = THREE.ClampToEdgeWrapping;

  // 8. Soft Particle Glow Sprite
  const [partCanvas, partCtx] = makeCanvas(128);
  const grad = partCtx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(255, 225, 160, 0.7)');
  grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
  partCtx.fillStyle = grad;
  partCtx.fillRect(0, 0, 128, 128);
  const particleGlow = new THREE.CanvasTexture(partCanvas);
  particleGlow.colorSpace = THREE.SRGBColorSpace;
  particleGlow.needsUpdate = true;

  return {
    sandstone,
    forestGround,
    stonePath,
    catacombStone,
    obsidianFloor,
    bark,
    mandalaFloor,
    particleGlow,
  };
}

export function disposeTextures(set: ProceduralTextureSet): void {
  Object.values(set).forEach((tex) => tex.dispose());
}
