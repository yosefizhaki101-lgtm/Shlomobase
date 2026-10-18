import { useState } from 'react';
import { Download, X, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RenderModal({ open, loading, imageUrl, error, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const handleDownload = async () => {
    if (!imageUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'לגזיאל-רנדור-מצבה.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
    setDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm ring-1 ring-stone-200 hover:bg-white hover:text-stone-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <div className="relative mb-4">
              <Sparkles className="h-10 w-10 text-stone-300 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-stone-700">מייצר רנדור פוטוריאליסטי...</p>
            <p className="mt-1 text-xs text-stone-400">זה יכול לקחת כמה שניות</p>
            <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-stone-400" />
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
            <p className="text-sm font-medium text-stone-700">הרנדור נכשל</p>
            <p className="mt-1 text-xs text-stone-400">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              סגירה
            </button>
          </div>
        )}

        {/* Image display */}
        {!loading && !error && imageUrl && (
          <div className="flex flex-col">
            <div className="w-full bg-stone-100 flex items-center justify-center">
              <img src={imageUrl} alt="רנדור פוטוריאליסטי" className="max-h-[70vh] w-full object-contain" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-3">
              <p className="text-xs text-stone-500">הרנדור מוכן — ניתן להוריד את התמונה</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  סגירה
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors',
                    downloading ? 'bg-stone-200 text-stone-400' : 'bg-stone-900 text-white hover:bg-stone-800'
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading ? 'מוריד...' : 'הורד תמונה'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}