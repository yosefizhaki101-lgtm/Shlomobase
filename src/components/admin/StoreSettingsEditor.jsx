import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EMPTY = {
  store_name: '',
  phone: '',
  email: '',
  address: '',
  service_hours: '',
  coordinator_name: '',
  accessibility_notes: '',
  last_updated: '',
};

export default function StoreSettingsEditor() {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.StoreSettings.list()
      .then((rows) => {
        const found = (rows || [])[0] || null;
        setRecord(found);
        setForm(found ? { ...EMPTY, ...found } : EMPTY);
      })
      .catch(() => setForm(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, last_updated: form.last_updated || new Date().toISOString().slice(0, 10) };
      delete payload.id;
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.created_by_id;
      if (record?.id) {
        await base44.entities.StoreSettings.update(record.id, payload);
      } else {
        const created = await base44.entities.StoreSettings.create(payload);
        setRecord(created);
      }
      setForm(payload);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-stone-400">טוען...</p>;

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4 max-w-2xl">
      <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-800">
        פרטי החנות משמשים גם בעמוד <strong>הצהרת הנגישות</strong>: שם החנות, הטלפון והאימייל מוצגים כפרטי רכז הנגישות.
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="store_name">שם החנות / העסק</Label>
          <Input id="store_name" value={form.store_name || ''} onChange={(e) => set('store_name', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="coordinator_name">שם רכז הנגישות</Label>
          <Input id="coordinator_name" value={form.coordinator_name || ''} onChange={(e) => set('coordinator_name', e.target.value)} placeholder="ברירת מחדל: שם העסק" />
        </div>
        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input id="phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="03-0000000" />
        </div>
        <div>
          <Label htmlFor="email">אימייל</Label>
          <Input id="email" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <Label htmlFor="address">כתובת</Label>
          <Input id="address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="service_hours">שעות פעילות</Label>
          <Input id="service_hours" value={form.service_hours || ''} onChange={(e) => set('service_hours', e.target.value)} placeholder="א׳–ה׳ 9:00–17:00" />
        </div>
        <div>
          <Label htmlFor="last_updated">תאריך עדכון ההצהרה</Label>
          <Input id="last_updated" type="date" value={(form.last_updated || '').slice(0, 10)} onChange={(e) => set('last_updated', e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="accessibility_notes">הסדרי נגישות נוספים (יופיעו בהצהרה)</Label>
        <Textarea
          id="accessibility_notes"
          rows={4}
          value={form.accessibility_notes || ''}
          onChange={(e) => set('accessibility_notes', e.target.value)}
          placeholder="לדוגמה: כניסה נגישה ללא מדרגות, חניית נכים סמוך לכניסה, שירות עד הבית בתיאום מראש..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || !form.store_name}>
          {saving ? 'שומר...' : 'שמירה'}
        </Button>
        {saved && <span className="text-xs text-green-700">נשמר</span>}
      </div>
    </div>
  );
}