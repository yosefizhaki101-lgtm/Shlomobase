export const PART_STEPS = [
  { number: 1, name: 'יסוד / בסיס' },
  { number: 2, name: 'תושבת / קריפטה' },
  { number: 3, name: 'דפנות / קירות' },
  { number: 4, name: 'פלטת כיסוי' },
  { number: 5, name: 'כרית / תושבת ראש' },
  { number: 6, name: 'אבן ראש המצבה' },
];

export const PARTS = [
  { step_number: 1, part_id: 'base_concrete', part_label: 'בסיס בטון חלק' },
  { step_number: 1, part_id: 'base_single_tier', part_label: 'בסיס שיש/גרניט היקפי' },
  { step_number: 1, part_id: 'base_double_tier', part_label: 'בסיס מדורג כפול' },
  { step_number: 1, part_id: 'base_triple_tier', part_label: 'בסיס מדורג משולש' },
  { step_number: 1, part_id: 'base_chiseled', part_label: 'בסיס סלעי/פראי' },
  { step_number: 1, part_id: 'base_floating', part_label: 'בסיס צף' },
  { step_number: 1, part_id: 'base_beveled', part_label: 'בסיס משופע' },
  { step_number: 1, part_id: 'base_planters', part_label: 'בסיס מורכב עם ערוגות' },

  { step_number: 2, part_id: 'crypt_straight', part_label: 'תושבת ישרה נקייה' },
  { step_number: 2, part_id: 'crypt_beveled', part_label: 'תושבת קטומה' },
  { step_number: 2, part_id: 'crypt_tiered', part_label: 'תושבת מדורגת' },
  { step_number: 2, part_id: 'crypt_chiseled', part_label: 'תושבת מסותתת' },
  { step_number: 2, part_id: 'crypt_dual_tone', part_label: 'תושבת משולבת גוונים' },
  { step_number: 2, part_id: 'crypt_curved', part_label: 'תושבת קמורה/מעוגלת' },
  { step_number: 2, part_id: 'crypt_inset', part_label: 'תושבת שקועה' },
  { step_number: 2, part_id: 'crypt_candle_niche', part_label: 'תושבת עם בית נר' },

  { step_number: 3, part_id: 'wall_smooth', part_label: 'דפנות חלקות מבריקות' },
  { step_number: 3, part_id: 'wall_rock_pitch', part_label: 'דפנות מסותתות פראיות' },
  { step_number: 3, part_id: 'wall_half_chiseled', part_label: 'דפנות חצי מסותתות' },
  { step_number: 3, part_id: 'wall_grooved', part_label: 'דפנות מחורצות' },
  { step_number: 3, part_id: 'wall_tapered', part_label: 'דפנות בשיפוע פנימי' },
  { step_number: 3, part_id: 'wall_pebble_insert', part_label: 'דפנות משולבות אבני נחל' },
  { step_number: 3, part_id: 'wall_mixed_stone', part_label: 'דפנות מעורבות (דו-גווניות)' },
  { step_number: 3, part_id: 'wall_rounded_corners', part_label: 'דפנות פינות עגולות' },

  { step_number: 4, part_id: 'slab_full_solid', part_label: 'פלטה שלמה יחידה' },
  { step_number: 4, part_id: 'slab_split_straight', part_label: 'פלטה חצויה ישרה' },
  { step_number: 4, part_id: 'slab_split_pebbles', part_label: 'פלטה חצויה עם אבני נחל' },
  { step_number: 4, part_id: 'slab_split_garden', part_label: 'פלטה חצויה עם ערוגת צמחייה' },
  { step_number: 4, part_id: 'slab_wave_curve', part_label: 'פלטת גל (S-Curve)' },
  { step_number: 4, part_id: 'slab_raised_center', part_label: 'פלטה מדורגת מורמת' },
  { step_number: 4, part_id: 'slab_slanted', part_label: 'פלטה משופעת' },
  { step_number: 4, part_id: 'slab_vase_niche', part_label: 'פלטה עם שקע פיסולי/אגרטל' },

  { step_number: 5, part_id: 'pillow_none', part_label: 'ללא כרית' },
  { step_number: 5, part_id: 'pillow_flat_block', part_label: 'כרית מלבנית ישרה' },
  { step_number: 5, part_id: 'pillow_slanted', part_label: 'כרית משופעת' },
  { step_number: 5, part_id: 'pillow_stepped', part_label: 'כרית מדורגת' },
  { step_number: 5, part_id: 'pillow_curved', part_label: 'כרית מעוגלת/פיסולית' },
  { step_number: 5, part_id: 'pillow_chiseled', part_label: 'כרית מסותתת' },
  { step_number: 5, part_id: 'pillow_double_wide', part_label: 'כרית כפולה' },
  { step_number: 5, part_id: 'pillow_integrated_vases', part_label: 'כרית משולבת בתי נר/אגרטלים' },

  { step_number: 6, part_id: 'headstone_classic_rect', part_label: 'לוח מלבני קלאסי' },
  { step_number: 6, part_id: 'headstone_dome_top', part_label: 'לוח עם פינות מעוגלות/גליות' },
  { step_number: 6, part_id: 'headstone_single_heart', part_label: 'סגנון לב יחיד פיסולי' },
  { step_number: 6, part_id: 'headstone_double_hearts', part_label: 'סגנון לבבות משולבים' },
  { step_number: 6, part_id: 'headstone_open_book', part_label: 'ספר פתוח' },
  { step_number: 6, part_id: 'headstone_chiseled_frame', part_label: 'אבן ראש מסותתת היקפית' },
  { step_number: 6, part_id: 'headstone_slanted_modern', part_label: 'אבן ראש אלכסונית/אסימטרית' },
  { step_number: 6, part_id: 'headstone_arch_columns', part_label: 'אבן ראש כפולה (עמודים/קשת)' },
];

export const DEFAULT_PARTS = {
  1: 'base_single_tier',
  2: 'crypt_straight',
  3: 'wall_rock_pitch',
  4: 'slab_split_pebbles',
  5: 'pillow_slanted',
  6: 'headstone_classic_rect',
};

export function partsForStep(n) {
  return PARTS.filter((p) => p.step_number === n);
}

export function getPartLabel(id) {
  const p = PARTS.find((x) => x.part_id === id);
  return p ? p.part_label : id;
}