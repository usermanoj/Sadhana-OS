import {
  createAnalyticsEvent,
  isAllowedAnalyticsEvent,
  sanitizeTelemetryPayload,
} from './observability';

describe('observability', () => {
  it('allows only approved analytics events', () => {
    expect(isAllowedAnalyticsEvent('local_migration_started')).toBe(true);
    expect(isAllowedAnalyticsEvent('journal_content_saved')).toBe(false);
  });

  it('redacts private practice content from telemetry payloads', () => {
    const payload = sanitizeTelemetryPayload({
      route: 'settings',
      journalContent: 'private words',
      habitName: 'Mantra',
      categoryName: 'Spiritual',
      nested: {
        value: true,
        status: 'ok',
      },
    });

    expect(payload).toEqual({
      route: 'settings',
      nested: {
        status: 'ok',
      },
    });
  });

  it('creates timestamped analytics events', () => {
    const event = createAnalyticsEvent('sync_error_seen', {
      status: 'failed',
      content: 'private',
    });

    expect(event.name).toBe('sync_error_seen');
    expect(event.payload).toEqual({ status: 'failed' });
    expect(Date.parse(event.timestamp)).not.toBeNaN();
  });
});
