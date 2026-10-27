/**
 * milestone.ts - Celebratory popup modal for milestone scores (50, 100, 150, 200, etc.).
 * Features batter poster cutout, glassmorphic card, confetti, audio fanfare, and balls faced.
 */

import { EASINGS } from './animation.ts';
import { playMilestoneFanfare } from './audio.ts';
import type { GameState, MilestonePopupState, ConfettiParticle } from './types.ts';
import type { CameraViewport } from './render.ts';

const CONFETTI_COLORS = ['#FDE047', '#38BDF8', '#4ADE80', '#F43F5E', '#A855F7', '#FB923C', '#FFFFFF'];
const batterPosterImg = typeof Image !== 'undefined' ? new Image() : null;
if (batterPosterImg) batterPosterImg.src = '/batter-poster.png';

function createConfettiBurst(count = 42): ConfettiParticle[] {
  const list: ConfettiParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2, speed = 120 + Math.random() * 260;
    list.push({
      x: 0, y: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2, vRot: (Math.random() - 0.5) * 8, alpha: 1.0,
    });
  }
  return list;
}

export function showMilestone(state: GameState, milestone: number, balls: number): void {
  let title = `${milestone} RUNS!`, tag = `${milestone} RUNS [${balls}] • MILESTONE`;
  let subtitle = 'Unreal batting mastery! Pure street fireworks! 💥✨';

  if (milestone === 50) {
    title = 'HALF CENTURY!';
    tag = `50 RUNS [${balls}] `;
    subtitle = 'Fifty off the bat!! 🏏🔥';
  } else if (milestone === 100) {
    title = 'CENTURY!';
    tag = `100 RUNS [${balls}] • TON UP`;
    subtitle = 'Ton in the gully! Windows shaken, legends born! 👑🏆';
  } else if (milestone === 150) {
    title = 'GULLY MAESTRO!';
    tag = `150 RUNS [${balls}] • ON FIRE`;
    subtitle = 'Bowlers are running for cover behind electric poles! ⚡💥';
  } else if (milestone === 200) {
    title = 'DOUBLE CENTURY!';
    tag = `200 RUNS [${balls}] • MASTERCLASS`;
    subtitle = 'Historic double ton! A street innings for the ages! 🌟👑';
  } else if (milestone === 250) {
    title = 'UNSTOPPABLE!';
    tag = `250 RUNS [${balls}] • TERRACE CROWD`;
    subtitle = 'The entire neighborhood is watching from rooftops! 🚀🔥';
  } else if (milestone === 300) {
    title = 'TRIPLE CENTURY!';
    tag = `300 RUNS [${balls}] • GULLY BRADMAN`;
    subtitle = 'Sachin Tendulkar in the gully! Absolutely legendary! 🐐🏆';
  } else if (milestone === 350) {
    title = 'UNBELIEVABLE!';
    tag = `350 RUNS [${balls}] • BALL DESTROYER`;
    subtitle = 'Tennis balls are disintegrating on impact! ⚡☄️';
  } else if (milestone === 400) {
    title = 'QUADRUPLE CENTURY!';
    tag = `400 RUNS [${balls}] • STREET MYTH`;
    subtitle = 'A mythical 400! Bowlers have surrendered completely! 👑🙌';
  } else if (milestone >= 450) {
    title = 'GOD OF CRICKET!';
    tag = `${milestone} RUNS [${balls}] • IMMORTAL`;
    subtitle = 'Unreachable gully greatness! Immortalized forever! 🌟👑';
  }

  state.milestonePopup = {
    runs: milestone, ballsFaced: balls, title, tag, subtitle,
    timer: 0, duration: 3.6, active: true, confetti: createConfettiBurst(44),
  };
  playMilestoneFanfare();
}

export function triggerMilestoneIfCrossed(state: GameState, prevScore: number): void {
  const prevStep = Math.floor(prevScore / 50), newStep = Math.floor(state.score / 50);
  if (newStep <= prevStep || newStep < 1) return;
  showMilestone(state, newStep * 50, state.ballCount);
}

export function triggerTestMilestone(state: GameState): void {
  const cur = state.milestonePopup?.active ? state.milestonePopup.runs : 0;
  const milestones = [50, 100, 150, 200, 250, 300, 350, 400, 500];
  const idx = milestones.indexOf(cur);
  const next = milestones[(idx + 1) % milestones.length];
  const balls = state.ballCount > 0 ? state.ballCount : (next === 50 ? 18 : Math.round(next * 0.44));
  showMilestone(state, next, balls);
}

export function updateMilestone(popup: MilestonePopupState, dt: number): void {
  if (!popup.active) return;
  popup.timer += dt;
  for (const p of popup.confetti) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt; p.vx *= 0.98;
    p.rot += p.vRot * dt; p.alpha = Math.max(0, 1 - popup.timer / popup.duration);
  }
  if (popup.timer >= popup.duration) { popup.active = false; popup.confetti = []; }
}

export function dismissMilestone(state: GameState): boolean {
  if (state.milestonePopup?.active) {
    state.milestonePopup.active = false;
    state.milestonePopup.confetti = [];
    return true;
  }
  return false;
}

export function isMilestoneButtonClick(clientX: number, clientY: number, cam: CameraViewport): boolean {
  const cx = cam.cssWidth / 2, cy = cam.cssHeight / 2;
  const cardW = Math.min(500, cam.cssWidth - 28), cardH = 250;
  return clientX >= cx - cardW / 2 && clientX <= cx + cardW / 2 && clientY >= cy - cardH / 2 && clientY <= cy + cardH / 2;
}

export function drawMilestonePopup(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  const popup = state.milestonePopup;
  if (!popup || !popup.active) return;

  const cx = cam.cssWidth / 2, cy = cam.cssHeight / 2;
  const scale = EASINGS.easeOutBack(Math.min(1, popup.timer / 0.28));
  const alpha = Math.min(1, popup.timer / 0.15) * Math.min(1, (popup.duration - popup.timer) / 0.35);

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);

  // 1. Dark overlay backdrop
  ctx.fillStyle = 'rgba(10, 12, 18, 0.75)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

  // 2. Confetti burst
  ctx.save();
  ctx.translate(cx, cy);
  for (const p of popup.confetti) {
    if (p.alpha <= 0.01) continue;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.globalAlpha = alpha * p.alpha; ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
    ctx.restore();
  }
  ctx.restore();

  // 3. Card modal
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const cardW = Math.min(500, cam.cssWidth - 28), cardH = 250;
  const cardX = -cardW / 2, cardY = -cardH / 2;

  // Golden glow backdrop
  const glow = ctx.createRadialGradient(0, 0, 40, 0, 0, cardW * 0.75);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.32)'); glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = glow; ctx.fillRect(-cardW, -cardH, cardW * 2, cardH * 2);

  // Glassmorphic panel
  ctx.fillStyle = 'rgba(18, 20, 28, 0.95)';
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 20); ctx.fill();
  ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 2.5; ctx.stroke();

  // 4. Batter Poster on left
  const bH = 232, bW = Math.round(bH * (175 / 345));
  const bX = cardX + 16, bY = cardY + cardH - bH - 6;

  const bGlow = ctx.createRadialGradient(bX + bW / 2, bY + bH * 0.6, 10, bX + bW / 2, bY + bH * 0.6, bW);
  bGlow.addColorStop(0, 'rgba(251, 191, 36, 0.28)'); bGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = bGlow; ctx.fillRect(bX - 10, bY, bW + 20, bH);

  if (batterPosterImg && batterPosterImg.complete && batterPosterImg.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(batterPosterImg, bX, bY, bW, bH);
  }

  // 5. Right side typography & layout
  const rightX = bX + bW + 16, rightW = cardX + cardW - 16 - rightX;
  const contentCX = rightX + rightW / 2;

  // Top unlock badge
  const badgeW = Math.min(180, rightW - 10), badgeH = 24, badgeY = cardY + 20;
  ctx.fillStyle = 'rgba(251, 191, 36, 0.20)';
  ctx.beginPath(); ctx.roundRect(contentCX - badgeW / 2, badgeY, badgeW, badgeH, 12); ctx.fill();
  ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 1; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FDE047'; ctx.font = 'bold 11px system-ui, Roboto, sans-serif';
  ctx.fillText('🏆 MILESTONE UNLOCKED', contentCX, badgeY + badgeH / 2);

  // Main Milestone Title (e.g. HALF CENTURY!)
  const titleSz = rightW < 220 ? 24 : 30;
  ctx.font = `italic 900 ${titleSz}px system-ui, Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(popup.title, contentCX, cardY + 76);

  // Runs & balls faced tag: e.g. 50 RUNS [18] • BAT RAISED
  ctx.font = '800 13px monospace'; ctx.fillStyle = '#38BDF8';
  ctx.fillText(popup.tag, contentCX, cardY + 108);

  // Flavor Subtitle
  const subSz = rightW < 220 ? 11 : 12;
  ctx.font = `500 ${subSz}px system-ui, Roboto, sans-serif`; ctx.fillStyle = '#CBD5E1';
  ctx.fillText(popup.subtitle, contentCX, cardY + 134);

  // Action Button: "CONTINUE INNINGS ▶"
  const btnW = Math.min(196, rightW - 16), btnH = 36, btnY = cardY + 172;
  ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.beginPath(); ctx.roundRect(contentCX - btnW / 2, btnY, btnW, btnH, 18); ctx.fill();
  ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#FEF08A'; ctx.font = 'bold 12px system-ui, Roboto, sans-serif';
  ctx.fillText('CONTINUE INNINGS ▶', contentCX, btnY + btnH / 2);

  // Auto-dismiss countdown bar
  const progress = Math.max(0, 1 - popup.timer / popup.duration);
  const barW = (cardW - 32) * progress;
  ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
  ctx.fillRect(-barW / 2, cardY + cardH - 5, barW, 2.5);

  ctx.restore();
  ctx.restore();
}
