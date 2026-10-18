import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Memorial candle housing ("בית נר" / "בית מנורה"): multiple styles with
// brass/bronze front panels, Star of David, Hebrew text, glass windows,
// and a lit memorial candle casting a warm glow from within.

function makeBronzeDoorTexture() {
  const W = 512, H = 600;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#8a7460');
  grad.addColorStop(0.5, '#7a6b56');
  grad.addColorStop(1, '#5f4f3e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    const dark = Math.random() > 0.5;
    ctx.fillStyle = `rgba(${dark ? 40 : 180},${dark ? 30 : 160},${dark ? 20 : 130},${Math.random() * 0.1})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Floral vine pattern border
  ctx.strokeStyle = '#5a4a38'; ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = '#9a8a70'; ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  // Decorative corner flourishes
  [[18,18],[W-18,18],[18,H-18],[W-18,H-18]].forEach(([cx,cy]) => {
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.stroke();
  });

  ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(W / 2, 18); ctx.lineTo(W / 2, H - 18); ctx.stroke();

  // Star of David at top
  const starCY = 80;
  const starR = 34;
  ctx.strokeStyle = '#2e2418'; ctx.fillStyle = '#5a4a38'; ctx.lineWidth = 3;
  const drawTri = (up) => {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ang = (up ? -Math.PI / 2 : Math.PI / 2) + i * (Math.PI * 2 / 3);
      const x = W / 2 + Math.cos(ang) * starR;
      const y = starCY + Math.sin(ang) * starR;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  };
  drawTri(true); drawTri(false);

  ctx.fillStyle = '#2e2418';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('נר ה\' נשמת אדם', W / 2, starCY + 60);

  // Two glass windows
  const winY = starCY + 100;
  const winW = 160, winH = 200, winGap = 20;
  const winX1 = W / 2 - winW - winGap / 2;
  const winX2 = W / 2 + winGap / 2;

  ctx.fillStyle = '#4f4435';
  ctx.fillRect(winX1 - 6, winY - 6, winW + 12, winH + 12);
  ctx.fillRect(winX2 - 6, winY - 6, winW + 12, winH + 12);

  const drawWin = (wx) => {
    const gg = ctx.createRadialGradient(wx + winW / 2, winY + winH * 0.6, 10, wx + winW / 2, winY + winH * 0.6, winW);
    gg.addColorStop(0, 'rgba(255, 190, 90, 0.5)');
    gg.addColorStop(0.25, 'rgba(200, 130, 50, 0.6)');
    gg.addColorStop(0.6, 'rgba(40, 30, 20, 0.8)');
    gg.addColorStop(1, 'rgba(15, 15, 18, 0.9)');
    ctx.fillStyle = gg;
    ctx.fillRect(wx, winY, winW, winH);
  };
  drawWin(winX1); drawWin(winX2);

  ctx.fillStyle = '#4f4435';
  ctx.fillRect(winX1 + winW / 2 - 2, winY, 4, winH);
  ctx.fillRect(winX2 + winW / 2 - 2, winY, 4, winH);
  ctx.fillRect(winX1, winY + winH / 2 - 2, winW, 4);
  ctx.fillRect(winX2, winY + winH / 2 - 2, winW, 4);

  ctx.fillStyle = '#2e2418';
  ctx.fillRect(W - 28, 36, 16, 36);
  ctx.fillRect(12, 36, 16, 36);
  ctx.fillRect(W - 28, H - 72, 16, 36);
  ctx.fillRect(12, H - 72, 16, 36);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Gabled (house-shaped) brass front — rectangular with gable top
function makeGabledDoorTexture() {
  const W = 512, H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#9a8460');
  grad.addColorStop(0.5, '#7a6b4e');
  grad.addColorStop(1, '#5f4f38');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 40 : 180},${Math.random() > 0.5 ? 30 : 160},${Math.random() > 0.5 ? 20 : 130},${Math.random() * 0.08})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Brick-work pattern border
  ctx.strokeStyle = '#5a4a38'; ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = '#9a8a70'; ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, W - 32, H - 32);

  // Star of David at top
  const starCY = 70;
  const starR = 28;
  ctx.strokeStyle = '#2e2418'; ctx.fillStyle = '#5a4a38'; ctx.lineWidth = 2.5;
  const drawTri = (up) => {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ang = (up ? -Math.PI / 2 : Math.PI / 2) + i * (Math.PI * 2 / 3);
      const x = W / 2 + Math.cos(ang) * starR;
      const y = starCY + Math.sin(ang) * starR;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  };
  drawTri(true); drawTri(false);

  // Hebrew text
  ctx.fillStyle = '#2e2418';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('נר ה\' נשמת אדם', W / 2, starCY + 52);

  // Central glass window (single, large)
  const winY = starCY + 80;
  const winW = 340, winH = 280;
  const winX = (W - winW) / 2;

  ctx.fillStyle = '#4f4435';
  ctx.fillRect(winX - 8, winY - 8, winW + 16, winH + 16);

  const gg = ctx.createRadialGradient(winX + winW / 2, winY + winH * 0.6, 15, winX + winW / 2, winY + winH * 0.6, winW * 0.7);
  gg.addColorStop(0, 'rgba(255, 190, 90, 0.5)');
  gg.addColorStop(0.3, 'rgba(200, 130, 50, 0.55)');
  gg.addColorStop(0.7, 'rgba(40, 30, 20, 0.75)');
  gg.addColorStop(1, 'rgba(15, 15, 18, 0.9)');
  ctx.fillStyle = gg;
  ctx.fillRect(winX, winY, winW, winH);

  // Window dividers (cross)
  ctx.fillStyle = '#4f4435';
  ctx.fillRect(winX + winW / 2 - 2, winY, 4, winH);
  ctx.fillRect(winX, winY + winH / 2 - 2, winW, 4);

  // Hinges
  ctx.fillStyle = '#2e2418';
  ctx.fillRect(W - 26, 30, 14, 30);
  ctx.fillRect(12, 30, 14, 30);
  ctx.fillRect(W - 26, H - 60, 14, 30);
  ctx.fillRect(12, H - 60, 14, 30);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Pyramid style — black base with blue Star of David
function makePyramidBlueTexture() {
  const W = 512, H = 600;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Dark black base
  ctx.fillStyle = '#1a1a1e';
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 800; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 60 : 10},${Math.random() > 0.5 ? 60 : 10},${Math.random() > 0.5 ? 70 : 10},${Math.random() * 0.15})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Blue Star of David — large, centered
  const starCY = H * 0.38;
  const starR = 110;
  ctx.strokeStyle = '#2255cc'; ctx.fillStyle = 'rgba(34, 85, 204, 0.15)'; ctx.lineWidth = 6;
  const drawTri = (up) => {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ang = (up ? -Math.PI / 2 : Math.PI / 2) + i * (Math.PI * 2 / 3);
      const x = W / 2 + Math.cos(ang) * starR;
      const y = starCY + Math.sin(ang) * starR;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  drawTri(true); drawTri(false);

  // Text inside star
  ctx.fillStyle = '#4488ee';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('נר לחיים', W / 2, starCY - 10);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('נר ה\' נשמת אדם', W / 2, starCY + 20);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeRockBaseTexture() {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9a8a72';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    const v = Math.random();
    const r = v > 0.5 ? 175 : 115;
    const g = v > 0.5 ? 155 : 95;
    const b = v > 0.5 ? 125 : 75;
    ctx.fillStyle = `rgba(${r},${g},${b},${Math.random() * 0.3})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.strokeStyle = 'rgba(55, 40, 25, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * S, Math.random() * S);
    for (let j = 0; j < 5; j++) {
      ctx.lineTo(Math.random() * S, Math.random() * S);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Style 1: Arched — existing design with bronze double doors
function buildArchedNerHouse(group, scale) {
  const baseW = 0.38 * scale;
  const baseD = 0.28 * scale;
  const totalH = 0.50 * scale;

  const rockTex = makeRockBaseTexture();
  const rockMat = new THREE.MeshStandardMaterial({
    map: rockTex, color: 0x9a8a72, roughness: 0.95, metalness: 0, flatShading: true,
  });
  const rockH = 0.10 * scale;
  const rockGeo = new THREE.BoxGeometry(baseW * 1.4, rockH, baseD * 1.4, 10, 6, 10);
  const pos = rockGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const onSideX = Math.abs(Math.abs(v.x) - baseW * 0.7) < 0.02;
    const onSideZ = Math.abs(Math.abs(v.z) - baseD * 0.7) < 0.02;
    if (onSideX || onSideZ) {
      const n = (Math.sin(v.x * 25 + v.y * 18) * Math.cos(v.z * 22)) * 0.02;
      if (onSideX) v.x += n;
      if (onSideZ) v.z += n;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  rockGeo.computeVertexNormals();
  const rockBase = new THREE.Mesh(rockGeo, rockMat);
  rockBase.position.y = rockH / 2;
  rockBase.castShadow = true; rockBase.receiveShadow = true;
  group.add(rockBase);

  const housingH = totalH - rockH;
  const housingLowerH = housingH * 0.65;
  const archR = baseW / 2;
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.35, metalness: 0.75 });

  const lower = new THREE.Mesh(new RoundedBoxGeometry(baseW, housingLowerH, baseD, 3, 0.02), housingMat);
  lower.position.y = rockH + housingLowerH / 2;
  lower.castShadow = true; lower.receiveShadow = true;
  group.add(lower);

  const archGeo = new THREE.CylinderGeometry(archR, archR, baseD, 24, 1, false, 0, Math.PI);
  archGeo.rotateX(Math.PI / 2);
  const arch = new THREE.Mesh(archGeo, housingMat);
  arch.position.set(0, rockH + housingLowerH, 0);
  arch.castShadow = true; arch.receiveShadow = true;
  group.add(arch);

  const doorTex = makeBronzeDoorTexture();
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTex, roughness: 0.35, metalness: 0.85,
    emissive: new THREE.Color(0x1a0e04), emissiveIntensity: 0.06,
  });
  const doorW = baseW * 0.88;
  const doorH = housingLowerH * 0.92;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), doorMat);
  door.position.set(0, rockH + housingLowerH / 2, baseD / 2 + 0.004);
  group.add(door);

  const candleMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xff9933, emissiveIntensity: 3.0 });
  const candleH = 0.05 * scale;
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, candleH, 12), candleMat);
  candle.position.set(0, rockH + housingLowerH * 0.35, 0);
  group.add(candle);

  const candleLight = new THREE.PointLight(0xffaa44, 0.8, 0.6);
  candleLight.position.set(0, rockH + housingLowerH * 0.4, 0);
  group.add(candleLight);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.4, metalness: 0.8 });
  [-1, 1].forEach((side) => {
    [0.22, 0.78].forEach((yt) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.028, 8), metalMat);
      hinge.position.set(side * (baseW / 2 - 0.008), rockH + housingLowerH * yt, baseD / 2 + 0.01);
      group.add(hinge);
    });
  });

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), metalMat);
  handle.position.set(-0.02, rockH + housingLowerH * 0.5, baseD / 2 + 0.018);
  group.add(handle);
}

// Style 2: Gabled — house-shaped with gable roof and brass front
function buildGabledNerHouse(group, scale) {
  const baseW = 0.36 * scale;
  const baseD = 0.26 * scale;
  const totalH = 0.52 * scale;

  // Dark charcoal base (concrete-like)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.85, metalness: 0.05 });
  const baseH = totalH * 0.15;
  const base = new THREE.Mesh(new THREE.BoxGeometry(baseW * 1.3, baseH, baseD * 1.3), baseMat);
  base.position.y = baseH / 2;
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);

  // Body — rectangular house shape
  const bodyH = totalH * 0.55;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.8, metalness: 0.1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(baseW, bodyH, baseD), bodyMat);
  body.position.y = baseH + bodyH / 2;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // Gable roof — triangular prism
  const roofH = totalH * 0.30;
  const roofGeo = new THREE.CylinderGeometry(0.01, baseW * 0.72, baseD, 3, 1, false, 0, Math.PI * 2);
  // Actually, build a triangular prism for the gable
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-baseW / 2, 0);
  gableShape.lineTo(baseW / 2, 0);
  gableShape.lineTo(0, roofH);
  gableShape.lineTo(-baseW / 2, 0);
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: baseD, bevelEnabled: false });
  gableGeo.translate(0, 0, -baseD / 2);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.7, metalness: 0.15 });
  const roof = new THREE.Mesh(gableGeo, roofMat);
  roof.position.y = baseH + bodyH;
  roof.castShadow = true; roof.receiveShadow = true;
  group.add(roof);

  // Brass front faceplate
  const doorTex = makeGabledDoorTexture();
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTex, roughness: 0.35, metalness: 0.85,
    emissive: new THREE.Color(0x1a0e04), emissiveIntensity: 0.06,
  });
  const doorW = baseW * 0.85;
  const doorH = bodyH * 0.95;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), doorMat);
  door.position.set(0, baseH + bodyH / 2, baseD / 2 + 0.004);
  group.add(door);

  // Lit candle inside
  const candleMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xff9933, emissiveIntensity: 3.0 });
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.05 * scale, 12), candleMat);
  candle.position.set(0, baseH + bodyH * 0.35, 0);
  group.add(candle);

  const candleLight = new THREE.PointLight(0xffaa44, 0.7, 0.5);
  candleLight.position.set(0, baseH + bodyH * 0.4, 0);
  group.add(candleLight);

  // Hinges
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.4, metalness: 0.8 });
  [-1, 1].forEach((side) => {
    [0.15, 0.85].forEach((yt) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.028, 8), metalMat);
      hinge.position.set(side * (baseW / 2 - 0.008), baseH + bodyH * yt, baseD / 2 + 0.01);
      group.add(hinge);
    });
  });
}

// Style 3: Pyramid blue — square tapered black base with pyramid roof and blue Star of David
function buildPyramidBlueNerHouse(group, scale) {
  const baseW = 0.34 * scale;
  const baseD = 0.34 * scale;
  const totalH = 0.48 * scale;

  // Dark black body — tapered square
  const bodyH = totalH * 0.65;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.2 });
  // Tapered box: wider at bottom, narrower at top
  const bodyGeo = new THREE.BoxGeometry(baseW, bodyH, baseD, 2, 4, 2);
  const pos = bodyGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y + bodyH / 2) / bodyH; // 0 at bottom, 1 at top
    const taper = 1 - t * 0.15;
    v.x *= taper;
    v.z *= taper;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = bodyH / 2;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // Pyramid roof — 4-sided pyramid
  const roofH = totalH * 0.35;
  const roofGeo = new THREE.ConeGeometry(baseW * 0.45, roofH, 4, 1);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.5, metalness: 0.25 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = bodyH + roofH / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true; roof.receiveShadow = true;
  group.add(roof);

  // Blue Star of David front faceplate
  const frontTex = makePyramidBlueTexture();
  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTex, roughness: 0.4, metalness: 0.3,
    emissive: new THREE.Color(0x1133aa), emissiveIntensity: 0.15,
  });
  const frontW = baseW * 0.82;
  const frontH = bodyH * 0.85;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(frontW, frontH), frontMat);
  front.position.set(0, bodyH / 2 + 0.01, baseD * 0.42 + 0.004);
  group.add(front);

  // Lit candle inside
  const candleMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xff9933, emissiveIntensity: 3.0 });
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.05 * scale, 12), candleMat);
  candle.position.set(0, bodyH * 0.35, 0);
  group.add(candle);

  const candleLight = new THREE.PointLight(0xffaa44, 0.6, 0.5);
  candleLight.position.set(0, bodyH * 0.4, 0);
  group.add(candleLight);
}

export function buildNerHouse(size = 'medium', style = 'arched') {
  const group = new THREE.Group();
  const scale = size === 'small' ? 0.72 : size === 'large' ? 1.32 : 1.0;

  switch (style) {
    case 'gabled':
      buildGabledNerHouse(group, scale);
      break;
    case 'pyramid_blue':
      buildPyramidBlueNerHouse(group, scale);
      break;
    case 'arched':
    default:
      buildArchedNerHouse(group, scale);
      break;
  }

  return group;
}