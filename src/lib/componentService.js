import { base44 } from '@/api/base44Client';
import {
  STONE_TYPES as HARDCODED_STONES,
  PANELS as HARDCODED_PANELS,
  FRAMES as HARDCODED_FRAMES,
  SLABS as HARDCODED_SLABS,
  HEADSTONE_TOPS as HARDCODED_HEADSTONES,
} from '@/lib/tombstoneOptions';

// Load all active parts from the DB, grouped by category
export async function loadDynamicParts() {
  try {
    const parts = await base44.entities.TombstonePart.list('-order', 200);
    const active = parts.filter((p) => p.is_active !== false);
    return {
      headstone: active.filter((p) => p.category === 'headstone'),
      slab: active.filter((p) => p.category === 'slab'),
      frame: active.filter((p) => p.category === 'frame'),
      base: active.filter((p) => p.category === 'base'),
    };
  } catch {
    return { headstone: [], slab: [], frame: [], base: [] };
  }
}

// Load all active stones from the DB
export async function loadDynamicStones() {
  try {
    const stones = await base44.entities.TombstoneStone.list('-order', 100);
    return stones.filter((s) => s.is_active !== false);
  } catch {
    return [];
  }
}

// Convert a DB part record to the option format used by tombstoneGeometry.js
export function dbPartToOption(part) {
  return {
    id: part.id,
    name: part.name,
    geom: part.geom,
    height: part.height || 0.1,
    desc: part.description || '',
    overrideColor: part.override_color || undefined,
    price: part.price || 0,
    _dynamic: true,
  };
}

// Convert a DB stone record to the STONE_TYPES format
export function dbStoneToOption(stone) {
  return {
    id: stone.id,
    name: stone.name,
    desc: stone.description || '',
    swatch: stone.swatch || `linear-gradient(135deg, ${stone.color} 0%, ${stone.color} 100%)`,
    kind: stone.kind,
    color: stone.color,
    roughness: stone.roughness ?? 0.5,
    metalness: stone.metalness ?? 0,
    polish: stone.polish ?? 0.5,
    clearcoat: stone.clearcoat ?? 0,
    clearcoatRoughness: stone.clearcoat_roughness ?? 0.1,
    price: stone.price || 0,
    _dynamic: true,
  };
}

// Merge dynamic parts with hardcoded ones (dynamic first, then hardcoded)
export function mergeParts(dynamic, hardcoded) {
  return [...dynamic.map(dbPartToOption), ...hardcoded];
}

export function mergeStones(dynamic, hardcoded) {
  return [...dynamic.map(dbStoneToOption), ...hardcoded];
}

// Convenience: load everything and return merged option sets
export async function loadMergedOptions() {
  const [dynParts, dynStones] = await Promise.all([loadDynamicParts(), loadDynamicStones()]);
  return {
    stones: mergeStones(dynStones, HARDCODED_STONES),
    panels: mergeParts(dynParts.base, HARDCODED_PANELS),
    frames: mergeParts(dynParts.frame, HARDCODED_FRAMES),
    slabs: mergeParts(dynParts.slab, HARDCODED_SLABS),
    headstones: mergeParts(dynParts.headstone, HARDCODED_HEADSTONES),
  };
}