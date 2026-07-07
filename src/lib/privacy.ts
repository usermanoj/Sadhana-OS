import type { SupabaseClient } from '@supabase/supabase-js';

export interface AccountDeletionResult {
  requestedAt: string;
}

export const ACCOUNT_DELETION_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

export const accountDeletionSafetyNotice =
  'Export a JSON backup before requesting deletion. Cloud account data is removed by the server-side deletion flow; provider backup and legal retention windows may still apply. Local browser data remains on this device until cleared separately.';

export async function requestCloudAccountDeletion(
  client: SupabaseClient,
): Promise<AccountDeletionResult> {
  const { data, error } = await client.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    throw error;
  }

  return {
    requestedAt: typeof data?.requestedAt === 'string'
      ? data.requestedAt
      : new Date().toISOString(),
  };
}

export const privateContentAnalyticsNotice =
  'Journal content, habit names, category names, and practice values must not be sent to analytics.';

export function canRequestAccountDeletion({
  backupAcknowledged,
  confirmationText,
}: {
  backupAcknowledged: boolean;
  confirmationText: string;
}): boolean {
  return backupAcknowledged
    && confirmationText.trim() === ACCOUNT_DELETION_CONFIRMATION_PHRASE;
}
