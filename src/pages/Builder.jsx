import { useState, useRef, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { STONE_TYPES, STEPS } from '@/lib/tombstoneOptions';
import { calcPrice } from '@/lib/tombstonePricing';
import { buildRenderPrompt } from '@/lib/buildRenderPrompt';
import { REFERENCE_TOMBSTONE_PHOTOS } from '@/lib/renderReferences';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import StonePreview from '@/components/tombstone/StonePreview';
import Logo from '@/components/tombstone/Logo';
import LeftPanel from '@/components/builder/LeftPanel';
import RightPanel from '@/components/builder/RightPanel';
import RenderModal from '@/components/builder/RenderModal';

const emptyDesign = {
  cemeteryProfile: 'default',
  tombstoneType: 'regular',
  stoneType: 'turkish_marble',
  panel: ['panel_15'],
  frame: ['frame_25_rock'],
  slab: ['slab_8_smooth'],
  headstoneTop: ['standing'],
  headstonePlacement: 'top',
  headstoneScale: 1,
  headstoneThickness: 1,
  headstoneOffsetX: 0,
  headstoneOffsetZ: 0,
  panelWidthCm: null,
  panelLengthCm: null,
  // Proportions per the reference photo: thin 10cm polished base,
  // 20cm rock foundation, thin 8cm top plate (60cm wide).
  panelHeightCm: 10,
  accessoryPositions: {},
  frameWidthCm: null,
  frameLengthCm: null,
  frameHeightCm: 20,
  slabWidthCm: 60,
  slabLengthCm: null,
  slabHeightCm: null,
  headstoneWidthCm: null,
  headstoneHeightCm: null,
  headstoneThicknessCm: null,
  panelStone: 'turkish_marble',
  frameStone: 'grey_tuvza',
  slabStone: 'turkish_marble',
  headstoneStone: 'turkish_marble',
  accessories: [],
  nerHouse: null,
  nerHouseSize: 'medium',
  nerHouseStyle: 'arched',
  colorOverride: null,
  panelColor: null,
  frameColor: null,
  slabColor: null,
  headstoneColor: null,
  letteringType: 'engraving',
  headstoneTextScale: 1,
  engravingText: 'טגאיה',
  slabText: 'אשת איש\nאחותנו\nובתנו היקרה\nטגאיה ירבבו\nבת אספו אביבה בת פלקה\nט"ו תמוז תשפ"ו\n1964-2026\nת.נ.צ.ב.ה\n\nרבות בנות עשו חיל\nואת עלית על כלנה',
  customPrompt: '',
  customImageUrl: '',
  showPrice: true,
  deceasedName: 'טגאיה ירבבו',
  cemetery: '',
  gush: '',
  chelka: '',
  row: '',
  graveNumber: '',
  completionDate: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  notes: '',
};

export default function Builder() {
  const [step, setStep] = useState(0);
  const [design, setDesign] = useState(emptyDesign);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderModal, setRenderModal] = useState({ open: false, loading: false, imageUrl: null, error: null });
  const [stoneTypes, setStoneTypes] = useState([]);
  const [partTextures, setPartTextures] = useState([]);
  const [glbModels, setGlbModels] = useState([]);
  const [mobileTab, setMobileTab] = useState('design');
  const previewRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.StoneType.list('-created_date', 100),
      base44.entities.PartTexture.list('-created_date', 500),
      base44.entities.GlbModel.list('-created_date', 200),
    ]).then(([st, pt, gm]) => {
      setStoneTypes(st || []);
      setPartTextures(pt || []);
      setGlbModels(gm || []);
    }).catch(() => {});
  }, []);

  const designWithTextures = useMemo(() => {
    const findTex = (stoneId, cat) => {
      const st = stoneTypes.find((s) => s.slug === stoneId);
      if (!st) return null;
      const pt = partTextures.find((t) => t.stone_type_id === st.id && t.part_category === cat);
      return pt?.texture_file || null;
    };
    return {
      ...design,
      panelTextureUrl: findTex(design.panelStone || design.stoneType, 'base'),
      frameTextureUrl: findTex(design.frameStone || design.stoneType, 'frame'),
      slabTextureUrl: findTex(design.slabStone || design.stoneType, 'cover'),
      headstoneTextureUrl: findTex(design.headstoneStone || design.stoneType, 'pillow'),
    };
  }, [design, stoneTypes, partTextures]);

  const update = (patch) => setDesign((d) => ({ ...d, ...patch }));

  // Dragging an accessory in the 3D view persists its new offset
  const moveAccessory = (index, pos) => setDesign((d) => {
    const positions = { ...(d.accessoryPositions || {}) };
    positions[index] = { ...(positions[index] || {}), ...pos };
    return { ...d, accessoryPositions: positions };
  });

  const handlePhotorealisticRender = async () => {
    setRendering(true);
    setRenderModal({ open: true, loading: true, imageUrl: null, error: null });
    try {
      // 1. Capture the 3D preview as a screenshot
      const screenshotDataUrl = previewRef.current?.captureImage?.();
      let referenceImageUrl = null;
      if (screenshotDataUrl && screenshotDataUrl.startsWith('data:image/')) {
        try {
          // 2. Convert dataURL to blob and upload to public storage
          const base64 = screenshotDataUrl.split(',')[1];
          const byteString = atob(base64);
          const bytes = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'image/png' });
          const file = new File([blob], 'tombstone-preview.png', { type: 'image/png' });
          const uploadRes = await base44.integrations.Core.UploadPublicFile({ file });
          referenceImageUrl = uploadRes?.file_url || null;
        } catch (uploadErr) {
          console.error('Screenshot upload failed, proceeding without reference image:', uploadErr);
        }
      }
      // 3. Build the prompt and call GenerateImage with the 3D screenshot (structure)
      //    AND real tombstone reference photos (photorealistic quality target)
      const prompt = buildRenderPrompt(design);
      const genArgs = { prompt };
      // The 3D screenshot goes FIRST (structure reference), real photos follow (quality reference)
      const imageRefs = [];
      if (referenceImageUrl) imageRefs.push(referenceImageUrl);
      imageRefs.push(...REFERENCE_TOMBSTONE_PHOTOS);
      genArgs.existing_image_urls = imageRefs;
      const res = await base44.integrations.Core.GenerateImage(genArgs);
      const url = res?.url;
      if (!url) throw new Error('לא התקבלה תמונה');
      setRenderModal({ open: true, loading: false, imageUrl: url, error: null });
    } catch (e) {
      console.error(e);
      setRenderModal({ open: true, loading: false, imageUrl: null, error: 'שגיאה ביצירת הרנדור. נסה שוב.' });
    } finally {
      setRendering(false);
    }
  };

  const shareToWhatsApp = () => {
    const dataUrl = previewRef.current?.captureImage?.();
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'לגזיאל-עיצוב-מצבה.png';
      a.click();
    }
    const stone = STONE_TYPES.find((s) => s.id === design.stoneType);
    const price = calcPrice(design);
    const lines = [
      `גוף: ${stone?.name || ''}`,
      design.deceasedName && `שם הנפטר/ת: ${design.deceasedName}`,
      design.contactName && `איש קשר: ${design.contactName}`,
      design.contactPhone && `טלפון: ${design.contactPhone}`,
      design.showPrice !== false && `הערכת מחיר: ${price.withVat} ₪`,
    ].filter(Boolean).join('\n');
    const msg = encodeURIComponent(`שלום לגזיאל,\nעיצבתי מצבה דרך האתר.\n\n${lines}\n\nמצרף/ת תמונה של העיצוב.`);
    window.open(`https://wa.me/972505779173?text=${msg}`, '_blank');
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const price = calcPrice(design);
      await base44.entities.TombstoneDesign.create({
        cemetery_profile: design.cemeteryProfile,
        stone_type: design.stoneType,
        tombstone_type: design.tombstoneType,
        panel: Array.isArray(design.panel) ? design.panel.join(',') : design.panel,
        frame: Array.isArray(design.frame) ? design.frame.join(',') : design.frame,
        slab: Array.isArray(design.slab) ? design.slab.join(',') : design.slab,
        headstone_top: Array.isArray(design.headstoneTop) ? design.headstoneTop.join(',') : design.headstoneTop,
        headstone_placement: design.headstonePlacement,
        headstone_scale: design.headstoneScale,
        headstone_thickness: design.headstoneThickness,
        headstone_offset_x: design.headstoneOffsetX,
        headstone_offset_z: design.headstoneOffsetZ,
        panel_width_cm: design.panelWidthCm,
        panel_length_cm: design.panelLengthCm,
        panel_height_cm: design.panelHeightCm,
        accessory_positions: design.accessoryPositions,
        frame_width_cm: design.frameWidthCm,
        frame_length_cm: design.frameLengthCm,
        frame_height_cm: design.frameHeightCm,
        slab_width_cm: design.slabWidthCm,
        slab_length_cm: design.slabLengthCm,
        slab_height_cm: design.slabHeightCm,
        headstone_width_cm: design.headstoneWidthCm,
        headstone_height_cm: design.headstoneHeightCm,
        headstone_text_scale: design.headstoneTextScale,
        panel_stone: design.panelStone,
        frame_stone: design.frameStone,
        slab_stone: design.slabStone,
        headstone_stone: design.headstoneStone,
        accessories: { items: design.accessories },
        ner_house: design.nerHouse,
        ner_house_size: design.nerHouseSize,
        ner_house_style: design.nerHouseStyle,
        lettering_type: design.letteringType,
        engraving_text: design.engravingText,
        custom_prompt: design.customPrompt,
        custom_image_url: design.customImageUrl,
        show_price: design.showPrice,
        deceased_name: design.deceasedName,
        cemetery: design.cemetery,
        gush: design.gush,
        chelka: design.chelka,
        row: design.row,
        grave_number: design.graveNumber,
        completion_date: design.completionDate,
        contact_name: design.contactName,
        contact_phone: design.contactPhone,
        contact_email: design.contactEmail,
        notes: design.notes,
        price_before_vat: price.beforeVat,
        price_total: price.withVat,
        status: 'new',
      });
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="h-[100vh] h-[100dvh] flex flex-col overflow-hidden bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-stone-200 bg-white">
        <div className="px-3 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="h-8 sm:h-10" />
            <div className="hidden sm:block">
              <h1 className="font-serif text-sm leading-tight">מערכת הדמיית מצבות</h1>
              <a href="tel:0505779173" className="text-[10px] text-stone-500" dir="ltr">050-5779173</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/catalog" className="text-xs font-medium text-stone-600 hover:text-stone-900">קטלוג</a>
            <a href="/admin" className="text-xs font-medium text-stone-400 hover:text-stone-900 hidden sm:block">מנהל</a>
          </div>
        </div>
      </header>

      {/* Desktop: three-pane layout */}
      <div className="hidden lg:flex flex-1 min-h-0">
        {/* Right panel (text/details) — first in DOM = visual right in RTL */}
        <aside className="w-80 flex-shrink-0 border-l border-stone-200 bg-white overflow-hidden">
          <RightPanel design={design} update={update} submitting={submitting} done={done} onSubmit={submit} />
        </aside>

        {/* Center canvas */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 relative">
            <StonePreview ref={previewRef} design={designWithTextures} glbModels={glbModels} onAccessoryMove={moveAccessory} />
          </div>
          {/* Action bar */}
          <div className="flex-shrink-0 border-t border-stone-200 bg-white px-4 py-2 flex items-center justify-center gap-2">
            <span className="text-[11px] text-stone-400 ml-2">שלב {step + 1}/{STEPS.length}</span>
            <button type="button" onClick={shareToWhatsApp} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors">
              שתף
            </button>
            <button type="button" onClick={shareToWhatsApp} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors">
              שמור תמונה
            </button>
            <button
              type="button"
              onClick={handlePhotorealisticRender}
              disabled={rendering}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                rendering ? 'bg-stone-200 text-stone-400' : 'bg-stone-800 text-white hover:bg-stone-700'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {rendering ? 'מרנדר...' : 'רנדור פוטוריאליסטי'}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !design.contactName || !design.contactPhone}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors',
                submitting || !design.contactName || !design.contactPhone
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              )}
            >
              {submitting ? 'שולח...' : 'הזמן'}
            </button>
          </div>
        </main>

        {/* Left panel (step navigation + options) — last in DOM = visual left in RTL */}
        <aside className="w-80 flex-shrink-0 border-r border-stone-200 bg-white overflow-hidden">
          <LeftPanel step={step} setStep={setStep} design={design} update={update} />
        </aside>
      </div>

      {/* Mobile: stacked layout with tabs */}
      <div className="flex lg:hidden flex-1 flex-col min-h-0">
        {/* 3D preview */}
        <div className="flex-shrink-0 h-[35dvh] min-h-[180px] max-h-[280px] relative border-b border-stone-200">
          <StonePreview ref={previewRef} design={designWithTextures} onAccessoryMove={moveAccessory} />
        </div>
        {/* Mobile tabs */}
        <div className="flex-shrink-0 border-b border-stone-200 bg-white flex">
          <button
            type="button"
            onClick={() => setMobileTab('design')}
            className={cn('flex-1 py-2 text-xs font-medium transition-colors', mobileTab === 'design' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400')}
          >
            עיצוב
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('text')}
            className={cn('flex-1 py-2 text-xs font-medium transition-colors', mobileTab === 'text' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400')}
          >
            פרטים וטקסט
          </button>
        </div>
        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
          {mobileTab === 'design' ? (
            <LeftPanel step={step} setStep={setStep} design={design} update={update} />
          ) : (
            <RightPanel design={design} update={update} submitting={submitting} done={done} onSubmit={submit} />
          )}
        </div>
        {/* Mobile share button */}
        <div className="flex-shrink-0 border-t border-stone-200 bg-white p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex gap-2">
          <button
            type="button"
            onClick={shareToWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium py-2 transition-colors"
          >
            שתף בווצאפ
          </button>
          <button
            type="button"
            onClick={handlePhotorealisticRender}
            disabled={rendering}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium py-2 transition-colors',
              rendering ? 'bg-stone-200 text-stone-400' : 'bg-stone-700 text-white'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {rendering ? 'מרנדר...' : 'רנדור'}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !design.contactName || !design.contactPhone}
            className={cn(
              'flex-1 rounded-lg text-xs font-medium py-2 transition-colors',
              submitting || !design.contactName || !design.contactPhone
                ? 'bg-stone-200 text-stone-400'
                : 'bg-stone-900 text-white'
            )}
          >
            {submitting ? 'שולח...' : done ? '✓ נשלח' : 'שלח בקשה'}
          </button>
        </div>
      </div>

      {/* Photorealistic render modal */}
      <RenderModal
        open={renderModal.open}
        loading={renderModal.loading}
        imageUrl={renderModal.imageUrl}
        error={renderModal.error}
        onClose={() => setRenderModal((m) => ({ ...m, open: false }))}
      />
    </div>
  );
}