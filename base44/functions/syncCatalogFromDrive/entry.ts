import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admins only' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // skip files already imported by drive_file_id
    const existing = await base44.asServiceRole.entities.TombstoneCatalogItem.list('-order', 500);
    const seenIds = new Set((existing || []).map((i) => i.drive_file_id).filter(Boolean));

    const folderQ = encodeURIComponent("name='לגזיאל' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${folderQ}&fields=files(id,name)`, { headers: authHeader });
    if (!folderRes.ok) {
      const t = await folderRes.text();
      return Response.json({ error: 'Drive folder search failed', details: t }, { status: 502 });
    }
    const folderData = await folderRes.json();
    const folders = folderData.files || [];
    if (folders.length === 0) return Response.json({ error: 'Folder "לגזיאל" not found in your Google Drive' }, { status: 404 });

    let added = 0;
    let skipped = 0;
    let order = Date.now();

    // Infer category from filename keywords
    function inferCategory(name) {
      const lower = name.toLowerCase();
      if (lower.includes('קטנ') || lower.includes('קטן')) return 'small';
      if (lower.includes('משפח') || lower.includes('family')) return 'family';
      if (lower.includes('ראש') || lower.includes('headstone') || lower.includes('אבן ראש')) return 'headstone';
      return 'regular';
    }

    for (const folder of folders) {
      let pageToken = '';
      do {
        const imgQ = encodeURIComponent(`'${folder.id}' in parents and mimeType contains 'image/' and trashed=false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${imgQ}&fields=nextPageToken,files(id,name,mimeType)&pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const listRes = await fetch(url, { headers: authHeader });
        if (!listRes.ok) {
          const t = await listRes.text();
          return Response.json({ error: 'Drive image list failed', details: t }, { status: 502 });
        }
        const listData = await listRes.json();
        const files = listData.files || [];

        for (const f of files) {
          if (seenIds.has(f.id)) { skipped++; continue; }
          seenIds.add(f.id);

          const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, { headers: authHeader });
          if (!dlRes.ok) { skipped++; continue; }
          const buf = await dlRes.arrayBuffer();
          const fileName = f.name || `image_${f.id}.jpg`;
          const mime = f.mimeType || 'image/jpeg';
          const fileObj = new File([buf], fileName, { type: mime });

          const up = await base44.asServiceRole.integrations.Core.UploadFile({ file: fileObj });
          await base44.asServiceRole.entities.TombstoneCatalogItem.create({
            title: fileName.replace(/\.[^.]+$/, ''),
            image_url: up.file_url,
            drive_file_id: f.id,
            description: '',
            category: inferCategory(fileName),
            order: order++,
          });
          added++;
        }
        pageToken = listData.nextPageToken || '';
      } while (pageToken);
    }

    return Response.json({ status: 'ok', added, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}