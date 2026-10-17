/**
 * pose-editor.ts - Visual pose authoring controller, keyframe timeline engine,
 * and enlarged stage renderer for Gully Cricket.
 */

import type { Clip, Pose } from './animation.ts';
import { sampleClip, applyPoseToRig } from './animation.ts';
import { drawCharacter } from './characters.ts';
import type { CameraViewport } from './render.ts';
import type { CharacterRig, GameState } from './types.ts';
import { PoseEditorDOM } from './pose-editor-dom.ts';
import { EDITOR_CHARACTERS, type EditorCharacterKey, formatClipJson, formatPoseJson, parsePoseInput, round2 } from './pose-editor-types.ts';

export class PoseEditor {
  private state: GameState;
  private dom: PoseEditorDOM;
  private activeChar: EditorCharacterKey = 'batter';
  private squashX = 1.0;
  private squashY = 1.0;
  private scrubTime = 0.0;
  private isPlaying = false;
  private currentClip: Clip;

  constructor(state: GameState) {
    this.state = state;
    this.currentClip = this.createDefaultClip();
    this.dom = new PoseEditorDOM({
      onSelectCharacter: (k) => this.selectCharacter(k),
      onToggleMirror: () => this.toggleMirror(),
      onPartAngleChange: (p, r) => this.setPartAngle(p, r),
      onBodyLeanChange: (r) => { this.getActiveRig().bodyLean = r; },
      onSquashChange: (sx, sy) => { this.squashX = sx; this.squashY = sy; },
      onExpressionChange: (ex) => { this.getActiveRig().expression = ex; this.syncUI(); },
      onCopyPose: () => this.copyPose(),
      onPastePose: () => void this.pastePose(),
      onScrubTimeline: (t) => this.scrubTimeline(t),
      onTogglePlay: () => { this.isPlaying = !this.isPlaying; this.syncUI(); },
      onAddKeyframe: () => this.addKeyframe(),
      onDeleteKeyframe: (i) => this.deleteKeyframe(i),
      onMoveKeyframe: (i, d) => this.moveKeyframe(i, d),
      onSelectKeyframe: (i) => this.selectKeyframe(i),
      onCaptureKeyframe: (i) => this.captureKeyframe(i),
      onKeyframeEasingChange: (i, e) => { if (this.currentClip.keyframes[i]) this.currentClip.keyframes[i].easing = e; },
      onClipDurationChange: (d) => { this.currentClip.duration = Math.max(0.1, d); },
      onClipLoopChange: (l) => { this.currentClip.loop = l; },
      onCopyClip: () => this.copyClip(),
      onClose: () => this.close(),
    });
  }

  public isOpen(): boolean { return this.dom.isVisible(); }
  public toggle(): void { if (this.isOpen()) this.close(); else this.open(); }
  public open(): void {
    this.state.poseEditorActive = true;
    this.isPlaying = false;
    this.dom.show();
    this.syncUI();
    this.dom.showToast(`Pose Editor: ${this.activeChar.toUpperCase()}`);
  }
  public close(): void {
    this.state.poseEditorActive = false;
    this.isPlaying = false;
    this.dom.hide();
  }

  public getActiveRig(): CharacterRig {
    const s = this.state;
    const map: Record<EditorCharacterKey, CharacterRig> = {
      batter: s.batterRig, bowler: s.bowlerRig, fielder1: s.fielder1Rig,
      fielder2: s.fielder2Rig, fielder3: s.fielder3Rig,
    };
    return map[this.activeChar] || s.batterRig;
  }

  public cycleCharacter(): void {
    const keys = EDITOR_CHARACTERS.map((c) => c.key);
    this.selectCharacter(keys[(keys.indexOf(this.activeChar) + 1) % keys.length]);
  }

  public selectCharacter(key: EditorCharacterKey): void {
    this.activeChar = key;
    this.syncUI();
    this.dom.showToast(`Selected: ${key.toUpperCase()}`);
  }

  public toggleMirror(): void {
    const rig = this.getActiveRig();
    rig.facing = rig.facing === 'left' ? 'right' : 'left';
    this.syncUI();
  }

  public setPartAngle(partName: string, rad: number): void {
    const rig = this.getActiveRig();
    if (rig.parts[partName]) rig.parts[partName].angle = rad;
  }

  public copyPose(): void {
    const pose: Pose = {};
    for (const k of Object.keys(this.getActiveRig().parts)) pose[k] = this.getActiveRig().parts[k].angle;
    navigator.clipboard.writeText(formatPoseJson(pose)).then(
      () => this.dom.showToast('Pose copied to clipboard!'),
      () => this.dom.showToast('Clipboard write failed')
    );
  }

  public async pastePose(): Promise<void> {
    try {
      let text = navigator.clipboard?.readText ? await navigator.clipboard.readText() : '';
      if (!text) text = prompt('Paste Pose JSON:') || '';
      const parsed = parsePoseInput(text);
      if (!parsed) return this.dom.showToast('Invalid pose JSON');
      applyPoseToRig(this.getActiveRig(), parsed);
      this.syncUI();
      this.dom.showToast('Pose pasted!');
    } catch { this.dom.showToast('Clipboard read error'); }
  }

  public scrubTimeline(t: number): void {
    this.scrubTime = Math.max(0, Math.min(1, t));
    applyPoseToRig(this.getActiveRig(), sampleClip(this.currentClip, this.scrubTime));
    this.syncUI();
  }

  public stepKeyframe(dir: -1 | 1): void {
    const kfs = this.currentClip.keyframes;
    if (kfs.length === 0) return;
    let nextIdx = 0;
    if (dir > 0) {
      const m = kfs.findIndex((k) => k.t > this.scrubTime + 0.01);
      nextIdx = m >= 0 ? m : 0;
    } else {
      for (let i = kfs.length - 1; i >= 0; i--) {
        if (kfs[i].t < this.scrubTime - 0.01) { nextIdx = i; break; }
      }
    }
    this.selectKeyframe(nextIdx);
  }

  public selectKeyframe(idx: number): void {
    const kf = this.currentClip.keyframes[idx];
    if (!kf) return;
    this.scrubTime = kf.t;
    applyPoseToRig(this.getActiveRig(), kf.pose);
    this.syncUI();
  }

  public captureKeyframe(idx: number): void {
    const kf = this.currentClip.keyframes[idx];
    if (!kf) return;
    kf.pose = {};
    for (const k of Object.keys(this.getActiveRig().parts)) kf.pose[k] = round2(this.getActiveRig().parts[k].angle);
    this.syncUI();
    this.dom.showToast(`Captured to Keyframe #${idx + 1}`);
  }

  public addKeyframe(): void {
    const pose: Pose = {};
    for (const k of Object.keys(this.getActiveRig().parts)) pose[k] = round2(this.getActiveRig().parts[k].angle);
    this.currentClip.keyframes.push({ t: round2(this.scrubTime), pose, easing: 'easeInOut' });
    this.currentClip.keyframes.sort((a, b) => a.t - b.t);
    this.syncUI();
    this.dom.showToast(`Added keyframe @ t=${this.scrubTime.toFixed(2)}`);
  }

  public deleteKeyframe(idx: number): void {
    if (this.currentClip.keyframes.length <= 1) return;
    this.currentClip.keyframes.splice(idx, 1);
    this.syncUI();
  }

  public moveKeyframe(idx: number, dir: -1 | 1): void {
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= this.currentClip.keyframes.length) return;
    const temp = this.currentClip.keyframes[idx];
    this.currentClip.keyframes[idx] = this.currentClip.keyframes[tgt];
    this.currentClip.keyframes[tgt] = temp;
    this.syncUI();
  }

  public copyClip(): void {
    navigator.clipboard.writeText(formatClipJson(this.currentClip)).then(
      () => this.dom.showToast('Clip copied as JSON!'),
      () => this.dom.showToast('Clipboard error')
    );
  }

  public update(dt: number): void {
    if (!this.isPlaying) return;
    this.scrubTime += dt / Math.max(0.1, this.currentClip.duration);
    if (this.scrubTime >= 1.0) {
      if (this.currentClip.loop) this.scrubTime %= 1.0;
      else { this.scrubTime = 1.0; this.isPlaying = false; }
    }
    applyPoseToRig(this.getActiveRig(), sampleClip(this.currentClip, this.scrubTime));
  }

  public render(ctx: CanvasRenderingContext2D, cam: CameraViewport): void {
    ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    ctx.clearRect(0, 0, cam.cssWidth, cam.cssHeight);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, cam.cssHeight);
    bgGrad.addColorStop(0, '#1E232F'); bgGrad.addColorStop(1, '#0F1217');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

    const panelW = window.innerWidth >= 800 ? 390 : 0;
    const cx = (cam.cssWidth - panelW) / 2;
    const cy = cam.cssHeight * 0.74;

    const spot = ctx.createRadialGradient(cx, cy - 80, 20, cx, cy, 320);
    spot.addColorStop(0, 'rgba(255, 178, 107, 0.18)'); spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot; ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 260, cy); ctx.lineTo(cx + 260, cy); ctx.stroke();

    const rig = this.getActiveRig();
    const ox = rig.x, oy = rig.y, os = rig.scale;
    rig.x = cx; rig.y = cy; rig.scale = Math.min((cam.cssHeight * 0.44) / 180, 2.8);
    drawCharacter(ctx, rig, this.squashX, this.squashY);
    rig.x = ox; rig.y = oy; rig.scale = os;

    ctx.font = '700 13px system-ui, sans-serif'; ctx.fillStyle = '#F97316';
    ctx.fillText(`POSE EDITOR [DEBUG] — ${this.activeChar.toUpperCase()}`, 24, 32);
    ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#94A3B8';
    ctx.fillText('Tab: Cycle Character | Left/Right: Step Keyframes | E: Close', 24, 50);
  }

  private syncUI(): void {
    this.dom.render(this.getActiveRig(), this.activeChar, this.currentClip, this.scrubTime, this.isPlaying, this.squashX, this.squashY);
  }

  private createDefaultClip(): Clip {
    const pose: Pose = {};
    for (const k of Object.keys(this.getActiveRig().parts)) pose[k] = round2(this.getActiveRig().parts[k].angle);
    return {
      name: 'authorClip', duration: 1.0, loop: true,
      keyframes: [{ t: 0.0, pose: { ...pose }, easing: 'easeInOut' }, { t: 1.0, pose: { ...pose }, easing: 'easeInOut' }],
    };
  }
}
