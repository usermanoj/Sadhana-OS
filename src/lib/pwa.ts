interface PwaEnv {
  PROD?: boolean;
}

export function canRegisterServiceWorker(
  env: PwaEnv = import.meta.env,
  navigatorRef: Navigator = navigator,
): boolean {
  return Boolean(env.PROD && 'serviceWorker' in navigatorRef);
}

export function registerPwaServiceWorker(): void {
  if (!canRegisterServiceWorker()) {
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('PWA service worker registration failed:', error);
    });
  });
}
