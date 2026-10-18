import { LETTERING_TYPES } from '@/lib/tombstoneOptions';
import { Textarea } from '@/components/ui/textarea';
import PillCarousel from '@/components/tombstone/PillCarousel';

export default function StepLettering({ design, update }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-1.5">סוג הכיתוב</h3>
        <PillCarousel options={LETTERING_TYPES} selected={design.letteringType} onSelect={(v) => update({ letteringType: v })} />
      </div>
      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-0.5">כיתוב אבן הראש</h3>
        <p className="text-xs text-stone-500 mb-2">הכיתוב יופיע על אבן הראש האנכית. ירידת שורה עם Enter.</p>
        <Textarea
          dir="rtl"
          value={design.engravingText || ''}
          onChange={(e) => update({ engravingText: e.target.value })}
          placeholder={'שם הנפטר/ת\nשם האב'}
          className="resize-none min-h-[80px] text-base leading-relaxed"
          rows={3}
        />
      </div>
      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-0.5">כיתוב הפלטה</h3>
        <p className="text-xs text-stone-500 mb-2">הכיתוב יופיע על הפלטה השוכבת. ירידת שורה עם Enter.</p>
        <Textarea
          dir="rtl"
          value={design.slabText || ''}
          onChange={(e) => update({ slabText: e.target.value })}
          placeholder={'תאריכים\nפסוק / מילות פרידה\nת.נ.צ.ב.ה'}
          className="resize-none min-h-[80px] text-base leading-relaxed"
          rows={3}
        />
      </div>
    </div>
  );
}