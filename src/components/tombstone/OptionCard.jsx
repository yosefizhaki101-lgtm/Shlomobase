import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OptionCard({ selected, onClick, title, desc, swatch, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative text-right rounded-2xl border p-4 transition-all duration-300 group',
        selected
          ? 'border-stone-800 bg-stone-50 shadow-md ring-1 ring-stone-800/10'
          : 'border-stone-200 bg-white hover:border-stone-400 hover:shadow-sm'
      )}
    >
      {swatch && (
        <span
          className="absolute top-4 left-4 h-7 w-7 rounded-full border border-black/10 shadow-inner"
          style={{ background: swatch }}
        />
      )}
      {children}
      <div className="font-medium text-stone-900 leading-tight">{title}</div>
      {desc && <div className="text-sm text-stone-500 mt-1 leading-snug">{desc}</div>}
      {selected && (
        <span className="absolute bottom-3 left-3 flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-white">
          <Check className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}