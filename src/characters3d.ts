/**
 * characters3d.ts - Three.js WebGL scene coordinator for 3D Mixamo characters,
 * Orthographic camera projection matching 2D world units, and game state animation driver.
 */

import * as THREE from 'three';
import { CONFIG } from './config.ts';
import { load3DAssets, instantiateCharacter } from './model-loader.ts';
import { CharacterController3D } from './character-controller.ts';
import { BallRetrievalManager } from './ball-retrieval.ts';
import { getStoredProfile, applyProfileTo3D, type BatterProfile, JERSEY_PRESETS } from './profile.ts';
import { Characters3DDebugger } from './characters3d-debug.ts';
import type { CameraViewport } from './render.ts';
import type { GameState } from './types.ts';

export class Characters3DManager {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public characters = new Map<string, CharacterController3D>();
  public isReady = false;
  public isDressingRoom = false;
  public isDraggingBatter = false;
  private prevStateKind = '';
  private prevBowlerPhase = '';
  private prevIsSwinging = false;
  private bowlerRunStartX = 0;
  private ballRetrieval = new BallRetrievalManager();
  private dbg = new Characters3DDebugger();
  private lastW = 0;
  private lastH = 0;
  private lastDpr = 0;

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
    this.camera = new THREE.OrthographicCamera(0, 1600, 800, 0, -2000, 2000);
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);

    const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.3);
    sunLight.position.set(-700, 400, 600);
    this.scene.add(sunLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    keyLight.position.set(0, 300, 400);
    this.scene.add(keyLight);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
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

    const profile = getStoredProfile();
    const jerseyCol = JERSEY_PRESETS[profile.jerseyIndex]?.color || cols.batter;
    const batterInst = instantiateCharacter(jerseyCol, { withBat: true, withCap: false, modelType: 'batter' });
    const batter = new CharacterController3D(batterInst, {
      yaw: c3d.batter.yaw, scale: c3d.batter.scale, isLeftHanded: c3d.batter.isLeftHanded, isBatter: true,
    });
    applyProfileTo3D(batter.group, profile);
    batter.setPosition(l.batter.x, l.batter.y, 0);
    batter.playStance();
    this.characters.set('batter', batter);
    this.scene.add(batter.group);

    const bowlerInst = instantiateCharacter(cols.bowler, { withBat: false, withCap: false, modelType: 'bowler' });
    const bowler = new CharacterController3D(bowlerInst, { yaw: c3d.bowler.yaw, scale: c3d.bowler.scale, isBatter: false });
    bowler.setPosition(l.bowler.x, l.bowler.y, 0);
    bowler.playIdle(true);
    this.bowlerRunStartX = l.bowler.x + 35;
    this.characters.set('bowler', bowler);
    this.scene.add(bowler.group);
  }

  public applyCustomization(profile: BatterProfile): void {
    const batter = this.characters.get('batter');
    if (batter) applyProfileTo3D(batter.group, profile);
  }

  public setDressingRoomMode(active: boolean, cam?: CameraViewport): void {
    this.isDressingRoom = active;
    const batter = this.characters.get('batter');
    const bowler = this.characters.get('bowler');
    if (!batter) return;

    if (bowler) bowler.group.visible = !active;
    ['fielder1', 'fielder2', 'fielder3'].forEach((k) => {
      const f = this.characters.get(k);
      if (f) f.group.visible = !active;
    });

    if (active) {
      batter.group.visible = true;
      this.updateDressingRoomBatter(cam);
      batter.setYaw(0);
      batter.playIdle(true);
    } else {
      batter.configScale = CONFIG.characters3D.batter.scale;
      batter.setYaw(CONFIG.characters3D.batter.yaw);
      batter.setPosition(CONFIG.layout.batter.x, CONFIG.layout.batter.y, 0);
      batter.playStance();
    }
  }

  public updateDressingRoomBatter(cam?: CameraViewport): void {
    const batter = this.characters.get('batter');
    if (!batter || !cam) return;
    const stage = typeof document !== 'undefined' ? document.querySelector('.dr-stage') : null;
    if (stage) {
      const rect = stage.getBoundingClientRect();
      const screenCenterX = rect.left + rect.width / 2;
      const isPort = rect.height < 210 || cam.cssHeight > cam.cssWidth;
      const screenFeetY = rect.bottom - (isPort ? 20 : 31);
      const worldX = cam.worldLeft + screenCenterX / cam.scale;
      const worldY = cam.worldTop + screenFeetY / cam.scale;
      batter.setPosition(worldX, worldY, 0);
    } else {
      batter.setPosition(cam.worldLeft + (cam.cssWidth / 2) / cam.scale, 690, 0);
    }
    batter.configScale = CONFIG.characters3D.batter.scale;
  }

  public rotateBatter(deltaYaw: number): void {
    const batter = this.characters.get('batter');
    if (!batter) return;
    batter.setYaw(batter.yaw + deltaYaw);
  }

  public triggerBatterShot(): void {
    const batter = this.characters.get('batter');
    if (!batter) return;
    batter.playSwing(CONFIG.swingStartOffset, CONFIG.swingTimeScale);
  }

  public update(dt: number, state: GameState): void {
    if (!this.isReady) return;

    if (this.isDressingRoom) {
      const batter = this.characters.get('batter');
      batter?.update(dt);
      const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!this.isDraggingBatter && !reduced) this.rotateBatter(dt * 0.4);
      return;
    }

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

    if (state.state === 'BOWLING') {
      if (this.prevStateKind !== 'BOWLING') { bowler?.playRun(); batter?.playStance(); }
      if (!state.isSwinging && batter && batter.currentActionName !== 'battingStance' && batter.currentActionName !== 'swing') batter.playStance();
      if (state.bowlerPhase === 'RUN_UP' && bowler) {
        const t = Math.min(1, state.bowlerTimer / 0.55);
        bowler.setPosition(this.bowlerRunStartX + (CONFIG.layout.bowler.x - this.bowlerRunStartX) * t, CONFIG.layout.bowler.y, 0);
      } else if (state.bowlerPhase === 'DELIVERY' && this.prevBowlerPhase !== 'DELIVERY') {
        bowler?.setPosition(CONFIG.layout.bowler.x, CONFIG.layout.bowler.y, 0);
        bowler?.playPitch(0.0, 1.9, () => { bowler?.playIdle(false); });
      }
    } else if (this.prevStateKind === 'BOWLING') {
      bowler?.setPosition(CONFIG.layout.bowler.x, CONFIG.layout.bowler.y, 0); bowler?.playIdle(false);
    }

    if (state.isSwinging && !this.prevIsSwinging) batter?.playSwing(CONFIG.swingStartOffset, CONFIG.swingTimeScale);

    if ((state.state === 'RESULT' || state.state === 'GAME_OVER') && state.lastResult && this.prevStateKind !== 'RESULT' && this.prevStateKind !== 'GAME_OVER') {
      const outcome = state.lastResult.outcome;
      if (state.milestonePopup?.active) {
        batter?.playCheer(); f1?.playClap(); f2?.playClap(); f3?.playClap();
      } else if (outcome === 'MISS' || outcome === 'BOWLED') {
        batter?.playDefeated(); bowler?.playCheer();
      } else if (outcome === 'SIX' || outcome === 'FOUR') {
        batter?.playCheer(); bowler?.playIdle(false); f1?.playClap(); f2?.playClap(); f3?.playClap();
      } else if (outcome === 'WINDOW' || outcome === 'CAR_GLASS' || outcome === 'SCOOTER' || outcome === 'AC_UNIT' || outcome === 'NEWSPAPER') {
        batter?.playDefeated(); bowler?.playIdle(false);
      } else {
        batter?.playStance(); bowler?.playIdle(false);
      }
      this.ballRetrieval.triggerRetrieval(state, this.characters);
    }

    this.prevStateKind = state.state;
    this.prevBowlerPhase = state.bowlerPhase;
    this.prevIsSwinging = state.isSwinging;
  }

  public render(cam: CameraViewport): void {
    if (!this.isReady) return;

    if (this.lastW !== cam.cssWidth || this.lastH !== cam.cssHeight || this.lastDpr !== cam.dpr) {
      this.lastW = cam.cssWidth; this.lastH = cam.cssHeight; this.lastDpr = cam.dpr;
      this.renderer.setPixelRatio(cam.dpr);
      this.renderer.setSize(cam.cssWidth, cam.cssHeight, false);
    }

    if (this.isDressingRoom) {
      this.updateDressingRoomBatter(cam);
    }

    this.camera.left = cam.worldLeft;
    this.camera.right = cam.worldLeft + cam.visibleWorldWidth;
    this.camera.top = CONFIG.world.height - cam.worldTop;
    this.camera.bottom = -cam.worldTop;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  }

  public get selectedDebugChar(): string { return this.dbg.selectedChar; }
  public handleDebugKey(code: string): boolean { return this.dbg.handleKey(code, this.characters); }
  public cycleDebugCharacter(): void { this.dbg.cycleCharacter(); }
  public nudgeDebugCharacter(dx: number, dy: number, dYaw: number): void { this.dbg.nudge(dx, dy, dYaw, this.characters); }
}
