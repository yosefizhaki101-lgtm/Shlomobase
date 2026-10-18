import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Image as UIImage } from '@/components/ui/image';

export default function CatalogLightbox({ items, index, onClose, onNav }) {
  const item = items[index];

  const go = useCallback(
    (dir) => {
      const next = (index + dir + items.length) % items.length;
      onNav(next);
    },
    [index, items.length, onNav]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [go, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-sm p-4 sm:p-8" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="סגירה"
      >
        <X className="h-6 w-6" />
      </button>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="הבא"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="הקודם"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        </>
      )}

      <figure className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-full flex-1 min-h-0 flex items-center justify-center">
          <UIImage
            src={item.image_url}
            alt={item.title}
            fittingType="fit"
            className="max-h-[78vh] w-auto max-w-full rounded-lg shadow-2xl"
          />
        </div>
        <figcaption className="mt-4 text-center">
          <p className="text-white font-serif text-lg">{item.title}</p>
          <p className="text-stone-400 text-xs mt-1">{index + 1} / {items.length}</p>
        </figcaption>
      </figure>
    </div>
  );
}