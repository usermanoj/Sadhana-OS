import type { TabId } from '../types';

export type SettingsSectionId = 'categories' | 'audit' | 'data' | 'account' | 'privacy';

export const DEFAULT_TAB: TabId = 'today';
export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = 'categories';

const tabIds = new Set<TabId>(['today', 'dashboard', 'journal', 'history', 'settings']);
const settingsSectionIds = new Set<SettingsSectionId>([
  'categories',
  'audit',
  'data',
  'account',
  'privacy',
]);

export function getTabFromHash(hash: string): TabId {
  const [firstPart] = getHashParts(hash);
  return isTabId(firstPart) ? firstPart : DEFAULT_TAB;
}

export function getSettingsSectionFromHash(hash: string): SettingsSectionId {
  const [firstPart, secondPart] = getHashParts(hash);

  if (firstPart !== 'settings') {
    return DEFAULT_SETTINGS_SECTION;
  }

  return isSettingsSectionId(secondPart) ? secondPart : DEFAULT_SETTINGS_SECTION;
}

export function createHashRoute(tab: TabId, section: SettingsSectionId = DEFAULT_SETTINGS_SECTION): string {
  if (tab === 'settings') {
    return `#/settings/${section}`;
  }

  return `#/${tab}`;
}

export function setHashRoute(tab: TabId, section?: SettingsSectionId): void {
  if (typeof window === 'undefined') return;

  const nextHash = createHashRoute(tab, section);
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function getHashParts(hash: string): string[] {
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function isTabId(value: string | undefined): value is TabId {
  return Boolean(value && tabIds.has(value as TabId));
}

function isSettingsSectionId(value: string | undefined): value is SettingsSectionId {
  return Boolean(value && settingsSectionIds.has(value as SettingsSectionId));
}
