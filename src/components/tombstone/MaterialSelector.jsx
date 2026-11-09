import { STONE_TYPES, FINISHES } from '@/lib/tombstoneOptions';
import { cn } from '@/lib/utils';

function stoneById(id) {
  return STONE_TYPES.find((s) => s.id === id) || STONE_TYPES[0];
}

export default function MaterialSelector({ selected, onSelect, finish, onFinishSelect }) {
  const stone = stoneById(selected);
  // ללא בחירה מפורשת — הגימור הוא ברירת המחדל של האבן (מט / מבריק)
  const activeFinish = finish && finish !== 'natural' ? finish : stone.defaultFinish;

  return (
    <div>
      <h4 className="text-[10px] font-medium text-stone-600 mb-1">חומר</h4>
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1" style={{ flexWrap: 'nowrap' }}>
        {STONE_TYPES.map((s) => {
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSelect(s.id);
                // בחירת אבן חדשה מחזירה את הגימור לברירת המחדל שלה
                if (onFinishSelect) onFinishSelect(null);
              }}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all',
                active ? 'border-stone-900 bg-stone-50 shadow-sm' : 'border-stone-200 bg-white hover:border-stone-300'
              )}
            >
              <span
                className="h-4 w-4 rounded-full ring-1 ring-stone-300 flex-shrink-0"
                style={{ background: s.swatch }}
              />
              <span className={cn('text-xs whitespace-nowrap', active ? 'font-medium text-stone-900' : 'text-stone-500')}>
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
      {onFinishSelect && (
        <div className="mt-1">
          <h4 className="text-[10px] font-medium text-stone-600 mb-1">גימור</h4>
          <div className="flex gap-1.5">
            {FINISHES.map((f) => {
              const active = activeFinish === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFinishSelect(f.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex-1 rounded-lg border px-2 py-1.5 text-xs transition-all',
                    active
                      ? 'border-stone-900 bg-stone-50 font-medium text-stone-900 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                  )}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}