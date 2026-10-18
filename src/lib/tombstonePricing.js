import { STONE_TYPES, TOMBSTONE_TYPES, PANELS, FRAMES, SLABS, HEADSTONE_TOPS, ACCESSORIES, LETTERING_TYPES } from '@/lib/tombstoneOptions';

const BASE_PRICES = {
  tombstone_type: { small: 3500, regular: 5500, family: 8500, double: 7500, custom: 7000, reopen_family: 9000, reopen_living: 6500, adjacent: 8000 },
  stone_mult: { black_granite: 1.3, turkish_marble: 1.0, hebron: 0.9, halila: 1.15, sardo: 1.2, red_stone: 1.25, orion_belen: 1.1, white_marble: 1.05, grey_tuvza: 0.95 },
  panel: {
    panel_10: 400, panel_15: 550, flooring: 300, flooring_raise: 700,
    raise_5_black: 500, raise_10_black: 800, raise_5_grey: 450, raise_10_grey: 750,
    raise_5_hebron: 480, raise_10_hebron: 780, raise_5_sardo: 520, raise_10_sardo: 820,
    raise_5_red: 550, raise_10_red: 850, panel_connect_plate: 950, panel_connect_garden: 1050,
  },
  frame: {
    frame_25_rock: 600, frame_designed: 800,
    frame_raise_10_black: 650, frame_raise_5_grey: 350, frame_raise_10_grey: 600,
    frame_raise_5_sardo: 400, frame_raise_10_sardo: 650, frame_raise_5_hebron: 380, frame_raise_10_hebron: 630,
    frame_raise_5_red: 420, frame_raise_10_red: 680, frame_raise_custom: 700, frame_raise_20_15: 900,
    frame_conn_smooth_plate: 1100, frame_conn_smooth_garden: 1200, frame_conn_rock_plate: 1250, frame_conn_rock_garden: 1350,
    frame_special_smooth: 950, frame_special_rock: 1050, frame_clip: 850,
  },
  slab: {
    slab_4: 350, slab_8_smooth: 600, slab_8_rock: 750, slab_8_frez: 700, slab_8_slope: 680,
    slab_10: 800, slab_10_slope: 850, slab_10_7: 780,
    slab_bench_15_smooth: 950, slab_bench_15_rock: 1100, slab_bench_15_slope: 1050, slab_bench_steps: 1300, slab_bench_solid: 1200,
    slab_cover_black: 650, slab_cover_red: 700,
    slab_divided_2: 750, slab_divided_length: 780, slab_divided_width: 780,
    slab_divided_2_wave_length: 850, slab_divided_2_wave_width: 850,
    slab_two_garden: 900, slab_strip_thin: 400, slab_strip_thick: 550, slab_slope: 680,
    slab_garden_inner_45_60: 1000, slab_designed_typical: 1150, slab_garden_resting: 950, slab_designed_typical_2: 1200,
  },
  headstone: { standing: 1200, open_book: 1800, pillow: 1000, heart: 1600, double_hearts: 2000, chiseled: 1400, slanted: 1300, arch: 2200 },
};

const VAT_RATE = 0.17;

function stoneMultFor(design, field) {
  const stoneId = design[field] || design.stoneType;
  return BASE_PRICES.stone_mult[stoneId] || 1.0;
}

export function calcPrice(design) {
  const tt = TOMBSTONE_TYPES.find((t) => t.id === design.tombstoneType) || TOMBSTONE_TYPES[1];
  const bodyMult = BASE_PRICES.stone_mult[design.stoneType] || 1.0;
  let total = (BASE_PRICES.tombstone_type[tt.id] || 5500) * bodyMult;
  const panelLayers = Array.isArray(design.panel) ? design.panel : [design.panel];
  const panelPrice = panelLayers.reduce((sum, id) => sum + (BASE_PRICES.panel[id] || 400), 0);
  total += panelPrice * stoneMultFor(design, 'panelStone');
  const frameLayers = Array.isArray(design.frame) ? design.frame : [design.frame];
  const framePrice = frameLayers.reduce((sum, id) => sum + (BASE_PRICES.frame[id] || 500), 0);
  total += framePrice * stoneMultFor(design, 'frameStone');
  const slabLayers = Array.isArray(design.slab) ? design.slab : [design.slab];
  const slabPrice = slabLayers.reduce((sum, id) => sum + (BASE_PRICES.slab[id] || 400), 0);
  total += slabPrice * stoneMultFor(design, 'slabStone');
  const hsLayers = Array.isArray(design.headstoneTop) ? design.headstoneTop : [design.headstoneTop];
  const hsPrice = hsLayers.reduce((sum, id) => sum + (BASE_PRICES.headstone[id] || 1200), 0);
  total += hsPrice * stoneMultFor(design, 'headstoneStone');
  (design.accessories || []).forEach((accId) => {
    const acc = ACCESSORIES.find((a) => a.id === accId);
    if (acc) total += acc.price;
  });
  const lettering = LETTERING_TYPES.find((l) => l.id === design.letteringType);
  if (lettering && design.engravingText) {
    total += (design.engravingText.replace(/\s/g, '').length) * (lettering.pricePerChar || 15);
  }
  if (design.nerHouse) {
    const nerPrices = { small: 900, medium: 1200, large: 1600 };
    total += nerPrices[design.nerHouseSize] || 1200;
  }
  if (design.customImageUrl) total += 500;
  const beforeVat = Math.round(total);
  const withVat = Math.round(total * (1 + VAT_RATE));
  return { beforeVat, withVat, vat: withVat - beforeVat };
}

export function formatPrice(n) {
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n) + ' ₪';
}