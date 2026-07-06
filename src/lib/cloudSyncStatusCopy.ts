import type { CloudSyncStatus } from '../cloud/CloudSyncProvider';

export const CLOUD_SYNC_ACTION_LABELS = {
  retry: 'Retry sync',
  refresh: 'Refresh cloud data',
  reviewConflict: 'Review conflict',
} as const;

const statusLabels: Record<CloudSyncStatus, string> = {
  localOnly: 'Local only',
  preparing: 'Syncing',
  synced: 'Synced',
  syncing: 'Syncing',
  queued: 'Needs retry',
  conflict: 'Needs review',
  offline: 'Offline',
  failed: 'Needs retry',
  retrying: 'Syncing',
};

export function getCloudSyncStatusLabel(status: CloudSyncStatus): string {
  return statusLabels[status];
}

export function isCloudSyncProblemStatus(status: CloudSyncStatus): boolean {
  return status === 'failed'
    || status === 'offline'
    || status === 'queued'
    || status === 'conflict';
}

export function isCloudSyncInProgressStatus(status: CloudSyncStatus): boolean {
  return status === 'preparing'
    || status === 'syncing'
    || status === 'retrying';
}

export function getCloudSyncActionLabel(status: CloudSyncStatus): string | null {
  if (status === 'queued' || status === 'failed') {
    return CLOUD_SYNC_ACTION_LABELS.retry;
  }

  if (status === 'conflict') {
    return CLOUD_SYNC_ACTION_LABELS.reviewConflict;
  }

  return null;
}
