import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prompt = body?.prompt?.trim();
    if (!prompt || prompt.length > 500) {
      return Response.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    const fullPrompt = `Stone carving relief on a tombstone, elegant, monochrome stone texture, sculpted decoration: ${prompt}. Minimalist, dignified, memorial art style.`;
    const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: fullPrompt });
    return Response.json({ url: res?.url || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}