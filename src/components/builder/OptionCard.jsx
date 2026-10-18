import { cn } from '@/lib/utils';

export default function OptionCard({ option, active, onClick, swatchKey = 'swatch' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2 text-right transition-all w-full',
        active ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-stone-200 bg-white hover:border-stone-300'
      )}
    >
      {option[swatchKey] && (
        <span
          className="h-8 w-8 rounded-md ring-1 ring-stone-300 flex-shrink-0"
          style={{ background: option[swatchKey] }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className={cn('text-xs font-medium', active ? 'text-blue-900' : 'text-stone-700')}>{option.name}</div>
        {option.desc && <div className="text-[10px] text-stone-400 truncate">{option.desc}</div>}
      </div>
    </button>
  );
}