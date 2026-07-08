import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useCloudSync } from '../../cloud/CloudSyncProvider';
import { getAuthCooldownRemainingSeconds, startAuthCooldown } from '../../lib/authCooldown';
import { getFriendlyAuthError } from '../../lib/authErrors';
import {
  getCloudSyncActionLabel,
  getCloudSyncStatusLabel,
  isCloudSyncProblemStatus,
} from '../../lib/cloudSyncStatusCopy';
import LocalMigrationPanel from './LocalMigrationPanel';

type StatusMessage = {
  tone: 'success' | 'error';
  text: string;
} | null;

export default function AccountScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const sendMagicLink = async () => {
    if (!trimmedEmail) {
      setStatus({ tone: 'error', text: 'Enter your email address.' });
      return;
    }

    const remaining = getAuthCooldownRemainingSeconds('magic-link', trimmedEmail);
    if (remaining > 0) {
      setStatus({
        tone: 'error',
        text: `Please wait ${remaining} seconds before requesting another email.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await auth.sendMagicLink(trimmedEmail);
      startAuthCooldown('magic-link', trimmedEmail);
      setNow(Date.now());
      setStatus({ tone: 'success', text: 'Check your email for the sign-in link.' });
    } catch (error) {
      console.warn('Account magic-link sign-in failed', error);
      setStatus({
        tone: 'error',
        text: getFriendlyAuthError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auth.isCloudConfigured) {
    return (
      <section className="flex flex-col gap-4" aria-label="Account">
        <SectionHeader
          icon={CloudOff}
          title="Account"
          subtitle="Local-only mode"
        />
        <div className="sadhana-surface max-w-3xl p-4 text-body text-text-secondary lg:p-5">
          Cloud accounts are not configured in this environment. Your MVP data remains on this device and export/import stays available.
        </div>
        <div className="sadhana-surface-soft max-w-3xl p-4 text-caption text-text-secondary">
          Missing: {auth.missingConfigKeys.join(', ')}
        </div>
      </section>
    );
  }

  if (auth.status === 'signedIn' && auth.user) {
    return (
      <section className="flex flex-col gap-4" aria-label="Account">
        <SectionHeader
          icon={ShieldCheck}
          title="Account"
          subtitle="Cloud identity"
        />

        <div className="sadhana-surface p-4 lg:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
                <UserRound size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-subheading text-text-primary">
                  {auth.profile?.displayName || auth.user.email || 'Signed in'}
                </h2>
                <p className="truncate text-caption text-text-secondary">{auth.user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void auth.signOut().catch((error: unknown) => {
                  setStatus({
                    tone: 'error',
                    text: error instanceof Error ? error.message : 'Sign out failed.',
                  });
                });
              }}
              className="sadhana-button-secondary"
            >
              <LogOut size={18} aria-hidden="true" />
              Sign Out
            </button>
          </div>

          <CloudSyncAccountPanel />

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <AccountField label="Account Status" value={auth.status === 'signedIn' ? 'Signed in' : auth.status} />
            <AccountField label="Timezone" value={auth.profile?.timezone ?? 'UTC'} />
            <AccountField label="Week Starts On" value={formatWeekStart(auth.profile?.weekStartsOn ?? 1)} />
            <AccountField
              label="Onboarding"
              value={auth.profile?.onboardingCompletedAt ? 'Complete' : 'Pending'}
            />
          </dl>
        </div>

        <LocalMigrationPanel />

        {status ? <StatusBanner status={status} /> : null}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Account">
      <SectionHeader
        icon={Mail}
        title="Account"
        subtitle="Sign in to enable cloud sync"
      />

      <div className="sadhana-surface p-4 lg:p-5">
        <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="account-email">
          Email
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="sadhana-input"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            void sendMagicLink();
          }}
          disabled={isSubmitting || magicLinkCooldown > 0}
          className="sadhana-button-primary mt-3 w-full sm:w-auto"
        >
          <Mail size={18} aria-hidden="true" />
          {isSubmitting ? 'Sending Link' : magicLinkCooldown > 0 ? `Wait ${magicLinkCooldown}s` : 'Send Sign-In Link'}
        </button>
      </div>

      {status ? <StatusBanner status={status} /> : null}
    </section>
  );
}

interface SectionHeaderProps {
  icon: typeof ShieldCheck;
  title: string;
  subtitle: string;
}

function SectionHeader({ icon: Icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary lg:h-11 lg:w-11">
        <Icon size={21} aria-hidden="true" />
      </span>
      <div>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          Account & Sync
        </p>
        <h2 className="mt-1 text-heading text-text-primary">{title}</h2>
        <p className="text-caption text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <div className="sadhana-surface-soft px-3 py-2">
      <dt className="text-caption font-medium text-text-secondary">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-body text-text-primary">
        <CheckCircle2 size={16} className="text-accent-success" aria-hidden="true" />
        {value}
      </dd>
    </div>
  );
}

function CloudSyncAccountPanel() {
  const sync = useCloudSync();
  const isProblem = isCloudSyncProblemStatus(sync.status);
  const Icon = sync.status === 'offline'
    ? CloudOff
    : isProblem
      ? AlertTriangle
      : sync.status === 'retrying'
        ? RefreshCw
        : Cloud;
  const actionLabel = getCloudSyncActionLabel(sync.status);

  return (
    <div
      aria-label="Cloud sync"
      role={isProblem ? 'alert' : 'status'}
      className={`mt-5 rounded-md border px-3 py-3 shadow-card ${
        isProblem
          ? 'border-accent-warning/30 bg-accent-warning/10'
          : 'border-border bg-muted/50'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
              isProblem ? 'bg-accent-warning/20 text-amber-700' : 'bg-accent-primary/10 text-accent-primary'
            }`}
          >
            <Icon
              size={18}
              aria-hidden="true"
              className={sync.status === 'retrying' ? 'motion-safe:animate-spin' : undefined}
            />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-medium text-text-secondary">Cloud sync</p>
            <p className="mt-1 text-body font-medium text-text-primary">
              {getCloudSyncStatusLabel(sync.status)}
            </p>
            {sync.message ? (
              <p className="mt-1 text-caption text-text-secondary">{sync.message}</p>
            ) : null}
            {sync.lastSyncedAt ? (
              <p className="mt-1 text-caption text-text-secondary">
                Last synced {formatSyncTimestamp(sync.lastSyncedAt)}
              </p>
            ) : null}
            {sync.pendingWrites > 0 ? (
              <p className="mt-1 text-caption text-text-secondary">
                {sync.pendingWrites} pending {sync.pendingWrites === 1 ? 'change' : 'changes'}
              </p>
            ) : null}
          </div>
        </div>

        {sync.canRetry && actionLabel ? (
          <button
            type="button"
            onClick={() => {
              void sync.retry();
            }}
            disabled={sync.status === 'retrying'}
            className="sadhana-button-secondary min-h-[40px] px-3"
          >
            <RefreshCw size={16} aria-hidden="true" />
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StatusBanner({ status }: { status: NonNullable<StatusMessage> }) {
  return (
    <p
      role="status"
      className={`rounded-md border px-4 py-3 text-body shadow-card ${
        status.tone === 'success'
          ? 'border-accent-success/20 bg-accent-success/10 text-green-700'
          : 'border-accent-danger/20 bg-accent-danger/10 text-red-700'
      }`}
    >
      {status.text}
    </p>
  );
}

function formatSyncTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatWeekStart(value: number): string {
  if (value === 0) return 'Sunday';
  if (value === 6) return 'Saturday';
  return 'Monday';
}
