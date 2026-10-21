/**
 * main.ts - Application entry point. Handles background image preloading,
 * camera scaling with window clamping, debug rect nudging, and main loop.
 */

import { CONFIG } from './config.ts';
import { createInitialState, updateGame, handlePlayerSwing, cycleBatterPreviewClip } from './state.ts';
import { renderGame, computeCamera, type CameraViewport } from './render.ts';
import { loadBackgroundImage } from './background.ts';
import { InputManager } from './input.ts';
import { PoseEditor } from './pose-editor.ts';
import type { HitTargetKey } from './types.ts';
import { initAudio, toggleAudioMute } from './audio.ts';

import { Characters3DManager } from './characters3d.ts';

function initGame(): void {
  const bgCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const threeCanvas = document.getElementById('three-canvas') as HTMLCanvasElement;
  const hudCanvas = document.getElementById('hud-canvas') as HTMLCanvasElement;
  if (!bgCanvas || !threeCanvas || !hudCanvas) throw new Error('Canvas elements missing in DOM');

  const bgCtx = bgCanvas.getContext('2d');
  const hudCtx = hudCanvas.getContext('2d');
  if (!bgCtx || !hudCtx) throw new Error('Unable to obtain 2D canvas context');

  // Preload illustrated background image and instantiate 3D characters
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

  // Input manager: pointer on top hudCanvas, debug toggles, 1-9 clips, 3D nudging
  new InputManager(hudCanvas, {
    onAction: () => {
      if (CONFIG.use3DCharacters && !characters3D.isReady) return;
      initAudio();
      handlePlayerSwing(state);
    },
    onAudioToggle: () => {
      initAudio();
      toggleAudioMute();
    },
    onDebugToggle: () => {
      const isAllowed = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('debug=true');
      if (!isAllowed) return;
      state.debugMode = !state.debugMode;
      if (state.debugMode) {
        console.log(`[DEBUG MODE ON] Selected: ${characters3D.selectedDebugChar.toUpperCase()}`);
        console.log('Press 1-9 to test 3D clips on batter. Tab to cycle characters. Arrow keys to nudge (Alt: yaw). E for 2D pose editor.');
      }
    },
    onPreviewToggle: () => cycleBatterPreviewClip(state),
    onCycleTarget: () => {
      if (!state.debugMode) return;
      const targets: HitTargetKey[] = ['window', 'acUnit', 'newspaper', 'car', 'scooter'];
      const idx = targets.indexOf(state.selectedHitTarget);
      state.selectedHitTarget = targets[(idx + 1) % targets.length];
      const r = CONFIG.layout[state.selectedHitTarget];
      console.log(`[DEBUG] Selected target: ${state.selectedHitTarget.toUpperCase()} -> { x: ${r.x}, y: ${r.y}, width: ${r.width}, height: ${r.height} }`);
    },
    onNudgeTarget: (dx: number, dy: number, dw: number, dh: number) => {
      if (!state.debugMode) return;
      const rect = CONFIG.layout[state.selectedHitTarget];
      rect.x += dx;
      rect.y += dy;
      rect.width = Math.max(10, rect.width + dw);
      rect.height = Math.max(10, rect.height + dh);
      console.log(`${state.selectedHitTarget}: { x: ${rect.x}, y: ${rect.y}, width: ${rect.width}, height: ${rect.height} }`);
    },
    onTogglePoseEditor: () => {
      if (!state.debugMode && !poseEditor.isOpen()) {
        console.log('[DEBUG] Press D to enable debug mode first, then E to open the pose editor.');
        return;
      }
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
    onAuthorClick: () => {
      window.open('https://github.com/Abhinav-Muralidhar', '_blank', 'noopener,noreferrer');
    },
  });

  let lastTime = performance.now();

  function loop(currentTime: number): void {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (poseEditor.isOpen()) {
      poseEditor.update(dt);
      poseEditor.render(hudCtx!, camera);
    } else {
      if (!CONFIG.use3DCharacters || characters3D.isReady) {
        updateGame(state, dt);
      }
      if (CONFIG.use3DCharacters) {
        characters3D.update(dt, state);
      }
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
