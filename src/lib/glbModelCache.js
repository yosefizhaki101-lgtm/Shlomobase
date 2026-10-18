import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const cache = new Map(); // url -> { scene, loadedAt }
const loading = new Map(); // url -> Promise

/**
 * Load a GLB model from a URL and cache it.
 * Returns a promise that resolves to the loaded THREE.Group (the gltf.scene).
 */
export async function loadGlbModel(url) {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url).scene;
  if (loading.has(url)) return loading.get(url);

  const promise = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const scene = gltf.scene || gltf.scenes?.[0];
        if (!scene) {
          reject(new Error('GLB file has no scene'));
          return;
        }
        // Normalize: ensure shadows are enabled on all meshes
        scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        cache.set(url, { scene, loadedAt: Date.now() });
        loading.delete(url);
        resolve(scene);
      },
      undefined,
      (err) => {
        loading.delete(url);
        console.error('GLB load error for', url, err);
        resolve(null); // resolve null instead of reject so one bad model doesn't break the whole scene
      }
    );
  });

  loading.set(url, promise);
  return promise;
}

/**
 * Load multiple GLB models in parallel.
 * @param {Array<{key: string, url: string}>} models
 * @returns {Promise<Map<string, THREE.Group>>} map from key to loaded scene (or null)
 */
export async function loadGlbModels(models) {
  const entries = await Promise.all(
    models.map(async ({ key, url }) => {
      const scene = await loadGlbModel(url);
      return [key, scene];
    })
  );
  return new Map(entries);
}

/**
 * Clone a cached GLB model scene for use in the 3D world.
 * Returns null if the model isn't cached yet.
 */
export function cloneGlbModel(url) {
  const entry = cache.get(url);
  if (!entry) return null;
  return entry.scene.clone(true);
}

/**
 * Check if a model is already cached (loaded).
 */
export function isGlbModelCached(url) {
  return cache.has(url);
}

/**
 * Apply a THREE material to all meshes in a model, preserving geometry.
 * If keepOriginal is true, only update shadow settings and return the model as-is.
 */
export function applyMaterialToModel(model, material, keepOriginal = false) {
  model.traverse((child) => {
    if (child.isMesh) {
      if (!keepOriginal) {
        // Dispose existing materials to avoid memory leaks
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => m.dispose && m.dispose());
        }
        child.material = material;
      }
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return model;
}

/**
 * Apply position, rotation, and scale to a cloned model.
 */
export function transformModel(model, scale = 1, offsetX = 0, offsetY = 0, offsetZ = 0, rotationY = 0) {
  model.scale.setScalar(scale);
  model.position.set(offsetX, offsetY, offsetZ);
  model.rotation.y = rotationY;
  return model;
}