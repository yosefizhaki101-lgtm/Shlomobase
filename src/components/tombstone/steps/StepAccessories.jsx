import { ACCESSORIES, NER_HOUSE_ANCHORS, NER_HOUSE_SIZES, NER_HOUSE_STYLES } from '@/lib/tombstoneOptions';
import PillCarousel from '@/components/tombstone/PillCarousel';
import { cn } from '@/lib/utils';

export default function StepAccessories({ design, update }) {
  const selected = design.accessories || [];
  const toggle = (id) => {
    const has = selected.includes(id);
    update({ accessories: has ? selected.filter((x) => x !== id) : [...selected, id] });
  };
  return (
    <div className="space-y-4">
      {/* Memorial candle housing */}
      <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3 space-y-3">
        <div>
          <h3 className="font-medium text-stone-900 text-sm mb-0.5">בית נר</h3>
          <p className="text-xs text-stone-500">בית נר להנצחה — בחרו מיקום וגודל.</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-600 mb-1">מיקום</p>
          <PillCarousel
            options={[{ id: 'off', name: 'ללא', desc: 'ללא בית נר' }, ...NER_HOUSE_ANCHORS]}
            selected={design.nerHouse || 'off'}
            onSelect={(v) => update({ nerHouse: v === 'off' ? null : v })}
          />
        </div>
        {design.nerHouse && (
          <div>
            <p className="text-[11px] font-medium text-stone-600 mb-1">סגנון</p>
            <PillCarousel
              options={NER_HOUSE_STYLES}
              selected={design.nerHouseStyle || 'arched'}
              onSelect={(v) => update({ nerHouseStyle: v })}
            />
          </div>
        )}
        {design.nerHouse && (
          <div>
            <p className="text-[11px] font-medium text-stone-600 mb-1">גודל</p>
            <PillCarousel
              options={NER_HOUSE_SIZES}
              selected={design.nerHouseSize || 'medium'}
              onSelect={(v) => update({ nerHouseSize: v })}
            />
          </div>
        )}
      </div>

      {/* Standard accessories */}
      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-0.5">תוספות</h3>
        <p className="text-xs text-stone-500">ניתן לבחור מספר פריטים. התוספות יופיעו בתצוגה החיה.</p>
      </div>
      <PillCarousel options={ACCESSORIES.map(a => ({ ...a, id: a.id, name: a.name, desc: a.desc, price: a.price }))} selected={selected[0]} onSelect={toggle} />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((id) => {
            const acc = ACCESSORIES.find((a) => a.id === id);
            if (!acc) return null;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="flex items-center gap-1 rounded-full bg-stone-900 text-white text-xs px-2.5 py-1"
              >
                {acc.name}
                <span className="text-stone-300">×</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Position controls for each selected accessory */}
      {selected.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-stone-200">
          <h4 className="text-[11px] font-medium text-stone-700">מיקום תוספות</h4>
          <p className="text-[10px] text-stone-500">גררו את הפריט ישירות בתצוגה התלת-ממדית, או כווננו כאן.</p>
          {selected.map((id, idx) => {
            const acc = ACCESSORIES.find((a) => a.id === id);
            if (!acc) return null;
            const pos = (design.accessoryPositions || {})[idx] || {};
            const updatePos = (axis, value) => {
              const positions = { ...(design.accessoryPositions || {}) };
              positions[idx] = { ...positions[idx], [axis]: value };
              update({ accessoryPositions: positions });
            };
            return (
              <div key={id} className="rounded-lg border border-stone-200 bg-stone-50/50 p-2 space-y-2">
                <p className="text-[11px] font-medium text-stone-700">{acc.name}</p>
                <div>
                  <div className="flex justify-between text-[9px] text-stone-500 mb-0.5">
                    <span>מיקום אופקי</span>
                    <span>{Math.round((pos.x || 0) * 100)} ס"מ</span>
                  </div>
                  <input type="range" min="-0.6" max="0.6" step="0.05" value={pos.x || 0} onChange={(e) => updatePos('x', parseFloat(e.target.value))} className="w-full accent-stone-700" />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] text-stone-500 mb-0.5">
                    <span>מיקום לאורך</span>
                    <span>{Math.round((pos.z || 0) * 100)} ס"מ</span>
                  </div>
                  <input type="range" min="-1" max="1" step="0.05" value={pos.z || 0} onChange={(e) => updatePos('z', parseFloat(e.target.value))} className="w-full accent-stone-700" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}