import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, Bot, Box, Gem, LogOut, Layers, Boxes } from 'lucide-react';
import PartEditor from '@/components/admin/PartEditor';
import TextureMatrix from '@/components/admin/TextureMatrix';
import StoneEditor from '@/components/admin/StoneEditor';
import AgentChat from '@/components/admin/AgentChat';
import GlbModelManager from '@/components/admin/GlbModelManager';
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, PART_GEOMETRIES } from '@/lib/componentGeometry';

export default function Admin() {
  const [tab, setTab] = useState('parts');
  const [parts, setParts] = useState([]);
  const [stones, setStones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPart, setEditingPart] = useState(null);
  const [editingStone, setEditingStone] = useState(null);
  const [showPartForm, setShowPartForm] = useState(false);
  const [showStoneForm, setShowStoneForm] = useState(false);
  const [partCategory, setPartCategory] = useState('headstone');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        base44.entities.TombstonePart.list('-order', 200),
        base44.entities.TombstoneStone.list('-order', 100),
      ]);
      setParts(p || []);
      setStones(s || []);
    } catch {
      setParts([]);
      setStones([]);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  const partsInCategory = parts.filter((p) => p.category === partCategory);
  const geomName = (cat, geom) => {
    const g = (PART_GEOMETRIES[cat] || []).find((x) => x.id === geom);
    return g?.name || geom;
  };

  return (
    <div className="min-h-screen bg-stone-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">מאגר חומרים — ניהול</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4 ml-1" />
                לבניית מצבה
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-1" />
              התנתק
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setTab('parts')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'parts' ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Box className="w-4 h-4" />
            רכיבי מצבה
          </button>
          <button
            onClick={() => setTab('stones')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'stones' ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Gem className="w-4 h-4" />
            סוגי אבן
          </button>
          <button
            onClick={() => setTab('textures')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'textures' ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            טקסטורות
          </button>
          <button
            onClick={() => setTab('agent')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'agent' ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Bot className="w-4 h-4" />
            בוט ניהולי
          </button>
          <button
            onClick={() => setTab('glb')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'glb' ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            מודלי GLB
          </button>
        </div>

        {/* Parts tab */}
        {tab === 'parts' && (
          <div>
            {showPartForm ? (
              <div className="bg-white rounded-xl border p-5">
                <h2 className="text-base font-bold mb-4">
                  {editingPart ? 'עריכת רכיב' : 'הוספת רכיב חדש'}
                </h2>
                <PartEditor
                  part={editingPart}
                  onSave={() => { setShowPartForm(false); setEditingPart(null); loadAll(); }}
                  onCancel={() => { setShowPartForm(false); setEditingPart(null); }}
                />
              </div>
            ) : (
              <>
                {/* Category selector */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setPartCategory(k)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        partCategory === k ? 'bg-stone-800 text-white' : 'bg-white border hover:bg-stone-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <div className="mb-3 text-sm text-stone-500">
                  {CATEGORY_DESCRIPTIONS[partCategory]}
                </div>

                <Button
                  onClick={() => { setEditingPart(null); setShowPartForm(true); }}
                  className="mb-4"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף {CATEGORY_LABELS[partCategory]} חדש
                </Button>

                {loading ? (
                  <p className="text-stone-400">טוען...</p>
                ) : partsInCategory.length === 0 ? (
                  <p className="text-stone-400 py-8 text-center">
                    אין עדיין רכיבים בקטגוריה זו. לחץ "הוסף" כדי ליצור את הראשון.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {partsInCategory.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{p.name}</h3>
                            {p.is_active === false && (
                              <span className="text-xs bg-stone-200 px-2 py-0.5 rounded-full">לא פעיל</span>
                            )}
                            {p.override_color && (
                              <span
                                className="w-4 h-4 rounded-full border"
                                style={{ background: p.override_color }}
                              />
                            )}
                          </div>
                          {p.description && (
                            <p className="text-sm text-stone-500 mt-0.5">{p.description}</p>
                          )}
                          <div className="text-xs text-stone-400 mt-1">
                            גיאומטריה: {geomName(p.category, p.geom)} · גובה: {p.height}מ' · מחיר: ₪{p.price}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingPart(p); setShowPartForm(true); }}
                        >
                          ערוך
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Stones tab */}
        {tab === 'stones' && (
          <div>
            {showStoneForm ? (
              <div className="bg-white rounded-xl border p-5">
                <h2 className="text-base font-bold mb-4">
                  {editingStone ? 'עריכת אבן' : 'הוספת אבן חדשה'}
                </h2>
                <StoneEditor
                  stone={editingStone}
                  onSave={() => { setShowStoneForm(false); setEditingStone(null); loadAll(); }}
                  onCancel={() => { setShowStoneForm(false); setEditingStone(null); }}
                />
              </div>
            ) : (
              <>
                <Button
                  onClick={() => { setEditingStone(null); setShowStoneForm(true); }}
                  className="mb-4"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף אבן חדשה
                </Button>

                {loading ? (
                  <p className="text-stone-400">טוען...</p>
                ) : stones.length === 0 ? (
                  <p className="text-stone-400 py-8 text-center">
                    אין עדיין סוגי אבן. לחץ "הוסף" כדי ליצור את הראשון.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {stones.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white rounded-xl border p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
                      >
                        <div
                          className="w-10 h-10 rounded-full border flex-shrink-0"
                          style={{ background: s.swatch || s.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{s.name}</h3>
                            {s.is_active === false && (
                              <span className="text-xs bg-stone-200 px-2 py-0.5 rounded-full">לא פעיל</span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 truncate">
                            {s.kind} · סלסול {s.roughness} · ליטוש {s.polish}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingStone(s); setShowStoneForm(true); }}
                        >
                          ערוך
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Textures tab */}
        {tab === 'textures' && (
          <div>
            <div className="mb-4 p-4 bg-amber-50 rounded-xl text-sm text-amber-800">
              <strong>מטריצת טקסטורות</strong> — העלה תמונות טקסטורה לכל שילוב של סוג אבן × רכיב. הטקסטורות יופיעו אוטומטית על המצבה התלת-ממדית.
            </div>
            <TextureMatrix />
          </div>
        )}

        {/* Agent tab */}
        {tab === 'agent' && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
              <strong>בוט ניהולי</strong> — תאר לבוט כל משימה והוא יבצע אותה: הוספת רכיבים, עריכת אבנים, חיפוש במאגר, ועוד.
            </div>
            <AgentChat />
          </div>
        )}

        {/* GLB Models tab */}
        {tab === 'glb' && (
          <GlbModelManager />
        )}
      </div>
    </div>
  );
}