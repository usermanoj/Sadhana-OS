import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedIfNeeded } from '../lib/seed';
import { getItem, setItem } from '../lib/storage';
import type { AuditLogEntry, Category, DailyEntry, SubComponent } from '../types';
import { useCategories } from './useCategories';

describe('useCategories', () => {
  beforeEach(() => {
    localStorage.clear();
    seedIfNeeded();
  });

  it('adds a category and writes an audit entry', () => {
    const { result } = renderHook(() => useCategories());
    let created: Category | undefined;

    act(() => {
      created = result.current.addCategory({
        name: 'Creative Sadhana',
        icon: 'star',
        color: '#DB2777',
      });
    });

    if (!created) throw new Error('Category was not created');
    expect(result.current.categories.some((category) => category.name === 'Creative Sadhana')).toBe(true);
    expect(created.subComponents).toEqual([]);

    const stored = getItem<Category[]>('categories', []);
    expect(stored.some((category) => category.name === 'Creative Sadhana')).toBe(true);

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const entry = audit[audit.length - 1]!;
    expect(entry.actionType).toBe('category_created');
    expect(entry.entityId).toBe(created.id);
    expect(entry.oldValue).toBeNull();
    expect((entry.newValue as Category).name).toBe('Creative Sadhana');
  });

  it('edits a category and writes before and after snapshots', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;

    act(() => {
      result.current.updateCategory(category.id, {
        name: 'Yoga Practice',
        icon: 'sun',
        color: '#D97706',
      });
    });

    const updated = result.current.categories.find((item) => item.id === category.id)!;
    expect(updated.name).toBe('Yoga Practice');
    expect(updated.icon).toBe('sun');
    expect(updated.color).toBe('#D97706');

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const entry = audit[audit.length - 1]!;
    expect(entry.actionType).toBe('category_updated');
    expect((entry.oldValue as Category).name).toBe(category.name);
    expect((entry.newValue as Category).name).toBe('Yoga Practice');
  });

  it('archives a category without removing daily entry history', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;
    const subComponent = category.subComponents[0]!;
    const entry: DailyEntry = {
      date: '2026-05-14',
      completions: { [subComponent.id]: true },
      categoryScores: { [category.id]: 100 },
      overallScore: 100,
      updatedAt: '2026-05-14T00:00:00.000Z',
    };
    setItem('entries', { [entry.date]: entry });

    act(() => {
      result.current.archiveCategory(category.id);
    });

    expect(result.current.activeCategories.some((item) => item.id === category.id)).toBe(false);
    expect(result.current.archivedCategories.some((item) => item.id === category.id)).toBe(true);
    expect(getItem<Record<string, DailyEntry>>('entries', {})[entry.date]).toEqual(entry);

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const auditEntry = audit[audit.length - 1]!;
    expect(auditEntry.actionType).toBe('category_archived');
    expect((auditEntry.oldValue as Category).isArchived).toBe(false);
    expect((auditEntry.newValue as Category).isArchived).toBe(true);
  });

  it('restores an archived category', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;

    act(() => {
      result.current.archiveCategory(category.id);
    });
    act(() => {
      result.current.restoreCategory(category.id);
    });

    expect(result.current.activeCategories.some((item) => item.id === category.id)).toBe(true);
    expect(result.current.archivedCategories.some((item) => item.id === category.id)).toBe(false);

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const entry = audit[audit.length - 1]!;
    expect(entry.actionType).toBe('category_restored');
    expect((entry.oldValue as Category).isArchived).toBe(true);
    expect((entry.newValue as Category).isArchived).toBe(false);
  });

  it('adds a habit/sub-component to a category', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;
    let created: SubComponent | null | undefined;

    act(() => {
      created = result.current.addSubComponent(category.id, {
        name: 'Evening Reflection',
        trackingType: 'text',
      });
    });

    const updatedCategory = result.current.categories.find((item) => item.id === category.id)!;
    expect(updatedCategory.subComponents.some((sub) => sub.name === 'Evening Reflection')).toBe(true);
    if (!created) throw new Error('Practice was not created');
    expect(created.trackingType).toBe('text');

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const entry = audit[audit.length - 1]!;
    expect(entry.actionType).toBe('habit_created');
    expect(entry.entityId).toBe(created.id);
  });

  it('edits a habit/sub-component', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;
    const subComponent = category.subComponents[0]!;

    act(() => {
      result.current.updateSubComponent(category.id, subComponent.id, {
        name: 'Mindful Yama',
        trackingType: 'scale5',
      });
    });

    const updatedCategory = result.current.categories.find((item) => item.id === category.id)!;
    const updated = updatedCategory.subComponents.find((sub) => sub.id === subComponent.id)!;
    expect(updated.name).toBe('Mindful Yama');
    expect(updated.trackingType).toBe('scale5');

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const entry = audit[audit.length - 1]!;
    expect(entry.actionType).toBe('tracking_type_changed');
    expect(entry.oldValue).toBe(subComponent.trackingType);
    expect(entry.newValue).toBe('scale5');
    expect(audit[audit.length - 2]!.actionType).toBe('habit_updated');
  });

  it('archives a habit/sub-component without deleting it', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;
    const subComponent = category.subComponents[0]!;

    act(() => {
      result.current.archiveSubComponent(category.id, subComponent.id);
    });

    const updatedCategory = result.current.categories.find((item) => item.id === category.id)!;
    const updated = updatedCategory.subComponents.find((sub) => sub.id === subComponent.id)!;
    expect(updated.isArchived).toBe(true);
    expect(updatedCategory.subComponents).toHaveLength(category.subComponents.length);

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const entry = audit[audit.length - 1]!;
    expect(entry.actionType).toBe('habit_archived');
    expect((entry.oldValue as SubComponent).isArchived).toBe(false);
    expect((entry.newValue as SubComponent).isArchived).toBe(true);
  });

  it('restores a habit/sub-component', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;
    const subComponent = category.subComponents[0]!;

    act(() => {
      result.current.archiveSubComponent(category.id, subComponent.id);
    });
    act(() => {
      result.current.restoreSubComponent(category.id, subComponent.id);
    });

    const updatedCategory = result.current.categories.find((item) => item.id === category.id)!;
    const restored = updatedCategory.subComponents.find((sub) => sub.id === subComponent.id)!;
    expect(restored.isArchived).toBe(false);

    const audit = getItem<AuditLogEntry[]>('audit', []);
    const entry = audit[audit.length - 1]!;
    expect(entry.actionType).toBe('habit_restored');
    expect((entry.oldValue as SubComponent).isArchived).toBe(true);
    expect((entry.newValue as SubComponent).isArchived).toBe(false);
  });

  it('active category view excludes archived items', () => {
    const { result } = renderHook(() => useCategories());
    const category = result.current.categories[0]!;

    act(() => {
      result.current.archiveCategory(category.id);
    });

    expect(result.current.activeCategories.map((item) => item.id)).not.toContain(category.id);
    expect(result.current.archivedCategories.map((item) => item.id)).toContain(category.id);
  });
});
