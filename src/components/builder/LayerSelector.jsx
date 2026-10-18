import OptionCard from '@/components/builder/OptionCard';

// Multi-select layer list: shows selected layers (stacked bottom→top) with remove buttons,
// plus the available options grid to add more layers (up to maxLayers).
export default function LayerSelector({ options, selected, onToggle, onRemove, maxLayers = 3, emptyLabel = 'בחרו פריט' }) {
  const selectedDefs = selected.map((id) => options.find((o) => o.id === id)).filter(Boolean);
  const atMax = selected.length >= maxLayers;

  return (
    <div>
      <h4 className="text-[10px] font-medium text-stone-500 mb-1">שכבות (מלמטה למעלה)</h4>
      <p className="text-[9px] text-stone-400 mb-1.5">
        בחרו עד {maxLayers} שכבות שמוערמות זו על זו. הסדר הוא מלמטה למעלה.
      </p>
      {selectedDefs.length > 0 && (
        <div className="mb-2 space-y-1">
          {selectedDefs.map((def, idx) => (
            <div key={def.id} className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-2 py-1">
              <span className="text-[9px] text-stone-400">{idx + 1}.</span>
              <span className="text-[11px] text-stone-700 flex-1">{def.name}</span>
              {selected.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(def.id)}
                  className="text-stone-400 hover:text-red-500 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-1.5">
        {options.map((o) => {
          const isSelected = selected.includes(o.id);
          const disabled = !isSelected && atMax;
          return (
            <div key={o.id} className={disabled ? 'opacity-40 pointer-events-none' : ''}>
              <OptionCard option={o} active={isSelected} onClick={() => onToggle(o.id)} swatchKey={undefined} />
            </div>
          );
        })}
      </div>
    </div>
  );
}