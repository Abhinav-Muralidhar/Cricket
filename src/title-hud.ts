/**
 * title-hud.ts - Start screen character overlay, bespoke Gully Cricket badge, and rules modal.
 */
import type { CameraViewport } from './render.ts';
import { drawThemedIconButton, type ButtonRect } from './share.ts';

const titleCharsImg = typeof Image !== 'undefined' ? new Image() : null;
if (titleCharsImg) titleCharsImg.src = '/title-chars.png';

let showRulesModal = false;

export function getTitleLayout(camWidth: number, camHeight: number): {
  chars: ButtonRect; badge: ButtonRect; playBtn: ButtonRect; infoBtn: ButtonRect; card: ButtonRect; closeBtn: ButtonRect;
} {
  const cx = camWidth / 2, cy = camHeight / 2;
  const isBig = camHeight >= 500 && camWidth >= 760;

  const maxH = isBig ? Math.min(290, camHeight * 0.44) : Math.min(210, camHeight * 0.50);
  const charsH = Math.max(160, maxH);
  const charsW = charsH * (688 / 363);
  const charsY = cy - charsH / 2 - (isBig ? 48 : 34);
  const charsX = cx - charsW / 2;

  const badgeW = isBig ? Math.min(340, camWidth - 40) : Math.min(280, camWidth - 32);
  const badgeH = isBig ? 74 : 64;
  const badgeX = cx - badgeW / 2, badgeY = charsY + charsH - (isBig ? 28 : 22);

  const btnSize = isBig ? 58 : 52, gap = 16, btnY = badgeY + badgeH + (isBig ? 15 : 12);
  const playBtn: ButtonRect = { x: cx - btnSize - gap / 2, y: btnY, w: btnSize, h: btnSize };
  const infoBtn: ButtonRect = { x: cx + gap / 2, y: btnY, w: btnSize, h: btnSize };

  const cardW = Math.min(360, camWidth - 24), cardH = 220;
  const cardX = cx - cardW / 2, cardY = cy - cardH / 2;
  const closeBtn: ButtonRect = { x: cardX + cardW - 36, y: cardY + 10, w: 26, h: 26 };

  return {
    chars: { x: charsX, y: charsY, w: charsW, h: charsH },
    badge: { x: badgeX, y: badgeY, w: badgeW, h: badgeH },
    playBtn, infoBtn,
    card: { x: cardX, y: cardY, w: cardW, h: cardH }, closeBtn,
  };
}

export function handleTitleClick(
  clientX: number, clientY: number, cam: CameraViewport, onStart: () => void
): boolean {
  const tl = getTitleLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: ButtonRect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;

  if (showRulesModal) {
    if (inR(tl.closeBtn) || !inR(tl.card)) showRulesModal = false;
    return true;
  }
  if (inR(tl.infoBtn)) { showRulesModal = true; return true; }
  if (inR(tl.playBtn)) { onStart(); return true; }
  return false;
}

export function isTitleHover(clientX: number, clientY: number, cam: CameraViewport): boolean {
  const tl = getTitleLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: ButtonRect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  if (showRulesModal) return inR(tl.closeBtn);
  return inR(tl.playBtn) || inR(tl.infoBtn);
}

export function drawGullyBadge(ctx: CanvasRenderingContext2D, b: ButtonRect, cx: number): void {
  // 1. Drop shadow & rustic wood frame with bevel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath(); ctx.roundRect(b.x - 2, b.y + 2, b.w + 4, b.h + 4, 16); ctx.fill();

  ctx.fillStyle = '#451A03';
  ctx.beginPath(); ctx.roundRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6, 15); ctx.fill();
  ctx.fillStyle = '#C98F2B';
  ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill();

  // 2. Corrugated street-teal inner plate with vertical texture ribs
  const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  grad.addColorStop(0, '#0284C7'); grad.addColorStop(1, '#075985');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6, 10); ctx.fill();
  ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 1; ctx.stroke();

  // Vertical corrugated ribs (soft subtle texture)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'; ctx.lineWidth = 1;
  for (let rx = b.x + 18; rx < b.x + b.w - 12; rx += 14) {
    ctx.beginPath(); ctx.moveTo(rx, b.y + 6); ctx.lineTo(rx, b.y + b.h - 18); ctx.stroke();
  }

  // Corner brass studs
  const studs = [[b.x + 8, b.y + 8], [b.x + b.w - 8, b.y + 8], [b.x + 8, b.y + b.h - 8], [b.x + b.w - 8, b.y + b.h - 8]];
  ctx.fillStyle = '#FDE68A';
  for (const [sx, sy] of studs) {
    ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // 3. Proportional typography scaling for single-line GULLY CRICKET
  const sc = b.h / 64;
  const ribSz = Math.max(8, Math.round(8.5 * sc));
  const rh = Math.round(16 * sc), rw = b.w - 36, rx = cx - rw / 2, ry = b.y + b.h - rh / 2 - 4;

  const titleSz = Math.min(26, Math.max(17, Math.round(22 * sc * Math.min(1, (b.w - 28) / 230))));
  ctx.font = `900 ${titleSz}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';
  const gullyW = ctx.measureText('GULLY ').width;
  const cktW = ctx.measureText('CRICKET').width;
  const startX = cx - (gullyW + cktW) / 2;
  const titleY = b.y + b.h / 2 - 2;

  // 3D Embossed GULLY (Vibrant Gold)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#451A03';
  ctx.fillText('GULLY', startX, titleY + 2);
  ctx.fillStyle = '#FBBF24';
  ctx.fillText('GULLY', startX, titleY);

  // 3D Embossed CRICKET (Crisp White)
  const cktX = startX + gullyW;
  ctx.fillStyle = '#0F172A';
  ctx.fillText('CRICKET', cktX, titleY + 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('CRICKET', cktX, titleY);

  // 4. Crimson Ribbon Banner with gold star tracking
  ctx.fillStyle = '#991B1B';
  ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, 4); ctx.fill();
  ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1; ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FEF08A'; ctx.font = `bold ${ribSz}px monospace`;
  ctx.fillText('★ NEIGHBORHOOD CHAOS ★', cx, ry + rh / 2);
}

export function drawTitleHUD(ctx: CanvasRenderingContext2D, cam: CameraViewport): void {
  // 1. Sleek, clean dark cinematic backdrop over the gameplay scene
  ctx.fillStyle = 'rgba(16, 14, 20, 0.78)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

  const l = getTitleLayout(cam.cssWidth, cam.cssHeight), cx = cam.cssWidth / 2;

  // 2. Extracted character cutout
  if (titleCharsImg && titleCharsImg.complete && titleCharsImg.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(titleCharsImg, l.chars.x, l.chars.y, l.chars.w, l.chars.h);
  }

  // 3. Handcrafted Gully Cricket emblem badge
  drawGullyBadge(ctx, l.badge, cx);

  // 4. Tactile gamified arcade Play [▶] & Rules [ℹ] buttons
  drawThemedIconButton(ctx, l.playBtn, '▶', '#451A03', 26);
  drawThemedIconButton(ctx, l.infoBtn, 'ℹ', '#451A03', 24);

  // Micro instruction prompt
  ctx.fillStyle = '#94A3B8'; ctx.font = '500 12px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Tap ▶ to Play  •  Tap ℹ for Rules', cx, l.playBtn.y + l.playBtn.h + 16);

  // 5. Dedicated rules popup modal card if active
  if (showRulesModal) {
    ctx.fillStyle = 'rgba(10, 8, 14, 0.75)';
    ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);
    const c = l.card;
    ctx.fillStyle = 'rgba(24, 20, 24, 0.96)';
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 16); ctx.fill();
    ctx.strokeStyle = '#C98F2B'; ctx.lineWidth = 2; ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FBBF24'; ctx.font = '900 18px system-ui, sans-serif';
    ctx.fillText('HOW TO PLAY', cx, c.y + 32);

    ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 16px monospace';
    ctx.fillText('✕', l.closeBtn.x + l.closeBtn.w / 2, l.closeBtn.y + l.closeBtn.h / 2 + 5);

    ctx.fillStyle = '#38BDF8'; ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('🏏 Tap screen or press Space to hit the ball!', cx, c.y + 66);
    ctx.fillStyle = '#CBD5E1'; ctx.font = '500 11px system-ui, sans-serif';
    ctx.fillText('Time your swing when the ball reaches the sweet spot.', cx, c.y + 84);

    const spW = c.w - 32, spH = 68, spX = c.x + 16, spY = c.y + 98;
    ctx.fillStyle = 'rgba(15, 12, 10, 0.78)';
    ctx.beginPath(); ctx.roundRect(spX, spY, spW, spH, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.3)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.textBaseline = 'middle'; ctx.fillStyle = '#F59E0B'; ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('📋 STREET RULES', cx, spY + 16);
    ctx.fillStyle = '#F5E9CF'; ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillText('🚗 Hitting cars/windows loses the ball (-1 Life)', cx, spY + 36);
    ctx.fillText('🔴 3 Lives total • Clean bowled = OUT!', cx, spY + 52);

    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#94A3B8'; ctx.font = 'italic 11px system-ui, sans-serif';
    ctx.fillText('Tap anywhere to dismiss', cx, c.y + 198);
  }
}
