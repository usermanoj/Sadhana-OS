import { useEffect, useMemo, useState } from 'react';
import { Chrome, KeyRound, Link2, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import {
  getAuthCooldownRemainingSeconds,
  startAuthCooldown,
  type AuthEmailAction,
} from '../../lib/authCooldown';
import { getFriendlyAuthError } from '../../lib/authErrors';

type FormStatus = {
  tone: 'success' | 'error';
  message: string;
} | null;

type PasswordMode = 'signIn' | 'signUp';
type PendingAction = 'google' | 'password' | AuthEmailAction | null;

const getPasswordActionLabel = (mode: PasswordMode): string =>
  mode === 'signIn' ? 'Sign In' : 'Create Account';

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function AuthScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<PasswordMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<FormStatus>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const trimmedEmail = email.trim();
  const magicLinkCooldown = useMemo(
    () => getAuthCooldownRemainingSeconds('magic-link', trimmedEmail, now),
    [trimmedEmail, now],
  );
  const passwordResetCooldown = useMemo(
    () => getAuthCooldownRemainingSeconds('password-reset', trimmedEmail, now),
    [trimmedEmail, now],
  );

  const requireEmail = (): boolean => {
    if (!trimmedEmail) {
      setStatus({ tone: 'error', message: 'Enter your email address.' });
      return false;
    }
    if (!isValidEmail(trimmedEmail)) {
      setStatus({ tone: 'error', message: 'Enter a valid email address.' });
      return false;
    }
    return true;
  };

  const submitProvider = async (provider: 'google') => {
    try {
      setPendingAction(provider);
      setStatus(null);
      await auth.signInWithProvider(provider);
    } catch (error) {
      console.warn('Auth provider sign-in failed', error);
      setStatus({ tone: 'error', message: getFriendlyAuthError(error) });
    } finally {
      setPendingAction(null);
    }
  };

  const submitPassword = async () => {
    if (!requireEmail()) return;
    if (password.length < 8) {
      setStatus({ tone: 'error', message: 'Use at least 8 characters.' });
      return;
    }

    try {
      setPendingAction('password');
      setStatus(null);
      if (mode === 'signIn') {
        await auth.signInWithPassword(trimmedEmail, password);
      } else {
        await auth.signUpWithPassword(trimmedEmail, password);
        setStatus({
          tone: 'success',
          message: 'Check your email to confirm your account.',
        });
      }
    } catch (error) {
      console.warn('Password auth failed', error);
      setStatus({ tone: 'error', message: getFriendlyAuthError(error) });
    } finally {
      setPendingAction(null);
    }
  };

  const submitEmailAction = async (action: AuthEmailAction) => {
    if (!requireEmail()) return;

    const remaining = getAuthCooldownRemainingSeconds(action, trimmedEmail);
    if (remaining > 0) {
      setStatus({
        tone: 'error',
        message: `Please wait ${remaining} seconds before requesting another email.`,
      });
      return;
    }

    try {
      setPendingAction(action);
      setStatus(null);
      if (action === 'magic-link') {
        await auth.sendMagicLink(trimmedEmail);
        startAuthCooldown('magic-link', trimmedEmail);
        setStatus({ tone: 'success', message: 'Check your email for the sign-in link.' });
      } else {
        await auth.sendPasswordReset(trimmedEmail);
        startAuthCooldown('password-reset', trimmedEmail);
        setStatus({ tone: 'success', message: 'Check your email for the password reset link.' });
      }
      setNow(Date.now());
    } catch (error) {
      console.warn('Auth email action failed', error);
      setStatus({ tone: 'error', message: getFriendlyAuthError(error) });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh bg-ivory px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-center gap-6">
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
              <Sparkles size={24} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-3">
              <p className="text-caption font-medium uppercase tracking-[0.08em] text-text-secondary">
                Sadhana OS
              </p>
              <h1 className="max-w-2xl text-[2rem] font-semibold leading-tight text-text-primary sm:text-[2.5rem] lg:text-[3rem]">
                A quiet home for daily practice.
              </h1>
              <p className="max-w-xl text-body text-text-secondary lg:text-subheading">
                Track, reflect, and keep your practice history safely with your account.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-5 lg:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-secondary/15 text-amber-700">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-subheading text-text-primary">Sign in</h2>
                <p className="text-caption text-text-secondary">Choose a secure account method.</p>
              </div>
            </div>

            {!auth.isCloudConfigured ? (
              <div className="rounded-md border border-border bg-muted/50 p-4 text-body text-text-secondary">
                Cloud accounts are not configured for this environment.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void submitProvider('google');
                    }}
                    disabled={pendingAction !== null}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm disabled:opacity-60"
                  >
                    <Chrome size={18} aria-hidden="true" />
                    {pendingAction === 'google' ? 'Opening Google' : 'Continue with Google'}
                  </button>
                </div>

                <div className="flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-caption text-text-secondary">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-2 gap-1 rounded-md bg-muted/60 p-1" aria-label="Email auth mode">
                  {(['signIn', 'signUp'] as PasswordMode[]).map((nextMode) => (
                    <button
                      key={nextMode}
                      type="button"
                      onClick={() => {
                        setMode(nextMode);
                        setStatus(null);
                      }}
                      className={`min-h-[40px] rounded-md px-3 text-body font-medium ${
                        mode === nextMode
                          ? 'bg-surface text-text-primary shadow-sm'
                          : 'text-text-secondary'
                      }`}
                    >
                      {getPasswordActionLabel(nextMode)}
                    </button>
                  ))}
                </div>

                <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="auth-email">
                  Email
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-[44px] rounded-md border border-border bg-ivory px-3 text-body text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>

                <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="auth-password">
                  Password
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-[44px] rounded-md border border-border bg-ivory px-3 text-body text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    void submitPassword();
                  }}
                  disabled={pendingAction !== null}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm disabled:opacity-60"
                >
                  <KeyRound size={18} aria-hidden="true" />
                  {pendingAction === 'password' ? 'Working' : getPasswordActionLabel(mode)}
                </button>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset((value) => !value);
                      setShowMagicLink(false);
                      setStatus(null);
                    }}
                    className="text-left text-caption font-medium text-accent-primary"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMagicLink((value) => !value);
                      setShowPasswordReset(false);
                      setStatus(null);
                    }}
                    className="text-left text-caption font-medium text-accent-primary"
                  >
                    Use magic link instead
                  </button>
                </div>

                {showPasswordReset ? (
                  <EmailActionPanel
                    action="password-reset"
                    icon={Mail}
                    title="Reset Password"
                    cooldown={passwordResetCooldown}
                    pendingAction={pendingAction}
                    onSubmit={submitEmailAction}
                  />
                ) : null}

                {showMagicLink ? (
                  <EmailActionPanel
                    action="magic-link"
                    icon={Link2}
                    title="Send Magic Link"
                    cooldown={magicLinkCooldown}
                    pendingAction={pendingAction}
                    onSubmit={submitEmailAction}
                  />
                ) : null}

                {status ? <StatusMessage status={status} /> : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

interface EmailActionPanelProps {
  action: AuthEmailAction;
  icon: typeof Mail;
  title: string;
  cooldown: number;
  pendingAction: PendingAction;
  onSubmit: (action: AuthEmailAction) => Promise<void>;
}

function EmailActionPanel({
  action,
  icon: Icon,
  title,
  cooldown,
  pendingAction,
  onSubmit,
}: EmailActionPanelProps) {
  const isPending = pendingAction === action;
  const isDisabled = pendingAction !== null || cooldown > 0;

  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <button
        type="button"
        onClick={() => {
          void onSubmit(action);
        }}
        disabled={isDisabled}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-text-primary shadow-sm disabled:opacity-60"
      >
        <Icon size={18} aria-hidden="true" />
        {isPending ? 'Sending' : cooldown > 0 ? `Wait ${cooldown}s` : title}
      </button>
    </div>
  );
}

function StatusMessage({ status }: { status: NonNullable<FormStatus> }) {
  return (
    <p
      role="status"
      className={`rounded-md border px-3 py-2 text-body ${
        status.tone === 'success'
          ? 'border-accent-success/20 bg-accent-success/10 text-green-700'
          : 'border-accent-danger/20 bg-accent-danger/10 text-red-700'
      }`}
    >
      {status.message}
    </p>
  );
}
