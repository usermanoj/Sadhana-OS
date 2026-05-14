import { Download, FileJson, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { downloadCSV, downloadJSON, exportCSV, exportJSON } from '../../lib/export';
import {
  applyImport,
  detectConflicts,
  parseImport,
  type ConflictSummary,
  type ImportMode,
} from '../../lib/import';
import type { ExportPayload } from '../../types';
import ConflictDialog from './ConflictDialog';

type StatusMessage = {
  tone: 'success' | 'error';
  text: string;
} | null;

export default function DataScreen() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [pendingPayload, setPendingPayload] = useState<ExportPayload | null>(null);
  const [conflictSummary, setConflictSummary] = useState<ConflictSummary | null>(null);

  const handleExportJSON = () => {
    try {
      const payload = exportJSON();
      downloadJSON(payload);
      setStatus({ tone: 'success', text: 'JSON backup exported.' });
    } catch {
      setStatus({ tone: 'error', text: 'JSON export failed.' });
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportCSV();
      downloadCSV(csv);
      setStatus({ tone: 'success', text: 'CSV export created.' });
    } catch {
      setStatus({ tone: 'error', text: 'CSV export failed.' });
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
      setStatus({ tone: 'success', text: 'JSON backup imported.' });
      setPendingPayload(null);
      setConflictSummary(null);
    } catch (error) {
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
              : 'border-accent-danger/20 bg-accent-danger/10 text-red-700'
          }`}
        >
          {status.text}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <DataAction
          title="Export JSON"
          description="Download a complete local backup."
          icon={FileJson}
          onClick={handleExportJSON}
        />
        <DataAction
          title="Export CSV"
          description="Download daily tracking records."
          icon={Download}
          onClick={handleExportCSV}
        />
        <label
          className="flex min-h-[132px] cursor-pointer flex-col justify-between rounded-md border border-border bg-surface p-4 shadow-sm transition-colors duration-150 hover:bg-muted/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
              <Upload size={20} />
            </span>
            <span>
              <span className="block text-body font-medium text-text-primary">Import JSON</span>
              <span className="block text-caption text-text-secondary">Restore from a backup file.</span>
            </span>
          </span>
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
        </label>
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
      className="flex min-h-[132px] flex-col justify-between rounded-md border border-border bg-surface p-4 text-left shadow-sm transition-colors duration-150 hover:bg-muted/40"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
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
