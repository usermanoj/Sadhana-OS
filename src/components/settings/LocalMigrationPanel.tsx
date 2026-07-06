import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudUpload, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useCloudSync } from '../../cloud/CloudSyncProvider';
import { createSupabaseCloudGateway, type CloudDataGateway } from '../../lib/cloudRepository';
import { createLocalStorageRepository, type AppStateSnapshot } from '../../lib/repository';
import {
  archiveDuplicateStarterTemplateRows,
  archiveCopiedLocalCustomCategories,
  createLocalMigrationPlan,
  createLocalMigrationPreview,
  findCopiedLocalCustomCategories,
  getLocalMigrationCompletion,
  getMigrationErrorMessage,
  hasCloudUserContent,
  hasMeaningfulLocalMigrationData,
  hasMigratableLocalData,
  recordLocalMigrationCompletion,
  uploadLocalMigrationPlan,
  type LocalMigrationSummary,
  type LocalMigrationPreview,
  type CopiedLocalCategory,
} from '../../lib/localMigration';
import { getSupabaseClient } from '../../lib/supabaseClient';

type MigrationStatus = {
  tone: 'success' | 'error';
  text: string;
} | null;

type MigrationReview = {
  cloudSnapshot: AppStateSnapshot;
  cloudHasUserContent: boolean;
  copiedLocalCustomCategories: CopiedLocalCategory[];
};

export default function LocalMigrationPanel() {
  const auth = useAuth();
  const cloudSync = useCloudSync();
  const [status, setStatus] = useState<MigrationStatus>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isPreparingReview, setIsPreparingReview] = useState(false);
  const [review, setReview] = useState<MigrationReview | null>(null);
  const snapshot = useMemo(() => createLocalStorageRepository().getSnapshot(), []);
  const preview = useMemo(() => createLocalMigrationPreview(snapshot), [snapshot]);
  const plan = useMemo(() => (
    auth.user ? createLocalMigrationPlan(snapshot, auth.user.id) : null
  ), [auth.user, snapshot]);
  const completion = useMemo(() => getLocalMigrationCompletion(preview.checksum), [preview.checksum]);

  if (
    !auth.isCloudConfigured
    || !auth.user
    || !hasMigratableLocalData(snapshot)
    || !hasMeaningfulLocalMigrationData(snapshot)
    || !plan
  ) {
    return null;
  }

  const currentUserId = auth.user.id;
  const completionBelongsToCurrentUser = completion?.userId === currentUserId;
  const completionBelongsToAnotherUser = Boolean(completion && completion.userId !== currentUserId);

  const prepareReview = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setStatus({ tone: 'error', text: 'Cloud migration is not configured.' });
      return;
    }

    try {
      setIsPreparingReview(true);
      setStatus(null);
      const cloudGateway = createSupabaseCloudGateway(client, currentUserId);
      const cloudSnapshot = await cloudGateway.loadSnapshot();
      setReview({
        cloudSnapshot,
        cloudHasUserContent: hasCloudUserContent(cloudSnapshot),
        copiedLocalCustomCategories: findCopiedLocalCustomCategories(snapshot, currentUserId, cloudSnapshot),
      });
    } catch (error) {
      console.error('Local data migration review failed', error);
      const message = getMigrationErrorMessage(error, 'Migration review failed.');
      setStatus({
        tone: 'error',
        text: message === 'Migration review failed.' ? message : `Migration review failed: ${message}`,
      });
    } finally {
      setIsPreparingReview(false);
    }
  };

  const migrate = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setStatus({ tone: 'error', text: 'Cloud migration is not configured.' });
      return;
    }

    if (!review) {
      await prepareReview();
      return;
    }

    if (review.cloudHasUserContent) {
      setStatus({
        tone: 'error',
        text: 'This cloud account already has practice data. Local backup merge is disabled to avoid mixing data between accounts.',
      });
      return;
    }

    try {
      const user = auth.user;
      if (!user) {
        setStatus({ tone: 'error', text: 'Sign in before migrating local data.' });
        return;
      }

      setIsMigrating(true);
      setStatus(null);
      const cloudGateway = createSupabaseCloudGateway(client, user.id);
      const existingCloudSnapshot = review.cloudSnapshot;
      const preUploadRepair = await repairStarterTemplateDuplicates(cloudGateway, existingCloudSnapshot);
      const uploadPlan = createLocalMigrationPlan(snapshot, user.id, {
        existingCloudSnapshot: preUploadRepair.snapshot,
      });
      const result = await uploadLocalMigrationPlan(client, uploadPlan);
      recordLocalMigrationCompletion({
        checksum: result.checksum,
        userId: user.id,
        importJobId: result.importJobId,
        completedAt: result.completedAt,
        summary: result.summary,
      });

      let archivedDuplicateCount = preUploadRepair.archivedDuplicateCount;
      try {
        const postUploadSnapshot = await cloudGateway.loadSnapshot();
        const postUploadRepair = await repairStarterTemplateDuplicates(cloudGateway, postUploadSnapshot);
        archivedDuplicateCount += postUploadRepair.archivedDuplicateCount;
      } catch (repairError) {
        console.warn('Starter-template duplicate repair after local migration failed', repairError);
      }

      let refreshedCloudCache = true;
      try {
        await cloudSync.refreshFromCloud();
      } catch (refreshError) {
        refreshedCloudCache = false;
        console.warn('Cloud cache refresh after local migration failed', refreshError);
      }

      setStatus({
        tone: 'success',
        text: refreshedCloudCache
          ? `Local data was copied to your cloud account.${archivedDuplicateCount > 0 ? ' Duplicate starter rows were archived.' : ''} Your cloud view has been refreshed. The local copy remains on this device.`
          : `Local data was copied to your cloud account.${archivedDuplicateCount > 0 ? ' Duplicate starter rows were archived.' : ''} Cloud refresh did not complete; use Retry sync if migrated data is not visible. The local copy remains on this device.`,
      });
      setReview(null);
    } catch (error) {
      console.error('Local data migration failed', error);
      const message = getMigrationErrorMessage(error);
      setStatus({
        tone: 'error',
        text: message === 'Migration failed.' ? message : `Migration failed: ${message}`,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const cleanupCopiedLocalCategories = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setStatus({ tone: 'error', text: 'Cloud cleanup is not configured.' });
      return;
    }

    if (!review || review.copiedLocalCustomCategories.length === 0) {
      setStatus({ tone: 'error', text: 'No copied local groups were found to archive.' });
      return;
    }

    try {
      setIsCleaningUp(true);
      setStatus(null);
      const cloudGateway = createSupabaseCloudGateway(client, currentUserId);
      const cleanup = archiveCopiedLocalCustomCategories(
        review.cloudSnapshot,
        review.copiedLocalCustomCategories,
      );
      await cloudGateway.saveCategories(cleanup.snapshot.categories);
      await cloudGateway.saveAuditLogs(cleanup.snapshot.auditLogs);
      await cloudSync.refreshFromCloud();
      setReview({
        cloudSnapshot: cleanup.snapshot,
        cloudHasUserContent: hasCloudUserContent(cleanup.snapshot),
        copiedLocalCustomCategories: [],
      });
      setStatus({
        tone: 'success',
        text: `${cleanup.archivedCategoryIds.length} copied local ${cleanup.archivedCategoryIds.length === 1 ? 'group was' : 'groups were'} archived. Your cloud view has been refreshed.`,
      });
    } catch (error) {
      console.error('Local migration cleanup failed', error);
      const message = getMigrationErrorMessage(error, 'Cleanup failed.');
      setStatus({
        tone: 'error',
        text: message === 'Cleanup failed.' ? message : `Cleanup failed: ${message}`,
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const isPrimaryActionBusy = isMigrating || isPreparingReview || isCleaningUp;
  const showPrimaryAction = !completionBelongsToAnotherUser
    && !completionBelongsToCurrentUser
    && (!review || !review.cloudHasUserContent);
  const primaryActionLabel = review ? 'Copy Reviewed Data' : 'Review Local Data';

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
              Review this device's old local backup before copying it to this cloud account.
            </p>
          </div>
        </div>

        {showPrimaryAction ? (
          <button
            type="button"
            onClick={() => {
              void migrate();
            }}
            disabled={isPrimaryActionBusy}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm disabled:opacity-60 sm:w-auto"
          >
            <CloudUpload size={18} aria-hidden="true" />
            {isMigrating ? 'Copying' : isPreparingReview ? 'Reviewing' : primaryActionLabel}
          </button>
        ) : null}
      </div>

      <MigrationSummary summary={preview.summary} />

      <MigrationPreviewDetails preview={preview} />

      {completionBelongsToAnotherUser ? (
        <MigrationGuardMessage
          tone="warning"
          text="This device backup was already copied to a different cloud account. It is not offered here to avoid mixing another account's local practice data into this one."
        />
      ) : null}

      {completionBelongsToCurrentUser ? (
        <MigrationGuardMessage
          tone="success"
          text="This device backup has already been copied to this cloud account. The original local backup remains on this device."
        />
      ) : null}

      {review && !completionBelongsToAnotherUser && !completionBelongsToCurrentUser ? (
        <MigrationReviewDetails
          preview={preview}
          cloudHasUserContent={review.cloudHasUserContent}
          copiedLocalCustomCategories={review.copiedLocalCustomCategories}
          onCancel={() => setReview(null)}
          onCleanup={() => {
            void cleanupCopiedLocalCategories();
          }}
          isMigrating={isPrimaryActionBusy}
        />
      ) : null}

      <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-caption text-text-secondary">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent-success" aria-hidden="true" />
        <p>Migration uses merge mode, keeps your local backup untouched, and should only be used for the account that owns this device backup.</p>
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

function MigrationPreviewDetails({ preview }: { preview: LocalMigrationPreview }) {
  const customCount = preview.customCategoryNames.length;

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-caption font-medium text-text-secondary">Starter Groups</p>
        <p className="mt-1 text-body font-medium tabular-nums text-text-primary">{preview.starterCategoryCount}</p>
      </div>
      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-caption font-medium text-text-secondary">Custom Groups</p>
        <p className="mt-1 text-body font-medium tabular-nums text-text-primary">{customCount}</p>
      </div>
    </div>
  );
}

function MigrationReviewDetails({
  preview,
  cloudHasUserContent,
  copiedLocalCustomCategories,
  onCancel,
  onCleanup,
  isMigrating,
}: {
  preview: LocalMigrationPreview;
  cloudHasUserContent: boolean;
  copiedLocalCustomCategories: CopiedLocalCategory[];
  onCancel: () => void;
  onCleanup: () => void;
  isMigrating: boolean;
}) {
  const visibleNames = preview.customCategoryNames.slice(0, 5);
  const extraCount = preview.customCategoryNames.length - visibleNames.length;
  const copiedNames = copiedLocalCustomCategories.map((category) => category.name);

  return (
    <div className="mt-4 rounded-md border border-accent-warning/30 bg-accent-warning/10 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-body font-medium text-text-primary">Review before copying</p>
          {cloudHasUserContent ? (
            <p className="mt-1 text-caption text-text-secondary">
              This cloud account already has practice data. Local backup merge is disabled to avoid mixing data between accounts.
            </p>
          ) : (
            <p className="mt-1 text-caption text-text-secondary">
              Copy only if this local backup belongs to the signed-in account.
            </p>
          )}
          {visibleNames.length > 0 ? (
            <p className="mt-2 text-caption text-text-secondary">
              Local custom groups: {visibleNames.join(', ')}{extraCount > 0 ? `, and ${extraCount} more` : ''}
            </p>
          ) : null}
          {copiedNames.length > 0 ? (
            <p className="mt-2 text-caption text-text-secondary">
              Already copied local groups found in this account: {copiedNames.join(', ')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {copiedLocalCustomCategories.length > 0 ? (
          <button
            type="button"
            onClick={onCleanup}
            disabled={isMigrating}
            className="min-h-[40px] rounded-md bg-accent-primary px-3 py-2 text-body font-medium text-white shadow-sm disabled:opacity-60"
          >
            Archive Copied Local Groups
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCancel}
          disabled={isMigrating}
          className="min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-body font-medium text-text-primary shadow-sm disabled:opacity-60"
        >
          Cancel Review
        </button>
      </div>
    </div>
  );
}

function MigrationGuardMessage({ tone, text }: { tone: 'success' | 'warning'; text: string }) {
  const isSuccess = tone === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role="status"
      className={`mt-4 flex items-start gap-2 rounded-md border p-3 text-body ${
        isSuccess
          ? 'border-accent-success/20 bg-accent-success/10 text-green-700'
          : 'border-accent-warning/30 bg-accent-warning/10 text-amber-800'
      }`}
    >
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

async function repairStarterTemplateDuplicates(
  cloudGateway: CloudDataGateway,
  snapshot: AppStateSnapshot,
): Promise<{ snapshot: AppStateSnapshot; archivedDuplicateCount: number }> {
  const repair = archiveDuplicateStarterTemplateRows(snapshot);

  if (repair.archivedCategoryIds.length === 0) {
    return {
      snapshot,
      archivedDuplicateCount: 0,
    };
  }

  await cloudGateway.saveCategories(repair.snapshot.categories);
  await cloudGateway.saveAuditLogs(repair.snapshot.auditLogs);

  return {
    snapshot: repair.snapshot,
    archivedDuplicateCount: repair.archivedCategoryIds.length,
  };
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
