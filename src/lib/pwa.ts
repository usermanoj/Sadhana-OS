import { reportError } from './observability';

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
      reportError(error, 'pwa_service_worker_registration_failed', {
        severity: 'warning',
      });
    });
  });
}
