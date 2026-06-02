import { requestCloudAccountDeletion, privateContentAnalyticsNotice } from './privacy';

describe('privacy helpers', () => {
  it('documents private content analytics boundaries', () => {
    expect(privateContentAnalyticsNotice).toContain('Journal content');
    expect(privateContentAnalyticsNotice).toContain('must not be sent');
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
