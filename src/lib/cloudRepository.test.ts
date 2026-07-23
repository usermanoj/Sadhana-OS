import { mapCloudMutationStatusToRow, mapCloudRowsToSnapshot } from './cloudRepository';

describe('mapCloudRowsToSnapshot', () => {
  it('maps Supabase rows into the local app snapshot shape', () => {
    const snapshot = mapCloudRowsToSnapshot({
      settings: { schema_version: '0.2' },
      categories: [{
        id: 'category-1',
        name: 'Yoga',
        icon: 'lotus',
        color: '#7C3AED',
        display_order: 0,
        is_archived: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
      habits: [{
        id: 'habit-1',
        category_id: 'category-1',
        name: 'Yama',
        tracking_type: 'boolean',
        display_order: 0,
        is_archived: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
      dailyEntries: [{
        entry_date: '2026-01-02',
        overall_score: 100,
        category_scores: { 'category-1': 100 },
        updated_at: '2026-01-02T00:00:00.000Z',
      }],
      dailyHabitEntries: [{
        entry_date: '2026-01-02',
        habit_id: 'habit-1',
        value: true,
      }],
      journalEntries: [{
        entry_date: '2026-01-02',
        mood: 'steady',
        gratitude: null,
        spiritual_insight: null,
        trigger_observed: null,
        lesson_learned: null,
        content: 'Clear morning.',
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T01:00:00.000Z',
      }],
      auditLogs: [{
        id: 'audit-1',
        timestamp: '2026-01-01T00:00:00.000Z',
        action_type: 'category_created',
        entity_type: 'category',
        entity_id: 'category-1',
        old_value: null,
        new_value: { name: 'Yoga' },
        note: 'Created Yoga',
      }],
      dailyPlans: [{
        plan_date: '2026-01-02',
        mode: 'balanced',
        status: 'confirmed',
        available_minutes: 15,
        energy_level: 3,
        focus_category_ids: ['category-1'],
        intention: 'Begin steadily',
        items: [{
          habitId: 'habit-1',
          categoryId: 'category-1',
          rank: 1,
          plannedMinutes: 3,
          recommendationScore: 155,
          reasons: ['focus_area'],
        }],
        excluded_habit_ids: [],
        engine_version: '1.0',
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      }],
    });

    expect(snapshot.version).toBe('0.2');
    expect(snapshot.categories[0]?.subComponents[0]?.name).toBe('Yama');
    expect(snapshot.dailyEntries['2026-01-02']?.completions).toEqual({ 'habit-1': true });
    expect(snapshot.journalEntries['2026-01-02']?.mood).toBe('steady');
    expect(snapshot.auditLogs[0]?.actionType).toBe('category_created');
    expect(snapshot.dailyPlans?.['2026-01-02']?.status).toBe('confirmed');
    expect(snapshot.dailyPlans?.['2026-01-02']?.items[0]?.habitId).toBe('habit-1');
  });
});

describe('mapCloudMutationStatusToRow', () => {
  it('maps queued mutation metadata without including snapshot contents', () => {
    expect(mapCloudMutationStatusToRow({
      clientMutationId: 'mutation-1',
      mutationType: 'replaceSnapshot',
      status: 'failed',
      attemptCount: 2,
      lastErrorMessage: 'Cloud sync failed.',
      metadata: {
        queuedAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T01:00:00.000Z',
        hasBaseSnapshot: true,
      },
      completedAt: null,
    }, 'user-a')).toEqual({
      user_id: 'user-a',
      client_mutation_id: 'mutation-1',
      mutation_type: 'replaceSnapshot',
      status: 'failed',
      attempt_count: 2,
      last_error: 'Cloud sync failed.',
      metadata: {
        queuedAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T01:00:00.000Z',
        hasBaseSnapshot: true,
      },
      completed_at: null,
    });
  });
});
