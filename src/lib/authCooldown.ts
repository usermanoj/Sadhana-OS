export type AuthEmailAction = 'magic-link' | 'password-reset';

export const AUTH_EMAIL_COOLDOWN_MS = 60_000;

const PREFIX = 'sadhana:auth-cooldown:';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const keyFor = (action: AuthEmailAction, email: string): string =>
  `${PREFIX}${action}:${normalizeEmail(email)}`;

export function startAuthCooldown(
  action: AuthEmailAction,
  email: string,
  now = Date.now(),
  durationMs = AUTH_EMAIL_COOLDOWN_MS,
): void {
  if (!normalizeEmail(email)) return;
  localStorage.setItem(keyFor(action, email), String(now + durationMs));
}

export function getAuthCooldownRemainingSeconds(
  action: AuthEmailAction,
  email: string,
  now = Date.now(),
): number {
  if (!normalizeEmail(email)) return 0;

  const rawValue = localStorage.getItem(keyFor(action, email));
  const expiresAt = rawValue ? Number(rawValue) : 0;

  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return 0;
  }

  return Math.ceil((expiresAt - now) / 1000);
}
