import { useState } from 'react';
import { ChevronDown, FileClock } from 'lucide-react';
import type { AuditActionType, AuditLogEntry } from '../../types';
import { getAuditLogs } from '../../lib/auditService';
import { EmptyDataPanel } from '../ui/StateFeedback';

const actionToneMap: Record<string, string> = {
  created: 'created',
  updated: 'updated',
  changed: 'updated',
  archived: 'archived',
  restored: 'restored',
  imported: 'system',
  exported: 'system',
};

const toneClassMap: Record<string, string> = {
  created: 'bg-accent-success/10 text-accent-success border-accent-success/20',
  updated: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  archived: 'bg-accent-warning/10 text-amber-700 border-accent-warning/20',
  restored: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  system: 'bg-muted text-text-secondary border-border',
};

export default function AuditLogScreen() {
  const entries = getAuditLogs({ newestFirst: true });

  return (
    <section className="flex flex-col gap-4" aria-label="Audit Log">
      <div>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          Audit Trail
        </p>
        <h2 className="mt-1 text-heading text-text-primary">Audit Log</h2>
        <p className="mt-1 text-body text-text-secondary">Configuration changes, newest first</p>
      </div>

      {entries.length === 0 ? (
        <EmptyDataPanel icon={FileClock} title="No audit entries yet">
          Configuration changes will appear here with before-and-after details once you edit your practice setup.
        </EmptyDataPanel>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <AuditEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

interface AuditEntryCardProps {
  entry: AuditLogEntry;
}

function AuditEntryCard({ entry }: AuditEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const note = entry.note ?? formatActionLabel(entry.actionType);

  return (
    <article className="sadhana-surface overflow-hidden">
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`Audit entry ${note}`}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary/30"
      >
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex flex-wrap items-center gap-2">
            <ActionBadge actionType={entry.actionType} />
            <span className="text-caption text-text-secondary">
              {formatRelativeTimestamp(entry.timestamp)}
            </span>
          </span>
          <span className="block truncate text-body text-text-primary">
            {note}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-text-secondary transition-transform duration-200 ${
            expanded ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expanded ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid gap-3 border-t border-border bg-muted/35 p-4 md:grid-cols-2">
          <JsonPanel title="Old Value" value={entry.oldValue} />
          <JsonPanel title="New Value" value={entry.newValue} />
        </div>
      </div>
    </article>
  );
}

function ActionBadge({ actionType }: { actionType: AuditActionType }) {
  const tone = actionTone(actionType);

  return (
    <span
      data-tone={tone}
      className={`rounded-full border px-2 py-1 text-caption font-medium ${toneClassMap[tone]}`}
    >
      {formatActionLabel(actionType)}
    </span>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-1 text-caption font-medium text-text-secondary">{title}</h3>
      <pre className="max-h-80 overflow-auto rounded-md border border-border bg-surface p-3 text-caption text-text-primary">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function actionTone(actionType: AuditActionType): string {
  const parts = actionType.split('_');
  const suffix = parts[parts.length - 1] ?? '';
  return actionToneMap[suffix] ?? 'system';
}

function formatActionLabel(actionType: AuditActionType): string {
  return actionType.replace(/_/g, ' ');
}

function formatRelativeTimestamp(timestamp: string): string {
  const time = new Date(timestamp).getTime();
  const diffMs = Date.now() - time;

  if (!Number.isFinite(time)) return 'Unknown time';
  if (diffMs < 60_000) return 'Just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
