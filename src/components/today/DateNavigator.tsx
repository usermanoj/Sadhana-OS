import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDisplayDate, isToday } from '../../hooks/useDailyEntry';

interface DateNavigatorProps {
  selectedDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function DateNavigator({ selectedDate, onPrev, onNext }: DateNavigatorProps) {
  const atToday = isToday(selectedDate);

  return (
    <div id="date-navigator" className="flex w-full items-center justify-between gap-2">
      <button
        type="button"
        id="date-prev"
        onClick={onPrev}
        className="flex h-11 w-11 items-center justify-center rounded-full
                   text-text-secondary hover:text-text-primary hover:bg-muted
                   transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-primary/30"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center px-1">
        <span className="max-w-full truncate text-center text-body font-semibold text-text-primary sm:text-subheading">
          {formatDisplayDate(selectedDate)}
        </span>
      </div>

      <button
        type="button"
        id="date-next"
        onClick={onNext}
        disabled={atToday}
        className={`flex h-11 w-11 items-center justify-center rounded-full
                    transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-primary/30
                    ${atToday
                      ? 'text-border cursor-default'
                      : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                    }`}
        aria-label="Next day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
