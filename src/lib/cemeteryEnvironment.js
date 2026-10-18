import * as THREE from 'three';

// Design mode ground — clean museum-style stone pedestal surface
export function createDesignGround() {
  const group = new THREE.Group();

  // Subtle warm grey stone-tile surface — museum gallery floor
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = tileCanvas.height = 512;
  const ctx = tileCanvas.getContext('2d');
  ctx.fillStyle = '#e8e4dc';
  ctx.fillRect(0, 0, 512, 512);
  const tileSize = 128;
  for (let ty = 0; ty < 512; ty += tileSize) {
    for (let tx = 0; tx < 512; tx += tileSize) {
      const v = Math.random();
      const r = 232 + Math.floor(v * 12) - 6;
      const g = 228 + Math.floor(v * 10) - 5;
      const b = 220 + Math.floor(v * 10) - 5;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(tx, ty, tileSize, tileSize);
      // Fine speckle
      for (let s = 0; s < 60; s++) {
        const sx = tx + Math.random() * tileSize;
        const sy = ty + Math.random() * tileSize;
        const sv = Math.random();
        ctx.fillStyle = `rgba(${180 + sv * 40},${175 + sv * 35},${168 + sv * 35},${Math.random() * 0.08})`;
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
  }
  // Tile grout lines
  ctx.strokeStyle = 'rgba(160, 155, 145, 0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
  }

  const tileTex = new THREE.CanvasTexture(tileCanvas);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(6, 6);

  const groundMat = new THREE.MeshStandardMaterial({ map: tileTex, color: 0xece8e0, roughness: 0.85, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 64), groundMat);
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