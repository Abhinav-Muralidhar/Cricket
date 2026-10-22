/**
 * model-loader.ts - Loads character models (GLB) and animation clips
 * from public/models/, cleans root motion drift, and instantiates cloned characters.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
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

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  let finished = 0;
  const updateProgress = () => {
    finished++;
    if (onProgress) onProgress(finished / 4);
  };

  const [batterGltf, bowlerGltf, fielderGltf, animsGltf] = await Promise.all([
    loader.loadAsync('/models/batter.glb').then((g) => { updateProgress(); return g; }),
    loader.loadAsync('/models/bowler.glb').then((g) => { updateProgress(); return g; }),
    loader.loadAsync('/models/fielder.glb').then((g) => { updateProgress(); return g; }),
    loader.loadAsync('/models/anims.glb').then((g) => { updateProgress(); return g; }),
  ]);

  const cleanBones = (obj: THREE.Object3D) => {
    obj.traverse((c) => {
      if (c instanceof THREE.Bone) c.name = c.name.replace(/^mixamorig\d+/i, 'mixamorig');
    });
  };

  cleanBones(batterGltf.scene);
  cleanBones(bowlerGltf.scene);
  cleanBones(fielderGltf.scene);

  characterModels.set('batter', batterGltf.scene);
  characterModels.set('bowler', bowlerGltf.scene);
  characterModels.set('fielder', fielderGltf.scene);
  characterModels.set('default', fielderGltf.scene);
  baseCharacterModel = fielderGltf.scene;

  const box = new THREE.Box3().setFromObject(fielderGltf.scene);
  nativeModelHeight = Math.max(1, box.max.y - box.min.y);

  for (const origClip of animsGltf.animations) {
    let clip = origClip.clone();
    const name = clip.name;
    if (name === 'run') clip = removeRootDrift(clip);
    if (name === 'pitch') clip = THREE.AnimationUtils.subclip(clip, 'pitch', 40, 76, 30);
    animationClips.set(name, clip);
  }

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
    if (origMap) origMap.colorSpace = THREE.SRGBColorSpace;
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
