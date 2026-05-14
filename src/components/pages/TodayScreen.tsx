import { useDailyEntry } from '../../hooks/useDailyEntry';
import DateNavigator from '../today/DateNavigator';
import ScoreBar from '../today/ScoreBar';
import CategoryAccordion from '../today/CategoryAccordion';

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
    <div id="page-today" className="flex flex-col gap-5 pb-4">
      {/* Date Navigation */}
      <DateNavigator
        selectedDate={selectedDate}
        onPrev={goToPrev}
        onNext={goToNext}
      />

      {/* Overall Score Card */}
      <div className="bg-surface border border-border rounded-md shadow-sm px-4 py-4">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-subheading text-text-primary">Daily Score</h2>
          <span className="text-caption text-text-secondary tabular-nums">
            {totalCompleted}/{totalHabits} practices
          </span>
        </div>
        <ScoreBar score={overallScore} height={6} showLabel />
      </div>

      {/* Category Accordions */}
      <div className="flex flex-col gap-3">
        {categories.map((cat, index) => (
          <CategoryAccordion
            key={cat.id}
            category={cat}
            stats={categoryStats[cat.id] ?? { completed: 0, total: 0, score: 0 }}
            completions={entry.completions}
            defaultOpen={index === 0}
            onToggle={toggleSubComponent}
            onValueChange={setTrackingValue}
          />
        ))}
      </div>
    </div>
  );
}
