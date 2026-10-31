/**
 * characters3d-debug.ts - Debug controls and character tweaking for 3D characters.
 */
import { CONFIG } from './config.ts';
import type { CharacterController3D } from './character-controller.ts';

const DEBUG_CLIPS = ['idle', 'swing', 'pitch', 'run', 'slide', 'dive', 'defeated', 'clap', 'cheer'];

export class Characters3DDebugger {
  public selectedChar = 'batter';

  public handleKey(code: string, characters: Map<string, CharacterController3D>): boolean {
    if (code.startsWith('Digit')) {
      const num = parseInt(code.replace('Digit', ''), 10);
      if (num >= 1 && num <= DEBUG_CLIPS.length) {
        const clipName = DEBUG_CLIPS[num - 1];
        const char = characters.get(this.selectedChar);
        char?.playClip(clipName, { loop: true });
        console.log(`[3D DEBUG] Playing "${clipName}" on ${this.selectedChar.toUpperCase()}`);
        return true;
      }
    }
    return false;
  }

  public cycleCharacter(): void {
    const list = ['batter', 'bowler'];
    const idx = list.indexOf(this.selectedChar);
    this.selectedChar = list[(idx + 1) % list.length];
    console.log(`[3D DEBUG] Selected character: ${this.selectedChar.toUpperCase()}`);
  }

  public nudge(dx: number, dy: number, dYaw: number, characters: Map<string, CharacterController3D>): void {
    const char = characters.get(this.selectedChar);
    if (!char) return;
    const layout = (CONFIG.layout as unknown as Record<string, { x: number; y: number }>)[this.selectedChar];
    if (layout) {
      layout.x += dx;
      layout.y += dy;
      char.setPosition(layout.x, layout.y, (layout.y - 660) * 0.4);
    }
    if (dYaw !== 0) char.setYaw(char.yaw + dYaw);
    console.log(`[3D Config] ${this.selectedChar}: { x: ${layout?.x}, y: ${layout?.y}, yaw: ${char.yaw.toFixed(2)} }`);
  }
}

