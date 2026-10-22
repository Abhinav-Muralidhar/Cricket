// scripts/optimize-models.mjs
import fs from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { dedup, quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';

globalThis.self = globalThis;
globalThis.document = {
  createElementNS: () => ({ setAttribute: () => {}, style: {}, addEventListener: () => {} }),
  createElement: () => ({ setAttribute: () => {}, style: {}, addEventListener: () => {} })
};
globalThis.Image = class {
  constructor() { this.style = {}; }
  addEventListener(evt, cb) { if (evt === 'load') setTimeout(cb, 0); }
  removeEventListener() {}
};
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload();
    });
  }
};

const io = new NodeIO();
const fbxLoader = new FBXLoader();

function loadFbx(filepath) {
  const buf = fs.readFileSync(filepath);
  return fbxLoader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
}

async function exportToGlb(object, animations = []) {
  const exporter = new GLTFExporter();
  return new Promise((res, rej) => {
    exporter.parse(
      object,
      (g) => res(Buffer.from(g)),
      (err) => rej(err),
      { binary: true, animations }
    );
  });
}

async function processCharacter(name, fbxFile, bodyTexFile, hairTexFile, outPath) {
  console.log(`\n[Optimize] Processing character: ${name} from ${fbxFile}...`);
  const fbx = loadFbx(fbxFile);

  fbx.traverse(c => {
    if (c.isBone) c.name = c.name.replace(/^mixamorig\d+/i, 'mixamorig');
    if (c.isMesh) {
      const isHair = c.name.toLowerCase().includes('hair') || c.name.toLowerCase().includes('eyelash');
      c.material = new THREE.MeshBasicMaterial({ name: isHair ? 'Hair' : 'Body', color: 0xffffff });
    }
  });

  const rawGlb = await exportToGlb(fbx);
  const doc = await io.readBinary(rawGlb);

  let bodyTex, hairTex;
  if (bodyTexFile && fs.existsSync(bodyTexFile)) {
    bodyTex = doc.createTexture('body')
      .setImage(fs.readFileSync(bodyTexFile))
      .setMimeType('image/jpeg');
  }
  if (hairTexFile && fs.existsSync(hairTexFile)) {
    hairTex = doc.createTexture('hair')
      .setImage(fs.readFileSync(hairTexFile))
      .setMimeType('image/png');
  }

  for (const mat of doc.getRoot().listMaterials()) {
    if (mat.getName() === 'Hair') {
      if (hairTex) mat.setBaseColorTexture(hairTex);
      else mat.setBaseColorFactor([0.1, 0.08, 0.08, 1]);
    } else {
      if (bodyTex) mat.setBaseColorTexture(bodyTex);
    }
    mat.setMetallicFactor(0);
    mat.setRoughnessFactor(1);
    mat.setNormalTexture(null);
    mat.setMetallicRoughnessTexture(null);
    mat.setOcclusionTexture(null);
    mat.setEmissiveTexture(null);
  }

  await doc.transform(
    dedup(),
    quantize(),
    meshopt({ encoder: MeshoptEncoder })
  );

  const finalGlb = await io.writeBinary(doc);
  fs.writeFileSync(outPath, finalGlb);
  console.log(`  -> Output: ${outPath} (${(finalGlb.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function buildAnimationsGlb(outPath) {
  console.log(`\n[Optimize] Merging all 9 animations into single anims file...`);
  const animFiles = [
    { name: 'idle', file: 'assets-src/idle.fbx' },
    { name: 'swing', file: 'assets-src/swing.fbx' },
    { name: 'pitch', file: 'assets-src/pitch.fbx' },
    { name: 'run', file: 'assets-src/Run.fbx' },
    { name: 'slide', file: 'assets-src/slide.fbx' },
    { name: 'dive', file: 'assets-src/dive.fbx' },
    { name: 'defeated', file: 'assets-src/defeated.fbx' },
    { name: 'clap', file: 'assets-src/clap.fbx' },
    { name: 'cheer', file: 'assets-src/cheer.fbx' },
  ];

  const idleObj = loadFbx('assets-src/idle.fbx');
  const meshes = [];
  idleObj.traverse((c) => { if (c.isMesh) meshes.push(c); });
  meshes.forEach((m) => m.parent.remove(m));

  idleObj.traverse((c) => {
    if (c.isBone) c.name = c.name.replace(/^.*mixamorig\d*:?/i, 'mixamorig');
  });

  const allClips = [];
  for (const item of animFiles) {
    const obj = loadFbx(item.file);
    const valid = obj.animations?.find((a) => a.tracks && a.tracks.length > 0) || obj.animations?.[0];
    if (valid) {
      const clip = valid.clone();
      clip.name = item.name;
      clip.tracks.forEach((track) => {
        const [boneRaw, ...propParts] = track.name.split('.');
        const prop = propParts.join('.');
        const bone = boneRaw.includes('|') ? boneRaw.split('|').pop() : boneRaw;
        const clean = bone.replace(/^.*mixamorig\d*:?/i, 'mixamorig');
        track.name = `${clean}.${prop}`;
      });
      allClips.push(clip);
      console.log(`  Included clip "${item.name}" (${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks)`);
    }
  }

  const animsGlb = await exportToGlb(idleObj, allClips);
  const doc = await io.readBinary(animsGlb);

  await doc.transform(
    dedup(),
    meshopt({ encoder: MeshoptEncoder })
  );

  const finalGlb = await io.writeBinary(doc);
  fs.writeFileSync(outPath, finalGlb);
  console.log(`  -> Output: ${outPath} (${(finalGlb.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function run() {
  await processCharacter(
    'batter',
    'assets-src/swing.fbx',
    'assets-src/processed_textures/batter_body.jpg',
    'assets-src/processed_textures/batter_hair.png',
    'public/models/batter.glb'
  );

  await processCharacter(
    'bowler',
    'assets-src/pitch.fbx',
    'assets-src/processed_textures/bowler_body.jpg',
    'assets-src/processed_textures/bowler_hair.png',
    'public/models/bowler.glb'
  );

  await processCharacter(
    'fielder',
    'assets-src/idle.fbx',
    null,
    null,
    'public/models/fielder.glb'
  );

  await buildAnimationsGlb('public/models/anims.glb');
}

run().catch(console.error);
