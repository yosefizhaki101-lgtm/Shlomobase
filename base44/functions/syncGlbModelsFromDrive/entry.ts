import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admins only' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Skip files already imported by drive_file_id
    const existing = await base44.asServiceRole.entities.GlbModel.list('-created_date', 500);
    const seenIds = new Set((existing || []).map((i) => i.drive_file_id).filter(Boolean));

    // Find the "לגזיאל-מודלים" folder (or "לגזיאל" with a "מודלים" subfolder)
    const folderQ = encodeURIComponent("name='לגזיאל-מודלים' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${folderQ}&fields=files(id,name)`, { headers: authHeader });
    if (!folderRes.ok) {
      const t = await folderRes.text();
      return Response.json({ error: 'Drive folder search failed', details: t }, { status: 502 });
    }
    const folderData = await folderRes.json();
    const folders = folderData.files || [];
    if (folders.length === 0) {
      return Response.json({ error: 'Folder "לגזיאל-מודלים" not found. Create a folder with this name in your Google Drive and place .glb files inside.' }, { status: 404 });
    }

    // Component type labels for option_label
    const COMPONENT_LABELS = {
      headstone: 'אבן ראש',
      slab: 'פלטה',
      frame: 'מסגרת',
      panel: 'פאנל',
      accessory: 'תוספת',
    };

    let added = 0;
    let skipped = 0;
    const errors = [];

    for (const folder of folders) {
      let pageToken = '';
      do {
        // List GLB files — mimeType can be model/gltf-binary or application/octet-stream
        const glbQ = encodeURIComponent(`'${folder.id}' in parents and trashed=false and (name contains '.glb' or name contains '.gltf')`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${glbQ}&fields=nextPageToken,files(id,name,mimeType)&pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const listRes = await fetch(url, { headers: authHeader });
        if (!listRes.ok) {
          const t = await listRes.text();
          return Response.json({ error: 'Drive file list failed', details: t }, { status: 502 });
        }
        const listData = await listRes.json();
        const files = listData.files || [];

        for (const f of files) {
          if (seenIds.has(f.id)) { skipped++; continue; }
          seenIds.add(f.id);

          // Parse filename: expected format {component_type}_{option_id}.glb
          // e.g., headstone_standing.glb, slab_8_smooth.glb
          const baseName = f.name.replace(/\.(glb|gltf)$/i, '');
          const underscoreIdx = baseName.indexOf('_');
          if (underscoreIdx === -1) {
            errors.push(`Skipping ${f.name}: filename must be {component_type}_{option_id}.glb`);
            skipped++;
            continue;
          }
          const componentType = baseName.substring(0, underscoreIdx);
          const optionId = baseName.substring(underscoreIdx + 1);

          const validTypes = ['headstone', 'slab', 'frame', 'panel', 'accessory'];
          if (!validTypes.includes(componentType)) {
            errors.push(`Skipping ${f.name}: unknown component type "${componentType}"`);
            skipped++;
            continue;
          }

          // Download the GLB file
          const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, { headers: authHeader });
          if (!dlRes.ok) { skipped++; continue; }
          const buf = await dlRes.arrayBuffer();
          const fileName = f.name || `model_${f.id}.glb`;
          const mime = f.mimeType || 'model/gltf-binary';
          const fileObj = new File([buf], fileName, { type: mime });

          // Upload to public storage
          const up = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file: fileObj });

          // Create GlbModel record
          await base44.asServiceRole.entities.GlbModel.create({
            component_type: componentType,
            option_id: optionId,
            option_label: `${COMPONENT_LABELS[componentType] || componentType} — ${optionId}`,
            file_url: up.file_url,
            drive_file_id: f.id,
            scale: 1,
            offset_x: 0,
            offset_y: 0,
            offset_z: 0,
            rotation_y: 0,
            keep_original_material: false,
            is_active: true,
          });
          added++;
        }
        pageToken = listData.nextPageToken || '';
      } while (pageToken);
    }

    return Response.json({ status: 'ok', added, skipped, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}