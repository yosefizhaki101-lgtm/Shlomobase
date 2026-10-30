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

    const fullPrompt = `Memorial stone-carving ornament, isolated graphic: ${prompt}. Drawn as a clean engraved line-art relief in dark grey carved lines, centered, front view, completely isolated on a pure white background. No tombstone, no stone texture, no plaque, no frame, no border, no lettering, no text, no shadow. Minimalist, dignified cemetery engraving art, high contrast, symmetrical.`;
    const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: fullPrompt });
    return Response.json({ url: res?.url || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}