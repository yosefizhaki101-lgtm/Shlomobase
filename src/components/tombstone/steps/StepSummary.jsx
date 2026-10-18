import { STONE_TYPES, TOMBSTONE_TYPES, PANELS, FRAMES, SLABS, HEADSTONE_TOPS, HEADSTONE_PLACEMENTS, ACCESSORIES, LETTERING_TYPES } from '@/lib/tombstoneOptions';
import { calcPrice, formatPrice } from '@/lib/tombstonePricing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

function find(list, id, k) {
  const it = list.find((x) => x.id === id);
  return it ? it[k] : '—';
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2 py-1.5 border-b border-stone-100 last:border-0">
      <span className="text-stone-500 text-xs">{label}</span>
      <span className="text-stone-900 text-xs font-medium text-left">{value || '—'}</span>
    </div>
  );
}

export default function StepSummary({ design, update, submitting, done, onSubmit }) {
  const price = calcPrice(design);
  const showPrice = design.showPrice !== false;

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-xl text-stone-900">הבקשה נשלחה</h3>
        <p className="text-stone-500 text-sm mt-2 max-w-xs mx-auto">
          קיבלנו את פרטי העיצוב. ניצור איתכם קשר בהקדם עם הצעת מחיר מדויקת.
        </p>
      </div>
    );
  }

  const accNames = (design.accessories || []).map((id) => find(ACCESSORIES, id, 'name')).join(', ');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-3">
        <h3 className="font-serif text-base text-stone-900 mb-2">סיכום הבחירות</h3>
        <Row label="סוג מצבה" value={find(TOMBSTONE_TYPES, design.tombstoneType, 'name')} />
        <Row label="סוג אבן" value={find(STONE_TYPES, design.stoneType, 'name')} />
        <Row label="פנל" value={find(PANELS, design.panel, 'name')} />
        <Row label="מסגרת" value={find(FRAMES, design.frame, 'name')} />
        <Row label="פלטה" value={find(SLABS, design.slab, 'name')} />
        <Row label="ראש מצבה" value={find(HEADSTONE_TOPS, design.headstoneTop, 'name')} />
        {['family', 'double', 'reopen_family'].includes(design.tombstoneType) && (
          <Row label="מיקום אבני ראש" value={find(HEADSTONE_PLACEMENTS, design.headstonePlacement, 'name')} />
        )}
        <Row label="תוספות" value={accNames} />
        <Row label="כיתוב" value={design.engravingText} />
        <Row label="סוג כיתוב" value={find(LETTERING_TYPES, design.letteringType, 'name')} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500">הצגת מחיר</span>
        <button
          type="button"
          onClick={() => update({ showPrice: !showPrice })}
          className={`relative h-6 w-11 rounded-full transition-colors ${showPrice ? 'bg-emerald-500' : 'bg-stone-300'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${showPrice ? 'right-0.5' : 'right-5'}`} />
        </button>
      </div>

      {showPrice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex justify-between py-0.5">
            <span className="text-stone-600 text-xs">לפני מע״מ</span>
            <span className="text-stone-900 text-sm font-medium">{formatPrice(price.beforeVat)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-stone-600 text-xs">מע״ב (17%)</span>
            <span className="text-stone-700 text-xs">{formatPrice(price.vat)}</span>
          </div>
          <div className="flex justify-between py-1.5 mt-1 border-t border-emerald-200">
            <span className="text-stone-900 font-bold text-sm">סה״כ</span>
            <span className="text-emerald-700 font-bold text-base">{formatPrice(price.withVat)}</span>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <h3 className="font-serif text-base text-stone-900">פרטי קשר</h3>
        <div>
          <Label className="text-stone-700 text-xs">שם מלא *</Label>
          <Input dir="rtl" value={design.contactName} onChange={(e) => update({ contactName: e.target.value })} className="mt-0.5 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-stone-700 text-xs">טלפון *</Label>
          <Input dir="ltr" value={design.contactPhone} onChange={(e) => update({ contactPhone: e.target.value })} className="mt-0.5 h-9 text-right text-sm" />
        </div>
        <div>
          <Label className="text-stone-700 text-xs">דוא״ל</Label>
          <Input dir="ltr" value={design.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} className="mt-0.5 h-9 text-right text-sm" />
        </div>
        <div>
          <Label className="text-stone-700 text-xs">הערות</Label>
          <Textarea dir="rtl" value={design.notes} onChange={(e) => update({ notes: e.target.value })} className="mt-0.5 resize-none text-sm" rows={2} />
        </div>
        <Button
          onClick={onSubmit}
          disabled={submitting || !design.contactName || !design.contactPhone}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-10"
        >
          {submitting ? <><Loader2 className="h-4 w-4 ml-2 animate-spin" /> שולח...</> : 'שליחת בקשה'}
        </Button>
      </div>
    </div>
  );
}