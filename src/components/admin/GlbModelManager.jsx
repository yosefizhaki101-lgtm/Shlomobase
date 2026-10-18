import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Box, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import GlbModelEditor from './GlbModelEditor';
import GlbCoverageMap from './GlbCoverageMap';

const COMPONENT_TYPES = [
  { id: 'headstone', name: 'אבן ראש' },
  { id: 'slab', name: 'פלטה' },
  { id: 'frame', name: 'מסגרת' },
  { id: 'panel', name: 'פאנל' },
  { id: 'accessory', name: 'תוספת' },
];

export default function GlbModelManager() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState('list'); // 'list' | 'coverage'
  const [editingModel, setEditingModel] = useState(null); // record or "new" sentinel
  const [quickAdd, setQuickAdd] = useState(null); // { component_type, option_id, option_label }

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.GlbModel.list('-created_date', 200);
      setModels(list || []);
    } catch {
      setModels([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('syncGlbModelsFromDrive', {});
      if (res?.data?.error) {
        alert('שגיאה: ' + res.data.error);
      } else {
        alert(`סונכרן! נוספו ${res?.data?.added || 0} מודלים, דולגו ${res?.data?.skipped || 0}`);
        load();
      }
    } catch (e) {
      alert('שגיאה בסנכרון: ' + (e.message || ''));
    }
    setSyncing(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק מודל זה?')) return;
    try {
      await base44.entities.GlbModel.delete(id);
      load();
    } catch (e) {
      alert('שגיאה במחירה: ' + (e.message || ''));
    }
  };

  const handleToggle = async (model) => {
    try {
      await base44.entities.GlbModel.update(model.id, { is_active: !model.is_active });
      load();
    } catch (e) {
      alert('שגיאה: ' + (e.message || ''));
    }
  };

  const compName = (id) => COMPONENT_TYPES.find((c) => c.id === id)?.name || id;

  const handleAddFor = (component_type, option_id, option_label) => {
    setQuickAdd({ component_type, option_id, option_label });
    setEditingModel('new');
  };

  // The editor model: either an existing record, a "new" sentinel, or a quick-add prefill
  const editorModel = editingModel === 'new'
    ? (quickAdd ? { ...quickAdd } : {})
    : editingModel;

  return (
    <div>
      <div className="mb-4 p-4 bg-purple-50 rounded-xl text-sm text-purple-800">
        <strong>מודלי GLB תלת-ממדיים</strong> — העלה קובצי GLB של רכיבי מצבה (אבן ראש, פלטה, מסגרת).
        המודלים יחליפו את הגיאומטריה הפרוצדורלית וייראו ריאליסטיים יותר, תוך שמירת כל ההתאמה (חומרים, טקסט, תוספות).
        <br />
        <span className="text-xs">לסנכרון מ-Drive: צור תיקייה בשם "לגזיאל-מודלים" והנח בה קובצי GLB בפורמט <code>סוג_מזהה.glb</code> (לדוגמה: <code>headstone_standing.glb</code>).</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-stone-200">
        <button
          onClick={() => setTab('list')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'list' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <List className="w-4 h-4" />
          רשימת מודלים ({models.length})
        </button>
        <button
          onClick={() => setTab('coverage')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'coverage' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          מפת כיסוי
        </button>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button onClick={() => { setQuickAdd(null); setEditingModel('new'); }}>
          <Plus className="w-4 h-4 ml-1" />
          הוסף מודל
        </Button>
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          <RefreshCw className={`w-4 h-4 ml-1 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'מסנכרן...' : 'סנכרן מ-Drive'}
        </Button>
      </div>

      {/* List tab */}
      {tab === 'list' && (
        loading ? (
          <p className="text-stone-400">טוען...</p>
        ) : models.length === 0 ? (
          <div className="text-center py-12">
            <Box className="w-12 h-12 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-400">אין עדיין מודלי GLB. הוסף מודל או סנכרן מ-Drive.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {models.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-xs font-medium">{compName(m.component_type)}</span>
                    <h3 className="font-medium">{m.option_label || m.option_id}</h3>
                    {m.is_active === false && <span className="text-xs bg-stone-200 px-2 py-0.5 rounded-full">לא פעיל</span>}
                    {m.keep_original_material && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">חומרים מקוריים</span>}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    מזהה: {m.option_id} · סקייל: {m.scale} · הזז: ({m.offset_x}, {m.offset_y}, {m.offset_z})
                    {m.drive_file_id && ' · מ-Drive'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setQuickAdd(null); setEditingModel(m); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(m)}>
                    {m.is_active === false ? 'הפעל' : 'השהה'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Coverage tab */}
      {tab === 'coverage' && (
        <GlbCoverageMap models={models} onAddFor={handleAddFor} />
      )}

      {/* Editor modal */}
      {editingModel && (
        <GlbModelEditor
          model={editorModel}
          onClose={() => { setEditingModel(null); setQuickAdd(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}