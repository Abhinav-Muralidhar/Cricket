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
import { CONFIG } from './config.ts';

export interface LoadedCharacterInstance {
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  baseHeight: number;
  shadowMesh: THREE.Mesh;
}

let baseCharacterModel: THREE.Group | null = null;
const characterModels = new Map<string, THREE.Group>();
const animationClips = new Map<string, THREE.AnimationClip>();
let isLoaded = false;
let isLoading = false;
let nativeModelHeight = 170;

export function is3DAssetsLoaded(): boolean {
  return isLoaded;
}

export function findBone(root: THREE.Object3D, namePart: string): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  const targetClean = namePart.replace(/[:_]/g, '').toLowerCase();
  root.traverse((child) => {
    if (child instanceof THREE.Bone) {
      const nameClean = child.name.replace(/[:_]/g, '').toLowerCase();
      if ((nameClean === targetClean || nameClean.endsWith(targetClean)) && (!found || child.children.length > 0)) {
        found = child;
      }
    }
  });
  if (!found) {
    root.traverse((child) => {
      if (!found && child instanceof THREE.Bone && child.name.toLowerCase().includes(targetClean)) found = child;
    });
  }
  return found;
}

export function removeRootDrift(clip: THREE.AnimationClip): THREE.AnimationClip {
  const cloned = clip.clone();
  for (const track of cloned.tracks) {
    if (track.name.toLowerCase().includes('hips') && track.name.endsWith('.position')) {
      const initX = track.values[0] ?? 0, initZ = track.values[2] ?? 0;
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = initX; track.values[i + 2] = initZ;
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
        characterModels.set('default', fbx);
        characterModels.set('fielder', fbx);
        const box = new THREE.Box3().setFromObject(fbx);
        nativeModelHeight = Math.max(1, box.max.y - box.min.y);
      } else if (name === 'pitch') {
        fbx.traverse((c) => { if (c instanceof THREE.Bone) c.name = c.name.replace(/^mixamorig\d+/i, 'mixamorig'); });
        characterModels.set('bowler', fbx);
      } else if (name === 'swing') {
        fbx.traverse((c) => { if (c instanceof THREE.Bone) c.name = c.name.replace(/^mixamorig\d+/i, 'mixamorig'); });
        characterModels.set('batter', fbx);
      }
      if (fbx.animations && fbx.animations.length > 0) {
        const valid = fbx.animations.find((a) => a.tracks && a.tracks.length > 0) || fbx.animations[0];
        let clip = valid.clone();
        clip.name = name;
        if (name === 'run') clip = removeRootDrift(clip);
        if (name === 'pitch') clip = THREE.AnimationUtils.subclip(clip, 'pitch', 40, 76, 30);
        animationClips.set(name, clip);
      }
    } catch (err) {
      if (url.includes('Run.fbx')) {
        try {
          const fallback = await loader.loadAsync('/models/run.fbx');
          const valid = fallback.animations?.find((a) => a.tracks && a.tracks.length > 0) || fallback.animations?.[0];
          if (valid) animationClips.set(name, removeRootDrift(valid.clone()));
        } catch { /* ignored */ }
      }
    } finally {
      finished++;
      if (onProgress) onProgress(finished / total);
    }
  };

  await Promise.all(Object.entries(clipFiles).map(([name, url]) => loadFile(name, url)));
  if (!baseCharacterModel) throw new Error('[3D Loader] Base character model failed');

  animationClips.forEach((clip) => {
    clip.tracks.forEach((track) => {
      const [boneRaw, ...propParts] = track.name.split('.');
      const prop = propParts.join('.');
      const bone = boneRaw.includes('|') ? boneRaw.split('|').pop()! : boneRaw;
      const clean = bone.replace(/^.*mixamorig\d*:?/i, 'mixamorig');
      track.name = `${clean}.${prop}`;
    });
  });

  const swingClip = animationClips.get('swing');
  if (swingClip) {
    animationClips.set('battingStance', THREE.AnimationUtils.subclip(swingClip, 'battingStance', 0, 4, 30));
  }

  isLoaded = true;
  isLoading = false;
}

export function instantiateCharacter(
  color: string | number,
  options: { withBat?: boolean; withCap?: boolean; modelType?: 'batter' | 'bowler' | 'fielder' } = {}
): LoadedCharacterInstance {
  const model = (options.modelType && characterModels.get(options.modelType)) || baseCharacterModel;
  if (!model) throw new Error('[3D Loader] Model not loaded');

  const cloned = SkeletonUtils.clone(model) as THREE.Group;
  const meshes: THREE.Mesh[] = [];
  cloned.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.isOutline) meshes.push(o as THREE.Mesh);
  });

  for (const mesh of meshes) {
    const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const origMap = (origMat as THREE.MeshStandardMaterial)?.map || null;
    const isEyelash = mesh.name.toLowerCase().includes('eyelash');
    mesh.material = createToonMaterial(color, origMap);
    if (isEyelash) {
      mesh.material.transparent = true;
      mesh.material.alphaTest = 0.5;
    }
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    if (!isEyelash) attachInvertedHullOutline(mesh);
  }

  // Blob shadow on ground
  const shadow = createBlobShadowMesh();
  cloned.add(shadow);

  // Attach Cricket Bat to mixamorig:RightHand
  if (options.withBat) {
    const handBone = findBone(cloned, 'mixamorig:RightHand') || findBone(cloned, 'RightHand');
    if (handBone) {
      console.log(`[3D] Attached bat to bone: "${handBone.name}"`);
      const bat = createBatProp();
      bat.position.set(CONFIG.batOffset.x, CONFIG.batOffset.y, CONFIG.batOffset.z);
      bat.rotation.set(CONFIG.batRotation.x, CONFIG.batRotation.y, CONFIG.batRotation.z);
      bat.scale.set(CONFIG.batScale.x, CONFIG.batScale.y, CONFIG.batScale.z);
      handBone.add(bat);
    } else {
      console.warn('[3D] mixamorig:RightHand bone not found for bat');
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

  const clonedBones = new Set<string>();
  cloned.traverse((c) => { if (c instanceof THREE.Bone) clonedBones.add(c.name); });

  const unmatchedTracks: string[] = [];
  animationClips.forEach((clip, name) => {
    actions.set(name, mixer.clipAction(clip));
    clip.tracks.forEach((track) => {
      const nodeName = track.name.split('.')[0];
      if (!clonedBones.has(nodeName)) unmatchedTracks.push(`${name}:${track.name}`);
    });
  });

  const clipNames = Array.from(actions.keys());
  if (unmatchedTracks.length === 0) {
    console.log(`[3D] Character clips: [${clipNames.join(', ')}]. All tracks match cloned skeleton bones.`);
  } else {
    console.warn(`[3D] Character clips: [${clipNames.join(', ')}]. Unmatched tracks (${unmatchedTracks.length}):`, unmatchedTracks);
  }

  // Play batting stance for batter or idle for others immediately from creation
  const defaultAction = options.modelType === 'batter' && actions.has('battingStance') ? 'battingStance' : 'idle';
  const idleAction = actions.get(defaultAction);
  if (idleAction) {
    idleAction.reset();
    idleAction.setLoop(THREE.LoopRepeat, Infinity);
    const duration = idleAction.getClip().duration || 1.0;
    idleAction.time = Math.random() * duration;
    idleAction.play();
  }

  mixer.update(0.001);
  return { group: cloned, mixer, actions, baseHeight: nativeModelHeight, shadowMesh: shadow };
}
