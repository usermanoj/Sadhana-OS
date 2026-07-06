import { AlertTriangle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useCloudSync } from '../../cloud/CloudSyncProvider';
import {
  getCloudSyncActionLabel,
  getCloudSyncStatusLabel,
  isCloudSyncProblemStatus,
} from '../../lib/cloudSyncStatusCopy';

export default function CloudSyncStatusBanner() {
  const sync = useCloudSync();

  if (sync.status === 'localOnly' || sync.status === 'synced') {
    return null;
  }

  const isProblem = isCloudSyncProblemStatus(sync.status);
  const Icon = sync.status === 'offline'
    ? CloudOff
    : isProblem
      ? AlertTriangle
      : sync.status === 'retrying'
        ? RefreshCw
        : Cloud;
  const actionLabel = getCloudSyncActionLabel(sync.status);

  return (
    <section
      aria-label="Cloud sync status"
      role={isProblem ? 'alert' : 'status'}
      className={`mb-4 flex flex-col gap-3 rounded-md border px-4 py-3 text-body shadow-sm sm:flex-row sm:items-center sm:justify-between ${
        isProblem
          ? 'border-accent-warning/30 bg-accent-warning/10 text-text-primary'
          : 'border-border bg-surface text-text-secondary'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
            isProblem ? 'bg-accent-warning/20 text-amber-700' : 'bg-accent-primary/10 text-accent-primary'
          }`}
        >
          <Icon
            size={17}
            aria-hidden="true"
            className={sync.status === 'retrying' ? 'motion-safe:animate-spin' : undefined}
          />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-text-primary">{getCloudSyncStatusLabel(sync.status)}</p>
          {sync.message ? (
            <p className="mt-0.5 text-caption text-text-secondary">{sync.message}</p>
          ) : null}
          {sync.pendingWrites > 0 ? (
            <p className="mt-0.5 text-caption text-text-secondary">
              {sync.pendingWrites} pending {sync.pendingWrites === 1 ? 'change' : 'changes'}
            </p>
          ) : null}
        </div>
      </div>

      {sync.canRetry && actionLabel ? (
        <button
          type="button"
          onClick={() => {
            void sync.retry();
          }}
          disabled={sync.status === 'retrying'}
          className="flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body font-medium text-text-primary shadow-sm disabled:opacity-60"
        >
          <RefreshCw size={16} aria-hidden="true" />
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
