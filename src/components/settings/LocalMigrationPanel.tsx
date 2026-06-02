import { useMemo, useState } from 'react';
import { CloudUpload, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { createLocalStorageRepository } from '../../lib/repository';
import {
  createLocalMigrationPlan,
  hasMigratableLocalData,
  uploadLocalMigrationPlan,
  type LocalMigrationSummary,
} from '../../lib/localMigration';
import { getSupabaseClient } from '../../lib/supabaseClient';

type MigrationStatus = {
  tone: 'success' | 'error';
  text: string;
} | null;

export default function LocalMigrationPanel() {
  const auth = useAuth();
  const [status, setStatus] = useState<MigrationStatus>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const snapshot = useMemo(() => createLocalStorageRepository().getSnapshot(), []);
  const plan = useMemo(() => (
    auth.user ? createLocalMigrationPlan(snapshot, auth.user.id) : null
  ), [auth.user, snapshot]);

  if (!auth.isCloudConfigured || !auth.user || !hasMigratableLocalData(snapshot) || !plan) {
    return null;
  }

  const migrate = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setStatus({ tone: 'error', text: 'Cloud migration is not configured.' });
      return;
    }

    try {
      setIsMigrating(true);
      setStatus(null);
      await uploadLocalMigrationPlan(client, plan);
      setStatus({
        tone: 'success',
        text: 'Local data was copied to your cloud account. The local copy remains on this device.',
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Migration failed.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-sm lg:p-5" aria-label="Local data migration">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-secondary/15 text-amber-700">
            <Database size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-subheading text-text-primary">Local Data Migration</h2>
            <p className="mt-1 text-caption text-text-secondary">
              Copy this device's practice data to your cloud account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void migrate();
          }}
          disabled={isMigrating}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm disabled:opacity-60 sm:w-auto"
        >
          <CloudUpload size={18} aria-hidden="true" />
          {isMigrating ? 'Migrating' : 'Migrate Local Data'}
        </button>
      </div>

      <MigrationSummary summary={plan.summary} />

      <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-caption text-text-secondary">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent-success" aria-hidden="true" />
        <p>Migration uses merge mode and keeps your local backup untouched.</p>
      </div>

      {status ? (
        <p
          role="status"
          className={`mt-4 rounded-md border px-3 py-2 text-body ${
            status.tone === 'success'
              ? 'border-accent-success/20 bg-accent-success/10 text-green-700'
              : 'border-accent-danger/20 bg-accent-danger/10 text-red-700'
          }`}
        >
          {status.text}
        </p>
      ) : null}
    </section>
  );
}

function MigrationSummary({ summary }: { summary: LocalMigrationSummary }) {
  const items = [
    ['Categories', summary.categories],
    ['Practices', summary.habits],
    ['Daily Entries', summary.dailyEntries],
    ['Daily Values', summary.dailyHabitEntries],
    ['Journal Entries', summary.journalEntries],
    ['Audit Events', summary.auditLogs],
  ];

  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
          <dt className="text-caption font-medium text-text-secondary">{label}</dt>
          <dd className="mt-1 text-body font-medium tabular-nums text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
