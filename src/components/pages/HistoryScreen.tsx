import { useMemo, useState, type ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  ArchiveRestore,
  CalendarDays,
  ClipboardList,
  FileClock,
  Filter,
  History,
  RotateCcw,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
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
import { appRepository } from '../../lib/repository';
import { useCategories } from '../../hooks/useCategories';
import ScreenHeader from '../ui/ScreenHeader';

type HistorySection = 'practice' | 'journal' | 'audit' | 'archived';

interface HistoryTab {
  id: HistorySection;
  label: string;
  shortLabel: string;
  icon: ComponentType<LucideProps>;
  description: string;
}

const sectionTabs: HistoryTab[] = [
  {
    id: 'practice',
    label: 'Practice History',
    shortLabel: 'Practice',
    icon: ClipboardList,
    description: 'Daily values and scores',
  },
  {
    id: 'journal',
    label: 'Journal History',
    shortLabel: 'Journal',
    icon: ScrollText,
    description: 'Reflections by date',
  },
  {
    id: 'audit',
    label: 'Audit Log',
    shortLabel: 'Audit',
    icon: FileClock,
    description: 'Configuration changes',
  },
  {
    id: 'archived',
    label: 'Archived Items',
    shortLabel: 'Archive',
    icon: ArchiveRestore,
    description: 'Restorable records',
  },
];

const loadEntries = (): Record<DateKey, DailyEntry> =>
  appRepository.getDailyEntries();

const loadJournal = (): Record<DateKey, JournalEntry> =>
  appRepository.getJournalEntries();

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

  const filters = useMemo(
    () => ({
      date: dateFilter || undefined,
      categoryId: categoryFilter || undefined,
    }),
    [categoryFilter, dateFilter],
  );

  const practiceRows = useMemo(
    () => buildPracticeHistory(entries, categories, filters),
    [entries, categories, filters],
  );
  const journalRows = useMemo(
    () => buildJournalHistory(journal, { date: filters.date }),
    [journal, filters],
  );
  const archivedItems = useMemo(
    () => buildArchivedItems(categories, { categoryId: filters.categoryId }),
    [categories, filters],
  );
  const auditRows = useMemo(
    () => filterAuditLogs(getAuditLogs({ newestFirst: true }), categories, filters),
    [categories, filters],
  );
  const activeTab = sectionTabs.find((tab) => tab.id === activeSection) ?? sectionTabs[0]!;
  const hasActiveFilters = Boolean(dateFilter || categoryFilter);
  const summary = {
    practice: practiceRows.length,
    journal: journalRows.length,
    audit: auditRows.length,
    archived: archivedItems.length,
  };

  return (
    <div id="page-history" className="flex w-full flex-col gap-5 pb-4 lg:gap-7">
      <header className="flex flex-col gap-4">
        <ScreenHeader
          icon={CalendarDays}
          title="History"
          subtitle="Practice, journal, audit, and archive records"
        />

        <section
          className="relative overflow-hidden rounded-lg border border-border px-4 py-5 shadow-lifted sm:px-6 lg:px-8 lg:py-7"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,253,252,0.98) 0%, rgba(250,247,241,0.98) 54%, rgba(14,159,110,0.08) 100%)',
          }}
          aria-labelledby="history-hero-title"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-success" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-center">
            <div className="min-w-0">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-success/10 text-accent-success shadow-sm">
                  <History size={24} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                    Practice Archive
                  </p>
                  <h2 id="history-hero-title" className="text-heading text-text-primary">
                    A calm record of change
                  </h2>
                </div>
              </div>
              <p className="max-w-3xl text-body text-text-secondary lg:text-[1.08rem]">
                Review what was practiced, reflected, changed, and archived without losing the audit trail.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <HistoryHeroMetric icon={ClipboardList} label="Practice" value={String(summary.practice)} />
              <HistoryHeroMetric icon={ScrollText} label="Journal" value={String(summary.journal)} />
              <HistoryHeroMetric icon={ShieldCheck} label="Audit" value={String(summary.audit)} />
              <HistoryHeroMetric icon={ArchiveRestore} label="Archived" value={String(summary.archived)} />
            </div>
          </div>
        </section>

        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="History sections"
        >
          {sectionTabs.map((tab) => {
            const isActive = activeSection === tab.id;
            const count = summary[tab.id];
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`min-h-[88px] rounded-lg border p-3 text-left shadow-sm transition-[background-color,border-color,box-shadow] duration-150 ${
                  isActive
                    ? 'border-accent-primary/25 bg-accent-primary/10 shadow-card'
                    : 'border-border bg-surface hover:border-accent-primary/20 hover:bg-muted/45'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? 'bg-accent-primary text-white' : 'bg-accent-primary/10 text-accent-primary'
                    }`}
                    >
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-body font-medium text-text-primary">{tab.shortLabel}</span>
                      <span className="mt-0.5 block text-caption text-text-secondary">{tab.description}</span>
                    </span>
                  </span>
                  <span className="rounded-full border border-border bg-white/70 px-2.5 py-1 text-caption tabular-nums text-text-secondary">
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <HistoryFilterControls
          categories={categories}
          dateFilter={dateFilter}
          categoryFilter={categoryFilter}
          hasActiveFilters={hasActiveFilters}
          onDateFilterChange={setDateFilter}
          onCategoryFilterChange={setCategoryFilter}
          onClearFilters={() => {
            setDateFilter('');
            setCategoryFilter('');
          }}
        />
      </header>

      {activeSection === 'practice' ? (
        <PracticeHistorySection rows={practiceRows} activeTab={activeTab} />
      ) : activeSection === 'journal' ? (
        <JournalHistorySection entries={journalRows} activeTab={activeTab} />
      ) : activeSection === 'audit' ? (
        <AuditHistorySection entries={auditRows} activeTab={activeTab} />
      ) : (
        <ArchivedItemsSection
          items={archivedItems}
          activeTab={activeTab}
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
  hasActiveFilters: boolean;
  onDateFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

function HistoryFilterControls({
  categories,
  dateFilter,
  categoryFilter,
  hasActiveFilters,
  onDateFilterChange,
  onCategoryFilterChange,
  onClearFilters,
}: HistoryFilterControlsProps) {
  return (
    <section className="sadhana-surface p-3 sm:p-4" aria-label="History filters">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
            <Filter size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-body font-medium text-text-primary">Timeline filters</h2>
            <p className="text-caption text-text-secondary">Narrow the archive by date or category.</p>
          </div>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="sadhana-button-secondary min-h-[40px] px-3"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="history-date-filter">
          Filter by date
          <input
            id="history-date-filter"
            type="date"
            value={dateFilter}
            onChange={(event) => onDateFilterChange(event.target.value)}
            className="sadhana-input"
          />
        </label>

        <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="history-category-filter">
          Filter by category
          <select
            id="history-category-filter"
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            className="sadhana-input"
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
    </section>
  );
}

function PracticeHistorySection({ rows, activeTab }: { rows: PracticeHistoryRow[]; activeTab: HistoryTab }) {
  return (
    <section className="flex flex-col gap-4" aria-label="Practice History">
      <PremiumSectionHeader tab={activeTab} count={rows.length} />
      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No practice records found"
          message="No practice history matches these filters."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
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
    <article className="sadhana-surface overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0 bg-accent-primary/80" aria-hidden="true" />
        <div className="min-w-0 flex-1 p-4 lg:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-caption font-medium text-text-secondary">{row.date}</p>
              <h3 className="mt-1 break-words text-subheading text-text-primary">{row.habitName}</h3>
              <p className="text-caption text-text-secondary">{row.categoryName}</p>
            </div>
            <span className="rounded-full border border-accent-primary/20 bg-accent-primary/10 px-3 py-1 text-caption font-medium text-accent-primary">
              {formatScore(row.score)}
            </span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <HistoryField label="Recorded Value" value={row.value} />
            {row.notes ? (
              <HistoryField label="Note" value={row.notes} />
            ) : null}
          </dl>
        </div>
      </div>
    </article>
  );
}

function JournalHistorySection({ entries, activeTab }: { entries: JournalEntry[]; activeTab: HistoryTab }) {
  return (
    <section className="flex flex-col gap-4" aria-label="Journal History">
      <PremiumSectionHeader tab={activeTab} count={entries.length} />
      {entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No reflections found"
          message="No journal history matches these filters."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {entries.map((entry) => (
            <article key={entry.date} className="sadhana-surface overflow-hidden">
              <div className="border-b border-border bg-muted/35 px-4 py-3 lg:px-5">
                <p className="text-caption font-medium text-text-secondary">{entry.date}</p>
                <h3 className="mt-1 text-subheading text-text-primary">{getJournalTitle(entry)}</h3>
              </div>
              <div className="p-4 lg:p-5">
                {entry.content.trim() ? (
                  <p className="whitespace-pre-wrap text-body text-text-primary">{entry.content}</p>
                ) : (
                  <p className="text-body text-text-secondary">Reflection fields saved without free-form notes.</p>
                )}
                <JournalMeta entry={entry} />
              </div>
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

function AuditHistorySection({ entries, activeTab }: { entries: AuditLogEntry[]; activeTab: HistoryTab }) {
  return (
    <section className="flex flex-col gap-4" aria-label="Audit Log">
      <PremiumSectionHeader tab={activeTab} count={entries.length} />
      {entries.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="No audit records found"
          message="No audit entries match these filters."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <article key={entry.id} className="sadhana-surface overflow-hidden">
              <div className="flex border-b border-border">
                <div className="w-1 shrink-0 bg-accent-secondary/80" aria-hidden="true" />
                <div className="min-w-0 flex-1 px-4 py-3 lg:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-caption font-medium text-text-secondary">{formatTimestamp(entry.timestamp)}</p>
                      <h3 className="mt-1 text-subheading text-text-primary">{formatActionLabel(entry.actionType)}</h3>
                      <p className="text-caption text-text-secondary">
                        {entry.entityType} - {entry.entityId}
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-muted/45 px-3 py-1 text-caption text-text-secondary">
                      Preserved
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-5">
                {entry.note ? (
                  <p className="text-body text-text-primary">{entry.note}</p>
                ) : null}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <AuditValuePanel title="Old Value" value={entry.oldValue} />
                  <AuditValuePanel title="New Value" value={entry.newValue} />
                </div>
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
  activeTab: HistoryTab;
  onRestoreCategory: (categoryId: string) => void;
  onRestoreHabit: (categoryId: string, habitId: string) => void;
}

function ArchivedItemsSection({
  items,
  activeTab,
  onRestoreCategory,
  onRestoreHabit,
}: ArchivedItemsSectionProps) {
  return (
    <section className="flex flex-col gap-4" aria-label="Archived Items">
      <PremiumSectionHeader tab={activeTab} count={items.length} />
      {items.length === 0 ? (
        <EmptyState
          icon={ArchiveRestore}
          title="No archived items found"
          message="No archived categories or habits match these filters."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="sadhana-surface p-4 lg:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-caption font-medium capitalize text-text-secondary">{item.type}</p>
                  <h3 className="truncate text-subheading text-text-primary">{item.name}</h3>
                  <p className="text-caption text-text-secondary">
                    Category: {item.categoryName} - Archived {formatTimestamp(item.updatedAt)}
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
                  className="sadhana-button-primary"
                  aria-label={`Restore ${item.type} ${item.name}`}
                >
                  <ArchiveRestore size={18} aria-hidden="true" />
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

function PremiumSectionHeader({ tab, count }: { tab: HistoryTab; count: number }) {
  const Icon = tab.icon;

  return (
    <div className="sadhana-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between lg:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary shadow-sm">
          <Icon size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-heading text-text-primary">{tab.label}</h2>
          <p className="text-caption text-text-secondary">{tab.description}</p>
        </div>
      </div>
      <span className="w-fit rounded-full border border-border bg-muted/45 px-3 py-1 text-caption text-text-secondary tabular-nums">
        {count} {count === 1 ? 'record' : 'records'}
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
  message: string;
}) {
  return (
    <div className="sadhana-surface flex flex-col items-center justify-center px-4 py-8 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className="text-subheading text-text-primary">{title}</h3>
      <p className="mt-1 max-w-md text-body text-text-secondary">
        {message}
      </p>
    </div>
  );
}

interface HistoryHeroMetricProps {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}

function HistoryHeroMetric({ icon: Icon, label, value }: HistoryHeroMetricProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/70 bg-white/60 px-2.5 py-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:px-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-success/10 text-accent-success sm:h-8 sm:w-8">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-text-secondary sm:text-[0.72rem] sm:tracking-[0.12em]">
          {label}
        </p>
        <p className="text-[1.15rem] font-semibold leading-tight text-text-primary sm:text-subheading">
          {value}
        </p>
      </div>
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
        <p className="sadhana-surface-soft p-3 text-body text-text-primary">
          {String(value)}
        </p>
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([k]) => !['id', 'categoryId', 'createdAt', 'updatedAt', 'subComponents'].includes(k),
  );

  if (entries.length === 0) return null;

  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-caption font-medium text-text-secondary">{title}</h4>
      <dl className="sadhana-surface-soft grid gap-2 p-3 text-caption">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[1fr_2fr] gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
            <dt className="text-text-secondary capitalize">
              {k.replace(/([A-Z])/g, ' $1').trim()}
            </dt>
            <dd className="break-words font-medium text-text-primary">
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

function getJournalTitle(entry: JournalEntry): string {
  return entry.mood?.trim()
    || entry.gratitude?.trim()
    || entry.spiritualInsight?.trim()
    || 'Saved reflection';
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
