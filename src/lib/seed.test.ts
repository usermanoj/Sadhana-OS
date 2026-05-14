import { describe, expect, it, beforeEach } from 'vitest';
import type { Category, AuditLogEntry } from '../types';
import { APP_SCHEMA_VERSION, seedIfNeeded } from './seed';
import { getItem } from './storage';

describe('seed data', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds 9 categories with correct sub-components on first launch', () => {
    seedIfNeeded();

    const version = getItem<string | null>('version', null);
    expect(version).toBe(APP_SCHEMA_VERSION);

    const categories = getItem<Category[]>('categories', []);
    expect(categories).toHaveLength(9);
    expect(categories[0]!.name).toBe('8 Limbs of Yoga');
    expect(categories[0]!.subComponents).toHaveLength(8);
    expect(categories[0]!.subComponents[0]!.name).toBe('Yama');
  });

  it('creates an audit log entry on seed', () => {
    seedIfNeeded();

    const audit = getItem<AuditLogEntry[]>('audit', []);
    expect(audit).toHaveLength(1);
    expect(audit[0]!.actionType).toBe('data_imported');
    expect(audit[0]!.note).toBe('Initial seed data');
  });

  it('does not re-seed on subsequent launches', () => {
    seedIfNeeded();

    const categories1 = getItem<Category[]>('categories', []);

    // Change version slightly to simulate existing data
    localStorage.setItem('sadhana:version', '1.1');
    
    // Attempt to seed again
    seedIfNeeded();

    const audit2 = getItem<AuditLogEntry[]>('audit', []);
    expect(audit2).toHaveLength(1); // Still 1 entry
    
    // Verify categories didn't change
    const categories2 = getItem<Category[]>('categories', []);
    expect(categories2).toEqual(categories1);
  });
});
