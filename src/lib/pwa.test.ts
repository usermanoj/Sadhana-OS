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
    ) as {
      id: string;
      start_url: string;
      display: string;
      display_override: string[];
      theme_color: string;
      categories: string[];
      shortcuts: Array<{ name: string; url: string }>;
      icons: Array<{ purpose: string }>;
    };

    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/#/today');
    expect(manifest.display).toBe('standalone');
    expect(manifest.display_override).toContain('standalone');
    expect(manifest.theme_color).toBe('#FAF7F1');
    expect(manifest.categories).toContain('health');
    expect(manifest.shortcuts.map((shortcut) => shortcut.url)).toEqual([
      '/#/today',
      '/#/journal',
      '/#/dashboard',
    ]);
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('sets mobile install metadata in the document shell', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(html).toContain('viewport-fit=cover');
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('mobile-web-app-capable');
    expect(html).not.toContain('â€”');
  });

  it('keeps Supabase API responses out of the service worker cache strategy', () => {
    const serviceWorker = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');

    expect(serviceWorker).toContain("requestUrl.hostname.includes('supabase.co')");
    expect(serviceWorker).toContain("requestUrl.origin !== self.location.origin");
    expect(serviceWorker).toContain("requestUrl.pathname.startsWith('/auth/')");
    expect(serviceWorker).not.toContain("cache.addAll(['https://");
  });
});
