import * as THREE from 'three';

// Accessory models modelled after real memorial items:
// a speckled granite urn vase, a white tulip-rim ceramic vase,
// and two metal-fronted memorial candle houses (silver / bronze).

function starOfDavid(ctx, cx, cy, r, color, lineWidth) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  [true, false].forEach((up) => {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ang = (up ? -Math.PI / 2 : Math.PI / 2) + i * ((Math.PI * 2) / 3);
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  });
}

// Metal front plate: relief brick band, Star of David, two lit windows and a plate.
function panelTexture(kind) {
  const W = 512;
  const H = 640;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  const silver = kind === 'silver';

  const grad = ctx.createLinearGradient(0, 0, W, H);
  if (silver) {
    grad.addColorStop(0, '#f4f5f7');
    grad.addColorStop(0.45, '#c6c9ce');
    grad.addColorStop(1, '#8b8f96');
  } else {
    grad.addColorStop(0, '#b99a68');
    grad.addColorStop(0.45, '#8d7444');
    grad.addColorStop(1, '#5d4a2a');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 1400; i++) {
    const v = Math.random();
    ctx.fillStyle = silver
      ? `rgba(${v > 0.5 ? 255 : 70},${v > 0.5 ? 255 : 74},${v > 0.5 ? 255 : 82},${Math.random() * 0.12})`
      : `rgba(${v > 0.5 ? 220 : 50},${v > 0.5 ? 190 : 40},${v > 0.5 ? 140 : 26},${Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 1);
  }

  const ink = silver ? '#3c3f45' : '#3a2c16';

  // Brick relief band carrying the Star of David
  const bandTop = 18;
  const bandH = 128;
  ctx.strokeStyle = silver ? 'rgba(60,63,69,0.5)' : 'rgba(58,44,22,0.55)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 3; row++) {
    const y = bandTop + (row * bandH) / 3;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(W - 16, y);
    ctx.stroke();
    const offset = row % 2 ? 0 : 62;
    for (let x = 16 + offset; x < W - 20; x += 124) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + bandH / 3);
      ctx.stroke();
    }
  }
  starOfDavid(ctx, W / 2, bandTop + bandH / 2, 32, ink, 5);

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('יהי זכרך ברוך', W / 2, bandTop + bandH + 44);

  // Two lit windows — rectangular on the silver plate, arched on the bronze one
  const winY = bandTop + bandH + 66;
  const winH = H - winY - 90;
  const winW = 148;
  const drawPane = (x, arched) => {
    ctx.fillStyle = ink;
    if (arched) {
      ctx.beginPath();
      ctx.moveTo(x - 7, winY + winH + 7);
      ctx.lineTo(x - 7, winY + winW / 2);
      ctx.arc(x + winW / 2, winY + winW / 2, winW / 2 + 7, Math.PI, 0);
      ctx.lineTo(x + winW + 7, winY + winH + 7);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x - 7, winY - 7, winW + 14, winH + 14);
    }
    const glow = ctx.createRadialGradient(x + winW / 2, winY + winH * 0.65, 8, x + winW / 2, winY + winH * 0.65, winW);
    glow.addColorStop(0, 'rgba(255,206,124,0.8)');
    glow.addColorStop(0.35, 'rgba(188,118,40,0.65)');
    glow.addColorStop(1, 'rgba(18,16,14,0.92)');
    ctx.fillStyle = glow;
    ctx.fillRect(x, winY, winW, winH);
    ctx.fillStyle = ink;
    ctx.fillRect(x + winW / 2 - 2, winY, 4, winH);
    ctx.fillRect(x, winY + winH / 2 - 2, winW, 4);
  };
  drawPane(W / 2 - winW - 26, !silver);
  drawPane(W / 2 + 26, !silver);

  ctx.fillStyle = ink;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(silver ? "נר ה' נשמת אדם" : 'ירושלים', W / 2, H - 34);
  starOfDavid(ctx, W / 2 - 100, H - 44, 13, ink, 2.5);
  starOfDavid(ctx, W / 2 + 100, H - 44, 13, ink, 2.5);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Mottled grey-blue granite (matches the flared-rim urn vase)
function speckledTexture() {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#7d8496');
  grad.addColorStop(0.5, '#6b7182');
  grad.addColorStop(1, '#585d6b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(40,41,48,${0.25 + Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(Math.random() * S, Math.random() * S, 2 + Math.random() * 9, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(220,224,232,${Math.random() * 0.32})`;
    ctx.beginPath();
    ctx.arc(Math.random() * S, Math.random() * S, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Speckled granite urn vase with flared rim and pedestal foot.
export function buildSpeckledVase() {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    map: speckledTexture(),
    roughness: 0.22,
    metalness: 0.04,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });
  const profile = [
    [0.03, 0],
    [0.085, 0],
    [0.09, 0.012],
    [0.062, 0.03],
    [0.072, 0.055],
    [0.095, 0.09],
    [0.105, 0.15],
    [0.085, 0.21],
    [0.066, 0.235],
    [0.086, 0.25],
    [0.098, 0.272],
    [0.084, 0.28],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  group.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 48), mat));

  // Dark inner liner seen from above
  const liner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.078, 0.02, 32),
    new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: 0.65 })
  );
  liner.position.y = 0.268;
  group.add(liner);
  return group;
}

// White ceramic vase with a tulip-petal rim.
export function buildTulipVase() {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf7f6f3,
    roughness: 0.14,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  const profile = [
    [0.045, 0],
    [0.058, 0.008],
    [0.036, 0.022],
    [0.044, 0.05],
    [0.062, 0.09],
    [0.068, 0.13],
    [0.06, 0.17],
    [0.054, 0.19],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  group.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 40), ceramic));

  // Six petal lobes curving up and out from the rim
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10), ceramic);
    petal.scale.set(0.55, 1.5, 1);
    petal.position.set(Math.cos(ang) * 0.05, 0.212, Math.sin(ang) * 0.05);
    petal.rotation.y = -ang;
    petal.rotation.x = -0.22;
    group.add(petal);
  }

  const liner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.02, 24),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6 })
  );
  liner.position.y = 0.2;
  group.add(liner);
  return group;
}

// Memorial candle house: dark arched casing with a metal front plate and a lit candle.
export function buildCandleHouse(variant = 'silver') {
  const group = new THREE.Group();
  const silver = variant === 'silver';
  const w = 0.22;
  const d = 0.15;
  const rectH = 0.18;
  const plinthH = 0.028;

  const caseMat = new THREE.MeshStandardMaterial({
    color: silver ? 0x1b1b1e : 0x101216,
    roughness: silver ? 0.4 : 0.22,
    metalness: silver ? 0.35 : 0.15,
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w * 1.16, plinthH, d * 1.2), caseMat);
  plinth.position.y = plinthH / 2;
  group.add(plinth);

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, rectH, d), caseMat);
  body.position.y = plinthH + rectH / 2;
  group.add(body);

  const archGeo = new THREE.CylinderGeometry(w / 2, w / 2, d, 24, 1, false, 0, Math.PI);
  archGeo.rotateX(Math.PI / 2);
  const arch = new THREE.Mesh(archGeo, caseMat);
  arch.position.y = plinthH + rectH;
  group.add(arch);

  const frontMat = new THREE.MeshStandardMaterial({
    map: panelTexture(silver ? 'silver' : 'bronze'),
    roughness: 0.32,
    metalness: 0.85,
    emissive: new THREE.Color(0x1a0e04),
    emissiveIntensity: 0.1,
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, rectH * 0.94), frontMat);
  front.position.set(0, plinthH + rectH / 2, d / 2 + 0.002);
  group.add(front);

  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.014, 0.05, 12),
    new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xff9933, emissiveIntensity: 3 })
  );
  candle.position.set(0, plinthH + rectH * 0.3, 0);
  group.add(candle);

  const glow = new THREE.PointLight(0xffaa44, 0.7, 0.5);
  glow.position.set(0, plinthH + rectH * 0.35, 0);
  group.add(glow);

  return group;
}