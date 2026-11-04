import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FALLBACK = {
  name: 'מערכת הדמיית מצבות',
  coordinator: '',
  phone: '',
  email: '',
  address: '',
  hours: '',
  notes: '',
  updated: '',
};

function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="space-y-2">
      <h2 id={`${id}-title`} className="text-base font-bold text-stone-900">
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

export default function Accessibility() {
  const [store, setStore] = useState(FALLBACK);

  useEffect(() => {
    base44.entities.StoreSettings.list()
      .then((rows) => {
        const s = (rows || [])[0];
        if (!s) return;
        setStore({
          name: s.store_name || FALLBACK.name,
          coordinator: s.coordinator_name || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          hours: s.service_hours || '',
          notes: s.accessibility_notes || '',
          updated: s.last_updated || '',
        });
      })
      .catch(() => setStore(FALLBACK));
  }, []);

  const updatedText = store.updated
    ? new Date(store.updated).toLocaleDateString('he-IL')
    : new Date().toLocaleDateString('he-IL');

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="font-serif text-base">הצהרת נגישות</h1>
          <Link to="/" className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            חזרה לדף הבית
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-7">
        <p className="text-xs text-stone-500">עודכן לאחרונה: {updatedText}</p>

        <Section id="intro" title="1. מחויבות לנגישות">
          <p>
            {store.name} רואה בנגישות השירות ובנגישות האתר ערך עליון, ופועלת לאפשר לכל אדם — לרבות אנשים עם
            מוגבלות — לקבל את השירות באופן עצמאי, שוויוני ומכובד.
          </p>
          <p>
            האתר והשירות הונגשו בהתאם ל<strong>חוק שוויון זכויות לאנשים עם מוגבלות, התשנ״ח-1998</strong>, ל
            <strong>תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013</strong>, ולתקן
            הישראלי <strong>ת״י 5568</strong> ברמת <strong>AA</strong>, המבוסס על הנחיות{' '}
            <strong>WCAG 2.0</strong> של ארגון W3C.
          </p>
        </Section>

        <Section id="site" title="2. נגישות האתר">
          <p>באתר בוצעו, בין היתר, ההתאמות הבאות:</p>
          <ul className="list-disc pr-5 space-y-1">
            <li>ניווט מלא באמצעות המקלדת, ברצף מיקוד הגיוני, ללא מלכודות מקלדת.</li>
            <li>קישור ״דילוג לתוכן הראשי״ בראש כל עמוד, לחסימת אזורי הניווט החוזרים.</li>
            <li>סימון מיקוד ברור ומוגבר לכל רכיב שניתן להפעיל במקלדת.</li>
            <li>מבנה סמנטי תקין: כותרות מדורגות, רשימות, אזורי ניווט ותוכן מסומנים.</li>
            <li>טקסט חלופי לתמונות, לאייקונים משמעותיים ולכפתורים.</li>
            <li>ניגודיות צבעים העומדת בדרישות התקן, וטקסט הניתן להגדלה עד 175% בלי אובדן תוכן.</li>
            <li>אפשרות לעצירת אנימציות ותנועה באתר.</li>
            <li>תאימות לקוראי מסך נפוצים: NVDA, JAWS, VoiceOver ו-TalkBack.</li>
            <li>תצוגה מותאמת למחשב, לטאבלט ולטלפון נייד (עיצוב רספונסיבי).</li>
            <li>הימנעות מתוכן מהבהב או מהבהיק העלול לעורר התקפים.</li>
            <li>טפסים עם תוויות ברורות והודעות שגיאה טקסטואליות.</li>
          </ul>
        </Section>

        <Section id="widget" title="3. כלי הנגישות באתר">
          <p>
            בפינת המסך מופיע כפתור נגישות צף (סמל אדם בעיגול), הזמין בכל עמוד ובכל שלב. לחיצה עליו פותחת תפריט
            הכולל:
          </p>
          <ul className="list-disc pr-5 space-y-1">
            <li>הגדלת טקסט והקטנתו — בין 100% ל-175%, וכן איפוס.</li>
            <li>ניגודיות גבוהה (טקסט בהיר על רקע כהה).</li>
            <li>תצוגת גווני אפור.</li>
            <li>הדגשת כל הקישורים באתר בקו תחתון ובמסגרת.</li>
            <li>גופן קריא ופשוט עם ריווח שורות מוגדל.</li>
            <li>עצירת אנימציות ותנועה.</li>
          </ul>
          <p>ההעדפות נשמרות בדפדפן שלכם וממשיכות לפעול בביקורים הבאים. לניתוק ההעדפות יש ללחוץ ״איפוס״ בתפריט.</p>
        </Section>

        <Section id="coordinator" title="4. רכז הנגישות">
          <p>לכל בקשה, שאלה, תקלה או הצעה בנושא נגישות ניתן לפנות לרכז/ת הנגישות של העסק:</p>
          <ul className="space-y-2 not-prose">
            <li className="font-medium text-stone-900">
              {store.coordinator || store.name}
              <span className="block text-xs font-normal text-stone-500">רכז/ת נגישות</span>
            </li>
            {store.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-stone-400" aria-hidden="true" />
                <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className="text-stone-900 underline">
                  {store.phone}
                </a>
              </li>
            )}
            {store.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-stone-400" aria-hidden="true" />
                <a href={`mailto:${store.email}`} className="text-stone-900 underline">
                  {store.email}
                </a>
              </li>
            )}
            {store.address && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-stone-400" aria-hidden="true" />
                {store.address}
              </li>
            )}
            {store.hours && <li className="text-stone-600">שעות פעילות: {store.hours}</li>}
          </ul>
          <p>
            אנו משתדלים להשיב לכל פנייה בנושא נגישות בתוך <strong>3 ימי עסקים</strong>. פנייה שמתארת תקלה
            נגישותית תטופל בהתאם לחומרתה ולפי סדרי העדיפויות שלנו, ובשום מקרה לא ייגבה תשלום עבור עצם הפנייה.
          </p>
        </Section>

        <Section id="service" title="5. הסדרי נגישות בשירות ובחנות">
          <p>
            השירות ניתן ב<strong>{store.address || store.name}</strong>, וכן בערוצים חלופיים כדי לאפשר קבלת שירות
            גם למי שאינו יכול להגיע למקום:
          </p>
          <ul className="list-disc pr-5 space-y-1">
            <li>שירות טלפוני — {store.phone || 'בטלפון העסק'}.</li>
            <li>שירות בדואר אלקטרוני — {store.email || 'בדואר האלקטרוני של העסק'}.</li>
            <li>פגישה אישית בתיאום מראש, וכן הגעה אל הלקוח לפי הצורך ובכפוף לתיאום.</li>
            <li>מסירת מידע, הצעות מחיר ותרשימים בפורמט קריא: הדפסה מוגדלת, קובץ דיגיטלי נגיש או הסבר בעל פה.</li>
            <li>תיאום צפייה בקטלוג ובהדמיה גם לגבי דגמים שאינם מוצגים באתר.</li>
          </ul>
          <p>
            לבירור הסדרי הנגישות הפיזיים של מקום השירות (חנייה, כניסה, שירותים, רוחב מעברים) — כולל התאמות
            נקודתיות לפי בקשה — יש לפנות לרכז/ת הנגישות לפני הביקור, כדי שנוכל להיערך מראש.
          </p>
          {store.notes && <p className="rounded-lg bg-stone-100 p-3 text-stone-800">{store.notes}</p>}
        </Section>

        <Section id="gaps" title="6. תכנים ורכיבים שטרם הונגשו">
          <p>
            אנו ממשיכים לפעול לשיפור הנגישות באופן שוטף. להלן הידוע לנו כיום כרכיבים שאינם נגישים במלואם, וכן
            החלופה הזמינה עבורם:
          </p>
          <ul className="list-disc pr-5 space-y-1">
            <li>
              <strong>ההדמיה התלת-ממדית</strong> מאפשרת גרירת פריטים בעכבר או במגע. חלופה למשתמשי מקלדת: מיקום
              הפריטים ומידות כל רכיב ניתנים להזנה מדויקת בשדות המספריים בלוח הבקרה.
            </li>
            <li>
              <strong>תמונת הרנדור הפוטוריאליסטי</strong> היא תמונה; היא מלווה בתיאור כללי, ואינה מחליפה את פרטי
              העיצוב המופיעים בטקסט ובסיכום ההזמנה.
            </li>
            <li>
              <strong>תמונות קטלוג</strong> מסוימות עשויות להיות חסרות תיאור מלא. תיאור מילולי של דגם ניתן לקבל
              מהמוקד או מרכז/ת הנגישות.
            </li>
            <li>
              <strong>תכנים שהוזנו על ידי המשתמש</strong> (כגון נוסח המצבה) מוצגים כפי שהוזנו, ואינם בשליטתנו.
            </li>
            <li>
              <strong>מסמכים חיצוניים</strong> המקושרים מהאתר עשויים שלא להיות נגישים; נשמח לספק אותם בפורמט נגיש
              לפי בקשה.
            </li>
          </ul>
        </Section>

        <Section id="request" title="7. בקשה להתאמה, מידע בפורמט נגיש ותלונה">
          <p>
            כל בקשה לקבלת מידע בפורמט נגיש, להתאמת השירות או לתיקון ליקוי נגישות תופנה לרכז/ת הנגישות בערוצים
            המפורטים בסעיף 4. אנו מתחייבים לבחון כל פנייה, להשיב לה ולעדכן על הטיפול בה.
          </p>
          <p>
            אם לא קיבלתם מענה הולם, ניתן לפנות לנציבות שוויון זכויות לאנשים עם מוגבלות במשרד המשפטים.
          </p>
        </Section>

        <Section id="statement" title="8. עדכון ההצהרה">
          <p>
            הצהרת נגישות זו מתייחסת לאתר ולהדמיה המקוונת ולשירות הנלווה אליהם, ונבדקה מחדש ב-{updatedText}.
            ההצהרה תתעדכן בכל שינוי מהותי בשירות או באתר, ולפחות אחת לשנה.
          </p>
          <p className="text-xs text-stone-500">
            המידע בהצהרה זו מוצג בשפה פשוטה וברורה, בהתאם לעקרון ההבנה שבתקן.
          </p>
        </Section>

        <div className="pt-2">
          <Link to="/" className="text-sm font-medium text-stone-900 underline">
            חזרה למערכת ההדמיה
          </Link>
        </div>
      </main>
    </div>
  );
}