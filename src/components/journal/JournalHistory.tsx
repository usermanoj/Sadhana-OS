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
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border text-center">
        <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-3">
          <Calendar className="text-accent-primary" size={24} />
        </div>
        <h3 className="text-body font-medium text-text-primary mb-1">No History Yet</h3>
        <p className="text-caption text-text-secondary">Your past journal entries will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col max-h-[600px]">
      <div className="p-4 border-b border-border bg-ivory">
        <h3 className="text-body font-medium text-text-primary flex items-center gap-2">
          <Calendar size={18} className="text-accent-primary" />
          Recent Entries
        </h3>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
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
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                isSelected 
                  ? 'bg-accent-primary/10 border border-accent-primary/20' 
                  : 'hover:bg-muted border border-transparent'
              }`}
            >
              <div>
                <div className={`font-medium ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>
                  {displayDate}
                </div>
                <div className="text-caption text-text-secondary mt-1 truncate max-w-[200px]">
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
