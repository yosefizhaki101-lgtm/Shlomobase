import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accessibility, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useAccessibility } from '@/components/a11y/AccessibilityProvider';
import AccessibilityToggle from '@/components/a11y/AccessibilityToggle';
import { MAX_TEXT_SCALE, MIN_TEXT_SCALE } from '@/lib/a11y';
import { cn } from '@/lib/utils';

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { prefs, toggle, increaseText, decreaseText, reset } = useAccessibility();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="פתיחת תפריט נגישות"
        className="fixed z-[60] bottom-[84px] lg:bottom-5 left-3 lg:left-5 h-12 w-12 rounded-full bg-stone-900 text-white shadow-lg ring-2 ring-white hover:bg-stone-700 transition-colors flex items-center justify-center"
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
      </button>

      {open && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="אפשרויות נגישות"
          dir="rtl"
          className="fixed z-[60] bottom-[144px] lg:bottom-[76px] left-3 lg:left-5 w-[calc(100vw-1.5rem)] max-w-[320px] max-h-[75dvh] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-2xl p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900">נגישות האתר</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגירת תפריט הנגישות"
              className="rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Text size */}
          <div className="rounded-lg border border-stone-200 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-stone-700">גודל טקסט</span>
              <span className="text-[11px] text-stone-500" aria-live="polite">{prefs.textScale}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={decreaseText}
                disabled={prefs.textScale <= MIN_TEXT_SCALE}
                aria-label="הקטנת טקסט"
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-md border py-1.5 text-xs font-medium',
                  prefs.textScale <= MIN_TEXT_SCALE
                    ? 'border-stone-200 text-stone-300'
                    : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                )}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" /> הקטן
              </button>
              <button
                type="button"
                onClick={increaseText}
                disabled={prefs.textScale >= MAX_TEXT_SCALE}
                aria-label="הגדלת טקסט"
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-md border py-1.5 text-xs font-medium',
                  prefs.textScale >= MAX_TEXT_SCALE
                    ? 'border-stone-200 text-stone-300'
                    : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                )}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> הגדל
              </button>
            </div>
          </div>

          <AccessibilityToggle
            label="ניגודיות גבוהה"
            description="טקסט לבן על רקע שחור"
            active={prefs.contrast}
            onToggle={() => toggle('contrast')}
          />
          <AccessibilityToggle
            label="גווני אפור"
            description="הסרת צבע מהמסך"
            active={prefs.grayscale}
            onToggle={() => toggle('grayscale')}
          />
          <AccessibilityToggle
            label="הדגשת קישורים"
            description="סימון כל הקישורים באתר"
            active={prefs.highlightLinks}
            onToggle={() => toggle('highlightLinks')}
          />
          <AccessibilityToggle
            label="גופן קריא"
            description="גופן פשוט וברור לקריאה"
            active={prefs.readableFont}
            onToggle={() => toggle('readableFont')}
          />
          <AccessibilityToggle
            label="עצירת אנימציות"
            description="ביטול תנועה והבהובים"
            active={prefs.stopAnimations}
            onToggle={() => toggle('stopAnimations')}
          />

          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-1 rounded-md border border-stone-300 py-1.5 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> איפוס
            </button>
            <Link
              to="/accessibility"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md bg-stone-900 py-1.5 text-center text-[11px] font-medium text-white hover:bg-stone-700"
            >
              הצהרת נגישות
            </Link>
          </div>
        </div>
      )}
    </>
  );
}