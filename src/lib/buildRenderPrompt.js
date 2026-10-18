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

const STONE_DESC = {
  black_granite: 'polished black granite with a mirror finish',
  turkish_marble: 'Turkish grey marble with subtle horizontal veining',
  hebron: 'Hebron chiseled limestone with rust-colored veins',
  halila: 'warm beige Halila marble with fossil details',
  sardo: 'Sardo grey granite with a salt-and-pepper speckled pattern',
  red_stone: 'rich deep red granite',
  orion_belen: 'Orion Blue granite, dark blue-black with silver streaks',
  white_marble: 'white Carrara marble with fine elegant grey veining',
  grey_tuvza: 'grey rough-pitched quarried stone with visible mortar lines',
};

const TOMBSTONE_TYPE_DESC = {
  small: 'a small single-grave memorial',
  regular: 'a standard single-grave tombstone',
  family: 'a wide family tombstone spanning multiple graves',
  double: 'a double tombstone for two graves',
  custom: 'a custom-sized tombstone',
  reopen_family: 'a family reopening memorial',
  reopen_living: 'a living memorial tombstone',
  adjacent: 'a tombstone connected to adjacent memorials',
};

const HEADSTONE_DESC = {
  standing: 'an upright rectangular standing headstone slab',
  open_book: 'an open-book-shaped headstone with two angled pages',
  pillow: 'a pillow-shaped rounded-top headstone',
  heart: 'a sculptural heart-shaped headstone on a tapered pedestal',
  flat_heart: 'a flat heart shape lying on the cover slab',
  double_hearts: 'twin intertwined heart-shaped headstones',
  chiseled: 'a rustic chiseled-frame headstone with rough texture',
  slanted: 'a slanted modern angled headstone',
  arch: 'an arched headstone supported by two columns',
};

const SLAB_DESC = {
  slab_full_solid: 'a solid flat cover slab',
  slab_split_pebbles: 'a split cover slab with a central channel filled with white river pebbles',
  slab_split_straight: 'a split cover slab with a straight central channel',
  slab_slanted: 'a slanted cover slab with a foot slope',
  slab_raised_center: 'a cover slab with a raised central section',
  slab_bench: 'a bench-style cover slab with a backrest',
  slab_bench_rock: 'a rough-pitched bench-style cover slab',
  slab_bench_slope: 'a sloped bench-style cover slab',
  slab_bench_steps: 'a stepped bench-style cover slab',
  slab_garden: 'a cover slab with a central garden planting area',
  slab_garden_inner: 'a cover slab with an inner garden frame',
  slab_strip: 'a narrow strip cover slab',
  slab_glass_divider: 'a cover slab with a glass divider strip',
  slab_crystal_strip: 'a cover slab with a crystal strip',
};

const FRAME_DESC = {
  wall_rock_pitch: 'rough-pitched rock-faced frame walls with a smooth polished cap',
  wall_grooved: 'frame walls with decorative grooved horizontal lines',
  wall_smooth: 'smooth polished frame walls',
  wall_connection: 'connection frame walls with a center plate',
  wall_connection_rock: 'rough-pitched connection frame walls with a center plate',
  wall_glass_divider: 'frame walls with glass divider strips',
};

const ACCESSORY_DESC = {
  candle_1: 'a single memorial candle lantern',
  candle_2: 'a memorial lantern for two candles',
  candle_3: 'a memorial lantern for three candles',
  planter: 'a stone planter vase',
  candle_special: 'a specially designed memorial lantern',
  candle_solar: 'a solar-powered memorial light',
  candle_solar_combo: 'a combined solar memorial light',
  planter_marble: 'a white marble planter vase',
  planter_granite: 'a black granite planter vase',
  pebbles_white: 'white river pebbles',
  pebbles_black: 'black river pebbles',
  candle_2_medium_2: 'a pair of medium memorial lanterns',
  candle_2_3: 'a pair of memorial lanterns for three candles',
};

const LETTERING_DESC = {
  engraving: 'recessed engraving',
  engraving_paint: 'painted recessed engraving',
  engraving_blue: 'blue-painted recessed engraving',
  engraving_black: 'black-painted recessed engraving',
  natural_engraving: 'natural unpainted recessed engraving',
  lead: 'raised lead letters',
  lead_raised: 'prominent raised lead letters',
  raised_letters: 'raised protruding letters',
  bronze_letters: 'bronze metal letters',
  reverse_spray: 'reverse-sprayed engraving on black granite',
  cnc_raised: 'CNC-milled raised name',
};

function findOpt(list, id) {
  return list.find((x) => x.id === id);
}

function stoneDesc(stoneId) {
  return STONE_DESC[stoneId] || 'natural stone';
}

function geomDesc(map, geom) {
  return map[geom] || '';
}

export function buildRenderPrompt(design) {
  const stone = findOpt(STONE_TYPES, design.stoneType);
  const tt = findOpt(TOMBSTONE_TYPES, design.tombstoneType);
  const panelIds = Array.isArray(design.panel) ? design.panel : [design.panel];
  const panel = panelIds.map(id => findOpt(PANELS, id)).filter(Boolean);
  const frameIds = Array.isArray(design.frame) ? design.frame : [design.frame];
  const frame = frameIds.map(id => findOpt(FRAMES, id)).filter(Boolean);
  const slabIds = Array.isArray(design.slab) ? design.slab : [design.slab];
  const slab = slabIds.map(id => findOpt(SLABS, id)).filter(Boolean);
  const hsIds = Array.isArray(design.headstoneTop) ? design.headstoneTop : [design.headstoneTop];
  const hs = hsIds.map(id => findOpt(HEADSTONE_TOPS, id)).filter(Boolean);
  const lettering = findOpt(LETTERING_TYPES, design.letteringType);

  const parts = [];

  // === IMAGE LAYOUT GUIDE ===
  // The first image in existing_image_urls is the 3D preview screenshot — use it ONLY for
  // structure, proportions, component layout, and engraving placement.
  // The remaining images are REAL photographs of actual tombstones — use them as the
  // style and quality reference for material texture, lighting, depth, and photorealism.
  parts.push('You are given multiple reference images. The FIRST image is a 3D design preview — use it ONLY to determine the exact structure, proportions, component layout, stone color, and text placement of the tombstone. The REMAINING images are real photographs of actual tombstones in a cemetery — use them as your QUALITY and PHOTOREALISM target. Your output must match the 3D preview in structure, but match the real photos in material fidelity, lighting, depth, and photorealistic quality.');

  // === PHOTOREALISTIC QUALITY DIRECTIVES ===
  parts.push('Produce a hyper-realistic, photograph-quality image that looks like it was taken with a professional camera in a real cemetery. The stone must look like real physical stone — heavy, solid, with weight and mass. NOT a 3D model, NOT a render, NOT flat or synthetic.');
  parts.push('MATERIAL FIDELITY: The polished stone surfaces must show natural stone texture — subtle veining, mineral grain, micro-imperfections, and a realistic sheen that catches light. The rough/chiseled edges must look genuinely rough-hewn with irregular jagged texture, deep crevices, and natural fracturing — NOT smooth or low-poly. The transition between polished tops and rough sides must be organic and natural.');
  parts.push('LIGHTING: Use natural outdoor sunlight — bright, directional, casting sharp realistic shadows on the ground. The light should create deep contrast between highlight and shadow on the stone surfaces, emphasizing the texture and depth of the material. Add ambient occlusion where the stone meets the ground and in crevices between components.');
  parts.push('ENVIRONMENT INTEGRATION: The tombstone must sit naturally on real cemetery ground — dry packed earth, dirt, gravel. Add soft contact shadows at the base where the stone meets the ground. The background should be a real cemetery with other monuments visible out of focus (shallow depth of field). The stone must NOT look pasted or floating — it must look firmly grounded.');
  parts.push('TEXT ENGRAVING: The Hebrew text must look deeply carved into the stone — recessed, with dark shadow depth inside the carved letters, high contrast against the stone surface. NOT a flat overlay or decal. The letters should follow the contour and texture of the stone surface.');
  parts.push('Do NOT add any elements not present in the 3D preview image — no extra masonry layers, no decorative borders, no garden elements, no additional text. Match the 3D preview structure EXACTLY.');

  // Main stone material — supporting detail
  const mainStone = stone ? stoneDesc(stone.id) : 'natural stone';
  parts.push(`The primary stone material (as seen in the 3D preview) is ${mainStone}. Render this material with the same photorealistic texture quality shown in the real reference photos — natural veining, polished sheen on flat surfaces, and rough chiseled texture on edges.`);

  // Per-part stones
  const panelStoneDesc = stoneDesc(design.panelStone || design.stoneType);
  const frameStoneDesc = stoneDesc(design.frameStone || design.stoneType);
  const slabStoneDesc = stoneDesc(design.slabStone || design.stoneType);
  const hsStoneDesc = stoneDesc(design.headstoneStone || design.stoneType);

  // Structure — concise supporting detail
  if (panel.length > 0) {
    const panelNames = panel.map(p => p.name).join(' stacked on ');
    parts.push(`The base consists of ${panelNames} in ${panelStoneDesc}, stacked from bottom to top — match the reference image's base shape and layer heights exactly.`);
  }
  if (frame.length > 0) {
    const frameNames = frame.map(f => f.name).join(' stacked on ');
    const fd = geomDesc(FRAME_DESC, frame[0].geom) || 'frame walls';
    parts.push(`The surrounding frame consists of ${frameNames} in ${frameStoneDesc} (${fd}) — match the reference image's frame exactly.`);
  }
  if (slab.length > 0) {
    const slabNames = slab.map(s => s.name).join(' stacked on ');
    const sd = geomDesc(SLAB_DESC, slab[0].geom) || 'a cover slab';
    parts.push(`The cover slab is ${slabNames} in ${slabStoneDesc} (${sd}) — match the reference image's slab exactly.`);
  }
  if (hs.length > 0) {
    const hsNames = hs.map(h => h.name).join(' and ');
    const hd = HEADSTONE_DESC[hs[0].id] || 'a headstone';
    const placement = design.headstonePlacement === 'sides'
      ? 'two headstones placed at the sides'
      : hs.length > 1 ? `${hs.length} headstones placed side by side at the back`
      : 'a headstone at the center back';
    parts.push(`The headstone is ${hsNames} in ${hsStoneDesc} (${hd}), ${placement} — match the reference image's headstone shape exactly.`);
  }

  // Engraving
  if (design.engravingText) {
    const ld = lettering ? (LETTERING_DESC[lettering.id] || 'engraving') : 'engraving';
    const cleanText = design.engravingText.replace(/\n/g, ' ').trim();
    parts.push(`The headstone features ${ld} with this exact Hebrew text: "${cleanText}". Render the text clearly and accurately.`);
  }

  // Slab text
  if (design.slabText) {
    const cleanSlab = design.slabText.replace(/\n/g, ' ').trim();
    parts.push(`The cover slab has this Hebrew engraving: "${cleanSlab}".`);
  }

  // Accessories — only if present in the design
  if (design.accessories && design.accessories.length > 0) {
    const accDescs = design.accessories
      .map((aId) => {
        const acc = findOpt(ACCESSORIES, aId);
        return ACCESSORY_DESC[aId] || acc?.name || '';
      })
      .filter(Boolean);
    if (accDescs.length > 0) {
      parts.push(`On the slab are ${accDescs.join(', ')} — only these accessories, placed as in the reference image.`);
    }
  }

  // Memorial candle house
  if (design.nerHouse) {
    const nerPos = design.nerHouse === 'front' ? 'at the front of the slab' : 'behind the headstone';
    parts.push(`A memorial candle house (${design.nerHouseSize || 'medium'} size) is placed ${nerPos}.`);
  }

  // Environment & photography — match the real reference photos
  parts.push('Place the tombstone in a real Israeli cemetery setting matching the atmosphere of the real reference photos: dry packed earth ground, natural daylight with sharp directional shadows, other monuments softly blurred in the background, shallow depth of field focusing on this tombstone.');
  parts.push('Professional cemetery photography, shot with a DSLR camera at eye level, 50mm lens, natural color grading, high dynamic range, 8k resolution. The image should be indistinguishable from a real photograph.');

  return parts.join(' ');
}