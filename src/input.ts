/**
 * input.ts - Handles user taps, mouse clicks, keyboard space, debug toggles,
 * and debug rect arrow nudging.
 */

export interface InputHandlers {
  onAction: () => void;
  onDebugToggle: () => void;
  onPreviewToggle: () => void;
  onCycleTarget?: () => void;
  onNudgeTarget?: (dx: number, dy: number, dw: number, dh: number) => void;
  onTogglePoseEditor?: () => void;
  onCycleEditorCharacter?: () => void;
  onStepKeyframe?: (dir: -1 | 1) => void;
  isPoseEditorActive?: () => boolean;
  onDebugKey?: (code: string) => boolean;
  onCycle3DCharacter?: () => void;
  onNudge3DCharacter?: (dx: number, dy: number, dYaw: number) => void;
  onAudioToggle?: () => void;
  is3DMode?: () => boolean;
}

export class InputManager {
  private handlers: InputHandlers;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, handlers: InputHandlers) {
    this.canvas = canvas;
    this.handlers = handlers;
    this.setupListeners();
  }

  private setupListeners(): void {
    // 1. Pointer input (Mouse click / Mobile touch)
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.handlers.isPoseEditorActive?.()) return;

      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const canvasX = (clientX / rect.width) * this.canvas.width;
      const canvasY = (clientY / rect.height) * this.canvas.height;

      // Audio mute/unmute touch region: top right corner (clientX >= rect.width - 65 && clientY <= 65)
      if (clientX >= rect.width - 65 && clientY <= 65) {
        this.handlers.onAudioToggle?.();
        return;
      }

      // Debug toggle touch region: top center right
      if (canvasX >= 560 && canvasX <= 710 && canvasY >= 15 && canvasY <= 75) {
        this.handlers.onDebugToggle();
        return;
      }

      this.handlers.onAction();
    });

    this.canvas.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });

    // 2. Keyboard input
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const inPoseEditor = !!this.handlers.isPoseEditorActive?.();

      if (e.code === 'KeyM') {
        e.preventDefault();
        this.handlers.onAudioToggle?.();
        return;
      }

      if (e.code === 'KeyE') {
        e.preventDefault();
        this.handlers.onTogglePoseEditor?.();
        return;
      }

      if (inPoseEditor) {
        if (e.code === 'Tab') {
          e.preventDefault();
          this.handlers.onCycleEditorCharacter?.();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.handlers.onStepKeyframe?.(-1);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          this.handlers.onStepKeyframe?.(1);
        }
        return;
      }

      // Check 1-9 debug clip keys
      if (this.handlers.onDebugKey?.(e.code)) {
        e.preventDefault();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        this.handlers.onAction();
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        this.handlers.onDebugToggle();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        this.handlers.onPreviewToggle();
      } else if (e.code === 'Tab' || e.code === 'KeyT') {
        e.preventDefault();
        if (this.handlers.is3DMode?.() && this.handlers.onCycle3DCharacter) {
          this.handlers.onCycle3DCharacter();
        } else if (this.handlers.onCycleTarget) {
          this.handlers.onCycleTarget();
        }
      } else if (e.code.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        if (this.handlers.is3DMode?.() && this.handlers.onNudge3DCharacter) {
          let dx = 0, dy = 0, dYaw = 0;
          if (e.altKey) {
            if (e.code === 'ArrowLeft') dYaw = -0.05 * step;
            else if (e.code === 'ArrowRight') dYaw = 0.05 * step;
          } else {
            if (e.code === 'ArrowLeft') dx = -2 * step;
            else if (e.code === 'ArrowRight') dx = 2 * step;
            else if (e.code === 'ArrowUp') dy = -2 * step;
            else if (e.code === 'ArrowDown') dy = 2 * step;
          }
          this.handlers.onNudge3DCharacter(dx, dy, dYaw);
        } else if (this.handlers.onNudgeTarget) {
          let dx = 0, dy = 0, dw = 0, dh = 0;
          if (e.altKey) {
            if (e.code === 'ArrowLeft') dw = -step;
            else if (e.code === 'ArrowRight') dw = step;
            else if (e.code === 'ArrowUp') dh = -step;
            else if (e.code === 'ArrowDown') dh = step;
          } else {
            if (e.code === 'ArrowLeft') dx = -step;
            else if (e.code === 'ArrowRight') dx = step;
            else if (e.code === 'ArrowUp') dy = -step;
            else if (e.code === 'ArrowDown') dy = step;
          }
          this.handlers.onNudgeTarget(dx, dy, dw, dh);
        }
      }
    });
  }
}
