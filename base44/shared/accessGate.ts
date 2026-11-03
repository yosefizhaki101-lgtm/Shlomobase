// Shared logic for the time-limited app access gate.
// A single active code exists at any moment: it is valid for ten minutes,
// after which the app locks again and a fresh code is generated and emailed
// to the app owner (the app's admin user). Codes are only ever stored hashed.

export const WINDOW_MS = 10 * 60 * 1000;

// Wrong guesses allowed per window, so a six-digit code can't be brute-forced.
export const MAX_ATTEMPTS = 8;

export function generateCode() {
  const digits = new Uint32Array(1);
  crypto.getRandomValues(digits);
  return String(digits[0] % 1000000).padStart(6, '0');
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function findValidCode(base44) {
  const records = await base44.asServiceRole.entities.AccessCode.filter({ is_active: true });
  const now = Date.now();
  return (records || []).find((r) => new Date(r.expires_at).getTime() > now) || null;
}

async function sendCodeEmail(base44, code, expiresAt) {
  const users = await base44.asServiceRole.entities.User.list();
  const admins = (users || []).filter((u) => u.role === 'admin' && u.email).slice(0, 3);
  if (!admins.length) return false;

  const expiresLabel = new Date(expiresAt).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jerusalem',
  });

  const results = await Promise.allSettled(
    admins.map((admin) =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        template_name: 'AccessCode',
        variables: {
          code,
          expires_at: expiresLabel,
          first_name: admin.full_name || '',
        },
        category: 'transactional',
      })
    )
  );

  return results.some((r) => r.status === 'fulfilled' && r.value && r.value.success !== false);
}

// Returns the code currently in force, creating (and emailing) a new one when
// the previous window has elapsed or none exists yet.
export async function ensureValidCode(base44) {
  const existing = await findValidCode(base44);
  if (existing) return { record: existing, sent: false, created: false };

  await base44.asServiceRole.entities.AccessCode.updateMany(
    { is_active: true },
    { $set: { is_active: false } }
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + WINDOW_MS).toISOString();
  const record = await base44.asServiceRole.entities.AccessCode.create({
    code_hash: await sha256Hex(code),
    expires_at: expiresAt,
    is_active: true,
  });

  let sent = false;
  try {
    sent = await sendCodeEmail(base44, code, expiresAt);
  } catch (error) {
    console.error('access code email failed', error.message);
  }

  return { record, sent, created: true };
}