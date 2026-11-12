import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// מספר הטלפון מומר לפורמט בינלאומי — ההודעה תישלח אך ורק למספר הזה,
// בלי אפשרות לבחור נמען אחר.
export function toIntlPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

export default function ShareWhatsAppDialog({ open, onClose, initialPhone, onSend }) {
  const [phone, setPhone] = useState(initialPhone || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPhone(initialPhone || '');
      setError('');
    }
  }, [open, initialPhone]);

  const submit = (event) => {
    event.preventDefault();
    const intl = toIntlPhone(phone);
    if (intl.length < 11) {
      setError('הזינו מספר טלפון תקין עם קידומת, לדוגמה 050-1234567.');
      return;
    }
    onSend(intl, phone);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>שיתוף העיצוב בוואטסאפ</DialogTitle>
          <DialogDescription>
            ההודעה נשלחת ישירות לוואטסאפ שלכם — הזינו את המספר שאליו תישלח.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="share-phone" className="text-xs font-medium text-stone-600">
            מספר טלפון
          </label>
          <Input
            id="share-phone"
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-1234567"
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">ביטול</Button>
            </DialogClose>
            <Button type="submit" className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
              שלח בוואטסאפ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}