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

      // Debug toggle touch region: top right corner (x: 560..710, y: 15..75)
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
        if (this.handlers.onCycleTarget) this.handlers.onCycleTarget();
      } else if (e.code.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
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
        if (this.handlers.onNudgeTarget) {
          this.handlers.onNudgeTarget(dx, dy, dw, dh);
        }
      }
    });
  }
}
