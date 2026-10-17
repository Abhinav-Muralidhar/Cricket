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

function initGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element #game-canvas not found');

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to obtain 2D canvas context');

  // Preload illustrated background image
  loadBackgroundImage();

  const state = createInitialState();
  let camera: CameraViewport;
  const poseEditor = new PoseEditor(state);

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    state.isPortrait = cssH > cssW;
    camera = computeCamera(cssW, cssH, dpr);
  }

  resize();
  window.addEventListener('resize', resize);

  // Input manager: clicks/taps, debug toggle, target cycling, and pose editor
  new InputManager(canvas, {
    onAction: () => handlePlayerSwing(state),
    onDebugToggle: () => {
      state.debugMode = !state.debugMode;
      if (state.debugMode) {
        console.log(`[DEBUG MODE ON] Selected target: ${state.selectedHitTarget.toUpperCase()}`);
        console.log('Press E for Pose Editor. Tab/T to cycle targets. Arrow keys to nudge.');
      }
    },
    onPreviewToggle: () => cycleBatterPreviewClip(state),
    onCycleTarget: () => {
      if (!state.debugMode) return;
      const targets: HitTargetKey[] = ['window', 'car', 'scooter'];
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
  });

  let lastTime = performance.now();

  function loop(currentTime: number): void {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (poseEditor.isOpen()) {
      poseEditor.update(dt);
      poseEditor.render(ctx!, camera);
    } else {
      updateGame(state, dt);
      renderGame(ctx!, state, camera);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
}

window.addEventListener('DOMContentLoaded', initGame);
