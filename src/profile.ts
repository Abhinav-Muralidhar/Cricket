/**
 * profile.ts - Batter profile, presets, kits, persistence with migration, and 3D outfit application.
 */
import * as THREE from 'three';

export interface ColorPreset { name: string; color: string; }
export interface KitPreset { name: string; jersey: number; pants: number; shoes: number; bat: number; split: [string, string]; }

export const JERSEY_PRESETS: ColorPreset[] = [
  { name: 'Original Gully', color: '#DC2626' },
  { name: 'Bleed Blue', color: '#2563EB' },
  { name: 'Super Yellow', color: '#EAB308' },
  { name: 'Fiery Red', color: '#EF4444' },
  { name: 'Classy White', color: '#F8FAFC' },
  { name: 'Stone Gray', color: '#334155' },
  { name: 'Mint Green', color: '#10B981' },
  { name: 'Royal Purple', color: '#7C3AED' },
];

export const PANTS_PRESETS: ColorPreset[] = [
  { name: 'Original Denim', color: '#355C8A' },
  { name: 'Navy Track', color: '#1E3A8A' },
  { name: 'Charcoal', color: '#334155' },
  { name: 'Classy White', color: '#F1F5F9' },
  { name: 'Olive Khaki', color: '#65A30D' },
];

export const SNEAKER_PRESETS: ColorPreset[] = [
  { name: 'Original Street', color: '#ECEEF2' },
  { name: 'Street White', color: '#FFFFFF' },
  { name: 'Midnight Black', color: '#1E293B' },
  { name: 'Volt Neon', color: '#84CC16' },
  { name: 'Crimson Pace', color: '#DC2626' },
  { name: 'Champion Gold', color: '#F59E0B' },
];

export const BAT_PRESETS: ColorPreset[] = [
  { name: 'Classic Red', color: '#DC2626' },
  { name: 'Golden Master', color: '#F59E0B' },
  { name: 'Electric Cyan', color: '#06B6D4' },
  { name: 'Neon Lime', color: '#84CC16' },
];

export const SKIN_PRESETS: ColorPreset[] = [
  { name: 'Original Tone', color: '#FFFFFF' },
  { name: 'Fair Warm', color: '#FCE7D2' },
  { name: 'Golden Wheat', color: '#E8B688' },
  { name: 'Warm Bronze', color: '#C98A59' },
  { name: 'Deep Earth', color: '#8D5524' },
];

export const KIT_PRESETS: KitPreset[] = [
  { name: 'Bleed Blue', jersey: 1, pants: 1, shoes: 1, bat: 0, split: ['#2563EB', '#1E3A8A'] },
  { name: 'Super Yellow', jersey: 2, pants: 2, shoes: 5, bat: 1, split: ['#EAB308', '#334155'] },
  { name: 'Fiery Red', jersey: 3, pants: 2, shoes: 4, bat: 0, split: ['#EF4444', '#334155'] },
  { name: 'Classy Whites', jersey: 4, pants: 3, shoes: 1, bat: 1, split: ['#F8FAFC', '#F1F5F9'] },
  { name: 'Stone Gray', jersey: 5, pants: 2, shoes: 2, bat: 2, split: ['#334155', '#1E293B'] },
];

export interface BatterProfile {
  name: string;
  jerseyNumber: number;
  jerseyIndex: number;
  pantsIndex: number;
  sneakersIndex: number;
  batIndex: number;
  skinIndex: number;
}

const STORAGE_KEYS = [
  'gully_cricket_batter_profile_v4',
  'gully_cricket_batter_profile_v3',
  'gully_cricket_batter_profile_v2',
  'gully_cricket_batter_profile_v1',
];

export const DEFAULT_PROFILE: BatterProfile = {
  name: 'PLAYER',
  jerseyNumber: 1,
  jerseyIndex: 0,
  pantsIndex: 0,
  sneakersIndex: 0,
  batIndex: 0,
  skinIndex: 0,
};

export function getStoredProfile(): BatterProfile {
  try {
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw);
        const num = parseInt(p.jerseyNumber, 10);
        return {
          name: (typeof p.name === 'string' && p.name.trim().slice(0, 12)) || 'PLAYER',
          jerseyNumber: isNaN(num) || num < 1 || num > 99 ? 1 : num,
          jerseyIndex: Math.max(0, Math.min(JERSEY_PRESETS.length - 1, Number(p.jerseyIndex) || 0)),
          pantsIndex: Math.max(0, Math.min(PANTS_PRESETS.length - 1, Number(p.pantsIndex) || 0)),
          sneakersIndex: Math.max(0, Math.min(SNEAKER_PRESETS.length - 1, Number(p.sneakersIndex) || 0)),
          batIndex: Math.max(0, Math.min(BAT_PRESETS.length - 1, Number(p.batIndex) || 0)),
          skinIndex: Math.max(0, Math.min(SKIN_PRESETS.length - 1, Number(p.skinIndex) || 0)),
        };
      }
    }
  } catch {}
  return { ...DEFAULT_PROFILE };
}

export function saveStoredProfile(p: BatterProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS[0], JSON.stringify(p));
  } catch {}
}

export function createJerseyBackBadge(name: string, num: number): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), mat);
  mesh.name = 'jerseyBackBadge';
  mesh.userData.canvas = canvas; mesh.userData.texture = texture;
  mesh.position.set(0, 9, -12.5);
  mesh.rotation.y = Math.PI;
  updateJerseyBackBadge(mesh, name, num);
  return mesh;
}

export function updateJerseyBackBadge(mesh: THREE.Mesh, name: string, num: number): void {
  const canvas = mesh.userData.canvas as HTMLCanvasElement;
  const texture = mesh.userData.texture as THREE.CanvasTexture;
  if (!canvas || !texture) return;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase().slice(0, 10), 128, 52);
  ctx.font = '900 120px system-ui, sans-serif';
  ctx.fillText(String(num), 128, 148);
  texture.needsUpdate = true;
}

export function applyProfileTo3D(group: THREE.Group, p: BatterProfile): void {
  const batCol = BAT_PRESETS[p.batIndex]?.color || '#DC2626';
  const skinCol = SKIN_PRESETS[p.skinIndex]?.color || '#FFFFFF';

  group.traverse((obj) => {
    if (obj.name === 'Ch42_Shirt' && (obj as THREE.Mesh).material) {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      const origMap = obj.userData.origMap as THREE.Texture | null;
      if (p.jerseyIndex === 0 && origMap) { mat.map = origMap; mat.color.set(0xffffff); }
      else { mat.map = null; mat.color.set(JERSEY_PRESETS[p.jerseyIndex].color); }
      mat.needsUpdate = true;
    } else if (obj.name === 'Ch42_Shorts' && (obj as THREE.Mesh).material) {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      const origMap = obj.userData.origMap as THREE.Texture | null;
      if (p.pantsIndex === 0 && origMap) { mat.map = origMap; mat.color.set(0xffffff); }
      else { mat.map = null; mat.color.set(PANTS_PRESETS[p.pantsIndex].color); }
      mat.needsUpdate = true;
    } else if (obj.name === 'Ch42_Sneakers' && (obj as THREE.Mesh).material) {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      const origMap = obj.userData.origMap as THREE.Texture | null;
      if (p.sneakersIndex === 0 && origMap) { mat.map = origMap; mat.color.set(0xffffff); }
      else { mat.map = null; mat.color.set(SNEAKER_PRESETS[p.sneakersIndex].color); }
      mat.needsUpdate = true;
    } else if (obj.name === 'Ch42_Body1' && (obj as THREE.Mesh).material) {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      mat.color.set(p.skinIndex === 0 ? 0xffffff : skinCol);
      mat.needsUpdate = true;
    } else if (obj.name === 'batSticker') {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      if (mat?.color) mat.color.set(batCol);
    } else if (obj.name === 'jerseyBackBadge') {
      updateJerseyBackBadge(obj as THREE.Mesh, p.name, p.jerseyNumber);
    }
  });
}
