import type { JournalEntry } from '../../types';
import { Calendar, ChevronRight } from 'lucide-react';

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
      <div className="sadhana-surface p-5 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-accent-primary/10">
          <Calendar className="text-accent-primary" size={24} />
        </div>
        <h3 className="text-body font-medium text-text-primary mb-1">No History Yet</h3>
        <p className="text-caption text-text-secondary">Your past journal entries will appear here.</p>
      </div>
    );
  }

  return (
    <div className="sadhana-surface flex max-h-[600px] flex-col overflow-hidden">
      <div className="border-b border-border bg-muted/45 p-4 lg:p-5">
        <h3 className="text-body font-medium text-text-primary flex items-center gap-2">
          <Calendar size={18} className="text-accent-primary" />
          Recent Entries
        </h3>
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
          
          return (
            <button
              key={entry.date}
              onClick={() => onSelectDate(dateObj)}
              aria-current={isSelected ? 'date' : undefined}
              className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-md p-3 text-left transition-colors lg:min-h-[64px] ${
                isSelected 
                  ? 'border border-accent-primary/20 bg-accent-primary/10 shadow-sm'
                  : 'border border-transparent hover:bg-muted/70'
              }`}
            >
              <div className="min-w-0">
                <div className={`text-body font-medium ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>
                  {displayDate}
                </div>
                <div className="mt-1 max-w-full truncate text-caption text-text-secondary">
                  {entry.mood ? `Mood: ${entry.mood}` : entry.content ? entry.content.substring(0, 30) + '...' : 'Empty entry'}
                </div>
              </div>
              <ChevronRight size={16} className={isSelected ? 'text-accent-primary' : 'text-text-secondary'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
