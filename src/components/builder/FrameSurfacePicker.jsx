import { cn } from '@/lib/utils';

export const FRAME_SURFACES = [
  { id: 'smooth', name: 'מסגרת חלקה', desc: 'משטח ישר' },
  { id: 'rock', name: 'מסגרת פראית', desc: 'משטח מסותת' },
];

export default function FrameSurfacePicker({
  selected,
  onSelect,
  title = 'מסגרת חלקה או פראית',
  smoothLabel = 'מסגרת חלקה',
  rockLabel = 'מסגרת פראית',
}) {
  const surfaces = [
    { ...FRAME_SURFACES[0], name: smoothLabel },
    { ...FRAME_SURFACES[1], name: rockLabel },
  ];
  return (
    <div>
      <h4 className="text-[10px] font-medium text-stone-500 mb-1">{title}</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {surfaces.map((s) => {
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                'rounded-lg border px-2 py-1.5 text-right transition-all',
                active
                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
              )}
            >
              <span className="block text-xs font-medium leading-tight">{s.name}</span>
              <span className={cn('block text-[10px] mt-0.5 leading-tight', active ? 'text-stone-300' : 'text-stone-400')}>
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}