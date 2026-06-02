import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canRegisterServiceWorker } from './pwa';

describe('PWA foundation', () => {
  it('only registers a service worker in production-capable browsers', () => {
    expect(canRegisterServiceWorker({ PROD: false }, {} as Navigator)).toBe(false);
    expect(canRegisterServiceWorker(
      { PROD: true },
      { serviceWorker: {} } as Navigator,
    )).toBe(true);
  });

  it('defines an installable web manifest', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8'),
    ) as { display: string; icons: Array<{ purpose: string }> };

    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('keeps Supabase API responses out of the service worker cache strategy', () => {
    const serviceWorker = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');

    expect(serviceWorker).toContain("requestUrl.hostname.includes('supabase.co')");
    expect(serviceWorker).not.toContain("cache.addAll(['https://");
  });
});
