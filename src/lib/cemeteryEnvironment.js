import * as THREE from 'three';

// ---- Design mode: open sky with clouds over sandy soil ----

// Reflection environment used by polished stones (black granite, marble).
// A polished slab mirrors its surroundings, so the surface must show a bright
// horizon band with sky above and warm ground below — exactly what gives real
// jet-black granite its graphite sheen and bright edge highlights.
let POLISHED_REFLECT_ENV = null;

export function getPolishedReflectionEnv() {
  if (POLISHED_REFLECT_ENV) return POLISHED_REFLECT_ENV;

  const w = 1024;
  const h = 512;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');

  // Sky above the horizon
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#4a86c4');
  sky.addColorStop(0.65, '#9dc7e8');
  sky.addColorStop(1, '#eef6fb');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.5);

  // Warm ground below the horizon
  const ground = ctx.createLinearGradient(0, h * 0.5, 0, h);
  ground.addColorStop(0, '#e6d5b6');
  ground.addColorStop(0.35, '#cdb28a');
  ground.addColorStop(1, '#a88f6c');
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  // Bright horizon line — the crisp highlight real polished stone picks up
  const horizon = ctx.createLinearGradient(0, h * 0.47, 0, h * 0.545);
  horizon.addColorStop(0, 'rgba(255,255,255,0)');
  horizon.addColorStop(0.5, 'rgba(255,255,255,0.92)');
  horizon.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, h * 0.47, w, h * 0.075);

  // Broad soft highlights — clouds and sun reflected in the slab
  const soft = (cx, cy, rx, ry, alpha) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / Math.max(rx, ry));
    ctx.translate(-cx, -cy);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  soft(w * 0.22, h * 0.26, 190, 90, 0.75);
  soft(w * 0.68, h * 0.3, 150, 70, 0.55);
  soft(w * 0.95, h * 0.22, 120, 60, 0.45);

  const tex = new THREE.CanvasTexture(cv);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  POLISHED_REFLECT_ENV = tex;
  return tex;
}

function makeSkyTexture() {
  const w = 2048;
  const h = 1024;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');

  // Blue sky: deep at the zenith, pale haze at the horizon
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#2273bd');
  grad.addColorStop(0.3, '#4e97d4');
  grad.addColorStop(0.46, '#8dbde4');
  grad.addColorStop(0.53, '#c8ddec');
  grad.addColorStop(0.6, '#e8e2d2');
  grad.addColorStop(1, '#ded3bd');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft cumulus clouds — clusters of blurred white puffs above the horizon
  const puff = (cx, cy, r, alpha) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.55, `rgba(255,255,255,${alpha * 0.55})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  for (let c = 0; c < 26; c++) {
    const cx = Math.random() * w;
    const cy = h * (0.16 + Math.random() * 0.3);
    const base = 26 + Math.random() * 60;
    const alpha = 0.5 + Math.random() * 0.4;
    const puffs = 5 + Math.floor(Math.random() * 6);
    for (let p = 0; p < puffs; p++) {
      const ox = (Math.random() - 0.5) * base * 3.2;
      const oy = (Math.random() - 0.5) * base * 0.7;
      puff(cx + ox, cy + oy, base * (0.5 + Math.random() * 0.7), alpha * (0.6 + Math.random() * 0.4));
    }
  }
  // A thin high cirrus layer for depth
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 16; i++) {
    const cx = Math.random() * w;
    const cy = h * (0.1 + Math.random() * 0.25);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90 + Math.random() * 200, 8 + Math.random() * 14, Math.random() * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

function makeSandTexture() {
  const size = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#c8ab7f';
  ctx.fillRect(0, 0, size, size);

  // Broad tonal earth patches — darker damp soil and lighter dry sand
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 50 + Math.random() * 170;
    const dark = Math.random() > 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, dark ? 'rgba(146,117,80,0.20)' : 'rgba(235,215,178,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sand grains and small gravel
  for (let i = 0; i < 26000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const light = Math.random() > 0.45;
    ctx.fillStyle = light
      ? `rgba(247,233,205,${0.06 + Math.random() * 0.18})`
      : `rgba(112,90,62,${0.05 + Math.random() * 0.13})`;
    const s = 0.6 + Math.random() * 1.6;
    ctx.fillRect(x, y, s, s);
  }

  // Wind ripples
  ctx.strokeStyle = 'rgba(158,128,92,0.10)';
  for (let i = 0; i < 40; i++) {
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    const y0 = Math.random() * size;
    ctx.moveTo(0, y0);
    for (let x = 0; x <= size; x += 64) ctx.lineTo(x, y0 + Math.sin(x * 0.01 + i) * 6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  tex.anisotropy = 8;
  return tex;
}

// Design mode — the monument stands outdoors: blue sky with clouds above sandy earth.
export function createDesignGround() {
  const group = new THREE.Group();

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(70, 48, 32),
    new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide, fog: false, depthWrite: false })
  );
  sky.renderOrder = -1;
  group.add(sky);

  const groundMat = new THREE.MeshStandardMaterial({
    map: makeSandTexture(),
    color: 0xf2e6cf,
    roughness: 0.96,
    metalness: 0,
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 96), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  group.add(ground);

  return group;
}

// Photo mode — realistic cemetery environment
export function createCemeteryEnvironment() {
  const group = new THREE.Group();

  // Stone tile ground with realistic texture
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = tileCanvas.height = 512;
  const ctx = tileCanvas.getContext('2d');
  ctx.fillStyle = '#c5b394';
  ctx.fillRect(0, 0, 512, 512);
  const tileSize = 64;
  for (let ty = 0; ty < 512; ty += tileSize) {
    for (let tx = 0; tx < 512; tx += tileSize) {
      const v = Math.random();
      const r = 197 + Math.floor(v * 20) - 10;
      const g = 179 + Math.floor(v * 18) - 9;
      const b = 148 + Math.floor(v * 15) - 7;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(tx, ty, tileSize, tileSize);
      for (let s = 0; s < 40; s++) {
        const sx = tx + Math.random() * tileSize;
        const sy = ty + Math.random() * tileSize;
        const sv = Math.random();
        ctx.fillStyle = `rgba(${100 + sv * 60},${85 + sv * 50},${65 + sv * 40},${Math.random() * 0.25})`;
        ctx.fillRect(sx, sy, 1, 1);
      }
      if (Math.random() > 0.7) {
        ctx.strokeStyle = `rgba(80, 65, 50, ${0.15 + Math.random() * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(tx + Math.random() * tileSize, ty);
        ctx.lineTo(tx + Math.random() * tileSize, ty + tileSize);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = 'rgba(100, 80, 60, 0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
  }

  const tileTex = new THREE.CanvasTexture(tileCanvas);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(8, 8);

  const groundMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.92, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  group.add(ground);

  // Scattered pebbles — varied colors and sizes
  const pebbleGeo = new THREE.IcosahedronGeometry(0.035, 1);
  const pebbleColors = [0xe8e6e0, 0xa09888, 0x6d6d6f, 0x8a7a6a, 0xc4b8a0, 0x5a5a5a];
  const pebbleMats = pebbleColors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, metalness: 0.05 }));

  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.8 + Math.random() * 3.5;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (Math.abs(x) < 1.3 && Math.abs(z) < 2.8) continue;
    const pebble = new THREE.Mesh(pebbleGeo, pebbleMats[Math.floor(Math.random() * pebbleMats.length)]);
    const s = 0.6 + Math.random() * 1.8;
    pebble.scale.set(s, s * (0.6 + Math.random() * 0.3), s);
    pebble.position.set(x, -0.08 + s * 0.02, z);
    pebble.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    group.add(pebble);
  }

  // Background tombstones — simple shapes at varying distances
  const bgStoneMats = [
    new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.75, metalness: 0 }),
    new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0xb0a898, roughness: 0.7, metalness: 0 }),
    new THREE.MeshStandardMaterial({ color: 0x8a8a88, roughness: 0.6, metalness: 0.05 }),
  ];

  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 7 + Math.random() * 7;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (z > 3 && Math.abs(x) < 5) continue;
    const h = 0.5 + Math.random() * 0.9;
    const w = 0.35 + Math.random() * 0.25;
    const d = 0.08 + Math.random() * 0.06;
    const mat = bgStoneMats[Math.floor(Math.random() * bgStoneMats.length)];
    const stone = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    stone.position.set(x, h / 2 - 0.12, z);
    stone.rotation.y = Math.random() * 0.5 - 0.25;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }

  // Cypress trees — tall dark green cones
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.85 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.85 });

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.7;
    const dist = 9 + Math.random() * 5;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (z > 2 && Math.abs(x) < 6) continue;

    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.4, 6), trunkMat);
    trunk.position.y = 0.08;
    tree.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(0.3 + Math.random() * 0.1, 2.2 + Math.random() * 0.8, 8),
      i % 2 === 0 ? leafMat : leafMat2
    );
    foliage.position.y = 1.3 + Math.random() * 0.3;
    foliage.castShadow = true;
    tree.add(foliage);

    tree.position.set(x, 0, z);
    group.add(tree);
  }

  // Low vegetation / shrubs
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x5a6a4a, roughness: 0.9 });
  const shrubMat2 = new THREE.MeshStandardMaterial({ color: 0x6a7a5a, roughness: 0.9 });

  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * 4;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (Math.abs(x) < 1.3 && Math.abs(z) < 2.8) continue;

    const shrub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.15 + Math.random() * 0.1, 1),
      i % 2 === 0 ? shrubMat : shrubMat2
    );
    shrub.scale.set(1, 0.6, 1);
    shrub.position.set(x, -0.05, z);
    shrub.castShadow = true;
    shrub.receiveShadow = true;
    group.add(shrub);
  }

  return group;
}