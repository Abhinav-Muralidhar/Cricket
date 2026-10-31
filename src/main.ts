/**
 * main.ts - Application entry point. Handles background image preloading,
 * camera scaling with window clamping, debug rect nudging, and main loop.
 */

import { CONFIG } from './config.ts';
import { createInitialState, updateGame, handlePlayerSwing, cycleBatterPreviewClip, resetGame, startNewDelivery, triggerGameOver } from './state.ts';
import { handleGameOverClick, isGameOverButtonHover } from './share.ts';
import { handleTitleClick, isTitleHover } from './title-hud.ts';
import { handleProfileClick } from './profile-modal.ts';
import { dismissMilestone, triggerTestMilestone } from './milestone.ts';
import { renderGame, computeCamera, type CameraViewport } from './render.ts';
import { loadBackgroundImage } from './background.ts';
import { InputManager } from './input.ts';
import { PoseEditor } from './pose-editor.ts';
import type { HitTargetKey } from './types.ts';
import { initAudio, toggleAudioMute } from './audio.ts';
import { handleSettingsPointer, handleGuidePointer, getSettingsLayout } from './settings.ts';

import { Characters3DManager } from './characters3d.ts';
import { inject } from '@vercel/analytics';
import { initPWA, promptPWAInstall, isIOS } from './pwa.ts';

function initGame(): void {
  inject();
  initPWA();
  const bgCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const threeCanvas = document.getElementById('three-canvas') as HTMLCanvasElement;
  const hudCanvas = document.getElementById('hud-canvas') as HTMLCanvasElement;
  if (!bgCanvas || !threeCanvas || !hudCanvas) throw new Error('Canvas elements missing in DOM');

  const bgCtx = bgCanvas.getContext('2d');
  const hudCtx = hudCanvas.getContext('2d');
  if (!bgCtx || !hudCtx) throw new Error('Unable to obtain 2D canvas context');

  loadBackgroundImage();
  const characters3D = new Characters3DManager(threeCanvas);

  const state = createInitialState();
  let camera: CameraViewport;
  const poseEditor = new PoseEditor(state);

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    [bgCanvas, threeCanvas, hudCanvas].forEach((c) => {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    });

    state.isPortrait = cssH > cssW;
    camera = computeCamera(cssW, cssH, dpr);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => {
    setTimeout(resize, 80);
    setTimeout(resize, 320);
  });
  document.addEventListener('fullscreenchange', resize);

  new InputManager(hudCanvas, {
    onAction: () => {
      if (state.settingsOpen || state.profileOpen || state.guideActive) return;
      if (CONFIG.use3DCharacters && !characters3D.isReady) return;
      initAudio();
      handlePlayerSwing(state);
    },
    onAudioToggle: () => {
      initAudio();
      toggleAudioMute();
    },
    onFullscreenToggle: () => {
      if (isIOS()) return;
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    },
    onSettingsToggle: () => {
      state.settingsOpen = !state.settingsOpen;
    },
    onSettingsPointer: (cx, cy) => handleSettingsPointer(cx, cy, camera, state),
    isSettingsHover: (cx, cy) => {
      if (!state.settingsOpen) return false;
      const l = getSettingsLayout(camera.cssWidth, camera.cssHeight);
      const inR = (r: { x: number; y: number; w: number; h: number }) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
      return inR(l.closeBtn) || inR(l.assistToggle) || inR(l.soundToggle);
    },
    onGuidePointer: (cx, cy) => handleGuidePointer(cx, cy, camera, state),
    isGuideHover: (cx, cy) => {
      if (!state.guideActive) return false;
      const midX = camera.cssWidth / 2, midY = camera.cssHeight / 2, btnW = 120, btnH = 38;
      const btnX = midX - btnW / 2, btnY = midY - 93 + 124;
      return cx >= btnX && cx <= btnX + btnW && cy >= btnY && cy <= btnY + btnH;
    },
    onDebugToggle: () => {
      const isAllowed = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isAllowed) return;
      state.debugMode = !state.debugMode;
      if (state.debugMode) {
        console.log(`[DEBUG MODE ON] Selected: ${characters3D.selectedDebugChar.toUpperCase()}`);
      }
    },
    onPreviewToggle: () => cycleBatterPreviewClip(state),
    onCycleTarget: () => {
      if (!state.debugMode) return;
      const targets: HitTargetKey[] = ['window', 'acUnit', 'newspaper', 'car', 'scooter'];
      const idx = targets.indexOf(state.selectedHitTarget);
      state.selectedHitTarget = targets[(idx + 1) % targets.length];
    },
    onNudgeTarget: (dx, dy, dw, dh) => {
      if (!state.debugMode) return;
      const rect = CONFIG.layout[state.selectedHitTarget];
      rect.x += dx; rect.y += dy;
      rect.width = Math.max(10, rect.width + dw);
      rect.height = Math.max(10, rect.height + dh);
    },
    onTogglePoseEditor: () => {
      if (!state.debugMode && !poseEditor.isOpen()) return;
      poseEditor.toggle();
    },
    onCycleEditorCharacter: () => poseEditor.cycleCharacter(),
    onStepKeyframe: (dir) => poseEditor.stepKeyframe(dir),
    isPoseEditorActive: () => poseEditor.isOpen(),
    onDebugKey: (code: string) => (state.debugMode && CONFIG.use3DCharacters ? characters3D.handleDebugKey(code) : false),
    onCycle3DCharacter: () => characters3D.cycleDebugCharacter(),
    onNudge3DCharacter: (dx, dy, dYaw) => characters3D.nudgeDebugCharacter(dx, dy, dYaw),
    is3DMode: () => state.debugMode && CONFIG.use3DCharacters,
    isTitleOrGameOver: () => state.state === 'TITLE' || state.state === 'GAME_OVER' || (CONFIG.use3DCharacters && !characters3D.isReady),
    onAuthorClick: () => window.open('https://github.com/Abhinav-Muralidhar', '_blank', 'noopener,noreferrer'),
    onInstallClick: () => promptPWAInstall(),
    onGameOverPointer: (clientX: number, clientY: number) => {
      if (state.profileOpen) {
        return handleProfileClick(clientX, clientY, camera, state, (p) => {
          if (CONFIG.use3DCharacters) characters3D.applyCustomization(p);
        }, () => { state.profileOpen = false; });
      }
      if (state.state === 'TITLE') {
        return handleTitleClick(
          clientX, clientY, camera,
          () => resetGame(state),
          () => { state.settingsOpen = true; },
          () => { state.profileOpen = true; }
        );
      }
      return handleGameOverClick(clientX, clientY, camera, state, () => resetGame(state), () => { state.settingsOpen = true; });
    },
    isGameOverHover: (clientX: number, clientY: number) => {
      if (state.profileOpen) return true;
      if (state.state === 'TITLE') return isTitleHover(clientX, clientY, camera);
      return isGameOverButtonHover(clientX, clientY, camera, state.state === 'GAME_OVER');
    },
    onMilestonePointer: () => {
      if (state.milestonePopup?.active) {
        dismissMilestone(state);
        if (state.state === 'RESULT') {
          if (state.lives <= 0) triggerGameOver(state);
          else startNewDelivery(state);
        }
        return true;
      }
      return false;
    },
    onMilestoneDismiss: () => {
      if (state.milestonePopup?.active) {
        dismissMilestone(state);
        if (state.state === 'RESULT') {
          if (state.lives <= 0) triggerGameOver(state);
          else startNewDelivery(state);
        }
        return true;
      }
      return false;
    },
    isDebugActive: () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    onTestMilestone: () => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        triggerTestMilestone(state);
      }
    },
  });

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    (window as unknown as { testMilestone: () => void }).testMilestone = () => triggerTestMilestone(state);
  }

  let lastTime = performance.now();

  function loop(currentTime: number): void {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (poseEditor.isOpen()) {
      poseEditor.update(dt);
      poseEditor.render(hudCtx!, camera);
    } else {
      if (!CONFIG.use3DCharacters || characters3D.isReady) updateGame(state, dt);
      if (CONFIG.use3DCharacters) characters3D.update(dt, state);
      renderGame(bgCtx!, hudCtx!, state, camera, characters3D);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
}

window.addEventListener('DOMContentLoaded', initGame);
