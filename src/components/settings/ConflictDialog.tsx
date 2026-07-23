import type { ConflictSummary, ImportMode } from '../../lib/import';
import { useEffect } from 'react';

interface ConflictDialogProps {
  summary: ConflictSummary;
  onApply: (mode: ImportMode) => void;
  onCancel: () => void;
}

export default function ConflictDialog({ summary, onApply, onCancel }: ConflictDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-summary-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
    >
      <div className="sadhana-surface w-full max-w-lg p-5 shadow-lifted">
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
          <ConflictCount label="Daily plans" value={summary.dailyPlans} />
        </dl>

        {summary.settings ? (
          <p className="sadhana-surface-soft mt-3 px-3 py-2 text-caption text-text-secondary">
            Backup schema settings differ from the current app settings.
          </p>
        ) : null}

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            aria-label="Merge"
            onClick={() => onApply('merge')}
            className="sadhana-button-secondary"
          >
            Merge
          </button>
          <button
            type="button"
            aria-label="Overwrite"
            onClick={() => onApply('overwrite')}
            className="sadhana-button-primary"
          >
            Overwrite
          </button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={onCancel}
            className="sadhana-button-secondary text-text-secondary"
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
    <div className="sadhana-surface-soft px-3 py-2">
      <dt className="text-caption font-medium text-text-secondary">{label}</dt>
      <dd className="mt-1 text-subheading text-text-primary tabular-nums">{value}</dd>
    </div>
  );
}
