/**
 * pose-editor-dom.ts - DOM side panel construction, event binding, and UI rendering for pose authoring.
 */

import type { Clip, EasingType, Keyframe } from './animation.ts';
import type { CharacterRig, FaceExpression } from './types.ts';
import { radToDeg, degToRad, EDITOR_CHARACTERS, type EditorCharacterKey } from './pose-editor-types.ts';

export interface DOMCallbacks {
  onSelectCharacter: (charKey: EditorCharacterKey) => void;
  onToggleMirror: () => void;
  onPartAngleChange: (partName: string, rad: number) => void;
  onBodyLeanChange: (rad: number) => void;
  onSquashChange: (sx: number, sy: number) => void;
  onExpressionChange: (expr: FaceExpression) => void;
  onCopyPose: () => void;
  onPastePose: () => void;
  onScrubTimeline: (t: number) => void;
  onTogglePlay: () => void;
  onAddKeyframe: () => void;
  onDeleteKeyframe: (index: number) => void;
  onMoveKeyframe: (index: number, dir: -1 | 1) => void;
  onSelectKeyframe: (index: number) => void;
  onCaptureKeyframe: (index: number) => void;
  onKeyframeEasingChange: (index: number, easing: EasingType) => void;
  onClipDurationChange: (dur: number) => void;
  onClipLoopChange: (loop: boolean) => void;
  onCopyClip: () => void;
  onClose: () => void;
}

export class PoseEditorDOM {
  public panel: HTMLElement;
  private cbs: DOMCallbacks;

  constructor(callbacks: DOMCallbacks) {
    this.cbs = callbacks;
    this.panel = document.createElement('div');
    this.panel.id = 'pose-editor-panel';
    this.panel.className = 'hidden';
    document.body.appendChild(this.panel);
  }

  public show(): void { this.panel.classList.remove('hidden'); }
  public hide(): void { this.panel.classList.add('hidden'); }
  public isVisible(): boolean { return !this.panel.classList.contains('hidden'); }

  public showToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'ped-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  private addSlider(parent: HTMLElement, label: string, min: number, max: number, step: number, val: number, unit: string, onVal: (v: number) => void): void {
    const row = document.createElement('div');
    row.className = 'ped-row';
    row.innerHTML = `<span class="ped-label">${label}</span><input type="range" class="ped-slider" min="${min}" max="${max}" step="${step}" value="${val}" /><span class="ped-value">${val}${unit}</span>`;
    const input = row.querySelector('input') as HTMLInputElement;
    const disp = row.querySelector('.ped-value') as HTMLElement;
    input.addEventListener('input', () => {
      const v = Number(input.value);
      disp.textContent = `${unit === '°' ? v : v.toFixed(2)}${unit}`;
      onVal(v);
    });
    parent.appendChild(row);
  }

  public render(rig: CharacterRig, curChar: EditorCharacterKey, clip: Clip, scrub: number, isPlaying: boolean, sx: number, sy: number): void {
    this.panel.innerHTML = '';

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'ped-header';
    hdr.innerHTML = `<div><div class="ped-title">Pose Authoring</div><div style="font-size:11px;color:#94A3B8;">Tab cycles | Press E to close</div></div><button class="ped-close-btn">✕</button>`;
    hdr.querySelector('.ped-close-btn')?.addEventListener('click', () => this.cbs.onClose());
    this.panel.appendChild(hdr);

    // Character & Mirror
    const cSec = document.createElement('div');
    cSec.className = 'ped-section';
    cSec.innerHTML = `<div class="ped-section-title">Character & Orientation</div>`;
    const cRow = document.createElement('div');
    cRow.className = 'ped-row';
    const cSel = document.createElement('select');
    cSel.className = 'ped-select'; cSel.style.flex = '1';
    EDITOR_CHARACTERS.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.key; o.textContent = c.label;
      if (c.key === curChar) o.selected = true;
      cSel.appendChild(o);
    });
    cSel.addEventListener('change', () => this.cbs.onSelectCharacter(cSel.value as EditorCharacterKey));
    const mBtn = document.createElement('button');
    mBtn.className = 'ped-btn';
    mBtn.textContent = rig.facing === 'left' ? 'Facing ⬅' : 'Facing ➡';
    mBtn.addEventListener('click', () => this.cbs.onToggleMirror());
    cRow.appendChild(cSel); cRow.appendChild(mBtn);
    cSec.appendChild(cRow);
    this.panel.appendChild(cSec);

    // Part Angles
    const jSec = document.createElement('div');
    jSec.className = 'ped-section';
    jSec.innerHTML = `<div class="ped-section-title">Part Joint Angles (-180° to 180°)</div>`;
    for (const name of Object.keys(rig.parts)) {
      this.addSlider(jSec, name, -180, 180, 1, radToDeg(rig.parts[name].angle), '°', (deg) => this.cbs.onPartAngleChange(name, degToRad(deg)));
    }
    this.panel.appendChild(jSec);

    // Body Lean & Squash
    const bSec = document.createElement('div');
    bSec.className = 'ped-section';
    bSec.innerHTML = `<div class="ped-section-title">Body Lean & Squash</div>`;
    this.addSlider(bSec, 'body lean', -90, 90, 1, radToDeg(rig.bodyLean || 0), '°', (deg) => this.cbs.onBodyLeanChange(degToRad(deg)));
    this.addSlider(bSec, 'squash X', 0.5, 1.5, 0.02, sx, '', (v) => this.cbs.onSquashChange(v, sy));
    this.addSlider(bSec, 'squash Y', 0.5, 1.5, 0.02, sy, '', (v) => this.cbs.onSquashChange(sx, v));
    this.panel.appendChild(bSec);

    // Face Expressions
    const eSec = document.createElement('div');
    eSec.className = 'ped-section';
    eSec.innerHTML = `<div class="ped-section-title">Face Expression</div>`;
    const eGrp = document.createElement('div');
    eGrp.className = 'ped-btn-group';
    (['neutral', 'smile', 'shout', 'sad', 'wince'] as FaceExpression[]).forEach((ex) => {
      const b = document.createElement('button');
      b.className = `ped-btn ${rig.expression === ex ? 'active' : ''}`;
      b.textContent = ex;
      b.addEventListener('click', () => this.cbs.onExpressionChange(ex));
      eGrp.appendChild(b);
    });
    eSec.appendChild(eGrp);
    this.panel.appendChild(eSec);

    // Pose JSON Copy & Paste
    const pSec = document.createElement('div');
    pSec.className = 'ped-section';
    pSec.innerHTML = `<div class="ped-section-title">Pose Data (poses.ts)</div>`;
    const pGrp = document.createElement('div');
    pGrp.className = 'ped-btn-group';
    const cpBtn = document.createElement('button');
    cpBtn.className = 'ped-btn ped-btn-primary'; cpBtn.textContent = '📋 Copy pose as JSON';
    cpBtn.addEventListener('click', () => this.cbs.onCopyPose());
    const pstBtn = document.createElement('button');
    pstBtn.className = 'ped-btn'; pstBtn.textContent = '📥 Paste pose';
    pstBtn.addEventListener('click', () => this.cbs.onPastePose());
    pGrp.appendChild(cpBtn); pGrp.appendChild(pstBtn);
    pSec.appendChild(pGrp);
    this.panel.appendChild(pSec);

    // Keyframe Strip & Timeline
    this.renderKeyframes(clip, scrub, isPlaying);
  }

  private renderKeyframes(clip: Clip, scrub: number, isPlaying: boolean): void {
    const kSec = document.createElement('div');
    kSec.className = 'ped-section';
    kSec.innerHTML = `
      <div class="ped-section-title">Keyframe Strip & Timeline</div>
      <div class="ped-row">
        <button class="ped-btn ped-btn-primary play-btn">${isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;"><input type="checkbox" class="loop-cb" ${clip.loop ? 'checked' : ''} /> Loop</label>
        <span style="font-size:11px;color:#94A3B8;">Dur:</span>
        <input type="number" class="ped-input dur-in" style="width:50px;" min="0.1" max="10" step="0.1" value="${clip.duration}" />s
      </div>
      <div class="ped-row" style="margin-top:4px;">
        <span class="ped-label">Scrub</span>
        <input type="range" class="ped-slider timeline-scrubber" min="0" max="1" step="0.01" value="${scrub}" />
        <span class="ped-value" style="min-width:65px;">${scrub.toFixed(2)} (${(scrub * clip.duration).toFixed(2)}s)</span>
      </div>
      <div class="ped-btn-group" style="margin-top:4px;">
        <button class="ped-btn add-kf-btn" style="flex:1;">➕ Add Keyframe @ t</button>
        <button class="ped-btn copy-clip-btn" style="flex:1;">📋 Copy clip as JSON</button>
      </div>
      <div class="kf-list" style="display:flex;flex-direction:column;gap:5px;margin-top:8px;"></div>
    `;

    kSec.querySelector('.play-btn')?.addEventListener('click', () => this.cbs.onTogglePlay());
    kSec.querySelector('.loop-cb')?.addEventListener('change', (e) => this.cbs.onClipLoopChange((e.target as HTMLInputElement).checked));
    kSec.querySelector('.dur-in')?.addEventListener('change', (e) => this.cbs.onClipDurationChange(Number((e.target as HTMLInputElement).value)));
    kSec.querySelector('.timeline-scrubber')?.addEventListener('input', (e) => this.cbs.onScrubTimeline(Number((e.target as HTMLInputElement).value)));
    kSec.querySelector('.add-kf-btn')?.addEventListener('click', () => this.cbs.onAddKeyframe());
    kSec.querySelector('.copy-clip-btn')?.addEventListener('click', () => this.cbs.onCopyClip());

    const list = kSec.querySelector('.kf-list') as HTMLElement;
    clip.keyframes.forEach((kf: Keyframe, idx: number) => {
      const isSel = Math.abs(kf.t - scrub) < 0.02;
      const card = document.createElement('div');
      card.className = `ped-kf-card ${isSel ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="ped-row">
          <span style="font-weight:700;color:#F97316;">#${idx + 1}</span>
          <span style="font-family:monospace;font-size:11px;">t = ${kf.t.toFixed(2)}</span>
          <div style="display:flex;gap:3px;">
            <button class="ped-btn sel-btn" style="padding:2px 5px;" title="Go to frame">🎯</button>
            <button class="ped-btn cap-btn" style="padding:2px 5px;" title="Capture pose">💾</button>
            <button class="ped-btn up-btn" style="padding:2px 5px;" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="ped-btn dn-btn" style="padding:2px 5px;" ${idx === clip.keyframes.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="ped-btn del-btn" style="padding:2px 5px;color:#EF4444;" ${clip.keyframes.length <= 1 ? 'disabled' : ''}>✕</button>
          </div>
        </div>
        <div class="ped-row">
          <span style="font-size:11px;color:#94A3B8;">Easing:</span>
          <select class="ped-select easing-sel" style="flex:1;padding:2px 4px;">
            ${['linear', 'easeInOut', 'easeOutBack', 'easeIn', 'easeOut'].map((e) => `<option value="${e}" ${kf.easing === e ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
      `;
      card.querySelector('.sel-btn')?.addEventListener('click', () => this.cbs.onSelectKeyframe(idx));
      card.querySelector('.cap-btn')?.addEventListener('click', () => this.cbs.onCaptureKeyframe(idx));
      card.querySelector('.up-btn')?.addEventListener('click', () => this.cbs.onMoveKeyframe(idx, -1));
      card.querySelector('.dn-btn')?.addEventListener('click', () => this.cbs.onMoveKeyframe(idx, 1));
      card.querySelector('.del-btn')?.addEventListener('click', () => this.cbs.onDeleteKeyframe(idx));
      card.querySelector('.easing-sel')?.addEventListener('change', (e) => this.cbs.onKeyframeEasingChange(idx, (e.target as HTMLSelectElement).value as EasingType));
      list.appendChild(card);
    });

    this.panel.appendChild(kSec);
  }
}
