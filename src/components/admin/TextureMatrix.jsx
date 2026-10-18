import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Upload } from 'lucide-react';

const CATEGORIES = [
  { id: 'base', name: 'בסיס' },
  { id: 'frame', name: 'מסגרת' },
  { id: 'cover', name: 'פלטה' },
  { id: 'pillow', name: 'אבן ראש' },
];

export default function TextureMatrix() {
  const [stoneTypes, setStoneTypes] = useState([]);
  const [textures, setTextures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [newStone, setNewStone] = useState({ name: '', slug: '', color_code: '#888888' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [st, pt] = await Promise.all([
        base44.entities.StoneType.list('-created_date', 100),
        base44.entities.PartTexture.list('-created_date', 500),
      ]);
      setStoneTypes(st || []);
      setTextures(pt || []);
    } catch {
      setStoneTypes([]);
      setTextures([]);
    }
    setLoading(false);
  };

  const findTexture = (stoneTypeId, category) =>
    textures.find((t) => t.stone_type_id === stoneTypeId && t.part_category === category);

  const handleUpload = async (stoneTypeId, category, file) => {
    if (!file) return;
    setUploading(`${stoneTypeId}:${category}`);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const existing = findTexture(stoneTypeId, category);
      if (existing) {
        await base44.entities.PartTexture.update(existing.id, { texture_file: file_url });
      } else {
        await base44.entities.PartTexture.create({
          stone_type_id: stoneTypeId,
          part_category: category,
          texture_file: file_url,
        });
      }
      await loadAll();
    } catch (e) {
      alert('שגיאה בהעלאה: ' + (e.message || e));
    }
    setUploading(null);
  };

  const handleDeleteTexture = async (textureId) => {
    if (!confirm('למחוק טקסטורה?')) return;
    try {
      await base44.entities.PartTexture.delete(textureId);
      await loadAll();
    } catch (e) {
      alert('שגיאה: ' + (e.message || e));
    }
  };

  const handleAddStone = async () => {
    if (!newStone.name || !newStone.slug) return;
    try {
      await base44.entities.StoneType.create(newStone);
      setNewStone({ name: '', slug: '', color_code: '#888888' });
      await loadAll();
    } catch (e) {
      alert('שגיאה: ' + (e.message || e));
    }
  };

  const handleDeleteStone = async (stoneTypeId) => {
    if (!confirm('למחוק סוג אבן ואת כל הטקסטורות שלו?')) return;
    try {
      await base44.entities.PartTexture.deleteMany({ stone_type_id: stoneTypeId });
      await base44.entities.StoneType.delete(stoneTypeId);
      await loadAll();
    } catch (e) {
      alert('שגיאה: ' + (e.message || e));
    }
  };

  if (loading) return <p className="text-stone-400 py-8 text-center">טוען...</p>;

  return (
    <div className="space-y-6">
      {/* Add new stone type */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-medium mb-3">הוסף סוג אבן חדש</h3>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <Label>שם</Label>
            <Input
              value={newStone.name}
              onChange={(e) => setNewStone((s) => ({ ...s, name: e.target.value }))}
              placeholder="גרניט שחור"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label>מזהה (slug)</Label>
            <Input
              value={newStone.slug}
              onChange={(e) => setNewStone((s) => ({ ...s, slug: e.target.value }))}
              placeholder="black-granite"
              dir="ltr"
            />
          </div>
          <div>
            <Label>צבע</Label>
            <Input
              type="color"
              value={newStone.color_code}
              onChange={(e) => setNewStone((s) => ({ ...s, color_code: e.target.value }))}
              className="w-16 h-10 p-1"
            />
          </div>
          <Button onClick={handleAddStone} disabled={!newStone.name || !newStone.slug}>
            <Plus className="w-4 h-4 ml-1" /> הוסף
          </Button>
        </div>
        <p className="text-xs text-stone-400 mt-2">
          ה-slug צריך להתאים למזהה סוג האבן במערכת (לדוגמה: turkish_marble, grey_tuvza)
        </p>
      </div>

      {/* Matrix grid */}
      {stoneTypes.length === 0 ? (
        <p className="text-stone-400 py-8 text-center">
          אין עדיין סוגי אבן. הוסף את הראשון למעלה.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-stone-200 p-3 text-right text-sm font-medium text-stone-500">
                  סוג אבן
                </th>
                {CATEGORIES.map((c) => (
                  <th
                    key={c.id}
                    className="border-b-2 border-stone-200 p-3 text-center text-sm font-medium text-stone-500 min-w-[130px]"
                  >
                    {c.name}
                  </th>
                ))}
                <th className="border-b-2 border-stone-200 p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {stoneTypes.map((st) => (
                <tr key={st.id} className="hover:bg-stone-50">
                  <td className="border-b border-stone-100 p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full border flex-shrink-0"
                        style={{ background: st.color_code }}
                      />
                      <div>
                        <div className="font-medium text-sm">{st.name}</div>
                        <div className="text-xs text-stone-400" dir="ltr">
                          {st.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  {CATEGORIES.map((c) => {
                    const tex = findTexture(st.id, c.id);
                    const isUploading = uploading === `${st.id}:${c.id}`;
                    return (
                      <td key={c.id} className="border-b border-stone-100 p-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {tex ? (
                            <img
                              src={tex.texture_file}
                              alt={`${st.name} ${c.name}`}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 text-xs">
                              {isUploading ? '...' : '—'}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleUpload(st.id, c.id, e.target.files?.[0])}
                                disabled={isUploading}
                              />
                              <span className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                {tex ? 'החלף' : 'העלה'}
                              </span>
                            </label>
                            {tex && (
                              <button
                                onClick={() => handleDeleteTexture(tex.id)}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                מחק
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="border-b border-stone-100 p-3 text-center">
                    <button
                      onClick={() => handleDeleteStone(st.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}