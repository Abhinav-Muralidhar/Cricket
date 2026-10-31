/**
 * share.ts - Game-over scorecard modal HUD, high-score tracking & social sharing.
 */
import type { GameState } from './types.ts';
import type { CameraViewport } from './render.ts';
import { isAssistHintShown, setAssistHintShown } from './settings.ts';

const BEST_SCORE_KEY = 'gully_cricket_best_score';
let copiedToastUntil = 0;
let goHoverX = -999, goHoverY = -999;

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

export function getWicketCause(state: GameState): string {
  const causes: Record<string, string> = {
    BOWLED: 'Clean Bowled', WINDOW: "Uncle's Window Broken", CAR_GLASS: 'Car Windshield Broken',
    AC_UNIT: 'AC Unit Hit', NEWSPAPER: 'Newspaper Disruption', SCOOTER: 'Scooter Alarm Penalty',
  };
  const o = state.lastResult?.outcome;
  return (o && causes[o]) || (o === 'MISS' ? 'Caught Behind' : 'Wicket Lost');
}

export interface ButtonRect { x: number; y: number; w: number; h: number; }

export function getGameOverLayout(camWidth: number, camHeight: number): {
  card: ButtonRect; home: ButtonRect; playAgain: ButtonRect; share: ButtonRect;
} {
  const cx = camWidth / 2, cy = camHeight / 2, cardW = Math.min(420, camWidth - 28), cardH = 246;
  const cardX = cx - cardW / 2, cardY = Math.max(16, cy - cardH / 2 - 28);
  const btnSize = 52, gap = 18, totalW = btnSize * 3 + gap * 2, startX = cx - totalW / 2, btnY = cardY + cardH + 14;
  return {
    card: { x: cardX, y: cardY, w: cardW, h: cardH },
    home: { x: startX, y: btnY, w: btnSize, h: btnSize },
    playAgain: { x: startX + btnSize + gap, y: btnY, w: btnSize, h: btnSize },
    share: { x: startX + (btnSize + gap) * 2, y: btnY, w: btnSize, h: btnSize },
  };
}

export async function shareGame(state: GameState): Promise<void> {
  const url = 'https://playgully.vercel.app/';
  const pName = (state.batterProfile?.name || 'PLAYER').toUpperCase();
  const jNum = state.batterProfile?.jerseyNumber ?? 1;
  const prefix = `[#${jNum} ${pName}] `;
  const text = `${prefix}I scored ${state.score} in Gully Cricket! ${getFunnyGameOverLine(state)}`;
  const fullText = `${text}\nBeat me: ${url}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const payload = { title: 'Gully Cricket: Neighborhood Chaos', text: fullText, url };
      if (!navigator.canShare || navigator.canShare(payload)) {
        await navigator.share(payload);
        return;
      }
    } catch (err: unknown) {
      const errName = (err as Error)?.name;
      if (errName === 'AbortError' || errName === 'NotAllowedError') return;
    }
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullText);
    } else {
      const ta = document.createElement('textarea');
      ta.value = fullText; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    copiedToastUntil = Date.now() + 1800;
  } catch { }
}

export function handleGameOverClick(
  clientX: number, clientY: number, cam: CameraViewport, state: GameState,
  onRestart: () => void, _onOpenSettings?: () => void, onHome?: () => void
): boolean {
  if (state.state !== 'GAME_OVER') return false;
  const l = getGameOverLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: ButtonRect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;

  if (inR(l.home)) { onHome?.(); return true; }
  if (inR(l.playAgain)) { setAssistHintShown(); onRestart(); return true; }
  if (inR(l.share)) { shareGame(state); return true; }
  return false;
}

export function isGameOverButtonHover(clientX: number, clientY: number, cam: CameraViewport, isGameOver: boolean): boolean {
  if (!isGameOver) return false;
  goHoverX = clientX; goHoverY = clientY;
  const l = getGameOverLayout(cam.cssWidth, cam.cssHeight);
  const inR = (r: ButtonRect) => clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  return inR(l.home) || inR(l.playAgain) || inR(l.share);
}

export function drawThemedIconButton(
  ctx: CanvasRenderingContext2D, r: ButtonRect, icon: string, iconCol: string = '#2B1102', fontSize: number = 22
): void {
  ctx.fillStyle = '#85370A';
  ctx.beginPath(); ctx.roundRect(r.x, r.y + 3, r.w, r.h - 3, 14); ctx.fill();

  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h - 3);
  grad.addColorStop(0, '#FEF08A'); grad.addColorStop(1, '#F59E0B');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h - 3, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'; ctx.lineWidth = 1.4; ctx.stroke();

  const cx = r.x + r.w / 2, cy = r.y + (r.h - 3) / 2;

  if (icon === 'HOME') {
    ctx.save(); ctx.translate(cx, cy);
    ctx.strokeStyle = '#2B1102'; ctx.fillStyle = '#2B1102';
    ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(0, -9); ctx.lineTo(11, 2); ctx.stroke();
    ctx.beginPath(); ctx.rect(-8, 2, 16, 9.5); ctx.stroke();
    ctx.fillRect(-2.5, 5.5, 5, 6);
    ctx.restore();
  } else {
    ctx.fillStyle = iconCol; ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, cx, cy);
  }
}

export function drawGameOverHUD(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  const l = getGameOverLayout(cam.cssWidth, cam.cssHeight), c = l.card, cx = c.x + c.w / 2;
  const bestScore = updateStoredBestScore(state.score);
  const p = state.batterProfile;
  const pName = (p?.name || 'PLAYER').toUpperCase();
  const sr = state.ballCount > 0 ? ((state.score / state.ballCount) * 100).toFixed(1) : '0.0';
  const dismissal = getWicketCause(state).toUpperCase();

  // Dimmed backdrop overlay
  ctx.fillStyle = 'rgba(10, 8, 14, 0.78)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

  // Card Background (Modal Popup Card)
  ctx.fillStyle = '#14111A';
  ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 14); ctx.fill();
  ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2; ctx.stroke();

  // Top header strip
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#F59E0B'; ctx.font = '900 11px system-ui, sans-serif';
  ctx.fillText('MATCH SUMMARY', cx, c.y + 14);

  // Player Name & Jersey Badge
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 16px system-ui, sans-serif';
  ctx.fillText(` ${pName}`, cx, c.y + 32);

  // Runs [Balls]
  ctx.fillStyle = '#FBBF24'; ctx.font = '900 36px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(`${state.score}[${state.ballCount}]`, cx, c.y + 54);
  ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.fillText('RUNS [BALLS]', cx, c.y + 98);

  // Stats Grid (4 boxes: Strike Rate, Fours, Sixes, Best Score)
  const gap = 8, spW = (c.w - 40 - gap * 3) / 4, spH = 48, spY = c.y + 116;
  const boxes = [
    { label: 'STRIKE RATE', val: sr, col: '#38BDF8' },
    { label: 'FOURS', val: String(state.fours), col: '#4ADE80' },
    { label: 'SIXES', val: String(state.sixes), col: '#C084FC' },
    { label: 'BEST', val: String(bestScore), col: '#FDE68A' },
  ];

  boxes.forEach((b, i) => {
    const bx = c.x + 20 + i * (spW + gap);
    ctx.fillStyle = '#1C1725'; ctx.beginPath(); ctx.roundRect(bx, spY, spW, spH, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 8.5px system-ui, sans-serif';
    ctx.fillText(b.label, bx + spW / 2, spY + 7);
    ctx.fillStyle = b.col; ctx.font = '900 14px ui-monospace, monospace';
    ctx.fillText(b.val, bx + spW / 2, spY + 24);
  });

  // Wicket Cause Strip
  const disY = c.y + 174, disW = c.w - 40, disH = 28;
  ctx.fillStyle = 'rgba(220, 38, 38, 0.16)'; ctx.beginPath(); ctx.roundRect(c.x + 20, disY, disW, disH, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#FCA5A5'; ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(`DISMISSAL: ${dismissal}`, cx, disY + 7);

  // Funny street incident line
  ctx.fillStyle = '#E2E8F0'; ctx.font = 'italic 500 11px system-ui, sans-serif';
  ctx.fillText(`"${getFunnyGameOverLine(state)}"`, cx, c.y + 214);

  // Action Buttons (Home with bold lines, Play Again, Share)
  drawThemedIconButton(ctx, l.home, 'HOME', '#2B1102', 22);
  drawThemedIconButton(ctx, l.playAgain, '↻', '#2B1102', 24);
  drawThemedIconButton(ctx, l.share, '➦', '#2B1102', 20);

  // Tooltips on hover (like home screen)
  const tips = [{ r: l.home, text: 'HOME' }, { r: l.playAgain, text: 'PLAY AGAIN' }, { r: l.share, text: 'SHARE' }];
  const hovered = tips.find((it) => goHoverX >= it.r.x && goHoverX <= it.r.x + it.r.w && goHoverY >= it.r.y && goHoverY <= it.r.y + it.r.h);
  if (hovered) {
    const tx = hovered.r.x + hovered.r.w / 2, ty = hovered.r.y + hovered.r.h + 16;
    ctx.font = 'bold 11px system-ui, sans-serif';
    const tw = ctx.measureText(hovered.text).width + 16;
    ctx.fillStyle = 'rgba(26, 22, 30, 0.94)'; ctx.beginPath(); ctx.roundRect(tx - tw / 2, ty - 10, tw, 20, 6); ctx.fill();
    ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#FDE68A'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(hovered.text, tx, ty);
  }

  // First-time assist hint
  if (!isAssistHintShown()) {
    ctx.fillStyle = '#38BDF8'; ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('Finding it hard? Turn on Assist in Settings.', cx, l.home.y + l.home.h + 26);
  }

  // Toast
  if (Date.now() < copiedToastUntil) {
    const tw = 210, th = 32, tx = cx - tw / 2, ty = c.y - 40;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.95)'; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 16); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('Copied to clipboard!', cx, ty + 9);
  }
}
