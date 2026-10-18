import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CATEGORY_LABELS, PART_GEOMETRIES } from '@/lib/componentGeometry';

export default function PartEditor({ part, onSave, onCancel }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: part?.category || 'base',
    name: part?.name || '',
    description: part?.description || '',
    geom: part?.geom || '',
    height: part?.height ?? 0.1,
    override_color: part?.override_color || '',
    price: part?.price ?? 0,
    order: part?.order ?? 0,
    is_active: part?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const geoms = PART_GEOMETRIES[form.category] || [];

  const handleSave = async () => {
    if (!form.name || !form.geom) return;
    setSaving(true);
    try {
      if (part?.id) {
        await base44.entities.TombstonePart.update(part.id, form);
      } else {
        await base44.entities.TombstonePart.create(form);
      }
      onSave();
    } catch (e) {
      alert('שגיאה בשמירה: ' + (e.message || e));
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!part?.id) return;
    if (!confirm(`למחוק "${part.name}"?`)) return;
    setSaving(true);
    try {
      await base44.entities.TombstonePart.delete(part.id);
      onSave();
    } catch (e) {
      alert('שגיאה במחיקה: ' + (e.message || e));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>קטגוריה</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v)} disabled={!!part?.id}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>סוג גיאומטריה</Label>
          <Select value={form.geom} onValueChange={(v) => set('geom', v)}>
            <SelectTrigger><SelectValue placeholder="בחר גיאומטריה" /></SelectTrigger>
            <SelectContent>
              {geoms.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>שם הרכיב</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="לדוגמה: מסגרת טובזה פראית" />
      </div>

      <div>
        <Label>תיאור</Label>
        <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="תיאור קצר של הרכיב" rows={2} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>גובה (מ')</Label>
          <Input type="number" step="0.01" value={form.height} onChange={(e) => set('height', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>מחיר (₪)</Label>
          <Input type="number" value={form.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>סדר</Label>
          <Input type="number" value={form.order} onChange={(e) => set('order', parseInt(e.target.value) || 0)} />
        </div>
      </div>

      <div>
        <Label>צבע עקיפה (אופציונלי)</Label>
        <div className="flex gap-2 items-center">
          <Input type="color" value={form.override_color || '#ffffff'} onChange={(e) => set('override_color', e.target.value)} className="w-12 h-10 p-1" />
          <Input value={form.override_color} onChange={(e) => set('override_color', e.target.value)} placeholder="לדוגמה: #1a1a1c" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
        <Label>פעיל</Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving || !form.name || !form.geom}>
          {saving ? 'שומר...' : part?.id ? 'עדכן' : 'הוסף'}
        </Button>
        {part?.id && (
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            מחק
          </Button>
        )}
        <Button variant="outline" onClick={onCancel}>ביטול</Button>
      </div>
    </div>
  );
}