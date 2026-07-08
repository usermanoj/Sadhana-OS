import { useState } from 'react';
import { AlertTriangle, Download, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { downloadJSON, exportJSON } from '../../lib/export';
import {
  ACCOUNT_DELETION_CONFIRMATION_PHRASE,
  accountDeletionSafetyNotice,
  canRequestAccountDeletion,
  requestCloudAccountDeletion,
} from '../../lib/privacy';
import { reportError, trackEvent } from '../../lib/observability';
import { getSupabaseClient } from '../../lib/supabaseClient';

type StatusMessage = {
  tone: 'success' | 'error';
  text: string;
} | null;

export default function PrivacyScreen() {
  const auth = useAuth();
  const [backupAcknowledged, setBackupAcknowledged] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState('');
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = canRequestAccountDeletion({
    backupAcknowledged,
    confirmationText: deletionConfirmation,
  });

  const exportBackup = () => {
    try {
      downloadJSON(exportJSON());
      setBackupAcknowledged(true);
      setStatus({ tone: 'success', text: 'JSON backup exported. Keep it somewhere safe before requesting account deletion.' });
    } catch (error) {
      reportError(error, 'privacy_json_export_failed');
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
      trackEvent('account_deletion_requested');
      setStatus({
        tone: 'success',
        text: `Account deletion requested at ${new Date(result.requestedAt).toLocaleString()}.`,
      });
      setBackupAcknowledged(false);
      setDeletionConfirmation('');
      await auth.signOut().catch(() => undefined);
    } catch (error) {
      reportError(error, 'account_deletion_request_failed');
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
        <span className="sadhana-icon-tile h-10 w-10 lg:h-11 lg:w-11">
          <ShieldCheck size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-heading text-text-primary">Privacy</h2>
          <p className="text-caption text-text-secondary">Export, retention, and account controls</p>
        </div>
      </div>

      <div className="sadhana-surface max-w-4xl p-4 lg:p-5">
        <h3 className="text-subheading text-text-primary">Portable Data</h3>
        <p className="mt-1 text-body text-text-secondary">
          JSON export includes tracker configuration, daily entries, journal entries, and audit history.
        </p>
        <p className="mt-2 text-caption text-text-secondary">
          Export a backup before account deletion if you want to keep a personal copy of your practice history.
        </p>
        <button
          type="button"
          onClick={exportBackup}
          className="sadhana-button-primary mt-4 w-full sm:w-auto"
        >
          <Download size={18} aria-hidden="true" />
          Export JSON Backup
        </button>
      </div>

      <div className="sadhana-surface max-w-4xl p-4 lg:p-5">
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
            <div className="flex items-start gap-3 rounded-md border border-accent-warning/30 bg-accent-warning/10 p-3 text-body text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{accountDeletionSafetyNotice}</p>
            </div>
            <label className="flex items-start gap-3 text-body text-text-primary">
              <input
                type="checkbox"
                checked={backupAcknowledged}
                onChange={(event) => setBackupAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-accent-primary focus:ring-accent-primary"
              />
              I have exported a backup, or I intentionally want to continue without one.
            </label>
            <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="account-deletion-confirmation">
              Type {ACCOUNT_DELETION_CONFIRMATION_PHRASE} to confirm
              <input
                id="account-deletion-confirmation"
                value={deletionConfirmation}
                onChange={(event) => setDeletionConfirmation(event.target.value)}
                autoComplete="off"
                className="sadhana-input focus:border-accent-danger/40 focus:ring-accent-danger/20"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                void requestDeletion();
              }}
              disabled={!canDelete || isDeleting}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-accent-danger/30 bg-accent-danger px-4 py-2 text-body font-medium text-white shadow-card transition-[opacity,box-shadow,transform] duration-150 hover:shadow-lifted focus-visible:ring-2 focus-visible:ring-accent-danger/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
          className={`rounded-md border px-4 py-3 text-body shadow-card ${
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
