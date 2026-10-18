import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELDS = [
  { key: 'deceasedName', label: 'שם הנפטר', placeholder: 'פלוני בן פלונית' },
  { key: 'cemetery', label: 'בית עלמין', placeholder: 'לדוגמה: הר הזיתים' },
  { key: 'gush', label: 'גוש', placeholder: 'מספר גוש' },
  { key: 'chelka', label: 'חלקה', placeholder: 'מספר חלקה' },
  { key: 'row', label: 'שורה', placeholder: 'מספר שורה' },
  { key: 'graveNumber', label: 'מספר', placeholder: 'מספר קבר' },
  { key: 'completionDate', label: 'תאריך גמר עבודה', placeholder: '', type: 'date' },
];

export default function StepDeceased({ design, update }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-0.5">פרטי נפטר ומיקום</h3>
        <p className="text-xs text-stone-500">פרטי זיהוי הקבר ותאריך יעד לסיום.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="text-stone-700 text-xs">{f.label}</Label>
            <Input
              dir={f.type === 'date' ? 'ltr' : 'rtl'}
              type={f.type || 'text'}
              value={design[f.key] || ''}
              onChange={(e) => update({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="mt-0.5 text-right h-9 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}