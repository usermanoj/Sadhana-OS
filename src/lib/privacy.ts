import type { SupabaseClient } from '@supabase/supabase-js';

export interface AccountDeletionResult {
  requestedAt: string;
}

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
