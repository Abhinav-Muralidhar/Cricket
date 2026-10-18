/**
 * characters3d.ts - Three.js WebGL scene coordinator for 3D Mixamo characters,
 * Orthographic camera projection matching 2D world units, and game state animation driver.
 */

import * as THREE from 'three';
import { CONFIG } from './config.ts';
import { load3DAssets, instantiateCharacter } from './model-loader.ts';
import { CharacterController3D } from './character-controller.ts';
import { BallRetrievalManager } from './ball-retrieval.ts';
import type { CameraViewport } from './render.ts';
import type { GameState } from './types.ts';

export class Characters3DManager {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public characters = new Map<string, CharacterController3D>();
  public isReady = false;
  public selectedDebugChar = 'batter';
  private prevStateKind = '';
  private prevBowlerPhase = '';
  private prevIsSwinging = false;
  private prevOutcome: string | null = null;
  private bowlerRunStartX = 0;
  private ballRetrieval = new BallRetrievalManager();
  private debugClipNames = ['idle', 'swing', 'pitch', 'run', 'slide', 'dive', 'defeated', 'clap', 'cheer'];

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();

    // Side-on OrthographicCamera looking along -Z
    this.camera = new THREE.OrthographicCamera(0, 1600, 800, 0, -2000, 2000);
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);

    // Warm directional sun light from the left (-0.7, 0.4, 0.6) + soft ambient light
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.3);
    sunLight.position.set(-700, 400, 600);
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    this.init();
  }

  private async init(): Promise<void> {
    try {
      await load3DAssets();
      this.spawnCharacters();
      this.isReady = true;
    } catch (err) {
      console.error('[3D] Failed to load 3D characters:', err);
    }
  }

  private spawnCharacters(): void {
    const l = CONFIG.layout;
    const c3d = CONFIG.characters3D;
    const cols = CONFIG.colors3D;

    // 1. Batter (hero, with bat)
    const batterInst = instantiateCharacter(cols.batter, { withBat: true, withCap: false, modelType: 'batter' });
    const batter = new CharacterController3D(batterInst, {
      yaw: c3d.batter.yaw, scale: c3d.batter.scale, isLeftHanded: c3d.batter.isLeftHanded,
    });
    batter.setPosition(l.batter.x, l.batter.y, 0);
    batter.playIdle(false);
    this.characters.set('batter', batter);
    this.scene.add(batter.group);

    // 2. Bowler (from pitch.fbx model in hoody)
    const bowlerInst = instantiateCharacter(cols.bowler, { withBat: false, withCap: false, modelType: 'bowler' });
    const bowler = new CharacterController3D(bowlerInst, { yaw: c3d.bowler.yaw, scale: c3d.bowler.scale });
    bowler.setPosition(l.bowler.x, l.bowler.y, 0);
    bowler.playIdle(true);
    this.bowlerRunStartX = l.bowler.x + 35;
    this.characters.set('bowler', bowler);
    this.scene.add(bowler.group);

    // 3. 3 Gully Fielders (all on asphalt, varied colors)
    const fieldersConfig: [string, number, number, string, number][] = [
      ['fielder1', l.fielder1.x, l.fielder1.y, cols.fielder1, c3d.fielder1.yaw],
      ['fielder2', l.fielder2.x, l.fielder2.y, cols.fielder2, c3d.fielder2.yaw],
      ['fielder3', l.fielder3.x, l.fielder3.y, cols.fielder3, c3d.fielder3.yaw],
    ];

    fieldersConfig.forEach(([key, x, y, col, yaw], idx) => {
      const inst = instantiateCharacter(col, { withBat: false, withCap: idx === 1, modelType: 'fielder' });
      const f = new CharacterController3D(inst, { yaw, scale: 0.85 });
      f.setPosition(x, y);
      f.playIdle(true);
      this.characters.set(key, f);
      this.scene.add(f.group);
    });
  }

  public update(dt: number, state: GameState): void {
    if (!this.isReady) return;

    this.characters.forEach((char) => char.update(dt));
    this.syncGameState(state);
    this.ballRetrieval.update(dt, state, this.characters);
  }

  private syncGameState(state: GameState): void {
    const batter = this.characters.get('batter');
    const bowler = this.characters.get('bowler');
    const f1 = this.characters.get('fielder1');
    const f2 = this.characters.get('fielder2');
    const f3 = this.characters.get('fielder3');

    // 1. Bowling run-up and delivery
    if (state.state === 'BOWLING') {
      if (this.prevStateKind !== 'BOWLING') {
        bowler?.playRun();
      }
      if (state.bowlerPhase === 'RUN_UP' && bowler) {
        const t = Math.min(1, state.bowlerTimer / 0.55);
        const curX = this.bowlerRunStartX + (CONFIG.layout.bowler.x - this.bowlerRunStartX) * t;
        bowler.setPosition(curX, CONFIG.layout.bowler.y, 0);
      } else if (state.bowlerPhase === 'DELIVERY' && this.prevBowlerPhase !== 'DELIVERY') {
        bowler?.setPosition(CONFIG.layout.bowler.x, CONFIG.layout.bowler.y, 0);
        bowler?.playPitch(1.4, 2.0);
      }
    } else if (this.prevStateKind === 'BOWLING') {
      bowler?.setPosition(CONFIG.layout.bowler.x, CONFIG.layout.bowler.y, 0);
      if (bowler?.currentActionName !== 'pitch') bowler?.playIdle(true);
    }

    // 2. Player Tap / Swing
    if (state.isSwinging && !this.prevIsSwinging) {
      batter?.playSwing(CONFIG.swingStartOffset, CONFIG.swingTimeScale);
    }

    // 3. Outcomes
    if (state.lastResult && state.lastResult.outcome !== this.prevOutcome) {
      const outcome = state.lastResult.outcome;
      if (outcome === 'MISS' || outcome === 'BOWLED') {
        batter?.playDefeated();
      } else if (outcome === 'SIX' || outcome === 'FOUR') {
        batter?.playCheer();
        f1?.playClap(); f2?.playClap(); f3?.playClap();
      } else if (outcome === 'WINDOW' || outcome === 'CAR_GLASS' || outcome === 'SCOOTER') {
        batter?.playDefeated();
      }
      this.ballRetrieval.triggerRetrieval(state, this.characters);
      this.prevOutcome = outcome;
    }

    if (state.state === 'BOWLING') this.prevOutcome = null;
    this.prevStateKind = state.state;
    this.prevBowlerPhase = state.bowlerPhase;
    this.prevIsSwinging = state.isSwinging;
  }

  public render(cam: CameraViewport): void {
    if (!this.isReady) return;

    const w = cam.cssWidth * cam.dpr;
    const h = cam.cssHeight * cam.dpr;
    if (this.renderer.domElement.width !== w || this.renderer.domElement.height !== h) {
      this.renderer.setSize(cam.cssWidth, cam.cssHeight, false);
      this.renderer.setPixelRatio(cam.dpr);
    }

    // Orthographic camera: left=worldLeft, right=worldLeft+visW, bottom=0, top=800
    this.camera.left = cam.worldLeft;
    this.camera.right = cam.worldLeft + cam.visibleWorldWidth;
    this.camera.top = CONFIG.world.height;
    this.camera.bottom = 0;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  }

  // Debug controls (Keys 1-9 to play clip, Arrow keys to nudge)
  public handleDebugKey(code: string): boolean {
    if (code.startsWith('Digit')) {
      const num = parseInt(code.replace('Digit', ''), 10);
      if (num >= 1 && num <= this.debugClipNames.length) {
        const clipName = this.debugClipNames[num - 1];
        const char = this.characters.get(this.selectedDebugChar);
        char?.playClip(clipName, { loop: true });
        console.log(`[3D DEBUG] Playing "${clipName}" on ${this.selectedDebugChar.toUpperCase()}`);
        return true;
      }
    }
    return false;
  }

  public cycleDebugCharacter(): void {
    const list = ['batter', 'bowler', 'fielder1', 'fielder2', 'fielder3'];
    const idx = list.indexOf(this.selectedDebugChar);
    this.selectedDebugChar = list[(idx + 1) % list.length];
    console.log(`[3D DEBUG] Selected character: ${this.selectedDebugChar.toUpperCase()}`);
  }

  public nudgeDebugCharacter(dx: number, dy: number, dYaw: number): void {
    const char = this.characters.get(this.selectedDebugChar);
    if (!char) return;
    const layout = (CONFIG.layout as unknown as Record<string, { x: number; y: number }>)[this.selectedDebugChar];
    if (layout) {
      layout.x += dx;
      layout.y += dy;
      char.setPosition(layout.x, layout.y, (layout.y - 660) * 0.4);
    }
    if (dYaw !== 0) {
      char.setYaw(char.yaw + dYaw);
    }
    console.log(`[3D Config] ${this.selectedDebugChar}: { x: ${layout?.x}, y: ${layout?.y}, yaw: ${char.yaw.toFixed(2)} }`);
  }
}
