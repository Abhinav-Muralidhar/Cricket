/**
 * settings.ts - Assist & audio preferences, settings modal, and first-time user guide.
 */

import { CONFIG } from './config.ts';
import type { CameraViewport } from './render.ts';
import type { GameState } from './types.ts';
import { getAssistTagText } from './deliveries.ts';
import { isAudioMuted, toggleAudioMute } from './audio.ts';
import { getSafeAreaInsets } from './pwa.ts';

const ASSIST_KEY = 'gully_cricket_assist_enabled';
const FIRST_GUIDE_KEY = 'gully_cricket_guide_shown';
const ASSIST_HINT_KEY = 'gully_cricket_assist_hint_shown';

export interface ButtonRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getStoredAssist(): boolean {
  try {
    return localStorage.getItem(ASSIST_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredAssist(val: boolean): void {
  try {
    localStorage.setItem(ASSIST_KEY, val ? 'true' : 'false');
  } catch {}
}

export function isFirstGuideDone(): boolean {
  try {
    return localStorage.getItem(FIRST_GUIDE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setFirstGuideDone(): void {
  try {
    localStorage.setItem(FIRST_GUIDE_KEY, 'true');
  } catch {}
}

export function isAssistHintShown(): boolean {
  try {
    return localStorage.getItem(ASSIST_HINT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAssistHintShown(): void {
  try {
    localStorage.setItem(ASSIST_HINT_KEY, 'true');
  } catch {}
}

export function getSettingsLayout(camWidth: number, camHeight: number) {
  const cx = camWidth / 2, cy = camHeight / 2;
  const cardW = Math.min(380, camWidth - 28), cardH = 220;
  const cardX = cx - cardW / 2, cardY = cy - cardH / 2;
  const closeBtn: ButtonRect = { x: cardX + cardW - 36, y: cardY + 12, w: 24, h: 24 };
  const assistToggle: ButtonRect = { x: cardX + cardW - 74, y: cardY + 68, w: 52, h: 28 };
  const soundToggle: ButtonRect = { x: cardX + cardW - 74, y: cardY + 138, w: 52, h: 28 };
  return { card: { x: cardX, y: cardY, w: cardW, h: cardH }, closeBtn, assistToggle, soundToggle };
}

export function drawSettingsModal(ctx: CanvasRenderingContext2D, cam: CameraViewport, state: GameState): void {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 14, 0.78)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);
  const l = getSettingsLayout(cam.cssWidth, cam.cssHeight);
  const c = l.card;

  ctx.fillStyle = 'rgba(24, 20, 24, 0.98)';
  ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 16); ctx.fill();
  ctx.strokeStyle = '#C98F2B'; ctx.lineWidth = 2; ctx.stroke();

  // Header & Close
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FBBF24'; ctx.font = '900 18px system-ui, sans-serif';
  ctx.fillText('SETTINGS', c.x + 22, c.y + 26);

  ctx.textAlign = 'center'; ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 16px monospace';
  ctx.fillText('✕', l.closeBtn.x + l.closeBtn.w / 2, l.closeBtn.y + l.closeBtn.h / 2);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(c.x + 20, c.y + 48); ctx.lineTo(c.x + c.w - 20, c.y + 48); ctx.stroke();

  // Row 1: Assist
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('Assist Mode', c.x + 22, c.y + 74);
  ctx.fillStyle = '#94A3B8'; ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillText('Shows the ball type before each delivery.', c.x + 22, c.y + 94);
  drawToggle(ctx, l.assistToggle, state.assistEnabled);

  // Row 2: Sound
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('Sound Audio', c.x + 22, c.y + 144);
  ctx.fillStyle = '#94A3B8'; ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillText(isAudioMuted() ? 'Audio muted' : 'Audio playing', c.x + 22, c.y + 162);
  drawToggle(ctx, l.soundToggle, !isAudioMuted());
  ctx.restore();
}

function drawToggle(ctx: CanvasRenderingContext2D, r: ButtonRect, on: boolean): void {
  ctx.save();
  ctx.fillStyle = on ? '#10B981' : 'rgba(75, 85, 99, 0.7)';
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, r.h / 2); ctx.fill();
  ctx.strokeStyle = on ? '#34D399' : 'rgba(156, 163, 175, 0.5)'; ctx.lineWidth = 1; ctx.stroke();
  const knobR = (r.h - 6) / 2;
  const knobX = on ? r.x + r.w - knobR - 3 : r.x + knobR + 3;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(knobX, r.y + r.h / 2, knobR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function handleSettingsPointer(clientX: number, clientY: number, cam: CameraViewport, state: GameState): boolean {
  if (!state.settingsOpen) return false;
  const l = getSettingsLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: ButtonRect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;

  if (inR(l.closeBtn) || !inR(l.card)) {
    state.settingsOpen = false;
    return true;
  }
  if (inR(l.assistToggle)) {
    state.assistEnabled = !state.assistEnabled;
    setStoredAssist(state.assistEnabled);
    return true;
  }
  if (inR(l.soundToggle)) {
    toggleAudioMute();
    return true;
  }
  return true;
}

export function drawFirstTimeGuide(ctx: CanvasRenderingContext2D, cam: CameraViewport): void {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 14, 0.82)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);
  const cx = cam.cssWidth / 2, cy = cam.cssHeight / 2;
  const w = Math.min(380, cam.cssWidth - 32), h = 186;
  const x = cx - w / 2, y = cy - h / 2;

  ctx.fillStyle = 'rgba(24, 20, 24, 0.98)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = '#C98F2B'; ctx.lineWidth = 2; ctx.stroke();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FBBF24'; ctx.font = '900 17px system-ui, sans-serif';
  ctx.fillText('HOW TO PLAY', cx, y + 26);

  ctx.fillStyle = '#F5E9CF'; ctx.font = '500 13px system-ui, sans-serif';
  ctx.fillText('Tap to swing. Time it right for 4s and 6s.', cx, y + 62);
  ctx.fillText("Don't hit the window, the AC or the uncle.", cx, y + 84);

  const btnW = 120, btnH = 38, btnX = cx - btnW / 2, btnY = y + 124;
  ctx.fillStyle = '#C98F2B'; ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 10); ctx.fill();
  ctx.strokeStyle = '#FDE68A'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#1E1E24'; ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('Got it', cx, btnY + btnH / 2);
  ctx.restore();
}

export function handleGuidePointer(clientX: number, clientY: number, cam: CameraViewport, state: GameState): boolean {
  if (!state.guideActive) return false;
  const cx = cam.cssWidth / 2, cy = cam.cssHeight / 2;
  const h = 186;
  const y = cy - h / 2;
  const btnW = 120, btnH = 38, btnX = cx - btnW / 2, btnY = y + 124;
  if (clientX >= btnX && clientX <= btnX + btnW && clientY >= btnY && clientY <= btnY + btnH) {
    state.guideActive = false;
    setFirstGuideDone();
    return true;
  }
  return true;
}

export function drawAssistTag(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  if (!state.assistEnabled || state.state !== 'BOWLING') return;
  const tagText = getAssistTagText(state.currentDeliveryType, state.currentBallSpeed);
  const insets = getSafeAreaInsets();
  const rightPad = Math.max(18, insets.right + 12);
  const topPad = Math.max(18, insets.top + 10);

  ctx.save();
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  const tw = ctx.measureText(tagText).width;
  const pw = tw + 22, ph = 26;
  const px = cam.cssWidth - rightPad - pw;
  const bowlerHeadY = (CONFIG.layout.bowler.y - 145 - cam.worldTop) * cam.scale;
  const py = Math.min(Math.max(topPad + 10, bowlerHeadY), cam.cssHeight - 60);

  ctx.fillStyle = 'rgba(20, 18, 24, 0.92)';
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.fillStyle = '#FEF08A'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tagText, px + pw / 2, py + ph / 2);
  ctx.restore();
}

export function drawAssistMarker(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.assistEnabled || !CONFIG.delivery.assistShowMarker || state.state !== 'BOWLING') return;
  const sx = state.effectiveSweetSpotX, gy = CONFIG.street.groundY;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx, gy - 20); ctx.lineTo(sx, gy + 20); ctx.stroke();
  ctx.restore();
}

