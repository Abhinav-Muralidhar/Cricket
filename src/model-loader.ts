/**
 * model-loader.ts - Loads base character model (idle.fbx) and animation clips
 * from public/models/, cleans root motion drift, and instantiates cloned characters.
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  createToonMaterial,
  attachInvertedHullOutline,
  createBlobShadowMesh,
  createCapProp,
  createBatProp,
} from './toon-material.ts';

export interface LoadedCharacterInstance {
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  baseHeight: number;
  shadowMesh: THREE.Mesh;
}

let baseCharacterModel: THREE.Group | null = null;
const animationClips = new Map<string, THREE.AnimationClip>();
let isLoaded = false;
let isLoading = false;
let nativeModelHeight = 170;

export function is3DAssetsLoaded(): boolean {
  return isLoaded;
}

export function findBone(root: THREE.Object3D, namePart: string): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  const target = namePart.toLowerCase();
  root.traverse((child) => {
    if (!found && child instanceof THREE.Bone && child.name.toLowerCase().includes(target)) {
      found = child;
    }
  });
  return found;
}

export function removeRootDrift(clip: THREE.AnimationClip): THREE.AnimationClip {
  const cloned = clip.clone();
  for (const track of cloned.tracks) {
    const lower = track.name.toLowerCase();
    if (lower.includes('hips') && lower.endsWith('.position')) {
      const initialX = track.values[0] ?? 0;
      const initialZ = track.values[2] ?? 0;
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = initialX;     // Zero out horizontal drift
        track.values[i + 2] = initialZ; // Zero out depth drift
      }
    }
  }
  return cloned;
}

export async function load3DAssets(onProgress?: (ratio: number) => void): Promise<void> {
  if (isLoaded) return;
  if (isLoading) return;
  isLoading = true;

  const loader = new FBXLoader();
  const clipFiles: Record<string, string> = {
    idle: '/models/idle.fbx',
    swing: '/models/swing.fbx',
    pitch: '/models/pitch.fbx',
    run: '/models/Run.fbx',
    slide: '/models/slide.fbx',
    dive: '/models/dive.fbx',
    defeated: '/models/defeated.fbx',
    clap: '/models/clap.fbx',
    cheer: '/models/cheer.fbx',
  };

  const total = Object.keys(clipFiles).length;
  let finished = 0;

  const loadFile = async (name: string, url: string): Promise<void> => {
    try {
      const fbx = await loader.loadAsync(url);
      if (name === 'idle') {
        baseCharacterModel = fbx;
        const box = new THREE.Box3().setFromObject(fbx);
        nativeModelHeight = Math.max(1, box.max.y - box.min.y);
      }
      if (fbx.animations && fbx.animations.length > 0) {
        let clip = fbx.animations[0];
        clip.name = name;
        if (name === 'run') clip = removeRootDrift(clip);
        animationClips.set(name, clip);
      }
    } catch (err) {
      console.warn(`[3D Loader] Failed to load ${url}, trying fallback...`, err);
      // Try lowercase fallback if Run.fbx failed
      if (url.includes('Run.fbx')) {
        try {
          const fallback = await loader.loadAsync('/models/run.fbx');
          if (fallback.animations && fallback.animations.length > 0) {
            let clip = fallback.animations[0];
            clip.name = name;
            clip = removeRootDrift(clip);
            animationClips.set(name, clip);
          }
        } catch { /* ignored */ }
      }
    } finally {
      finished++;
      if (onProgress) onProgress(finished / total);
    }
  };

  await Promise.all(Object.entries(clipFiles).map(([name, url]) => loadFile(name, url)));

  if (!baseCharacterModel) {
    throw new Error('[3D Loader] Base character model (idle.fbx) failed to load');
  }

  isLoaded = true;
  isLoading = false;
}

export function instantiateCharacter(
  color: string | number,
  options: { withBat?: boolean; withCap?: boolean } = {}
): LoadedCharacterInstance {
  if (!baseCharacterModel) throw new Error('[3D Loader] Model not loaded');

  // Deep clone mesh & bones using Three.js SkeletonUtils first (before outlines are added)
  const cloned = SkeletonUtils.clone(baseCharacterModel) as THREE.Group;

  // Collect all SkinnedMesh / Mesh objects into an array before modifying hierarchy
  const meshes: THREE.Mesh[] = [];
  cloned.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.isOutline) {
      meshes.push(o as THREE.Mesh);
    }
  });

  console.log(`[3D] Character meshes found: ${meshes.length}`);

  // Loop over collected array to assign toon material and attach outlines
  for (const mesh of meshes) {
    mesh.material = createToonMaterial(color);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    attachInvertedHullOutline(mesh);
  }

  // Blob shadow on ground
  const shadow = createBlobShadowMesh();
  cloned.add(shadow);

  // Attach Cricket Bat to Right Hand
  if (options.withBat) {
    const handBone = findBone(cloned, 'RightHand') || findBone(cloned, 'Hand.R');
    if (handBone) {
      const bat = createBatProp();
      handBone.add(bat);
    }
  }

  // Attach Cap to Head
  if (options.withCap) {
    const headBone = findBone(cloned, 'Head');
    if (headBone) {
      const cap = createCapProp(color);
      headBone.add(cap);
    }
  }

  const mixer = new THREE.AnimationMixer(cloned);
  const actions = new Map<string, THREE.AnimationAction>();

  animationClips.forEach((clip, name) => {
    const action = mixer.clipAction(clip);
    actions.set(name, action);
  });

  return {
    group: cloned,
    mixer,
    actions,
    baseHeight: nativeModelHeight,
    shadowMesh: shadow,
  };
}
