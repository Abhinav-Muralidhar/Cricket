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
      42, 31, 45, 255,    // Dark-warm shadow band (#2A1F2D)
      175, 168, 160, 255, // Mid band
      255, 250, 245, 255, // Lit highlight
    ]);
    sharedGradientMap = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    sharedGradientMap.minFilter = THREE.NearestFilter;
    sharedGradientMap.magFilter = THREE.NearestFilter;
    sharedGradientMap.needsUpdate = true;
  }
  return sharedGradientMap;
}

export function createToonMaterial(color: string | number, map?: THREE.Texture | null): THREE.MeshToonMaterial {
  // Desaturate ~25%, darken ~15%, tint with warm multiply (#F7A35C at 10%)
  const col = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  col.getHSL(hsl);
  hsl.s = Math.max(0, hsl.s * 0.75);
  hsl.l = Math.max(0, hsl.l * 0.85);
  col.setHSL(hsl.h, hsl.s, hsl.l);
  const warmTint = new THREE.Color('#F7A35C');
  col.lerp(col.clone().multiply(warmTint), 0.10);

  const mat = new THREE.MeshToonMaterial({
    color: map ? 0xffffff : col,
    map: map ?? null,
    gradientMap: getSharedGradientMap(),
  });
  const anyMat = mat as unknown as Record<string, unknown>;
  anyMat.envMap = null;
  anyMat.metalness = 0;
  anyMat.roughness = 1.0;

  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      // Hand-drawn flat cel shading (matte finish, no glossiness)
      vec3 geomNormal = normalize(vNormal);
      vec3 fixedLightDir = normalize(vec3(-0.7, 0.4, 0.6));
      float NdotL = dot(geomNormal, fixedLightDir);

      vec3 shadowTint = vec3(42.0 / 255.0, 31.0 / 255.0, 45.0 / 255.0); // #2A1F2D
      vec3 baseCol = gl_FragColor.rgb;

      // Soft, clean cel shadow and flat matte lit band
      vec3 shadowBand = mix(baseCol * 0.72, shadowTint, 0.20);
      vec3 litBand = baseCol; // Pure matte, no shiny/glossy highlight multiplier

      float stepLit = smoothstep(-0.02, 0.06, NdotL);
      vec3 toonShading = mix(shadowBand, litBand, stepLit);

      // Subtle warm edge accent (softened from 1.2 to 0.25)
      vec3 viewDir = normalize(vViewPosition);
      float NdotV = clamp(1.0 - max(dot(geomNormal, viewDir), 0.0), 0.0, 1.0);
      float fresnel = pow(NdotV, 3.0);
      float sunEdge = max(dot(geomNormal, fixedLightDir), 0.0);
      float rim = fresnel * sunEdge * 0.25;
      vec3 rimCol = vec3(1.0, 0.92, 0.82);

      gl_FragColor.rgb = toonShading + rimCol * rim;
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
        transformed += nNorm * 1.3;
      #else
        vec3 nNorm = length( normal ) > 0.0 ? normalize( normal ) : vec3(0.0, 1.0, 0.0);
        transformed += nNorm * 1.3;
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
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.70, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
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
  // Stretched away from sun (sun is on left, so stretch extends rightwards along +X)
  mesh.scale.set(78, 26, 1);
  mesh.position.set(18, 0.2, 2);
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
  const bladeMat = createToonMaterial('#F3E4C8'); // Prime English Willow
  const handleMat = createToonMaterial('#222228'); // Sleek rubber grip
  const stickerMat = createToonMaterial('#D62828'); // Red brand chevron

  // Handle (slender rubber grip cylinder passing comfortably through both hands)
  const handleGeo = new THREE.CylinderGeometry(1.85, 1.85, 40, 14);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, 0, -14);
  batGroup.add(handle);

  // Top knob of handle
  const knobGeo = new THREE.SphereGeometry(2.1, 10, 8);
  const knob = new THREE.Mesh(knobGeo, handleMat);
  knob.position.set(0, 0, -34);
  batGroup.add(knob);

  // Bat shoulders (smooth taper from handle to blade)
  const shoulderGeo = new THREE.BoxGeometry(10.5, 4.6, 8.0);
  const shoulder = new THREE.Mesh(shoulderGeo, bladeMat);
  shoulder.position.set(0, 0, 8);
  batGroup.add(shoulder);

  // Red manufacturer brand stripe across shoulders
  const stickerGeo = new THREE.BoxGeometry(11.0, 4.8, 3.5);
  const sticker = new THREE.Mesh(stickerGeo, stickerMat);
  sticker.position.set(0, 0, 8.5);
  batGroup.add(sticker);

  // Authentic willow blade with front face and edges
  const bladeGeo = new THREE.BoxGeometry(13.5, 4.8, 52.0);
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.set(0, 0, 36);
  batGroup.add(blade);

  return batGroup;
}


