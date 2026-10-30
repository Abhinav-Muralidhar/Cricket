/**
 * share.ts - Game-over modal, incident-based funny lines, high-score tracking & social sharing.
 */
import type { GameState } from './types.ts';
import type { CameraViewport } from './render.ts';
import { isAssistHintShown, setAssistHintShown } from './settings.ts';

const BEST_SCORE_KEY = 'gully_cricket_best_score';
let copiedToastUntil = 0;

export function getStoredBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch { return 0; }
}

export function updateStoredBestScore(currentScore: number): number {
  try {
    const prev = getStoredBestScore(), best = Math.max(prev, currentScore);
    if (best > prev) localStorage.setItem(BEST_SCORE_KEY, String(best));
    return best;
  } catch { return currentScore; }
}

export function getFunnyGameOverLine(state: GameState): string {
  const o = state.lastResult?.outcome;
  if (o === 'CAR_GLASS') return 'Shattered the car windshield! Uncle chasing with a slipper!';
  if (o === 'WINDOW') return "Smashed Uncle's window! Ball confiscated forever.";
  if (o === 'AC_UNIT') return 'Dented the 1.5-ton AC unit! Freon hissing down the street.';
  if (o === 'NEWSPAPER') return "Tore through Uncle's morning paper! Gully cricket banned.";
  if (o === 'BOWLED') return 'Middle stump sent flying! Clean bowled on the street.';
  if (state.score === 0) return 'Duck! Clean bowled on the first ball.';
  if (state.score < 15) return 'Uncle confiscated the tennis ball!';
  if (state.score < 30) return "Smashed Uncle's window and sprinted!";
  if (state.score < 50) return 'Car alarm blaring across the neighborhood!';
  return 'Certified Gully Legend!';
}

export interface ButtonRect { x: number; y: number; w: number; h: number; }

export function getGameOverLayout(camWidth: number, camHeight: number): {
  card: ButtonRect; playAgain: ButtonRect; share: ButtonRect; gear: ButtonRect; whatsapp: ButtonRect;
} {
  const cx = camWidth / 2, cy = camHeight / 2;
  const cardW = Math.min(380, camWidth - 32), cardH = 226, cardX = cx - cardW / 2, cardY = cy - cardH / 2 - 8;
  const btnSize = 58, gap = 16;
  const gear: ButtonRect = { x: cardX + cardW - 36, y: cardY + 12, w: 24, h: 24 };
  const totalW = btnSize * 3 + gap * 2, startX = cx - totalW / 2;

  return {
    card: { x: cardX, y: cardY, w: cardW, h: cardH }, gear,
    playAgain: { x: startX, y: cardY + 150, w: btnSize, h: btnSize },
    share: { x: startX + btnSize + gap, y: cardY + 150, w: btnSize, h: btnSize },
    whatsapp: { x: startX + (btnSize + gap) * 2, y: cardY + 150, w: btnSize, h: btnSize },
  };
}

export async function shareGame(state: GameState): Promise<void> {
  const url = 'https://playgully.vercel.app/';
  const text = `I scored ${state.score} in Gully Cricket! ${getFunnyGameOverLine(state)}`;
  const sharePayload = { title: 'Gully Cricket', text: `${text}\nBeat me: ${url}`, url };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (!navigator.canShare || navigator.canShare(sharePayload)) {
        await navigator.share(sharePayload);
        return;
      }
    } catch (err: unknown) {
      const errName = (err as Error)?.name;
      if (errName === 'AbortError' || errName === 'NotAllowedError') return;
    }
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\nBeat me: ${url}`);
      copiedToastUntil = Date.now() + 1500;
    }
  } catch { }
}

export function openWhatsApp(state: GameState): void {
  const url = 'https://playgully.vercel.app/';
  const text = `I scored ${state.score} in Gully Cricket! ${getFunnyGameOverLine(state)}\nBeat me: ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

export function handleGameOverClick(
  clientX: number, clientY: number, cam: CameraViewport, state: GameState, onRestart: () => void, onOpenSettings?: () => void
): boolean {
  if (state.state !== 'GAME_OVER') return false;
  const l = getGameOverLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: ButtonRect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  if (inR(l.gear)) { onOpenSettings?.(); return true; }
  if (inR(l.playAgain)) {
    setAssistHintShown();
    onRestart();
    return true;
  }
  if (inR(l.share)) { shareGame(state); return true; }
  if (inR(l.whatsapp)) { openWhatsApp(state); return true; }
  return false;
}

export function isGameOverButtonHover(clientX: number, clientY: number, cam: CameraViewport, isGameOver: boolean): boolean {
  if (!isGameOver) return false;
  const l = getGameOverLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: ButtonRect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  return inR(l.playAgain) || inR(l.share) || inR(l.gear) || inR(l.whatsapp);
}

export function drawThemedIconButton(
  ctx: CanvasRenderingContext2D, r: ButtonRect, icon: string, iconCol: string = '#451A03', fontSize: number = 24
): void {
  ctx.fillStyle = '#92400E';
  ctx.beginPath(); ctx.roundRect(r.x, r.y + 4, r.w, r.h - 4, 14); ctx.fill();

  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h - 4);
  grad.addColorStop(0, '#FEF08A'); grad.addColorStop(1, '#F59E0B');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h - 4, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.fillStyle = iconCol; ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, r.x + r.w / 2, r.y + (r.h - 4) / 2);
}

export function drawGameOverHUD(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  const l = getGameOverLayout(cam.cssWidth, cam.cssHeight), c = l.card, cx = c.x + c.w / 2;
  const bestScore = updateStoredBestScore(state.score);

  ctx.fillStyle = 'rgba(24, 20, 22, 0.95)';
  ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 16); ctx.fill();
  ctx.strokeStyle = '#C98F2B'; ctx.lineWidth = 2; ctx.stroke();

  // Small gear icon in Game Over
  ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⚙', l.gear.x + l.gear.w / 2, l.gear.y + l.gear.h / 2);

  ctx.fillStyle = '#EF4444'; ctx.font = '900 30px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('GAME OVER', cx, c.y + 40);

  ctx.fillStyle = '#FDE68A'; ctx.font = 'italic 500 13px system-ui, sans-serif';
  ctx.fillText(`"${getFunnyGameOverLine(state)}"`, cx, c.y + 64);

  const spW = c.w - 44, spH = 54, spX = c.x + 22, spY = c.y + 78;
  ctx.fillStyle = 'rgba(15, 12, 10, 0.75)';
  ctx.beginPath(); ctx.roundRect(spX, spY, spW, spH, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, spY + 8); ctx.lineTo(cx, spY + spH - 8); ctx.stroke();

  const midLeft = spX + spW / 4, midRight = spX + (spW * 3) / 4;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('RUNS SCORED', midLeft, spY + 16);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 22px monospace';
  ctx.fillText(String(state.score), midLeft, spY + 37);

  ctx.fillStyle = '#F59E0B'; ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(' BEST SCORE', midRight, spY + 16);
  ctx.fillStyle = '#FDE68A'; ctx.font = '900 22px monospace';
  ctx.fillText(String(bestScore), midRight, spY + 37);

  drawThemedIconButton(ctx, l.playAgain, '↻', '#451A03', 26);
  drawThemedIconButton(ctx, l.share, '➦', '#451A03', 24);
  drawThemedIconButton(ctx, l.whatsapp, '💬', '#14532D', 24);

  // Assist hint once after the first game over
  if (!isAssistHintShown()) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#38BDF8'; ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('Finding it hard? Turn on Assist in Settings.', cx, c.y + c.h + 24);
  }

  if (Date.now() < copiedToastUntil) {
    const tw = 210, th = 34, tx = cx - tw / 2, ty = c.y - 44;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 17); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('Copied to clipboard!', cx, ty + 17);
  }
}
