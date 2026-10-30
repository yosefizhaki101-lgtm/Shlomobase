import { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { ACCESSORIES } from '@/lib/tombstoneOptions';
import { cn } from '@/lib/utils';

function Slider({ label, value, min, max, step, onChange, display, left, right }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-stone-500">{label}</span>
        <span className="text-[10px] font-medium text-stone-700">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-stone-700"
      />
      {(left || right) && (
        <div className="flex justify-between text-[9px] text-stone-400">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  );
}

// Manual placement of the small pieces: headstone, candle housing and every accessory.
export default function ItemsEditor({ design, update }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState('headstone');

  const accessories = design.accessories || [];
  const items = [
    { id: 'headstone', name: 'אבן ראש' },
    ...(design.nerHouse ? [{ id: 'ner', name: 'בית נר' }] : []),
    ...accessories.map((id, idx) => ({
      id: `acc:${idx}`,
      name: ACCESSORIES.find((a) => a.id === id)?.name || 'תוספת',
    })),
  ];
  const active = items.some((i) => i.id === activeId) ? activeId : items[0].id;

  const cm = (v) => `${Math.round((v || 0) * 100)} ס"מ`;

  const setAccPos = (idx, axis, value) => {
    const positions = { ...(design.accessoryPositions || {}) };
    positions[idx] = { ...(positions[idx] || {}), [axis]: value };
    update({ accessoryPositions: positions });
  };

  const accIdx = active.startsWith('acc:') ? parseInt(active.split(':')[1], 10) : -1;
  const accPos = accIdx >= 0 ? (design.accessoryPositions || {})[accIdx] || {} : {};

  return (
    <div className="border-t border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-stone-50 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700">
          <SlidersHorizontal className="h-3 w-3" />
          מיקום הפריטים הקטנים
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-stone-400" /> : <ChevronUp className="h-3.5 w-3.5 text-stone-400" />}
      </button>

      {open && (
        <div className="px-2.5 pb-2.5 space-y-2.5">
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                  active === item.id
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                )}
              >
                {item.name}
              </button>
            ))}
          </div>

          {active === 'headstone' && (
            <div className="space-y-2">
              <Slider
                label="ימינה / שמאלה"
                value={design.headstoneOffsetX || 0}
                min={-0.9}
                max={0.9}
                step={0.05}
                onChange={(v) => update({ headstoneOffsetX: v })}
                display={cm(design.headstoneOffsetX)}
                left="שמאל"
                right="ימין"
              />
              <Slider
                label="קדימה / אחורה"
                value={design.headstoneOffsetZ || 0}
                min={-0.6}
                max={0.6}
                step={0.05}
                onChange={(v) => update({ headstoneOffsetZ: v })}
                display={cm(design.headstoneOffsetZ)}
                left="אחורה"
                right="קדימה"
              />
              <Slider
                label="גודל אבן הראש"
                value={design.headstoneScale || 1}
                min={0.5}
                max={2.5}
                step={0.1}
                onChange={(v) => update({ headstoneScale: v })}
                display={`${Math.round((design.headstoneScale || 1) * 100)}%`}
                left="קטן"
                right="גדול"
              />
            </div>
          )}

          {active === 'ner' && (
            <div className="space-y-2">
              <Slider
                label="ימינה / שמאלה"
                value={design.nerHouseOffsetX || 0}
                min={-0.6}
                max={0.6}
                step={0.05}
                onChange={(v) => update({ nerHouseOffsetX: v })}
                display={cm(design.nerHouseOffsetX)}
                left="שמאל"
                right="ימין"
              />
              {design.nerHouse === 'front' && (
                <Slider
                  label="קדימה / אחורה"
                  value={design.nerHouseOffsetZ || 0}
                  min={-0.4}
                  max={0.4}
                  step={0.05}
                  onChange={(v) => update({ nerHouseOffsetZ: v })}
                  display={cm(design.nerHouseOffsetZ)}
                  left="אחורה"
                  right="קדימה"
                />
              )}
              <p className="text-[9px] text-stone-400">גודל וסגנון בית הנר נקבעים בשלב התוספות.</p>
            </div>
          )}

          {accIdx >= 0 && (
            <div className="space-y-2">
              <Slider
                label="ימינה / שמאלה"
                value={accPos.x || 0}
                min={-0.6}
                max={0.6}
                step={0.05}
                onChange={(v) => setAccPos(accIdx, 'x', v)}
                display={cm(accPos.x)}
                left="שמאל"
                right="ימין"
              />
              <Slider
                label="קדימה / אחורה"
                value={accPos.z || 0}
                min={-1}
                max={1}
                step={0.05}
                onChange={(v) => setAccPos(accIdx, 'z', v)}
                display={cm(accPos.z)}
                left="אחורה"
                right="קדימה"
              />
            </div>
          )}

          {items.length === 1 && (
            <p className="text-[9px] text-stone-400">הוסיפו תוספות או בית נר בשלב התוספות כדי למקם גם אותם.</p>
          )}
        </div>
      )}
    </div>
  );
}