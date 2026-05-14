import type { AuditLogEntry, Category, DailyEntry, DateKey, ExportPayload, Habit, JournalEntry } from '../types';
import { recordAuditEntry } from './auditService';
import { getItem } from './storage';

const CSV_HEADERS = ['date', 'categoryName', 'subComponentName', 'completed'];

const getSchemaVersion = (): string => getItem<string>('version', '1.1');

const loadCategories = (): Category[] => getItem<Category[]>('categories', []);
const loadDailyEntries = (): Record<DateKey, DailyEntry> =>
  getItem<Record<DateKey, DailyEntry>>('entries', {});
const loadJournalEntries = (): Record<DateKey, JournalEntry> =>
  getItem<Record<DateKey, JournalEntry>>('journal', {});
const loadAuditLogs = (): AuditLogEntry[] => getItem<AuditLogEntry[]>('audit', []);

const flattenHabits = (categories: Category[]): Habit[] =>
  categories.flatMap((category) => category.subComponents);

export function exportJSON(): ExportPayload {
  recordAuditEntry({
    actionType: 'data_exported',
    entityType: 'system',
    entityId: 'system',
    oldValue: null,
    newValue: null,
    note: 'Exported JSON backup',
  });

  const categories = loadCategories();
  const dailyEntries = loadDailyEntries();
  const journalEntries = loadJournalEntries();
  const auditLogs = loadAuditLogs();
  const settings = { schemaVersion: getSchemaVersion() };

  return {
    version: settings.schemaVersion,
    exportedAt: new Date().toISOString(),
    categories,
    habits: flattenHabits(categories),
    dailyEntries,
    journalEntries,
    auditLogs,
    settings,
    entries: dailyEntries,
    journal: journalEntries,
    audit: auditLogs,
  };
}

export function exportCSV(): string {
  recordAuditEntry({
    actionType: 'data_exported',
    entityType: 'system',
    entityId: 'system',
    oldValue: null,
    newValue: null,
    note: 'Exported CSV tracking records',
  });

  const categories = loadCategories();
  const dailyEntries = loadDailyEntries();
  const habitIndex = buildHabitIndex(categories);
  const rows = Object.values(dailyEntries)
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((entry) =>
      Object.entries(entry.completions)
        .map(([habitId, value]) => {
          const context = habitIndex.get(habitId);

          return {
            date: entry.date,
            categoryName: context?.category.name ?? 'Unknown category',
            subComponentName: context?.habit.name ?? 'Unknown habit',
            completed: String(value),
            categoryOrder: context?.category.displayOrder ?? Number.MAX_SAFE_INTEGER,
            habitOrder: context?.habit.displayOrder ?? Number.MAX_SAFE_INTEGER,
          };
        })
        .sort((a, b) => {
          const categorySort = a.categoryOrder - b.categoryOrder;
          return categorySort === 0 ? a.habitOrder - b.habitOrder : categorySort;
        }),
    );

  return [
    CSV_HEADERS.join(','),
    ...rows.map((row) =>
      [
        row.date,
        row.categoryName,
        row.subComponentName,
        row.completed,
      ].map(escapeCSVValue).join(','),
    ),
  ].join('\n');
}

export function downloadJSON(payload: ExportPayload): void {
  downloadFile(
    JSON.stringify(payload, null, 2),
    `sadhana-backup-${dateStamp()}.json`,
    'application/json',
  );
}

export function downloadCSV(csv: string): void {
  downloadFile(
    csv,
    `sadhana-daily-records-${dateStamp()}.csv`,
    'text/csv;charset=utf-8',
  );
}

function buildHabitIndex(categories: Category[]): Map<string, { category: Category; habit: Habit }> {
  const index = new Map<string, { category: Category; habit: Habit }>();

  categories.forEach((category) => {
    category.subComponents.forEach((habit) => {
      index.set(habit.id, { category, habit });
    });
  });

  return index;
}

function escapeCSVValue(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(contents: string, filename: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
