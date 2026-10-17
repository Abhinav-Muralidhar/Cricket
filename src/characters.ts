/**
 * characters.ts - Composite character rendering with soft two-tone shading,
 * sunward rim light, 2px colored outlines, and golden-hour multiply tone.
 */

import {
  drawCapsule,
  drawFootwear,
  drawCricketBat,
  drawFace,
  drawHeadDecorations,
  drawGroundShadow,
  SHADED,
  type ShadedColor,
} from './character-parts.ts';
import type { CharacterRig } from './types.ts';

function getRigColors(rig: CharacterRig): { shirt: ShadedColor; pants: ShadedColor } {
  if (rig.variant === 'batter') return { shirt: SHADED.cream, pants: SHADED.bluePants };
  if (rig.variant === 'bowler') return { shirt: SHADED.bowlerShirt, pants: SHADED.bowlerPants };
  if (rig.variant === 'schoolKid') return { shirt: SHADED.schoolShirt, pants: SHADED.schoolPants };
  if (rig.variant === 'uncle') return { shirt: SHADED.uncleVest, pants: SHADED.uncleLungi };
  if (rig.shirtColor === '#F97316') return { shirt: SHADED.gullyShirtOrange, pants: SHADED.bowlerPants };
  return { shirt: SHADED.gullyShirt, pants: SHADED.bowlerPants };
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  rig: CharacterRig,
  squashX = 1,
  squashY = 1
): void {
  const parts = rig.parts;
  const torso = parts.torso || { angle: 0 };
  const head = parts.head || { angle: 0 };
  const arms = parts.arms || { angle: 0 };
  const frontLeg = parts.frontLeg || { angle: 0 };
  const backLeg = parts.backLeg || { angle: 0 };
  const bat = parts.bat;
  const bowlingArm = parts.bowlingArm;

  const isLeft = rig.facing === 'left';
  const flipSun = isLeft;
  const colors = getRigColors(rig);

  // 1. Stretched soft ground shadow cast away from the sun (rightwards)
  drawGroundShadow(ctx, rig.x, rig.y, rig.scale, squashY);

  ctx.save();
  ctx.translate(rig.x, rig.y);
  ctx.scale((isLeft ? -1 : 1) * rig.scale * squashX, rig.scale * squashY);
  if (rig.bodyLean) {
    ctx.rotate(rig.bodyLean);
  }

  // 2. Back leg & footwear
  drawCapsule(ctx, -5, -62, 58, 8, 5, backLeg.angle, rig.variant === 'uncle' ? SHADED.skin : colors.pants, flipSun);
  drawFootwear(ctx, -5 + Math.sin(backLeg.angle) * 58, -62 + Math.cos(backLeg.angle) * 58, rig.variant);

  // 3. Front leg & footwear (with optional white batting pad)
  drawCapsule(ctx, 7, -62, 58, 8, 5, frontLeg.angle, rig.variant === 'uncle' ? SHADED.skin : colors.pants, flipSun);
  const flX = 7 + Math.sin(frontLeg.angle) * 58;
  const flY = -62 + Math.cos(frontLeg.angle) * 58;
  drawFootwear(ctx, flX, flY, rig.variant);
  if (rig.variant === 'batter') {
    drawCapsule(ctx, 7 + Math.sin(frontLeg.angle) * 16, -62 + Math.cos(frontLeg.angle) * 16, 42, 9, 8, frontLeg.angle, SHADED.cream, flipSun);
  }

  // 4. Shorts or Lungi
  if (rig.variant === 'uncle') {
    const lungi = SHADED.uncleLungi;
    ctx.fillStyle = lungi.fill;
    ctx.beginPath();
    ctx.moveTo(-16, -66); ctx.lineTo(16, -66); ctx.lineTo(18, -20); ctx.lineTo(-18, -20);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = lungi.stroke; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = SHADED.redStripe.fill; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-17, -24); ctx.lineTo(17, -24); ctx.stroke();
  } else {
    ctx.fillStyle = colors.pants.fill;
    ctx.beginPath();
    ctx.roundRect(-15, -68, 30, 24, [4, 4, 3, 3]);
    ctx.fill();
    ctx.strokeStyle = colors.pants.stroke; ctx.lineWidth = 2; ctx.stroke();
  }

  // 5. Torso
  ctx.save();
  ctx.translate(0, -66);
  ctx.rotate(torso.angle);

  // Soft two-tone shading on shirt
  const tGrad = ctx.createLinearGradient(flipSun ? 19 : -19, 0, flipSun ? -19 : 19, 0);
  tGrad.addColorStop(0, colors.shirt.lit);
  tGrad.addColorStop(0.48, colors.shirt.fill);
  tGrad.addColorStop(0.52, colors.shirt.shade);
  tGrad.addColorStop(1, colors.shirt.shade);
  ctx.fillStyle = tGrad;
  ctx.beginPath();
  ctx.roundRect(-19, -52, 38, 52, 8);
  ctx.fill();

  // Sunward rim light on torso
  ctx.strokeStyle = 'rgba(255, 217, 160, 0.60)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const rimX = flipSun ? 18 : -18;
  ctx.moveTo(rimX, -48); ctx.lineTo(rimX, -4);
  ctx.stroke();

  ctx.strokeStyle = colors.shirt.stroke; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-19, -52, 38, 52, 8); ctx.stroke();

  // Torso details
  if (rig.variant === 'uncle') {
    ctx.fillStyle = SHADED.skin.fill;
    ctx.beginPath(); ctx.arc(0, -52, 12, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = colors.shirt.stroke; ctx.lineWidth = 2; ctx.stroke();
  } else if (rig.variant === 'schoolKid') {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.moveTo(-10, -52); ctx.lineTo(0, -42); ctx.lineTo(10, -52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = SHADED.redStripe.fill; ctx.fillRect(-3, -42, 6, 22);
  } else {
    ctx.strokeStyle = colors.shirt.stroke; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-8, -52); ctx.lineTo(0, -44); ctx.lineTo(8, -52); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; ctx.fillRect(-14, -34, 28, 5);
  }

  // 6. Neck
  ctx.fillStyle = SHADED.skin.fill;
  ctx.fillRect(-5, -60, 10, 10);
  ctx.strokeStyle = SHADED.skin.stroke; ctx.lineWidth = 2;
  ctx.strokeRect(-5, -60, 10, 10);

  // 7. Head
  ctx.save();
  ctx.translate(0, -64);
  ctx.rotate(head.angle);

  // Ears
  ctx.fillStyle = SHADED.skin.fill;
  ctx.strokeStyle = SHADED.skin.stroke; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-20, 0, 4.5, 0, Math.PI * 2); ctx.arc(20, 0, 4.5, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Two-tone head oval
  const hGrad = ctx.createLinearGradient(flipSun ? 21 : -21, 0, flipSun ? -21 : 21, 0);
  hGrad.addColorStop(0, SHADED.skin.lit);
  hGrad.addColorStop(0.5, SHADED.skin.fill);
  hGrad.addColorStop(1, SHADED.skin.shade);
  ctx.fillStyle = hGrad;
  ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI * 2); ctx.fill();

  // Sunward rim light on head
  ctx.strokeStyle = 'rgba(255, 217, 160, 0.60)'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 20, flipSun ? -Math.PI * 0.4 : Math.PI * 0.6, flipSun ? Math.PI * 0.4 : Math.PI * 1.4);
  ctx.stroke();

  ctx.strokeStyle = SHADED.skin.stroke; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI * 2); ctx.stroke();

  drawHeadDecorations(ctx, rig.variant);
  drawFace(ctx, rig.expression, rig.variant);
  ctx.restore(); // end head

  // 8. Bowling arm (with ball in hand down by hip when idle)
  if (bowlingArm) {
    drawCapsule(ctx, -12, -44, 46, 7.5, 5, bowlingArm.angle, colors.shirt, flipSun);
    const bHandX = -12 + Math.sin(bowlingArm.angle) * 46;
    const bHandY = -44 + Math.cos(bowlingArm.angle) * 46;
    // Draw red tape-ball held in bowler's hand down by hip
    if (rig.variant === 'bowler') {
      ctx.fillStyle = SHADED.redStripe.fill;
      ctx.beginPath(); ctx.arc(bHandX - 1, bHandY + 1, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = SHADED.redStripe.stroke; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // 9. Front arm & Cricket Bat
  drawCapsule(ctx, 10, -44, 44, 7.5, 5, arms.angle, colors.shirt, flipSun);
  const handX = 10 + Math.sin(arms.angle) * 44;
  const handY = -44 + Math.cos(arms.angle) * 44;
  ctx.fillStyle = SHADED.skin.fill;
  ctx.beginPath(); ctx.arc(handX, handY, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = SHADED.skin.stroke; ctx.lineWidth = 2; ctx.stroke();

  if (bat) drawCricketBat(ctx, handX, handY, bat.angle);

  ctx.restore(); // end torso
  ctx.restore(); // end character
}
