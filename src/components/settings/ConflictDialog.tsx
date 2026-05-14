import type { ConflictSummary, ImportMode } from '../../lib/import';

interface ConflictDialogProps {
  summary: ConflictSummary;
  onApply: (mode: ImportMode) => void;
  onCancel: () => void;
}

export default function ConflictDialog({ summary, onApply, onCancel }: ConflictDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-summary-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
    >
      <div className="w-full max-w-lg rounded-md border border-border bg-surface p-5 shadow-lg">
        <div className="flex flex-col gap-2">
          <h2 id="import-summary-title" className="text-heading text-text-primary">
            Import summary
          </h2>
          <p className="text-body text-text-secondary">
            Review records that may overlap with existing local data.
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <ConflictCount label="Categories" value={summary.categories} />
          <ConflictCount label="Daily entries" value={summary.dailyEntries} />
          <ConflictCount label="Journal entries" value={summary.journalEntries} />
          <ConflictCount label="Audit logs" value={summary.auditLogs} />
        </dl>

        {summary.settings ? (
          <p className="mt-3 rounded-md bg-muted px-3 py-2 text-caption text-text-secondary">
            Backup schema settings differ from the current app settings.
          </p>
        ) : null}

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onApply('merge')}
            className="min-h-[44px] rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary transition-colors duration-150 hover:bg-muted"
          >
            Merge
          </button>
          <button
            type="button"
            onClick={() => onApply('overwrite')}
            className="min-h-[44px] rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm"
          >
            Overwrite
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-md border border-border px-4 py-2 text-body font-medium text-text-secondary transition-colors duration-150 hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ConflictCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/60 px-3 py-2">
      <dt className="text-caption font-medium text-text-secondary">{label}</dt>
      <dd className="mt-1 text-subheading text-text-primary tabular-nums">{value}</dd>
    </div>
  );
}
