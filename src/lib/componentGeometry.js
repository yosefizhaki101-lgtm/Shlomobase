// Geometry types available for each part category — maps to tombstoneGeometry.js builders
export const PART_GEOMETRIES = {
  headstone: [
    { id: 'headstone_classic_rect', name: 'לוח זקוף קלאסי' },
    { id: 'headstone_dome_top', name: 'כרית מעוגלת' },
    { id: 'headstone_single_heart', name: 'לב יחיד' },
    { id: 'headstone_double_hearts', name: 'לבבות משולבים' },
    { id: 'headstone_open_book', name: 'ספר פתוח' },
    { id: 'headstone_chiseled_frame', name: 'מסותתת' },
    { id: 'headstone_slanted_modern', name: 'אלכסונית מודרנית' },
    { id: 'headstone_arch_columns', name: 'כפולה עם עמודים וקשת' },
  ],
  slab: [
    { id: 'slab_full_solid', name: 'פלטה מלאה חלקה' },
    { id: 'slab_split_pebbles', name: 'מחולק עם חצץ/אבנים' },
    { id: 'slab_split_straight', name: 'מחולק ישר' },
    { id: 'slab_slanted', name: 'משופה (שיפוע ברגליים)' },
    { id: 'slab_raised_center', name: 'מוגבה במרכז' },
    { id: 'slab_bench', name: 'מסעד חלק' },
    { id: 'slab_bench_rock', name: 'מסעד טובזה' },
    { id: 'slab_bench_slope', name: 'מסעד משופה' },
    { id: 'slab_bench_steps', name: 'מסעד עם מדרגות' },
    { id: 'slab_garden', name: 'גינה (שתי פלטות)' },
    { id: 'slab_garden_inner', name: 'גינה פנימית' },
    { id: 'slab_strip', name: 'פס דק/עבה' },
    { id: 'slab_glass_divider', name: 'מחלק זכוכית' },
    { id: 'slab_crystal_strip', name: 'פס קריסטל' },
  ],
  frame: [
    { id: 'wall_smooth', name: 'חלק / מלוטש' },
    { id: 'wall_rock_pitch', name: 'טובזה פראית (מחוספס)' },
    { id: 'wall_grooved', name: 'מחורץ (קווים)' },
    { id: 'wall_glass_divider', name: 'מחלק זכוכית' },
    { id: 'wall_connection', name: 'חיבור חלק' },
    { id: 'wall_connection_rock', name: 'חיבור טובזה' },
  ],
  base: [
    { id: 'base_single_tier', name: 'קומה יחידה' },
    { id: 'base_concrete', name: 'ריצוף' },
    { id: 'base_double_tier', name: 'קומה כפולה' },
    { id: 'base_beveled', name: 'משופה (beveled)' },
    { id: 'base_tuvza', name: 'טובזה' },
    { id: 'base_glass_crystal', name: 'זכוכית וקריסטל' },
  ],
};

export const STONE_KINDS = [
  { id: 'granite', name: 'גרניט' },
  { id: 'marble', name: 'שיש עם ורידים' },
  { id: 'turkish_grey', name: 'טורקי אפור (קווים אופקיים)' },
  { id: 'pure_white_marble', name: 'שיש לבן נקי' },
  { id: 'black_marble', name: 'שיש שחור' },
  { id: 'mirror_black', name: 'שחור מראה' },
  { id: 'orion_blue', name: 'אוריון בלו' },
  { id: 'halila', name: 'חלילה' },
  { id: 'tuvza', name: 'טובזה (מחוספס)' },
  { id: 'hebron', name: 'חברון' },
  { id: 'concrete', name: 'בטון' },
  { id: 'sandstone', name: 'אבן חול' },
  { id: 'bronze', name: 'ברונזה' },
];

export const CATEGORY_LABELS = {
  headstone: 'אבן ראש',
  slab: 'פלטת כיסוי',
  frame: 'מסגרת / סביבון',
  base: 'יסוד / בסיס',
};

export const CATEGORY_DESCRIPTIONS = {
  headstone: 'הלוח העומד בראש המצבה — לכתיבת שם הנפטר/ה, תאריכים וכיתוב אישי',
  slab: 'הפלטה המופלסת הסוגרת את המצבה בחלקה העליון',
  frame: 'המסגרת ההיקפית המגדירה את נפח ומבנה גוף המצבה',
  base: 'משטח הבסיס המונח על הקרקע ומייצב את מבנה המצבה כולה',
};