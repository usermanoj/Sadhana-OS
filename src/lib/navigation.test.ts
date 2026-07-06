import { describe, expect, it } from 'vitest';
import {
  createHashRoute,
  getSettingsSectionFromHash,
  getTabFromHash,
} from './navigation';

describe('navigation hash routes', () => {
  it('parses main app tabs from the hash route', () => {
    expect(getTabFromHash('#/today')).toBe('today');
    expect(getTabFromHash('#/dashboard')).toBe('dashboard');
    expect(getTabFromHash('#/journal')).toBe('journal');
    expect(getTabFromHash('#/history')).toBe('history');
    expect(getTabFromHash('#/settings/data')).toBe('settings');
  });

  it('falls back to Today for empty or unknown hashes', () => {
    expect(getTabFromHash('')).toBe('today');
    expect(getTabFromHash('#')).toBe('today');
    expect(getTabFromHash('#/unknown')).toBe('today');
  });

  it('parses settings subsections from settings hash routes', () => {
    expect(getSettingsSectionFromHash('#/settings/categories')).toBe('categories');
    expect(getSettingsSectionFromHash('#/settings/audit')).toBe('audit');
    expect(getSettingsSectionFromHash('#/settings/data')).toBe('data');
    expect(getSettingsSectionFromHash('#/settings/account')).toBe('account');
    expect(getSettingsSectionFromHash('#/settings/privacy')).toBe('privacy');
  });

  it('falls back to categories for non-settings or unknown subsection hashes', () => {
    expect(getSettingsSectionFromHash('#/today')).toBe('categories');
    expect(getSettingsSectionFromHash('#/settings')).toBe('categories');
    expect(getSettingsSectionFromHash('#/settings/unknown')).toBe('categories');
  });

  it('creates stable hash routes', () => {
    expect(createHashRoute('today')).toBe('#/today');
    expect(createHashRoute('settings')).toBe('#/settings/categories');
    expect(createHashRoute('settings', 'data')).toBe('#/settings/data');
  });
});
