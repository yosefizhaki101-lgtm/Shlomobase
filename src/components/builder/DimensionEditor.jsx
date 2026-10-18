import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';

// Collapsible dimension editor: shows width/length/height/thickness inputs based on config.
// fields: [{ key, label, min, max, step, placeholder }]
export default function DimensionEditor({ title = 'עריכת מידות מתקדמת', fields = [], design, update }) {
  const [open, setOpen] = useState(true);

  const hasAnyValue = fields.some((f) => design[f.key] != null && design[f.key] !== '');

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2.5 py-2 bg-stone-50 hover:bg-stone-100 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700">
          <Pencil className="h-3 w-3" />
          {title}
          {hasAnyValue && <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
      </button>
      {open && (
        <div className="p-2.5 space-y-2 bg-white">
          <div className="grid grid-cols-3 gap-1.5">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-[9px] text-stone-400">{f.label}</label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={design[f.key] ?? ''}
                  onChange={(e) => update({ [f.key]: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="אוט'"
                  className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-stone-400">השאירו ריק למידות ברירת מחדל. הגובה חל על השכבה העליונה.</p>
        </div>
      )}
    </div>
  );
}