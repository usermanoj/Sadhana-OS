import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  createUserScopedLocalStorageRepository,
  resetActiveAppRepository,
  setActiveAppRepository,
} from '../lib/repository';
import { createSupabaseCloudGateway } from '../lib/cloudRepository';
import { createCloudBackedRepository, hydrateLocalCacheOrCreateStarterTemplate } from '../lib/cloudSync';
import { getSupabaseClient } from '../lib/supabaseClient';
import { hasMigratableLocalData } from '../lib/localMigration';
import { reportError, trackEvent } from '../lib/observability';

interface CloudSyncProviderProps {
  children: ReactNode;
}

export default function CloudSyncProvider({ children }: CloudSyncProviderProps) {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const [readyUserId, setReadyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isCloudConfigured || auth.status !== 'signedIn' || !userId) {
      resetActiveAppRepository();
      setReadyUserId(null);
      return undefined;
    }

    const client = getSupabaseClient();
    if (!client) {
      resetActiveAppRepository();
      setReadyUserId(null);
      return undefined;
    }

    let isMounted = true;
    setReadyUserId(null);

    const localRepository = createUserScopedLocalStorageRepository(userId);
    const cloudGateway = createSupabaseCloudGateway(client, userId);
    const cloudBackedRepository = createCloudBackedRepository({
      localRepository,
      cloudGateway,
      onSyncError(error) {
        trackEvent('sync_error_seen', { area: 'repository_write' });
        reportError(error, 'cloud_sync_failed');
      },
    });

    setActiveAppRepository(cloudBackedRepository);

    const prepareRepository = async () => {
      if (!hasMigratableLocalData(localRepository.getSnapshot({ versionFallback: '0.2' }))) {
        await hydrateLocalCacheOrCreateStarterTemplate(localRepository, cloudGateway);
      }

      if (isMounted) {
        setReadyUserId(userId);
      }
    };

    void prepareRepository().catch((error: unknown) => {
      trackEvent('sync_error_seen', { area: 'initial_hydration' });
      reportError(error, 'cloud_hydration_failed');

      if (isMounted) {
        setReadyUserId(userId);
      }
    });

    return () => {
      isMounted = false;
      resetActiveAppRepository();
    };
  }, [auth.isCloudConfigured, auth.status, userId]);

  if (auth.isCloudConfigured && auth.status === 'signedIn' && userId && readyUserId !== userId) {
    return (
      <div className="flex min-h-screen min-h-dvh items-center justify-center bg-ivory px-6">
        <div className="rounded-md border border-border bg-surface px-5 py-4 text-body text-text-secondary shadow-sm">
          Preparing your private practice space...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
