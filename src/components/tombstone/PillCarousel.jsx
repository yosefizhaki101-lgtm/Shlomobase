import { cn } from '@/lib/utils';

export default function PillCarousel({ options, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1" style={{ flexWrap: 'nowrap' }}>
      {options.map((opt) => {
        const active = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              'flex-shrink-0 min-w-[88px] rounded-lg border px-2.5 py-1.5 text-right transition-all duration-200',
              active
                ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:shadow-sm'
            )}
          >
            <span className="block text-xs font-medium leading-tight">{opt.name}</span>
            {opt.desc && (
              <span className={cn('block text-[10px] mt-0.5 leading-tight', active ? 'text-stone-200' : 'text-stone-400')}>
                {opt.desc}
              </span>
            )}
            {opt.price && (
              <span className={cn('block text-xs font-bold mt-1', active ? 'text-stone-100' : 'text-stone-500')}>
                {opt.price} ₪
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}