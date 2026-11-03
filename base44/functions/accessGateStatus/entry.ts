import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureValidCode, sha256Hex } from '../../shared/accessGate.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await req.json().catch(() => ({}));

    if (token) {
      const tokenHash = await sha256Hex(token);
      const sessions = await base44.asServiceRole.entities.AccessSession.filter({ token_hash: tokenHash });
      const session = (sessions || [])[0];
      if (session && new Date(session.expires_at).getTime() > Date.now()) {
        return Response.json({ unlocked: true, expiresAt: session.expires_at });
      }
    }

    const { record, sent } = await ensureValidCode(base44);
    return Response.json({ unlocked: false, codeExpiresAt: record.expires_at, codeSent: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}