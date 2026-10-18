import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save } from 'lucide-react';
import GlbMiniPreview from './GlbMiniPreview';

const COMPONENT_TYPES = [
  { id: 'headstone', name: 'אבן ראש' },
  { id: 'slab', name: 'פלטה' },
  { id: 'frame', name: 'מסגרת' },
  { id: 'panel', name: 'פאנל' },
  { id: 'accessory', name: 'תוספת' },
];

const STONE_OPTIONS = [
  { id: 'sardo', name: 'סרדו' },
  { id: 'black_granite', name: 'גרניט שחור' },
  { id: 'turkish_marble', name: 'טורקי' },
  { id: 'hebron', name: 'חברון' },
  { id: 'halila', name: 'חלילה' },
  { id: 'white_marble', name: 'שיש לבן' },
];

function Slider({ label, value, onChange, min, max, step }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-stone-500">{label}</label>
        <span className="text-xs font-mono text-stone-700">{Number(value).toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-stone-800"
      />
    </div>
  );
}

/**
 * Edit modal for a single GlbModel record.
 * Live 3D preview + calibration sliders. Save persists to the entity.
 *
 * Props:
 *  - model: the GlbModel record (or null for new)
 *  - onClose: () => void
 *  - onSaved: () => void
 */
export default function GlbModelEditor({ model, onClose, onSaved }) {
  const isEdit = !!model?.id;
  const [form, setForm] = useState(() => ({
    component_type: model?.component_type || 'headstone',
    option_id: model?.option_id || '',
    option_label: model?.option_label || '',
    file_url: model?.file_url || '',
    scale: model?.scale ?? 1,
    offset_x: model?.offset_x ?? 0,
    offset_y: model?.offset_y ?? 0,
    offset_z: model?.offset_z ?? 0,
    rotation_y: model?.rotation_y ?? 0,
    keep_original_material: model?.keep_original_material ?? false,
    is_active: model?.is_active ?? true,
  }));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewStone, setPreviewStone] = useState('sardo');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((f) => ({ ...f, file_url: res.file_url }));
    } catch (e) {
      alert('שגיאה בהעלאה: ' + (e.message || ''));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.option_id || !form.file_url) {
      alert('נא למלא מזהה אפשרות וקובץ GLB');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        scale: parseFloat(form.scale) || 1,
        offset_x: parseFloat(form.offset_x) || 0,
        offset_y: parseFloat(form.offset_y) || 0,
        offset_z: parseFloat(form.offset_z) || 0,
        rotation_y: parseFloat(form.rotation_y) || 0,
      };
      if (isEdit) {
        await base44.entities.GlbModel.update(model.id, payload);
      } else {
        await base44.entities.GlbModel.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      alert('שגיאה בשמירה: ' + (e.message || ''));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="font-bold text-stone-900">
            {isEdit ? `עריכת מודל: ${model.option_label || model.option_id}` : 'הוספת מודל GLB'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Live preview */}
          {form.file_url ? (
            <GlbMiniPreview
              fileUrl={form.file_url}
              scale={form.scale}
              offsetX={form.offset_x}
              offsetY={form.offset_y}
              offsetZ={form.offset_z}
              rotationY={form.rotation_y}
              keepOriginalMaterial={form.keep_original_material}
              stoneId={previewStone}
            />
          ) : (
            <div className="w-full h-[200px] rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
              העלה קובץ GLB כדי לראות תצוגה מקדימה
            </div>
          )}

          {/* Calibration sliders */}
          {form.file_url && (
            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-stone-600">כיול חי (סקייל / הזז / סיבוב)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Slider label="סקייל" value={form.scale} onChange={(v) => setForm((f) => ({ ...f, scale: v }))} min={0.1} max={5} step={0.05} />
                <Slider label="סיבוב Y" value={form.rotation_y} onChange={(v) => setForm((f) => ({ ...f, rotation_y: v }))} min={-3.14} max={3.14} step={0.05} />
                <Slider label="הזז X" value={form.offset_x} onChange={(v) => setForm((f) => ({ ...f, offset_x: v }))} min={-2} max={2} step={0.01} />
                <Slider label="הזז Y" value={form.offset_y} onChange={(v) => setForm((f) => ({ ...f, offset_y: v }))} min={-2} max={2} step={0.01} />
                <Slider label="הזז Z" value={form.offset_z} onChange={(v) => setForm((f) => ({ ...f, offset_z: v }))} min={-2} max={2} step={0.01} />
              </div>
              {!form.keep_original_material && (
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-xs text-stone-500">תצוגת חומר:</label>
                  <select
                    value={previewStone}
                    onChange={(e) => setPreviewStone(e.target.value)}
                    className="text-xs rounded-lg border border-stone-200 px-2 py-1"
                  >
                    {STONE_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500">סוג רכיב</label>
              <select
                value={form.component_type}
                onChange={(e) => setForm((f) => ({ ...f, component_type: e.target.value }))}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                {COMPONENT_TYPES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500">מזהה אפשרות (option_id)</label>
              <Input
                value={form.option_id}
                onChange={(e) => setForm((f) => ({ ...f, option_id: e.target.value }))}
                placeholder="לדוגמה: standing, heart, slab_8_smooth"
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500">תיאור (אופציונלי)</label>
            <Input
              value={form.option_label}
              onChange={(e) => setForm((f) => ({ ...f, option_label: e.target.value }))}
              placeholder="לדוגמה: אבן ראש עומדת"
              className="text-sm"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="text-xs text-stone-500">קובץ GLB</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={(e) => handleUpload(e.target.files?.[0])}
                className="text-sm"
              />
              {uploading && <span className="text-xs text-stone-400">מעלה...</span>}
              {form.file_url && <span className="text-xs text-green-600">✓ הועלה</span>}
            </div>
            {form.file_url && (
              <div className="text-[10px] text-stone-400 mt-1 truncate" dir="ltr">{form.file_url}</div>
            )}
          </div>

          {/* Material toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="keep_mat"
              checked={form.keep_original_material}
              onChange={(e) => setForm((f) => ({ ...f, keep_original_material: e.target.checked }))}
            />
            <label htmlFor="keep_mat" className="text-sm text-stone-600">שמור חומרים מקוריים של המודל (לא תחליף חומר אבן דינמית)</label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-stone-200 px-5 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving || !form.file_url || !form.option_id}>
            <Save className="w-4 h-4 ml-1" />
            {saving ? 'שומר...' : 'שמור מודל'}
          </Button>
        </div>
      </div>
    </div>
  );
}