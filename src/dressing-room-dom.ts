/**
 * dressing-room-dom.ts - Center-aligned popup dialog for batter customization.
 */

import {
  JERSEY_PRESETS,
  PANTS_PRESETS,
  SNEAKER_PRESETS,
  BAT_PRESETS,
  DEFAULT_PROFILE,
  type BatterProfile,
} from './profile.ts';
import {
  createIdentityCard,
  createKitsSection,
  createCategoryTabs,
  type CategoryKey,
} from './dressing-room-header.ts';

export interface DressingRoomDOMCallbacks {
  onProfileChange: (p: BatterProfile) => void;
  onSaveAndPlay: () => void;
  onCancel: () => void;
  onCategoryChange: (cat: CategoryKey) => void;
  onRotateDrag: (dx: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onBatterTap: () => void;
}

export class DressingRoomDOM {
  public overlay: HTMLElement;
  public stage: HTMLElement;
  public panel: HTMLElement;
  private plateNum!: HTMLElement;
  private plateName!: HTMLElement;
  private cbs: DressingRoomDOMCallbacks;
  private currentProfile: BatterProfile = { ...DEFAULT_PROFILE };
  private activeCategory: CategoryKey = 'jersey';
  private isDragging = false;
  private lastDragX = 0;
  private didDrag = false;

  constructor(callbacks: DressingRoomDOMCallbacks) {
    this.cbs = callbacks;
    this.overlay = document.createElement('div');
    this.overlay.id = 'dressing-room-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Player Customization');

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.cbs.onCancel();
    });

    const card = document.createElement('div');
    card.className = 'dr-popup-card';

    this.stage = document.createElement('div');
    this.stage.className = 'dr-stage';
    this.buildStageContent();

    this.panel = document.createElement('div');
    this.panel.className = 'dr-panel';

    card.appendChild(this.stage);
    card.appendChild(this.panel);
    this.overlay.appendChild(card);

    const container = document.getElementById('game-container') || document.body;
    container.appendChild(this.overlay);

    this.setupStageEvents();
  }

  private buildStageContent(): void {
    this.stage.innerHTML = `
      <div class="dr-floating-plate" aria-live="polite">
        <span class="dr-plate-num">#1</span><span class="dr-plate-divider">|</span><span class="dr-plate-name">PLAYER</span>
      </div>
      <div class="dr-stage-shadow" aria-hidden="true"></div>
      <div class="dr-hero-hint" aria-hidden="true">DRAG TO ROTATE • TAP TO SWING</div>`;
    this.plateNum = this.stage.querySelector('.dr-plate-num') as HTMLElement;
    this.plateName = this.stage.querySelector('.dr-plate-name') as HTMLElement;
  }

  private setupStageEvents(): void {
    this.stage.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isDragging = true;
      this.didDrag = false;
      this.lastDragX = e.clientX;
      this.stage.setPointerCapture(e.pointerId);
      this.cbs.onDragStart();
    });
    this.stage.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastDragX;
      if (Math.abs(dx) > 3) this.didDrag = true;
      this.lastDragX = e.clientX;
      this.cbs.onRotateDrag(dx);
    });
    const endDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.cbs.onDragEnd();
      if (!this.didDrag) this.cbs.onBatterTap();
    };
    this.stage.addEventListener('pointerup', endDrag);
    this.stage.addEventListener('pointercancel', endDrag);
  }

  public show(profile: BatterProfile): void {
    this.currentProfile = { ...profile };
    this.activeCategory = 'jersey';
    this.render();
    this.overlay.classList.add('open');
  }

  public hide(): void {
    this.overlay.classList.remove('open');
  }

  public render(): void {
    const p = this.currentProfile;
    this.panel.innerHTML = '';
    this.updatePlate(p.name, p.jerseyNumber);

    const stack = document.createElement('div');
    stack.className = 'dr-panel-stack';

    // 1. Identity Card
    stack.appendChild(createIdentityCard(
      p,
      () => {
        this.updatePlate(p.name, p.jerseyNumber);
        this.cbs.onProfileChange(this.currentProfile);
      },
      () => this.cbs.onCancel()
    ));

    // 2. Preset Kits
    stack.appendChild(createKitsSection(p, () => this.notify()));

    // 3. Category Tabs
    stack.appendChild(createCategoryTabs(this.activeCategory, (cat) => {
      this.activeCategory = cat;
      this.cbs.onCategoryChange(cat);
      this.render();
    }));

    // 4. Active Swatches
    stack.appendChild(this.createSwatchesSection());
    this.panel.appendChild(stack);

    // 5. Pinned Footer
    this.panel.appendChild(this.createFooter());
  }

  private createSwatchesSection(): HTMLElement {
    const { presets, activeIdx, label } = this.getCategoryData();
    const sec = document.createElement('div');
    sec.className = 'dr-swatches-section';

    const header = document.createElement('div');
    header.className = 'dr-swatch-header';
    header.innerHTML = `<span class="dr-swatch-cat">${label}:</span> <span class="dr-swatch-name">${presets[activeIdx]?.name || ''}</span>`;
    sec.appendChild(header);

    const wrap = document.createElement('div');
    wrap.className = 'dr-swatches-wrap';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', `${label} colors`);

    presets.forEach((preset, idx) => {
      const isSel = idx === activeIdx;
      const btn = document.createElement('button');
      btn.className = `dr-swatch-btn ${isSel ? 'selected' : ''}`;
      btn.style.backgroundColor = preset.color;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(isSel));
      btn.setAttribute('aria-label', `${preset.name} ${label}`);
      btn.onclick = () => {
        this.setCategoryIndex(idx);
        this.notify();
      };
      wrap.appendChild(btn);
    });

    sec.appendChild(wrap);
    return sec;
  }

  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'dr-footer';

    const btn = (cls: string, html: string, aria: string, fn: () => void) => {
      const b = document.createElement('button');
      b.className = cls;
      b.innerHTML = html;
      b.setAttribute('aria-label', aria);
      b.onclick = fn;
      return b;
    };

    const shufIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`;
    const resetIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
    const playIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;

    footer.appendChild(btn('dr-btn-shuffle', `${shufIcon}<span>SHUFFLE</span>`, 'Shuffle outfit', () => this.shuffle()));
    footer.appendChild(btn('dr-btn-reset', `${resetIcon}<span>RESET</span>`, 'Reset outfit', () => {
      Object.assign(this.currentProfile, DEFAULT_PROFILE);
      this.notify();
    }));
    footer.appendChild(btn('dr-btn-save', `${playIcon}<span>SAVE & PLAY</span>`, 'Save profile and play game', () => this.cbs.onSaveAndPlay()));

    return footer;
  }

  private getCategoryData(): { presets: { name: string; color: string }[]; activeIdx: number; label: string } {
    const p = this.currentProfile;
    if (this.activeCategory === 'jersey') return { presets: JERSEY_PRESETS, activeIdx: p.jerseyIndex, label: 'JERSEY' };
    if (this.activeCategory === 'pants') return { presets: PANTS_PRESETS, activeIdx: p.pantsIndex, label: 'PANTS' };
    if (this.activeCategory === 'shoes') return { presets: SNEAKER_PRESETS, activeIdx: p.sneakersIndex, label: 'SHOES' };
    return { presets: BAT_PRESETS, activeIdx: p.batIndex, label: 'BAT DECAL' };
  }

  private setCategoryIndex(idx: number): void {
    const p = this.currentProfile;
    if (this.activeCategory === 'jersey') p.jerseyIndex = idx;
    else if (this.activeCategory === 'pants') p.pantsIndex = idx;
    else if (this.activeCategory === 'shoes') p.sneakersIndex = idx;
    else if (this.activeCategory === 'bat') p.batIndex = idx;
  }

  private shuffle(): void {
    const p = this.currentProfile;
    p.jerseyIndex = Math.floor(Math.random() * JERSEY_PRESETS.length);
    p.pantsIndex = Math.floor(Math.random() * PANTS_PRESETS.length);
    p.sneakersIndex = Math.floor(Math.random() * SNEAKER_PRESETS.length);
    p.batIndex = Math.floor(Math.random() * BAT_PRESETS.length);
    this.notify();
  }

  private updatePlate(name: string, num: number): void {
    if (this.plateNum) this.plateNum.textContent = `#${num}`;
    if (this.plateName) this.plateName.textContent = name;
  }

  private notify(): void {
    this.render();
    this.cbs.onProfileChange(this.currentProfile);
  }

  public getProfile(): BatterProfile {
    return { ...this.currentProfile };
  }
}
