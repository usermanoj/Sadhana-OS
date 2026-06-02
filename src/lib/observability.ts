export type AnalyticsEventName =
  | 'sign_in_succeeded'
  | 'onboarding_completed'
  | 'local_migration_started'
  | 'local_migration_succeeded'
  | 'local_migration_failed'
  | 'sync_error_seen'
  | 'export_json_started'
  | 'account_deletion_requested';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  payload: Record<string, unknown>;
  timestamp: string;
}

const allowedEvents: AnalyticsEventName[] = [
  'sign_in_succeeded',
  'onboarding_completed',
  'local_migration_started',
  'local_migration_succeeded',
  'local_migration_failed',
  'sync_error_seen',
  'export_json_started',
  'account_deletion_requested',
];

const privateKeyPattern = /(journal|content|habit|category|practice|reflection|gratitude|insight|trigger|lesson|value)/i;

export function isAllowedAnalyticsEvent(name: string): name is AnalyticsEventName {
  return allowedEvents.includes(name as AnalyticsEventName);
}

export function sanitizeTelemetryPayload(
  payload: Record<string, unknown> = {},
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([key]) => !privateKeyPattern.test(key))
      .map(([key, value]) => [key, sanitizeValue(value)]),
  );
}

export function createAnalyticsEvent(
  name: AnalyticsEventName,
  payload: Record<string, unknown> = {},
): AnalyticsEvent {
  return {
    name,
    payload: sanitizeTelemetryPayload(payload),
    timestamp: new Date().toISOString(),
  };
}

export function trackEvent(
  name: AnalyticsEventName,
  payload: Record<string, unknown> = {},
): void {
  const event = createAnalyticsEvent(name, payload);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sadhana:analytics', { detail: event }));
  }
}

export function reportError(error: unknown, context: string): void {
  const message = error instanceof Error ? error.message : String(error);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sadhana:error', {
      detail: {
        context,
        message,
        timestamp: new Date().toISOString(),
      },
    }));
  }

  console.error(context, error);
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => (
      typeof item === 'object' && item !== null
        ? sanitizeTelemetryPayload(item as Record<string, unknown>)
        : item
    ));
  }

  if (typeof value === 'object' && value !== null) {
    return sanitizeTelemetryPayload(value as Record<string, unknown>);
  }

  return value;
}
