import type { AppStateSnapshot } from './repository';
import {
  archiveCopiedLocalCustomCategories,
  archiveDuplicateStarterTemplateRows,
  checksumSnapshot,
  createLocalMigrationPlan,
  createLocalMigrationPreview,
  findCopiedLocalCustomCategories,
  getLocalMigrationCompletion,
  getMigrationErrorMessage,
  hasCloudUserContent,
  hasMigratableLocalData,
  hasMeaningfulLocalMigrationData,
  recordLocalMigrationCompletion,
  uploadLocalMigrationPlan,
} from './localMigration';
import { createSeedCategories, createStarterTemplateSnapshot } from './seed';

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
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('does not treat unchanged starter-only local data as meaningful migration data', () => {
    const starterOnlySnapshot: AppStateSnapshot = {
      version: '1.1',
      categories: createSeedCategories({
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [
        {
          id: 'seed-audit',
          timestamp: '2026-01-01T00:00:00.000Z',
          actionType: 'data_imported',
          entityType: 'system',
          entityId: 'system',
          oldValue: null,
          newValue: null,
          note: 'Initial seed data',
        },
      ],
    };

    expect(hasMigratableLocalData(starterOnlySnapshot)).toBe(true);
    expect(hasMeaningfulLocalMigrationData(starterOnlySnapshot)).toBe(false);
  });

  it('treats custom legacy categories and practice history as meaningful migration data', () => {
    const starterSnapshot = createStarterTemplateSnapshot({
      timestamp: '2026-06-01T00:00:00.000Z',
      auditIdFactory: () => 'starter-audit',
    });

    expect(hasMeaningfulLocalMigrationData({
      ...starterSnapshot,
      categories: [
        ...starterSnapshot.categories,
        snapshot.categories[0]!,
      ],
    })).toBe(true);
    expect(hasMeaningfulLocalMigrationData({
      ...starterSnapshot,
      dailyEntries: snapshot.dailyEntries,
    })).toBe(true);
  });

  it('creates a stable checksum for the same snapshot', () => {
    expect(checksumSnapshot(snapshot)).toBe(checksumSnapshot(snapshot));
  });

  it('summarizes local migration preview and custom category names', () => {
    const preview = createLocalMigrationPreview(snapshot);

    expect(preview.summary).toMatchObject({
      categories: 1,
      habits: 1,
      dailyEntries: 1,
      dailyHabitEntries: 1,
      journalEntries: 1,
      auditLogs: 1,
    });
    expect(preview.customCategoryNames).toEqual(['Yoga']);
    expect(preview.hasPracticeHistory).toBe(true);
    expect(preview.hasJournalEntries).toBe(true);
  });

  it('detects cloud user content beyond starter defaults', () => {
    const starterSnapshot = createStarterTemplateSnapshot({
      timestamp: '2026-06-01T00:00:00.000Z',
      auditIdFactory: () => 'starter-audit',
    });

    expect(hasCloudUserContent(starterSnapshot)).toBe(false);
    expect(hasCloudUserContent({
      ...starterSnapshot,
      categories: [
        ...starterSnapshot.categories,
        {
          ...snapshot.categories[0]!,
          id: 'custom-cloud-category',
        },
      ],
    })).toBe(true);
  });

  it('finds custom categories that were already copied from the local backup', () => {
    const plan = createLocalMigrationPlan(snapshot, 'user-1');
    const copiedCategoryId = plan.rows.categories[0]!.id;
    const cloudSnapshot: AppStateSnapshot = {
      version: '0.2',
      categories: [
        {
          ...snapshot.categories[0]!,
          id: copiedCategoryId,
          subComponents: snapshot.categories[0]!.subComponents.map((habit) => ({
            ...habit,
            id: plan.rows.habits[0]!.id,
            categoryId: copiedCategoryId,
          })),
        },
      ],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    };

    expect(findCopiedLocalCustomCategories(snapshot, 'user-1', cloudSnapshot)).toEqual([
      {
        id: copiedCategoryId,
        name: 'Yoga',
      },
    ]);
  });

  it('archives copied local custom categories without hard deleting them', () => {
    const copiedCategory = snapshot.categories[0]!;
    const repair = archiveCopiedLocalCustomCategories(
      {
        version: '0.2',
        categories: [copiedCategory],
        dailyEntries: {},
        journalEntries: {},
        auditLogs: [],
      },
      [{ id: copiedCategory.id, name: copiedCategory.name }],
      {
        timestamp: '2026-06-03T00:00:00.000Z',
        auditIdFactory: () => 'cleanup-audit-1',
      },
    );

    expect(repair.snapshot.categories[0]).toMatchObject({
      id: copiedCategory.id,
      isArchived: true,
      updatedAt: '2026-06-03T00:00:00.000Z',
    });
    expect(repair.snapshot.categories[0]!.subComponents[0]).toMatchObject({
      isArchived: true,
      updatedAt: '2026-06-03T00:00:00.000Z',
    });
    expect(repair.snapshot.auditLogs).toEqual([
      expect.objectContaining({
        id: 'cleanup-audit-1',
        actionType: 'category_archived',
        entityId: copiedCategory.id,
        note: 'Archived custom category copied from local backup',
      }),
    ]);
  });

  it('records successful local backup migration completion by checksum', () => {
    recordLocalMigrationCompletion({
      checksum: 'local-abc',
      userId: 'user-1',
      importJobId: 'import-1',
      completedAt: '2026-06-03T00:00:00.000Z',
      summary: {
        categories: 1,
        habits: 1,
        dailyEntries: 0,
        dailyHabitEntries: 0,
        journalEntries: 0,
        auditLogs: 0,
        totalRows: 2,
      },
    });

    expect(getLocalMigrationCompletion('local-abc')).toMatchObject({
      checksum: 'local-abc',
      userId: 'user-1',
      importJobId: 'import-1',
    });
    expect(getLocalMigrationCompletion('local-missing')).toBeNull();
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

  it('maps unchanged legacy starter rows onto existing cloud starter rows to prevent duplicate defaults', () => {
    const localStarterCategory = createSeedCategories({
      timestamp: '2026-01-01T00:00:00.000Z',
    })[0]!;
    const existingCloudStarter = createStarterTemplateSnapshot({
      timestamp: '2026-06-01T00:00:00.000Z',
      idFactory: (stableId) => `cloud-${stableId}`,
      auditIdFactory: () => 'cloud-audit',
    });
    const localSnapshot: AppStateSnapshot = {
      version: '1.1',
      categories: [localStarterCategory],
      dailyEntries: {
        '2026-06-03': {
          date: '2026-06-03',
          completions: {
            [localStarterCategory.subComponents[0]!.id]: true,
          },
          categoryScores: {
            [localStarterCategory.id]: 100,
          },
          overallScore: 100,
          updatedAt: '2026-06-03T00:00:00.000Z',
        },
      },
      journalEntries: {},
      auditLogs: [],
    };

    const plan = createLocalMigrationPlan(localSnapshot, 'user-1', {
      existingCloudSnapshot: existingCloudStarter,
    });

    const existingCategory = existingCloudStarter.categories[0]!;
    const existingHabit = existingCategory.subComponents[0]!;
    expect(plan.rows.categories[0]!.id).toBe(existingCategory.id);
    expect(plan.rows.habits[0]!.id).toBe(existingHabit.id);
    expect(plan.rows.dailyEntries[0]!.category_scores).toEqual({
      [existingCategory.id]: 100,
    });
    expect(plan.rows.dailyHabitEntries[0]!.habit_id).toBe(existingHabit.id);
  });

  it('collapses duplicate conflict keys before creating the upload summary', () => {
    const localStarterCategory = createSeedCategories({
      timestamp: '2026-01-01T00:00:00.000Z',
    })[0]!;
    const duplicateLocalStarterCategory = {
      ...localStarterCategory,
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      subComponents: localStarterCategory.subComponents.map((habit) => ({
        ...habit,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      })),
    };
    const localSnapshot: AppStateSnapshot = {
      version: '1.1',
      categories: [localStarterCategory, duplicateLocalStarterCategory],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    };

    const plan = createLocalMigrationPlan(localSnapshot, 'user-1');
    const categoryConflictKeys = plan.rows.categories.map((row) => `${row.user_id}:${row.id}`);
    const habitConflictKeys = plan.rows.habits.map((row) => `${row.user_id}:${row.id}`);

    expect(new Set(categoryConflictKeys).size).toBe(plan.rows.categories.length);
    expect(new Set(habitConflictKeys).size).toBe(plan.rows.habits.length);
    expect(plan.summary.categories).toBe(1);
    expect(plan.summary.habits).toBe(localStarterCategory.subComponents.length);
  });

  it('uses insert-only conflict handling for append-only audit rows', async () => {
    const plan = createLocalMigrationPlan(snapshot, 'user-1');
    const upsertCalls: Array<{ table: string; options: Record<string, unknown> }> = [];
    const client = {
      from: vi.fn((table: string) => {
        if (table === 'import_jobs') {
          return {
            insert: vi.fn(async () => ({ error: null })),
            update: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: null })),
            })),
          };
        }

        return {
          upsert: vi.fn(async (_rows: unknown[], options: Record<string, unknown>) => {
            upsertCalls.push({ table, options });
            return { error: null };
          }),
        };
      }),
    } as unknown as Parameters<typeof uploadLocalMigrationPlan>[0];

    await uploadLocalMigrationPlan(client, plan);

    expect(upsertCalls.find((call) => call.table === 'audit_log_entries')?.options)
      .toMatchObject({
        onConflict: 'user_id,id',
        ignoreDuplicates: true,
      });
  });

  it('extracts readable messages from plain Supabase error objects', () => {
    expect(getMigrationErrorMessage({
      message: 'new row violates row-level security policy',
      details: 'update denied for audit_log_entries',
    })).toBe('new row violates row-level security policy update denied for audit_log_entries');
  });

  it('archives duplicate starter-template categories while keeping the copy with daily usage', () => {
    const cloudStarter = createStarterTemplateSnapshot({
      timestamp: '2026-06-01T00:00:00.000Z',
      idFactory: (stableId) => `cloud-${stableId}`,
      auditIdFactory: () => 'cloud-audit',
    });
    const migratedStarterCategory = {
      ...cloudStarter.categories[0]!,
      id: 'migrated-category-1',
      createdAt: '2026-06-02T00:00:00.000Z',
      updatedAt: '2026-06-02T00:00:00.000Z',
      subComponents: cloudStarter.categories[0]!.subComponents.map((habit, index) => ({
        ...habit,
        id: `migrated-habit-${index}`,
        categoryId: 'migrated-category-1',
      })),
    };
    const snapshot: AppStateSnapshot = {
      ...cloudStarter,
      categories: [
        cloudStarter.categories[0]!,
        migratedStarterCategory,
        ...cloudStarter.categories.slice(1),
      ],
      dailyEntries: {
        '2026-06-03': {
          date: '2026-06-03',
          completions: {
            [migratedStarterCategory.subComponents[0]!.id]: true,
          },
          categoryScores: {
            [migratedStarterCategory.id]: 100,
          },
          overallScore: 100,
          updatedAt: '2026-06-03T00:00:00.000Z',
        },
      },
    };

    const repair = archiveDuplicateStarterTemplateRows(snapshot, {
      timestamp: '2026-06-03T00:00:00.000Z',
      auditIdFactory: () => 'repair-audit-1',
    });

    expect(repair.archivedCategoryIds).toEqual([cloudStarter.categories[0]!.id]);
    expect(repair.snapshot.categories.find((category) => category.id === cloudStarter.categories[0]!.id)?.isArchived)
      .toBe(true);
    expect(repair.snapshot.categories.find((category) => category.id === migratedStarterCategory.id)?.isArchived)
      .toBe(false);
    expect(repair.snapshot.auditLogs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'repair-audit-1',
        actionType: 'category_archived',
        entityId: cloudStarter.categories[0]!.id,
        note: 'Archived duplicate starter-template category after local migration',
      }),
    ]));
  });
});
