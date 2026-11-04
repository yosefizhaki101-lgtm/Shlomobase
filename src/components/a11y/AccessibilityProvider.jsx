import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  A11Y_STORAGE_KEY,
  DEFAULT_PREFS,
  MAX_TEXT_SCALE,
  MIN_TEXT_SCALE,
  TEXT_STEP,
  applyPrefs,
  loadPrefs,
} from '@/lib/a11y';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage blocked — preferences still apply for this visit */
    }
  }, [prefs]);

  const value = useMemo(() => {
    const clampScale = (value) => Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, value));
    return {
      prefs,
      toggle: (key) => setPrefs((p) => ({ ...p, [key]: !p[key] })),
      increaseText: () => setPrefs((p) => ({ ...p, textScale: clampScale(p.textScale + TEXT_STEP) })),
      decreaseText: () => setPrefs((p) => ({ ...p, textScale: clampScale(p.textScale - TEXT_STEP) })),
      reset: () => setPrefs({ ...DEFAULT_PREFS }),
    };
  }, [prefs]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}