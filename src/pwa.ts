/**
 * pwa.ts - Progressive Web App installation prompt handler and detection.
 */

let deferredInstallPrompt: any = null;

export function initPWA(): void {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    console.log('[PWA] App successfully installed');
  });
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  const isMatchMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (navigator as unknown as { standalone?: boolean }).standalone;
  return !!(isMatchMedia || isNavigatorStandalone);
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
