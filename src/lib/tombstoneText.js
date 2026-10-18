import * as THREE from 'three';

function luminance(hex) {
  const c = new THREE.Color(hex);
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const r = Math.round(Math.max(0, Math.min(255, c.r * 255 + amt)));
  const g = Math.round(Math.max(0, Math.min(255, c.g * 255 + amt)));
  const b = Math.round(Math.max(0, Math.min(255, c.b * 255 + amt)));
  return `rgb(${r},${g},${b})`;
}

function drawText(ctx, text, x, y, style, stone) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  const isDark = luminance(stone.color || '#888') < 0.18;

  if (style === 'recessed') {
    if (isDark) {
      // On polished black granite: bright white/silver engraved letters
      // Outer dark halo (depth shadow)
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillText(text, x + 1, y + 2);
      // Main bright letter body
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#f0f0f0';
      ctx.fillText(text, x, y);
      // Silver highlight on top edge
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = -1.5;
      ctx.fillText(text, x, y - 1);
    } else {
      // On light stone: darkened recessed letters
      ctx.fillStyle = shade(stone.color || '#e8e6e1', -75);
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 7;
      ctx.shadowOffsetY = 3;
      ctx.fillText(text, x, y);
      ctx.shadowColor = 'rgba(255,255,255,0.25)';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = -1;
      ctx.fillText(text, x, y);
    }
  } else if (style === 'raised') {
    ctx.fillStyle = shade(stone.color || '#e8e6e1', 40);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillText(text, x, y);
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = -1.5;
    ctx.fillText(text, x, y);
  } else if (style === 'gold') {
    const grad = ctx.createLinearGradient(0, y - 50, 0, y + 16);
    grad.addColorStop(0, '#ffe9a8');
    grad.addColorStop(0.5, '#d4af37');
    grad.addColorStop(1, '#9a7b1f');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillText(text, x, y);
  } else if (style === 'blue') {
    // Blue painted engraving — recessed with blue fill
    ctx.fillStyle = '#1a4a8a';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillText(text, x, y);
    ctx.shadowColor = 'rgba(255,255,255,0.2)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = -1;
    ctx.fillStyle = 'rgba(80,140,200,0.4)';
    ctx.fillText(text, x, y);
  } else if (style === 'black') {
    // Deep black painted engraving — high contrast like real cemetery engraving
    // Dark shadow for depth simulation (recessed carving)
    ctx.fillStyle = '#000000';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillText(text, x + 1, y + 2);
    // Main stark black letter body
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x, y);
    // Subtle top highlight for carved depth
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText(text, x, y - 1);
  } else if (style === 'bronze') {
    const grad = ctx.createLinearGradient(0, y - 50, 0, y + 16);
    grad.addColorStop(0, '#e8b07a');
    grad.addColorStop(0.5, '#b07d3c');
    grad.addColorStop(1, '#6e4a1e');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

function wrapText(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function makeTextTexture(rawText, style, stone, canvasW = 1024, textScale = 1) {
  const W = canvasW, H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const lines = (rawText || '').split('\n').filter(Boolean);
  if (lines.length === 0) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }

  const scale = W / 1024;
  const cx = W / 2;
  // Auto-enlarge short text (single short word like "אמא") for big, clear headstone lettering
  const isShortText = lines.length === 1 && [...lines[0]].length <= 8;
  const baseFirstPx = isShortText ? 200 : 96;
  // Compute all wrapped lines with their font sizes first, to center vertically
  const layout = [];
  lines.forEach((line, i) => {
    const isFirst = i === 0;
    const fontPx = (isFirst ? baseFirstPx : 56) * Math.max(0.6, scale) * textScale;
    const fontFamily = isFirst
      ? `bold ${fontPx}px Georgia, "Times New Roman", serif`
      : `${fontPx}px Georgia, "Times New Roman", serif`;
    ctx.font = fontFamily;
    const wrapped = isFirst ? [line] : wrapText(ctx, line, W * 0.86);
    wrapped.forEach((ln) => {
      layout.push({ text: ln, fontPx, fontFamily, isFirst, lineGap: (isFirst ? 120 : 78) * Math.max(0.6, scale) });
    });
  });

  // Total height
  let totalH = 0;
  layout.forEach((item, i) => {
    totalH += item.lineGap;
    if (i === layout.length - 1) totalH += item.fontPx * 0.3;
  });

  let y = (H - totalH) / 2 + layout[0].lineGap / 2;
  layout.forEach((item) => {
    ctx.font = item.fontFamily;
    drawText(ctx, item.text, cx, y, style, stone);
    y += item.lineGap;
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}