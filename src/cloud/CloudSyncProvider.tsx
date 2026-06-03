import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  type AppRepository,
  type AppStateSnapshot,
  createUserScopedLocalStorageRepository,
  resetActiveAppRepository,
  setActiveAppRepository,
} from '../lib/repository';
import {
  createSupabaseCloudGateway,
  type CloudDataGateway,
  type CloudMutationStatus,
} from '../lib/cloudRepository';
import { createCloudBackedRepository, hydrateLocalCacheOrCreateStarterTemplate } from '../lib/cloudSync';
import { getSupabaseClient } from '../lib/supabaseClient';
import { hasMigratableLocalData } from '../lib/localMigration';
import { reportError, trackEvent } from '../lib/observability';
import {
  createCloudMutationQueue,
  type CloudMutationQueue,
  type QueuedCloudMutation,
} from '../lib/cloudMutationQueue';
import { hasCloudSnapshotChangedSinceBase } from '../lib/cloudConflict';

export type CloudSyncStatus =
  | 'localOnly'
  | 'preparing'
  | 'synced'
  | 'syncing'
  | 'queued'
  | 'conflict'
  | 'offline'
  | 'failed'
  | 'retrying';

type CloudSyncPhase = Exclude<CloudSyncStatus, 'offline'>;
type CloudSyncRetryMode = 'hydration' | 'queuedWrite';

export interface CloudSyncContextValue {
  status: CloudSyncStatus;
  message: string | null;
  lastSyncedAt: string | null;
  lastErrorAt: string | null;
  pendingWrites: number;
  canRetry: boolean;
  retry: () => Promise<void>;
}

interface CloudSyncInternalState {
  phase: CloudSyncPhase;
  message: string | null;
  lastSyncedAt: string | null;
  lastErrorAt: string | null;
  pendingWrites: number;
  canRetry: boolean;
}

interface CloudSyncProviderProps {
  children: ReactNode;
}

const PREPARING_MESSAGE = 'Preparing your private practice space...';
const SYNCING_MESSAGE = 'Saving changes to cloud...';
const RETRYING_MESSAGE = 'Retrying cloud sync...';
const QUEUED_MESSAGE = 'Unsynced changes are queued and will replay when cloud sync is available.';
const CONFLICT_MESSAGE = 'Cloud data changed on another device. Your local changes remain queued and will not overwrite newer cloud data.';
const OFFLINE_MESSAGE = 'You are offline. Changes stay on this device until the connection returns.';

const defaultCloudSyncContext: CloudSyncContextValue = {
  status: 'localOnly',
  message: 'Cloud sync is not active in this session.',
  lastSyncedAt: null,
  lastErrorAt: null,
  pendingWrites: 0,
  canRetry: false,
  retry: async () => undefined,
};

const createLocalOnlyState = (): CloudSyncInternalState => ({
  phase: 'localOnly',
  message: 'Cloud sync is not active in this session.',
  lastSyncedAt: null,
  lastErrorAt: null,
  pendingWrites: 0,
  canRetry: false,
});

export const CloudSyncContext = createContext<CloudSyncContextValue>(defaultCloudSyncContext);

export const useCloudSync = (): CloudSyncContextValue => useContext(CloudSyncContext);

export default function CloudSyncProvider({ children }: CloudSyncProviderProps) {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<CloudSyncInternalState>(() => createLocalOnlyState());
  const [isOnline, setIsOnline] = useState(() => getIsOnline());
  const [repositoryRevision, setRepositoryRevision] = useState(0);
  const localRepositoryRef = useRef<AppRepository | null>(null);
  const cloudGatewayRef = useRef<CloudDataGateway | null>(null);
  const mutationQueueRef = useRef<CloudMutationQueue | null>(null);
  const retryModeRef = useRef<CloudSyncRetryMode | null>(null);
  const lastConfirmedCloudSnapshotRef = useRef<AppStateSnapshot | null>(null);

  const retry = useCallback(async () => {
    const localRepository = localRepositoryRef.current;
    const cloudGateway = cloudGatewayRef.current;
    const mutationQueue = mutationQueueRef.current;
    const retryMode = retryModeRef.current;

    if (!localRepository || !cloudGateway || !retryMode) {
      return;
    }

    setSyncState((current) => ({
      ...current,
      phase: 'retrying',
      message: RETRYING_MESSAGE,
      canRetry: false,
    }));

    try {
      if (retryMode === 'hydration') {
        await hydrateLocalCacheOrCreateStarterTemplate(localRepository, cloudGateway);
        setRepositoryRevision((current) => current + 1);
      } else {
        const queuedMutation = mutationQueue?.get();
        const snapshot = queuedMutation?.snapshot ?? localRepository.getSnapshot({ versionFallback: '0.2' });
        const currentCloudSnapshot = await cloudGateway.loadSnapshot();

        if (queuedMutation) {
          await recordMutationStatusSafely(cloudGateway, queuedMutation, 'running');
        }

        if (queuedMutation && hasCloudSnapshotChangedSinceBase(queuedMutation.baseSnapshot, currentCloudSnapshot)) {
          await recordMutationStatusSafely(cloudGateway, queuedMutation, 'conflict', {
            conflictReason: 'cloud_snapshot_changed',
            lastErrorMessage: CONFLICT_MESSAGE,
          });
          retryModeRef.current = 'queuedWrite';
          trackEvent('sync_error_seen', { area: 'queued_write_conflict' });
          setSyncState((current) => ({
            ...current,
            phase: 'conflict',
            message: CONFLICT_MESSAGE,
            lastErrorAt: new Date().toISOString(),
            pendingWrites: Math.max(1, current.pendingWrites),
            canRetry: false,
          }));
          return;
        }

        localRepository.replaceSnapshot(snapshot);
        await cloudGateway.replaceSnapshot(snapshot);
        if (queuedMutation) {
          await recordMutationStatusSafely(cloudGateway, queuedMutation, 'succeeded', {
            completedAt: new Date().toISOString(),
          });
        }
        mutationQueue?.clear();
        lastConfirmedCloudSnapshotRef.current = snapshot;
      }

      retryModeRef.current = null;
      setSyncState((current) => ({
        ...current,
        phase: 'synced',
        message: null,
        lastSyncedAt: new Date().toISOString(),
        pendingWrites: 0,
        canRetry: false,
      }));
    } catch (error) {
      retryModeRef.current = retryMode;
      if (retryMode === 'queuedWrite') {
        const failedMutation = mutationQueue?.recordReplayFailure(error);
        if (failedMutation) {
          await recordMutationStatusSafely(cloudGateway, failedMutation, 'failed', {
            lastErrorMessage: getSafeCloudErrorMessage(error),
          });
        }
      }
      trackEvent('sync_error_seen', {
        area: retryMode === 'hydration' ? 'retry_hydration' : 'retry_queued_write',
      });
      reportError(error, retryMode === 'hydration' ? 'cloud_hydration_retry_failed' : 'cloud_write_retry_failed');

      setSyncState((current) => ({
        ...current,
        phase: retryMode === 'hydration' ? 'failed' : 'queued',
        message: getFailureMessage(retryMode),
        lastErrorAt: new Date().toISOString(),
        pendingWrites: retryMode === 'hydration' ? current.pendingWrites : Math.max(1, current.pendingWrites),
        canRetry: true,
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateOnlineState = () => setIsOnline(getIsOnline());
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || retryModeRef.current !== 'queuedWrite' || !mutationQueueRef.current?.count()) {
      return;
    }

    void retry();
  }, [isOnline, retry]);

  useEffect(() => {
    if (!auth.isCloudConfigured || auth.status !== 'signedIn' || !userId) {
      resetActiveAppRepository();
      setReadyUserId(null);
      setRepositoryRevision(0);
      localRepositoryRef.current = null;
      cloudGatewayRef.current = null;
      mutationQueueRef.current = null;
      retryModeRef.current = null;
      lastConfirmedCloudSnapshotRef.current = null;
      setSyncState(createLocalOnlyState());
      return undefined;
    }

    const client = getSupabaseClient();
    if (!client) {
      resetActiveAppRepository();
      setReadyUserId(null);
      setRepositoryRevision(0);
      localRepositoryRef.current = null;
      cloudGatewayRef.current = null;
      mutationQueueRef.current = null;
      retryModeRef.current = null;
      lastConfirmedCloudSnapshotRef.current = null;
      setSyncState({
        phase: 'failed',
        message: 'Cloud sync is configured, but the Supabase client could not be created.',
        lastSyncedAt: null,
        lastErrorAt: new Date().toISOString(),
        pendingWrites: 0,
        canRetry: false,
      });
      return undefined;
    }

    let isMounted = true;
    setReadyUserId(null);
    setRepositoryRevision(0);
    retryModeRef.current = null;
    setSyncState({
      phase: 'preparing',
      message: PREPARING_MESSAGE,
      lastSyncedAt: null,
      lastErrorAt: null,
      pendingWrites: 0,
      canRetry: false,
    });

    const localRepository = createUserScopedLocalStorageRepository(userId);
    const cloudGateway = createSupabaseCloudGateway(client, userId);
    const mutationQueue = createCloudMutationQueue(userId);
    localRepositoryRef.current = localRepository;
    cloudGatewayRef.current = cloudGateway;
    mutationQueueRef.current = mutationQueue;
    const cloudBackedRepository = createCloudBackedRepository({
      localRepository,
      cloudGateway,
      onSyncStart() {
        if (!isMounted) return;
        if (mutationQueue.count() > 0) {
          mutationQueue.enqueueSnapshot(localRepository.getSnapshot({ versionFallback: '0.2' }));
          retryModeRef.current = 'queuedWrite';
        }
        setSyncState((current) => ({
          ...current,
          pendingWrites: current.pendingWrites + 1,
          phase: current.phase === 'failed' || current.phase === 'queued' || current.phase === 'conflict'
            ? current.phase
            : 'syncing',
          message: current.phase === 'failed' || current.phase === 'queued' || current.phase === 'conflict'
            ? current.message
            : SYNCING_MESSAGE,
          canRetry: current.phase === 'failed' || current.phase === 'queued' || current.phase === 'conflict'
            ? current.canRetry
            : false,
        }));
      },
      onSyncSuccess() {
        if (!isMounted) return;
        if (mutationQueue.count() === 0) {
          lastConfirmedCloudSnapshotRef.current = localRepository.getSnapshot({ versionFallback: '0.2' });
        }
        setSyncState((current) => {
          const pendingWrites = Math.max(0, current.pendingWrites - 1);

          if (current.phase === 'failed' || current.phase === 'queued' || current.phase === 'conflict') {
            return {
              ...current,
              pendingWrites,
            };
          }

          return {
            ...current,
            phase: pendingWrites > 0 ? 'syncing' : 'synced',
            message: pendingWrites > 0 ? SYNCING_MESSAGE : null,
            lastSyncedAt: new Date().toISOString(),
            pendingWrites,
            canRetry: false,
          };
        });
      },
      onSyncError(error) {
        if (!isMounted) return;
        retryModeRef.current = 'queuedWrite';
        const queuedMutation = mutationQueue.enqueueSnapshot(localRepository.getSnapshot({ versionFallback: '0.2' }), {
          baseSnapshot: lastConfirmedCloudSnapshotRef.current,
          error,
        });
        void recordMutationStatusSafely(cloudGateway, queuedMutation, 'failed', {
          lastErrorMessage: getSafeCloudErrorMessage(error),
        });
        trackEvent('sync_error_seen', { area: 'repository_write' });
        reportError(error, 'cloud_sync_failed');
        setSyncState((current) => ({
          ...current,
          phase: 'queued',
          message: getFailureMessage('queuedWrite'),
          lastErrorAt: new Date().toISOString(),
          pendingWrites: Math.max(1, current.pendingWrites - 1),
          canRetry: true,
        }));
      },
    });

    setActiveAppRepository(cloudBackedRepository);

    const prepareRepository = async () => {
      const queuedMutation = mutationQueue.get();
      if (queuedMutation) {
        localRepository.replaceSnapshot(queuedMutation.snapshot);
        retryModeRef.current = 'queuedWrite';
      } else if (!hasMigratableLocalData(localRepository.getSnapshot({ versionFallback: '0.2' }))) {
        const hydratedSnapshot = await hydrateLocalCacheOrCreateStarterTemplate(localRepository, cloudGateway);
        lastConfirmedCloudSnapshotRef.current = hydratedSnapshot;
      }

      if (isMounted) {
        setReadyUserId(userId);
        const hasQueuedWrite = mutationQueue.count() > 0;
        setSyncState((current) => ({
          ...current,
          phase: hasQueuedWrite ? 'queued' : 'synced',
          message: hasQueuedWrite ? QUEUED_MESSAGE : null,
          lastSyncedAt: hasQueuedWrite ? current.lastSyncedAt : new Date().toISOString(),
          pendingWrites: hasQueuedWrite ? 1 : 0,
          canRetry: hasQueuedWrite,
        }));
      }
    };

    void prepareRepository().catch((error: unknown) => {
      retryModeRef.current = 'hydration';
      trackEvent('sync_error_seen', { area: 'initial_hydration' });
      reportError(error, 'cloud_hydration_failed');

      if (isMounted) {
        setReadyUserId(userId);
        setSyncState((current) => ({
          ...current,
          phase: 'failed',
          message: getFailureMessage('hydration'),
          lastErrorAt: new Date().toISOString(),
          pendingWrites: 0,
          canRetry: true,
        }));
      }
    });

    return () => {
      isMounted = false;
      resetActiveAppRepository();
      localRepositoryRef.current = null;
      cloudGatewayRef.current = null;
      mutationQueueRef.current = null;
      retryModeRef.current = null;
      lastConfirmedCloudSnapshotRef.current = null;
    };
  }, [auth.isCloudConfigured, auth.status, userId]);

  const hasActiveCloudSession = auth.isCloudConfigured && auth.status === 'signedIn' && Boolean(userId);
  const visibleStatus: CloudSyncStatus = !isOnline && hasActiveCloudSession ? 'offline' : syncState.phase;
  const contextValue = useMemo<CloudSyncContextValue>(() => ({
    status: visibleStatus,
    message: visibleStatus === 'offline' ? OFFLINE_MESSAGE : syncState.message,
    lastSyncedAt: syncState.lastSyncedAt,
    lastErrorAt: syncState.lastErrorAt,
    pendingWrites: syncState.pendingWrites,
    canRetry: visibleStatus === 'offline' ? false : syncState.canRetry,
    retry,
  }), [retry, syncState, visibleStatus]);

  const content = auth.isCloudConfigured && auth.status === 'signedIn' && userId && readyUserId !== userId
    ? (
      <div className="flex min-h-screen min-h-dvh items-center justify-center bg-ivory px-6">
        <div className="rounded-md border border-border bg-surface px-5 py-4 text-body text-text-secondary shadow-sm">
          {PREPARING_MESSAGE}
        </div>
      </div>
    )
    : <Fragment key={`${readyUserId ?? 'local'}-${repositoryRevision}`}>{children}</Fragment>;

  return (
    <CloudSyncContext.Provider value={contextValue}>
      {content}
    </CloudSyncContext.Provider>
  );
}

function getIsOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function getFailureMessage(mode: CloudSyncRetryMode): string {
  if (!getIsOnline()) {
    return OFFLINE_MESSAGE;
  }

  if (mode === 'hydration') {
    return 'Cloud data could not be refreshed. You may be seeing cached data.';
  }

  return QUEUED_MESSAGE;
}

interface MutationStatusOptions {
  completedAt?: string;
  conflictReason?: string;
  lastErrorMessage?: string;
}

async function recordMutationStatusSafely(
  cloudGateway: CloudDataGateway,
  mutation: QueuedCloudMutation,
  status: CloudMutationStatus,
  options: MutationStatusOptions = {},
): Promise<void> {
  try {
    await cloudGateway.recordMutationStatus({
      clientMutationId: mutation.clientMutationId,
      mutationType: mutation.type,
      status,
      attemptCount: getTrackedAttemptCount(mutation, status),
      lastErrorMessage: options.lastErrorMessage ?? mutation.lastErrorMessage ?? null,
      metadata: {
        queuedAt: mutation.createdAt,
        updatedAt: mutation.updatedAt,
        lastAttemptAt: mutation.lastAttemptAt ?? null,
        hasBaseSnapshot: Boolean(mutation.baseSnapshot),
        snapshotVersion: mutation.snapshot.version,
        conflictReason: options.conflictReason ?? null,
      },
      completedAt: options.completedAt ?? null,
    });
  } catch (error) {
    reportError(error, 'cloud_mutation_status_failed');
  }
}

function getTrackedAttemptCount(
  mutation: QueuedCloudMutation,
  status: CloudMutationStatus,
): number {
  if (status === 'running' || status === 'succeeded' || status === 'conflict') {
    return mutation.attemptCount + 1;
  }

  return Math.max(1, mutation.attemptCount);
}

function getSafeCloudErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const trimmed = message.trim();

  if (!trimmed) {
    return 'Cloud sync failed.';
  }

  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}
