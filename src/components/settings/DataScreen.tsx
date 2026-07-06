import { AlertTriangle, Cloud, CloudOff, Download, FileJson, RefreshCw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useCloudSync, type CloudSyncStatus } from '../../cloud/CloudSyncProvider';
import {
  CLOUD_SYNC_ACTION_LABELS,
  getCloudSyncStatusLabel,
} from '../../lib/cloudSyncStatusCopy';
import { downloadCSV, downloadJSON, exportCSV, exportJSON } from '../../lib/export';
import {
  applyImport,
  detectConflicts,
  parseImport,
  type ConflictSummary,
  type ImportMode,
} from '../../lib/import';
import { reportError, trackEvent } from '../../lib/observability';
import type { ExportPayload } from '../../types';
import ConflictDialog from './ConflictDialog';

type StatusMessage = {
  tone: 'success' | 'error' | 'warning';
  text: string;
} | null;

export default function DataScreen() {
  const cloudSync = useCloudSync();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<ExportPayload | null>(null);
  const [conflictSummary, setConflictSummary] = useState<ConflictSummary | null>(null);
  const exportTrust = getExportTrust(cloudSync);

  const handleExportJSON = () => {
    try {
      trackEvent('export_json_started', { trust: exportTrust.kind });
      const payload = exportJSON();
      downloadJSON(payload);
      setStatus({ tone: 'success', text: getJsonExportSuccessMessage(exportTrust.kind) });
    } catch (error) {
      reportError(error, 'json_export_failed');
      setStatus({ tone: 'error', text: 'JSON export failed.' });
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportCSV();
      downloadCSV(csv);
      setStatus({ tone: 'success', text: getCsvExportSuccessMessage(exportTrust.kind) });
    } catch (error) {
      reportError(error, 'csv_export_failed');
      setStatus({ tone: 'error', text: 'CSV export failed.' });
    }
  };

  const refreshCloudData = async () => {
    try {
      setIsRefreshingCloud(true);
      await cloudSync.refreshFromCloud();
      setStatus({
        tone: 'success',
        text: 'Cloud data refreshed. Exports now use the latest confirmed cloud data.',
      });
    } catch (error) {
      reportError(error, 'cloud_data_refresh_failed');
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Cloud refresh failed. Exports may use local cache.',
      });
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      const payload = await parseImport(file);
      setPendingPayload(payload);
      setConflictSummary(detectConflicts(payload));
      setStatus(null);
    } catch (error) {
      reportError(error, 'json_import_parse_failed');
      setPendingPayload(null);
      setConflictSummary(null);
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Invalid JSON backup.',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const applyPendingImport = (mode: ImportMode) => {
    if (!pendingPayload) return;

    try {
      applyImport(pendingPayload, mode);
      setStatus({ tone: 'success', text: getImportSuccessMessage(exportTrust.kind) });
      setPendingPayload(null);
      setConflictSummary(null);
    } catch (error) {
      reportError(error, 'json_import_apply_failed');
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Import failed.',
      });
    }
  };

  return (
    <section className="flex flex-col gap-4" aria-label="Data export and import">
      <div>
        <h2 className="text-heading text-text-primary">Data</h2>
        <p className="text-caption text-text-secondary">Backup, restore, and export daily records</p>
      </div>

      {status ? (
        <div
          role="status"
          className={`rounded-md border px-4 py-3 text-body shadow-sm ${
            status.tone === 'success'
              ? 'border-accent-success/20 bg-accent-success/10 text-green-700'
              : status.tone === 'warning'
                ? 'border-accent-warning/30 bg-accent-warning/10 text-amber-700'
                : 'border-accent-danger/20 bg-accent-danger/10 text-red-700'
          }`}
        >
          {status.text}
        </div>
      ) : null}

      <BackupTrustPanel
        trust={exportTrust}
        isRefreshing={isRefreshingCloud}
        onRefresh={() => {
          void refreshCloudData();
        }}
      />

      <div className="grid gap-3 md:grid-cols-3 2xl:gap-5">
        <DataAction
          title="Export JSON"
          description={getJsonActionDescription(exportTrust.kind)}
          icon={FileJson}
          onClick={handleExportJSON}
        />
        <DataAction
          title="Export CSV"
          description={getCsvActionDescription(exportTrust.kind)}
          icon={Download}
          onClick={handleExportCSV}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Import JSON"
          className="flex min-h-[132px] flex-col justify-between rounded-md border border-border bg-surface p-4 text-left shadow-sm transition-colors duration-150 hover:bg-muted/40 lg:min-h-[170px] lg:p-6"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary lg:h-12 lg:w-12">
              <Upload size={20} />
            </span>
            <span>
              <span className="block text-body font-medium text-text-primary">Import JSON</span>
              <span className="block text-caption text-text-secondary">Restore from a backup file.</span>
            </span>
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          aria-label="Import JSON file"
          className="sr-only"
          onChange={(event) => {
            void handleImportFile(event.target.files?.[0]);
          }}
        />
      </div>

      {pendingPayload && conflictSummary ? (
        <ConflictDialog
          summary={conflictSummary}
          onApply={applyPendingImport}
          onCancel={() => {
            setPendingPayload(null);
            setConflictSummary(null);
          }}
        />
      ) : null}
    </section>
  );
}

type ExportTrustKind = 'localOnly' | 'cloudConfirmed' | 'cloudPending';

interface ExportTrust {
  kind: ExportTrustKind;
  title: string;
  description: string;
  pendingWrites: number;
  canRefresh: boolean;
}

function BackupTrustPanel({
  trust,
  isRefreshing,
  onRefresh,
}: {
  trust: ExportTrust;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const isWarning = trust.kind === 'cloudPending';
  const Icon = trust.kind === 'localOnly'
    ? CloudOff
    : isWarning
      ? AlertTriangle
      : Cloud;

  return (
    <section
      aria-label="Backup cloud status"
      className={`flex flex-col gap-3 rounded-md border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
        isWarning
          ? 'border-accent-warning/30 bg-accent-warning/10'
          : 'border-border bg-surface'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
            isWarning ? 'bg-accent-warning/20 text-amber-700' : 'bg-accent-primary/10 text-accent-primary'
          }`}
        >
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-body font-medium text-text-primary">{trust.title}</h3>
          <p className="mt-1 text-caption text-text-secondary">{trust.description}</p>
          {trust.pendingWrites > 0 ? (
            <p className="mt-1 text-caption text-text-secondary">
              {trust.pendingWrites} pending cloud {trust.pendingWrites === 1 ? 'change' : 'changes'}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={!trust.canRefresh || isRefreshing}
        className="flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body font-medium text-text-primary shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? 'motion-safe:animate-spin' : undefined} />
        {isRefreshing ? 'Refreshing' : CLOUD_SYNC_ACTION_LABELS.refresh}
      </button>
    </section>
  );
}

interface DataActionProps {
  title: string;
  description: string;
  icon: typeof Download;
  onClick: () => void;
}

function DataAction({ title, description, icon: Icon, onClick }: DataActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      className="flex min-h-[132px] flex-col justify-between rounded-md border border-border bg-surface p-4 text-left shadow-sm transition-colors duration-150 hover:bg-muted/40 lg:min-h-[170px] lg:p-6"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary lg:h-12 lg:w-12">
          <Icon size={20} />
        </span>
        <span>
          <span className="block text-body font-medium text-text-primary">{title}</span>
          <span className="block text-caption text-text-secondary">{description}</span>
        </span>
      </span>
    </button>
  );
}

function getExportTrust(sync: ReturnType<typeof useCloudSync>): ExportTrust {
  if (sync.status === 'localOnly') {
    return {
      kind: 'localOnly',
      title: 'Local-only backup',
      description: 'Exports are created from this device. Cloud accounts are not active in this session.',
      pendingWrites: 0,
      canRefresh: false,
    };
  }

  const pendingWrites = sync.pendingWrites;
  const pendingStatus = isCloudPendingStatus(sync.status) || pendingWrites > 0;

  if (!pendingStatus && sync.status === 'synced') {
    return {
      kind: 'cloudConfirmed',
      title: 'Cloud-confirmed backup',
      description: sync.lastSyncedAt
        ? `Last confirmed ${formatSyncTimestamp(sync.lastSyncedAt)}. Refresh first if another device changed data recently.`
        : 'Cloud sync is current. Refresh first if another device changed data recently.',
      pendingWrites: 0,
      canRefresh: true,
    };
  }

  return {
    kind: 'cloudPending',
    title: getPendingTrustTitle(sync.status),
    description: getPendingTrustDescription(sync.status),
    pendingWrites,
    canRefresh: sync.status === 'failed' && pendingWrites === 0,
  };
}

function isCloudPendingStatus(status: CloudSyncStatus): boolean {
  return status === 'preparing'
    || status === 'syncing'
    || status === 'queued'
    || status === 'conflict'
    || status === 'offline'
    || status === 'failed'
    || status === 'retrying';
}

function getPendingTrustTitle(status: CloudSyncStatus): string {
  return getCloudSyncStatusLabel(status);
}

function getPendingTrustDescription(status: CloudSyncStatus): string {
  if (status === 'offline') {
    return 'Exports use local cache while offline. Refresh from cloud after reconnecting for a confirmed backup.';
  }

  if (status === 'conflict') {
    return 'Cloud data changed elsewhere. Resolve the sync state before treating exports as cloud-confirmed.';
  }

  if (status === 'failed') {
    return 'Cloud refresh or sync failed. Refresh before export when the connection is healthy.';
  }

  if (status === 'syncing' || status === 'preparing' || status === 'retrying') {
    return 'Exports may use local cache until cloud sync finishes.';
  }

  return 'Exports use local cache until queued changes are confirmed by cloud sync.';
}

function getJsonActionDescription(kind: ExportTrustKind): string {
  if (kind === 'cloudConfirmed') return 'Download a cloud-confirmed JSON backup.';
  if (kind === 'cloudPending') return 'Download the current local cache as JSON.';
  return 'Download this device backup as JSON.';
}

function getCsvActionDescription(kind: ExportTrustKind): string {
  if (kind === 'cloudConfirmed') return 'Download cloud-confirmed daily records.';
  if (kind === 'cloudPending') return 'Download current local cache records.';
  return 'Download daily records from this device.';
}

function getJsonExportSuccessMessage(kind: ExportTrustKind): string {
  if (kind === 'cloudConfirmed') return 'JSON backup exported from cloud-confirmed data.';
  if (kind === 'cloudPending') return 'JSON backup exported from local cache. Cloud confirmation is pending.';
  return 'JSON backup exported from this device.';
}

function getCsvExportSuccessMessage(kind: ExportTrustKind): string {
  if (kind === 'cloudConfirmed') return 'CSV export created from cloud-confirmed data.';
  if (kind === 'cloudPending') return 'CSV export created from local cache. Cloud confirmation is pending.';
  return 'CSV export created from this device.';
}

function getImportSuccessMessage(kind: ExportTrustKind): string {
  if (kind === 'cloudConfirmed') return 'JSON backup imported. Cloud sync will confirm the changes shortly.';
  if (kind === 'cloudPending') return 'JSON backup imported into local cache. Cloud confirmation is pending.';
  return 'JSON backup imported on this device.';
}

function formatSyncTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
