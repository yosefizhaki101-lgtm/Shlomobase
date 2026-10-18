import PillCarousel from '@/components/tombstone/PillCarousel';
import MaterialSelector from '@/components/tombstone/MaterialSelector';

export default function StepPart({ options, selected, onSelect, stoneField, colorField, design, update }) {
  const currentStone = (design && stoneField ? design[stoneField] : null) || (design ? design.stoneType : null);
  const currentColor = (design && colorField ? design[colorField] : null) || (design ? design.colorOverride : null);
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-stone-900 text-xs mb-1">סגנון</h3>
        <PillCarousel options={options} selected={selected} onSelect={onSelect} />
      </div>
      {stoneField && design && update && (
        <div>
          <h3 className="font-medium text-stone-900 text-xs mb-1">חומר וצבע</h3>
          <p className="text-[10px] text-stone-400 mb-1.5">ברירת מחדל: כמו גוף המצבה. ניתן לבחור חומר וצבע נפרדים לרכיב זה.</p>
          <MaterialSelector
            selected={currentStone}
            onSelect={(v) => update({ [stoneField]: v })}
            colorOverride={currentColor}
            onColorSelect={colorField ? (v) => update({ [colorField]: v }) : undefined}
          />
        </div>
      )}
    </div>
  );
}