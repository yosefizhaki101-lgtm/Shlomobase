import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { makeStoneTextures } from '@/lib/stoneTextures';
import { makeTextTexture } from '@/lib/tombstoneText';
import { buildNerHouse, getNerHouseFootprint, buildMountedCandleHousing } from '@/lib/nerHouseGeometry';
import { cloneGlbModel, applyMaterialToModel, transformModel } from '@/lib/glbModelCache';
import {
  STONE_TYPES,
  TOMBSTONE_TYPES,
  PANELS,
  FRAMES,
  SLABS,
  HEADSTONE_TOPS,
  ACCESSORIES,
  LETTERING_TYPES,
} from '@/lib/tombstoneOptions';

const TEX_CACHE = new Map();
const UPLOADED_TEX_CACHE = new Map();

function getUploadedTexture(url) {
  if (!url) return null;
  let tex = UPLOADED_TEX_CACHE.get(url);
  if (!tex) {
    const loader = new THREE.TextureLoader();
    tex = loader.load(url);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    UPLOADED_TEX_CACHE.set(url, tex);
  }
  return tex;
}

function stoneMat(stone, textureUrl) {
  // Uploaded texture from admin — use as diffuse map (tinted by stone color) with procedural normal map for surface detail
  if (textureUrl) {
    const upTex = getUploadedTexture(textureUrl);
    const key = `${stone.kind}:${stone.color}`;
    let t = TEX_CACHE.get(key);
    if (!t) {
      t = makeStoneTextures(stone.kind, stone.color);
      TEX_CACHE.set(key, t);
    }
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(stone.color),
      map: upTex,
      normalMap: t.normalMap,
      normalScale: new THREE.Vector2(t.nStr * 0.4, t.nStr * 0.4),
      roughness: stone.roughness,
      metalness: stone.metalness || 0,
      envMapIntensity: 1.5,
    });
  }
  const key = `${stone.kind}:${stone.color}`;
  let t = TEX_CACHE.get(key);
  if (!t) {
    t = makeStoneTextures(stone.kind, stone.color);
    TEX_CACHE.set(key, t);
  }
  const isMirror = stone.polish >= 0.95;
  if (isMirror) {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: t.map,
      normalMap: t.normalMap,
      normalScale: new THREE.Vector2(t.nStr * 1.6, t.nStr * 1.6),
      roughnessMap: t.roughnessMap,
      roughness: stone.roughness,
      metalness: stone.metalness || 0,
      clearcoat: stone.clearcoat ?? 1.0,
      clearcoatRoughness: stone.clearcoatRoughness ?? 0.03,
      envMapIntensity: 2.5,
    });
  }
  // Polished stones (marble, fine granite): clearcoat for a realistic polished surface
  if (stone.polish >= 0.5) {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: t.map,
      normalMap: t.normalMap,
      normalScale: new THREE.Vector2(t.nStr * 2.0, t.nStr * 2.0),
      roughnessMap: t.roughnessMap,
      roughness: stone.roughness,
      metalness: stone.metalness || 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.5,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xfff5e8),
    });
  }
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: t.map,
    normalMap: t.normalMap,
    normalScale: new THREE.Vector2(t.nStr * 2.5, t.nStr * 2.5),
    roughnessMap: t.roughnessMap,
    roughness: stone.roughness,
    metalness: stone.metalness || 0,
    envMapIntensity: 1.5,
  });
}

function glassMat(tint = 0x88aacc, opacity = 0.4) {
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.6,
    transparent: true,
    opacity,
    ior: 1.5,
    thickness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
}

function plainMat(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function resolveStone(design) {
  const stone = STONE_TYPES.find((s) => s.id === design.stoneType) || STONE_TYPES[0];
  if (design.colorOverride) {
    return { ...stone, color: design.colorOverride };
  }
  return stone;
}

function resolveStoneForPart(design, field) {
  const stoneId = design[field] || design.stoneType;
  const stone = STONE_TYPES.find((s) => s.id === stoneId) || STONE_TYPES[0];
  const colorField = field ? field.replace('Stone', 'Color') : null;
  const partColor = colorField ? design[colorField] : null;
  if (partColor) {
    return { ...stone, color: partColor };
  }
  if (design.colorOverride) {
    return { ...stone, color: design.colorOverride };
  }
  return stone;
}

function resolveOverride(stone, overrideColor) {
  return overrideColor ? { ...stone, color: overrideColor } : stone;
}

function smoothGeo(w, h, d, r = 0.02) {
  return new RoundedBoxGeometry(Math.max(0.01, w), Math.max(0.01, h), Math.max(0.01, d), 4, r);
}

// Sharp-edged box geometry — clean rectangular stone edges (no rounded bevels)
function sharpGeo(w, h, d) {
  return new THREE.BoxGeometry(Math.max(0.01, w), Math.max(0.01, h), Math.max(0.01, d));
}

// Rock-pitched (tuvza) geometry: angular, faceted displacement
// that mimics natural cleaved stone with deep gouges and irregular chunks.
function rockGeo(w, h, d, amt = 0.06, seed = 7) {
  const W = Math.max(0.01, w), H = Math.max(0.01, h), D = Math.max(0.01, d);
  const segX = 18, segY = 18, segZ = 18;
  const g = new THREE.BoxGeometry(W, H, D, segX, segY, segZ);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const onSideX = Math.abs(Math.abs(v.x) - W / 2) < 0.01;
    const onSideZ = Math.abs(Math.abs(v.z) - D / 2) < 0.01;
    const onTop = Math.abs(v.y - H / 2) < 0.01;
    const onBottom = Math.abs(v.y + H / 2) < 0.01;
    if ((onSideX || onSideZ) && !onTop && !onBottom) {
      // Layered split-face: horizontal bands of varying depth (like cleaved sedimentary stone)
      const bandY = Math.floor(v.y * 8 + seed * 2);
      const bandHash = Math.sin(bandY * 19.7 + seed * 3.1) * 43758.5;
      const band = (bandHash - Math.floor(bandHash));
      const bandStep = Math.floor(band * 6) / 6;
      // Angular chunk-based displacement: quantize into cells
      const cellX = Math.floor(v.x * 8 + seed * 3);
      const cellY = Math.floor(v.y * 8 + seed * 5);
      const cellZ = Math.floor(v.z * 8 + seed * 7);
      const chunkHash = Math.sin(cellX * 12.9 + cellY * 78.2 + cellZ * 37.7) * 43758.5;
      const chunk = (chunkHash - Math.floor(chunkHash));
      const step = Math.floor(chunk * 5) / 5;
      // Micro roughness — high frequency surface detail
      const micro = (Math.sin(v.y * 67 + seed) * Math.cos(v.x * 53 + seed * 2) * Math.sin(v.z * 41 + seed * 4)) * amt * 0.3;
      const n = (bandStep * 0.5 + step * 0.5) * amt * 2.2 + micro;
      if (onSideX) v.x += n;
      if (onSideZ) v.z += n;
      // Deep gouges along band boundaries for layered split-face look
      const bandEdge = Math.abs((v.y * 8) - Math.floor(v.y * 8 + 0.5));
      if (bandEdge < 0.18) {
        const gougeAmt = (0.18 - bandEdge) / 0.18 * amt * 1.5;
        if (onSideX) v.x -= gougeAmt;
        if (onSideZ) v.z -= gougeAmt;
      }
      // Random deep pits for natural rock face
      const pit = Math.sin(v.x * 23 + seed * 1.7) * Math.cos(v.y * 19 + seed * 2.3) * Math.sin(v.z * 29 + seed * 3.1);
      if (pit > 0.82) {
        if (onSideX) v.x -= amt * 1.1;
        if (onSideZ) v.z -= amt * 1.1;
      }
      // Random raised protrusions — natural rock face bumps
      const bump = Math.sin(v.x * 31 + seed * 2.3) * Math.cos(v.y * 27 + seed * 3.7) * Math.sin(v.z * 33 + seed * 5.1);
      if (bump > 0.88) {
        if (onSideX) v.x += amt * 0.7;
        if (onSideZ) v.z += amt * 0.7;
      }
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function rockWallGeo(w, h, d, amt = 0.05, seed = 7) {
  const W = Math.max(0.01, w), H = Math.max(0.01, h), D = Math.max(0.01, d);
  const g = new THREE.BoxGeometry(W, H, D, 20, 10, 20);
  const pos = g.attributes.position;
  const maxDisplacement = Math.min(amt * 0.8, Math.min(W, D) * 0.28);
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const onSideX = Math.abs(Math.abs(v.x) - W / 2) < 0.0001;
    const onSideZ = Math.abs(Math.abs(v.z) - D / 2) < 0.0001;
    if (!onSideX && !onSideZ) continue;

    const cellX = Math.floor((v.x + W / 2) * 28);
    const cellY = Math.floor((v.y + H / 2) * 24);
    const cellZ = Math.floor((v.z + D / 2) * 28);
    const cellHash = Math.sin(cellX * 12.9898 + cellY * 78.233 + cellZ * 37.719 + seed * 19.19) * 43758.5453;
    const chunk = Math.floor((cellHash - Math.floor(cellHash)) * 5) / 4 - 0.5;
    const broad = Math.sin(v.x * 5.7 + seed) * Math.cos(v.y * 8.1 + seed * 1.7) * Math.sin(v.z * 5.3 + seed * 2.3);
    const facet = chunk * 0.75 + Math.round(broad * 2) / 4 * 0.25;
    const displacement = facet * maxDisplacement;

    // Apply both components at shared corners so adjoining wall faces stay joined.
    if (onSideX) v.x += Math.sign(v.x) * displacement;
    if (onSideZ) v.z += Math.sign(v.z) * displacement;
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  g.computeVertexNormals();
  return g;
}

const STEP_LIFT = { panel: 0, frame: 0.4, slab: 0.85, headstone: 1.25 };

function place(group, mesh, pos, stepKey) {
  mesh.position.copy(pos);
  mesh.userData.rest = pos.clone();
  mesh.userData.explodeOffset = new THREE.Vector3(0, STEP_LIFT[stepKey] || 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addPebbles(group, cx, cy, cz, chanW, len, count, stepKey, color = 0xf3f1ea) {
  // Polished river pebbles — varied natural colors with PBR materials
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.25, metalness: 0.05 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.2, metalness: 0.1 });
  const greyMat = new THREE.MeshStandardMaterial({ color: 0x6d6d6f, roughness: 0.3, metalness: 0.05 });
  const brownMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.35, metalness: 0.05 });
  const tanMat = new THREE.MeshStandardMaterial({ color: 0xc4b8a0, roughness: 0.3, metalness: 0.05 });
  const mats = color === 0x1a1a1c
    ? [blackMat, blackMat, greyMat, brownMat]
    : color === 0xffffff
    ? [whiteMat, whiteMat, whiteMat, whiteMat]
    : [whiteMat, whiteMat, greyMat, blackMat, brownMat, tanMat];
  const geo = new THREE.IcosahedronGeometry(0.035, 2);
  for (let i = 0; i < count; i++) {
    const tz = cz + (i / (count - 1) - 0.5) * (len - 0.12);
    const tx = cx + (Math.sin(i * 12.9) * 0.5) * (chanW - 0.06);
    const r = 0.02 + ((Math.cos(i * 7.3) + 1) / 2) * 0.025;
    const peb = new THREE.Mesh(geo, mats[i % mats.length]);
    const sx = r / 0.035;
    const sy = sx * (0.6 + ((Math.sin(i * 5.1) + 1) / 2) * 0.4);
    const sz = sx * (0.8 + ((Math.cos(i * 3.7) + 1) / 2) * 0.3);
    peb.scale.set(sx, sy, sz);
    peb.rotation.set((i * 2.3) % 6.28, (i * 3.7) % 6.28, (i * 5.1) % 6.28);
    peb.castShadow = true;
    peb.receiveShadow = true;
    place(group, peb, new THREE.Vector3(tx, cy, tz), stepKey);
  }
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.2);
  s.bezierCurveTo(0, 0.5, -0.5, 0.5, -0.5, 0.15);
  s.bezierCurveTo(-0.5, -0.05, -0.12, -0.2, 0, -0.45);
  s.bezierCurveTo(0.12, -0.2, 0.5, -0.05, 0.5, 0.15);
  s.bezierCurveTo(0.5, 0.5, 0, 0.5, 0, 0.2);
  return s;
}

function buildPanel({ W, L, y, stone, def, group, textureUrl, customHeight = null, slabW = null, slabL = null, forceInsetCm = 0 }) {
  const mat = stoneMat(resolveOverride(stone, def.overrideColor), textureUrl);
  const h = customHeight || def.height || 0.1;
  // Top panel layer is always 2cm smaller than the slab above (fixed construction standard)
  const insetCm = forceInsetCm || def.insetCm || 0;
  if (insetCm && slabW && slabL) {
    W = Math.max(0.01, slabW - insetCm / 100);
    L = Math.max(0.01, slabL - insetCm / 100);
  }
  switch (def.geom) {
    case 'base_concrete':
      place(group, new THREE.Mesh(sharpGeo(W + 0.2, h, L + 0.16), mat), new THREE.Vector3(0, y + h / 2, 0), 'panel');
      break;
    case 'base_double_tier':
      place(group, new THREE.Mesh(sharpGeo(W + 0.2, h * 0.55, L + 0.12), mat), new THREE.Vector3(0, y + h * 0.27, 0), 'panel');
      place(group, new THREE.Mesh(sharpGeo(W, h * 0.45, L + 0.05), mat), new THREE.Vector3(0, y + h * 0.77, 0), 'panel');
      break;
    case 'base_beveled':
      // Inset panels use exact W,L (already reduced above); regular panels widen by 0.2/0.12
      place(group, new THREE.Mesh(sharpGeo(insetCm ? W : W + 0.2, h, insetCm ? L : L + 0.12), mat), new THREE.Vector3(0, y + h / 2, 0), 'panel');
      break;
    case 'base_tuvza':
      place(group, new THREE.Mesh(rockGeo(W + 0.2, h, L + 0.12, 0.04, 23), mat), new THREE.Vector3(0, y + h / 2, 0), 'panel');
      break;
    case 'base_glass_crystal': {
      // Stone base with embedded glass strip
      place(group, new THREE.Mesh(sharpGeo(W + 0.2, h * 0.6, L + 0.12), mat), new THREE.Vector3(0, y + h * 0.3, 0), 'panel');
      const glassStrip = new THREE.Mesh(sharpGeo(W + 0.15, h * 0.4, L + 0.08), glassMat());
      place(group, glassStrip, new THREE.Vector3(0, y + h * 0.8, 0), 'panel');
      break;
    }
    case 'base_single_tier':
    default:
      place(group, new THREE.Mesh(sharpGeo(W + 0.2, h, L + 0.12), mat), new THREE.Vector3(0, y + h / 2, 0), 'panel');
      break;
  }
  return { topY: y + h };
}

function buildFrame({ W, L, y, stone, def, group, textureUrl, customHeight = null, customW = null, customL = null }) {
  const resolvedStone = resolveOverride(stone, def.overrideColor);
  const mat = stoneMat(resolvedStone, textureUrl);
  // Per-component dimension overrides (cm → m); fall back to shared W/L
  if (customW) W = customW;
  if (customL) L = customL;
  const wallH = (customHeight || def.height || 0.25) * 0.88;
  const useRock = def.geom === 'wall_rock_pitch' || def.geom === 'wall_tuvza' || def.geom === 'wall_connection_rock';
  const isConnection = def.geom === 'wall_connection' || def.geom === 'wall_connection_rock';

  // Single unified frame block — one solid wall around the perimeter (3-layer total: panel + frame + slab)
  const wallT = 0.12;

  const innerW = W * 0.88;
  const innerL = L * 0.88;

  // Smooth polished cap for rough frames — contrasts with the rugged exterior like the reference
  const capH = 0.018;
  const capMat = useRock ? new THREE.MeshStandardMaterial({
    color: new THREE.Color(resolvedStone.color),
    roughness: 0.22,
    metalness: 0.02,
  }) : null;

  // Black inner trim — thin polished black border on the inner top edge of the frame walls.
  // This is a standard construction feature visible in real grave frames: a thin black metal/stone
  // liner set inside the top perimeter of the stone walls.
  const trimH = 0.012;
  const trimT = 0.055;
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: 0x050505,
    roughness: 0.08,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.0,
  });

  // Rock-pitched walls use rugged geometry; smooth walls use sharp-edged boxes
  const wallSideGeo = useRock
    ? rockWallGeo(wallT, wallH, innerL + wallT * 2, 0.05, 41)
    : sharpGeo(wallT, wallH, innerL + wallT * 2);
  const wallFrontGeo = useRock
    ? rockWallGeo(innerW, wallH, wallT, 0.05, 43)
    : sharpGeo(innerW, wallH, wallT);
  place(group, new THREE.Mesh(wallSideGeo, mat), new THREE.Vector3(-(innerW / 2 + wallT / 2), y + wallH / 2, 0), 'frame');
  place(group, new THREE.Mesh(wallSideGeo.clone(), mat), new THREE.Vector3(innerW / 2 + wallT / 2, y + wallH / 2, 0), 'frame');
  if (!isConnection) {
    place(group, new THREE.Mesh(wallFrontGeo, mat), new THREE.Vector3(0, y + wallH / 2, innerL / 2 + wallT / 2), 'frame');
    place(group, new THREE.Mesh(wallFrontGeo.clone(), mat), new THREE.Vector3(0, y + wallH / 2, -(innerL / 2 + wallT / 2)), 'frame');
  }
  // Smooth polished cap on top (rough exterior, smooth top — like the reference)
  if (capMat) {
    const cs = sharpGeo(wallT, capH, innerL + wallT * 2);
    const cf = sharpGeo(innerW, capH, wallT);
    place(group, new THREE.Mesh(cs, capMat), new THREE.Vector3(-(innerW / 2 + wallT / 2), y + wallH + capH / 2, 0), 'frame');
    place(group, new THREE.Mesh(cs.clone(), capMat), new THREE.Vector3(innerW / 2 + wallT / 2, y + wallH + capH / 2, 0), 'frame');
    if (!isConnection) {
      place(group, new THREE.Mesh(cf, capMat), new THREE.Vector3(0, y + wallH + capH / 2, innerL / 2 + wallT / 2), 'frame');
      place(group, new THREE.Mesh(cf.clone(), capMat), new THREE.Vector3(0, y + wallH + capH / 2, -(innerL / 2 + wallT / 2)), 'frame');
    }
  }

  // Black inner trim — sits on the inner edge of the wall top, inset from the outer face.
  // Creates the distinctive dark border visible inside the frame opening.
  const trimTopY = y + wallH + (capMat ? capH : 0) + trimH / 2;
  const trimInset = 0.02; // inset from outer wall face
  const trimW = innerW + (wallT - trimInset - trimT) * 2;
  const trimLen = innerL + (wallT - trimInset - trimT) * 2;
  // Front and back trim strips
  place(group, new THREE.Mesh(sharpGeo(trimW + trimT * 2, trimH, trimT), trimMat), new THREE.Vector3(0, trimTopY, innerL / 2 + wallT - trimT / 2 - trimInset), 'frame');
  if (!isConnection) {
    place(group, new THREE.Mesh(sharpGeo(trimW + trimT * 2, trimH, trimT), trimMat), new THREE.Vector3(0, trimTopY, -(innerL / 2 + wallT - trimT / 2 - trimInset)), 'frame');
  }
  // Side trim strips
  place(group, new THREE.Mesh(sharpGeo(trimT, trimH, trimLen), trimMat), new THREE.Vector3(-(innerW / 2 + wallT - trimT / 2 - trimInset), trimTopY, 0), 'frame');
  place(group, new THREE.Mesh(sharpGeo(trimT, trimH, trimLen), trimMat), new THREE.Vector3(innerW / 2 + wallT - trimT / 2 - trimInset, trimTopY, 0), 'frame');

  // Special: grooved horizontal lines on the frame
  if (def.geom === 'wall_grooved') {
    const gg = sharpGeo(innerW + wallT * 2, 0.02, wallT + 0.01);
    for (let i = 0; i < 3; i++) {
      const gz = -innerL / 2 + (i + 1) * innerL / 4;
      place(group, new THREE.Mesh(gg, plainMat(0x2a2620, 1)), new THREE.Vector3(0, y + wallH * 0.3 + i * 0.08, gz), 'frame');
    }
  }
  // Special: glass divider strips between stone sections
  if (def.geom === 'wall_glass_divider') {
    const glassH = wallH * 0.7;
    const glassT = 0.03;
    place(group, new THREE.Mesh(smoothGeo(glassT, glassH, innerL + wallT, 0.005), glassMat()), new THREE.Vector3(-(innerW / 2 + wallT / 2), y + glassH / 2, 0), 'frame');
    place(group, new THREE.Mesh(smoothGeo(glassT, glassH, innerL + wallT, 0.005), glassMat()), new THREE.Vector3(innerW / 2 + wallT / 2, y + glassH / 2, 0), 'frame');
    place(group, new THREE.Mesh(smoothGeo(innerW, glassH, glassT, 0.005), glassMat()), new THREE.Vector3(0, y + glassH / 2, innerL / 2 + wallT / 2), 'frame');
    place(group, new THREE.Mesh(smoothGeo(innerW, glassH, glassT, 0.005), glassMat()), new THREE.Vector3(0, y + glassH / 2, -(innerL / 2 + wallT / 2)), 'frame');
  }

  return { topY: y + wallH + (capMat ? capH : 0) + trimH };
}

function buildSlab({ W, L, y, stone, def, group, textureUrl, customHeight = null, customW = null, customL = null }) {
  const mat = stoneMat(resolveOverride(stone, def.overrideColor), textureUrl);
  // Per-component dimension overrides (cm → m); fall back to shared W/L
  if (customW) W = customW;
  if (customL) L = customL;
  const h = customHeight || def.height || 0.1;
  switch (def.geom) {
    case 'slab_bench':
    case 'slab_bench_rock': {
      const benchMat = def.geom === 'slab_bench_rock' ? stoneMat(resolveOverride(stone, def.overrideColor)) : mat;
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h, L * 0.94), benchMat), new THREE.Vector3(0, y + h / 2, 0), 'slab');
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h * 0.5, L * 0.3), benchMat), new THREE.Vector3(0, y + h * 1.25, L * 0.32), 'slab');
      break;
    }
    case 'slab_bench_slope': {
      const m = new THREE.Mesh(sharpGeo(W * 0.96, h, L * 0.94), mat);
      m.rotation.x = -0.08;
      place(group, m, new THREE.Vector3(0, y + h / 2 + 0.01, 0), 'slab');
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h * 0.5, L * 0.3), mat), new THREE.Vector3(0, y + h * 1.25, L * 0.32), 'slab');
      break;
    }
    case 'slab_bench_steps': {
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h, L * 0.94), mat), new THREE.Vector3(0, y + h / 2, 0), 'slab');
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h * 0.4, L * 0.25), mat), new THREE.Vector3(0, y + h * 1.2, L * 0.35), 'slab');
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h * 0.3, L * 0.2), mat), new THREE.Vector3(0, y + h * 1.55, L * 0.4), 'slab');
      break;
    }
    case 'slab_garden': {
      const slabW = (W * 0.96 - 0.5) / 2;
      const slabLen = L * 0.92;
      place(group, new THREE.Mesh(sharpGeo(slabW, h, slabLen), mat), new THREE.Vector3(-(0.25 + slabW / 2), y + h / 2, 0), 'slab');
      place(group, new THREE.Mesh(sharpGeo(slabW, h, slabLen), mat), new THREE.Vector3(0.25 + slabW / 2, y + h / 2, 0), 'slab');
      break;
    }
    case 'slab_garden_inner': {
      const frameW = 0.15;
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h, frameW), mat), new THREE.Vector3(0, y + h / 2, L * 0.42), 'slab');
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h, frameW), mat), new THREE.Vector3(0, y + h / 2, -L * 0.42), 'slab');
      place(group, new THREE.Mesh(sharpGeo(frameW, h, L * 0.84), mat), new THREE.Vector3(-(W * 0.4), y + h / 2, 0), 'slab');
      place(group, new THREE.Mesh(sharpGeo(frameW, h, L * 0.84), mat), new THREE.Vector3(W * 0.4, y + h / 2, 0), 'slab');
      break;
    }
    case 'slab_strip': {
      place(group, new THREE.Mesh(sharpGeo(W * 0.2, h, L * 0.94), mat), new THREE.Vector3(0, y + h / 2, 0), 'slab');
      break;
    }
    case 'slab_split_pebbles':
    case 'slab_split_straight': {
      const slabW = (W * 0.96 - 0.18) / 2;
      const slabLen = L * 0.92;
      place(group, new THREE.Mesh(sharpGeo(slabW, h, slabLen), mat), new THREE.Vector3(-(0.09 + slabW / 2), y + h / 2, 0.05), 'slab');
      place(group, new THREE.Mesh(sharpGeo(slabW, h, slabLen), mat), new THREE.Vector3(0.09 + slabW / 2, y + h / 2, 0.05), 'slab');
      place(group, new THREE.Mesh(smoothGeo(0.18, h * 0.7, slabLen, 0.01), plainMat(0x2a2620, 1)), new THREE.Vector3(0, y + h * 0.3, 0.05), 'slab');
      if (def.geom === 'slab_split_pebbles') {
        // Dense pure-white pebbles along the channel
        addPebbles(group, 0, y + h * 0.5, 0.05, 0.18, slabLen, 42, 'slab', 0xffffff);
        // Brown fieldstones at the foot (front) end of the channel
        const brownStoneMat = new THREE.MeshStandardMaterial({ color: 0xa58e77, roughness: 0.95, metalness: 0 });
        const fieldGeo = new THREE.IcosahedronGeometry(0.045, 1);
        for (let i = 0; i < 6; i++) {
          const fz = 0.05 + slabLen * 0.28 + (i % 3) * 0.05;
          const fx = ((i % 2) - 0.5) * 0.07;
          const fs = 0.8 + ((i * 7.3) % 10) / 10 * 0.5;
          const fmesh = new THREE.Mesh(fieldGeo, brownStoneMat);
          fmesh.scale.set(fs, fs * 0.7, fs);
          fmesh.rotation.set((i * 2.3) % 6.28, (i * 3.7) % 6.28, (i * 5.1) % 6.28);
          fmesh.castShadow = true;
          fmesh.receiveShadow = true;
          place(group, fmesh, new THREE.Vector3(fx, y + h * 0.5, fz), 'slab');
        }
      }
      break;
    }
    case 'slab_slanted': {
      // Wedge-shaped slab: flat bottom rests on the frame, sloped top for water drainage.
      // Back is full height, front is thinner — no floating, firmly grounded.
      const slabW = W * 0.96;
      const slabL = L * 0.94;
      const slopeH = h * 0.45; // height difference between back (high) and front (low)
      const geo = new THREE.BoxGeometry(slabW, h, slabL, 2, 2, 4);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        if (v.y > 0) {
          // Top face: slope from back (full height) to front (lower)
          const t = (v.z + slabL / 2) / slabL; // 0 at back, 1 at front
          v.y = h / 2 - slopeH * t;
        }
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      place(group, new THREE.Mesh(geo, mat), new THREE.Vector3(0, y + h / 2, 0), 'slab');
      break;
    }
    case 'slab_raised_center':
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h * 0.7, L * 0.94), mat), new THREE.Vector3(0, y + h * 0.35, 0), 'slab');
      place(group, new THREE.Mesh(sharpGeo(W * 0.6, h * 0.5, L * 0.5), mat), new THREE.Vector3(0, y + h * 0.95, 0), 'slab');
      break;
    case 'slab_glass_divider': {
      // Two stone slabs with a glass divider strip in the middle
      const slabW = (W * 0.96 - 0.1) / 2;
      const slabLen = L * 0.92;
      place(group, new THREE.Mesh(sharpGeo(slabW, h, slabLen), mat), new THREE.Vector3(-(0.05 + slabW / 2), y + h / 2, 0.05), 'slab');
      place(group, new THREE.Mesh(sharpGeo(slabW, h, slabLen), mat), new THREE.Vector3(0.05 + slabW / 2, y + h / 2, 0.05), 'slab');
      place(group, new THREE.Mesh(sharpGeo(0.1, h * 0.9, slabLen), glassMat(0xaaccdd, 0.5)), new THREE.Vector3(0, y + h * 0.45, 0.05), 'slab');
      break;
    }
    case 'slab_crystal_strip': {
      // Solid slab with a crystal strip along the center
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h * 0.8, L * 0.94), mat), new THREE.Vector3(0, y + h * 0.4, 0), 'slab');
      place(group, new THREE.Mesh(sharpGeo(W * 0.96 * 0.95, h * 0.3, 0.06), glassMat(0xddaacc, 0.6)), new THREE.Vector3(0, y + h * 0.9, 0), 'slab');
      break;
    }
    case 'slab_full_solid':
    default:
      place(group, new THREE.Mesh(sharpGeo(W * 0.96, h, L * 0.94), mat), new THREE.Vector3(0, y + h / 2, 0), 'slab');
      break;
  }
  return { topY: y + h };
}

function decalResult(topY, mesh, rearZ, hsD, w, h) {
  const centerY = topY - h * 0.42;
  return {
    topY,
    decal: {
      mesh,
      pos: new THREE.Vector3(0, centerY, rearZ + hsD / 2 + 0.003),
      look: new THREE.Vector3(0, centerY, rearZ - 0.1),
      size: new THREE.Vector3(w * 0.92, h * 0.92, 0.3),
    },
  };
}

// Build a triangular/trapezoidal pedestal base for the heart so it sits
// naturally on the slab — wider at the bottom, tapering to a narrow top,
// giving a connected, integrated look rather than a floating element.
function heartBase(w, h, d, mat) {
  const geo = new THREE.BoxGeometry(w, h, d, 4, 4, 4);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Smooth taper from bottom (full width) to top (narrow) — triangular profile
    const t = (v.y + h / 2) / h; // 0 at bottom, 1 at top
    const taper = 1 - t * 0.62;  // top is 38% of bottom width
    v.x *= taper;
    v.z *= taper * 0.85;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

function buildHeadstoneOne({ W, L, y, stone, def, group, xOff = 0, zOff = 0, textureUrl, scale = 1, thickness = 1, offsetX = 0, offsetZ = 0, customW = null, customH = null, customD = null }) {
  const mat = stoneMat(stone, textureUrl);
  // Explicit dimension overrides (cm → m); otherwise compute from scale
  const hsD = customD ? customD : (0.16 * scale * thickness);
  // Position flush with the rear edge of the slab (back face at -L*0.47)
  const rearZ = -L * 0.47 + hsD / 2 + zOff + offsetZ;
  const cx = xOff + offsetX;
  switch (def.geom) {
    case 'headstone_dome_top': {
      const hsW = (customW || (W * 0.85 * scale)), hsH = (customH || (W * 0.59 * scale));
      place(group, new THREE.Mesh(sharpGeo(hsW, hsH, hsD), mat), new THREE.Vector3(cx, y + hsH / 2, rearZ), 'headstone');
      // Dome: half-circle extruded along Z — flat side down, curve up
      const dr = hsW / 2;
      const dShape = new THREE.Shape();
      dShape.moveTo(-dr, 0);
      dShape.absarc(0, 0, dr, Math.PI, 0, true);
  dShape.lineTo(-dr, 0);
      const dg = new THREE.ExtrudeGeometry(dShape, { depth: hsD, bevelEnabled: false });
      dg.translate(0, 0, -hsD / 2);
      place(group, new THREE.Mesh(dg, mat), new THREE.Vector3(cx, y + hsH, rearZ), 'headstone');
      return decalResult(y + hsH + 0.15, new THREE.Mesh(smoothGeo(hsW, hsH, hsD), mat), rearZ, hsD, hsW, hsH);
    }
    case 'headstone_flat_heart': {
      // Flat heart lying on the slab surface — like the reference image
      const heartW = (customW || (W * 0.45 * scale));
      const heartThick = 0.08 * scale * thickness;
      const heartGeo = new THREE.ExtrudeGeometry(heartShape(), {
        depth: heartThick,
        bevelEnabled: true,
        bevelSize: 0.015,
        bevelThickness: 0.015,
        bevelSegments: 2,
      });
      heartGeo.scale(heartW, heartW, 1);
      heartGeo.center();
      const m = new THREE.Mesh(heartGeo, mat);
      m.rotation.x = -Math.PI / 2; // Lay flat, face up
      place(group, m, new THREE.Vector3(cx, y + heartThick / 2 + 0.002, rearZ), 'headstone');
      // Decal projected from above onto the heart's top surface
      return {
        topY: y + heartThick,
        decal: {
          mesh: m,
          pos: new THREE.Vector3(cx, y + heartThick + 0.05, rearZ),
          look: new THREE.Vector3(cx, y - 0.05, rearZ),
          size: new THREE.Vector3(heartW * 0.55, heartW * 0.55, 0.2),
        },
      };
    }
    case 'headstone_single_heart':
    case 'headstone_double_hearts': {
      const hsW = (customW || ((def.geom === 'headstone_double_hearts' ? W * 0.9 : W * 0.7) * scale));
      const hsH = (customH || (W * 0.67 * scale));
      // Triangular pedestal base — wider than the heart, integrated with the slab
      const baseH = 0.16;
      const baseW = hsW * 1.25;
      const baseD = hsD * 1.4;
      place(group, heartBase(baseW, baseH, baseD, mat), new THREE.Vector3(cx, y + baseH / 2, rearZ), 'headstone');
      // Heart sits on top of the tapered pedestal
      const geo = new THREE.ExtrudeGeometry(heartShape(), { depth: 0.15 * thickness, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
      geo.scale(hsW, hsH, 1);
      geo.center();
      const m = new THREE.Mesh(geo, mat);
      place(group, m, new THREE.Vector3(cx, y + baseH + hsH / 2 - 0.04, rearZ + 0.07), 'headstone');
      return decalResult(y + baseH + hsH + 0.1, m, rearZ, 0.15, hsW * 0.7, hsH * 0.6);
    }
    case 'headstone_open_book': {
      const hsW = (customW || (W * 0.85 * scale)), hsH = (customH || (W * 0.53 * scale)), hsD2 = 0.1 * scale * thickness;
      const pg = sharpGeo(hsW / 2, hsH, hsD2);
      const left = new THREE.Mesh(pg, mat);
      left.rotation.y = -0.14;
      place(group, left, new THREE.Vector3(cx - hsW / 4, y + hsH / 2, rearZ), 'headstone');
      const right = new THREE.Mesh(pg, mat);
      right.rotation.y = 0.14;
      place(group, right, new THREE.Vector3(cx + hsW / 4, y + hsH / 2, rearZ), 'headstone');
      return decalResult(y + hsH, left, rearZ, hsD2, hsW * 0.4, hsH * 0.7);
    }
    case 'headstone_chiseled_frame': {
      const hsW = (customW || (W * 0.85 * scale)), hsH = (customH || (W * 0.67 * scale)), hsD3 = 0.18 * scale * thickness;
      place(group, new THREE.Mesh(rockGeo(hsW, hsH, hsD3, 0.06, 31), mat), new THREE.Vector3(cx, y + hsH / 2, rearZ), 'headstone');
      const inner = new THREE.Mesh(smoothGeo(hsW * 0.75, hsH * 0.75, 0.02, 0.01), mat);
      place(group, inner, new THREE.Vector3(cx, y + hsH / 2, rearZ + hsD3 / 2), 'headstone');
      return decalResult(y + hsH, inner, rearZ + hsD3 / 2, 0.02, hsW * 0.65, hsH * 0.65);
    }
    case 'headstone_slanted_modern': {
      const hsW = (customW || (W * 0.85 * scale)), hsH = (customH || (W * 0.63 * scale));
      const m = new THREE.Mesh(sharpGeo(hsW, hsH, hsD), mat);
      m.rotation.x = -0.18;
      place(group, m, new THREE.Vector3(cx, y + hsH / 2 + 0.05, rearZ), 'headstone');
      return decalResult(y + hsH + 0.1, m, rearZ, hsD, hsW * 0.8, hsH * 0.7);
    }
    case 'headstone_arch_columns': {
      const hsW = (customW || (W * 0.95 * scale)), hsH = (customH || (W * 0.67 * scale));
      const colW = hsW * 0.3;
      const left = new THREE.Mesh(sharpGeo(colW, hsH, hsD), mat);
      place(group, left, new THREE.Vector3(cx - hsW * 0.35, y + hsH / 2, rearZ), 'headstone');
      const right = new THREE.Mesh(sharpGeo(colW, hsH, hsD), mat);
      place(group, right, new THREE.Vector3(cx + hsW * 0.35, y + hsH / 2, rearZ), 'headstone');
      // Arch: half-circle extruded along Z — flat side down, curve up
      const ar = hsW * 0.35;
      const aShape = new THREE.Shape();
      aShape.moveTo(-ar, 0);
      aShape.absarc(0, 0, ar, Math.PI, 0, true);
  aShape.lineTo(-ar, 0);
      const ag = new THREE.ExtrudeGeometry(aShape, { depth: hsD, bevelEnabled: false });
      ag.translate(0, 0, -hsD / 2);
      place(group, new THREE.Mesh(ag, mat), new THREE.Vector3(cx, y + hsH, rearZ), 'headstone');
      return decalResult(y + hsH + 0.2, left, rearZ, hsD, colW * 0.8, hsH * 0.7);
    }
    case 'headstone_classic_rect':
    default: {
      const hsW = (customW || (W * 0.85 * scale)), hsH = (customH || (W * 0.67 * scale));
      const m = new THREE.Mesh(sharpGeo(hsW, hsH, hsD), mat);
      // Slight backward tilt (recline) — like real memorial headstones that lean away from the grave
      m.rotation.x = -0.05;
      place(group, m, new THREE.Vector3(cx, y + hsH / 2, rearZ), 'headstone');
      return decalResult(y + hsH, m, rearZ, hsD, hsW, hsH);
    }
    case 'headstone_wave': {
      // Curved/wave headstone — organic S-curve with layered tiered segments,
      // inspired by real polished granite memorial sculptures.
      const hsW = (customW || (W * 0.8 * scale)), hsH = (customH || (W * 0.72 * scale));
      // Build a custom curved shape: sweeping left edge, tiered right side
      const shape = new THREE.Shape();
      shape.moveTo(-hsW / 2, 0);
      // Left edge: sweeping concave S-curve upward
      shape.bezierCurveTo(-hsW / 2 * 0.95, hsH * 0.35, -hsW / 2 * 0.7, hsH * 0.65, -hsW / 2 * 0.5, hsH * 0.85);
      shape.bezierCurveTo(-hsW / 2 * 0.3, hsH * 1.0, -hsW / 2 * 0.1, hsH * 1.02, 0, hsH * 0.98);
      // Top: gentle curve across to the right
      shape.bezierCurveTo(hsW / 2 * 0.3, hsH * 0.95, hsW / 2 * 0.55, hsH * 0.85, hsW / 2 * 0.7, hsH * 0.72);
      // Right edge: tiered/stepped descent — three layered segments
      shape.lineTo(hsW / 2 * 0.7, hsH * 0.52);
      shape.lineTo(hsW / 2 * 0.55, hsH * 0.50);
      shape.lineTo(hsW / 2 * 0.55, hsH * 0.32);
      shape.lineTo(hsW / 2 * 0.4, hsH * 0.30);
      shape.lineTo(hsW / 2 * 0.4, hsH * 0.12);
      shape.lineTo(hsW / 2 * 0.25, hsH * 0.10);
      shape.lineTo(hsW / 2 * 0.25, 0);
      shape.lineTo(-hsW / 2, 0);
      const waveGeo = new THREE.ExtrudeGeometry(shape, {
        depth: hsD,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.012,
        bevelSegments: 2,
      });
      waveGeo.translate(0, 0, -hsD / 2);
      const m = new THREE.Mesh(waveGeo, mat);
      place(group, m, new THREE.Vector3(cx, y, rearZ), 'headstone');
      return decalResult(y + hsH, m, rearZ, hsD, hsW * 0.7, hsH * 0.65);
    }
  }
}

function buildHeadstoneLying({ W, L, y, stone, def, group, textureUrl, scale = 1, thickness = 1, offsetX = 0, offsetZ = 0, customW = null, customH = null, customD = null }) {
  const mat = stoneMat(stone, textureUrl);
  const cx = offsetX;
  // Lying headstone: flat on the slab surface, centered slightly toward the back
  const centerZ = offsetZ - L * 0.05;
  const hsW = customW || (W * 0.55 * scale);
  const hsLen = customH || (W * 0.45 * scale); // "height" becomes length when lying
  const hsThick = customD || (0.08 * scale * thickness);

  switch (def.geom) {
    case 'headstone_single_heart':
    case 'headstone_double_hearts':
    case 'headstone_flat_heart': {
      // Heart lying flat on the slab
      const heartGeo = new THREE.ExtrudeGeometry(heartShape(), {
        depth: hsThick, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2,
      });
      heartGeo.scale(hsW, hsW, 1);
      heartGeo.center();
      const m = new THREE.Mesh(heartGeo, mat);
      m.rotation.x = -Math.PI / 2;
      place(group, m, new THREE.Vector3(cx, y + hsThick / 2 + 0.002, centerZ), 'headstone');
      return {
        topY: y + hsThick,
        decal: {
          mesh: m,
          pos: new THREE.Vector3(cx, y + hsThick + 0.05, centerZ),
          look: new THREE.Vector3(cx, y - 0.05, centerZ),
          size: new THREE.Vector3(hsW * 0.5, hsW * 0.5, 0.2),
        },
      };
    }
    case 'headstone_open_book': {
      // Open book lying flat
      const pgW = hsW / 2;
      const pgL = hsLen;
      const left = new THREE.Mesh(sharpGeo(pgW, hsThick, pgL), mat);
      left.rotation.y = -0.1;
      place(group, left, new THREE.Vector3(cx - hsW / 4, y + hsThick / 2 + 0.002, centerZ), 'headstone');
      const right = new THREE.Mesh(sharpGeo(pgW, hsThick, pgL), mat);
      right.rotation.y = 0.1;
      place(group, right, new THREE.Vector3(cx + hsW / 4, y + hsThick / 2 + 0.002, centerZ), 'headstone');
      return {
        topY: y + hsThick,
        decal: {
          mesh: left,
          pos: new THREE.Vector3(cx, y + hsThick + 0.05, centerZ),
          look: new THREE.Vector3(cx, y - 0.05, centerZ),
          size: new THREE.Vector3(hsW * 0.8, hsLen * 0.7, 0.2),
        },
      };
    }
    case 'headstone_dome_top': {
      // Pillow/cushion lying flat — rounded slab
      const m = new THREE.Mesh(sharpGeo(hsW, hsThick, hsLen), mat);
      place(group, m, new THREE.Vector3(cx, y + hsThick / 2 + 0.002, centerZ), 'headstone');
      // Rounded top edge
      const domeGeo = new THREE.CylinderGeometry(hsW / 2, hsW / 2, hsLen, 24, 1, false, 0, Math.PI);
      domeGeo.rotateX(Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, mat);
      dome.scale.y = 0.4;
      place(group, dome, new THREE.Vector3(cx, y + hsThick + 0.002, centerZ), 'headstone');
      return {
        topY: y + hsThick + 0.04,
        decal: {
          mesh: m,
          pos: new THREE.Vector3(cx, y + hsThick + 0.05, centerZ),
          look: new THREE.Vector3(cx, y - 0.05, centerZ),
          size: new THREE.Vector3(hsW * 0.8, hsLen * 0.7, 0.2),
        },
      };
    }
    default: {
      // Rectangular/slab headstone lying flat on the slab
      const m = new THREE.Mesh(sharpGeo(hsW, hsThick, hsLen), mat);
      place(group, m, new THREE.Vector3(cx, y + hsThick / 2 + 0.002, centerZ), 'headstone');
      return {
        topY: y + hsThick,
        decal: {
          mesh: m,
          pos: new THREE.Vector3(cx, y + hsThick + 0.05, centerZ),
          look: new THREE.Vector3(cx, y - 0.05, centerZ),
          size: new THREE.Vector3(hsW * 0.85, hsLen * 0.85, 0.2),
        },
      };
    }
  }
}

function buildHeadstone({ W, L, y, stone, def, group, placement, textureUrl, scale = 1, thickness = 1, offsetX = 0, offsetZ = 0, customW = null, customH = null, customD = null }) {
  if (placement === 'lying') {
    return buildHeadstoneLying({ W, L, y, stone, def, group, textureUrl, scale, thickness, offsetX, offsetZ, customW, customH, customD });
  }
  if (placement === 'sides') {
    const sideX = W * 0.24;
    const res1 = buildHeadstoneOne({ W: W * 0.42, L, y, stone, def, group, xOff: -sideX, zOff: 0, textureUrl, scale, thickness, offsetX, offsetZ, customW, customH, customD });
    const res2 = buildHeadstoneOne({ W: W * 0.42, L, y, stone, def, group, xOff: sideX, zOff: 0, textureUrl, scale, thickness, offsetX, offsetZ, customW, customH, customD });
    return res1;
  }
  return buildHeadstoneOne({ W, L, y, stone, def, group, textureUrl, scale, thickness, offsetX, offsetZ, customW, customH, customD });
}

function buildAccessories({ W, L, y, stone, accessories, accessoryPositions, group }) {
  if (!accessories || accessories.length === 0) return;
  const mat = stoneMat(stone);
  // Place accessories on the slab surface, spread along the front edge
  const baseY = y + 0.02;
  const spacing = W > 1.5 ? 0.5 : 0.35;
  const defaultFrontZ = L * 0.32;
  accessories.forEach((accId, idx) => {
    const defaultX = (idx - (accessories.length - 1) / 2) * spacing;
    const customPos = accessoryPositions?.[idx];
    const offsetX = defaultX + (customPos?.x || 0);
    const frontZ = defaultFrontZ + (customPos?.z || 0);
    switch (accId) {
      case 'candle_1':
      case 'candle_2':
      case 'candle_3': {
        const n = accId === 'candle_1' ? 1 : accId === 'candle_2' ? 2 : 3;
        const lw = 0.1 + n * 0.04;
        const lanternH = 0.20 + n * 0.03;
        const metalDark = plainMat(0x2a2a2e, 0.4, 0.7);
        // Dark metal base
        place(group, new THREE.Mesh(smoothGeo(lw, 0.04, lw, 0.01), metalDark), new THREE.Vector3(offsetX, baseY + 0.02, frontZ), 'headstone');
        // Glass body
        place(group, new THREE.Mesh(smoothGeo(lw - 0.02, lanternH, lw - 0.02, 0.005), glassMat(0x1a1a2e, 0.35)), new THREE.Vector3(offsetX, baseY + 0.04 + lanternH / 2, frontZ), 'headstone');
        // Metal top
        place(group, new THREE.Mesh(smoothGeo(lw, 0.03, lw, 0.01), metalDark), new THREE.Vector3(offsetX, baseY + 0.04 + lanternH + 0.015, frontZ), 'headstone');
        // LED candle inside (warm glow)
        const ledMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xff9933, emissiveIntensity: 2.5 });
        place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 8), ledMat), new THREE.Vector3(offsetX, baseY + 0.08, frontZ), 'headstone');
        break;
      }
      case 'planter': {
        // Marble urn vase with rim
        const urnMat = stoneMat(STONE_TYPES.find((s) => s.id === 'white_marble') || STONE_TYPES[1]);
        place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.22, 20), urnMat), new THREE.Vector3(offsetX, baseY + 0.11, frontZ), 'headstone');
        place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), urnMat), new THREE.Vector3(offsetX, baseY + 0.235, frontZ), 'headstone');
        break;
      }
      case 'candle_special':
        place(group, new THREE.Mesh(smoothGeo(0.18, 0.25, 0.15, 0.03), mat), new THREE.Vector3(offsetX, baseY + 0.125, frontZ), 'headstone');
        place(group, new THREE.Mesh(smoothGeo(0.16, 0.3, 0.13, 0.005), glassMat(0x223344, 0.3)), new THREE.Vector3(offsetX, baseY + 0.4, frontZ), 'headstone');
        break;
      case 'candle_solar':
      case 'candle_solar_combo': {
        const lh = accId === 'candle_solar_combo' ? 0.3 : 0.22;
        place(group, new THREE.Mesh(smoothGeo(0.14, 0.08, 0.12, 0.01), mat), new THREE.Vector3(offsetX, baseY + 0.04, frontZ), 'headstone');
        place(group, new THREE.Mesh(smoothGeo(0.12, lh, 0.02, 0.005), glassMat(0x111133, 0.4)), new THREE.Vector3(offsetX, baseY + 0.08 + lh / 2, frontZ + 0.05), 'headstone');
        break;
      }
      case 'planter_marble': {
        place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.2, 16), stoneMat(STONE_TYPES.find((s) => s.id === 'white_marble') || STONE_TYPES[1])), new THREE.Vector3(offsetX, baseY + 0.1, frontZ), 'headstone');
        break;
      }
      case 'planter_granite': {
        place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.2, 16), stoneMat(STONE_TYPES[0])), new THREE.Vector3(offsetX, baseY + 0.1, frontZ), 'headstone');
        break;
      }
      case 'pebbles_white':
      case 'pebbles_black': {
        const pColor = accId === 'pebbles_white' ? 0xf3f1ea : 0x2a2a2c;
        addPebbles(group, offsetX, baseY + 0.02, frontZ, 0.3, 0.5, 10, 'headstone', pColor);
        break;
      }
      case 'vase_marble_urn': {
        // Classic marble urn vase — bulbous body with narrow neck and rim
        const vaseMat = stoneMat(STONE_TYPES.find((s) => s.id === 'white_marble') || STONE_TYPES[7]);
        const vaseH = 0.28;
        // Body — urn shape (wide bottom, narrow neck, flared rim)
        const bodyGeo = new THREE.LatheGeometry([
          new THREE.Vector2(0.01, 0),
          new THREE.Vector2(0.09, 0.01),
          new THREE.Vector2(0.11, 0.06),
          new THREE.Vector2(0.10, 0.12),
          new THREE.Vector2(0.07, 0.16),
          new THREE.Vector2(0.06, 0.20),
          new THREE.Vector2(0.09, 0.24),
          new THREE.Vector2(0.10, 0.27),
          new THREE.Vector2(0.08, 0.28),
        ], 24);
        const body = new THREE.Mesh(bodyGeo, vaseMat);
        body.castShadow = true; body.receiveShadow = true;
        place(group, body, new THREE.Vector3(offsetX, baseY, frontZ), 'headstone');
        break;
      }
      case 'vase_granite_rose': {
        // Granite vase with rose relief — cylindrical with carved rose
        const vaseMat = stoneMat(STONE_TYPES.find((s) => s.id === 'sardo') || STONE_TYPES[4]);
        const vaseH = 0.30;
        // Tapered cylinder body
        const bodyGeo = new THREE.CylinderGeometry(0.08, 0.10, vaseH, 20);
        const body = new THREE.Mesh(bodyGeo, vaseMat);
        body.castShadow = true; body.receiveShadow = true;
        place(group, body, new THREE.Vector3(offsetX, baseY + vaseH / 2, frontZ), 'headstone');
        // Rose relief — small embossed sphere cluster on the front
        const roseMat = new THREE.MeshStandardMaterial({ color: 0xd4a4a4, roughness: 0.5, metalness: 0.05 });
        const roseCenter = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), roseMat);
        roseCenter.position.set(offsetX, baseY + vaseH * 0.5, frontZ + 0.09);
        group.add(roseCenter);
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), roseMat);
          petal.position.set(offsetX + Math.cos(ang) * 0.025, baseY + vaseH * 0.5 + Math.sin(ang) * 0.025, frontZ + 0.085);
          group.add(petal);
        }
        // Rim
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20), vaseMat);
        rim.position.set(offsetX, baseY + vaseH + 0.01, frontZ);
        group.add(rim);
        break;
      }
      case 'vase_black_tapered': {
        // Black tapered cylindrical vase
        const vaseMat = stoneMat(STONE_TYPES.find((s) => s.id === 'black_granite') || STONE_TYPES[0]);
        const vaseH = 0.26;
        const bodyGeo = new THREE.CylinderGeometry(0.07, 0.10, vaseH, 24);
        const body = new THREE.Mesh(bodyGeo, vaseMat);
        body.castShadow = true; body.receiveShadow = true;
        place(group, body, new THREE.Vector3(offsetX, baseY + vaseH / 2, frontZ), 'headstone');
        // Flat rim
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 24), vaseMat);
        rim.position.set(offsetX, baseY + vaseH + 0.007, frontZ);
        group.add(rim);
        break;
      }
      case 'vase_white_round': {
        // White round bulbous vase
        const vaseMat = stoneMat(STONE_TYPES.find((s) => s.id === 'white_marble') || STONE_TYPES[7]);
        const vaseH = 0.24;
        const bodyGeo = new THREE.LatheGeometry([
          new THREE.Vector2(0.01, 0),
          new THREE.Vector2(0.06, 0.01),
          new THREE.Vector2(0.10, 0.06),
          new THREE.Vector2(0.11, 0.12),
          new THREE.Vector2(0.09, 0.18),
          new THREE.Vector2(0.07, 0.22),
          new THREE.Vector2(0.08, 0.24),
        ], 24);
        const body = new THREE.Mesh(bodyGeo, vaseMat);
        body.castShadow = true; body.receiveShadow = true;
        place(group, body, new THREE.Vector3(offsetX, baseY, frontZ), 'headstone');
        break;
      }
      case 'vase_grey_square': {
        // Grey square vase — modern geometric
        const vaseMat = stoneMat(STONE_TYPES.find((s) => s.id === 'sardo') || STONE_TYPES[4]);
        const vaseH = 0.24;
        const sw = 0.12;
        // Tapered square body
        const bodyGeo = new THREE.BoxGeometry(sw, vaseH, sw, 2, 4, 2);
        const pos = bodyGeo.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          const t = (v.y + vaseH / 2) / vaseH;
          const taper = 1 - t * 0.2;
          v.x *= taper;
          v.z *= taper;
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, vaseMat);
        body.castShadow = true; body.receiveShadow = true;
        place(group, body, new THREE.Vector3(offsetX, baseY + vaseH / 2, frontZ), 'headstone');
        break;
      }
      case 'candle_2_medium_2':
      case 'candle_2_3': {
        const n = accId === 'candle_2_3' ? 3 : 2;
        const lw = 0.1 + n * 0.05;
        const off1 = offsetX - 0.18;
        const off2 = offsetX + 0.18;
        place(group, new THREE.Mesh(smoothGeo(lw, 0.15, 0.12, 0.01), mat), new THREE.Vector3(off1, baseY + 0.075, frontZ), 'headstone');
        place(group, new THREE.Mesh(smoothGeo(lw - 0.02, 0.2, 0.1, 0.005), glassMat(0x223344, 0.3)), new THREE.Vector3(off1, baseY + 0.25, frontZ), 'headstone');
        place(group, new THREE.Mesh(smoothGeo(lw, 0.15, 0.12, 0.01), mat), new THREE.Vector3(off2, baseY + 0.075, frontZ), 'headstone');
        place(group, new THREE.Mesh(smoothGeo(lw - 0.02, 0.2, 0.1, 0.005), glassMat(0x223344, 0.3)), new THREE.Vector3(off2, baseY + 0.25, frontZ), 'headstone');
        break;
      }
      default: break;
    }
  });
}

// Try to use a GLB model for a component. Returns true if a model was placed.
function tryGlbComponent({ group, glbModels, componentType, optionId, stone, y, textureUrl }) {
  if (!glbModels) return false;
  const modelData = glbModels.get(`${componentType}:${optionId}`) || glbModels.get(optionId);
  if (!modelData || !modelData.file_url) return false;

  const cloned = cloneGlbModel(modelData.file_url);
  if (!cloned) return false; // model not cached yet — will render on next pass

  // Apply stone material unless the model should keep its original materials
  if (!modelData.keep_original_material) {
    const mat = stoneMat(stone, textureUrl);
    applyMaterialToModel(cloned, mat, false);
  }

  // Apply transform from the model record
  transformModel(
    cloned,
    modelData.scale || 1,
    modelData.offset_x || 0,
    y + (modelData.offset_y || 0),
    modelData.offset_z || 0,
    modelData.rotation_y || 0
  );

  // Tag for explode animation
  cloned.userData.rest = cloned.position.clone();
  cloned.userData.explodeOffset = new THREE.Vector3(0, STEP_LIFT[componentType] || 0, 0);
  group.add(cloned);
  return true;
}

export function buildTombstone(design, glbModels = null) {
  const group = new THREE.Group();
  const bodyStone = resolveStone(design);
  const panelStone = resolveStoneForPart(design, 'panelStone');
  const frameStone = resolveStoneForPart(design, 'frameStone');
  const slabStone = resolveStoneForPart(design, 'slabStone');
  const hsStone = resolveStoneForPart(design, 'headstoneStone');
  const tt = TOMBSTONE_TYPES.find((t) => t.id === design.tombstoneType) || TOMBSTONE_TYPES[1];
  const isSmall = tt.id === 'small';
  // Realistic grave proportions: 180cm length × 80cm width (ratio 2.25:1).
  // Family/double tombs are wider to span multiple graves side by side.
  const defaultW = 0.75;
  const defaultL = isSmall ? 0.9 : (tt.id === 'family' || tt.id === 'reopen_family') ? 1.8 : 1.7;
  const W = design.panelWidthCm ? design.panelWidthCm / 100 : defaultW;
  const L = design.panelLengthCm ? design.panelLengthCm / 100 : defaultL;

  const frameDef = FRAMES.find((f) => f.id === design.frame) || FRAMES[0];
  const slabDef = SLABS.find((s) => s.id === design.slab) || SLABS[0];
  const hsDef = HEADSTONE_TOPS.find((h) => h.id === design.headstoneTop) || HEADSTONE_TOPS[0];

  const ctx = { W, L, group };
  // Effective slab dimensions (for inset panels that need to be 2cm smaller than the slab)
  const slabW = design.slabWidthCm ? design.slabWidthCm / 100 : W;
  const slabL = design.slabLengthCm ? design.slabLengthCm / 100 : L;
  let y = 0;
  let decalInfo = null;
  let slabTopY = 0;

  // Panel layers — support multiple stacked panels (e.g., flooring + panel 10 + raise 5 black).
  // Layers stack from bottom to top in selection order.
  const panelLayers = Array.isArray(design.panel) ? design.panel : [design.panel];
  // The top panel layer is built 2cm smaller than the slab above it — but only while the slab
  // keeps its automatic dimensions. Once slab dimensions are set by hand, every layer keeps its
  // own size so the cover plate can be resized on its own.
  const slabDimsCustom = !!(design.slabWidthCm || design.slabLengthCm || design.slabHeightCm);
  for (let li = 0; li < panelLayers.length; li++) {
    const panelId = panelLayers[li];
    const pDef = PANELS.find((p) => p.id === panelId) || PANELS[0];
    const isLast = li === panelLayers.length - 1;
    const ch = isLast && design.panelHeightCm ? design.panelHeightCm / 100 : null;
    let panelGlbUsed = tryGlbComponent({ group, glbModels, componentType: 'panel', optionId: panelId, stone: panelStone, y, textureUrl: design.panelTextureUrl });
    if (!panelGlbUsed) {
      y = buildPanel({ ...ctx, y, stone: panelStone, def: pDef, textureUrl: design.panelTextureUrl, customHeight: ch, slabW, slabL, forceInsetCm: isLast && !slabDimsCustom ? 2 : 0 }).topY;
    } else {
      y += pDef.height || 0.15;
    }
  }

  // Frame layers — support multiple stacked frames (e.g., raise + frame)
  const frameLayers = Array.isArray(design.frame) ? design.frame : [design.frame];
  for (let fi = 0; fi < frameLayers.length; fi++) {
    const frameId = frameLayers[fi];
    const fDef = FRAMES.find((f) => f.id === frameId) || FRAMES[0];
    const isLast = fi === frameLayers.length - 1;
    const fh = isLast && design.frameHeightCm ? design.frameHeightCm / 100 : null;
    let frameGlbUsed = tryGlbComponent({ group, glbModels, componentType: 'frame', optionId: frameId, stone: frameStone, y, textureUrl: design.frameTextureUrl });
    if (!frameGlbUsed) {
      y = buildFrame({ ...ctx, y, stone: frameStone, def: fDef, textureUrl: design.frameTextureUrl, customHeight: fh, customW: design.frameWidthCm ? design.frameWidthCm / 100 : null, customL: design.frameLengthCm ? design.frameLengthCm / 100 : null }).topY;
    } else {
      y += fDef.height || 0.25;
    }
  }

  // Slab layers — support multiple stacked slabs
  const slabLayers = Array.isArray(design.slab) ? design.slab : [design.slab];
  for (let si = 0; si < slabLayers.length; si++) {
    const slabId = slabLayers[si];
    const sDef = SLABS.find((s) => s.id === slabId) || SLABS[0];
    const isLast = si === slabLayers.length - 1;
    const sh = isLast && design.slabHeightCm ? design.slabHeightCm / 100 : null;
    let slabGlbUsed = tryGlbComponent({ group, glbModels, componentType: 'slab', optionId: slabId, stone: slabStone, y, textureUrl: design.slabTextureUrl });
    if (!slabGlbUsed) {
      y = buildSlab({ ...ctx, y, stone: slabStone, def: sDef, textureUrl: design.slabTextureUrl, customHeight: sh, customW: design.slabWidthCm ? design.slabWidthCm / 100 : null, customL: design.slabLengthCm ? design.slabLengthCm / 100 : null }).topY;
    } else {
      y += sDef.height || 0.1;
    }
  }
  slabTopY = y;

  // Headstone layers — support multiple headstones placed side by side
  const hsLayers = Array.isArray(design.headstoneTop) ? design.headstoneTop : [design.headstoneTop];
  let hsRes;
  if (hsLayers.length === 1) {
    let hsGlbUsed = false;
    if (design.headstonePlacement !== 'sides') {
      hsGlbUsed = tryGlbComponent({ group, glbModels, componentType: 'headstone', optionId: hsLayers[0], stone: hsStone, y, textureUrl: design.headstoneTextureUrl });
    }
    if (!hsGlbUsed) {
      hsRes = buildHeadstone({ ...ctx, y, stone: hsStone, def: hsDef, placement: design.headstonePlacement, textureUrl: design.headstoneTextureUrl, scale: design.headstoneScale || 1, thickness: design.headstoneThickness || 1, offsetX: design.headstoneOffsetX || 0, offsetZ: design.headstoneOffsetZ || 0, customW: design.headstoneWidthCm ? design.headstoneWidthCm / 100 : null, customH: design.headstoneHeightCm ? design.headstoneHeightCm / 100 : null, customD: design.headstoneThicknessCm ? design.headstoneThicknessCm / 100 : null });
      y = hsRes.topY;
      if (hsRes.decal) decalInfo = hsRes.decal;
    } else {
      y += 0.85 * (design.headstoneScale || 1);
      hsRes = { topY: y, decal: null };
    }
  } else if (design.headstonePlacement === 'lying') {
    // Multiple headstones lying flat: spread them across the slab surface
    const spacing = W / hsLayers.length;
    hsRes = { topY: y, decal: null };
    for (let hi = 0; hi < hsLayers.length; hi++) {
      const hsId = hsLayers[hi];
      const hDef = HEADSTONE_TOPS.find((h) => h.id === hsId) || HEADSTONE_TOPS[0];
      const xOff = (hi - (hsLayers.length - 1) / 2) * spacing * 0.7;
      const res = buildHeadstoneLying({ ...ctx, y, stone: hsStone, def: hDef, textureUrl: design.headstoneTextureUrl, scale: design.headstoneScale || 1, thickness: design.headstoneThickness || 1, offsetX: xOff, offsetZ: 0, customW: design.headstoneWidthCm ? design.headstoneWidthCm / 100 : null, customH: design.headstoneHeightCm ? design.headstoneHeightCm / 100 : null, customD: design.headstoneThicknessCm ? design.headstoneThicknessCm / 100 : null });
      if (res.topY > y) y = res.topY;
      if (hi === 0 && res.decal) decalInfo = res.decal;
    }
  } else {
    // Multiple headstones: spread them across the back
    const spacing = W / hsLayers.length;
    hsRes = { topY: y, decal: null };
    for (let hi = 0; hi < hsLayers.length; hi++) {
      const hsId = hsLayers[hi];
      const hDef = HEADSTONE_TOPS.find((h) => h.id === hsId) || HEADSTONE_TOPS[0];
      const xOff = (hi - (hsLayers.length - 1) / 2) * spacing * 0.7;
      const res = buildHeadstoneOne({ ...ctx, y, stone: hsStone, def: hDef, xOff, zOff: 0, textureUrl: design.headstoneTextureUrl, scale: design.headstoneScale || 1, thickness: design.headstoneThickness || 1, customW: design.headstoneWidthCm ? design.headstoneWidthCm / 100 : null, customH: design.headstoneHeightCm ? design.headstoneHeightCm / 100 : null, customD: design.headstoneThicknessCm ? design.headstoneThicknessCm / 100 : null });
      if (res.topY > y) y = res.topY;
      if (hi === 0 && res.decal) decalInfo = res.decal;
    }
  }

  // Top of the headstone — used to size and mount the candle housing on its back face
  const headstoneTopY = y;

  // Accessories sit on the slab surface, not at headstone height
  buildAccessories({ ...ctx, y: slabTopY, stone: bodyStone, accessories: design.accessories, accessoryPositions: design.accessoryPositions });

  // Memorial candle housing ("בית נר")
  if (design.nerHouse) {
    const nerSize = design.nerHouseSize || 'medium';
    const nerStyle = design.nerHouseStyle || 'arched';
    const nerX = design.nerHouseOffsetX || 0;
    const nerZ = design.nerHouseOffsetZ || 0;
    if (design.nerHouse === 'front') {
      // Free-standing candle house on the slab
      const ner = buildNerHouse(nerSize, nerStyle);
      ner.position.set(nerX, slabTopY, L * 0.30 + nerZ);
      ner.children.forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
      group.add(ner);
    } else if (design.headstonePlacement === 'lying') {
      // Headstone lies flat on the slab — the candle house stands on the slab behind it
      const ner = buildNerHouse(nerSize, nerStyle);
      const fp = getNerHouseFootprint(nerSize, nerStyle);
      const lyingLen = design.headstoneHeightCm ? design.headstoneHeightCm / 100 : W * 0.45;
      ner.position.set(nerX, slabTopY, -(L * 0.05) - lyingLen / 2 - fp.d / 2 - 0.02 + nerZ);
      ner.children.forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
      group.add(ner);
    } else {
      // Behind the headstone — the housing is mounted flat on the headstone's back face
      const hsRise = Math.max(0.2, headstoneTopY - slabTopY);
      const housing = buildMountedCandleHousing(Math.min(0.30, Math.max(0.18, hsRise * 0.5)));
      housing.rotation.y = Math.PI; // door faces away from the headstone, into the rear
      const backZ = -L * 0.47 + (design.headstoneOffsetZ || 0);
      housing.position.set(nerX, slabTopY + Math.max(0.04, hsRise * 0.16), backZ - 0.001);
      housing.children.forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
      group.add(housing);
    }
  }

  // Custom element billboard (prompt-to-image) — positioned as engraving on headstone face
  if (design.customImageUrl) {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(design.customImageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    const rearZ = -L * 0.38;
    const hsD = 0.16;
    const hsH = y - slabTopY;
    const bbW = Math.min(W * 0.6, hsH * 0.7);
    const bbH = bbW * 0.75;
    const bbMat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.6,
      metalness: 0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const bb = new THREE.Mesh(new THREE.PlaneGeometry(bbW, bbH), bbMat);
    place(group, bb, new THREE.Vector3(0, slabTopY + hsH * 0.5, rearZ + hsD / 2 + 0.003), 'headstone');
  }

  if (decalInfo && design.engravingText) {
    const lettering = LETTERING_TYPES.find((l) => l.id === design.letteringType) || LETTERING_TYPES[0];
    const textTex = makeTextTexture(design.engravingText, lettering.style, bodyStone, 1024, design.headstoneTextScale || 1);
    const isDarkStone = bodyStone.color && new THREE.Color(bodyStone.color).r < 0.2;
    const textMat = new THREE.MeshStandardMaterial({
      map: textTex,
      transparent: true,
      alphaTest: 0.01,
      roughness: isDarkStone ? 0.35 : bodyStone.roughness,
      metalness: lettering.style === 'bronze' ? 0.92 : isDarkStone ? 0.15 : 0,
      emissive: isDarkStone ? new THREE.Color(0x222222) : new THREE.Color(0x000000),
      emissiveMap: textTex,
      emissiveIntensity: isDarkStone ? 0.45 : 0,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    group.updateMatrixWorld(true);
    const helper = new THREE.Object3D();
    helper.position.copy(decalInfo.pos);
    // Object3D.lookAt aims local +Z AT the target, while the decal projector needs +Z
    // pointing away from the surface (camera convention) — aim the opposite way,
    // otherwise the projector's X axis flips and the engraving comes out mirrored.
    helper.lookAt(new THREE.Vector3().copy(decalInfo.pos).multiplyScalar(2).sub(decalInfo.look));
    helper.updateMatrixWorld();
    const decalGeo = new DecalGeometry(decalInfo.mesh, decalInfo.pos, helper.rotation, decalInfo.size);
    place(group, new THREE.Mesh(decalGeo, textMat), new THREE.Vector3(0, 0, 0), 'headstone');
  }

  // Slab text: flat text plane on the horizontal slab surface
  if (design.slabText) {
    const lettering = LETTERING_TYPES.find((l) => l.id === design.letteringType) || LETTERING_TYPES[0];
    // Divided slabs (split channel, garden, glass divider) → text on right half only
    const DIVIDED_GEOMS = ['slab_split_pebbles', 'slab_split_straight', 'slab_garden', 'slab_garden_inner', 'slab_glass_divider'];
    const isDivided = DIVIDED_GEOMS.includes(slabDef.geom);
    const slabTex = isDivided
      ? makeTextTexture(design.slabText, lettering.style, slabStone, 512)
      : makeTextTexture(design.slabText, lettering.style, slabStone);
    const isDarkSlab = slabStone.color && new THREE.Color(slabStone.color).r < 0.2;
    const slabTextMat = new THREE.MeshStandardMaterial({
      map: slabTex,
      transparent: true,
      alphaTest: 0.01,
      roughness: isDarkSlab ? 0.35 : slabStone.roughness,
      metalness: lettering.style === 'bronze' ? 0.92 : isDarkSlab ? 0.15 : 0,
      emissive: isDarkSlab ? new THREE.Color(0x222222) : new THREE.Color(0x000000),
      emissiveMap: slabTex,
      emissiveIntensity: isDarkSlab ? 0.45 : 0,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    let slabTextW, slabTextX;
    if (isDivided) {
      const halfW = (W * 0.96 - 0.18) / 2;
      slabTextW = halfW * 0.82;
      slabTextX = 0.09 + halfW / 2;
    } else {
      slabTextW = W * 0.82;
      slabTextX = 0;
    }
    const slabTextH = L * 0.72;
    const slabTextGeo = new THREE.PlaneGeometry(slabTextW, slabTextH);
    const slabTextMesh = new THREE.Mesh(slabTextGeo, slabTextMat);
    slabTextMesh.rotation.x = -Math.PI / 2;
    // Place on top of slab, slightly in front of the headstone
    place(group, slabTextMesh, new THREE.Vector3(slabTextX, slabTopY + 0.003, L * 0.08), 'slab');
  }

  return group;
}

export function disposeGroup(group) {
  const seen = new Set();
  group.traverse((obj) => {
    if (obj.geometry && !seen.has(obj.geometry)) { seen.add(obj.geometry); obj.geometry.dispose(); }
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    }
  });
}