/**
 * toon-material.ts - 3-step toon cel shading, sunward golden rim light (#FFD9A0),
 * inverted-hull outline, ground blob shadow, and cricket props (cap & bat).
 */

import * as THREE from 'three';
import { CONFIG } from './config.ts';

let sharedGradientMap: THREE.DataTexture | null = null;
let sharedBlobShadowTexture: THREE.CanvasTexture | null = null;

export function getSharedGradientMap(): THREE.DataTexture {
  if (!sharedGradientMap) {
    const data = new Uint8Array([
      90, 90, 95, 255,    // Dark shade (0.35)
      180, 180, 185, 255, // Mid tone (0.70)
      255, 255, 255, 255, // Lit highlight (1.00)
    ]);
    sharedGradientMap = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    sharedGradientMap.minFilter = THREE.NearestFilter;
    sharedGradientMap.magFilter = THREE.NearestFilter;
    sharedGradientMap.needsUpdate = true;
  }
  return sharedGradientMap;
}

export function createToonMaterial(color: string | number): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: getSharedGradientMap(),
  });

  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      // Sunward warm rim light (#FFD9A0 at 60%) on the sunward (left) edge
      vec3 viewDir = normalize(vViewPosition);
      vec3 nNorm = normalize(vNormal);
      float nDotV = 1.0 - max(dot(nNorm, viewDir), 0.0);
      float sunBias = clamp(-nNorm.x * 0.7 + 0.3, 0.0, 1.0);
      float rim = smoothstep(0.45, 0.85, nDotV) * sunBias;
      vec3 rimCol = vec3(1.0, 0.85, 0.63); // #FFD9A0
      gl_FragColor.rgb += rimCol * rim * 0.60;
      `
    );
  };
  return mat;
}

export function createOutlineMaterial(): THREE.MeshBasicMaterial {
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x1E1E24,
    side: THREE.BackSide,
  });
  outlineMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      #if defined( USE_SKINNING )
        vec3 nNorm = length( objectNormal ) > 0.0 ? normalize( objectNormal ) : vec3(0.0, 1.0, 0.0);
        transformed += nNorm * 0.8;
      #else
        vec3 nNorm = length( normal ) > 0.0 ? normalize( normal ) : vec3(0.0, 1.0, 0.0);
        transformed += nNorm * 0.8;
      #endif
      #include <project_vertex>
      `
    );
  };
  return outlineMat;
}

export function attachInvertedHullOutline(mesh: THREE.Mesh): THREE.Mesh | null {
  if (!CONFIG.outline3D) return null;
  const outlineMat = createOutlineMaterial();
  let outlineMesh: THREE.Mesh;

  if (mesh instanceof THREE.SkinnedMesh) {
    const skinnedOutline = new THREE.SkinnedMesh(mesh.geometry, outlineMat);
    skinnedOutline.bind(mesh.skeleton, mesh.bindMatrix);
    outlineMesh = skinnedOutline;
  } else {
    outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
  }

  outlineMesh.userData.isOutline = true;
  outlineMesh.renderOrder = -1;
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;
  mesh.add(outlineMesh);
  return outlineMesh;
}

export function createBlobShadowMesh(): THREE.Mesh {
  if (!sharedBlobShadowTexture) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    sharedBlobShadowTexture = new THREE.CanvasTexture(c);
  }
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({
    map: sharedBlobShadowTexture,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  // Stretched ellipse cast slightly away from sun (+X)
  mesh.scale.set(72, 28, 1);
  mesh.position.set(12, 0.5, 0);
  return mesh;
}

export function createCapProp(color: string | number): THREE.Group {
  const group = new THREE.Group();
  const capMat = createToonMaterial(color);

  // Half-sphere cap dome
  const domeGeo = new THREE.SphereGeometry(10.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const dome = new THREE.Mesh(domeGeo, capMat);
  group.add(dome);

  // Visor bill extending forward
  const visorGeo = new THREE.CylinderGeometry(11, 12, 1.5, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
  const visor = new THREE.Mesh(visorGeo, capMat);
  visor.position.set(0, 0.5, 3);
  visor.rotation.x = 0.15;
  group.add(visor);

  group.scale.set(0.9, 0.9, 0.9);
  group.position.set(0, 16, 1);
  return group;
}

export function createBatProp(): THREE.Group {
  const batGroup = new THREE.Group();
  const bladeMat = createToonMaterial('#F5E9CF'); // Willow wood
  const handleMat = createToonMaterial('#D62828'); // Red rubber grip

  // Blade (flat cricket bat front/back)
  const bladeGeo = new THREE.BoxGeometry(9.5, 46, 4.5);
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.set(0, -32, 0);
  batGroup.add(blade);

  // Handle
  const handleGeo = new THREE.CylinderGeometry(2.2, 2.2, 18, 12);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(0, -5, 0);
  batGroup.add(handle);

  // Orient so handle is gripped and blade extends down
  batGroup.rotation.x = Math.PI * 0.1;
  batGroup.rotation.z = -Math.PI * 0.15;
  batGroup.position.set(2, -4, 2);
  return batGroup;
}
