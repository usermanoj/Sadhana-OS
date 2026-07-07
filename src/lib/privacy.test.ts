import {
  ACCOUNT_DELETION_CONFIRMATION_PHRASE,
  accountDeletionSafetyNotice,
  canRequestAccountDeletion,
  requestCloudAccountDeletion,
  privateContentAnalyticsNotice,
} from './privacy';

describe('privacy helpers', () => {
  it('documents private content analytics boundaries', () => {
    expect(privateContentAnalyticsNotice).toContain('Journal content');
    expect(privateContentAnalyticsNotice).toContain('must not be sent');
  });

  it('documents account deletion backup and retention boundaries', () => {
    expect(accountDeletionSafetyNotice).toContain('Export a JSON backup');
    expect(accountDeletionSafetyNotice).toContain('retention windows');
    expect(accountDeletionSafetyNotice).toContain('Local browser data remains');
  });

  it('requires backup acknowledgement and exact typed confirmation for account deletion', () => {
    expect(canRequestAccountDeletion({
      backupAcknowledged: false,
      confirmationText: ACCOUNT_DELETION_CONFIRMATION_PHRASE,
    })).toBe(false);

    expect(canRequestAccountDeletion({
      backupAcknowledged: true,
      confirmationText: 'delete my account',
    })).toBe(false);

    expect(canRequestAccountDeletion({
      backupAcknowledged: true,
      confirmationText: ` ${ACCOUNT_DELETION_CONFIRMATION_PHRASE} `,
    })).toBe(true);
  });

  it('requests account deletion through the Supabase Edge Function', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { requestedAt: '2026-06-01T00:00:00.000Z' },
      error: null,
    });

    const result = await requestCloudAccountDeletion({
      functions: { invoke },
    } as never);

    expect(invoke).toHaveBeenCalledWith('delete-account', { method: 'POST' });
    expect(result.requestedAt).toBe('2026-06-01T00:00:00.000Z');
  });
});
