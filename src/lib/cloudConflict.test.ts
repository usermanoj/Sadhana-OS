import type { AppStateSnapshot } from './repository';
import { hasCloudSnapshotChangedSinceBase } from './cloudConflict';

const baseSnapshot: AppStateSnapshot = {
  version: '0.2',
  categories: [{
    id: 'category-1',
    name: 'Yoga',
    icon: 'sparkles',
    color: '#7C3AED',
    displayOrder: 0,
    isArchived: false,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    subComponents: [],
  }],
  dailyEntries: {
    '2026-06-03': {
      date: '2026-06-03',
      completions: {
        'habit-1': true,
        'habit-2': false,
      },
      categoryScores: {},
      overallScore: 50,
      updatedAt: '2026-06-03T00:00:00.000Z',
    },
  },
  journalEntries: {},
  auditLogs: [],
};

describe('hasCloudSnapshotChangedSinceBase', () => {
  it('does not report a conflict when no base snapshot is available', () => {
    expect(hasCloudSnapshotChangedSinceBase(null, baseSnapshot)).toBe(false);
  });

  it('does not report a conflict for equivalent snapshots with different object key order', () => {
    const equivalentSnapshot: AppStateSnapshot = {
      ...baseSnapshot,
      dailyEntries: {
        '2026-06-03': {
          ...baseSnapshot.dailyEntries['2026-06-03']!,
          completions: {
            'habit-2': false,
            'habit-1': true,
          },
        },
      },
    };

    expect(hasCloudSnapshotChangedSinceBase(baseSnapshot, equivalentSnapshot)).toBe(false);
  });

  it('reports a conflict when cloud data changed after the queued write base', () => {
    const changedSnapshot: AppStateSnapshot = {
      ...baseSnapshot,
      categories: [{
        ...baseSnapshot.categories[0]!,
        name: 'Practice changed elsewhere',
      }],
    };

    expect(hasCloudSnapshotChangedSinceBase(baseSnapshot, changedSnapshot)).toBe(true);
  });
});
