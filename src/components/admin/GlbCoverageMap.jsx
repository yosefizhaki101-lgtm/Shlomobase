import { useMemo } from 'react';
import { HEADSTONE_TOPS, SLABS, FRAMES, PANELS, ACCESSORIES } from '@/lib/tombstoneOptions';
import { Check, Box } from 'lucide-react';

const COMPONENT_GROUPS = [
  { type: 'headstone', label: 'אבני ראש', options: HEADSTONE_TOPS },
  { type: 'slab', label: 'פלטות', options: SLABS },
  { type: 'frame', label: 'מסגרות', options: FRAMES },
  { type: 'panel', label: 'פאנלים', options: PANELS },
  { type: 'accessory', label: 'תוספות', options: ACCESSORIES },
];

/**
 * Coverage map: shows which builder options have an active GLB model
 * and which still use procedural geometry. Clicking an uncovered option
 * opens the quick-add form (onAddFor).
 *
 * Props:
 *  - models: GlbModel[] (all records)
 *  - onAddFor: (componentType, optionId, optionLabel) => void
 */
export default function GlbCoverageMap({ models, onAddFor }) {
  const coverage = useMemo(() => {
    const map = new Map(); // key "type:option_id" -> model
    models.forEach((m) => {
      if (m.is_active !== false) {
        map.set(`${m.component_type}:${m.option_id}`, m);
      }
    });
    return map;
  }, [models]);

  const stats = useMemo(() => {
    let total = 0;
    let covered = 0;
    COMPONENT_GROUPS.forEach((g) => {
      g.options.forEach((o) => {
        total++;
        if (coverage.has(`${g.type}:${o.id}`)) covered++;
      });
    });
    return { total, covered, pct: total ? Math.round((covered / total) * 100) : 0 };
  }, [coverage]);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-stone-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-stone-700">כיסוי מודלים</span>
          <span className="text-sm text-stone-500">
            {stats.covered} / {stats.total} אפשרויות מכוסות ({stats.pct}%)
          </span>
        </div>
        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>

      {/* Per-group tables */}
      {COMPONENT_GROUPS.map((g) => {
        const groupCovered = g.options.filter((o) => coverage.has(`${g.type}:${o.id}`)).length;
        return (
          <div key={g.type} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 px-4 py-2 flex items-center justify-between">
              <span className="font-semibold text-sm text-stone-700">{g.label}</span>
              <span className="text-xs text-stone-400">{groupCovered}/{g.options.length}</span>
            </div>
            <div className="divide-y divide-stone-100">
              {g.options.map((o) => {
                const model = coverage.get(`${g.type}:${o.id}`);
                const covered = !!model;
                return (
                  <button
                    key={o.id}
                    onClick={() => !covered && onAddFor(g.type, o.id, o.name)}
                    disabled={covered}
                    className={`w-full flex items-center justify-between px-4 py-2 text-right transition-colors ${
                      covered ? 'bg-white cursor-default' : 'hover:bg-emerald-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${covered ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                      <span className="text-sm text-stone-700">{o.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono" dir="ltr">{o.id}</span>
                    </div>
                    {covered ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                        מודל GLB
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Box className="w-3.5 h-3.5" />
                        פרוצדורלי · לחץ להוספה
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}