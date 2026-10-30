import * as THREE from 'three';

/* Procedural PBR texture generation for natural stone materials.
   Generates diffuse (map), normal, and roughness maps per stone "kind"
   so the 3D scene uses real PBR materials instead of flat color primitives. */

function hexToRgb(hex) {
  const c = new THREE.Color(hex);
  return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)];
}

function makeCanvasCtx(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c.getContext('2d');
}

function hash(x, y, s) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(size, scale, seed) {
  const cols = Math.ceil(size / scale) + 2;
  const grid = new Float32Array(cols * cols);
  for (let i = 0; i < grid.length; i++) grid[i] = hash(i * 13.1, i * 7.7, seed);
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / scale, gy = y / scale;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const tx = gx - x0, ty = gy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = grid[y0 * cols + x0], b = grid[y0 * cols + x0 + 1];
      const c = grid[(y0 + 1) * cols + x0], d = grid[(y0 + 1) * cols + x0 + 1];
      out[y * size + x] = (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    }
  }
  return out;
}

function valueNoiseAniso(size, scaleX, scaleY, seed) {
  const colsX = Math.ceil(size / scaleX) + 2;
  const colsY = Math.ceil(size / scaleY) + 2;
  const grid = new Float32Array(colsX * colsY);
  for (let i = 0; i < grid.length; i++) grid[i] = hash(i * 13.1, i * 7.7, seed);
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / scaleX, gy = y / scaleY;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const tx = gx - x0, ty = gy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = grid[y0 * colsX + x0], b = grid[y0 * colsX + x0 + 1];
      const c = grid[(y0 + 1) * colsX + x0], d = grid[(y0 + 1) * colsX + x0 + 1];
      out[y * size + x] = (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    }
  }
  return out;
}

function fbm(size, scale, oct, seed) {
  const out = new Float32Array(size * size);
  let amp = 1, tot = 0, sc = scale, sd = seed;
  for (let o = 0; o < oct; o++) {
    const n = valueNoise(size, sc, sd);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    tot += amp; amp *= 0.5; sc = Math.max(1, sc * 0.5); sd = sd * 7 + 3;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

function ridged(size, scale, oct, seed) {
  const out = new Float32Array(size * size);
  let amp = 1, tot = 0, sc = scale, sd = seed;
  for (let o = 0; o < oct; o++) {
    const n = valueNoise(size, sc, sd);
    for (let i = 0; i < out.length; i++) {
      const v = 1 - Math.abs(n[i] * 2 - 1);
      out[i] += v * v * amp;
    }
    tot += amp; amp *= 0.5; sc = Math.max(1, sc * 0.5); sd = sd * 7 + 3;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

function flowingMarble(size, seed) {
  // Anisotropic ridged noise rotated diagonally + domain warp modulation
  // for long, flowing, natural marble veins (not isotropic blobs).
  const theta = 0.38;
  const cosT = Math.cos(theta), sinT = Math.sin(theta);
  const cx = size / 2, cy = size / 2;
  const g1 = valueNoiseAniso(size, 48, 14, seed);
  const g2 = valueNoiseAniso(size, 26, 9, seed + 50);
  const g3 = valueNoiseAniso(size, 12, 6, seed + 100);
  const warp = fbm(size, 10, 3, seed + 200);
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const dx = x - cx, dy = y - cy;
      const rx = cx + dx * cosT - dy * sinT;
      const ry = cy + dx * sinT + dy * cosT;
      const rxi = ((Math.round(rx) % size) + size) % size;
      const ryi = ((Math.round(ry) % size) + size) % size;
      const ri = ryi * size + rxi;
      const v1 = 1 - Math.abs(g1[ri] * 2 - 1);
      const v2 = 1 - Math.abs(g2[i] * 2 - 1);
      const v3 = 1 - Math.abs(g3[i] * 2 - 1);
      const w = warp[i];
      const combined = v1 * v1 * 0.6 + v2 * v2 * 0.28 + v3 * v3 * 0.12;
      out[i] = combined + (w - 0.5) * 0.18;
    }
  }
  // Normalize to full 0-1 range for effective thresholding
  let minV = 1, maxV = 0;
  for (let i = 0; i < out.length; i++) { if (out[i] < minV) minV = out[i]; if (out[i] > maxV) maxV = out[i]; }
  const range = maxV - minV || 1;
  for (let i = 0; i < out.length; i++) {
    const n = (out[i] - minV) / range;
    // Contrast curve: push mid-values apart for sharper vein edges
    out[i] = Math.max(0, Math.min(1, (n - 0.5) * 1.5 + 0.5));
  }
  return out;
}

function rockfaceHeight(size, seed) {
  // Angular chiseled stone height map: Voronoi-like cells with sharp boundaries,
  // deep gouges, random pits and bumps — mimics hand-chiseled rockface/split-face stone.
  const cellSize = 28;
  const cols = Math.ceil(size / cellSize) + 2;
  const grid = new Float32Array(cols * cols);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = hash(i * 3.7, i * 7.3, seed) * 0.7 + 0.15;
  }
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const cx = Math.floor(x / cellSize);
      const cy = Math.floor(y / cellSize);
      const fx = (x - cx * cellSize) / cellSize;
      const fy = (y - cy * cellSize) / cellSize;
      const distX = Math.min(fx, 1 - fx);
      const distY = Math.min(fy, 1 - fy);
      const distBoundary = Math.min(distX, distY);
      let h = grid[cy * cols + cx];
      // Deep gouges at cell boundaries — sharp, angular breaks
      if (distBoundary < 0.15) {
        const g = distBoundary / 0.15;
        h = h * (g * g) + 0.05 * (1 - g * g);
      }
      // Fine surface roughness
      h += (hash(x * 3.7, y * 5.3, seed + 5) - 0.5) * 0.1;
      // Random deep pits — natural rockface cavities
      const pit = hash(x * 7.1, y * 11.3, seed + 10);
      if (pit > 0.97) h *= 0.35;
      // Random raised bumps — protruding crystal facets
      const bump = hash(x * 13.7, y * 17.3, seed + 15);
      if (bump > 0.95) h = Math.min(1, h * 1.6);
      out[i] = Math.max(0, Math.min(1, h));
    }
  }
  return out;
}

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function heightToNormal(height, size, strength) {
  const ctx = makeCanvasCtx(size);
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size, xr = (x + 1) % size;
      const yu = (y - 1 + size) % size, yd = (y + 1) % size;
      const dx = (height[y * size + xr] - height[y * size + xl]) * strength;
      const dy = (height[yd * size + x] - height[yu * size + x]) * strength;
      let nx = -dx, ny = -dy, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len; ny /= len; nz /= len;
      const idx = (y * size + x) * 4;
      d[idx] = (nx * 0.5 + 0.5) * 255;
      d[idx + 1] = (ny * 0.5 + 0.5) * 255;
      d[idx + 2] = (nz * 0.5 + 0.5) * 255;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(ctx.canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function toTexture(ctx) {
  const tex = new THREE.CanvasTexture(ctx.canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function drawCrack(ctx, size, seed) {
  let x = (hash(seed, 1, 3) * size) | 0;
  let y = (hash(seed, 2, 3) * size) | 0;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let s = 0; s < 18; s++) {
    x += (hash(seed, s * 2, 9) - 0.5) * 14;
    y += (hash(seed, s * 2 + 1, 9) - 0.5) * 14;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawVeinPath(ctx, sx, sy, c1x, c1y, c2x, c2y, ex, ey, color, width, alpha) {
  ctx.strokeStyle = color.replace('ALPHA', String(alpha));
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
  ctx.stroke();
}

function drawMarbleVeins(ctx, size, seed) {
  // Dramatic, realistic marble veins: dark flowing bezier paths with multi-layer halos,
  // branches, and secondary thin vein networks for natural complexity.
  const numVeins = 18 + Math.floor(hash(seed, 1, 1) * 8);
  for (let v = 0; v < numVeins; v++) {
    const startY = hash(seed, v * 3, 7) * size;
    const startX = -50;
    const endX = size + 50;
    const endY = startY + (hash(seed, v * 5, 11) - 0.5) * size * 0.55;
    const cp1x = size * 0.3, cp1y = startY + (hash(seed, v * 7, 13) - 0.5) * size * 0.5;
    const cp2x = size * 0.7, cp2y = endY + (hash(seed, v * 11, 17) - 0.5) * size * 0.5;
    // Dark vein colors — some cool grey, some warm grey for natural variation
    const warm = hash(seed, v, 19) > 0.5;
    const vr = warm ? 50 + Math.floor(hash(seed, v, 21) * 20) : 38 + Math.floor(hash(seed, v, 21) * 25);
    const vg = warm ? 46 + Math.floor(hash(seed, v, 23) * 18) : 40 + Math.floor(hash(seed, v, 23) * 22);
    const vb = warm ? 38 + Math.floor(hash(seed, v, 25) * 16) : 44 + Math.floor(hash(seed, v, 25) * 22);
    const baseColor = `rgba(${vr},${vg},${vb},ALPHA)`;
    const alpha = 0.75 + hash(seed, v, 31) * 0.2;
    // Ultra-wide soft halo
    drawVeinPath(ctx, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, baseColor, 45 + hash(seed, v, 41) * 20, 0.1);
    // Wide halo
    drawVeinPath(ctx, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, baseColor, 28 + hash(seed, v, 42) * 14, 0.2);
    // Medium band
    drawVeinPath(ctx, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, baseColor, 14 + hash(seed, v, 43) * 8, 0.4);
    // Main dark vein
    drawVeinPath(ctx, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, baseColor, 6 + hash(seed, v, 37) * 6, alpha);
    // Thin dark core
    drawVeinPath(ctx, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, baseColor, 2 + hash(seed, v, 38) * 2, Math.min(1, alpha + 0.2));
    // Branching offshoots
    const numBranches = 3 + Math.floor(hash(seed, v, 43) * 4);
    for (let b = 0; b < numBranches; b++) {
      const t = 0.1 + hash(seed, v * 100 + b, 47) * 0.8;
      const omt = 1 - t;
      const bx = omt * omt * omt * startX + 3 * omt * omt * t * cp1x + 3 * omt * t * t * cp2x + t * t * t * endX;
      const by = omt * omt * omt * startY + 3 * omt * omt * t * cp1y + 3 * omt * t * t * cp2y + t * t * t * endY;
      const branchLen = 25 + hash(seed, v * 200 + b, 53) * 80;
      const branchAng = (hash(seed, v * 300 + b, 59) - 0.5) * Math.PI * 0.9;
      const bex = bx + Math.cos(branchAng) * branchLen;
      const bey = by + Math.sin(branchAng) * branchLen;
      const bAlpha = alpha * (0.5 + hash(seed, v * 400 + b, 61) * 0.3);
      // Branch halo
      ctx.strokeStyle = baseColor.replace('ALPHA', String(bAlpha * 0.35));
      ctx.lineWidth = 10 + hash(seed, v * 410 + b, 63) * 8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(branchAng) * branchLen * 0.5 + (hash(seed, v * 500 + b, 67) - 0.5) * 25,
        by + Math.sin(branchAng) * branchLen * 0.5 + (hash(seed, v * 600 + b, 71) - 0.5) * 25,
        bex, bey
      );
      ctx.stroke();
      // Branch core
      ctx.strokeStyle = baseColor.replace('ALPHA', String(bAlpha));
      ctx.lineWidth = 3 + hash(seed, v * 700 + b, 73) * 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(branchAng) * branchLen * 0.5 + (hash(seed, v * 500 + b, 67) - 0.5) * 25,
        by + Math.sin(branchAng) * branchLen * 0.5 + (hash(seed, v * 600 + b, 71) - 0.5) * 25,
        bex, bey
      );
      ctx.stroke();
    }
  }
  // Secondary thin vein network — fine dark lines for detail
  const numThin = 30 + Math.floor(hash(seed, 2, 3) * 15);
  for (let t = 0; t < numThin; t++) {
    const sx = hash(seed, t * 7, 11) * size;
    const sy = hash(seed, t * 11, 13) * size;
    const ex = sx + (hash(seed, t * 13, 17) - 0.5) * size * 0.3;
    const ey = sy + (hash(seed, t * 17, 19) - 0.5) * size * 0.3;
    const tr = 40 + Math.floor(hash(seed, t, 23) * 25);
    const tg = 36 + Math.floor(hash(seed, t, 29) * 22);
    const tb = 30 + Math.floor(hash(seed, t, 31) * 24);
    ctx.strokeStyle = `rgba(${tr},${tg},${tb},${0.4 + hash(seed, t, 37) * 0.3})`;
    ctx.lineWidth = 1.5 + hash(seed, t, 41) * 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      (sx + ex) / 2 + (hash(seed, t * 50, 43) - 0.5) * 30,
      (sy + ey) / 2 + (hash(seed, t * 60, 47) - 0.5) * 30,
      ex, ey
    );
    ctx.stroke();
  }
}

function drawRustVeins(ctx, size, seed) {
  const numVeins = 8 + Math.floor(hash(seed, 1, 1) * 6);
  for (let v = 0; v < numVeins; v++) {
    const sx = hash(seed, v * 3, 7) * size;
    const sy = hash(seed, v * 5, 11) * size;
    const ex = sx + (hash(seed, v * 7, 13) - 0.5) * size * 0.4;
    const ey = sy + (hash(seed, v * 11, 17) - 0.5) * size * 0.4;
    const r = 177, g = 141, b = 134;
    ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
    ctx.lineWidth = 2 + hash(seed, v, 23) * 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      (sx + ex) / 2 + (hash(seed, v * 50, 29) - 0.5) * 40,
      (sy + ey) / 2 + (hash(seed, v * 60, 31) - 0.5) * 40,
      ex, ey
    );
    ctx.stroke();
    for (let b2 = 0; b2 < 3; b2++) {
      const t = 0.2 + hash(seed, v * 100 + b2, 37) * 0.6;
      const bx = sx + (ex - sx) * t;
      const by = sy + (ey - sy) * t;
      const branchAng = (hash(seed, v * 200 + b2, 41) - 0.5) * Math.PI;
      const branchLen = 15 + hash(seed, v * 300 + b2, 43) * 30;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.15 + hash(seed, v * 400 + b2, 47) * 0.15})`;
      ctx.lineWidth = 1 + hash(seed, v * 500 + b2, 53) * 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(branchAng) * branchLen, by + Math.sin(branchAng) * branchLen);
      ctx.stroke();
    }
  }
}

function drawMortarGrid(ctx, size, seed) {
  const blockSize = 64 + Math.floor(hash(seed, 1, 3) * 32);
  ctx.strokeStyle = 'rgba(168, 169, 165, 0.45)';
  ctx.lineWidth = 3;
  for (let y = 0; y < size; y += blockSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  let offset = 0;
  for (let y = 0; y < size; y += blockSize) {
    for (let x = offset; x < size; x += blockSize) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + blockSize);
      ctx.stroke();
    }
    offset = offset === 0 ? blockSize / 2 : 0;
  }
}

function drawHorizontalGrooves(ctx, size, seed) {
  const grooveSpacing = 18 + Math.floor(hash(seed, 1, 5) * 8);
  for (let y = grooveSpacing; y < size; y += grooveSpacing) {
    const wobble = (hash(seed, y, 7) - 0.5) * 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + wobble);
    ctx.lineTo(size, y + wobble);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + wobble + 2);
    ctx.lineTo(size, y + wobble + 2);
    ctx.stroke();
  }
}

function drawLinearVeins(ctx, size, seed) {
  // Fine, tight, parallel horizontal lines with clear grey colors
  // for a refined linear marble look (Turkey Grey style)
  const numLines = 70 + Math.floor(hash(seed, 1, 1) * 30);
  for (let i = 0; i < numLines; i++) {
    const y = (i / numLines) * size + (hash(seed, i, 3) - 0.5) * 5;
    const grey = 85 + Math.floor(hash(seed, i, 7) * 55);
    const alpha = 0.3 + hash(seed, i, 11) * 0.35;
    const width = 1.5 + hash(seed, i, 13) * 2.5;
    ctx.strokeStyle = `rgba(${grey},${grey},${grey - 10},${alpha})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      const wobble = (hash(seed, i * 7, 17) - 0.5) * 4 * Math.sin(x * 0.015 + hash(seed, i, 19) * 6);
      ctx.lineTo(x, y + wobble);
    }
    ctx.stroke();
  }
  // Darker accent lines for depth
  const numAccent = 12 + Math.floor(hash(seed, 2, 1) * 8);
  for (let i = 0; i < numAccent; i++) {
    const y = hash(seed, i * 13, 23) * size;
    const grey = 55 + Math.floor(hash(seed, i, 29) * 35);
    const alpha = 0.35 + hash(seed, i, 31) * 0.3;
    const width = 2 + hash(seed, i, 37) * 2.5;
    ctx.strokeStyle = `rgba(${grey},${grey},${grey - 8},${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      const wobble = (hash(seed, i * 17, 41) - 0.5) * 3 * Math.sin(x * 0.02 + hash(seed, i, 43) * 6);
      ctx.lineTo(x, y + wobble);
    }
    ctx.stroke();
  }
}

// Draw veins on the roughness map — veins are slightly rougher than the polished base
function drawMarbleVeinsRough(ctx, size, seed) {
  const baseRough = 110; // polished base roughness value (0-255)
  const veinRough = 160; // veins are rougher
  const numVeins = 14 + Math.floor(hash(seed, 1, 1) * 6);
  for (let v = 0; v < numVeins; v++) {
    const startY = hash(seed, v * 3, 7) * size;
    const startX = -50;
    const endX = size + 50;
    const endY = startY + (hash(seed, v * 5, 11) - 0.5) * size * 0.55;
    const cp1x = size * 0.3, cp1y = startY + (hash(seed, v * 7, 13) - 0.5) * size * 0.5;
    const cp2x = size * 0.7, cp2y = endY + (hash(seed, v * 11, 17) - 0.5) * size * 0.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${veinRough},${veinRough},${veinRough},0.2)`;
    ctx.lineWidth = 16 + hash(seed, v, 41) * 10;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${veinRough},${veinRough},${veinRough},0.35)`;
    ctx.lineWidth = 5 + hash(seed, v, 42) * 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
  }
}

const PRESETS = {
  granite: { ridged: false, noiseScale: 4, octaves: 4, baseVar: 0.5, roughBase: 0.62, roughVar: 0.28, nStr: 1.0, flecks: true, crystalline: true },
  marble: { flowingMarble: true, veinMix: 0.6, veinColor: [140, 135, 125], veinColor2: [110, 105, 95], veinColor3: [80, 75, 68], baseVar: 0.05, roughBase: 0.72, roughVar: 0.18, nStr: 0.4, repeat: 1 },
  turkish_grey: { ridged: false, noiseScale: 6, octaves: 3, banded: true, baseVar: 0.05, roughBase: 0.35, roughVar: 0.15, nStr: 0.3, linearVeins: true, repeat: 1 },
  turkish_tan: { flowingMarble: true, lightVeins: true, veinMix: 0.32, veinColor: [150, 126, 96], baseVar: 0.1, roughBase: 0.3, roughVar: 0.12, nStr: 0.35, flecks: true, repeat: 1 },
  pure_white_marble: { ridged: false, noiseScale: 6, octaves: 3, baseVar: 0.05, roughBase: 0.05, roughVar: 0.04, nStr: 0.15, repeat: 1, flecks: true },
  black_marble: { ridged: true, noiseScale: 14, octaves: 5, veinMix: 0.78, veinColor: [180, 175, 168], baseVar: 0.06, roughBase: 0.2, roughVar: 0.1, nStr: 0.7, flecks: true },
  mirror_black: { ridged: false, noiseScale: 18, octaves: 4, baseVar: 0.12, roughBase: 0.03, roughVar: 0.04, nStr: 0.22, flecks: true, crystalline: true },
  orion_blue: { flowingMarble: true, lightVeins: true, veinMix: 0.55, veinColor: [110, 118, 126], veinColor2: [140, 148, 158], baseVar: 0.08, roughBase: 0.15, roughVar: 0.1, nStr: 0.5, flecks: true, repeat: 1 },
  halila: { ridged: false, noiseScale: 4, octaves: 3, baseVar: 0.12, roughBase: 0.65, roughVar: 0.15, nStr: 0.8, fossils: true, microSpeckles: true },
  concrete: { ridged: false, noiseScale: 6, octaves: 4, baseVar: 0.4, roughBase: 0.78, roughVar: 0.2, nStr: 0.8, pores: true, cracks: true },
  sandstone: { ridged: false, noiseScale: 5, octaves: 3, banded: true, baseVar: 0.5, roughBase: 0.86, roughVar: 0.14, nStr: 1.4 },
  tuvza: { rockface: true, noiseScale: 2, octaves: 6, baseVar: 0.22, roughBase: 0.99, roughVar: 0.01, nStr: 3.0, cracks: true, flecks: true, microSpeckles: true },
  hebron: { rockface: true, noiseScale: 3, octaves: 4, baseVar: 0.25, roughBase: 0.85, roughVar: 0.1, nStr: 2.5, cracks: true, rustVeins: true, horizontalGrooves: true },
  bronze: { ridged: false, noiseScale: 10, octaves: 3, baseVar: 0.18, roughBase: 0.38, roughVar: 0.22, nStr: 0.6, patina: true },
  plaque: { ridged: false, noiseScale: 4, octaves: 3, baseVar: 0.25, roughBase: 0.45, roughVar: 0.2, nStr: 1.0 },
};

export function makeStoneTextures(kind, baseColorHex) {
  const size = 1024;
  const [br, bg, bb] = hexToRgb(baseColorHex);
  const seed = (br * 7 + bg * 13 + bb * 3 + kind.length * 31) || 12345;
  const p = PRESETS[kind] || PRESETS.granite;

  let height;
  if (p.rockface) {
    height = rockfaceHeight(size, seed);
  } else if (p.flowingMarble) {
    height = flowingMarble(size, seed);
  } else {
    height = p.ridged ? ridged(size, p.noiseScale, p.octaves, seed) : fbm(size, p.noiseScale, p.octaves, seed);
  }

  const mctx = makeCanvasCtx(size);
  const mimg = mctx.createImageData(size, size);
  const md = mimg.data;
  const rctx = makeCanvasCtx(size);
  const rimg = rctx.createImageData(size, size);
  const rd = rimg.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      let h = height[i];
      if (p.banded) {
        const band = 0.5 + 0.5 * Math.sin(y * 0.22 + height[i] * 4.5);
        h = h * 0.55 + band * 0.45;
      }
      // Tuvza: angular faceted chunks with layered split-face look
      if (p.chunks && !p.rockface) {
        const cs = p.chunkSize || 16;
        const cellX = Math.floor(x / cs);
        const cellY = Math.floor(y / cs);
        const cellHash = hash(cellX, cellY, seed + 11);
        const facet = Math.floor(h * 4 + cellHash * 3) / 4;
        h = facet;
        // Deep gouges between chunks for a chiseled, wild look
        if (p.deepGouges) {
          const edgeX = (x % cs) / cs;
          const edgeY = (y % cs) / cs;
          const distEdge = Math.min(edgeX, 1 - edgeX, edgeY, 1 - edgeY);
          const gd = p.gougeDepth || 0.2;
          if (distEdge < 0.15) {
            h *= (1 - gd) + distEdge * (gd / 0.15);
          }
          // Random deep pits for natural rock face
          const pit = hash(x * 3, y * 5, seed + 44);
          if (pit > 0.97) h *= 0.3;
        }
      }
      let r = br, g = bg, b = bb;
      const varAmt = (h - 0.5) * 2 * p.baseVar;
      r = Math.max(0, Math.min(255, r * (1 + varAmt)));
      g = Math.max(0, Math.min(255, g * (1 + varAmt)));
      b = Math.max(0, Math.min(255, b * (1 + varAmt)));
      if (p.veinMix) {
        const v = smoothstep(0.45, 0.85, h);
        r = r * (1 - v * p.veinMix) + p.veinColor[0] * v * p.veinMix;
        g = g * (1 - v * p.veinMix) + p.veinColor[1] * v * p.veinMix;
        b = b * (1 - v * p.veinMix) + p.veinColor[2] * v * p.veinMix;
        if (p.veinColor2) {
          const v2 = smoothstep(0.65, 0.96, h) * 0.42;
          r = r * (1 - v2) + p.veinColor2[0] * v2;
          g = g * (1 - v2) + p.veinColor2[1] * v2;
          b = b * (1 - v2) + p.veinColor2[2] * v2;
        }
        if (p.veinColor3) {
          const v3 = smoothstep(0.78, 0.99, h) * 0.3;
          r = r * (1 - v3) + p.veinColor3[0] * v3;
          g = g * (1 - v3) + p.veinColor3[1] * v3;
          b = b * (1 - v3) + p.veinColor3[2] * v3;
        }
      }
      if (p.flecks) {
        // Multi-color mineral flecks: white quartz, grey feldspar, black biotite, gold iron oxide
        const f = hash(x, y, seed + 5);
        const f2 = hash(x * 3.1, y * 3.1, seed + 8);
        if (f > 0.993) {
          // White quartz — bright crystalline fleck
          r = Math.min(255, r * 0.3 + 225 * 0.7);
          g = Math.min(255, g * 0.3 + 222 * 0.7);
          b = Math.min(255, b * 0.3 + 218 * 0.7);
        } else if (f > 0.985) {
          // Light grey feldspar
          const gr = 150 + Math.floor(f2 * 50);
          r = Math.min(255, r * 0.4 + gr * 0.6);
          g = Math.min(255, g * 0.4 + gr * 0.6);
          b = Math.min(255, b * 0.4 + gr * 0.6);
        } else if (f > 0.977) {
          // Dark biotite / black mica
          r *= 0.3; g *= 0.3; b *= 0.3;
        } else if (f > 0.968) {
          // Gold/brown iron oxide
          r = Math.min(255, r * 0.4 + 130 * 0.6);
          g = Math.min(255, g * 0.4 + 100 * 0.6);
          b = Math.min(255, b * 0.4 + 70 * 0.6);
        } else if (f > 0.955) {
          // Subtle bright crystal facet
          r = Math.min(255, r * 1.25); g = Math.min(255, g * 1.25); b = Math.min(255, b * 1.25);
        }
      }
      if (p.pores) {
        const pp = hash(x, y, seed + 99);
        if (pp > 0.975) { r *= 0.5; g *= 0.5; b *= 0.5; h *= 0.4; }
      }
      if (p.patina) {
        const blot = hash(x, y, seed + 7);
        if (blot > 0.72) {
          const t = (blot - 0.72) / 0.28;
          r = r * (1 - t * 0.6) + 86 * t * 0.6;
          g = g * (1 - t * 0.6) + 128 * t * 0.6;
          b = b * (1 - t * 0.6) + 104 * t * 0.6;
        }
      }
      if (p.crystalline) {
        // Angular crystal facets with varied mineral reflectivity
        const cs = 3;
        const cx = Math.floor(x / cs);
        const cy = Math.floor(y / cs);
        const cf = hash(cx, cy, seed + 15);
        const cf2 = hash(cx * 2.7, cy * 2.7, seed + 25);
        if (cf > 0.965) {
          const brightness = 1.35 + cf2 * 0.35;
          r = Math.min(255, r * brightness);
          g = Math.min(255, g * brightness);
          b = Math.min(255, b * brightness);
        } else if (cf > 0.93) {
          r *= 0.55; g *= 0.55; b *= 0.55;
        }
        const cellX = x - cx * cs;
        const cellY = y - cy * cs;
        const edgeDist = Math.min(cellX, cs - 1 - cellX, cellY, cs - 1 - cellY);
        if (edgeDist === 0 && cf2 > 0.4) {
          r *= 0.82; g *= 0.82; b *= 0.82;
        }
      }
      if (p.fossils) {
        const ff = hash(Math.floor(x / 6), Math.floor(y / 6), seed + 22);
        if (ff > 0.93) {
          const fb = 1.08 + hash(x, y, seed + 33) * 0.12;
          r = Math.min(255, r * fb); g = Math.min(255, g * fb); b = Math.min(255, b * fb);
        }
      }
      if (p.microSpeckles) {
        const ms = hash(x * 3.7, y * 3.7, seed + 44);
        if (ms > 0.975) { r *= 0.55; g *= 0.55; b *= 0.55; }
      }
      const idx = i * 4;
      md[idx] = r; md[idx + 1] = g; md[idx + 2] = b; md[idx + 3] = 255;
      const rv = Math.max(0, Math.min(255, (p.roughBase + (1 - h) * p.roughVar) * 255));
      rd[idx] = rv; rd[idx + 1] = rv; rd[idx + 2] = rv; rd[idx + 3] = 255;
    }
  }
  mctx.putImageData(mimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);
  if (p.flowingMarble && !p.lightVeins) {
    drawMarbleVeins(mctx, size, seed);
    drawMarbleVeinsRough(rctx, size, seed);
  }
  if (p.linearVeins) {
    drawLinearVeins(mctx, size, seed);
  }
  if (p.cracks) {
    mctx.strokeStyle = 'rgba(0,0,0,0.45)';
    mctx.lineWidth = 1;
    for (let c = 0; c < 4; c++) drawCrack(mctx, size, seed + c * 17);
  }
  if (p.rustVeins) drawRustVeins(mctx, size, seed);
  if (p.mortar) drawMortarGrid(mctx, size, seed);
  if (p.horizontalGrooves) drawHorizontalGrooves(mctx, size, seed);

  const map = toTexture(mctx);
  const roughnessMap = toTexture(rctx);
  const normalMap = heightToNormal(height, size, p.nStr);
  const rep = p.repeat || 2;
  map.repeat.set(rep, rep);
  roughnessMap.repeat.set(rep, rep);
  normalMap.repeat.set(rep, rep);
  return { map, normalMap, roughnessMap, nStr: p.nStr };
}