import { useState } from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { downloadJSON, exportJSON } from '../../lib/export';
import { requestCloudAccountDeletion } from '../../lib/privacy';
import { getSupabaseClient } from '../../lib/supabaseClient';

type StatusMessage = {
  tone: 'success' | 'error';
  text: string;
} | null;

export default function PrivacyScreen() {
  const auth = useAuth();
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const exportBackup = () => {
    try {
      downloadJSON(exportJSON());
      setStatus({ tone: 'success', text: 'JSON backup exported.' });
    } catch {
      setStatus({ tone: 'error', text: 'JSON export failed.' });
    }
  };

  const requestDeletion = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setStatus({ tone: 'error', text: 'Cloud account deletion is not configured.' });
      return;
    }

    try {
      setIsDeleting(true);
      const result = await requestCloudAccountDeletion(client);
      setStatus({
        tone: 'success',
        text: `Account deletion requested at ${new Date(result.requestedAt).toLocaleString()}.`,
      });
      await auth.signOut().catch(() => undefined);
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Account deletion request failed.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex flex-col gap-4" aria-label="Privacy">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary lg:h-11 lg:w-11">
          <ShieldCheck size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-heading text-text-primary">Privacy</h2>
          <p className="text-caption text-text-secondary">Export, retention, and account controls</p>
        </div>
      </div>

      <div className="max-w-4xl rounded-md border border-border bg-surface p-4 shadow-sm lg:p-5">
        <h3 className="text-subheading text-text-primary">Portable Data</h3>
        <p className="mt-1 text-body text-text-secondary">
          JSON export includes tracker configuration, daily entries, journal entries, and audit history.
        </p>
        <button
          type="button"
          onClick={exportBackup}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm sm:w-auto"
        >
          <Download size={18} aria-hidden="true" />
          Export JSON Backup
        </button>
      </div>

      <div className="max-w-4xl rounded-md border border-border bg-surface p-4 shadow-sm lg:p-5">
        <h3 className="text-subheading text-text-primary">Account Deletion</h3>
        {!auth.isCloudConfigured ? (
          <p className="mt-1 text-body text-text-secondary">
            Cloud accounts are not configured in this environment.
          </p>
        ) : auth.status !== 'signedIn' ? (
          <p className="mt-1 text-body text-text-secondary">
            Sign in before requesting account deletion.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-body text-text-secondary">
              This requests deletion of your cloud account and cloud data. Your local browser data is not cleared automatically.
            </p>
            <label className="flex items-start gap-3 text-body text-text-primary">
              <input
                type="checkbox"
                checked={confirmDeletion}
                onChange={(event) => setConfirmDeletion(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-accent-primary focus:ring-accent-primary"
              />
              I understand this deletes my cloud account.
            </label>
            <button
              type="button"
              onClick={() => {
                void requestDeletion();
              }}
              disabled={!confirmDeletion || isDeleting}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-accent-danger/30 bg-accent-danger px-4 py-2 text-body font-medium text-white shadow-sm disabled:opacity-50 sm:w-auto"
            >
              <Trash2 size={18} aria-hidden="true" />
              {isDeleting ? 'Requesting Deletion' : 'Request Account Deletion'}
            </button>
          </div>
        )}
      </div>

      {status ? (
        <p
          role="status"
          className={`rounded-md border px-4 py-3 text-body shadow-sm ${
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
