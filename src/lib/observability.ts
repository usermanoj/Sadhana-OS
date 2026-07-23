export type AnalyticsEventName =
  | 'sign_in_succeeded'
  | 'auth_bootstrap_retry_requested'
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

export type ErrorSeverity = 'warning' | 'error' | 'fatal';

export interface ErrorReport {
  context: string;
  message: string;
  name: string;
  severity: ErrorSeverity;
  tags: Record<string, string>;
  timestamp: string;
}

export interface ObservabilityClient {
  trackEvent?: (event: AnalyticsEvent) => void;
  captureError?: (report: ErrorReport) => void;
}

export interface ReportErrorOptions {
  severity?: ErrorSeverity;
  tags?: Record<string, string | number | boolean | null | undefined>;
}

const allowedEvents: AnalyticsEventName[] = [
  'sign_in_succeeded',
  'auth_bootstrap_retry_requested',
  'onboarding_completed',
  'local_migration_started',
  'local_migration_succeeded',
  'local_migration_failed',
  'sync_error_seen',
  'export_json_started',
  'account_deletion_requested',
];

const privateKeyPattern = /(journal|content|habit|category|practice|reflection|gratitude|insight|trigger|lesson|value|email|user|token|secret|password|session|jwt|key)/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const bearerTokenPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;
const jwtPattern = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const urlQueryPattern = /([?&])[^=\s]+=[^&\s]+/g;
const maxStringLength = 180;
const maxContextLength = 80;

let observabilityClient: ObservabilityClient | null = null;
let runtimeTeardown: (() => void) | null = null;

export function isAllowedAnalyticsEvent(name: string): name is AnalyticsEventName {
  return allowedEvents.includes(name as AnalyticsEventName);
}

export function setObservabilityClient(client: ObservabilityClient | null): void {
  observabilityClient = client;
}

export function initializeObservability(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  if (runtimeTeardown) return runtimeTeardown;

  const handleError = (event: ErrorEvent) => {
    reportError(event.error ?? event.message, 'runtime_error', {
      severity: 'fatal',
      tags: {
        source: 'window_error',
      },
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    reportError(event.reason, 'unhandled_promise_rejection', {
      severity: 'error',
      tags: {
        source: 'unhandled_rejection',
      },
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  runtimeTeardown = () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    runtimeTeardown = null;
  };

  return runtimeTeardown;
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

  safelyNotifyAnalyticsClient(event);
}

export function createErrorReport(
  error: unknown,
  context: string,
  options: ReportErrorOptions = {},
): ErrorReport {
  return {
    context: sanitizeContext(context),
    message: sanitizeErrorMessage(error),
    name: error instanceof Error ? sanitizeString(error.name || 'Error') : 'Error',
    severity: options.severity ?? 'error',
    tags: sanitizeTags(options.tags),
    timestamp: new Date().toISOString(),
  };
}

export function reportError(
  error: unknown,
  context: string,
  options: ReportErrorOptions = {},
): void {
  const report = createErrorReport(error, context, options);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sadhana:error', {
      detail: report,
    }));
  }

  safelyNotifyErrorClient(report);
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

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  return value;
}

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return sanitizeString(error.message || error.name || 'Unexpected error');
  }

  return sanitizeString(String(error || 'Unexpected error'));
}

function sanitizeContext(context: string): string {
  return sanitizeString(context).slice(0, maxContextLength);
}

function sanitizeTags(tags: ReportErrorOptions['tags'] = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tags)
      .filter(([key, value]) => value !== null && value !== undefined && !privateKeyPattern.test(key))
      .map(([key, value]) => [key, sanitizeString(String(value))]),
  );
}

function sanitizeString(value: string): string {
  const redacted = value
    .replace(emailPattern, '[redacted-email]')
    .replace(uuidPattern, '[redacted-id]')
    .replace(bearerTokenPattern, 'Bearer [redacted-token]')
    .replace(jwtPattern, '[redacted-token]')
    .replace(urlQueryPattern, '$1[redacted]=[redacted]');

  return redacted.length > maxStringLength
    ? `${redacted.slice(0, maxStringLength - 3)}...`
    : redacted;
}

function safelyNotifyAnalyticsClient(event: AnalyticsEvent): void {
  if (!observabilityClient?.trackEvent) return;

  try {
    observabilityClient.trackEvent(event);
  } catch (error) {
    console.warn('Observability client notification failed', error);
  }
}

function safelyNotifyErrorClient(report: ErrorReport): void {
  if (!observabilityClient?.captureError) return;

  try {
    observabilityClient.captureError(report);
  } catch (error) {
    console.warn('Observability client notification failed', error);
  }
}
