export const COLORS = [
  { id: 'white', name: 'לבן', hex: '#ffffff', swatch: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)' },
  { id: 'light_grey', name: 'טורקי', hex: '#DCDCDA', swatch: 'linear-gradient(135deg, #E7E7E5 0%, #C4C4C2 100%)' },
  { id: 'grey', name: 'סרדו', hex: '#9B9C9E', swatch: 'linear-gradient(135deg, #ABABAD 0%, #84868A 100%)' },
  { id: 'dark_grey', name: 'אפור כהה', hex: '#5d6364', swatch: 'linear-gradient(135deg, #6d7374 0%, #4d5354 100%)' },
  { id: 'black', name: 'שחור', hex: '#0a0a0a', swatch: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' },
  { id: 'red', name: 'אדום', hex: '#6F2024', swatch: 'linear-gradient(135deg, #7E2528 0%, #541418 100%)' },
  { id: 'blue', name: 'כחול', hex: '#33404F', swatch: 'linear-gradient(135deg, #3E4C5C 0%, #26303C 100%)' },
  { id: 'beige', name: 'חלילה', hex: '#D2B68C', swatch: 'linear-gradient(135deg, #E3CCAA 0%, #B59B76 100%)' },
  { id: 'warm_beige', name: 'חברון', hex: '#D6D0CB', swatch: 'linear-gradient(135deg, #E9E4E0 0%, #BFB4AC 100%)' },
];

// גימור פני האבן — משפיע על הברק והחספוס של אותו חומר, בלי לשנות את הגוון.
// 'natural' = הגימור שמגיע עם סוג האבן (ברירת מחדל, לא משתנה).
export const FINISHES = [
  { id: 'natural', name: 'טבעי', desc: 'הגימור המקורי של האבן' },
  { id: 'matte', name: 'מט', desc: 'משטח מט, ללא החזר אור' },
  { id: 'silk', name: 'משי', desc: 'חצי מבריק, החזר אור עדין' },
  { id: 'polish', name: 'מבריק', desc: 'ליטוש מלא, החזר אור חזק' },
  { id: 'polish_rock_edges', name: 'מבריק + צדדים מחוספסים', desc: 'משטח עליון מלוטש וצדדים בסיתות גס' },
];

export const STONE_TYPES = [
  {
    id: 'black_granite',
    name: 'גרניט שחור',
    desc: 'גרניט שחור אבסולוט מבריק - סיום מראה',
    swatch: 'linear-gradient(135deg, #1c1c1e 0%, #08080a 100%)',
    kind: 'mirror_black',
    color: '#020304',
    roughness: 0.01,
    metalness: 0.02,
    polish: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  },
  {
    id: 'turkish_marble',
    name: 'טורקי',
    desc: 'שיש טורקי בגוון אפור־לבן קריר עם ורידים דקים וגימור מבריק',
    swatch: 'linear-gradient(135deg, #E7E7E5 0%, #C4C4C2 100%)',
    kind: 'cloud_grey',
    color: '#DCDCDA',
    roughness: 0.14,
    metalness: 0.02,
    polish: 0.9,
  },
  {
    id: 'hebron',
    name: 'חברון',
    desc: 'אבן חברון - שמנת־אפורה חמה עם עננות וורידים עדינים',
    swatch: 'linear-gradient(135deg, #E9E4E0 0%, #BFB4AC 100%)',
    kind: 'hebron',
    color: '#D6D0CB',
    roughness: 0.45,
    metalness: 0.01,
    polish: 0.55,
  },
  {
    id: 'halila',
    name: 'חלילה',
    desc: 'אבן חלילה - בז\'־דבש חם עם גוונים עפרוניים וגימור מט',
    swatch: 'linear-gradient(135deg, #E3CCAA 0%, #B59B76 100%)',
    kind: 'halila',
    color: '#D2B68C',
    roughness: 0.74,
    metalness: 0.01,
    polish: 0.25,
  },
  {
    id: 'sardo',
    name: 'גרניט סרדו',
    desc: 'גרניט סרדו - אפור מלח ופלפל',
    swatch: 'linear-gradient(135deg, #BCBCBC 0%, #949494 100%)',
    kind: 'granite',
    color: '#A9A9A9',
    roughness: 0.25,
    metalness: 0.12,
    polish: 0.7,
  },
  {
    id: 'red_stone',
    name: 'אדום',
    desc: 'גרניט אדום בורדו עם נקודות כהות',
    swatch: 'linear-gradient(135deg, #7E2528 0%, #541418 100%)',
    kind: 'granite',
    color: '#6F2024',
    roughness: 0.28,
    metalness: 0.1,
    polish: 0.65,
  },
  {
    id: 'orion_belen',
    name: 'אוריון בלו',
    desc: 'גרניט אוריון בלו - כחול אפור עם מערבולות בהירות',
    swatch: 'linear-gradient(135deg, #3E4C5C 0%, #26303C 100%)',
    kind: 'orion_blue',
    color: '#33404F',
    roughness: 0.15,
    metalness: 0.15,
    polish: 0.85,
  },
  {
    id: 'white_marble',
    name: 'שיש קררה לבן',
    desc: 'שיש קררה לבן - ורידים אפורים אופקיים עדינים',
    swatch: 'linear-gradient(135deg, #FBFAF7 0%, #E4E1DA 100%)',
    kind: 'turkish_grey',
    color: '#F4F2EE',
    roughness: 0.08,
    metalness: 0.02,
    polish: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  },
  {
    id: 'grey_tuvza',
    name: 'טובזה אפור',
    desc: 'טובזה אפורה בהירה - גרניט מנומר בגוון אפור קריר',
    swatch: 'radial-gradient(circle at 26% 34%, #45494D 0 9%, transparent 10%), radial-gradient(circle at 66% 62%, #3E4246 0 7%, transparent 8%), radial-gradient(circle at 44% 82%, #6E7377 0 8%, transparent 9%), radial-gradient(circle at 80% 22%, #7C8185 0 6%, transparent 7%), linear-gradient(135deg, #B3B8BB 0%, #9BA1A5 100%)',
    kind: 'tuvza',
    color: '#A8ADB0',
    roughness: 0.98,
    metalness: 0,
    polish: 0.01,
  },
];

// מידות ברירת מחדל (ס"מ) לפי סוג מצבה — המידות הסטנדרטיות המקובלות בישראל:
// מצבת יחיד 75×170 (בחלק מבתי העלמין 80 רוחב), מצבה כפולה — שני קברים צמודים במבנה אחיד,
// 140×180 (במקורות 120–160 רוחב), מצבה משפחתית — שלוש חלקות ויותר, 190×190,
// ו"חצי מצבה" (מצבה קטנה) 70×70. הגובה הכולל מוגבל בדרך כלל ל-140 ס"מ מהיסוד,
// ובבתי עלמין מסוימים ל-80 או 60 ס"מ — המידות הסופיות טעונות אישור חברה קדישא.
export const TOMBSTONE_DIMENSIONS = {
  small:   { width: 70,  length: 70,  maxHeight: 140 },
  regular: { width: 75,  length: 170, maxHeight: 140 },
  family:  { width: 190, length: 190, maxHeight: 140 },
  double:  { width: 140, length: 180, maxHeight: 140 },
};

// טווחי מידות סבירים (ס"מ) לכל סוג מצבה — משמשים להגבלת שדות המידות בעורך
export const TOMBSTONE_RANGES = {
  small:   { width: [55, 80],    length: [55, 95] },
  regular: { width: [70, 85],    length: [160, 195] },
  family:  { width: [170, 260],  length: [170, 210] },
  double:  { width: [115, 165],  length: [160, 200] },
};

// ארבעת סוגי המצבות הסטנדרטיים בישראל
export const TOMBSTONE_TYPES = [
  { id: 'small', name: 'קטנה', desc: 'חצי מצבה' },
  { id: 'regular', name: 'רגילה', desc: 'קבר יחיד' },
  { id: 'family', name: 'משפחתית', desc: 'כמה חלקות סמוכות' },
  { id: 'double', name: 'כפולה', desc: 'שני קברים צמודים' },
];

export const PANELS = [
  { id: 'panel_10', name: 'פאנל 10', geom: 'base_single_tier', height: 0.1 },
  { id: 'panel_15', name: 'פאנל 15', geom: 'base_single_tier', height: 0.15 },
  { id: 'flooring', name: 'ריצוף', geom: 'base_concrete', height: 0.03 },
  { id: 'flooring_raise', name: 'ריצוף והגבהה', geom: 'base_double_tier', height: 0.08 },
  { id: 'raise_5_black', name: 'הגבהה 5 שחור', geom: 'base_beveled', height: 0.05, overrideColor: '#0a0a0a' },
  { id: 'raise_5_black_inset', name: 'הגבה 5 שחור', geom: 'base_beveled', height: 0.05, overrideColor: '#0a0a0a', insetCm: 2 },
  { id: 'raise_10_black', name: 'הגבהה 10 שחור', geom: 'base_double_tier', height: 0.1, overrideColor: '#1a1a1c' },
  { id: 'raise_5_grey', name: 'הגבהה 5 אפור', geom: 'base_beveled', height: 0.05, overrideColor: '#6e6e70' },
  { id: 'raise_10_grey', name: 'הגבהה 10 אפור', geom: 'base_double_tier', height: 0.1, overrideColor: '#6e6e70' },
  { id: 'raise_5_hebron', name: 'הגבהה 5 חברון', geom: 'base_beveled', height: 0.05, overrideColor: '#cba86b' },
  { id: 'raise_10_hebron', name: 'הגבהה 10 חברון', geom: 'base_double_tier', height: 0.1, overrideColor: '#cba86b' },
  { id: 'raise_5_sardo', name: 'הגבהה 5 סרדו', geom: 'base_beveled', height: 0.05, overrideColor: '#3a3a3e' },
  { id: 'raise_10_sardo', name: 'הגבהה 10 סרדו', geom: 'base_double_tier', height: 0.1, overrideColor: '#3a3a3e' },
  { id: 'raise_5_red', name: 'הגבהה 5 אדום', geom: 'base_beveled', height: 0.05, overrideColor: '#7a1a1a' },
  { id: 'raise_10_red', name: 'הגבהה 10 אדום', geom: 'base_double_tier', height: 0.1, overrideColor: '#7a1a1a' },
  { id: 'panel_connect_plate', name: 'פנל חיבור ופלטה אמצעית', geom: 'base_connection', height: 0.15 },
  { id: 'panel_connect_garden', name: 'פנל חיבור ומקום לגינה', geom: 'base_connection_garden', height: 0.15 },
];

export const FRAMES = [
  { id: 'frame_25_rock', name: 'מסגרת 25 טובזה', geom: 'wall_rock_pitch', height: 0.25 },
  { id: 'frame_designed', name: 'מסגרת מעוצבים', geom: 'wall_grooved', height: 0.25 },
  { id: 'frame_raise_10_black', name: 'הגבהה 10 שחור', geom: 'wall_smooth', height: 0.1, overrideColor: '#1a1a1c' },
  { id: 'frame_raise_5_grey', name: 'הגבהה 5 אפור', geom: 'wall_smooth', height: 0.05, overrideColor: '#6e6e70' },
  { id: 'frame_raise_10_grey', name: 'הגבהה 10 אפור', geom: 'wall_smooth', height: 0.1, overrideColor: '#6e6e70' },
  { id: 'frame_raise_5_sardo', name: 'הגבהה 5 סרדו', geom: 'wall_smooth', height: 0.05, overrideColor: '#3a3a3e' },
  { id: 'frame_raise_10_sardo', name: 'הגבהה 10 סרדו', geom: 'wall_smooth', height: 0.1, overrideColor: '#3a3a3e' },
  { id: 'frame_raise_5_hebron', name: 'הגבהה 5 חברון', geom: 'wall_smooth', height: 0.05, overrideColor: '#cba86b' },
  { id: 'frame_raise_10_hebron', name: 'הגבהה 10 חברון', geom: 'wall_smooth', height: 0.1, overrideColor: '#cba86b' },
  { id: 'frame_raise_5_red', name: 'הגבהה 5 אדום', geom: 'wall_smooth', height: 0.05, overrideColor: '#7a1a1a' },
  { id: 'frame_raise_10_red', name: 'הגבהה 10 אדום', geom: 'wall_smooth', height: 0.1, overrideColor: '#7a1a1a' },
  { id: 'frame_raise_custom', name: 'הגבהה לפי מידה', geom: 'wall_smooth', height: 0.18 },
  { id: 'frame_raise_20_15', name: 'הגבהה 20/15', geom: 'wall_smooth', height: 0.2 },
  { id: 'frame_conn_smooth_plate', name: 'מסגרת חיבור - חלק ופלטה אמצעית', geom: 'wall_connection', height: 0.25 },
  { id: 'frame_conn_smooth_garden', name: 'מסגרת חיבור - חלק ומקום לגינה', geom: 'wall_connection', height: 0.25 },
  { id: 'frame_conn_rock_plate', name: 'מסגרת חיבור - טובזה ופלטה אמצעית', geom: 'wall_connection_rock', height: 0.25 },
  { id: 'frame_conn_rock_garden', name: 'מסגרת חיבור - טובזה ומקום לגינה', geom: 'wall_connection_rock', height: 0.25 },
  { id: 'frame_special_smooth', name: 'מסגרת מיוחדת - חלק', geom: 'wall_smooth', height: 0.25 },
  { id: 'frame_special_rock', name: 'מסגרת מיוחדת - טובזה', geom: 'wall_rock_pitch', height: 0.25 },
  { id: 'frame_clip', name: 'מסגרת קליפה', geom: 'wall_smooth', height: 0.25 },
];

export const SLABS = [
  { id: 'slab_4', name: 'פלטה 4', geom: 'slab_full_solid', height: 0.04 },
  { id: 'slab_8_smooth', name: 'פלטה 8 - חלק', geom: 'slab_full_solid', height: 0.08 },
  { id: 'slab_8_rock', name: 'פלטה 8 - טובזה', geom: 'slab_split_pebbles', height: 0.08 },
  { id: 'slab_8_frez', name: 'פלטה 8 - פרוז', geom: 'slab_split_straight', height: 0.08 },
  { id: 'slab_8_slope', name: 'פלטה 8 - שיפוע ברגליים', geom: 'slab_slanted', height: 0.08 },
  { id: 'slab_10', name: 'פלטה 10', geom: 'slab_raised_center', height: 0.1 },
  { id: 'slab_10_slope', name: 'פלטה 10 - שיפוע ברגליים', geom: 'slab_slanted', height: 0.1 },
  { id: 'slab_10_7', name: 'פלטה 10/7', geom: 'slab_raised_center', height: 0.08 },
  { id: 'slab_bench_15_smooth', name: 'מסעד 15 - חלק', geom: 'slab_bench', height: 0.15 },
  { id: 'slab_bench_15_rock', name: 'מסעד 15 - טובזה', geom: 'slab_bench_rock', height: 0.15 },
  { id: 'slab_bench_15_slope', name: 'מסעד 15 - שיפוע ברגליים', geom: 'slab_bench_slope', height: 0.15 },
  { id: 'slab_bench_steps', name: 'מסעד עם מדרגות', geom: 'slab_bench_steps', height: 0.18 },
  { id: 'slab_cover_black', name: 'כיסוי שחור', geom: 'slab_full_solid', height: 0.08, overrideColor: '#1a1a1c' },
  { id: 'slab_cover_red', name: 'כיסוי אדום', geom: 'slab_full_solid', height: 0.08, overrideColor: '#7a1a1a' },
  { id: 'slab_divided_2', name: 'כיסוי מחולק ל-2', geom: 'slab_split_straight', height: 0.08 },
  { id: 'slab_divided_length', name: 'כיסוי מחולק לאורך', geom: 'slab_split_straight', height: 0.08 },
  { id: 'slab_divided_width', name: 'כיסוי מחולק לרוחב', geom: 'slab_split_straight', height: 0.08 },
  { id: 'slab_divided_2_wave_length', name: 'כיסוי מחולק ל-2 גל - לאורך', geom: 'slab_split_pebbles', height: 0.08 },
  { id: 'slab_divided_2_wave_width', name: 'כיסוי מחולק ל-2 גל - לרוחב', geom: 'slab_split_pebbles', height: 0.08 },
  { id: 'slab_two_garden', name: 'שתי (2) פלטות גינה', geom: 'slab_garden', height: 0.08 },
  { id: 'slab_strip_thin', name: 'פס דק לאורך', geom: 'slab_strip', height: 0.08 },
  { id: 'slab_strip_thick', name: 'פס עבה לאורך', geom: 'slab_strip', height: 0.1 },
  { id: 'slab_slope', name: 'שיפוע', geom: 'slab_slanted', height: 0.08 },
  { id: 'slab_garden_inner_45_60', name: 'פלטה פנימית גינה 45/60', geom: 'slab_garden_inner', height: 0.08 },
  { id: 'slab_designed_typical', name: 'פלטה מעוצבת טיפעי', geom: 'slab_raised_center', height: 0.1 },
  { id: 'slab_garden_resting', name: 'פלטה מונחת גינה', geom: 'slab_garden', height: 0.08 },
  { id: 'slab_bench_solid', name: 'מסעד גושני', geom: 'slab_bench', height: 0.16 },
  { id: 'slab_designed_typical_2', name: 'סלטה מעוצבת טיפעי', geom: 'slab_raised_center', height: 0.1 },
];

export const HEADSTONE_TOPS = [
  { id: 'standing', name: 'אבן עומדת', geom: 'headstone_classic_rect', desc: 'לוח זקוף קלאסי' },
  { id: 'open_book', name: 'ספר פתוח', geom: 'headstone_open_book', desc: 'סגנון ספר פתוח' },
  { id: 'pillow', name: 'כרית', geom: 'headstone_dome_top', desc: 'לוח מעוגל דמוי כרית' },
  { id: 'heart', name: 'לב', geom: 'headstone_single_heart', desc: 'סגנון לב פיסולי' },
  { id: 'flat_heart', name: 'לב שוכב', geom: 'headstone_flat_heart', desc: 'לב שוכב על הפלטה' },
  { id: 'double_hearts', name: 'לבבות משולבים', geom: 'headstone_double_hearts', desc: 'זוג לבבות' },
  { id: 'chiseled', name: 'מסותתת', geom: 'headstone_chiseled_frame', desc: 'אבן ראש מסותתת' },
  { id: 'slanted', name: 'אלכסונית', geom: 'headstone_slanted_modern', desc: 'אבן ראש אלכסונית' },
  { id: 'arch', name: 'כפולה עמודים', geom: 'headstone_arch_columns', desc: 'אבן ראש כפולה עם קשת' },
  { id: 'wave', name: 'גלית', geom: 'headstone_wave', desc: 'אבן ראש גלית מעוצבת בשכבות' },
  { id: 'marble_inset', name: 'שיש עם לוח גרניט', geom: 'headstone_marble_inset', desc: 'שיש בהיר עם לוח גרניט שחור משוקע' },
  { id: 'book_pedestal', name: 'ספר פתוח על כן', geom: 'headstone_book_pedestal', desc: 'ספר אבן פתוח על כן' },
  { id: 'tiered_marble', name: 'שיש עם כרכוב', geom: 'headstone_tiered_marble', desc: 'שיש עם כרכוב עליון ובסיס בולט' },
];

export const HEADSTONE_PLACEMENTS = [
  { id: 'top', name: 'אבן ראש זקופה', desc: 'אבן ראש אחת זקופה במרכז האחורי' },
  { id: 'sides', name: 'שתי אבני ראש זו לזו', desc: 'זוג אבני ראש במרכז האחורי' },
  { id: 'lying', name: 'אבן ראש בשכיבה', desc: 'אבן ראש מונחת שוכבת על הפלטה' },
];

export const SURFACE_STYLES = [
  { id: 'solid', name: 'משטח שלם', desc: 'פלטה רציפה אחת', slab: 'slab_8_smooth' },
  { id: 'divided', name: 'מחולק לאורך', desc: 'חלוקה לאורך המצבה', slab: 'slab_8_frez' },
  { id: 'gravel', name: 'משולב חצץ/אבנים', desc: 'חצץ או אבנים בחריץ המרכזי', slab: 'slab_8_rock' },
  { id: 'glass', name: 'פס זכוכית/קריסטל', desc: 'פס זכוכית דקורטיבי במרכז', slab: 'slab_divided_2' },
  { id: 'garden', name: 'גינה מרכזית', desc: 'מרזב עפר/צמחים במרכז המצבה', slab: 'slab_garden_inner_45_60' },
];

export const ACCESSORIES = [
  { id: 'candle_1', name: 'פנסים ל-1 נר', desc: 'פנס נר יחיד', price: 350 },
  { id: 'candle_2', name: 'פנסים ל-2 נרות', desc: 'פנס לשני נרות', price: 550 },
  { id: 'candle_3', name: 'פנסים ל-3 נרות', desc: 'פנס לשלושה נרות', price: 750 },
  { id: 'planter', name: 'עציץ', desc: 'עציץ אבן', price: 400 },
  { id: 'candle_special', name: 'פנס מיוחד', desc: 'פנס בעיצוב מיוחד', price: 900 },
  { id: 'candle_solar', name: 'פנס סולארי', desc: 'תאורה סולארית', price: 650 },
  { id: 'candle_solar_combo', name: 'פנס סולארי משולב', desc: 'פנס סולארי משולב', price: 850 },
  { id: 'planter_marble', name: 'עציץ שיש', desc: 'עציץ שיש לבן', price: 600 },
  { id: 'planter_granite', name: 'עציץ גרניט', desc: 'עציץ גרניט שחור', price: 700 },
  { id: 'pebbles_white', name: 'חלוקי נחל - לבן', desc: 'חלוקי נחל לבנים', price: 250 },
  { id: 'pebbles_black', name: 'חלוקי נחל - שחור', desc: 'חלוקי נחל שחורים', price: 250 },
  { id: 'candle_2_medium_2', name: '2 פנסים בינונים ל2 נרות', desc: 'זוג פנסים בינונים', price: 1100 },
  { id: 'candle_2_3', name: 'שני פנסים ל3 נרות', desc: 'זוג פנסים לשלושה נרות', price: 1500 },
  { id: 'vase_marble_urn', name: 'כד שיש קלאסי', desc: 'כד שיש לבן בצורת אגרטל', price: 450 },
  { id: 'vase_granite_rose', name: 'כד גרניט עם ורד', desc: 'כד גרניט עם תבליט ורדים', price: 550 },
  { id: 'vase_black_tapered', name: 'כד שחור מחודד', desc: 'כד גרניט שחור גלילי מחודד', price: 400 },
  { id: 'vase_white_round', name: 'כד לבן עגול', desc: 'כד שיש לבן עגול', price: 500 },
  { id: 'vase_grey_square', name: 'כד אפור מרובע', desc: 'כד גרניט אפור מרובע', price: 420 },
  { id: 'vase_speckled_blue', name: 'כד גרניט מנומר', desc: 'כד אבן כחול־אפור עם שוליים רחבים', price: 480 },
  { id: 'vase_tulip_white', name: 'כד טוליפ לבן', desc: 'כד קרמיקה לבן עם שוליים מפוסלים', price: 390 },
  { id: 'ner_house_silver', name: 'בית מנורה כסף', desc: 'בית מנורה עם חזית כסף לבנים ומגן דוד', price: 850 },
  { id: 'ner_house_bronze', name: 'בית מנורה ברונזה', desc: 'בית מנורה עם חזית ברונזה מקשתות', price: 950 },
];

export const LETTERING_TYPES = [
  { id: 'engraving', name: 'חריטה', style: 'recessed', desc: 'חריטה שקועה פשוטה', pricePerChar: 15 },
  { id: 'engraving_paint', name: 'חריטה וצבע', style: 'recessed', desc: 'חריטה עם צבע', pricePerChar: 22 },
  { id: 'engraving_blue', name: 'חריטה וצבע כחול', style: 'blue', desc: 'חריטה עם צבע כחול', pricePerChar: 25 },
  { id: 'engraving_black', name: 'חריטה וצבע שחור', style: 'black', desc: 'חריטה עם צבע שחור', pricePerChar: 25 },
  { id: 'natural_engraving', name: 'חריטה טבעית', style: 'recessed', desc: 'חריטה טבעית ללא צבע', pricePerChar: 18 },
  { id: 'lead', name: 'עופרת', style: 'raised', desc: 'אותיות עופרת', pricePerChar: 35 },
  { id: 'lead_raised', name: 'עופרת בולט', style: 'raised', desc: 'אותיות עופרת בולטות', pricePerChar: 45 },
  { id: 'raised_letters', name: 'אותיות בולטות', style: 'raised', desc: 'אותיות מובלטות', pricePerChar: 40 },
  { id: 'bronze_letters', name: 'אותיות ברונזה', style: 'bronze', desc: 'אותיות מתכת ברונזה', pricePerChar: 55 },
  { id: 'reverse_spray', name: 'התזה הפוכה על הגרניט השחור', style: 'recessed', desc: 'התזה הפוכה על גרניט שחור', pricePerChar: 50 },
  { id: 'cnc_raised', name: 'שם בולט - CNC', style: 'raised', desc: 'חריטת CNC לשם בולט', pricePerChar: 60 },
];

export const NER_HOUSE_ANCHORS = [
  { id: 'front', name: 'חזית המצבה', desc: 'מיקום בחזית, על הפלטה' },
  { id: 'behind', name: 'מאחורי אבן הראש', desc: 'מאחורי הכרית' },
];

export const NER_HOUSE_SIZES = [
  { id: 'small', name: 'קטן', desc: 'גודל קטן' },
  { id: 'medium', name: 'בינוני', desc: 'גודל בינוני' },
  { id: 'large', name: 'גדול', desc: 'גודל גדול' },
];

export const NER_HOUSE_STYLES = [
  { id: 'arched', name: 'קשתות כפולות', desc: 'דלתות ברונזה עם קשת' },
  { id: 'gabled', name: 'בית עם גג', desc: 'בית מנורה עם גג משולש וחזית פליז' },
  { id: 'pyramid_blue', name: 'פירמידה כחולה', desc: 'בסיס משופע עם מגן דוד כחול' },
];

export const CATALOG_CATEGORIES = [
  { id: 'all', name: 'הכל' },
  { id: 'small', name: 'מצבה קטנה' },
  { id: 'regular', name: 'מצבה רגילה' },
  { id: 'family', name: 'מצבה משפחתית' },
  { id: 'headstone', name: 'אבני ראש' },
];

export const STEPS = [
  { label: 'סוג מצבה ואבן', title: 'סוג מצבה וחומר הגוף', desc: 'בחרו את סוג המצבה וחומר הגוף הראשי. ניתן להגדיר חומר נפרד לכל רכיב בשלבים הבאים.' },
  { label: 'פאנל קומה', title: 'פאנל קומה', desc: 'בחרו את סגנון הפאנל והחומר שלו. התצוגה התלת-ממדית מתעדכנת בזמן אמת.' },
  { label: 'מסגרת / קומה שנייה', title: 'מסגרת / קומה שנייה', desc: 'בחרו את סגנון המסגרת והחומר שלה. התצוגה התלת-ממדית מתעדכנת בזמן אמת.' },
  { label: 'פלטת כיסוי', title: 'פלטת כיסוי', desc: 'בחרו את סגנון הפלטה והחומר שלה. התצוגה התלת-ממדית מתעדכנת בזמן אמת.' },
  { label: 'אבן ראש המצבה', title: 'אבן ראש המצבה', desc: 'בחרו את סגנון אבן הראש והחומר שלה. התצוגה התלת-ממדית מתעדכנת בזמן אמת.' },
  { label: 'תוספות', title: 'תוספות', desc: 'ניתן לבחור מספר פריטים. התוספות יופיעו בתצוגה החיה.' },
  { label: 'עיטורים מותאמים', title: 'עיטורים מותאמים אישית', desc: 'תארו בטקסט חופשי עיטור או אלמנט מיוחד (למשל "ספר פתוח עם פרפר"). המערכת תייצר ותציג את האלמנט על ההדמיה.' },
  { label: 'כיתוב וחריטה', title: 'כיתוב וחריטה', desc: 'בחרו סוג כיתוב והזינו את הטקסט. הכיתוב יופיע בזמן אמת על המצבה.' },
  { label: 'פרטי נפטר ומיקום', title: 'פרטי נפטר ומיקום', desc: 'מלאו את פרטי הנפטר/ת ומיקום הקבר.' },
  { label: 'סיכום והצעת מחיר', title: 'סיכום והצעת מחיר', desc: 'סקרו את העיצוב ושלחו את הבקשה.' },
];

export const PART_STONE_FIELDS = {
  panel: 'panelStone',
  frame: 'frameStone',
  slab: 'slabStone',
  headstone: 'headstoneStone',
};