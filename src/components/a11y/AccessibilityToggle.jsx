import { cn } from '@/lib/utils';

export default function AccessibilityToggle({ label, description, active, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right transition-colors',
        active
          ? 'border-stone-900 bg-stone-900 text-white'
          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
      )}
    >
      <span className="flex-1">
        <span className="block text-xs font-medium">{label}</span>
        {description && (
          <span className={cn('block text-[10px] mt-0.5', active ? 'text-stone-300' : 'text-stone-400')}>
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'h-4 w-4 flex-shrink-0 rounded-full ring-1',
          active ? 'bg-white ring-white' : 'bg-white ring-stone-300'
        )}
      />
    </button>
  );
}