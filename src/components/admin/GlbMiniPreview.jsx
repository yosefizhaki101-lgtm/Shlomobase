import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadGlbModel, cloneGlbModel, applyMaterialToModel, transformModel } from '@/lib/glbModelCache';
import { STONE_TYPES } from '@/lib/tombstoneOptions';

/**
 * Mini 3D preview of a single GLB model with studio lighting.
 * Live-updates transform (scale/offset/rotation) from props.
 *
 * Props:
 *  - fileUrl: string (GLB url)
 *  - scale, offsetX, offsetY, offsetZ, rotationY: numbers
 *  - keepOriginalMaterial: boolean
 *  - stoneId: string (which stone material to apply when not keeping original)
 */
export default function GlbMiniPreview({
  fileUrl,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  offsetZ = 0,
  rotationY = 0,
  keepOriginalMaterial = false,
  stoneId = 'sardo',
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const modelGroupRef = useRef(null);
  const frameRef = useRef(0);

  // One-time scene setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const w = container.clientWidth || 240;
    const h = container.clientHeight || 200;
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.05, 50);
    camera.position.set(2.2, 1.4, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    scene.environment = pmrem.fromScene(envScene, 0.04);

    // Studio ground
    const groundGeo = new THREE.CircleGeometry(4, 48);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xeae3d6, roughness: 0.95, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.001;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lights — match builder studio
    const hemi = new THREE.HemisphereLight(0xffffff, 0x807a6c, 0.6);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff6ec, 3.5);
    dir.position.set(4, 7, 3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 20;
    dir.shadow.camera.left = -3;
    dir.shadow.camera.right = 3;
    dir.shadow.camera.top = 3;
    dir.shadow.camera.bottom = -3;
    dir.shadow.bias = -0.0003;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.4);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 0.5, 0);
    controls.enablePan = false;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      controls.dispose();
      if (modelGroupRef.current) {
        scene.remove(modelGroupRef.current);
        modelGroupRef.current.traverse((o) => {
          if (o.geometry) o.geometry.dispose?.();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => m.dispose?.());
          }
        });
      }
      scene.environment?.dispose?.();
      pmrem.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // Load / reload model when fileUrl changes
  useEffect(() => {
    if (!sceneRef.current || !fileUrl) return;
    let cancelled = false;

    // Remove previous model
    if (modelGroupRef.current) {
      sceneRef.current.remove(modelGroupRef.current);
      modelGroupRef.current.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose?.());
        }
      });
      modelGroupRef.current = null;
    }

    loadGlbModel(fileUrl).then((scene) => {
      if (cancelled || !scene) return;
      const clone = cloneGlbModel(fileUrl);
      if (!clone) return;

      if (!keepOriginalMaterial) {
        const stone = STONE_TYPES.find((s) => s.id === stoneId) || STONE_TYPES[4];
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(stone.color),
          roughness: stone.roughness,
          metalness: stone.metalness || 0,
          envMapIntensity: 1.5,
        });
        applyMaterialToModel(clone, mat, false);
      }

      // Auto-center & fit the model into a ~1.5 unit box so initial view is reasonable
      const box = new THREE.Box3().setFromObject(clone);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const fitScale = 1.5 / maxDim;
      clone.scale.setScalar(fitScale);
      clone.position.set(-center.x * fitScale, -box.min.y * fitScale, -center.z * fitScale);

      modelGroupRef.current = clone;
      sceneRef.current.add(clone);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, keepOriginalMaterial, stoneId]);

  // Live transform updates (no reload)
  useEffect(() => {
    if (!modelGroupRef.current) return;
    transformModel(
      modelGroupRef.current,
      scale,
      offsetX,
      offsetY,
      offsetZ,
      rotationY
    );
  }, [scale, offsetX, offsetY, offsetZ, rotationY]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[200px] rounded-xl overflow-hidden bg-stone-100"
      style={{ background: 'linear-gradient(180deg, #f0e8d8 0%, #d8c8a8 100%)' }}
    />
  );
}