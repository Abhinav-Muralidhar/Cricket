/**
 * profile.ts - Batter profile, street customization presets, and localStorage persistence.
 */
import * as THREE from 'three';

export interface ColorPreset {
  name: string;
  color: string;
}

export const JERSEY_PRESETS: ColorPreset[] = [
  { name: 'Bleed Blue', color: '#2563EB' },
  { name: 'Bright Yellow', color: '#EAB308' },
  { name: 'Gully Red', color: '#DC2626' },
  { name: 'Street Carbon', color: '#1E293B' },
  { name: 'Mint Green', color: '#10B981' },
  { name: 'Royal Purple', color: '#7C3AED' },
  { name: 'Sunset Orange', color: '#EA580C' },
  { name: 'Vintage Cream', color: '#F5E9CF' },
];

export const PANTS_PRESETS: ColorPreset[] = [
  { name: 'Navy Track', color: '#1E3A8A' },
  { name: 'Charcoal', color: '#334155' },
  { name: 'Denim Wash', color: '#2563EB' },
  { name: 'Street White', color: '#F1F5F9' },
  { name: 'Olive Khaki', color: '#65A30D' },
];

export const BAT_PRESETS: ColorPreset[] = [
  { name: 'Classic Red', color: '#DC2626' },
  { name: 'Golden Master', color: '#F59E0B' },
  { name: 'Electric Cyan', color: '#06B6D4' },
  { name: 'Neon Lime', color: '#84CC16' },
];

export const MONIKER_PRESETS: string[] = [
  'Karan',
  'Master Blaster',
  'Chintu 6er',
  'Gully Dhoni',
  'Street King',
  'Hitman',
  'Yorker Slayer',
];

export interface BatterProfile {
  monikerIndex: number;
  jerseyIndex: number;
  pantsIndex: number;
  batIndex: number;
  hasCap: boolean;
}

const STORAGE_KEY = 'gully_cricket_batter_profile_v1';

export const DEFAULT_PROFILE: BatterProfile = {
  monikerIndex: 0,
  jerseyIndex: 0,
  pantsIndex: 0,
  batIndex: 0,
  hasCap: false,
};

export function getStoredProfile(): BatterProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const p = JSON.parse(raw);
    return {
      monikerIndex: Math.max(0, Math.min(MONIKER_PRESETS.length - 1, Number(p.monikerIndex) || 0)),
      jerseyIndex: Math.max(0, Math.min(JERSEY_PRESETS.length - 1, Number(p.jerseyIndex) || 0)),
      pantsIndex: Math.max(0, Math.min(PANTS_PRESETS.length - 1, Number(p.pantsIndex) || 0)),
      batIndex: Math.max(0, Math.min(BAT_PRESETS.length - 1, Number(p.batIndex) || 0)),
      hasCap: Boolean(p.hasCap),
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveStoredProfile(p: BatterProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch { }
}

export function getProfileMoniker(p: BatterProfile): string {
  return MONIKER_PRESETS[p.monikerIndex] || 'Karan';
}

export function applyProfileTo3D(group: THREE.Group, p: BatterProfile): void {
  const jerseyCol = JERSEY_PRESETS[p.jerseyIndex]?.color || '#2563EB';
  const pantsCol = PANTS_PRESETS[p.pantsIndex]?.color || '#1E3A8A';
  const batCol = BAT_PRESETS[p.batIndex]?.color || '#DC2626';

  group.traverse((obj) => {
    if (obj.name === 'Ch42_Shirt') {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      if (mat?.color) mat.color.set(jerseyCol);
    } else if (obj.name === 'Ch42_Shorts') {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      if (mat?.color) mat.color.set(pantsCol);
    } else if (obj.name === 'batSticker') {
      const mat = (obj as THREE.Mesh).material as THREE.MeshToonMaterial;
      if (mat?.color) mat.color.set(batCol);
    } else if (obj.name === 'capProp') {
      obj.visible = p.hasCap;
      obj.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          const mat = (c as THREE.Mesh).material as THREE.MeshToonMaterial;
          if (mat?.color) mat.color.set(jerseyCol);
        }
      });
    }
  });
}

