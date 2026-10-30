import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildTombstone, disposeGroup } from '@/lib/tombstoneGeometry';
import { createCemeteryEnvironment, createDesignGround } from '@/lib/cemeteryEnvironment';
import { loadGlbModels } from '@/lib/glbModelCache';

const StonePreview = forwardRef(({ design, glbModels = [], onAccessoryMove }, ref) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const contentRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const envGroupRef = useRef(null);
  const lightsRef = useRef([]);
  const targetExplodeRef = useRef(0);
  const currentExplodeRef = useRef(0);
  const glbMapRef = useRef(new Map());
  const modeRef = useRef('design');
  const renderCallbackRef = useRef(null);
  const draggablesRef = useRef([]);
  const onMoveRef = useRef(onAccessoryMove);
  onMoveRef.current = onAccessoryMove;
  const designRef = useRef(design);
  designRef.current = design;
  const [glbReady, setGlbReady] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [mode, setMode] = useState('design');

  // High-resolution photorealistic render: temporarily scales the renderer to 2x,
  // renders one frame, captures the canvas, then restores original size.
  const doHighResRender = () => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!renderer || !camera || !scene) return null;

    const w = renderer.domElement.clientWidth || 800;
    const h = renderer.domElement.clientHeight || 600;
    const scale = 2;

    renderer.setSize(w * scale, h * scale, false);
    camera.aspect = (w * scale) / (h * scale);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    // Restore
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    return dataUrl;
  };

  useImperativeHandle(ref, () => ({
    captureImage: () => rendererRef.current?.domElement?.toDataURL('image/png') || null,
    // Switch to photo mode (if needed) and return a high-res PNG dataURL
    renderPhotorealistic: () => {
      if (modeRef.current === 'photo') {
        return Promise.resolve(doHighResRender());
      }
      return new Promise((resolve) => {
        renderCallbackRef.current = resolve;
        setMode('photo');
      });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(3.5, 1.8, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envTex = pmrem.fromScene(envScene, 0.04);
    scene.environment = envTex;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 0.9, -0.1);
    controls.enablePan = false;

    // ---- Drag accessories directly on the grave ----
    const canvasEl = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const dragPoint = new THREE.Vector3();
    const grabOffset = new THREE.Vector3();
    let draggedNode = null;
    let dragOrigin = null;

    const updateNdc = (clientX, clientY) => {
      const rect = canvasEl.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onDragMove = (event) => {
      if (!draggedNode) return;
      updateNdc(event.clientX, event.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
      const bounds = draggedNode.userData.bounds || { hw: 0.4, hl: 0.8 };
      const nx = Math.max(-bounds.hw, Math.min(bounds.hw, dragPoint.x + grabOffset.x));
      const nz = Math.max(-bounds.hl, Math.min(bounds.hl, dragPoint.z + grabOffset.z));
      draggedNode.position.x = nx;
      draggedNode.position.z = nz;
      if (draggedNode.userData.rest) {
        draggedNode.userData.rest.x = nx;
        draggedNode.userData.rest.z = nz;
      }
    };

    const onDragEnd = () => {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
      window.removeEventListener('pointercancel', onDragEnd);
      const node = draggedNode;
      draggedNode = null;
      canvasEl.style.cursor = '';
      controls.enabled = true;
      if (!node || !dragOrigin) return;
      const dx = node.position.x - dragOrigin.x;
      const dz = node.position.z - dragOrigin.z;
      if (Math.abs(dx) > 0.004 || Math.abs(dz) > 0.004) {
        onMoveRef.current?.(node.userData.accIndex, {
          x: (dragOrigin.base.x || 0) + dx,
          z: (dragOrigin.base.z || 0) + dz,
        });
      }
    };

    const onDragStart = (event) => {
      const items = draggablesRef.current;
      if (!items || items.length === 0) return;
      updateNdc(event.clientX, event.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(items, true);
      if (!hits.length) return;
      let node = hits[0].object;
      while (node && node.userData.accIndex === undefined) node = node.parent;
      if (!node) return;
      // Grabbed an accessory — take over the gesture so the camera does not orbit
      event.stopPropagation();
      event.preventDefault();
      draggedNode = node;
      controls.enabled = false;
      dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), node.position);
      if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
        grabOffset.set(node.position.x - dragPoint.x, 0, node.position.z - dragPoint.z);
      } else {
        grabOffset.set(0, 0, 0);
      }
      dragOrigin = {
        x: node.position.x,
        z: node.position.z,
        base: { ...(((designRef.current?.accessoryPositions || {})[node.userData.accIndex]) || {}) },
      };
      canvasEl.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', onDragEnd);
      window.addEventListener('pointercancel', onDragEnd);
    };

    container.addEventListener('pointerdown', onDragStart, true);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const cur = currentExplodeRef.current;
      const tgt = targetExplodeRef.current;
      const next = cur + (tgt - cur) * 0.1;
      currentExplodeRef.current = Math.abs(tgt - next) < 0.001 ? tgt : next;
      const e = currentExplodeRef.current;
      if (contentRef.current) {
        contentRef.current.children.forEach((child) => {
          if (child.userData.rest) {
            child.position.copy(child.userData.rest).addScaledVector(child.userData.explodeOffset, e);
          }
        });
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      container.removeEventListener('pointerdown', onDragStart, true);
      controls.dispose();
      if (contentRef.current) {
        scene.remove(contentRef.current);
        disposeGroup(contentRef.current);
        contentRef.current = null;
      }
      if (envGroupRef.current) {
        disposeGroup(envGroupRef.current);
        envGroupRef.current = null;
      }
      lightsRef.current.forEach((l) => scene.remove(l));
      lightsRef.current = [];
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // Swap environment + lighting when mode changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    modeRef.current = mode;

    // Remove old environment
    if (envGroupRef.current) {
      scene.remove(envGroupRef.current);
      disposeGroup(envGroupRef.current);
    }
    // Remove old lights
    lightsRef.current.forEach((l) => scene.remove(l));
    lightsRef.current = [];

    if (mode === 'photo') {
      // Cemetery environment
      envGroupRef.current = createCemeteryEnvironment();
      scene.add(envGroupRef.current);

      // Natural daylight — warm sun + cool sky
      const sun = new THREE.DirectionalLight(0xfff4e0, 3.5);
      sun.position.set(6, 10, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = 40;
      sun.shadow.camera.left = -7;
      sun.shadow.camera.right = 7;
      sun.shadow.camera.top = 7;
      sun.shadow.camera.bottom = -7;
      sun.shadow.bias = -0.0003;
      sun.shadow.normalBias = 0.02;
      scene.add(sun);
      lightsRef.current.push(sun);

      const sky = new THREE.HemisphereLight(0xb0d0ff, 0xc5b394, 0.8);
      scene.add(sky);
      lightsRef.current.push(sky);

      const bounce = new THREE.DirectionalLight(0xe8d8c0, 0.3);
      bounce.position.set(-3, 1, -4);
      scene.add(bounce);
      lightsRef.current.push(bounce);

      scene.fog = new THREE.Fog(0xc5b8a0, 8, 30);
      scene.background = new THREE.Color(0xc5b8a0);
    } else {
      // Design environment — clean museum studio with soft natural light
      envGroupRef.current = createDesignGround();
      scene.add(envGroupRef.current);

      // Soft sky fill — warm top, cool bottom (museum ambient)
      const hemi = new THREE.HemisphereLight(0xfffef8, 0xc8c0b0, 0.7);
      scene.add(hemi);
      lightsRef.current.push(hemi);

      // Main key light — warm sun from upper right front
      const dir = new THREE.DirectionalLight(0xfff5e6, 3.2);
      dir.position.set(5, 9, 5);
      dir.castShadow = true;
      dir.shadow.mapSize.set(2048, 2048);
      dir.shadow.camera.near = 0.5;
      dir.shadow.camera.far = 40;
      dir.shadow.camera.left = -7;
      dir.shadow.camera.right = 7;
      dir.shadow.camera.top = 7;
      dir.shadow.camera.bottom = -7;
      dir.shadow.bias = -0.0004;
      dir.shadow.normalBias = 0.03;
      dir.shadow.radius = 4;
      scene.add(dir);
      lightsRef.current.push(dir);

      // Cool fill from opposite side — soft blue sky bounce
      const fill = new THREE.DirectionalLight(0xd0e0ff, 0.5);
      fill.position.set(-4, 3, -3);
      scene.add(fill);
      lightsRef.current.push(fill);

      // Front angled light for subtle shadow depth between tiers
      const frontLight = new THREE.DirectionalLight(0xfff8ee, 0.8);
      frontLight.position.set(0, 5, 8);
      scene.add(frontLight);
      lightsRef.current.push(frontLight);

      // Rim light from behind — separates stone from background
      const rim = new THREE.DirectionalLight(0xffeedd, 0.6);
      rim.position.set(-3, 4, -6);
      scene.add(rim);
      lightsRef.current.push(rim);

      scene.fog = new THREE.Fog(0xe8e0d0, 12, 30);
      scene.background = null;
    }

    // If a photorealistic render was requested, fire it after the environment settles
    if (renderCallbackRef.current) {
      const cb = renderCallbackRef.current;
      renderCallbackRef.current = null;
      const t = setTimeout(() => cb(doHighResRender()), 300);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // Load GLB models asynchronously when the glbModels prop changes
  useEffect(() => {
    if (!glbModels || glbModels.length === 0) {
      glbMapRef.current = new Map();
      setGlbReady((n) => n + 1);
      return;
    }
    const modelsToLoad = glbModels
      .filter((m) => m.is_active !== false && m.file_url)
      .map((m) => ({ key: `${m.component_type}:${m.option_id}`, url: m.file_url, record: m }));
    if (modelsToLoad.length === 0) {
      glbMapRef.current = new Map();
      setGlbReady((n) => n + 1);
      return;
    }
    let cancelled = false;
    loadGlbModels(modelsToLoad).then((loadedMap) => {
      if (cancelled) return;
      // Build a map keyed by both "component_type:option_id" and "option_id" for flexible lookup
      const newMap = new Map();
      glbModels.forEach((m) => {
        if (m.is_active !== false && m.file_url) {
          newMap.set(`${m.component_type}:${m.option_id}`, m);
          newMap.set(m.option_id, m);
        }
      });
      glbMapRef.current = newMap;
      setGlbReady((n) => n + 1);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(glbModels?.map((m) => `${m.component_type}:${m.option_id}:${m.file_url}:${m.is_active}`))]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (contentRef.current) {
      sceneRef.current.remove(contentRef.current);
      disposeGroup(contentRef.current);
    }
    const group = buildTombstone(design, glbMapRef.current);
    contentRef.current = group;
    sceneRef.current.add(group);
    // Accessory groups are draggable — collect them for picking
    const draggables = [];
    group.traverse((obj) => {
      if (obj.userData && obj.userData.accIndex !== undefined) draggables.push(obj);
    });
    draggablesRef.current = draggables;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    design.stoneType,
    design.tombstoneType,
    design.panel,
    design.frame,
    design.slab,
    design.headstoneTop,
    design.headstonePlacement,
    design.panelStone,
    design.frameStone,
    design.slabStone,
    design.headstoneStone,
    design.colorOverride,
    design.panelColor,
    design.frameColor,
    design.slabColor,
    design.headstoneColor,
    design.letteringType,
    design.engravingText,
    design.slabText,
    design.customImageUrl,
    design.nerHouse,
    design.nerHouseSize,
    JSON.stringify(design.accessories),
    design.panelTextureUrl,
    design.frameTextureUrl,
    design.slabTextureUrl,
    design.headstoneTextureUrl,
    design.headstoneScale,
    design.headstoneThickness,
    design.headstoneOffsetX,
    design.headstoneOffsetZ,
    design.panelWidthCm,
    design.panelLengthCm,
    design.panelHeightCm,
    JSON.stringify(design.accessoryPositions),
    design.frameHeightCm,
    design.slabWidthCm,
    design.slabHeightCm,
    design.headstoneTextScale,
    glbReady,
  ]);

  const toggleExplode = () => {
    const next = !exploded;
    setExploded(next);
    targetExplodeRef.current = next ? 1 : 0;
  };

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <div
        ref={containerRef}
        className="w-full h-full min-h-[320px] rounded-2xl overflow-hidden"
        style={{
          background:
            mode === 'photo'
              ? 'linear-gradient(180deg, #c5b8a0 0%, #a89880 100%)'
              : 'linear-gradient(180deg, #f0e8d8 0%, #d8c8a8 100%)',
        }}
      />
      {/* Mode toggle */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode('design')}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ring-1 transition-colors ${
            mode === 'design'
              ? 'bg-white text-stone-900 ring-stone-300'
              : 'bg-white/70 text-stone-500 ring-stone-200 hover:bg-white'
          }`}
        >
          תצוגת עיצוב
        </button>
        <button
          type="button"
          onClick={() => setMode('photo')}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ring-1 transition-colors ${
            mode === 'photo'
              ? 'bg-stone-900 text-white ring-stone-700'
              : 'bg-white/70 text-stone-500 ring-stone-200 hover:bg-white'
          }`}
        >
          📷 פוטוריאליסטי
        </button>
      </div>
      {/* Explode toggle */}
      <button
        type="button"
        onClick={toggleExplode}
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-white transition-colors"
      >
        <span className={`h-2 w-2 rounded-full ${exploded ? 'bg-amber-500' : 'bg-stone-400'}`} />
        {exploded ? 'תצוגה מורכבת' : 'תצוגת פירוק'}
      </button>
    </div>
  );
});

StonePreview.displayName = 'StonePreview';
export default StonePreview;