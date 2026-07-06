import { describe, expect, it } from 'vitest';
import {
  CLOUD_SYNC_ACTION_LABELS,
  getCloudSyncActionLabel,
  getCloudSyncStatusLabel,
  isCloudSyncInProgressStatus,
  isCloudSyncProblemStatus,
} from './cloudSyncStatusCopy';

describe('cloud sync status copy', () => {
  it('uses consistent user-facing status labels', () => {
    expect(getCloudSyncStatusLabel('localOnly')).toBe('Local only');
    expect(getCloudSyncStatusLabel('preparing')).toBe('Syncing');
    expect(getCloudSyncStatusLabel('synced')).toBe('Synced');
    expect(getCloudSyncStatusLabel('syncing')).toBe('Syncing');
    expect(getCloudSyncStatusLabel('queued')).toBe('Needs retry');
    expect(getCloudSyncStatusLabel('conflict')).toBe('Needs review');
    expect(getCloudSyncStatusLabel('offline')).toBe('Offline');
    expect(getCloudSyncStatusLabel('failed')).toBe('Needs retry');
    expect(getCloudSyncStatusLabel('retrying')).toBe('Syncing');
  });

  it('classifies problem and in-progress states', () => {
    expect(isCloudSyncProblemStatus('failed')).toBe(true);
    expect(isCloudSyncProblemStatus('queued')).toBe(true);
    expect(isCloudSyncProblemStatus('conflict')).toBe(true);
    expect(isCloudSyncProblemStatus('offline')).toBe(true);
    expect(isCloudSyncProblemStatus('synced')).toBe(false);

    expect(isCloudSyncInProgressStatus('preparing')).toBe(true);
    expect(isCloudSyncInProgressStatus('syncing')).toBe(true);
    expect(isCloudSyncInProgressStatus('retrying')).toBe(true);
    expect(isCloudSyncInProgressStatus('failed')).toBe(false);
  });

  it('standardizes action labels', () => {
    expect(CLOUD_SYNC_ACTION_LABELS.refresh).toBe('Refresh cloud data');
    expect(getCloudSyncActionLabel('failed')).toBe('Retry sync');
    expect(getCloudSyncActionLabel('queued')).toBe('Retry sync');
    expect(getCloudSyncActionLabel('conflict')).toBe('Review conflict');
    expect(getCloudSyncActionLabel('synced')).toBeNull();
  });
});
