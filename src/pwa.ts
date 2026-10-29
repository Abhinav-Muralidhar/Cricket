/**
 * pwa.ts - Progressive Web App installation prompt handler, iOS detection,
 * safe-area insets measurement, and iOS home-screen hint banner.
 */

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let deferredInstallPrompt: any = null;
const IOS_HINT_KEY = 'gully_ios_hint_dismissed';

export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOSPlatform = /iPhone|iPad|iPod/i.test(ua);
  const isIPadOS = (navigator.platform === 'MacIntel' || ua.includes('Macintosh')) && (navigator.maxTouchPoints || 0) > 1;
  return isIOSPlatform || isIPadOS;
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  const isMatchMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (navigator as unknown as { standalone?: boolean }).standalone;
  return !!(isMatchMedia || isNavigatorStandalone);
}

export function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof document === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  const probe = document.getElementById('safe-area-probe');
  if (!probe) return { top: 0, right: 0, bottom: 0, left: 0 };
  const style = window.getComputedStyle(probe);
  return {
    top: parseFloat(style.top) || 0,
    right: parseFloat(style.right) || 0,
    bottom: parseFloat(style.bottom) || 0,
    left: parseFloat(style.left) || 0,
  };
}

export function checkAndShowIOSHint(): void {
  if (!isIOS() || isStandalonePWA()) return;
  try {
    if (localStorage.getItem(IOS_HINT_KEY) === 'true') return;
  } catch {
    // Ignore localStorage read errors in private browsing
  }

  const hintEl = document.getElementById('ios-home-hint');
  if (!hintEl) return;
  hintEl.classList.remove('hidden');

  const dismiss = () => {
    hintEl.classList.add('hidden');
    try {
      localStorage.setItem(IOS_HINT_KEY, 'true');
    } catch {
      // Ignore localStorage write errors
    }
  };

  const closeBtn = document.getElementById('ios-hint-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });
  }
  hintEl.addEventListener('click', dismiss);
}

export function initPWA(): void {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    console.log('[PWA] App successfully installed');
  });

  checkAndShowIOSHint();
}

export function promptPWAInstall(): void {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(() => {
      deferredInstallPrompt = null;
    }).catch(() => {
      deferredInstallPrompt = null;
    });
  } else {
    alert('To install Gully Cricket on your home screen:\n\n• iPhone / iPad: Tap Share ➔ "Add to Home Screen"\n• Android: Tap browser menu (⋮) ➔ "Install app"\n• PC / Mac: Click the Install icon in your browser URL bar');
  }
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints || 0) > 0 ||
    window.matchMedia?.('(pointer: coarse)').matches === true
  );
}

