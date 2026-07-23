import {
  createErrorReport,
  createAnalyticsEvent,
  initializeObservability,
  isAllowedAnalyticsEvent,
  reportError,
  sanitizeTelemetryPayload,
  setObservabilityClient,
  trackEvent,
} from './observability';

describe('observability', () => {
  afterEach(() => {
    setObservabilityClient(null);
  });

  it('allows only approved analytics events', () => {
    expect(isAllowedAnalyticsEvent('local_migration_started')).toBe(true);
    expect(isAllowedAnalyticsEvent('auth_bootstrap_retry_requested')).toBe(true);
    expect(isAllowedAnalyticsEvent('journal_content_saved')).toBe(false);
  });

  it('redacts private practice content from telemetry payloads', () => {
    const payload = sanitizeTelemetryPayload({
      route: 'settings',
      journalContent: 'private words',
      habitName: 'Mantra',
      categoryName: 'Spiritual',
      email: 'person@example.com',
      userId: '6e6ccaac-eec6-4160-ab58-d90642977d53',
      nested: {
        value: true,
        status: 'ok',
        url: 'https://example.com/path?token=secret',
      },
    });

    expect(payload).toEqual({
      route: 'settings',
      nested: {
        status: 'ok',
        url: 'https://example.com/path?[redacted]=[redacted]',
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

  it('sends sanitized analytics events to the configured client', () => {
    const track = vi.fn();
    setObservabilityClient({ trackEvent: track });

    trackEvent('export_json_started', {
      route: 'settings',
      journalText: 'private',
      selectedEmail: 'person@example.com',
    });

    expect(track).toHaveBeenCalledWith(expect.objectContaining({
      name: 'export_json_started',
      payload: {
        route: 'settings',
      },
    }));
  });

  it('creates sanitized error reports', () => {
    const report = createErrorReport(
      new Error('Failed for person@example.com with id 6e6ccaac-eec6-4160-ab58-d90642977d53'),
      'cloud_sync_failed',
      {
        severity: 'fatal',
        tags: {
          area: 'cloud',
          userId: 'private-user',
        },
      },
    );

    expect(report).toEqual(expect.objectContaining({
      context: 'cloud_sync_failed',
      message: 'Failed for [redacted-email] with id [redacted-id]',
      name: 'Error',
      severity: 'fatal',
      tags: {
        area: 'cloud',
      },
    }));
    expect(Date.parse(report.timestamp)).not.toBeNaN();
  });

  it('dispatches sanitized errors and notifies the configured client', () => {
    const captureError = vi.fn();
    const listener = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.addEventListener('sadhana:error', listener);
    setObservabilityClient({ captureError });

    reportError(new Error('Token Bearer secret-value for person@example.com'), 'auth_callback_failed');

    expect(captureError).toHaveBeenCalledWith(expect.objectContaining({
      context: 'auth_callback_failed',
      message: 'Token Bearer [redacted-token] for [redacted-email]',
    }));
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({
        message: 'Token Bearer [redacted-token] for [redacted-email]',
      }),
    }));

    window.removeEventListener('sadhana:error', listener);
    consoleError.mockRestore();
  });

  it('captures global runtime errors once initialized', () => {
    const captureError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    setObservabilityClient({ captureError });
    const teardown = initializeObservability();

    window.dispatchEvent(new ErrorEvent('error', {
      error: new Error('Runtime failed for person@example.com'),
      message: 'Runtime failed for person@example.com',
    }));

    expect(captureError).toHaveBeenCalledWith(expect.objectContaining({
      context: 'runtime_error',
      message: 'Runtime failed for [redacted-email]',
      severity: 'fatal',
      tags: {
        source: 'window_error',
      },
    }));

    teardown();
    consoleError.mockRestore();
  });
});
