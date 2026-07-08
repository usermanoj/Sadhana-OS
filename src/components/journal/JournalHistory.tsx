import type { JournalEntry } from '../../types';
import { Calendar, ChevronRight, ScrollText } from 'lucide-react';

interface JournalHistoryProps {
  history: JournalEntry[];
  onSelectDate: (date: Date) => void;
  currentDateKey: string;
}

function dateKeyToLocalDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(dateKey);
  }

  return new Date(year, month - 1, day);
}

export default function JournalHistory({ history, onSelectDate, currentDateKey }: JournalHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="sadhana-surface p-5 text-center lg:sticky lg:top-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-primary/10">
          <Calendar className="text-accent-primary" size={24} aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-subheading text-text-primary">No History Yet</h3>
        <p className="text-caption text-text-secondary">
          Your past reflections will appear here once you save a journal entry.
        </p>
      </div>
    );
  }

  return (
    <aside className="sadhana-surface flex max-h-[680px] flex-col overflow-hidden lg:sticky lg:top-6" aria-label="Recent journal entries">
      <div className="border-b border-border bg-muted/45 p-4 lg:p-5">
        <h3 className="flex items-center gap-2 text-subheading text-text-primary">
          <ScrollText size={18} className="text-accent-primary" aria-hidden="true" />
          Recent Reflections
        </h3>
        <p className="mt-1 text-caption text-text-secondary">{history.length} saved entries</p>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto p-2 lg:p-3">
        {history.map((entry) => {
          const isSelected = entry.date === currentDateKey;
          const dateObj = dateKeyToLocalDate(entry.date);
          const displayDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });
          const preview = getEntryPreview(entry);
          const sectionCount = getFilledSectionCount(entry);
          
          return (
            <button
              key={entry.date}
              onClick={() => onSelectDate(dateObj)}
              aria-current={isSelected ? 'date' : undefined}
              aria-label={`Open reflection for ${displayDate}`}
              className={`flex min-h-[72px] w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-[background-color,border-color,box-shadow] duration-150 lg:min-h-[80px] ${
                isSelected 
                  ? 'border-accent-primary/25 bg-accent-primary/10 shadow-sm'
                  : 'border-transparent hover:border-border hover:bg-muted/70'
              }`}
            >
              <div className="min-w-0">
                <div className={`text-body font-medium ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>
                  {displayDate}
                </div>
                <div className="mt-1 max-w-full truncate text-caption text-text-secondary">
                  {preview}
                </div>
                <div className="mt-2 text-[0.72rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
                  {sectionCount}/6 sections
                </div>
              </div>
              <ChevronRight size={16} className={isSelected ? 'text-accent-primary' : 'text-text-secondary'} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function getEntryPreview(entry: JournalEntry): string {
  const firstAvailable = entry.mood
    || entry.gratitude
    || entry.spiritualInsight
    || entry.lessonLearned
    || entry.triggerObserved
    || entry.content;

  if (!firstAvailable?.trim()) {
    return 'Saved reflection';
  }

  return firstAvailable.trim().length > 52
    ? `${firstAvailable.trim().slice(0, 49)}...`
    : firstAvailable.trim();
}

function getFilledSectionCount(entry: JournalEntry): number {
  return [
    entry.mood,
    entry.gratitude,
    entry.spiritualInsight,
    entry.lessonLearned,
    entry.triggerObserved,
    entry.content,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0).length;
}
