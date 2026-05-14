import { ArchiveRestore, CalendarDays, ClipboardList, FileClock, ScrollText } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AuditLogEntry, Category, DailyEntry, DateKey, JournalEntry } from '../../types';
import { getAuditLogs } from '../../lib/auditService';
import {
  buildArchivedItems,
  buildJournalHistory,
  buildPracticeHistory,
  type ArchivedHistoryItem,
  type HistoryFilters,
  type PracticeHistoryRow,
} from '../../lib/history';
import { getItem } from '../../lib/storage';
import { useCategories } from '../../hooks/useCategories';

type HistorySection = 'practice' | 'journal' | 'audit' | 'archived';

const sectionTabs: Array<{
  id: HistorySection;
  label: string;
  icon: typeof ClipboardList;
}> = [
  { id: 'practice', label: 'Practice History', icon: ClipboardList },
  { id: 'journal', label: 'Journal History', icon: ScrollText },
  { id: 'audit', label: 'Audit Log', icon: FileClock },
  { id: 'archived', label: 'Archived Items', icon: ArchiveRestore },
];

const loadEntries = (): Record<DateKey, DailyEntry> =>
  getItem<Record<DateKey, DailyEntry>>('entries', {});

const loadJournal = (): Record<DateKey, JournalEntry> =>
  getItem<Record<DateKey, JournalEntry>>('journal', {});

export default function HistoryScreen() {
  const {
    categories,
    restoreCategory,
    restoreSubComponent,
  } = useCategories();
  const [activeSection, setActiveSection] = useState<HistorySection>('practice');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [entries] = useState(loadEntries);
  const [journal] = useState(loadJournal);

  const filters = {
    date: dateFilter || undefined,
    categoryId: categoryFilter || undefined,
  };

  const practiceRows = useMemo(
    () => buildPracticeHistory(entries, categories, filters),
    [entries, categories, filters.date, filters.categoryId],
  );
  const journalRows = useMemo(
    () => buildJournalHistory(journal, { date: filters.date }),
    [journal, filters.date],
  );
  const archivedItems = useMemo(
    () => buildArchivedItems(categories, { categoryId: filters.categoryId }),
    [categories, filters.categoryId],
  );
  const auditRows = useMemo(
    () => filterAuditLogs(getAuditLogs({ newestFirst: true }), categories, filters),
    [categories, filters.date, filters.categoryId],
  );

  return (
    <div id="page-history" className="flex flex-col gap-5 pb-4">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
            <CalendarDays size={20} />
          </span>
          <div>
            <h1 className="text-heading text-text-primary">History</h1>
            <p className="text-caption text-text-secondary">Practice, journal, audit, and archive records</p>
          </div>
        </div>

        <div 
          className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" 
          aria-label="History sections" 
          style={{ scrollbarWidth: 'none' }}
        >
          {sectionTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-md px-4 py-2 text-body font-medium shadow-sm ${
                  isActive
                    ? 'border border-transparent bg-accent-primary text-white'
                    : 'border border-border bg-surface text-text-secondary hover:bg-muted/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </div>

        <HistoryFilterControls
          categories={categories}
          dateFilter={dateFilter}
          categoryFilter={categoryFilter}
          onDateFilterChange={setDateFilter}
          onCategoryFilterChange={setCategoryFilter}
        />
      </header>

      {activeSection === 'practice' ? (
        <PracticeHistorySection rows={practiceRows} />
      ) : activeSection === 'journal' ? (
        <JournalHistorySection entries={journalRows} />
      ) : activeSection === 'audit' ? (
        <AuditHistorySection entries={auditRows} />
      ) : (
        <ArchivedItemsSection
          items={archivedItems}
          onRestoreCategory={restoreCategory}
          onRestoreHabit={restoreSubComponent}
        />
      )}
    </div>
  );
}

interface HistoryFilterControlsProps {
  categories: Category[];
  dateFilter: string;
  categoryFilter: string;
  onDateFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
}

function HistoryFilterControls({
  categories,
  dateFilter,
  categoryFilter,
  onDateFilterChange,
  onCategoryFilterChange,
}: HistoryFilterControlsProps) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-sm sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="history-date-filter">
        Filter by date
        <input
          id="history-date-filter"
          type="date"
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value)}
          className="min-h-[44px] rounded-md border border-border bg-ivory px-3 text-body text-text-primary outline-none focus:ring-2 focus:ring-accent-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="history-category-filter">
        Filter by category
        <select
          id="history-category-filter"
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          className="min-h-[44px] rounded-md border border-border bg-ivory px-3 text-body text-text-primary outline-none focus:ring-2 focus:ring-accent-primary"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function PracticeHistorySection({ rows }: { rows: PracticeHistoryRow[] }) {
  return (
    <section className="flex flex-col gap-3" aria-label="Practice History">
      <SectionHeader title="Practice History" count={rows.length} />
      {rows.length === 0 ? (
        <EmptyState message="No practice history matches these filters." />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <PracticeHistoryCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function PracticeHistoryCard({ row }: { row: PracticeHistoryRow }) {
  return (
    <article className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption font-medium text-text-secondary">{row.date}</p>
          <h3 className="text-subheading text-text-primary">{row.habitName}</h3>
          <p className="text-caption text-text-secondary">{row.categoryName}</p>
        </div>
        <span className="rounded-full border border-accent-primary/20 bg-accent-primary/10 px-3 py-1 text-caption font-medium text-accent-primary">
          {formatScore(row.score)}
        </span>
      </div>

      <div className="mt-4">
        <HistoryField label="Recorded Value" value={row.value} />
      </div>
    </article>
  );
}

function JournalHistorySection({ entries }: { entries: JournalEntry[] }) {
  return (
    <section className="flex flex-col gap-3" aria-label="Journal History">
      <SectionHeader title="Journal History" count={entries.length} />
      {entries.length === 0 ? (
        <EmptyState message="No journal history matches these filters." />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <article key={entry.date} className="rounded-md border border-border bg-surface p-4 shadow-sm">
              <p className="text-caption font-medium text-text-secondary">{entry.date}</p>
              <p className="mt-2 whitespace-pre-wrap text-body text-text-primary">{entry.content}</p>
              <JournalMeta entry={entry} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function JournalMeta({ entry }: { entry: JournalEntry }) {
  const metaCandidates: Array<[string, string | undefined]> = [
    ['Mood', entry.mood],
    ['Gratitude', entry.gratitude],
    ['Insight', entry.spiritualInsight],
    ['Trigger', entry.triggerObserved],
    ['Lesson', entry.lessonLearned],
  ];
  const meta = metaCandidates.filter((item): item is [string, string] =>
    typeof item[1] === 'string' && item[1].trim() !== '',
  );

  if (meta.length === 0) return null;

  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {meta.map(([label, value]) => (
        <HistoryField key={label} label={label} value={value ?? ''} />
      ))}
    </dl>
  );
}

function AuditHistorySection({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <section className="flex flex-col gap-3" aria-label="Audit Log">
      <SectionHeader title="Audit Log" count={entries.length} />
      {entries.length === 0 ? (
        <EmptyState message="No audit entries match these filters." />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-md border border-border bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-caption font-medium text-text-secondary">{formatTimestamp(entry.timestamp)}</p>
                  <h3 className="text-subheading text-text-primary">{formatActionLabel(entry.actionType)}</h3>
                  <p className="text-caption text-text-secondary">
                    {entry.entityType} · {entry.entityId}
                  </p>
                </div>
              </div>
              {entry.note ? (
                <p className="mt-3 text-body text-text-primary">{entry.note}</p>
              ) : null}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AuditValuePanel title="Old Value" value={entry.oldValue} />
                <AuditValuePanel title="New Value" value={entry.newValue} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

interface ArchivedItemsSectionProps {
  items: ArchivedHistoryItem[];
  onRestoreCategory: (categoryId: string) => void;
  onRestoreHabit: (categoryId: string, habitId: string) => void;
}

function ArchivedItemsSection({
  items,
  onRestoreCategory,
  onRestoreHabit,
}: ArchivedItemsSectionProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Archived Items">
      <SectionHeader title="Archived Items" count={items.length} />
      {items.length === 0 ? (
        <EmptyState message="No archived categories or habits match these filters." />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-md border border-border bg-surface p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-caption font-medium capitalize text-text-secondary">{item.type}</p>
                  <h3 className="truncate text-subheading text-text-primary">{item.name}</h3>
                  <p className="text-caption text-text-secondary">
                    Category: {item.categoryName} · Archived {formatTimestamp(item.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (item.type === 'category') {
                      onRestoreCategory(item.categoryId);
                    } else if (item.habitId) {
                      onRestoreHabit(item.categoryId, item.habitId);
                    }
                  }}
                  className="flex min-h-[44px] items-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm transition-colors duration-150 hover:bg-accent-secondary"
                  aria-label={`Restore ${item.type} ${item.name}`}
                >
                  <ArchiveRestore size={18} />
                  Restore
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-heading text-text-primary">{title}</h2>
      <span className="text-caption text-text-secondary tabular-nums">{count}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-5 text-body text-text-secondary shadow-sm">
      {message}
    </div>
  );
}

function HistoryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/50 px-3 py-2">
      <dt className="text-caption font-medium text-text-secondary">{label}</dt>
      <dd className="mt-1 break-words text-body text-text-primary">{value}</dd>
    </div>
  );
}

function AuditValuePanel({ title, value }: { title: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') {
    return (
      <div className="min-w-0">
        <h4 className="mb-1 text-caption font-medium text-text-secondary">{title}</h4>
        <p className="rounded-md border border-border bg-ivory p-3 text-body text-text-primary">
          {String(value)}
        </p>
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([k]) => !['id', 'categoryId', 'createdAt', 'updatedAt', 'subComponents'].includes(k)
  );

  if (entries.length === 0) return null;

  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-caption font-medium text-text-secondary">{title}</h4>
      <dl className="grid gap-2 rounded-md border border-border bg-ivory p-3 text-caption">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[1fr_2fr] gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
            <dt className="text-text-secondary capitalize">
              {k.replace(/([A-Z])/g, ' $1').trim()}
            </dt>
            <dd className="font-medium text-text-primary break-words">
              {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function filterAuditLogs(
  entries: AuditLogEntry[],
  categories: Category[],
  filters: HistoryFilters,
): AuditLogEntry[] {
  const habitCategoryMap = new Map<string, string>();
  categories.forEach((category) => {
    category.subComponents.forEach((habit) => {
      habitCategoryMap.set(habit.id, category.id);
    });
  });

  return entries.filter((entry) => {
    if (filters.date && entry.timestamp.slice(0, 10) !== filters.date) {
      return false;
    }

    if (!filters.categoryId) return true;

    if (entry.entityType === 'category') {
      return entry.entityId === filters.categoryId;
    }

    if (entry.entityType === 'habit') {
      return habitCategoryMap.get(entry.entityId) === filters.categoryId;
    }

    return false;
  });
}

function formatScore(score: number | null): string {
  return typeof score === 'number' ? `${Math.round(score)}%` : '--';
}

function formatActionLabel(actionType: string): string {
  return actionType.replace(/_/g, ' ');
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
