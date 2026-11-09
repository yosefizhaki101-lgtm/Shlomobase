import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { makeStoneTextures } from '@/lib/stoneTextures';
import { getPolishedReflectionEnv } from '@/lib/cemeteryEnvironment';
import { makeTextTexture } from '@/lib/tombstoneText';
import { buildNerHouse, getNerHouseFootprint, buildMountedCandleHousing } from '@/lib/nerHouseGeometry';
import { buildSpeckledVase, buildTulipVase, buildCandleHouse } from '@/lib/accessoryModels';
import { cloneGlbModel, applyMaterialToModel, transformModel } from '@/lib/glbModelCache';
import {
  STONE_TYPES,
  TOMBSTONE_TYPES,
  TOMBSTONE_DIMENSIONS,
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

// World-space projection, decided PER TRIANGLE: each triangle picks its projection
// axis from its own geometric face normal, so the three vertices of a triangle never
// disagree about the axis. That keeps the grain at one real-world scale on every face
// (top, front, sides) with no stretching, and removes the diagonal crease/stretch that
// appears when neighbouring vertices of the same triangle pick different axes.
function applyFaceUV(geo, metersPerRepeat = 1.75, seed = 1) {
  const pos = geo && geo.attributes && geo.attributes.position;
  if (!pos) return;
  const index = geo.index;
  const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
  const uv = new Float32Array(pos.count * 2);
  const rnd = (n) => {
    const s = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  const offU = rnd(2) * 10, offV = rnd(3) * 10;
  const scale = 1 / metersPerRepeat;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), nrm = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    nrm.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    const ax = Math.abs(nrm.x), ay = Math.abs(nrm.y), az = Math.abs(nrm.z);
    const useTop = ay >= ax && ay >= az;
    const useSide = !useTop && ax >= az;
    const verts = [[i0, a], [i1, b], [i2, c]];
    for (let k = 0; k < 3; k++) {
      const vi = verts[k][0], p = verts[k][1];
      let u, v;
      if (useTop) { u = p.x; v = p.z; }        // top / bottom faces
      else if (useSide) { u = p.z; v = p.y; }  // side faces
      else { u = p.x; v = p.y; }               // front / back faces
      uv[vi * 2] = u * scale + offU;
      uv[vi * 2 + 1] = v * scale + offV;
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.userData.boxUV = true;
}

// מיפוי טריפלנרי במרחב העולם + הפרדת עומק:
// 1. הטקסטורה נדגמת לפי קואורדינטות אמיתיות במטרים של כל פאה — אנכית או אופקית —
//    כך שאף ציר לא נמתח ושום פאה לא נראית מרוחה.
// 2. פאות אנכיות (צדי הפלטה, המדרגות והבסיס) כהות ב-7% מהמשטח העליון,
//    כדי שכל אבן תיקרא כגוף נפרד ולא כמשטח אחד שטוח.
function addStoneShader(mat) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTexScale = { value: 1 / (mat.userData.uvMeter || 1.75) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vSideShade;\nvarying vec3 vWPos;\nvarying vec3 vWNrm;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        // Safe normalize: a zero-length normal must not put NaN into a varying —
        // that would paint whole triangles with garbage colours.
        float nLen = length(objectNormal);
        vSideShade = 0.93 + 0.07 * (nLen > 0.0001 ? abs(objectNormal.y / nLen) : 0.0);`
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vec3 wN = mat3(modelMatrix) * objectNormal;
        float wLen = length(wN);
        vWNrm = wLen > 0.0001 ? wN / wLen : vec3(0.0, 1.0, 0.0);`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vSideShade;\nvarying vec3 vWPos;\nvarying vec3 vWNrm;\nuniform float uTexScale;'
      )
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
        vec3 tN = vWNrm;
        float tLen = length(tN);
        tN = tLen > 0.0001 ? tN / tLen : vec3(0.0, 1.0, 0.0);
        vec3 tw = pow(abs(tN), vec3(5.0));
        float tSum = tw.x + tw.y + tw.z;
        tw = tSum > 0.0001 ? tw / tSum : vec3(0.0, 1.0, 0.0);
        vec3 tp = vWPos * uTexScale;
        diffuseColor *= texture2D(map, tp.zy) * tw.x
                      + texture2D(map, tp.xz) * tw.y
                      + texture2D(map, tp.xy) * tw.z;
        #endif`
      )
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vSideShade;');
  };
  mat.customProgramCacheKey = () => 'stoneTriplanar';
  return mat;
}

// Stone photo texture, neutralised and lightened: the warm cast is removed so no
// orange-brown patches appear on edges, and the contrast is compressed toward white
// so the veins read thin and fine on light, uniform Turkish marble.
const STONE_MAP_CACHE = new Map();
function getStoneMap(url) {
  let entry = STONE_MAP_CACHE.get(url);
  if (entry) return entry.tex;
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 4;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // אריח חוזר (ללא שיקוף) — כיוון העורקים נשאר זהה על כל פאה
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  STONE_MAP_CACHE.set(url, { tex });

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // חיתוך שוליים: פיקסלים כהים בקצה התמונה היו נמשכים לאורך הפאות כפסים כהים.
    const inset = 0.04;
    const sx = img.width * inset;
    const sy = img.height * inset;
    const sw = Math.max(2, img.width * (1 - inset * 2));
    const sh = Math.max(2, img.height * (1 - inset * 2));
    cv.width = Math.round(sw);
    cv.height = Math.round(sh);
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    try {
      const data = ctx.getImageData(0, 0, cv.width, cv.height);
      const px = data.data;
      const lums = new Float32Array(px.length / 4);
      const hist = new Uint32Array(256);
      for (let i = 0, p = 0; i < px.length; i += 4, p++) {
        const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        lums[p] = lum;
        hist[Math.min(255, Math.max(0, Math.round(lum)))]++;
      }
      // נרמול אדפטיבי: הבסיס הבהיר נקבע לפי האחוזון הגבוה, העורקים לפי האחוזון הנמוך —
      // כך העורקים תמיד אפורים ונראים בבירור (כ-35% כהים מהבסיס) ולא נעלמים על רקע לבן.
      const total = lums.length;
      const pick = (q) => {
        let acc = 0;
        for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * q) return v; }
        return 255;
      };
      const dark = pick(0.02);   // גוון העורק
      const light = pick(0.97);  // גוון הבסיס
      const BASE = 236, VEIN = 165; // אפור בינוני — לא כמעט־שחור
      const range = Math.max(12, light - dark);
      for (let i = 0, p = 0; i < px.length; i += 4, p++) {
        // עקומה שמחזירה את גוני הביניים לבסיס ומשאירה רק ליבות עורק דקות
        const n = Math.max(0, Math.min(1, (light - lums[p]) / range));
        const out = BASE - Math.pow(n, 1.45) * (BASE - VEIN);
        px[i] = Math.max(0, out - 2);
        px[i + 1] = out;
        px[i + 2] = Math.min(255, out + 3);
      }
      ctx.putImageData(data, 0, 0);
    } catch { /* canvas tainted — the untinted photo is still drawn */ }
    tex.needsUpdate = true;
  };
  img.src = url;
  return tex;
}

// Ornament artwork (line-art on white) drawn as an engraving: multiply blending
// lets the white background disappear and the carved lines darken the stone.
// Ornament artwork arrives as line-art on a white sheet. For engraving we throw the sheet
// away: every near-white pixel becomes fully transparent and only the ink lines survive, so
// the stone receives the etched drawing alone — no rectangular plate around it.
const ORNAMENT_TEX_CACHE = new Map();
const ORNAMENT_SIZE = 1024;

function ornamentInkCanvas(img) {
  const size = ORNAMENT_SIZE;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d');
  const scale = Math.min(size / img.width, size / img.height);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  let imageData;
  try {
    imageData = ctx.getImageData(0, 0, size, size);
  } catch {
    return null; // canvas tainted by a cross-origin image — no background removal possible
  }
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 8) { px[i + 3] = 0; continue; }
    const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    // 0 on the white sheet, 1 on solid ink
    const ink = Math.max(0, Math.min(1, (0.94 - lum) / 0.7));
    px[i] = 32;
    px[i + 1] = 29;
    px[i + 2] = 26;
    px[i + 3] = Math.round(Math.min(1, ink * 1.35) * 255); // punchy lines, clean sheet
  }
  ctx.putImageData(imageData, 0, 0);
  return cv;
}

function loadOrnamentImage(url) {
  // fetch keeps the bytes same-origin-safe, so the canvas stays readable
  return fetch(url, { mode: 'cors' })
    .then((r) => r.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    }))
    .catch(() => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    }));
}

function ornamentTexture(url) {
  let entry = ORNAMENT_TEX_CACHE.get(url);
  if (entry) return entry.tex;
  const cv = document.createElement('canvas');
  cv.width = ORNAMENT_SIZE;
  cv.height = ORNAMENT_SIZE;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  ORNAMENT_TEX_CACHE.set(url, { tex, canvas: cv });

  loadOrnamentImage(url)
    .then((img) => {
      const inked = ornamentInkCanvas(img);
      if (!inked) return;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(inked, 0, 0);
      tex.needsUpdate = true;
    })
    .catch(() => { /* unreachable artwork — the stone stays plain */ });

  return tex;
}

// פרסטים של גימור — ברק, חספוס והחזר אור של אותו חומר אבן
const FINISH_PRESETS = {
  matte:  { roughness: 0.86, clearcoat: 0,   clearcoatRoughness: 0.6,  metalness: 0.02, envMapIntensity: 0.7,  normal: 1.8 },
  silk:   { roughness: 0.34, clearcoat: 0.45, clearcoatRoughness: 0.3, metalness: 0.04, envMapIntensity: 1.5,  normal: 0.8 },
  polish: { roughness: 0.04, clearcoat: 1,   clearcoatRoughness: 0.02, metalness: 0.03, envMapIntensity: 2.6,  normal: 0.15, reflection: true },
};

// Applies a finish on top of the stone's own material: same colour and texture,
// different gloss. "natural" keeps whatever the stone type defines.
function withFinish(mat, stone) {
  const finish = stone.finish;
  if (!finish || finish === 'natural') return mat;
  const rockEdges = finish === 'polish_rock_edges';
  const p = FINISH_PRESETS[rockEdges ? 'polish' : finish];
  if (!p) return mat;

  const baseNormal = mat.normalScale ? mat.normalScale.x : 0.5;
  mat.roughness = p.roughness;
  if (mat.roughnessMap) mat.roughnessMap = null; // גימור אחיד — בלי מפת חספוס שמושכת למט
  mat.metalness = p.metalness;
  mat.envMapIntensity = p.envMapIntensity;
  if (mat.isMeshPhysicalMaterial) {
    mat.clearcoat = p.clearcoat;
    mat.clearcoatRoughness = p.clearcoatRoughness;
  }
  if (mat.normalScale) mat.normalScale.set(baseNormal * p.normal, baseNormal * p.normal);
  if (p.reflection) mat.envMap = getPolishedReflectionEnv();

  if (rockEdges) {
    // אותה אבן, אבל צדדים מחוספסים בסיתות — המשטח העליון והחזית נשארים מלוטשים.
    const rockMat = new THREE.MeshStandardMaterial({
      color: mat.color ? mat.color.clone() : new THREE.Color(stone.color || '#ffffff'),
      map: mat.map || null,
      normalMap: mat.normalMap || null,
      normalScale: new THREE.Vector2(baseNormal * 3.5, baseNormal * 3.5),
      roughness: 0.95,
      metalness: 0,
      envMapIntensity: 0.6,
    });
    mat.userData.rockSideMat = rockMat;
    mat.userData.polishFaces = [2, 4]; // +Y משטח עליון, +Z חזית
  }
  mat.needsUpdate = true;
  return mat;
}

// ---------------------------------------------------------------------------
// גרניט סרדו — חומר אחד, משותף לכל המצבה.
// נבנה מאפס: MeshStandardMaterial פשוט עם צילום האבן בלבד, בלי שיידר מותאם,
// בלי מפות לכל חלק ובלי גוון. כל משושה במצבה מקבל את אותו מופע בדיוק.
// ---------------------------------------------------------------------------
let SARDO_MATERIAL = null;

function sardoStone() {
  return STONE_TYPES.find((s) => s.id === 'sardo');
}

function isSardoGranite(stone) {
  return !!stone && stone.id === 'sardo';
}

export function getSardoGraniteMaterial() {
  if (SARDO_MATERIAL) return SARDO_MATERIAL;
  const stone = sardoStone();
  const tex = new THREE.TextureLoader().load(stone.textureUrl, (loaded) => {
    // הטקסטורה נטענה — מבטלים את גוון הביניים כדי שלא יהיה שום טינט על האבן.
    if (SARDO_MATERIAL) {
      SARDO_MATERIAL.color.set('#ffffff');
      SARDO_MATERIAL.needsUpdate = true;
    }
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.needsUpdate = true;
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;

  const mat = new THREE.MeshStandardMaterial({
    // גוון ביניים אפור עד שהתמונה נטענת — אף פעם לא צבע זר על פאה.
    color: new THREE.Color('#b9bcbe'),
    map: tex,
    roughness: 0.4,
    metalness: 0,
    envMapIntensity: 0.35,
  });
  mat.userData.isStoneMaterial = true;
  mat.userData.sardo = true;
  // מיפוי במרחב העולם: כל משולש מקבל את ההיטל שלו לפי הנורמל שלו (ראו applyFaceUV)
  mat.userData.boxUV = true;
  mat.userData.uvMeter = 0.9;
  SARDO_MATERIAL = mat;
  return mat;
}

function stoneMat(stone, textureUrl) {
  // סרדו: אותו מופע חומר בדיוק לכל חלק — בלי גימור, בלי טקסטורה לכל חלק ובלי גוון.
  if (isSardoGranite(stone)) return getSardoGraniteMaterial();
  const mat = withFinish(baseStoneMat(stone, textureUrl), stone);
  mat.userData.isStoneMaterial = true;
  return mat;
}

function baseStoneMat(stone, textureUrl) {
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
  // Actual photo texture assigned to the stone type — used as the diffuse map (no flat colour),
  // with the procedural map supplying only a subtle bump so the surface has real depth.
  if (stone.textureUrl) {
    const nKey = `normal:${stone.kind}:${stone.color}`;
    let nTex = TEX_CACHE.get(nKey);
    if (!nTex) {
      nTex = makeStoneTextures(stone.kind, stone.color);
      TEX_CACHE.set(nKey, nTex);
    }
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      map: getStoneMap(stone.textureUrl),
      normalMap: nTex.normalMap,
      normalScale: new THREE.Vector2(nTex.nStr * 0.45, nTex.nStr * 0.45),
      roughness: stone.roughness ?? 0.25,
      metalness: stone.metalness ?? 0.01,
      envMapIntensity: stone.envMapIntensity ?? 0.7,
    });
    // כל פאה של כל חלק — אותה טקסטורה ובאותו קנה מידה (חזרה אחת ≈ מטר אבן)
    mat.userData.boxUV = true;
    mat.userData.uvMeter = 1.75;
    return addStoneShader(mat);
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
      // Absolute Black granite: a deep, saturated black body. The gloss is a thin
      // glassy clearcoat, so reflections sit on top of the black instead of greying it out.
      color: new THREE.Color(stone.color || '#000000'),
      map: t.map,
      // Mirror polish: the micro-surface must stay glassy, otherwise the stone reads matte
      normalMap: t.normalMap,
      normalScale: new THREE.Vector2(t.nStr * 0.12, t.nStr * 0.12),
      roughness: 0.008,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.012,
      // Just enough environment to read as polished — sharp glints and bright edges,
      // never a wash of light over the face
      envMap: getPolishedReflectionEnv(),
      envMapIntensity: 0.45,
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
      envMapIntensity: stone.envMapIntensity ?? 2.5,
      sheen: 0.4,
      sheenColor: new THREE.Color(stone.sheenColor || 0xfff5e8),
    });
  }
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: t.map,
    normalMap: t.normalMap,
    normalScale: new THREE.Vector2(t.nStr * 2.5, t.nStr * 2.5),
    roughnessMap: t.roughnessMap,
    roughness: stone.roughness,
    metalness: stone.metalness || 0,
    envMapIntensity: stone.envMapIntensity ?? 1.5,
  });
  // חלילה וחברון: מיפוי בקופסה וטריפלנרי במרחב העולם — קנה מידה אמיתי על כל פאה,
  // כך הסיתות לא נמתח לפסים רחבים על צדי הקומות.
  if (stone.kind === 'halila' || stone.kind === 'hebron') {
    mat.userData.boxUV = true;
    mat.userData.uvMeter = 1.75;
    return addStoneShader(mat);
  }
  return mat;
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
  const finish = design.finish || null;
  if (design.colorOverride) {
    return { ...stone, color: design.colorOverride, finish };
  }
  return { ...stone, finish };
}

function resolveStoneForPart(design, field) {
  const stoneId = design[field] || design.stoneType;
  const stone = STONE_TYPES.find((s) => s.id === stoneId) || STONE_TYPES[0];
  const colorField = field ? field.replace('Stone', 'Color') : null;
  const partColor = colorField ? design[colorField] : null;
  const finishField = field ? field.replace('Stone', 'Finish') : null;
  const finish = (finishField ? design[finishField] : null) || design.finish || null;
  if (partColor) {
    return { ...stone, color: partColor, finish };
  }
  if (design.colorOverride) {
    return { ...stone, color: design.colorOverride, finish };
  }
  return { ...stone, finish };
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

// Removes invalid (NaN/Infinity) values from a geometry's UVs and normals. A single
// broken value would corrupt every triangle that touches that vertex and show up as a
// random-coloured patch instead of stone, so bad normals are recomputed and bad UVs
// fall back to a neutral coordinate.
function sanitizeGeometry(geo) {
  if (!geo || !geo.attributes) return;
  const bad = (attr) => {
    if (!attr) return false;
    const a = attr.array;
    for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) return true;
    return false;
  };
  if (bad(geo.attributes.uv)) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.array.length; i++) if (!Number.isFinite(uv.array[i])) uv.array[i] = 0;
    uv.needsUpdate = true;
  }
  if (bad(geo.attributes.normal)) {
    geo.computeVertexNormals();
  }
}

// מחיל את חומר הגרניט המשותף על כל משושה אבן במצבה — אבן ראש, פלטה, קומה,
// בסיס, מדרגות, פינות וקצוות והמסגרת המסותתת. כל משושה מקבל את אותו מופע חומר,
// וכל גיאומטריה מקבלת מיפוי במרחב העולם (UV פר משולש) — בלי טקסטורה חסרה ובלי שיידר.
function applySharedGraniteMaterial(group, shared) {
  group.traverse((obj) => {
    if (!obj.isMesh || !obj.material || !obj.geometry) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const isStone = mats.some((m) => m && m.userData && m.userData.isStoneMaterial);
    if (!isStone) return;
    if (!obj.geometry.userData.boxUV) applyFaceUV(obj.geometry, shared.userData.uvMeter || 0.9, 1);
    sanitizeGeometry(obj.geometry);
    obj.material = shared;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
}

const STEP_LIFT = { panel: 0, frame: 0.4, slab: 0.85, headstone: 1.25 };

function place(group, mesh, pos, stepKey) {
  // אבן עם טקסטורה אמיתית: מיפוי UV בקופסה כדי שכל פאה תקבל אותו קנה מידה אמיתי.
  const mapped = Array.isArray(mesh.material)
    ? mesh.material.find((m) => m && m.userData && m.userData.boxUV)
    : (mesh.material && mesh.material.userData?.boxUV ? mesh.material : null);
  if (mapped && mesh.geometry && !mesh.geometry.userData.boxUV) {
    // זרע קבוע לכל חלק (לפי מיקומו וסוג החלק) — ההיסט לא משתנה בין רינדורים
    const seed = Math.abs(pos.x * 37.1 + pos.y * 71.3 + pos.z * 13.7) + (STEP_LIFT[stepKey] || 0) * 5.1 + 1;
    applyFaceUV(mesh.geometry, mapped.userData.uvMeter || 1.75, seed);
  }
  // הגנה מפני UV/נורמל פגומים (NaN) — אחרת הפאה מקבלת טקסטורה "זבל" בצבעים.
  sanitizeGeometry(mesh.geometry);
  // גימור "מבריק + צדדים מחוספסים": פאות הצד מקבלות חומר גס, המשטח העליון והחזית נשארים מלוטשים.
  const sideMat = mesh.material && !Array.isArray(mesh.material) ? mesh.material.userData?.rockSideMat : null;
  if (sideMat && mesh.geometry?.groups?.length >= 6) {
    const polished = mesh.material.userData.polishFaces || [2, 4];
    const base = mesh.material;
    mesh.material = mesh.geometry.groups.map((_, i) => (polished.includes(i) ? base : sideMat));
  }
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
  // כיפת המסגרת מקבלת את אותו חומר וטקסטורה כמו שאר החלקים — בלי צבע אחיד שנשאר "לבן שטוח".
  const capMat = useRock ? stoneMat(resolvedStone, textureUrl) : null;

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

  return { topY: y + wallH + (capMat ? capH : 0) };
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
      const body = new THREE.Mesh(sharpGeo(hsW, hsH, hsD), mat);
      place(group, body, new THREE.Vector3(cx, y + hsH / 2, rearZ), 'headstone');
      // Dome: half-circle extruded along Z — flat side down, curve up
      const dr = hsW / 2;
      const dShape = new THREE.Shape();
      dShape.moveTo(-dr, 0);
      dShape.absarc(0, 0, dr, Math.PI, 0, true);
  dShape.lineTo(-dr, 0);
      const dg = new THREE.ExtrudeGeometry(dShape, { depth: hsD, bevelEnabled: false });
      dg.translate(0, 0, -hsD / 2);
      place(group, new THREE.Mesh(dg, mat), new THREE.Vector3(cx, y + hsH, rearZ), 'headstone');
      return decalResult(y + hsH + 0.15, body, rearZ, hsD, hsW, hsH);
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
      // שני לוחות אבן נפרדים (כמו שני חלקי ספר פתוח) על בסיס אחד — ולא לוח אחיד.
      const hsW = (customW || (W * 0.85 * scale));
      const hsH = (customH || (W * 0.53 * scale));
      const pageD = 0.14 * scale * thickness;
      const pedH = Math.min(0.1, Math.max(0.05, hsH * 0.08));
      const spineW = hsW * 0.035;
      const pageW = (hsW - spineW) / 2;
      const tilt = 0.08;

      // בסיס משותף שמרים את שני הלוחות כגוף אחד
      place(group, new THREE.Mesh(sharpGeo(hsW * 1.02, pedH, pageD * 1.35), mat), new THREE.Vector3(cx, y + pedH / 2, rearZ), 'headstone');
      const bodyY = y + pedH;
      // שדרה מרכזית — סוגרת את המרווח בין הלוחות
      place(group, new THREE.Mesh(sharpGeo(spineW, hsH, pageD), mat), new THREE.Vector3(cx, bodyY + hsH / 2, rearZ), 'headstone');

      const leftX = cx - spineW / 2 - (pageW / 2) * Math.cos(tilt);
      const rightX = cx + spineW / 2 + (pageW / 2) * Math.cos(tilt);
      const pageZ = rearZ + (pageW / 2) * Math.sin(tilt);

      const left = new THREE.Mesh(sharpGeo(pageW, hsH, pageD), mat);
      left.rotation.y = -tilt;
      place(group, left, new THREE.Vector3(leftX, bodyY + hsH / 2, pageZ), 'headstone');
      const right = new THREE.Mesh(sharpGeo(pageW, hsH, pageD), mat);
      right.rotation.y = tilt;
      place(group, right, new THREE.Vector3(rightX, bodyY + hsH / 2, pageZ), 'headstone');

      // הכיתוב נחרט על פני הלוח השמאלי, בגודל שמכסה את מלוא שטחו
      const faceX = leftX - (pageD / 2) * Math.sin(tilt);
      const faceZ = pageZ + (pageD / 2) * Math.cos(tilt);
      const centerY = bodyY + hsH / 2;
      return {
        topY: bodyY + hsH,
        decal: {
          mesh: left,
          pos: new THREE.Vector3(faceX, centerY, faceZ + 0.003),
          look: new THREE.Vector3(faceX, centerY, faceZ - 0.1),
          size: new THREE.Vector3(pageW * 0.92, hsH * 0.9, 0.3),
        },
      };
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
    case 'headstone_marble_inset': {
      // Light stone slab carrying a recessed polished black granite plaque
      const hsW = (customW || (W * 0.85 * scale)), hsH = (customH || (W * 0.67 * scale));
      place(group, new THREE.Mesh(sharpGeo(hsW, hsH, hsD), mat), new THREE.Vector3(cx, y + hsH / 2, rearZ), 'headstone');
      const plaqueStone = STONE_TYPES.find((s) => s.id === 'black_granite') || STONE_TYPES[0];
      const plaqueW = hsW * 0.82, plaqueH = hsH * 0.74;
      const plaqueZ = rearZ + hsD / 2 - 0.012;
      const plaque = new THREE.Mesh(sharpGeo(plaqueW, plaqueH, 0.03), stoneMat(plaqueStone));
      place(group, plaque, new THREE.Vector3(cx, y + hsH * 0.48, plaqueZ), 'headstone');
      return {
        topY: y + hsH,
        decal: {
          mesh: plaque,
          pos: new THREE.Vector3(cx, y + hsH * 0.48, plaqueZ + 0.018),
          look: new THREE.Vector3(cx, y + hsH * 0.48, plaqueZ - 0.2),
          size: new THREE.Vector3(plaqueW * 0.9, plaqueH * 0.9, 0.2),
          stone: plaqueStone,
        },
      };
    }
    case 'headstone_book_pedestal': {
      // Open book standing on a stone pedestal
      const hsW = (customW || (W * 0.8 * scale)), hsH = (customH || (W * 0.62 * scale));
      const pedH = hsH * 0.3;
      const bookH = hsH * 0.7;
      const pageD = 0.06 * scale * thickness;
      place(group, new THREE.Mesh(sharpGeo(hsW * 1.05, pedH, hsD * 1.15), mat), new THREE.Vector3(cx, y + pedH / 2, rearZ), 'headstone');
      const pg = sharpGeo(hsW * 0.5, bookH, pageD);
      const left = new THREE.Mesh(pg, mat);
      left.rotation.y = -0.16;
      place(group, left, new THREE.Vector3(cx - hsW * 0.25, y + pedH + bookH / 2, rearZ), 'headstone');
      const right = new THREE.Mesh(pg.clone(), mat);
      right.rotation.y = 0.16;
      place(group, right, new THREE.Vector3(cx + hsW * 0.25, y + pedH + bookH / 2, rearZ), 'headstone');
      return decalResult(y + pedH + bookH, left, rearZ, pageD, hsW * 0.4, bookH * 0.8);
    }
    case 'headstone_tiered_marble': {
      // Slab with a projecting cornice cap and a matching plinth
      const hsW = (customW || (W * 0.85 * scale)), hsH = (customH || (W * 0.68 * scale));
      const capH = hsH * 0.07;
      const plinthH = hsH * 0.06;
      const bodyH = hsH - capH - plinthH;
      place(group, new THREE.Mesh(sharpGeo(hsW * 1.06, plinthH, hsD * 1.2), mat), new THREE.Vector3(cx, y + plinthH / 2, rearZ), 'headstone');
      const body = new THREE.Mesh(sharpGeo(hsW, bodyH, hsD), mat);
      place(group, body, new THREE.Vector3(cx, y + plinthH + bodyH / 2, rearZ), 'headstone');
      place(group, new THREE.Mesh(sharpGeo(hsW * 1.1, capH, hsD * 1.25), mat), new THREE.Vector3(cx, y + plinthH + bodyH + capH / 2, rearZ), 'headstone');
      return { topY: y + hsH, decal: decalResult(y + plinthH + bodyH, body, rearZ, hsD, hsW * 0.86, bodyH * 0.85).decal };
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
      // Rectangular/slab headstone lying on the slab, with a slight slope that
      // runs down toward the inside of the grave (outer edge stays high).
      const drop = Math.min(0.02, hsLen * 0.06);
      const geo = new THREE.BoxGeometry(hsW, hsThick, hsLen, 1, 1, 6);
      const geoPos = geo.attributes.position;
      const gv = new THREE.Vector3();
      for (let i = 0; i < geoPos.count; i++) {
        gv.fromBufferAttribute(geoPos, i);
        if (gv.y > 0) {
          const t = (gv.z + hsLen / 2) / hsLen; // 0 at the outer edge, 1 toward the inside
          gv.y = hsThick / 2 - drop * t;
        }
        geoPos.setXYZ(i, gv.x, gv.y, gv.z);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat);
      place(group, m, new THREE.Vector3(cx, y + hsThick / 2 + 0.002, centerZ), 'headstone');
      return {
        topY: y + hsThick,
        decal: {
          mesh: m,
          pos: new THREE.Vector3(cx, y + hsThick - drop / 2 + 0.05, centerZ),
          look: new THREE.Vector3(cx, y - 0.05, centerZ),
          size: new THREE.Vector3(hsW * 0.85, hsLen * 0.85, 0.2),
          slope: Math.atan(drop / hsLen),
          surfaceAt: (z) => (y + hsThick) - drop * Math.min(1, Math.max(0, (z - centerZ + hsLen / 2) / hsLen)),
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

// Memorial lantern: stone plinth, bronze frame with glass panels, pitched roof and warm candles.
function buildLantern(group, x, y, z, slots = 1, heightScale = 1) {
  const bronze = plainMat(0x3b3227, 0.34, 0.82);
  const glass = glassMat(0x24304a, 0.2);
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x24242a, roughness: 0.55, metalness: 0.15 });
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffab45, emissiveIntensity: 2.2, roughness: 0.4 });

  const w = 0.11 + slots * 0.045;
  const d = 0.13;
  const bodyH = 0.21 * heightScale;
  const plinthH = 0.028;
  const baseY = y + plinthH;

  // Stone plinth and bronze base plate
  place(group, new THREE.Mesh(sharpGeo(w + 0.05, plinthH, d + 0.05), plinthMat), new THREE.Vector3(x, y + plinthH / 2, z), 'headstone');
  place(group, new THREE.Mesh(sharpGeo(w + 0.016, 0.014, d + 0.016), bronze), new THREE.Vector3(x, baseY + 0.007, z), 'headstone');

  // Glass body with four bronze corner posts
  const bodyBottom = baseY + 0.014;
  place(group, new THREE.Mesh(sharpGeo(w, bodyH, d), glass), new THREE.Vector3(x, bodyBottom + bodyH / 2, z), 'headstone');
  const postT = 0.011;
  const postY = bodyBottom + bodyH / 2;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    place(group, new THREE.Mesh(sharpGeo(postT, bodyH, postT), bronze), new THREE.Vector3(x + sx * (w / 2), postY, z + sz * (d / 2)), 'headstone');
  });

  // Top plate, pitched bronze roof and finial
  const topY = bodyBottom + bodyH;
  place(group, new THREE.Mesh(sharpGeo(w + 0.02, 0.012, d + 0.02), bronze), new THREE.Vector3(x, topY + 0.006, z), 'headstone');
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.56, 0.055, 4), bronze);
  roof.rotation.y = Math.PI / 4;
  place(group, roof, new THREE.Vector3(x, topY + 0.039, z), 'headstone');
  place(group, new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), bronze), new THREE.Vector3(x, topY + 0.073, z), 'headstone');

  // Candles inside the glass
  for (let i = 0; i < slots; i++) {
    const cx = x + (i - (slots - 1) / 2) * (w / (slots + 0.2));
    place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 10), ledMat), new THREE.Vector3(cx, bodyBottom + 0.03, z), 'headstone');
  }
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
    const startIdx = group.children.length;
    switch (accId) {
      case 'candle_1':
      case 'candle_2':
      case 'candle_3': {
        const n = accId === 'candle_1' ? 1 : accId === 'candle_2' ? 2 : 3;
        buildLantern(group, offsetX, baseY, frontZ, n);
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
        buildLantern(group, offsetX, baseY, frontZ, 2, 1.3);
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
        buildLantern(group, offsetX - 0.19, baseY, frontZ, n);
        buildLantern(group, offsetX + 0.19, baseY, frontZ, n);
        break;
      }
      case 'vase_speckled_blue':
      case 'vase_tulip_white': {
        const vase = accId === 'vase_tulip_white' ? buildTulipVase() : buildSpeckledVase();
        vase.position.set(offsetX, baseY, frontZ);
        vase.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        group.add(vase);
        break;
      }
      case 'ner_house_silver':
      case 'ner_house_bronze': {
        const house = buildCandleHouse(accId === 'ner_house_bronze' ? 'bronze' : 'silver');
        house.position.set(offsetX, baseY, frontZ);
        house.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        group.add(house);
        break;
      }
      default: break;
    }
    // Group everything this accessory added so it can be dragged as one piece on the model
    const added = group.children.slice(startIdx);
    if (added.length) {
      const wrap = new THREE.Group();
      added.forEach((c) => { group.remove(c); wrap.add(c); });
      wrap.userData.dragKey = `acc:${idx}`;
      group.add(wrap);
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
  // מידות ברירת מחדל לפי סוג המצבה: יחיד 75×170, כפולה 140×180, משפחתית 190×190, קטנה 70×70
  const dims = TOMBSTONE_DIMENSIONS[tt.id] || TOMBSTONE_DIMENSIONS.regular;
  const defaultW = dims.width / 100;
  const defaultL = dims.length / 100;
  const W = design.panelWidthCm ? design.panelWidthCm / 100 : defaultW;
  const L = design.panelLengthCm ? design.panelLengthCm / 100 : defaultL;

  const firstOf = (v) => (Array.isArray(v) ? v[0] : v);
  const frameDef = FRAMES.find((f) => f.id === firstOf(design.frame)) || FRAMES[0];
  const slabDef = SLABS.find((s) => s.id === firstOf(design.slab)) || SLABS[0];
  const hsDef = HEADSTONE_TOPS.find((h) => h.id === firstOf(design.headstoneTop)) || HEADSTONE_TOPS[0];
  // A material or colour the user picked for a part wins over the colour baked into the option itself.
  const withUserColor = (def, userPicked) => (userPicked ? { ...def, overrideColor: undefined } : def);

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
    const pDef = withUserColor(PANELS.find((p) => p.id === panelId) || PANELS[0], design.panelStone || design.panelColor);
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
    const fDef = withUserColor(FRAMES.find((f) => f.id === frameId) || FRAMES[0], design.frameStone || design.frameColor);
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
    const sDef = withUserColor(SLABS.find((s) => s.id === slabId) || SLABS[0], design.slabStone || design.slabColor);
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
      ner.userData.dragKey = 'ner';
      ner.children.forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
      group.add(ner);
    } else if (design.headstonePlacement === 'lying') {
      // Headstone lies flat on the slab — the candle house stands on the slab behind it
      const ner = buildNerHouse(nerSize, nerStyle);
      const fp = getNerHouseFootprint(nerSize, nerStyle);
      const lyingLen = design.headstoneHeightCm ? design.headstoneHeightCm / 100 : W * 0.45;
      ner.position.set(nerX, slabTopY, -(L * 0.05) - lyingLen / 2 - fp.d / 2 - 0.02 + nerZ);
      ner.userData.dragKey = 'ner';
      ner.children.forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
      group.add(ner);
    } else {
      // Behind the headstone — the housing is mounted flat on the headstone's back face
      const hsRise = Math.max(0.2, headstoneTopY - slabTopY);
      const housing = buildMountedCandleHousing(Math.min(0.30, Math.max(0.18, hsRise * 0.5)));
      housing.rotation.y = Math.PI; // door faces away from the headstone, into the rear
      const backZ = -L * 0.47 + (design.headstoneOffsetZ || 0);
      housing.position.set(nerX, slabTopY + Math.max(0.04, hsRise * 0.16), backZ - 0.001 + nerZ);
      housing.userData.dragKey = 'ner';
      housing.children.forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
      group.add(housing);
    }
  }

  // Custom ornament (prompt-to-image) — engraved emblem anchored to the headstone face,
  // at the top of the plaque where the name is inscribed (not floating on the slab).
  if (design.customImageUrl) {
    const tex = ornamentTexture(design.customImageUrl);
    // The artwork is already stripped of its sheet (alpha = ink only), so a plain
    // transparent pass draws the etched lines straight onto the stone.
    const bbMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
    });
    // decalInfo holds the real plaque face position and size
    const faceZ = decalInfo ? decalInfo.pos.z : -L * 0.38;
    const plaqueX = decalInfo ? decalInfo.pos.x : 0;
    const plaqueW = decalInfo ? decalInfo.size.x : W * 0.7;
    const plaqueH = decalInfo ? decalInfo.size.y : Math.max(0.3, y - slabTopY);
    const plaqueTop = decalInfo ? decalInfo.pos.y + plaqueH / 2 : y;
    const bbW = Math.min(plaqueW * 0.8, plaqueH * 0.55);
    const bbH = bbW;
    const bbGeo = new THREE.PlaneGeometry(bbW, bbH);
    if (design.headstonePlacement === 'lying' && decalInfo) {
      // Headstone lies flat — the emblem is engraved on its sloped top surface
      const zOrn = decalInfo.pos.z - decalInfo.size.y * 0.3;
      const yOrn = (decalInfo.surfaceAt ? decalInfo.surfaceAt(zOrn) : decalInfo.pos.y - 0.045) + 0.004;
      const bb = new THREE.Mesh(bbGeo, bbMat);
      bb.rotation.x = -Math.PI / 2 + (decalInfo.slope || 0);
      place(group, bb, new THREE.Vector3(plaqueX, yOrn, zOrn), 'headstone');
    } else {
      const pos0 = new THREE.Vector3(plaqueX, plaqueTop - plaqueH * 0.03 - bbH / 2, faceZ);
      place(group, new THREE.Mesh(bbGeo, bbMat), pos0, 'headstone');
      // Second, slightly offset pass — deepens the carved groove so the emblem reads as engraved
      place(group, new THREE.Mesh(bbGeo, bbMat), pos0.clone().add(new THREE.Vector3(bbW * 0.006, -bbH * 0.006, -0.001)), 'headstone');
    }
  }

  if (decalInfo && design.engravingText) {
    const lettering = LETTERING_TYPES.find((l) => l.id === design.letteringType) || LETTERING_TYPES[0];
    const letterStone = decalInfo.stone || bodyStone;
    // החריטה: מסכת צורה בלבד. הצבע מגיע מהחומר — גוון פחם אחיד, בלי טקסטורה
    // של אבן ובלי מפות צבע/פליטה על גבי הטקסט.
    const textMask = makeTextTexture(
      design.engravingText,
      lettering.style,
      letterStone,
      1024,
      design.headstoneTextScale || 1,
      '#ffffff'
    );
    const textMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2b2b2f'),
      alphaMap: textMask,
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.75,
      metalness: 0,
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

  // גרניט סרדו: חומר אחד משותף לכל חלקי המצבה — כולל המסגרת המסותתת.
  const usesSardo = [bodyStone, panelStone, frameStone, slabStone, hsStone].some(isSardoGranite);
  if (usesSardo) applySharedGraniteMaterial(group, getSardoGraniteMaterial());

  return group;
}

export function disposeGroup(group) {
  const seen = new Set();
  group.traverse((obj) => {
    if (obj.geometry && !seen.has(obj.geometry)) { seen.add(obj.geometry); obj.geometry.dispose(); }
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        // חומר הגרניט המשותף נשאר בזיכרון בין בניות — לא משחררים אותו
        if (!m || (m.userData && m.userData.sardo)) return;
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
  });
}