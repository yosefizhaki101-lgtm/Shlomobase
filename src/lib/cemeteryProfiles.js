// Cemetery profiles and dimension standards for Israeli burial societies (חברות קדישא).
// Each profile defines the allowed dimension ranges for tombstone components.
// When a user selects a profile, the dimension fields auto-update to the profile defaults
// and validate against the allowed ranges.

export const BURIAL_TYPES = [
  { id: 'single', name: 'קבורת שדה / מכפלה', desc: 'מצבת יחיד' },
  { id: 'double', name: 'קבורה זוגית', desc: 'מצבה כפולה' },
  { id: 'wall', name: 'סנהדרין / כוכים', desc: 'מצבת קיר' },
];

export const CEMETERY_PROFILES = [
  {
    id: 'default',
    name: 'ברירת מחדל — כללי',
    burialType: 'single',
    dimensions: {
      baseLength: { min: 170, max: 190, default: 180 },
      baseWidth: { min: 70, max: 80, default: 75 },
      totalHeight: { min: 80, max: 140, default: 100 },
    },
  },
  {
    id: 'gush_dan',
    name: 'ירקון / חולון / גוש דן (חברא קדישא ת"א)',
    burialType: 'single',
    dimensions: {
      baseLength: { min: 170, max: 190, default: 180 },
      baseWidth: { min: 70, max: 80, default: 80 },
      totalHeight: { min: 80, max: 140, default: 100 },
    },
  },
  {
    id: 'gush_dan_double',
    name: 'ירקון / חולון / גוש דן — זוגי (חברא קדישא ת"א)',
    burialType: 'double',
    dimensions: {
      baseLength: { min: 170, max: 190, default: 180 },
      baseWidth: { min: 150, max: 185, default: 185 },
      totalHeight: { min: 80, max: 140, default: 100 },
    },
  },
  {
    id: 'shomron',
    name: 'אזור השומרון (מועצה דתית שומרון)',
    burialType: 'single',
    dimensions: {
      baseLength: { min: 170, max: 190, default: 190 },
      baseWidth: { min: 70, max: 75, default: 75 },
      totalHeight: { min: 0, max: 60, default: 50 },
    },
    notes: 'גובה מקסימלי 60 ס"מ מעל הקרקע — אבן שוכבת בלבד, ללא אבן ניצבת בחלק מהמתחמים',
  },
  {
    id: 'military',
    name: 'בתי עלמין צבאיים (משרד הביטחון)',
    burialType: 'single',
    dimensions: {
      baseLength: { min: 190, max: 190, default: 190 },
      baseWidth: { min: 77, max: 77, default: 77 },
      totalHeight: { min: 60, max: 60, default: 60 },
    },
    notes: 'מידה אחידה קבועה — ללא אפשרות שינוי מידות',
    locked: true,
  },
  {
    id: 'wall_sanhedrin',
    name: 'סנהדרין / כוכים (מצבת קיר)',
    burialType: 'wall',
    dimensions: {
      slabWidth: { min: 60, max: 70, default: 65 },
      slabHeight: { min: 60, max: 70, default: 65 },
      slabThickness: { min: 3, max: 4, default: 4 },
    },
    notes: 'מצבת קיר — לוח שיש תלוי',
  },
];

export const COMPONENT_RANGES = {
  panel: {
    thickness: { min: 8, max: 15, default: 10, label: 'עובי פאנל' },
    sideLength: { min: 150, max: 170, default: 160, label: 'אורך צדדים' },
    frontLength: { min: 70, max: 75, default: 75, label: 'אורך חזית/גב' },
  },
  frame: {
    height: { min: 25, max: 30, default: 25, label: 'גובה מסגרת' },
    thickness: { min: 8, max: 8, default: 8, label: 'עובי מסגרת' },
  },
  slab: {
    thickness: { min: 4, max: 15, default: 8, label: 'עובי פלטה' },
    width: { min: 60, max: 60, default: 60, label: 'רוחב פלטה' },
    length: { min: 140, max: 180, default: 160, label: 'אורך פלטה' },
  },
  headstone: {
    width: { min: 60, max: 60, default: 60, label: 'רוחב אבן ראש' },
    height: { min: 50, max: 50, default: 50, label: 'גובה אבן ראש' },
    thickness: { min: 15, max: 15, default: 15, label: 'עובי אבן ראש' },
  },
};

// Validate a dimension value against a profile range
export function validateDimension(profile, field, value) {
  if (!profile || !profile.dimensions[field]) return { valid: true };
  const range = profile.dimensions[field];
  if (value < range.min) return { valid: false, message: `${value} ס"מ — מתחת למינימום (${range.min} ס"מ)` };
  if (value > range.max) return { valid: false, message: `${value} ס"מ — מעל למקסימום (${range.max} ס"מ)` };
  return { valid: true };
}

// Get profile by ID
export function getProfile(id) {
  return CEMETERY_PROFILES.find((p) => p.id === id) || CEMETERY_PROFILES[0];
}

// Get dimension defaults for a profile
export function getProfileDefaults(profileId) {
  const profile = getProfile(profileId);
  if (!profile) return {};
  const defaults = {};
  Object.entries(profile.dimensions).forEach(([key, range]) => {
    defaults[key] = range.default;
  });
  return defaults;
}