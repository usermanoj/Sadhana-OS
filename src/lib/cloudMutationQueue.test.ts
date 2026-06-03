import type { AppStateSnapshot } from './repository';
import { createCloudMutationQueue, createCloudMutationQueueKey } from './cloudMutationQueue';

const snapshot: AppStateSnapshot = {
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
  dailyEntries: {},
  journalEntries: {},
  auditLogs: [],
};

describe('createCloudMutationQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores a user-scoped queued snapshot', () => {
    const queue = createCloudMutationQueue('user-a');
    const mutation = queue.enqueueSnapshot(snapshot, {
      baseSnapshot: {
        ...snapshot,
        categories: [],
      },
      error: new Error('network unavailable'),
    });

    expect(mutation.type).toBe('replaceSnapshot');
    expect(mutation.userId).toBe('user-a');
    expect(mutation.clientMutationId).toBeTruthy();
    expect(mutation.snapshot).toEqual(snapshot);
    expect(mutation.baseSnapshot?.categories).toEqual([]);
    expect(mutation.lastErrorMessage).toBe('network unavailable');
    expect(queue.count()).toBe(1);
    expect(queue.get()?.id).toBe(mutation.id);
    expect(localStorage.getItem(`sadhana:${createCloudMutationQueueKey('user-a')}`)).toBeTruthy();
    expect(localStorage.getItem(`sadhana:${createCloudMutationQueueKey('user-b')}`)).toBeNull();
  });

  it('coalesces repeated writes into one latest snapshot', () => {
    const queue = createCloudMutationQueue('user-a');
    const baseSnapshot: AppStateSnapshot = {
      ...snapshot,
      categories: [],
    };
    const first = queue.enqueueSnapshot(snapshot, { baseSnapshot });
    const nextSnapshot: AppStateSnapshot = {
      ...snapshot,
      categories: [{
        ...snapshot.categories[0]!,
        name: 'Updated Practice',
      }],
    };
    const second = queue.enqueueSnapshot(nextSnapshot);

    expect(second.id).toBe(first.id);
    expect(second.clientMutationId).toBe(first.clientMutationId);
    expect(queue.count()).toBe(1);
    expect(queue.get()?.baseSnapshot).toEqual(baseSnapshot);
    expect(queue.get()?.snapshot.categories[0]?.name).toBe('Updated Practice');
  });

  it('records replay failure metadata and clears after success', () => {
    const queue = createCloudMutationQueue('user-a');
    queue.enqueueSnapshot(snapshot);

    const failed = queue.recordReplayFailure(new Error('still offline'));

    expect(failed?.attemptCount).toBe(1);
    expect(failed?.lastErrorMessage).toBe('still offline');
    expect(failed?.lastAttemptAt).toBeTruthy();

    queue.clear();

    expect(queue.get()).toBeNull();
    expect(queue.count()).toBe(0);
  });
});
