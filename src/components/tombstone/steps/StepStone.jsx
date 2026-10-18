import { STONE_TYPES, TOMBSTONE_TYPES, HEADSTONE_PLACEMENTS, SURFACE_STYLES } from '@/lib/tombstoneOptions';
import { CEMETERY_PROFILES, getProfile } from '@/lib/cemeteryProfiles';
import PillCarousel from '@/components/tombstone/PillCarousel';
import MaterialSelector from '@/components/tombstone/MaterialSelector';

const DIM_LABELS = {
  baseLength: 'אורך בסיס',
  baseWidth: 'רוחב בסיס',
  totalHeight: 'גובה כולל',
  slabWidth: 'רוחב לוח',
  slabHeight: 'גובה לוח',
  slabThickness: 'עובי לוח',
};

export default function StepStone({ design, update }) {
  const isFamily = ['family', 'double', 'reopen_family', 'adjacent'].includes(design.tombstoneType);
  const profile = getProfile(design.cemeteryProfile || 'default');

  return (
    <div className="space-y-3">
      {/* Cemetery profile selection */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 space-y-2">
        <div>
          <h3 className="font-medium text-stone-900 text-sm mb-0.5">פרופיל בית עלמין / חברא קדישא</h3>
          <p className="text-[10px] text-stone-500 mb-2">בחירת הפרופיל תגביל אוטומטית את טווחי המידות התקינים לכל רכיב.</p>
        </div>
        <select
          value={design.cemeteryProfile || 'default'}
          onChange={(e) => update({ cemeteryProfile: e.target.value })}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
        >
          {CEMETERY_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {profile.notes && (
          <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">{profile.notes}</p>
        )}
        {/* Dimension ranges display */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          {Object.entries(profile.dimensions).map(([key, range]) => (
            <div key={key} className="rounded bg-white/70 px-2 py-1 text-center">
              <div className="text-stone-500">{DIM_LABELS[key] || key}</div>
              <div className="font-medium text-stone-800">{range.min}–{range.max} ס"מ</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-1">סוג מצבה</h3>
        <PillCarousel options={TOMBSTONE_TYPES} selected={design.tombstoneType} onSelect={(v) => update({ tombstoneType: v })} />
      </div>
      {isFamily && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 space-y-3">
          <div>
            <h3 className="font-medium text-stone-900 text-sm mb-1">מיקום אבני הראש</h3>
            <p className="text-[10px] text-stone-500 mb-2">במצבה משפחתית ניתן לבחור היכן ימוקמו אבני הראש.</p>
            <PillCarousel options={HEADSTONE_PLACEMENTS} selected={design.headstonePlacement || 'top'} onSelect={(v) => update({ headstonePlacement: v })} />
          </div>
          <div>
            <h3 className="font-medium text-stone-900 text-sm mb-1">סגנון המשטח והחלוקה</h3>
            <p className="text-[10px] text-stone-500 mb-2">כיצד לחלק את פלטת הכיסוי לאורך המצבה.</p>
            <PillCarousel
              options={SURFACE_STYLES}
              selected={(SURFACE_STYLES.find((s) => s.slab === design.slab) || {}).id || 'solid'}
              onSelect={(v) => {
                const style = SURFACE_STYLES.find((s) => s.id === v);
                if (style) update({ slab: style.slab });
              }}
            />
          </div>
        </div>
      )}
      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-1">חומר וצבע</h3>
        <MaterialSelector
          selected={design.stoneType}
          onSelect={(v) => update({ stoneType: v })}
          colorOverride={design.colorOverride}
          onColorSelect={(v) => update({ colorOverride: v })}
        />
      </div>
    </div>
  );
}