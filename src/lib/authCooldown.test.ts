import {
  AUTH_EMAIL_COOLDOWN_MS,
  getAuthCooldownRemainingSeconds,
  startAuthCooldown,
} from './authCooldown';

describe('auth cooldown', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns zero when there is no cooldown', () => {
    expect(getAuthCooldownRemainingSeconds('magic-link', 'person@example.com', 1000)).toBe(0);
  });

  it('stores cooldowns by action and normalized email', () => {
    startAuthCooldown('magic-link', ' Person@Example.com ', 1000);

    expect(getAuthCooldownRemainingSeconds('magic-link', 'person@example.com', 1000)).toBe(
      AUTH_EMAIL_COOLDOWN_MS / 1000,
    );
    expect(getAuthCooldownRemainingSeconds('password-reset', 'person@example.com', 1000)).toBe(0);
  });

  it('counts down and expires', () => {
    startAuthCooldown('password-reset', 'person@example.com', 1000);

    expect(getAuthCooldownRemainingSeconds('password-reset', 'person@example.com', 31_000)).toBe(30);
    expect(getAuthCooldownRemainingSeconds('password-reset', 'person@example.com', 61_000)).toBe(0);
  });
});
