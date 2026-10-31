/**
 * dressing-room-header.ts - Identity card, split-colored circle kits, and authentic sports category tabs.
 */

import { KIT_PRESETS, type BatterProfile } from './profile.ts';

export type CategoryKey = 'jersey' | 'pants' | 'shoes' | 'bat';

export function createIdentityCard(
  p: BatterProfile,
  onFieldChange: (field: 'name' | 'num', val: string | number) => void,
  onCancel: () => void
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'dr-id-card';

  // 1. Name Input Box
  const nameBox = document.createElement('div');
  nameBox.className = 'dr-id-field dr-name-field';

  const nameLbl = document.createElement('label');
  nameLbl.className = 'dr-field-label';
  nameLbl.textContent = 'BATTER NAME';
  nameBox.appendChild(nameLbl);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'dr-input dr-name-input';
  nameInput.value = p.name;
  nameInput.maxLength = 12;
  nameInput.spellcheck = false;
  nameInput.autocomplete = 'off';
  nameInput.setAttribute('aria-label', 'Batter name');

  nameInput.oninput = () => {
    const clean = nameInput.value.replace(/[^\w\s-]/gi, '').slice(0, 12);
    p.name = clean.toUpperCase();
    onFieldChange('name', p.name || 'PLAYER');
  };
  nameInput.onblur = () => {
    if (!nameInput.value.trim()) {
      p.name = 'PLAYER';
      nameInput.value = 'PLAYER';
      onFieldChange('name', 'PLAYER');
    }
  };
  nameBox.appendChild(nameInput);
  card.appendChild(nameBox);

  // 2. Jersey Number Box
  const numBox = document.createElement('div');
  numBox.className = 'dr-id-field dr-num-field';

  const numLbl = document.createElement('label');
  numLbl.className = 'dr-field-label';
  numLbl.textContent = 'NO.';
  numBox.appendChild(numLbl);

  const numWrap = document.createElement('div');
  numWrap.className = 'dr-num-wrap';
  numWrap.innerHTML = `<span class="dr-num-prefix">#</span>`;

  const numInput = document.createElement('input');
  numInput.type = 'text';
  numInput.inputMode = 'numeric';
  numInput.pattern = '[0-9]*';
  numInput.maxLength = 2;
  numInput.className = 'dr-input dr-num-input';
  numInput.value = String(p.jerseyNumber);
  numInput.setAttribute('aria-label', 'Jersey number');

  numInput.oninput = () => {
    const clean = numInput.value.replace(/\D/g, '').slice(0, 2);
    numInput.value = clean;
    const n = parseInt(clean, 10);
    if (!isNaN(n) && n >= 0 && n <= 99) {
      p.jerseyNumber = n;
      onFieldChange('num', n);
    }
  };
  numInput.onblur = () => {
    if (!numInput.value || parseInt(numInput.value, 10) === 0) {
      numInput.value = '1';
      p.jerseyNumber = 1;
      onFieldChange('num', 1);
    }
  };
  numWrap.appendChild(numInput);
  numBox.appendChild(numWrap);
  card.appendChild(numBox);

  // 3. Close Button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'dr-close-btn';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close and discard changes');
  closeBtn.onclick = onCancel;
  card.appendChild(closeBtn);

  return card;
}

export function createKitsSection(p: BatterProfile, onNotify: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'dr-kits-section';

  const lbl = document.createElement('div');
  lbl.className = 'dr-section-label';
  lbl.textContent = 'PRESET KITS';
  container.appendChild(lbl);

  const scrollRow = document.createElement('div');
  scrollRow.className = 'dr-kits-scroll';

  KIT_PRESETS.forEach((k) => {
    const isAct = p.jerseyIndex === k.jersey && p.pantsIndex === k.pants;
    const card = document.createElement('button');
    card.className = `dr-kit-card ${isAct ? 'active' : ''}`;
    card.setAttribute('aria-label', `Apply ${k.name} kit`);

    // Old multi-colored split circle chip
    const splitCircle = document.createElement('span');
    splitCircle.className = 'dr-kit-split-circle';
    splitCircle.style.background = `linear-gradient(135deg, ${k.split[0]} 50%, ${k.split[1]} 50%)`;
    card.appendChild(splitCircle);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'dr-kit-name';
    nameSpan.textContent = k.name;
    card.appendChild(nameSpan);

    card.onclick = () => {
      p.jerseyIndex = k.jersey;
      p.pantsIndex = k.pants;
      p.sneakersIndex = k.shoes;
      p.batIndex = k.bat;
      onNotify();
    };

    scrollRow.appendChild(card);
  });

  container.appendChild(scrollRow);
  return container;
}

export function createCategoryTabs(
  activeCat: CategoryKey,
  onSelect: (cat: CategoryKey) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'dr-category-tabs';
  container.setAttribute('role', 'tablist');

  const tabs: { key: CategoryKey; label: string; svg: string }[] = [
    {
      key: 'jersey',
      label: 'JERSEY',
      svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M8 2 C8 3.5 9.8 4.5 12 4.5 C14.2 4.5 16 3.5 16 2 L22 5.5 L19.5 10.5 L17 9 L17 21 C17 21.6 16.5 22 16 22 L8 22 C7.5 22 7 21.6 7 21 L7 9 L4.5 10.5 L2 5.5 Z"/></svg>',
    },
    {
      key: 'pants',
      label: 'PANTS',
      svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M5 2 L19 2 C19.6 2 20 2.4 20 3 L18.5 21 C18.5 21.6 18 22 17.4 22 L13.5 22 C13 22 12.6 21.6 12.5 21.1 L12 11 L11.5 21.1 C11.4 21.6 11 22 10.5 22 L6.6 22 C6 22 5.5 21.6 5.5 21 L4 3 C4 2.4 4.4 2 5 2 Z"/></svg>',
    },
    {
      key: 'shoes',
      label: 'SHOES',
      svg: '<svg width="20" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17 C2 18 3 19 4.5 19 L21.5 19 C22.8 19 23.5 18 23 17 L21.5 13.5 C20.5 11.5 18.5 11 16.5 11 L13 11 L11 7.5 C10.5 6.5 9.2 6 8 6.5 L4.5 8 C3.8 8.3 3.5 9 3.5 9.8 L3.5 13 C2.5 14 2 15.5 2 17 Z"/><path d="M4 20 L5.5 20 L5 22 L4.5 22 Z M8 20 L9.5 20 L9 22 L8.5 22 Z M15 20 L16.5 20 L16 22 L15.5 22 Z M19 20 L20.5 20 L20 22 L19.5 22 Z"/></svg>',
    },
    {
      key: 'bat',
      label: 'BAT',
      svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 1.5 C10.5 0.7 11.2 0 12 0 C12.8 0 13.5 0.7 13.5 1.5 L13.5 7 L10.5 7 Z"/><path d="M10.5 7 C9 7.8 7.5 9 7.5 11 L7.5 21 C7.5 22.5 9.5 23.5 12 23.5 C14.5 23.5 16.5 22.5 16.5 21 L16.5 11 C16.5 9 15 7.8 13.5 7 Z"/></svg>',
    },
  ];

  tabs.forEach((t) => {
    const isAct = activeCat === t.key;
    const tab = document.createElement('button');
    tab.className = `dr-cat-tab ${isAct ? 'active' : ''}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(isAct));
    tab.setAttribute('aria-label', `${t.label} category`);

    const iconWrap = document.createElement('span');
    iconWrap.className = 'dr-tab-svg';
    iconWrap.innerHTML = t.svg;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'dr-tab-text';
    labelSpan.textContent = t.label;

    tab.appendChild(iconWrap);
    tab.appendChild(labelSpan);
    tab.onclick = () => onSelect(t.key);

    container.appendChild(tab);
  });

  return container;
}
