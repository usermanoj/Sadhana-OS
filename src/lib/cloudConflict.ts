import type { AppStateSnapshot } from './repository';

export function hasCloudSnapshotChangedSinceBase(
  baseSnapshot: AppStateSnapshot | null | undefined,
  currentCloudSnapshot: AppStateSnapshot,
): boolean {
  if (!baseSnapshot) return false;

  return stableStringify(normalizeSnapshot(baseSnapshot))
    !== stableStringify(normalizeSnapshot(currentCloudSnapshot));
}

function normalizeSnapshot(snapshot: AppStateSnapshot): AppStateSnapshot | Omit<AppStateSnapshot, 'dailyPlans'> {
  if (snapshot.dailyPlans && Object.keys(snapshot.dailyPlans).length > 0) {
    return snapshot;
  }

  const snapshotWithoutEmptyPlans = { ...snapshot };
  delete snapshotWithoutEmptyPlans.dailyPlans;
  return snapshotWithoutEmptyPlans;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, sortValue(entryValue)]),
    );
  }

  return value;
}
