import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2 } from 'lucide-react';

const TOKEN_KEY = 'monument_access_token';

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AccessGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const lock = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUnlocked(false);
    setExpiresAt(null);
    setSecondsLeft(0);
  }, []);

  const checkStatus = useCallback(async (token) => {
    const res = await base44.functions.invoke('accessGateStatus', token ? { token } : {});
    const data = res.data || {};
    if (data.unlocked && data.expiresAt) {
      setUnlocked(true);
      setExpiresAt(data.expiresAt);
      setNotice('');
      return;
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setUnlocked(false);
    setExpiresAt(null);
    setNotice(
      data.codeSent
        ? 'פג תוקף הגישה. סיסמה חדשה נשלחה למייל של בעל האפליקציה.'
        : ''
    );
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = sessionStorage.getItem(TOKEN_KEY);
        await checkStatus(token);
      } catch {
        if (active) setError('לא הצלחנו לבדוק את מצב הגישה. נסו לרענן את העמוד.');
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [checkStatus]);

  // Server owns the window; the client only mirrors the remaining time and re-locks when it runs out.
  useEffect(() => {
    if (!unlocked || !expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        lock();
        checkStatus(null).catch(() => {});
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlocked, expiresAt, lock, checkStatus]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clean = code.replace(/\D/g, '');
    if (!clean || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('accessGateUnlock', { code: clean });
      const data = res.data || {};
      if (data.unlocked && data.token) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        setUnlocked(true);
        setExpiresAt(data.expiresAt);
        setCode('');
        setNotice('');
      } else if (data.reason === 'expired') {
        setError('תוקף הקוד פג. הקוד תקף לעשר דקות בלבד.');
        setNotice(
          data.codeSent
            ? 'נשלחה סיסמה חדשה למייל של בעל האפליקציה.'
            : 'לא הצלחנו לשלוח סיסמה חדשה. נסו לרענן את העמוד.'
        );
      } else {
        setError('הקוד שגוי. בדקו את הספרות ונסו שוב.');
      }
    } catch {
      setError('שגיאה בבדיקת הקוד. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-stone-50">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (unlocked) {
    return (
      <>
        {children}
        <div className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-full bg-stone-900/85 px-3 py-1.5 text-[11px] font-medium text-stone-100 shadow-lg backdrop-blur">
          גישה פתוחה · {formatClock(secondsLeft)}
        </div>
      </>
    );
  }

  return (
    <div dir="rtl" className="fixed inset-0 flex items-center justify-center bg-stone-100 px-5">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900">
            <Lock className="h-5 w-5 text-stone-50" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-stone-900">האפליקציה נעולה</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
            הזינו את סיסמת הגישה בת 6 הספרות. הגישה נפתחת לעשר דקות, ואחר כך ננעלת מחדש
            ונשלחת סיסמה חדשה למייל של בעל האפליקציה.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={6}
              placeholder="••••••"
              className="h-14 rounded-xl border-stone-200 text-center text-2xl tracking-[0.45em] text-stone-900 placeholder:text-stone-300"
            />
            {error && <p className="text-[12px] text-red-600">{error}</p>}
            {notice && !error && <p className="text-[12px] text-stone-500">{notice}</p>}
            <Button
              type="submit"
              disabled={submitting || code.length < 6}
              className="h-12 w-full rounded-xl bg-stone-900 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-300"
            >
              {submitting ? 'בודק…' : 'פתיחת גישה'}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-[11px] text-stone-400">
          אין לכם קוד? הוא נשלח אוטומטית למייל של בעל האפליקציה בכל חלון של עשר דקות.
        </p>
      </div>
    </div>
  );
}