import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Compass,
  Flame,
  Gauge,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import type { Category, DailyEntry, DateKey } from '../../types';
import { computeStreak, isCompleted } from '../../lib/scoring';
import {
  buildBalanceWheelData,
  buildCategoryBarData,
  buildChartData,
  hasCategoryScores,
} from '../../lib/chartData';
import { buildDashboardAnalytics, getPastDates } from '../../lib/analytics';
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
  const rangeSummary = useMemo(
    () => buildRangeSummary(entries, categories, range),
    [entries, categories, range],
  );
  const insightBrief = useMemo(
    () => buildInsightBrief(analytics, rangeSummary, range),
    [analytics, rangeSummary, range],
  );
  const hasCategoryAverageScores = hasCategoryScores(analytics.categoryAverages);

  return (
    <div id="page-dashboard" className="flex flex-col gap-5 pb-4 lg:gap-7">
      <ScreenHeader
        icon={Activity}
        title="Analytics"
        subtitle="Good Life score, balance, and practice patterns"
      />

      <section
        className="relative overflow-hidden rounded-lg border border-border px-4 py-5 shadow-lifted sm:px-6 lg:px-8 lg:py-7"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,253,252,0.98) 0%, rgba(250,247,241,0.98) 52%, rgba(109,74,255,0.08) 100%)',
        }}
        aria-labelledby="dashboard-insight-heading"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-success" />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(290px,390px)] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary shadow-sm">
                <Compass size={25} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Practice Intelligence
                </p>
                <h2 id="dashboard-insight-heading" className="text-heading text-text-primary">
                  Insight for the last {range} days
                </h2>
              </div>
            </div>

            <p className="max-w-3xl text-body text-text-secondary lg:text-[1.08rem]">
              {insightBrief.summary}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <DashboardHeroMetric
                icon={Gauge}
                label="Range Avg"
                value={formatPercent(rangeSummary.averageScore)}
              />
              <DashboardHeroMetric
                icon={CalendarDays}
                label="Active Days"
                value={`${rangeSummary.activeDays}/${range}`}
              />
              <DashboardHeroMetric
                icon={CheckCircle2}
                label="Done"
                value={String(rangeSummary.completedPractices)}
              />
              <DashboardHeroMetric
                icon={Flame}
                label="Streak"
                value={`${analytics.currentStreak}d`}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white/70 p-4 shadow-card backdrop-blur">
            <p className="text-caption font-medium text-text-secondary">Current focus</p>
            <h3 className="mt-1 text-subheading text-text-primary">{insightBrief.focusTitle}</h3>
            <p className="mt-2 text-caption text-text-secondary">{insightBrief.focusCopy}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-success transition-[width] duration-500"
                style={{ width: `${rangeSummary.averageScore ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3 2xl:gap-5" aria-label="Dashboard insights">
        <InsightCard
          icon={Trophy}
          title="Strongest Area"
          value={analytics.bestCategory?.name ?? '--'}
          copy={analytics.bestCategory
            ? `${formatPercent(analytics.bestCategory.averageScore)} average. Keep this rhythm steady.`
            : 'Complete a few days to reveal your strongest area.'}
          tone="success"
        />
        <InsightCard
          icon={Target}
          title="Needs Attention"
          value={analytics.weakestCategory?.name ?? '--'}
          copy={analytics.weakestCategory
            ? `${formatPercent(analytics.weakestCategory.averageScore)} average. Choose one small next action.`
            : 'A softer focus area will appear once daily scores build up.'}
          tone="warning"
        />
        <InsightCard
          icon={BarChart3}
          title="Practice Rhythm"
          value={`${rangeSummary.completionRate}%`}
          copy={`${rangeSummary.completedPractices}/${rangeSummary.totalPracticeOpportunities} tracked practices completed in this window.`}
          tone="primary"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-5" aria-label="Score snapshot">
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-5" aria-label="Practice pattern details">
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

            <div className="grid grid-cols-3 rounded-md border border-border bg-muted p-1" aria-label="Dashboard date range">
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

interface RangeSummary {
  activeDays: number;
  completedPractices: number;
  totalPracticeOpportunities: number;
  completionRate: number;
  averageScore: number | null;
}

function buildRangeSummary(
  entries: Record<DateKey, DailyEntry>,
  categories: Category[],
  range: number,
): RangeSummary {
  const activeHabits = categories
    .filter((category) => !category.isArchived)
    .flatMap((category) => category.subComponents.filter((habit) => !habit.isArchived));
  const dates = getPastDates(range);
  let activeDays = 0;
  let completedPractices = 0;
  let totalPracticeOpportunities = 0;
  const scores: number[] = [];

  for (const dateKey of dates) {
    const entry = entries[dateKey];
    if (!entry) continue;

    activeDays += 1;
    scores.push(Math.min(100, Math.max(0, entry.overallScore)));
    totalPracticeOpportunities += activeHabits.length;

    for (const habit of activeHabits) {
      if (isCompleted(entry.completions[habit.id], habit.trackingType)) {
        completedPractices += 1;
      }
    }
  }

  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
  const completionRate = totalPracticeOpportunities > 0
    ? Math.round((completedPractices / totalPracticeOpportunities) * 100)
    : 0;

  return {
    activeDays,
    completedPractices,
    totalPracticeOpportunities,
    completionRate,
    averageScore,
  };
}

function buildInsightBrief(
  analytics: ReturnType<typeof buildDashboardAnalytics>,
  summary: RangeSummary,
  range: number,
) {
  if (summary.activeDays === 0) {
    return {
      summary: 'Your dashboard will become useful after a few tracked days. Start with one honest entry and let the pattern emerge.',
      focusTitle: 'Begin with one day',
      focusCopy: 'Track today first. The dashboard is designed to reward consistency, not volume.',
    };
  }

  if (summary.averageScore !== null && summary.averageScore >= 80) {
    return {
      summary: `The last ${range} days show a strong practice rhythm. Protect what is working and keep reflection light.`,
      focusTitle: analytics.bestCategory?.name ?? 'Protect the rhythm',
      focusCopy: 'Your strongest area can become an anchor for the rest of the practice.',
    };
  }

  if (summary.completionRate < 35) {
    return {
      summary: `The last ${range} days suggest a lighter rhythm. Choose one practice group rather than trying to lift everything at once.`,
      focusTitle: analytics.weakestCategory?.name ?? 'Choose one small action',
      focusCopy: 'The best next step is small enough to repeat tomorrow.',
    };
  }

  return {
    summary: `The last ${range} days show a practice rhythm in motion. The next gain is likely in consistency rather than intensity.`,
    focusTitle: analytics.weakestCategory?.name ?? 'Steady the middle',
    focusCopy: 'Look for the one area that would make the whole day feel more balanced.',
  };
}

interface DashboardHeroMetricProps {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}

function DashboardHeroMetric({ icon: Icon, label, value }: DashboardHeroMetricProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/70 bg-white/60 px-2.5 py-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:px-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary sm:h-8 sm:w-8">
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

interface InsightCardProps {
  icon: ComponentType<LucideProps>;
  title: string;
  value: string;
  copy: string;
  tone: 'primary' | 'success' | 'warning';
}

const insightToneClasses = {
  primary: 'bg-accent-primary/10 text-accent-primary',
  success: 'bg-accent-success/10 text-accent-success',
  warning: 'bg-accent-warning/10 text-accent-warning',
};

function InsightCard({ icon: Icon, title, value, copy, tone }: InsightCardProps) {
  return (
    <article className="sadhana-surface p-4 lg:p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${insightToneClasses[tone]}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-caption font-medium text-text-secondary">{title}</p>
          <h3 className="mt-1 break-words text-subheading text-text-primary">{value}</h3>
          <p className="mt-2 text-caption text-text-secondary">{copy}</p>
        </div>
      </div>
    </article>
  );
}
