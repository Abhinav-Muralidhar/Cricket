/**
 * profile-modal.ts - Visual customization locker modal for batter jersey, pants, cap, bat, and moniker.
 */
import type { CameraViewport } from './render.ts';
import type { GameState } from './types.ts';
import {
  JERSEY_PRESETS,
  PANTS_PRESETS,
  BAT_PRESETS,
  MONIKER_PRESETS,
  saveStoredProfile,
  getProfileMoniker,
  type BatterProfile,
} from './profile.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getProfileModalLayout(camW: number, camH: number) {
  const cardW = Math.min(480, camW - 24), cardH = Math.min(370, camH - 20);
  const cardX = (camW - cardW) / 2, cardY = (camH - cardH) / 2;
  const closeBtn: Rect = { x: cardX + cardW - 36, y: cardY + 12, w: 26, h: 26 };
  const doneBtn: Rect = { x: cardX + (cardW - 140) / 2, y: cardY + cardH - 42, w: 140, h: 32 };

  const monY = cardY + 48;
  const prevMonBtn: Rect = { x: cardX + 24, y: monY, w: 32, h: 28 };
  const nextMonBtn: Rect = { x: cardX + cardW - 56, y: monY, w: 32, h: 28 };
  const monBar: Rect = { x: cardX + 62, y: monY, w: cardW - 124, h: 28 };

  const jY = cardY + 112;
  const jSpacing = (cardW - 48) / JERSEY_PRESETS.length;
  const jSwatches: Rect[] = JERSEY_PRESETS.map((_, i) => ({
    x: cardX + 24 + i * jSpacing + jSpacing / 2 - 13, y: jY, w: 26, h: 26,
  }));

  const pY = cardY + 172;
  const pSpacing = (cardW - 48) / PANTS_PRESETS.length;
  const pSwatches: Rect[] = PANTS_PRESETS.map((_, i) => ({
    x: cardX + 24 + i * pSpacing + pSpacing / 2 - 13, y: pY, w: 26, h: 26,
  }));

  const gY = cardY + 234;
  const capToggle: Rect = { x: cardX + 24, y: gY, w: 130, h: 32 };
  const bSwatches: Rect[] = BAT_PRESETS.map((_, i) => ({
    x: cardX + cardW - 140 + i * 28, y: gY + 3, w: 24, h: 24,
  }));

  return {
    card: { x: cardX, y: cardY, w: cardW, h: cardH }, closeBtn, doneBtn,
    prevMonBtn, nextMonBtn, monBar, jSwatches, pSwatches, capToggle, bSwatches,
  };
}

function drawSwatches(ctx: CanvasRenderingContext2D, swatches: Rect[], colors: { color: string }[], selIdx: number) {
  swatches.forEach((sw, idx) => {
    const isSel = idx === selIdx;
    ctx.beginPath(); ctx.arc(sw.x + sw.w / 2, sw.y + sw.h / 2, sw.w / 2, 0, Math.PI * 2);
    ctx.fillStyle = colors[idx].color; ctx.fill();
    ctx.strokeStyle = isSel ? '#FACC15' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = isSel ? 3 : 1; ctx.stroke();
    if (isSel) {
      ctx.beginPath(); ctx.arc(sw.x + sw.w / 2, sw.y + sw.h / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF'; ctx.fill();
    }
  });
}

export function drawProfileModal(ctx: CanvasRenderingContext2D, cam: CameraViewport, state: GameState): void {
  const l = getProfileModalLayout(cam.cssWidth, cam.cssHeight), p = state.batterProfile, c = l.card;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 14, 0.82)'; ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

  // Main Card & Header
  ctx.fillStyle = 'rgba(24, 20, 26, 0.98)'; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 16); ctx.fill();
  ctx.strokeStyle = '#C98F2B'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#FBBF24'; ctx.font = '900 16px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('👕 BATTER LOCKER & CUSTOMIZATION', c.x + 22, c.y + 24);
  ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
  ctx.fillText('✕', l.closeBtn.x + l.closeBtn.w / 2, l.closeBtn.y + l.closeBtn.h / 2);

  // Moniker Bar
  ctx.fillStyle = 'rgba(40, 36, 44, 0.8)'; ctx.beginPath(); ctx.roundRect(l.monBar.x, l.monBar.y, l.monBar.w, l.monBar.h, 6); ctx.fill();
  ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#FDE68A'; ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`★  ${getProfileMoniker(p).toUpperCase()}  ★`, l.monBar.x + l.monBar.w / 2, l.monBar.y + 14);

  [l.prevMonBtn, l.nextMonBtn].forEach((btn, idx) => {
    ctx.fillStyle = 'rgba(60, 50, 68, 0.85)'; ctx.beginPath(); ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 6); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px monospace';
    ctx.fillText(idx === 0 ? '◀' : '▶', btn.x + btn.w / 2, btn.y + btn.h / 2);
  });

  // Jersey & Pants Swatches
  ctx.textAlign = 'left'; ctx.fillStyle = '#E2E8F0'; ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(`JERSEY: ${JERSEY_PRESETS[p.jerseyIndex]?.name.toUpperCase()}`, c.x + 24, l.jSwatches[0].y - 12);
  drawSwatches(ctx, l.jSwatches, JERSEY_PRESETS, p.jerseyIndex);

  ctx.fillText(`PANTS: ${PANTS_PRESETS[p.pantsIndex]?.name.toUpperCase()}`, c.x + 24, l.pSwatches[0].y - 12);
  drawSwatches(ctx, l.pSwatches, PANTS_PRESETS, p.pantsIndex);

  // Cap Toggle
  ctx.fillStyle = p.hasCap ? '#15803D' : 'rgba(50, 45, 55, 0.9)';
  ctx.beginPath(); ctx.roundRect(l.capToggle.x, l.capToggle.y, l.capToggle.w, l.capToggle.h, 6); ctx.fill();
  ctx.strokeStyle = p.hasCap ? '#4ADE80' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`🧢 CAP: ${p.hasCap ? 'ON' : 'OFF'}`, l.capToggle.x + l.capToggle.w / 2, l.capToggle.y + l.capToggle.h / 2);

  // Bat Sticker
  ctx.textAlign = 'left';
  ctx.fillText(`BAT STICKER:`, l.bSwatches[0].x - 90, l.bSwatches[0].y + l.bSwatches[0].h / 2);
  l.bSwatches.forEach((sw, idx) => {
    const isSel = idx === p.batIndex;
    ctx.fillStyle = BAT_PRESETS[idx].color; ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
    ctx.strokeStyle = isSel ? '#FACC15' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = isSel ? 2.5 : 1;
    ctx.strokeRect(sw.x, sw.y, sw.w, sw.h);
  });

  // Done Button
  ctx.fillStyle = '#16A34A'; ctx.beginPath(); ctx.roundRect(l.doneBtn.x, l.doneBtn.y, l.doneBtn.w, l.doneBtn.h, 8); ctx.fill();
  ctx.strokeStyle = '#86EFAC'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('✔  DONE', l.doneBtn.x + l.doneBtn.w / 2, l.doneBtn.y + l.doneBtn.h / 2);
  ctx.restore();
}

export function handleProfileClick(
  clientX: number, clientY: number, cam: CameraViewport, state: GameState,
  onProfileChanged: (p: BatterProfile) => void, onClose: () => void
): boolean {
  const l = getProfileModalLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: Rect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;

  if (!inR(l.card) || inR(l.closeBtn) || inR(l.doneBtn)) { onClose(); return true; }

  const p = { ...state.batterProfile };
  if (inR(l.prevMonBtn)) p.monikerIndex = (p.monikerIndex - 1 + MONIKER_PRESETS.length) % MONIKER_PRESETS.length;
  else if (inR(l.nextMonBtn)) p.monikerIndex = (p.monikerIndex + 1) % MONIKER_PRESETS.length;
  else if (inR(l.capToggle)) p.hasCap = !p.hasCap;
  else {
    l.jSwatches.forEach((sw, idx) => {
      if (Math.hypot(clientX - (sw.x + sw.w / 2), clientY - (sw.y + sw.h / 2)) <= sw.w / 2 + 4) p.jerseyIndex = idx;
    });
    l.pSwatches.forEach((sw, idx) => {
      if (Math.hypot(clientX - (sw.x + sw.w / 2), clientY - (sw.y + sw.h / 2)) <= sw.w / 2 + 4) p.pantsIndex = idx;
    });
    l.bSwatches.forEach((sw, idx) => { if (inR(sw)) p.batIndex = idx; });
  }

  state.batterProfile = p;
  saveStoredProfile(p);
  onProfileChanged(p);
  return true;
}
