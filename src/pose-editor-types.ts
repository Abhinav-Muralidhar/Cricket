/**
 * pose-editor-types.ts - Type definitions and serialization helpers for the visual pose editor.
 */

import type { Clip, Pose } from './animation.ts';

export type EditorCharacterKey =
  | 'batter'
  | 'bowler'
  | 'fielder1'
  | 'fielder2'
  | 'fielder3';

export interface EditorCharacterInfo {
  key: EditorCharacterKey;
  label: string;
}

export const EDITOR_CHARACTERS: EditorCharacterInfo[] = [
  { key: 'batter', label: 'Batter (Hero)' },
  { key: 'bowler', label: 'Bowler (Gully Star)' },
  { key: 'fielder1', label: 'Fielder 1 (Mid-Wicket)' },
  { key: 'fielder2', label: 'Fielder 2 (Cover)' },
  { key: 'fielder3', label: 'Fielder 3 (Deep)' },
];

export function radToDeg(rad: number): number {
  return Math.round((rad * 180) / Math.PI);
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

export function formatPoseJson(pose: Pose): string {
  const rounded: Record<string, number> = {};
  for (const k of Object.keys(pose)) {
    rounded[k] = round2(pose[k]);
  }
  return JSON.stringify(rounded, null, 2);
}

export function formatClipJson(clip: Clip): string {
  const cleanClip: Clip = {
    name: clip.name,
    duration: round2(clip.duration),
    loop: clip.loop,
    keyframes: clip.keyframes.map((kf) => ({
      t: round2(kf.t),
      pose: Object.fromEntries(
        Object.entries(kf.pose).map(([k, v]) => [k, round2(v)])
      ),
      easing: kf.easing,
    })),
  };
  return JSON.stringify(cleanClip, null, 2);
}

export function parsePoseInput(text: string): Pose | null {
  try {
    // Convert loose JS object notation like { head: 0.1, torso: -0.2 } into strict JSON
    const jsonStr = text
      .trim()
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*}/g, '}');
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'object' && parsed !== null) {
      const pose: Pose = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'number') pose[k] = v;
      }
      return pose;
    }
  } catch (err) {
    console.error('Failed to parse pose input:', err);
  }
  return null;
}
