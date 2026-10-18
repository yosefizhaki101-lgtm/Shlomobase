import { calcPrice } from '@/lib/tombstonePricing';
import { cn } from '@/lib/utils';

export default function RightPanel({ design, update, submitting, done, onSubmit }) {
  const price = calcPrice(design);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3">
      <h3 className="font-medium text-stone-900 text-sm">פרטי נפטר וטקסט</h3>

      {/* Deceased name */}
      <div>
        <label className="text-[10px] font-medium text-stone-500 mb-0.5 block">שם הנפטר/ת</label>
        <input
          value={design.deceasedName || ''}
          onChange={(e) => update({ deceasedName: e.target.value })}
          className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
          placeholder="שם מלא"
        />
      </div>

      {/* Cemetery details */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="text-[10px] font-medium text-stone-500 mb-0.5 block">בית עלמין</label>
          <input
            value={design.cemetery || ''}
            onChange={(e) => update({ cemetery: e.target.value })}
            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-stone-500 mb-0.5 block">גוש</label>
          <input
            value={design.gush || ''}
            onChange={(e) => update({ gush: e.target.value })}
            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-stone-500 mb-0.5 block">חלקה</label>
          <input
            value={design.chelka || ''}
            onChange={(e) => update({ chelka: e.target.value })}
            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-stone-500 mb-0.5 block">שורה</label>
          <input
            value={design.row || ''}
            onChange={(e) => update({ row: e.target.value })}
            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
            placeholder="—"
          />
        </div>
      </div>

      {/* Contact info */}
      <div className="border-t border-stone-200 pt-2 space-y-1.5">
        <div className="text-[10px] font-medium text-stone-500">פרטי קשר</div>
        <input
          value={design.contactName || ''}
          onChange={(e) => update({ contactName: e.target.value })}
          className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
          placeholder="שם איש קשר"
        />
        <input
          value={design.contactPhone || ''}
          onChange={(e) => update({ contactPhone: e.target.value })}
          className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
          placeholder="טלפון"
          dir="ltr"
        />
      </div>

      {/* Price + submit */}
      <div className="border-t border-stone-200 pt-2 space-y-2 mt-auto">
        {design.showPrice !== false && (
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">לפני מע"מ</span>
              <span className="font-medium text-stone-700">₪{price.beforeVat.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-0.5">
              <span className="font-medium text-stone-800">סה"כ</span>
              <span className="font-bold text-stone-900">₪{price.withVat.toLocaleString()}</span>
            </div>
          </div>
        )}
        {done ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center text-xs text-green-700 font-medium">
            ✓ הבקשה נשלחה בהצלחה
          </div>
        ) : (
          <button
            type="button"
            disabled={submitting || !design.contactName || !design.contactPhone}
            onClick={onSubmit}
            className={cn(
              'w-full rounded-lg py-2.5 text-sm font-medium transition-colors',
              submitting || !design.contactName || !design.contactPhone
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            )}
          >
            {submitting ? 'שולח...' : 'שליחת בקשה'}
          </button>
        )}
      </div>
    </div>
  );
}