export const A11Y_STORAGE_KEY = 'a11y-preferences';

export const MIN_TEXT_SCALE = 100;
export const MAX_TEXT_SCALE = 175;
export const TEXT_STEP = 25;

export const DEFAULT_PREFS = {
  textScale: 100,
  contrast: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  stopAnimations: false,
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

// Applies the user's choices to the document root — index.css carries the CSS for each class.
export function applyPrefs(prefs) {
  const root = document.documentElement;
  root.style.setProperty('--a11y-scale', String((prefs.textScale || 100) / 100));
  root.classList.toggle('a11y-contrast', !!prefs.contrast);
  root.classList.toggle('a11y-grayscale', !!prefs.grayscale);
  root.classList.toggle('a11y-links', !!prefs.highlightLinks);
  root.classList.toggle('a11y-readable', !!prefs.readableFont);
  root.classList.toggle('a11y-noanim', !!prefs.stopAnimations);
}