import { Sunrise } from 'lucide-react';
import { useDailyEntry } from '../../hooks/useDailyEntry';
import DateNavigator from '../today/DateNavigator';
import ScoreBar from '../today/ScoreBar';
import CategoryAccordion from '../today/CategoryAccordion';
import ScreenHeader from '../ui/ScreenHeader';

export default function TodayScreen() {
  const {
    selectedDate,
    entry,
    categories,
    categoryStats,
    totalCompleted,
    totalHabits,
    overallScore,
    goToPrev,
    goToNext,
    toggleSubComponent,
    setTrackingValue,
  } = useDailyEntry();

  return (
    <div id="page-today" className="flex w-full flex-col gap-5 pb-4 lg:gap-7">
      <ScreenHeader
        icon={Sunrise}
        title="Today"
        subtitle="Daily practice rhythm"
        tone="amber"
        actions={(
          <div className="rounded-md border border-border bg-surface px-2 py-1 shadow-sm sm:min-w-80 lg:min-w-[380px] lg:px-3">
            <DateNavigator
              selectedDate={selectedDate}
              onPrev={goToPrev}
              onNext={goToNext}
            />
          </div>
        )}
      />

      <div className="rounded-md border border-border bg-surface px-4 py-4 shadow-sm sm:px-5 lg:px-7 lg:py-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-subheading text-text-primary">Daily Score</h2>
          <span className="text-caption text-text-secondary tabular-nums">
            {totalCompleted}/{totalHabits} practices
          </span>
        </div>
        <ScoreBar score={overallScore} height={7} showLabel />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2 2xl:gap-5">
        {categories.map((cat) => (
          <CategoryAccordion
            key={cat.id}
            category={cat}
            stats={categoryStats[cat.id] ?? { completed: 0, total: 0, score: 0 }}
            completions={entry.completions}
            onToggle={toggleSubComponent}
            onValueChange={setTrackingValue}
          />
        ))}
      </div>
    </div>
  );
}
