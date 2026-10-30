import { cn } from '@/lib/utils';
import { STEPS, STONE_TYPES, TOMBSTONE_TYPES, TOMBSTONE_DIMENSIONS, PANELS, FRAMES, SLABS, HEADSTONE_TOPS, HEADSTONE_PLACEMENTS, ACCESSORIES, LETTERING_TYPES, COLORS } from '@/lib/tombstoneOptions';
import OptionCard from '@/components/builder/OptionCard';
import MaterialSelector from '@/components/tombstone/MaterialSelector';
import StepAccessories from '@/components/tombstone/steps/StepAccessories';
import StepCustom from '@/components/tombstone/steps/StepCustom';
import LayerSelector from '@/components/builder/LayerSelector';
import DimensionEditor from '@/components/builder/DimensionEditor';
import ItemsEditor from '@/components/builder/ItemsEditor';
import PillCarousel from '@/components/tombstone/PillCarousel';

const STEP_GROUPS = [
  { label: 'גוף המצבה', steps: [0, 1, 2, 3] },
  { label: 'אבן ראש ותוספות', steps: [4, 5] },
  { label: 'כיתוב ועיטורים', steps: [6, 7] },
];

export default function LeftPanel({ step, setStep, design, update }) {
  const currentStep = STEPS[step];

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-medium text-stone-500 mb-1">סוג מצבה</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {TOMBSTONE_TYPES.map((t) => {
                  const dims = TOMBSTONE_DIMENSIONS[t.id];
                  return (
                    <OptionCard
                      key={t.id}
                      option={t}
                      active={design.tombstoneType === t.id}
                      onClick={() => update({
                        tombstoneType: t.id,
                        panelWidthCm: dims?.width || null,
                        panelLengthCm: dims?.length || null,
                      })}
                      swatchKey={undefined}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-stone-500 mb-1">חומר וצבע</h4>
              <MaterialSelector
                selected={design.stoneType}
                onSelect={(v) => update({ stoneType: v })}
                colorOverride={design.colorOverride}
                onColorSelect={(v) => update({ colorOverride: v })}
              />
            </div>
          </div>
        );
      case 1: {
        const selectedPanels = Array.isArray(design.panel) ? design.panel : [design.panel];
        const togglePanel = (id) => {
          if (selectedPanels.includes(id)) {
            if (selectedPanels.length <= 1) return;
            update({ panel: selectedPanels.filter((p) => p !== id) });
          } else {
            update({ panel: [...selectedPanels, id] });
          }
        };
        return (
          <div className="space-y-3">
            <LayerSelector
              options={PANELS}
              selected={selectedPanels}
              onToggle={togglePanel}
              onRemove={(id) => update({ panel: selectedPanels.filter((p) => p !== id) })}
              maxLayers={3}
            />
            <div>
              <h4 className="text-[10px] font-medium text-stone-500 mb-1">חומר וצבע</h4>
              <MaterialSelector
                selected={design.panelStone || design.stoneType}
                onSelect={(v) => update({ panelStone: v })}
                colorOverride={design.panelColor || design.colorOverride}
                onColorSelect={(v) => update({ panelColor: v })}
              />
            </div>
            <DimensionEditor
              title="מידות הפאנל (ס&quot;מ)"
              fields={[
                { key: 'panelWidthCm', label: 'רוחב', min: 30, max: 300, step: 5 },
                { key: 'panelLengthCm', label: 'אורך', min: 50, max: 400, step: 5 },
                { key: 'panelHeightCm', label: 'גובה', min: 5, max: 30, step: 1 },
              ]}
              design={design}
              update={update}
            />
          </div>
        );
      }
      case 2:
      case 3:
      case 4: {
        const optionsMap = { 2: FRAMES, 3: SLABS, 4: HEADSTONE_TOPS };
        const fieldMap = { 2: 'frame', 3: 'slab', 4: 'headstoneTop' };
        const stoneFieldMap = { 2: 'frameStone', 3: 'slabStone', 4: 'headstoneStone' };
        const colorFieldMap = { 2: 'frameColor', 3: 'slabColor', 4: 'headstoneColor' };
        const dimFieldsMap = {
          2: [
            { key: 'frameWidthCm', label: 'רוחב', min: 30, max: 300, step: 5 },
            { key: 'frameLengthCm', label: 'אורך', min: 50, max: 400, step: 5 },
            { key: 'frameHeightCm', label: 'גובה', min: 5, max: 50, step: 1 },
          ],
          3: [
            { key: 'slabWidthCm', label: 'רוחב', min: 30, max: 300, step: 5 },
            { key: 'slabLengthCm', label: 'אורך', min: 50, max: 400, step: 5 },
            { key: 'slabHeightCm', label: 'גובה', min: 3, max: 20, step: 1 },
          ],
          4: [
            { key: 'headstoneWidthCm', label: 'רוחב', min: 20, max: 200, step: 5 },
            { key: 'headstoneHeightCm', label: 'גובה', min: 20, max: 200, step: 5 },
            { key: 'headstoneThicknessCm', label: 'עובי', min: 3, max: 30, step: 1 },
          ],
        };
        const dimTitleMap = { 2: 'מידות המסגרת (ס&quot;מ)', 3: 'מידות הפלטה (ס&quot;מ)', 4: 'מידות אבן הראש (ס&quot;מ)' };
        const options = optionsMap[step];
        const field = fieldMap[step];
        const stoneField = stoneFieldMap[step];
        const colorField = colorFieldMap[step];
        const selectedLayers = Array.isArray(design[field]) ? design[field] : [design[field]];
        const toggleLayer = (id) => {
          if (selectedLayers.includes(id)) {
            if (selectedLayers.length <= 1) return;
            update({ [field]: selectedLayers.filter((p) => p !== id) });
          } else {
            update({ [field]: [...selectedLayers, id] });
          }
        };
        return (
          <div className="space-y-3">
            <LayerSelector
              options={options}
              selected={selectedLayers}
              onToggle={toggleLayer}
              onRemove={(id) => update({ [field]: selectedLayers.filter((p) => p !== id) })}
              maxLayers={3}
            />
            <div>
              <h4 className="text-[10px] font-medium text-stone-500 mb-1">חומר וצבע</h4>
              <MaterialSelector
                selected={design[stoneField] || design.stoneType}
                onSelect={(v) => update({ [stoneField]: v })}
                colorOverride={design[colorField] || design.colorOverride}
                onColorSelect={(v) => update({ [colorField]: v })}
              />
            </div>
            <DimensionEditor
              title={dimTitleMap[step]}
              fields={dimFieldsMap[step]}
              design={design}
              update={update}
            />
            {step === 4 && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] font-medium text-stone-500 mb-1">מיקום אבן הראש</h4>
                  <PillCarousel
                    options={HEADSTONE_PLACEMENTS}
                    selected={design.headstonePlacement || 'top'}
                    onSelect={(v) => update({ headstonePlacement: v })}
                  />
                </div>
                <div>
                  <h4 className="text-[10px] font-medium text-stone-500 mb-1">גודל יחסי: {Math.round((design.headstoneScale || 1) * 100)}%</h4>
                  <input type="range" min="0.5" max="2.5" step="0.1" value={design.headstoneScale || 1} onChange={(e) => update({ headstoneScale: parseFloat(e.target.value) })} className="w-full accent-stone-700" />
                  <div className="flex justify-between text-[9px] text-stone-400"><span>קטן</span><span>גדול</span></div>
                </div>
                <div>
                  <h4 className="text-[10px] font-medium text-stone-500 mb-1">מיקום אופקי: {Math.round((design.headstoneOffsetX || 0) * 100)} ס"מ</h4>
                  <input type="range" min="-0.5" max="0.5" step="0.05" value={design.headstoneOffsetX || 0} onChange={(e) => update({ headstoneOffsetX: parseFloat(e.target.value) })} className="w-full accent-stone-700" />
                  <div className="flex justify-between text-[9px] text-stone-400"><span>שמאל</span><span>ימין</span></div>
                </div>
                <div>
                  <h4 className="text-[10px] font-medium text-stone-500 mb-1">מיקום לאורך: {Math.round((design.headstoneOffsetZ || 0) * 100)} ס"מ</h4>
                  <input type="range" min="-0.5" max="0.5" step="0.05" value={design.headstoneOffsetZ || 0} onChange={(e) => update({ headstoneOffsetZ: parseFloat(e.target.value) })} className="w-full accent-stone-700" />
                  <div className="flex justify-between text-[9px] text-stone-400"><span>אחורה</span><span>קדימה</span></div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 5:
        return <StepAccessories design={design} update={update} />;
      case 6:
        return <StepCustom design={design} update={update} />;
      case 7:
        return (
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-medium text-stone-500 mb-1">סוג כיתוב</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {LETTERING_TYPES.map((l) => (
                  <OptionCard key={l.id} option={l} active={design.letteringType === l.id} onClick={() => update({ letteringType: l.id })} swatchKey={undefined} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-stone-500 mb-1">טקסט חריטה</h4>
              <textarea
                value={design.engravingText || ''}
                onChange={(e) => update({ engravingText: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none resize-none"
                placeholder="הזינו טקסט לחריטה..."
              />
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-stone-500 mb-1">גודל כיתוב אבן הראש: {Math.round((design.headstoneTextScale || 1) * 100)}%</h4>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={design.headstoneTextScale || 1}
                onChange={(e) => update({ headstoneTextScale: parseFloat(e.target.value) })}
                className="w-full accent-stone-700"
              />
              <div className="flex justify-between text-[9px] text-stone-400">
                <span>קטן</span>
                <span>גדול</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step progress header */}
      <div className="flex-shrink-0 border-b border-stone-200 p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-stone-700">{currentStep.title}</span>
          <span className="text-[10px] text-stone-400">{step + 1} / {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full bg-stone-700 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      {/* Current step content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <h3 className="font-medium text-stone-900 text-sm mb-0.5">{currentStep.title}</h3>
        <p className="text-[10px] text-stone-400 mb-3">{currentStep.desc}</p>
        {renderStepContent()}
      </div>
      {/* Manual placement of the small pieces */}
      <ItemsEditor design={design} update={update} />
      {/* Back / Continue buttons — pinned to bottom, always visible */}
      <div className="flex-shrink-0 border-t border-stone-200 bg-white p-2 flex gap-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className={cn(
            'flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors',
            step === 0 ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
          )}
        >
          חזור
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
          className={cn(
            'flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors',
            step === STEPS.length - 1 ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-stone-800 text-white hover:bg-stone-700'
          )}
        >
          המשך
        </button>
      </div>
    </div>
  );
}