import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureValidCode, findValidCode, sha256Hex, MAX_ATTEMPTS, WINDOW_MS } from '../../shared/accessGate.ts';

// Public by design (the app is open without login): the emailed code is the credential.
// Wrong guesses are capped per ten-minute window so the code cannot be brute-forced.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const { code } = await req.json().catch(() => ({}));
    const submitted = String(code || '').replace(/\D/g, '');
    if (!submitted) return Response.json({ error: 'code_required' }, { status: 400 });

    const current = await findValidCode(base44);

    if (!current) {
      // The previous window is over: a brand new code has just been emailed.
      const { record, sent } = await ensureValidCode(base44);
      return Response.json({
        unlocked: false,
        reason: 'expired',
        codeSent: sent,
        codeExpiresAt: record.expires_at,
      });
    }

    const isAdmin = user && user.role === 'admin';
    // הקוד קבוע ואינו מתחלף, ולכן ספירת הניסיונות מתאפסת לאחר חלון של עשר דקות
    // כדי שהנעילה לא תישאר לתמיד בגלל הקלדות שגויות.
    const lastTryAt = current.updated_date ? new Date(current.updated_date).getTime() : 0;
    const withinWindow = Date.now() - lastTryAt < WINDOW_MS;
    if (!isAdmin && !withinWindow && current.attempts) {
      await base44.asServiceRole.entities.AccessCode.update(current.id, { attempts: 0 });
      current.attempts = 0;
    }
    if (!isAdmin && withinWindow && (current.attempts || 0) >= MAX_ATTEMPTS) {
      return Response.json({ unlocked: false, reason: 'throttled' });
    }

    const submittedHash = await sha256Hex(submitted);
    if (submittedHash !== current.code_hash) {
      if (!isAdmin) {
        await base44.asServiceRole.entities.AccessCode.update(current.id, {
          attempts: (current.attempts || 0) + 1,
        });
      }
      return Response.json({ unlocked: false, reason: 'invalid' });
    }

    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    // הגישה נפתחת לחלון של עשר דקות (או עד תום תוקף הקוד, המוקדם מביניהם)
    const sessionExpires = new Date(
      Math.min(Date.now() + WINDOW_MS, new Date(current.expires_at).getTime())
    ).toISOString();
    await base44.asServiceRole.entities.AccessSession.create({
      token_hash: await sha256Hex(token),
      expires_at: sessionExpires,
    });

    return Response.json({ unlocked: true, token, expiresAt: sessionExpires });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}