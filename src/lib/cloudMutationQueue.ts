import type { AppStateSnapshot } from './repository';
import { getItem, removeItem, setItem } from './storage';

const QUEUE_KEY_SUFFIX = 'cloud-mutation-queue';

export interface QueuedCloudMutation {
  id: string;
  clientMutationId: string;
  type: 'replaceSnapshot';
  userId: string;
  snapshot: AppStateSnapshot;
  baseSnapshot?: AppStateSnapshot;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  lastAttemptAt?: string;
  lastErrorMessage?: string;
}

export interface EnqueueCloudMutationOptions {
  baseSnapshot?: AppStateSnapshot | null;
  error?: unknown;
}

export interface CloudMutationQueue {
  get(): QueuedCloudMutation | null;
  enqueueSnapshot(snapshot: AppStateSnapshot, options?: EnqueueCloudMutationOptions): QueuedCloudMutation;
  recordReplayFailure(error: unknown): QueuedCloudMutation | null;
  clear(): void;
  count(): number;
}

export function createCloudMutationQueue(userId: string): CloudMutationQueue {
  const key = createCloudMutationQueueKey(userId);

  return {
    get() {
      return getItem<QueuedCloudMutation | null>(key, null);
    },
    enqueueSnapshot(snapshot, options = {}) {
      const now = new Date().toISOString();
      const existing = getItem<QueuedCloudMutation | null>(key, null);
      const clientMutationId = existing?.clientMutationId ?? existing?.id ?? crypto.randomUUID();
      const mutation: QueuedCloudMutation = {
        id: existing?.id ?? clientMutationId,
        clientMutationId,
        type: 'replaceSnapshot',
        userId,
        snapshot,
        baseSnapshot: existing?.baseSnapshot ?? options.baseSnapshot ?? undefined,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        attemptCount: existing?.attemptCount ?? 0,
        lastAttemptAt: existing?.lastAttemptAt,
        lastErrorMessage: options.error ? getErrorMessage(options.error) : existing?.lastErrorMessage,
      };

      setItem(key, mutation);
      return mutation;
    },
    recordReplayFailure(error) {
      const existing = getItem<QueuedCloudMutation | null>(key, null);
      if (!existing) return null;

      const mutation: QueuedCloudMutation = {
        ...existing,
        attemptCount: existing.attemptCount + 1,
        lastAttemptAt: new Date().toISOString(),
        lastErrorMessage: getErrorMessage(error),
      };

      setItem(key, mutation);
      return mutation;
    },
    clear() {
      removeItem(key);
    },
    count() {
      return getItem<QueuedCloudMutation | null>(key, null) ? 1 : 0;
    },
  };
}

export function createCloudMutationQueueKey(userId: string): string {
  return `users:${encodeURIComponent(userId)}:${QUEUE_KEY_SUFFIX}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
