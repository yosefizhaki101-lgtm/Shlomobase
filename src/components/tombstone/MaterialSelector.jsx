import { STONE_TYPES } from '@/lib/tombstoneOptions';
import { cn } from '@/lib/utils';

export default function MaterialSelector({ selected, onSelect }) {
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
              onClick={() => onSelect(s.id)}
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
    </div>
  );
}