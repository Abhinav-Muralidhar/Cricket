/**
 * hud.ts - Screen-space HUD, center score badges, debug zones, and utility buttons.
 */

import { CONFIG, PALETTE } from './config.ts';
import { EASINGS } from './animation.ts';
import { isAudioMuted } from './audio.ts';
import { isStandalonePWA, isIOS, getSafeAreaInsets } from './pwa.ts';
import type { GameState } from './types.ts';
import type { CameraViewport } from './render.ts';
import { drawGameOverHUD, getStoredBestScore } from './share.ts';
import { drawTitleHUD } from './title-hud.ts';
import { drawMilestonePopup } from './milestone.ts';
import { drawAssistTag, drawAssistMarker, drawSettingsModal, drawFirstTimeGuide } from './settings.ts';

export function drawRotatePhoneOverlay(ctx: CanvasRenderingContext2D, cam: CameraViewport): void {
  ctx.save();
  ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
  ctx.fillStyle = 'rgba(18, 18, 24, 0.96)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);
  const cx = cam.cssWidth / 2, cy = cam.cssHeight / 2;
  ctx.save();
  ctx.translate(cx, cy - 50);
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-22, -36, 44, 72, 8); ctx.stroke();
  ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(0, 26, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 48, -Math.PI * 0.35, Math.PI * 0.45, false); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(35, 34); ctx.lineTo(44, 44); ctx.lineTo(28, 46); ctx.fill();
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 24px sans-serif'; ctx.fillText('PLEASE ROTATE YOUR PHONE', cx, cy + 35);
  ctx.fillStyle = PALETTE.cream; ctx.font = '15px sans-serif'; ctx.fillText('Gully Cricket is best played in landscape mode', cx, cy + 68);
  ctx.restore();
}

export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  ctx.save();
  const insets = getSafeAreaInsets();
  const topPad = Math.max(18, insets.top + 10), leftPad = Math.max(18, insets.left + 12);
  const rightPad = Math.max(18, insets.right + 12), botPad = Math.max(20, insets.bottom + 12);
  const bestScore = Math.max(state.score, getStoredBestScore());
  const pillX = leftPad, pillY = topPad, pillW = 340, pillH = 44, cyPill = pillY + pillH / 2;

  ctx.fillStyle = 'rgba(26, 24, 28, 0.82)';
  ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 22); ctx.fill();
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px monospace'; ctx.fillStyle = PALETTE.cream;
  ctx.fillText(`RUNS ${state.score} [${state.ballCount}]`, pillX + 14, cyPill);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pillX + 112, pillY + 11); ctx.lineTo(pillX + 112, pillY + pillH - 11); ctx.stroke();
  ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#FBBF24';
  ctx.fillText(`BEST ${bestScore}`, pillX + 122, cyPill);

  ctx.beginPath(); ctx.moveTo(pillX + 194, pillY + 11); ctx.lineTo(pillX + 194, pillY + pillH - 11); ctx.stroke();
  ctx.font = 'bold 12px monospace'; ctx.fillStyle = PALETTE.cream;
  ctx.fillText('LIVES', pillX + 204, cyPill);

  for (let i = 0; i < CONFIG.gameplay.initialLives; i++) {
    const bx = pillX + 256 + i * 18, alive = i < state.lives;
    ctx.beginPath(); ctx.arc(bx, cyPill, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = alive ? PALETTE.ball : 'rgba(100, 100, 100, 0.35)'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = alive ? '#FDE68A' : 'rgba(150, 150, 150, 0.25)'; ctx.stroke();
  }

  drawAssistTag(ctx, state, cam);

  if (state.lastResult && state.state === 'RESULT') {
    const res = state.lastResult, t = Math.min(1, state.resultTimer / 0.22);
    const scale = EASINGS.easeOutBack(t), floatY = -Math.min(22, state.resultTimer * 16);
    let numText = '0', tag = 'DOT', numColor = '#94A3B8', ccDesc = 'PLAY & MISS • BEATEN OUTSIDE OFF';

    if (res.outcome === 'SIX') {
      numText = '+6'; tag = 'MAXIMUM'; numColor = '#FDE047';
      ccDesc = res.timingOffsetPx < 0 ? 'MAXIMUM • OVER DEEP MID-WICKET' : 'MAXIMUM • STRAIGHT OVER ROOFTOPS';
    } else if (res.outcome === 'FOUR') {
      numText = '+4'; tag = 'FOUR'; numColor = '#38BDF8';
      ccDesc = res.timingOffsetPx > 0 ? 'COVER DRIVE • SWEPT TO FENCE' : 'LATE DAB • PAST THIRD MAN';
    } else if (res.outcome === 'THREE') {
      numText = '+3'; tag = 'THREE!'; numColor = '#34D399'; ccDesc = 'SUPERB PLACEMENT • RUNNING 3';
    } else if (res.outcome === 'TWO') {
      numText = '+2'; tag = 'TWO!'; numColor = '#60A5FA'; ccDesc = 'WORKED AWAY • SCAMPERED 2';
    } else if (res.outcome === 'SINGLE') {
      numText = '+1'; tag = 'SINGLE'; numColor = '#4ADE80'; ccDesc = 'QUICK SINGLE • PUNCHED INTO GAP';
    } else if (res.outcome === 'DOT') {
      numText = '0'; tag = 'BLOCKED'; numColor = '#CBD5E1'; ccDesc = 'SOLID DEFENCE • DEAD BAT';
    } else if (res.outcome === 'EDGE') {
      numText = '+4'; tag = 'EDGED FOUR!'; numColor = '#FBBF24'; ccDesc = 'LUCKY EDGE • FLIES FINE TO THIRD MAN';
    } else if (res.outcome === 'BOWLED') {
      numText = 'OUT'; tag = 'WICKET'; numColor = '#F87171'; ccDesc = 'CLEAN BOWLED • TIMBER!';
    } else if (res.livesLost > 0) {
      numText = '-1 LIFE'; tag = 'BALL LOST'; numColor = '#F87171';
      ccDesc = res.outcome === 'CAR_GLASS' ? 'CAR HIT • BALL LOST (-1 LIFE)' : res.outcome === 'WINDOW' ? 'WINDOW SMASH • BALL LOST (-1 LIFE)' :
        res.outcome === 'AC_UNIT' ? 'AC UNIT HIT • BALL LOST (-1 LIFE)' : res.outcome === 'NEWSPAPER' ? 'NEWSPAPER HIT • BALL LOST (-1 LIFE)' : res.description;
    }

    ctx.save();
    ctx.translate(cam.cssWidth / 2, cam.cssHeight / 2 - 25 + floatY);
    ctx.strokeStyle = numColor; ctx.globalAlpha = Math.max(0, 0.55 - t * 0.55); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 20 + t * 75, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cam.cssWidth / 2, cam.cssHeight / 2 - 25 + floatY);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 12px system-ui, Roboto, sans-serif'; ctx.fillStyle = numColor;
    ctx.fillText(tag, 0, -38);
    ctx.font = `italic 800 ${numText.length > 3 ? 42 : 70}px system-ui, Roboto, sans-serif`;
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeText(numText, 0, 4);
    ctx.fillStyle = numColor; ctx.fillText(numText, 0, 4);
    ctx.restore();

    ctx.save();
    ctx.font = '500 13px system-ui, Roboto, sans-serif';
    const textW = ctx.measureText(ccDesc).width;
    const cw = textW + 28, ch = 26, cpx = (cam.cssWidth - cw) / 2, cpy = cam.cssHeight - 48;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.beginPath(); ctx.roundRect(cpx, cpy, cw, ch, 13); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F1F5F9'; ctx.fillText(ccDesc, cam.cssWidth / 2, cpy + ch / 2);
    ctx.restore();
  }

  if (state.debugMode) {
    ctx.fillStyle = 'rgba(30, 30, 36, 0.88)';
    ctx.fillRect(cam.cssWidth - 280, 18, 260, 84);
    ctx.strokeStyle = '#00f5d4'; ctx.lineWidth = 1;
    ctx.strokeRect(cam.cssWidth - 280, 18, 260, 84);
    ctx.fillStyle = '#00f5d4'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`DEBUG [D] | TARGET: ${state.selectedHitTarget.toUpperCase()}`, cam.cssWidth - 270, 36);
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(`SweetX: ${state.effectiveSweetSpotX.toFixed(0)} | Speed: ${state.currentBallSpeed.toFixed(0)}`, cam.cssWidth - 270, 54);
    ctx.fillStyle = '#FACC15';
    ctx.fillText(`Deliv: ${state.currentDeliveryType} | DPR: ${cam.dpr}`, cam.cssWidth - 270, 72);
  }

  if (state.state === 'TITLE' || state.state === 'GAME_OVER') {
    if (state.state === 'TITLE') drawTitleHUD(ctx, cam);
    else {
      ctx.fillStyle = 'rgba(30, 30, 36, 0.82)'; ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);
      drawGameOverHUD(ctx, state, cam);
    }
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(245, 233, 207, 0.48)';
    ctx.font = '500 12px system-ui, -apple-system, Roboto, sans-serif';
    ctx.fillText('Developed by Abhinav M ↗', leftPad, cam.cssHeight - botPad);

    if (!isStandalonePWA()) {
      const iw = 100, ih = 28, ix = cam.cssWidth - iw - rightPad, iy = cam.cssHeight - ih - botPad;
      ctx.fillStyle = 'rgba(30, 30, 36, 0.85)';
      ctx.beginPath(); ctx.roundRect(ix, iy, iw, ih, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(242, 193, 78, 0.38)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF'; ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillText('📲 Install App', ix + iw / 2, iy + ih / 2);
    }
  }

  // Top-right utility buttons: Gear, Fullscreen, Audio
  const showFs = !isIOS();
  const sndX = cam.cssWidth - rightPad - 36, fsX = sndX - 42, gearX = showFs ? fsX - 42 : sndX - 42, btnY = topPad;
  const isFs = typeof document !== 'undefined' && !!document.fullscreenElement;
  ctx.save();
  ctx.fillStyle = 'rgba(30, 30, 36, 0.82)';

  // Settings Gear
  ctx.beginPath(); ctx.roundRect(gearX, btnY, 36, 36, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.40)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF'; ctx.fillText('⚙', gearX + 18, btnY + 18);

  if (showFs) {
    ctx.beginPath(); ctx.roundRect(fsX, btnY, 36, 36, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.40)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '16px monospace'; ctx.fillText(isFs ? '✕' : '⛶', fsX + 18, btnY + 18);
  }
  ctx.beginPath(); ctx.roundRect(sndX, btnY, 36, 36, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.40)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.font = '16px sans-serif'; ctx.fillText(isAudioMuted() ? '🔇' : '🔊', sndX + 18, btnY + 18);
  ctx.restore();

  drawMilestonePopup(ctx, state, cam);
  if (state.guideActive) drawFirstTimeGuide(ctx, cam);
  if (state.settingsOpen) drawSettingsModal(ctx, cam, state);
  ctx.restore();
}

export function drawWorldDebug(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawAssistMarker(ctx, state);
  if (!state.debugMode) return;
  const sweetX = state.effectiveSweetSpotX, groundY = CONFIG.street.groundY, zoneY = groundY + 14;
  ctx.save();

  const targets = [
    { key: 'window', name: 'WINDOW', rect: CONFIG.layout.window }, { key: 'acUnit', name: 'AC UNIT', rect: CONFIG.layout.acUnit },
    { key: 'newspaper', name: 'NEWSPAPER', rect: CONFIG.layout.newspaper }, { key: 'car', name: 'CAR', rect: CONFIG.layout.car },
    { key: 'scooter', name: 'SCOOTER', rect: CONFIG.layout.scooter },
  ];
  for (const item of targets) {
    const isSel = state.selectedHitTarget === item.key, r = item.rect;
    ctx.save();
    ctx.fillStyle = isSel ? 'rgba(250, 204, 21, 0.25)' : 'rgba(56, 189, 248, 0.12)'; ctx.fillRect(r.x, r.y, r.width, r.height);
    ctx.strokeStyle = isSel ? '#FACC15' : '#38BDF8'; ctx.lineWidth = isSel ? 3 : 1.5;
    if (!isSel) ctx.setLineDash([6, 4]);
    ctx.strokeRect(r.x, r.y, r.width, r.height);
    ctx.fillStyle = isSel ? '#FACC15' : '#FFFFFF'; ctx.font = isSel ? 'bold 13px monospace' : '11px monospace';
    ctx.fillText(`${isSel ? `* [SELECTED ${item.name}]` : item.name} { x: ${r.x}, y: ${r.y}, w: ${r.width}, h: ${r.height} }`, r.x + 4, Math.max(18, r.y - 6));
    ctx.restore();
  }

  // Sweet spot vertical line
  ctx.strokeStyle = '#00f5d4'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(sweetX, groundY - 140); ctx.lineTo(sweetX, groundY + 40); ctx.stroke();
  ctx.setLineDash([]);

  const drawZone = (minO: number, maxO: number, col: string, lbl: string) => {
    const sx = Math.min(sweetX + minO, sweetX + maxO), w = Math.abs(maxO - minO);
    ctx.fillStyle = col; ctx.fillRect(sx, zoneY, w, 22);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.strokeRect(sx, zoneY, w, 22);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace';
    ctx.fillText(lbl, sx + w / 2 - 8, zoneY + 15);
  };

  const zones: [number, number, string, string][] = [
    [180, 240, 'rgba(214, 40, 40, 0.85)', 'WIN'], [130, 180, 'rgba(56, 189, 248, 0.85)', 'AC'],
    [75, 130, 'rgba(250, 204, 21, 0.85)', 'NEWS'], [12, 38, 'rgba(6, 182, 212, 0.8)', '4'],
    [-12, 12, 'rgba(16, 185, 129, 0.9)', '6'], [-12, -26, 'rgba(6, 182, 212, 0.8)', '4'],
    [-26, -34, 'rgba(52, 211, 153, 0.8)', '3'], [-34, -40, 'rgba(96, 165, 250, 0.8)', '2'],
    [-40, -46, 'rgba(234, 179, 8, 0.8)', '1'], [-46, -52, 'rgba(203, 213, 225, 0.8)', 'DOT'],
    [-52, -58, 'rgba(251, 191, 36, 0.85)', 'EDGE'], [-58, -98, 'rgba(249, 115, 22, 0.85)', 'CAR']
  ];
  for (const [mi, ma, c, l] of zones) drawZone(mi, ma, c, l);

  if (state.ball.active || state.state === 'BOWLING') {
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(state.ball.x, groundY - 80); ctx.lineTo(state.ball.x, zoneY + 36); ctx.stroke();
  }
  ctx.restore();
}
