import * as THREE from 'three';
import { STONE_TYPES } from '@/lib/tombstoneOptions';

// ---------------------------------------------------------------------------
// גרניט סרדו — חומר אחד, משותף לכל המצבה.
// MeshStandardMaterial פשוט עם צילום האבן בלבד, בלי שיידר מותאם, בלי מפות
// לכל חלק ובלי גוון. כל משושה במצבה מקבל את אותו מופע בדיוק.
// ---------------------------------------------------------------------------
let SARDO_MATERIAL = null;

function sardoStone() {
  return STONE_TYPES.find((s) => s.id === 'sardo');
}

export function isSardoGranite(stone) {
  return !!stone && stone.id === 'sardo';
}

// מרים את התמונה כך שהקנבס יישאר קריא (fetch ⇒ blob ⇒ objectURL), כדי שאפשר
// יהיה לנקות אותה מפיקסלים זרים.
function loadImageForCanvas(url) {
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

// מנקה צילום אבן: מוציא ממנו סימן מים / לוגו שבדרך כלל יושב בפינת התמונה —
// כתמים כחולים־אדומים שהיו חוזרים על כל פאה עם המיפוי החוזר — ומנטרל את הגוון לאפור.
function cleanStockStoneCanvas(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  let data;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    return cv; // canvas tainted — the plain photo is still usable
  }
  const px = data.data;

  // 1. אבן היא אפורה; כל פיקסל עם רוויה גבוהה הוא לוגו או סימן מים.
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx > 0 && (mx - mn) / mx > 0.3) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 > x0) {
    const pad = 8;
    x0 = Math.max(0, x0 - pad);
    y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w - 1, x1 + pad);
    y1 = Math.min(h - 1, y1 + pad);
    const bw = x1 - x0 + 1;
    const bh = y1 - y0 + 1;
    // 2. האזור הזר מוחלף באבן נקייה שנדגמת מתחתיו (או מעליו אם אין מקום).
    let sy = y1 + 5;
    if (sy + bh > h) sy = y0 - bh - 5;
    if (sy < 0 || sy + bh > h) sy = Math.max(0, h - bh);
    const sx = Math.min(x0, w - bw);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const di = ((y0 + y) * w + (x0 + x)) * 4;
        const si = ((sy + y) * w + (sx + x)) * 4;
        px[di] = px[si];
        px[di + 1] = px[si + 1];
        px[di + 2] = px[si + 2];
      }
    }
  }

  // 3. ניטרול גוון: כל פיקסל הופך לאפור לפי הבהירות שלו — אפס כחול, סגול או חום.
  for (let i = 0; i < px.length; i += 4) {
    const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return cv;
}

export function getSardoGraniteMaterial() {
  if (SARDO_MATERIAL) return SARDO_MATERIAL;
  const stone = sardoStone();
  // קנבס מקומי שהטקסטורה נטענת אליו — גוון אפור סרדו עד שהתמונה המנוקה מוכנה.
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 4;
  const cctx = cv.getContext('2d');
  cctx.fillStyle = '#9b9ea3';
  cctx.fillRect(0, 0, 4, 4);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex,
    roughness: 0.4,
    metalness: 0,
    envMapIntensity: 0.35,
  });
  mat.userData.isStoneMaterial = true;
  mat.userData.sardo = true;
  // מיפוי במרחב העולם: כל משולש מקבל את ההיטל שלו לפי הנורמל שלו
  mat.userData.boxUV = true;
  mat.userData.uvMeter = 0.9;
  SARDO_MATERIAL = mat;

  loadImageForCanvas(stone.textureUrl)
    .then((img) => {
      const clean = cleanStockStoneCanvas(img);
      cv.width = clean.width;
      cv.height = clean.height;
      cv.getContext('2d').drawImage(clean, 0, 0);
      tex.needsUpdate = true;
    })
    .catch(() => { /* unreachable texture — the neutral grey stays */ });

  return mat;
}