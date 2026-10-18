import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon } from '@/components/ui/image';

const SUGGESTIONS = [
  'ספר פתוח עם פרפר בצד',
  'מנורת שבעת נרות',
  'עץ זית מסוגנן',
  'כותל דמעות מוקטן',
  'חיתוך אלכסוני בפינה',
  'גפן ענבים מפוסלת',
];

export default function StepCustom({ design, update }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    const prompt = design.customPrompt?.trim();
    if (!prompt) return;
    setGenerating(true);
    setError('');
    try {
      const res = await base44.functions.invoke('generateOrnamentImage', { prompt });
      if (res?.data?.url) {
        update({ customImageUrl: res.data.url });
      } else {
        setError('לא הצלחנו לייצר את האלמנט. נסו שוב.');
      }
    } catch (e) {
      setError('שגיאה בייצור התמונה. נסו שוב.');
    } finally {
      setGenerating(false);
    }
  };

  const clear = () => {
    update({ customPrompt: '', customImageUrl: '' });
    setError('');
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-stone-900 text-sm mb-0.5">תיאור העיטור</h3>
        <p className="text-xs text-stone-500 mb-2">תארו בטקסט חופשי עיטור או אלמנט מיוחד. המערכת תייצר ותציג אותו על ההדמיה.</p>
        <Textarea
          dir="rtl"
          value={design.customPrompt || ''}
          onChange={(e) => update({ customPrompt: e.target.value })}
          placeholder='למשל: "ספר פתוח עם פרפר בצד"'
          className="resize-none min-h-[70px] text-sm"
          rows={3}
        />
      </div>

      <div>
        <p className="text-[10px] text-stone-400 mb-1.5">הצעות:</p>
        <div className="flex gap-1.5 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ customPrompt: s })}
              className="text-[11px] rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-stone-600 hover:border-stone-400 hover:bg-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={generate}
          disabled={generating || !design.customPrompt?.trim()}
          className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg h-10"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 ml-2 animate-spin" /> מייצר...</>
          ) : (
            <><Sparkles className="h-4 w-4 ml-2" /> ייצור עיטור</>
          )}
        </Button>
        {design.customImageUrl && (
          <Button onClick={clear} variant="outline" className="rounded-lg h-10">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {design.customImageUrl && (
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <div className="aspect-video bg-stone-100">
            <ImageIcon src={design.customImageUrl} alt="עיטור מותאם" className="w-full h-full object-cover" />
          </div>
          <p className="text-[10px] text-stone-400 px-2 py-1.5">העיטור יופיע על אבן הראש בהדמיה.</p>
        </div>
      )}
    </div>
  );
}