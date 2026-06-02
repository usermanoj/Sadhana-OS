import type { AppStateSnapshot } from './repository';
import {
  checksumSnapshot,
  createLocalMigrationPlan,
  hasMigratableLocalData,
} from './localMigration';

const snapshot: AppStateSnapshot = {
  version: '1.1',
  categories: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Yoga',
      icon: 'lotus',
      color: '#7C3AED',
      displayOrder: 0,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      subComponents: [
        {
          id: '00000000-0000-4000-8000-000000000101',
          categoryId: '00000000-0000-4000-8000-000000000001',
          name: 'Yama',
          trackingType: 'boolean',
          displayOrder: 0,
          isArchived: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  ],
  dailyEntries: {
    '2026-01-02': {
      date: '2026-01-02',
      completions: {
        '00000000-0000-4000-8000-000000000101': true,
      },
      categoryScores: {
        '00000000-0000-4000-8000-000000000001': 100,
      },
      overallScore: 100,
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  },
  journalEntries: {
    '2026-01-02': {
      date: '2026-01-02',
      mood: 'steady',
      gratitude: 'practice',
      content: 'A clear morning.',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T01:00:00.000Z',
    },
  },
  auditLogs: [
    {
      id: '00000000-0000-4000-8000-000000000901',
      timestamp: '2026-01-01T00:00:00.000Z',
      actionType: 'category_created',
      entityType: 'category',
      entityId: '00000000-0000-4000-8000-000000000001',
      oldValue: null,
      newValue: { name: 'Yoga' },
      note: 'Created category "Yoga"',
    },
  ],
};

describe('local migration planning', () => {
  it('detects migratable local data', () => {
    expect(hasMigratableLocalData(snapshot)).toBe(true);
    expect(hasMigratableLocalData({
      version: '1.1',
      categories: [],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    })).toBe(false);
  });

  it('creates a stable checksum for the same snapshot', () => {
    expect(checksumSnapshot(snapshot)).toBe(checksumSnapshot(snapshot));
  });

  it('maps local data into cloud rows with summary counts', () => {
    const plan = createLocalMigrationPlan(snapshot, 'user-1');

    expect(plan.summary).toEqual({
      categories: 1,
      habits: 1,
      dailyEntries: 1,
      dailyHabitEntries: 1,
      journalEntries: 1,
      auditLogs: 1,
      totalRows: 6,
    });
    expect(plan.rows.categories[0]).toMatchObject({
      user_id: 'user-1',
      display_order: 0,
      is_archived: false,
    });
    expect(plan.rows.habits[0]).toMatchObject({
      user_id: 'user-1',
      tracking_type: 'boolean',
    });
    expect(plan.rows.dailyEntries[0]).toMatchObject({
      user_id: 'user-1',
      entry_date: '2026-01-02',
      overall_score: 100,
    });
    expect(plan.rows.dailyHabitEntries[0]).toMatchObject({
      user_id: 'user-1',
      entry_date: '2026-01-02',
      value: true,
    });
    expect(plan.rows.journalEntries[0]).toMatchObject({
      user_id: 'user-1',
      entry_date: '2026-01-02',
      mood: 'steady',
      gratitude: 'practice',
      content: 'A clear morning.',
    });
    expect(plan.rows.auditLogs[0]).toMatchObject({
      source: 'migration',
      action_type: 'category_created',
      entity_type: 'category',
    });
  });

  it('remaps category and habit ids while preserving cloud relationships', () => {
    const plan = createLocalMigrationPlan(snapshot, 'user-1');
    const migratedCategory = plan.rows.categories[0]!;
    const migratedHabit = plan.rows.habits[0]!;
    const migratedDailyEntry = plan.rows.dailyEntries[0]!;
    const migratedDailyHabitEntry = plan.rows.dailyHabitEntries[0]!;
    const migratedAudit = plan.rows.auditLogs[0]!;

    expect(migratedCategory.id).not.toBe('00000000-0000-4000-8000-000000000001');
    expect(migratedHabit.id).not.toBe('00000000-0000-4000-8000-000000000101');
    expect(migratedAudit.id).not.toBe('00000000-0000-4000-8000-000000000901');

    expect(migratedHabit.category_id).toBe(migratedCategory.id);
    expect(migratedDailyHabitEntry.habit_id).toBe(migratedHabit.id);
    expect(migratedDailyEntry.category_scores).toEqual({
      [migratedCategory.id]: 100,
    });
    expect(migratedAudit.entity_id).toBe(migratedCategory.id);
  });

  it('remaps audit snapshots that contain local category or habit references', () => {
    const plan = createLocalMigrationPlan({
      ...snapshot,
      auditLogs: [
        {
          id: '00000000-0000-4000-8000-000000000902',
          timestamp: '2026-01-01T00:00:00.000Z',
          actionType: 'habit_created',
          entityType: 'habit',
          entityId: '00000000-0000-4000-8000-000000000101',
          oldValue: null,
          newValue: {
            id: '00000000-0000-4000-8000-000000000101',
            categoryId: '00000000-0000-4000-8000-000000000001',
            completions: {
              '00000000-0000-4000-8000-000000000101': true,
            },
            categoryScores: {
              '00000000-0000-4000-8000-000000000001': 100,
            },
          },
          note: 'Created habit "Yama"',
        },
      ],
    }, 'user-1');
    const migratedCategoryId = plan.rows.categories[0]!.id;
    const migratedHabitId = plan.rows.habits[0]!.id;

    expect(plan.rows.auditLogs[0]).toMatchObject({
      entity_type: 'habit',
      entity_id: migratedHabitId,
      new_value: {
        id: migratedHabitId,
        categoryId: migratedCategoryId,
        completions: {
          [migratedHabitId]: true,
        },
        categoryScores: {
          [migratedCategoryId]: 100,
        },
      },
    });
  });

  it('creates non-overlapping cloud ids for two users migrating identical local data', () => {
    const userAPlan = createLocalMigrationPlan(snapshot, 'user-a');
    const userBPlan = createLocalMigrationPlan(snapshot, 'user-b');
    const userAIds = new Set([
      ...userAPlan.rows.categories.map((row) => row.id),
      ...userAPlan.rows.habits.map((row) => row.id),
      ...userAPlan.rows.dailyEntries.map((row) => row.id),
      ...userAPlan.rows.dailyHabitEntries.map((row) => row.id),
      ...userAPlan.rows.journalEntries.map((row) => row.id),
      ...userAPlan.rows.auditLogs.map((row) => row.id),
    ]);
    const userBIds = [
      ...userBPlan.rows.categories.map((row) => row.id),
      ...userBPlan.rows.habits.map((row) => row.id),
      ...userBPlan.rows.dailyEntries.map((row) => row.id),
      ...userBPlan.rows.dailyHabitEntries.map((row) => row.id),
      ...userBPlan.rows.journalEntries.map((row) => row.id),
      ...userBPlan.rows.auditLogs.map((row) => row.id),
    ];

    userBIds.forEach((id) => {
      expect(userAIds.has(id)).toBe(false);
    });
  });

  it('creates stable cloud ids when the same user retries the same migration', () => {
    const firstPlan = createLocalMigrationPlan(snapshot, 'user-a');
    const retryPlan = createLocalMigrationPlan(snapshot, 'user-a');

    expect(retryPlan.rows.categories.map((row) => row.id)).toEqual(
      firstPlan.rows.categories.map((row) => row.id),
    );
    expect(retryPlan.rows.habits.map((row) => row.id)).toEqual(
      firstPlan.rows.habits.map((row) => row.id),
    );
    expect(retryPlan.rows.dailyEntries.map((row) => row.id)).toEqual(
      firstPlan.rows.dailyEntries.map((row) => row.id),
    );
    expect(retryPlan.rows.dailyHabitEntries.map((row) => row.id)).toEqual(
      firstPlan.rows.dailyHabitEntries.map((row) => row.id),
    );
    expect(retryPlan.rows.journalEntries.map((row) => row.id)).toEqual(
      firstPlan.rows.journalEntries.map((row) => row.id),
    );
    expect(retryPlan.rows.auditLogs.map((row) => row.id)).toEqual(
      firstPlan.rows.auditLogs.map((row) => row.id),
    );
  });

  it('keeps retry-stable relationship remapping across repeated plans', () => {
    const firstPlan = createLocalMigrationPlan(snapshot, 'user-a');
    const retryPlan = createLocalMigrationPlan(snapshot, 'user-a');

    expect(retryPlan.rows.habits[0]!.category_id).toBe(firstPlan.rows.habits[0]!.category_id);
    expect(retryPlan.rows.dailyEntries[0]!.category_scores).toEqual(firstPlan.rows.dailyEntries[0]!.category_scores);
    expect(retryPlan.rows.dailyHabitEntries[0]!.habit_id).toBe(firstPlan.rows.dailyHabitEntries[0]!.habit_id);
    expect(retryPlan.rows.auditLogs[0]!.entity_id).toBe(firstPlan.rows.auditLogs[0]!.entity_id);
  });
});
