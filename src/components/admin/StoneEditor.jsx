import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { STONE_KINDS } from '@/lib/componentGeometry';

export default function StoneEditor({ stone, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: stone?.name || '',
    description: stone?.description || '',
    kind: stone?.kind || 'granite',
    color: stone?.color || '#cccccc',
    roughness: stone?.roughness ?? 0.5,
    metalness: stone?.metalness ?? 0,
    polish: stone?.polish ?? 0.5,
    clearcoat: stone?.clearcoat ?? 0,
    clearcoat_roughness: stone?.clearcoat_roughness ?? 0.1,
    swatch: stone?.swatch || '',
    price: stone?.price ?? 0,
    order: stone?.order ?? 0,
    is_active: stone?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.kind || !form.color) return;
    setSaving(true);
    try {
      if (stone?.id) {
        await base44.entities.TombstoneStone.update(stone.id, form);
      } else {
        await base44.entities.TombstoneStone.create(form);
      }
      onSave();
    } catch (e) {
      alert('שגיאה בשמירה: ' + (e.message || e));
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!stone?.id) return;
    if (!confirm(`למחוק "${stone.name}"?`)) return;
    setSaving(true);
    try {
      await base44.entities.TombstoneStone.delete(stone.id);
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
          <Label>שם האבן</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="לדוגמה: גרניט שחור" />
        </div>
        <div>
          <Label>סוג חומר (kind)</Label>
          <Select value={form.kind} onValueChange={(v) => set('kind', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STONE_KINDS.map((k) => (
                <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>תיאור</Label>
        <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="תיאור האבן" rows={2} />
      </div>

      <div>
        <Label>צבע</Label>
        <div className="flex gap-2 items-center">
          <Input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-12 h-10 p-1" />
          <Input value={form.color} onChange={(e) => set('color', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>סלסול (0-1)</Label>
          <Input type="number" step="0.01" min="0" max="1" value={form.roughness} onChange={(e) => set('roughness', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>מתכתיות (0-1)</Label>
          <Input type="number" step="0.01" min="0" max="1" value={form.metalness} onChange={(e) => set('metalness', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>ליטוש (0-1)</Label>
          <Input type="number" step="0.01" min="0" max="1" value={form.polish} onChange={(e) => set('polish', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>ציפוי שקוף (0-1)</Label>
          <Input type="number" step="0.01" min="0" max="1" value={form.clearcoat} onChange={(e) => set('clearcoat', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>סלסול ציפוי (0-1)</Label>
          <Input type="number" step="0.01" min="0" max="1" value={form.clearcoat_roughness} onChange={(e) => set('clearcoat_roughness', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>מחיר (₪)</Label>
          <Input type="number" value={form.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
        <Label>פעיל</Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving || !form.name}>
          {saving ? 'שומר...' : stone?.id ? 'עדכן' : 'הוסף'}
        </Button>
        {stone?.id && (
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            מחק
          </Button>
        )}
        <Button variant="outline" onClick={onCancel}>ביטול</Button>
      </div>
    </div>
  );
}