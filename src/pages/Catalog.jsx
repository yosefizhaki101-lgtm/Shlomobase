import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2, ImageIcon, Sparkles, Tag } from 'lucide-react';
import { Image as UIImage } from '@/components/ui/image';
import CatalogLightbox from '@/components/catalog/CatalogLightbox';
import Logo from '@/components/tombstone/Logo';
import { CATALOG_CATEGORIES } from '@/lib/tombstoneOptions';
import { cn } from '@/lib/utils';

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [active, setActive] = useState(null);
  const [category, setCategory] = useState('all');

  const load = async () => {
    try {
      const list = await base44.entities.TombstoneCatalogItem.list('-order', 200);
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    base44.auth.me().then((u) => setIsAdmin(u?.role === 'admin')).catch(() => {});
    load();
  }, []);

  const sync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await base44.functions.invoke('syncCatalogFromDrive', {});
      if (res?.data?.error) {
        setSyncMsg({ type: 'error', text: res.data.error });
      } else {
        setSyncMsg({ type: 'ok', text: `נוספו ${res?.data?.added ?? 0} תמונות חדשות` });
      }
      await load();
    } catch (e) {
      setSyncMsg({ type: 'error', text: e.message || 'שגיאה בסנכרון' });
    } finally {
      setSyncing(false);
    }
  };

  const cycleCategory = async (item) => {
    const cats = ['small', 'regular', 'family', 'headstone'];
    const cur = item.category || 'regular';
    const next = cats[(cats.indexOf(cur) + 1) % cats.length];
    try {
      await base44.entities.TombstoneCatalogItem.update(item.id, { category: next });
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, category: next } : it)));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = category === 'all' ? items : items.filter((it) => (it.category || 'regular') === category);

  return (
    <div dir="rtl" className="min-h-screen bg-stone-100 text-stone-900">
      {/* hero */}
      <header className="relative overflow-hidden bg-gradient-to-bl from-stone-900 via-stone-800 to-stone-700 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 40%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="mb-8 inline-flex rounded-xl bg-white p-2 shadow-lg">
            <Logo className="h-16 sm:h-20" />
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-stone-300 hover:text-white transition-colors mb-8">
            <Sparkles className="h-4 w-4" />
            חזרה לבניית מצבה
          </Link>
          <div className="max-w-3xl">
            <p className="text-amber-300/90 text-sm font-medium tracking-wide uppercase mb-3">אוסף מצבות לזכרון עולם</p>
            <h1 className="font-serif text-4xl sm:text-6xl leading-tight">קטלוג המצבות</h1>
            <p className="text-stone-300 text-base sm:text-lg mt-4 leading-relaxed max-w-xl">
              מבחר עיצובים מקצועיים שבוצעו בפועל. כל מצבה מיוצרת בקפידה, באבן טבעית ובחריטה מדויקת.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              {isAdmin && (
                <button
                  onClick={sync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-stone-900 px-5 py-2.5 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-60"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {syncing ? 'מסנכרן...' : 'סנכרון מ-Google Drive'}
                </button>
              )}
              <span className="text-stone-400 text-sm">{filtered.length} מצבות{category !== 'all' ? ' בקטגוריה' : ' בקטלוג'}</span>
            </div>
            {syncMsg && (
              <p className={`mt-4 text-sm ${syncMsg.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
                {syncMsg.text}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* category filter */}
      <div className="sticky top-0 z-20 bg-stone-100/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATALOG_CATEGORIES.map((cat) => {
              const count = cat.id === 'all' ? items.length : items.filter((it) => (it.category || 'regular') === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
                    category === cat.id
                      ? 'bg-stone-900 text-white shadow-md'
                      : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-stone-400'
                  )}
                >
                  {cat.name}
                  <span className={cn('text-xs', category === cat.id ? 'text-stone-300' : 'text-stone-400')}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* gallery */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">טוען קטלוג...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-400">
            <ImageIcon className="h-12 w-12 mb-4 text-stone-300" />
            <p className="text-stone-500 font-medium">{category === 'all' ? 'הקטלוג ריק עדיין' : 'אין פריטים בקטגוריה זו'}</p>
            <p className="text-sm mt-1">
              {isAdmin && category === 'all' ? 'לחצו על "סנכרון מ-Google Drive" כדי לייבא תמונות מהתיקייה.' : 'נסו לבחור קטגוריה אחרת.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((item) => {
              const idx = items.indexOf(item);
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(idx)}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-200 shadow-sm ring-1 ring-stone-200 hover:ring-stone-400 transition-all"
                >
                  <UIImage
                    src={item.image_url}
                    alt={item.title}
                    fittingType="fill"
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <p className="text-white text-sm font-medium line-clamp-2 text-right">{item.title}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); cycleCategory(item); }}
                      className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-white transition-colors"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {CATALOG_CATEGORIES.find((c) => c.id === (item.category || 'regular'))?.name || 'רגילה'}
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {active !== null && items[active] && (
        <CatalogLightbox items={items} index={active} onClose={() => setActive(null)} onNav={setActive} />
      )}
    </div>
  );
}