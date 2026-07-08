import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { computeStreak } from '../../lib/scoring';
import {
  buildBalanceWheelData,
  buildCategoryBarData,
  buildChartData,
  hasCategoryScores,
} from '../../lib/chartData';
import { buildDashboardAnalytics } from '../../lib/analytics';
import { appRepository } from '../../lib/repository';
import BalanceWheelChart from '../dashboard/BalanceWheelChart';
import CategoryBarChart from '../dashboard/CategoryBarChart';
import MetricCard from '../dashboard/MetricCard';
import StreakCard from '../dashboard/StreakCard';
import TrendChart from '../dashboard/TrendChart';
import ScreenHeader from '../ui/ScreenHeader';

const ranges = [7, 30, 90] as const;

const formatPercent = (score: number | null): string => (
  score === null ? '--' : `${Math.round(score)}%`
);

const scoreTone = (score: number | null): 'primary' | 'success' | 'warning' | 'danger' => {
  if (score === null) return 'primary';
  if (score >= 80) return 'success';
  if (score >= 40) return 'warning';
  return 'danger';
};

const emptyText = 'Not enough entries yet';

export default function DashboardScreen() {
  const [range, setRange] = useState<number>(7);
  const [categoryFilter, setCategoryFilter] = useState<string>('overall');

  const entries = useMemo(() => appRepository.getDailyEntries(), []);
  const categories = useMemo(
    () => appRepository.getCategories().filter((category) => !category.isArchived),
    [],
  );

  const chartData = useMemo(
    () => buildChartData(entries, categories, range, categoryFilter),
    [entries, categories, range, categoryFilter],
  );
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const analytics = useMemo(
    () => buildDashboardAnalytics(entries, categories, streak, range),
    [entries, categories, range, streak],
  );
  const categoryBarData = useMemo(
    () => buildCategoryBarData(analytics.categoryAverages),
    [analytics.categoryAverages],
  );
  const balanceWheelData = useMemo(
    () => buildBalanceWheelData(categories, analytics.categoryAverages),
    [categories, analytics.categoryAverages],
  );
  const hasCategoryAverageScores = hasCategoryScores(analytics.categoryAverages);

  return (
    <div id="page-dashboard" className="flex flex-col gap-5 pb-4 lg:gap-7">
      <ScreenHeader
        icon={Activity}
        title="Analytics"
        subtitle="Good Life score, balance, and practice patterns"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-5">
        <MetricCard
          title="Today Good Life Score"
          value={formatPercent(analytics.todayScore)}
          subtitle={analytics.todayScore === null ? emptyText : 'saved for today'}
          icon={Activity}
          tone={scoreTone(analytics.todayScore)}
        />
        <MetricCard
          title="Weekly Average"
          value={formatPercent(analytics.weeklyAverage)}
          subtitle="last 7 days with entries"
          icon={CalendarDays}
          tone={scoreTone(analytics.weeklyAverage)}
        />
        <MetricCard
          title="Monthly Average"
          value={formatPercent(analytics.monthlyAverage)}
          subtitle="last 30 days with entries"
          icon={Target}
          tone={scoreTone(analytics.monthlyAverage)}
        />
        <StreakCard streak={analytics.currentStreak} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-5">
        <MetricCard
          title="Best Performing Category"
          value={analytics.bestCategory?.name ?? '--'}
          subtitle={analytics.bestCategory ? formatPercent(analytics.bestCategory.averageScore) : emptyText}
          icon={Trophy}
          tone="success"
        />
        <MetricCard
          title="Weakest Category"
          value={analytics.weakestCategory?.name ?? '--'}
          subtitle={analytics.weakestCategory ? formatPercent(analytics.weakestCategory.averageScore) : emptyText}
          icon={TrendingDown}
          tone="danger"
        />
        <MetricCard
          title="Most Completed Habit"
          value={analytics.mostCompletedHabit?.habitName ?? '--'}
          subtitle={
            analytics.mostCompletedHabit
              ? `${analytics.mostCompletedHabit.completedCount} completions`
              : emptyText
          }
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          title="Most Missed Habit"
          value={analytics.mostMissedHabit?.habitName ?? '--'}
          subtitle={
            analytics.mostMissedHabit
              ? `${analytics.mostMissedHabit.missedCount} misses`
              : emptyText
          }
          icon={CircleDashed}
          tone="warning"
        />
      </section>

      <section className="sadhana-surface p-4 lg:p-6 2xl:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-subheading text-text-primary">Good Life Score Over Time</h2>
            <p className="text-caption text-text-secondary">Overall or category trend.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="dashboard-category-filter">
              Category filter
            </label>
            <select
              id="dashboard-category-filter"
              className="sadhana-input w-full text-text-secondary sm:w-56"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="overall">Overall Score</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 rounded-md border border-border bg-muted p-1" aria-label="Date range">
              {ranges.map((days) => (
                <button
                  key={days}
                  type="button"
                  aria-pressed={range === days}
                  aria-label={`${days} days`}
                  onClick={() => setRange(days)}
                  className={`min-h-[44px] rounded-sm px-3 text-body font-medium transition-colors duration-150 ${
                    range === days
                      ? 'bg-accent-primary text-white shadow-sm'
                      : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
        </div>

        <TrendChart data={chartData} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 2xl:gap-5">
        <div className="sadhana-surface p-4 lg:p-6 2xl:p-7">
          <div className="mb-5">
            <h2 className="text-subheading text-text-primary">9-Category Balance Wheel</h2>
            <p className="text-caption text-text-secondary">Average category balance for this range.</p>
          </div>
          <BalanceWheelChart data={balanceWheelData} hasScores={hasCategoryAverageScores} />
        </div>

        <div className="sadhana-surface p-4 lg:p-6 2xl:p-7">
          <div className="mb-5">
            <h2 className="text-subheading text-text-primary">Category Scores</h2>
            <p className="text-caption text-text-secondary">Average score by active category.</p>
          </div>
          <CategoryBarChart data={categoryBarData} />
        </div>
      </section>

      <section className="sadhana-surface p-4 lg:p-6 2xl:p-7">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp size={20} className="text-accent-primary" aria-hidden="true" />
          <h2 className="text-subheading text-text-primary">Category Average Scores</h2>
        </div>

        {hasCategoryAverageScores ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:gap-4">
            {analytics.categoryAverages.map((category) => {
              const score = category.averageScore ?? 0;

              return (
                <div key={category.categoryId} className="flex flex-col gap-2 rounded-md bg-muted/45 p-3 lg:p-4">
                  <div className="flex items-center justify-between gap-3 text-body">
                    <span className="min-w-0 truncate text-text-primary">{category.name}</span>
                    <span className="shrink-0 tabular-nums text-text-secondary">
                      {category.averageScore === null ? 'No data' : `${score}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score}%`, backgroundColor: category.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-muted/50 p-4 text-body text-text-secondary">
            Add daily entries to see category averages.
          </div>
        )}
      </section>
    </div>
  );
}
