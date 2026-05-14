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
    <div id="date-navigator" className="flex items-center justify-between gap-2">
      <button
        id="date-prev"
        onClick={onPrev}
        className="flex items-center justify-center w-11 h-11 rounded-full
                   text-text-secondary hover:text-text-primary hover:bg-muted
                   transition-colors duration-150"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex flex-col items-center min-w-0">
        <span className="text-subheading text-text-primary truncate">
          {formatDisplayDate(selectedDate)}
        </span>
      </div>

      <button
        id="date-next"
        onClick={onNext}
        disabled={atToday}
        className={`flex items-center justify-center w-11 h-11 rounded-full
                    transition-colors duration-150
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
