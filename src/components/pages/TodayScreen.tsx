import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Sparkles,
  Sunrise,
} from 'lucide-react';
import { useDailyEntry } from '../../hooks/useDailyEntry';
import { buildTodayPlan, type DailyPlanMode } from '../../lib/todayPlan';
import DateNavigator from '../today/DateNavigator';
import ScoreBar from '../today/ScoreBar';
import CategoryAccordion from '../today/CategoryAccordion';
import NextPracticePanel from '../today/NextPracticePanel';
import PlanModeSelector from '../today/PlanModeSelector';
import { DynamicCategoryIcon } from '../today/CategoryIcon';

export default function TodayScreen() {
  const [planMode, setPlanMode] = useState<DailyPlanMode>('balanced');
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

  const plan = useMemo(
    () => buildTodayPlan(categories, entry.completions, planMode),
    [categories, entry.completions, planMode],
  );
  const completedGroups = categories.filter((category) => {
    const stats = categoryStats[category.id];
    return stats && stats.total > 0 && stats.completed === stats.total;
  }).length;
  const isFullDayComplete = totalHabits > 0 && totalCompleted === totalHabits;
  const ritualTone = getRitualTone(overallScore, totalCompleted);

  return (
    <div id="page-today" className="flex w-full flex-col gap-6 pb-4 lg:gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-secondary/15 text-accent-secondary shadow-sm">
            <Sunrise size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-semibold uppercase text-text-secondary">
              Daily Sadhana
            </p>
            <h1
              id="today-title"
              className="text-[2rem] font-semibold leading-tight text-text-primary lg:text-[2.35rem]"
            >
              Today
            </h1>
            <p className="mt-1 max-w-2xl text-body text-text-secondary lg:text-[1.05rem]">
              {ritualTone}
            </p>
          </div>
        </div>

        <div className="w-full rounded-lg border border-border bg-surface px-2 py-1 shadow-sm lg:w-[360px]">
          <DateNavigator
            selectedDate={selectedDate}
            onPrev={goToPrev}
            onNext={goToNext}
          />
        </div>
      </header>

      <section className="border-y border-border py-4 sm:py-5" aria-labelledby="plan-depth-heading">
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.55fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div>
            <h2 id="plan-depth-heading" className="text-subheading text-text-primary">
              Choose today&apos;s depth
            </h2>
            <p className="mt-1 text-caption text-text-secondary">
              Keep the plan realistic for the day you have.
            </p>
          </div>
          <PlanModeSelector value={planMode} onChange={setPlanMode} />
        </div>
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)] lg:gap-5">
        <NextPracticePanel
          focus={plan.focus}
          value={plan.focus ? entry.completions[plan.focus.habit.id] : undefined}
          onToggle={toggleSubComponent}
          onValueChange={setTrackingValue}
        />
        <PlanOverview mode={planMode} plan={plan} />
      </div>

      {isFullDayComplete ? (
        <section
          className="animate-completionPulse border-y border-accent-success/25 bg-accent-success/10 px-1 py-4"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-success/10 text-accent-success">
              <Sparkles size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-subheading text-text-primary">Full Day Complete</h2>
              <p className="text-caption text-text-secondary">
                All groups complete. Every active practice has been recorded.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section
        className="sadhana-surface px-4 py-4 sm:px-5 lg:px-7 lg:py-6"
        aria-labelledby="daily-score-heading"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
          <div>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="daily-score-heading" className="text-subheading text-text-primary">
                Daily Score
              </h2>
              <span className="text-caption tabular-nums text-text-secondary">
                {totalCompleted}/{totalHabits} practices
              </span>
            </div>
            <ScoreBar score={overallScore} height={8} showLabel />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <RhythmMetric label="Done" value={String(totalCompleted)} />
            <RhythmMetric label="Open" value={String(plan.totalRemaining)} />
            <RhythmMetric label="Groups" value={`${completedGroups}/${categories.length}`} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="practice-library-heading">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-caption font-semibold uppercase text-text-secondary">
              Complete tracker
            </p>
            <h2 id="practice-library-heading" className="mt-1 text-heading text-text-primary">
              Practice Library
            </h2>
            <p className="mt-1 text-caption text-text-secondary">
              Review or record any active practice directly.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-caption text-text-secondary">
            <CalendarDays size={16} aria-hidden="true" />
            {categories.length} groups
          </span>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-2 2xl:gap-5">
          {categories.map((category) => (
            <CategoryAccordion
              key={category.id}
              category={category}
              stats={categoryStats[category.id] ?? { completed: 0, total: 0, score: 0 }}
              completions={entry.completions}
              onToggle={toggleSubComponent}
              onValueChange={setTrackingValue}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface PlanOverviewProps {
  mode: DailyPlanMode;
  plan: ReturnType<typeof buildTodayPlan>;
}

function PlanOverview({ mode, plan }: PlanOverviewProps) {
  const planCount = plan.items.length;
  const upcoming = plan.items.slice(1, 4);
  const hiddenCount = Math.max(planCount - 4, 0);

  return (
    <section
      className="sadhana-surface flex min-h-[280px] flex-col px-5 py-6 sm:px-6 lg:min-h-[340px]"
      aria-labelledby="today-focus-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-semibold uppercase text-text-secondary">
            {getModeLabel(mode)} plan
          </p>
          <h2 id="today-focus-heading" className="mt-1 text-subheading text-text-primary">
            Today&apos;s focus
          </h2>
        </div>
        <CircleDot size={20} className="text-accent-primary" aria-hidden="true" />
      </div>

      <p className="mt-3 text-body font-medium text-text-primary">
        {planCount} {planCount === 1 ? 'practice' : 'practices'} in focus
      </p>
      <p className="mt-1 text-caption text-text-secondary">
        {plan.totalRemaining === 0
          ? 'Nothing remains to record.'
          : `${plan.totalRemaining} of ${plan.totalActive} active practices remain today.`}
      </p>

      <div className="mt-5 flex flex-1 flex-col">
        {upcoming.length > 0 ? (
          <>
            <p className="text-caption font-semibold text-text-secondary">Up next</p>
            <ul className="mt-2 divide-y divide-border/70">
              {upcoming.map((item) => (
                <li key={item.habit.id} className="flex items-center gap-3 py-3 first:pt-1">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.category.color}12` }}
                  >
                    <DynamicCategoryIcon
                      iconName={item.category.icon}
                      color={item.category.color}
                      size={17}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-text-primary">
                      {item.habit.name}
                    </p>
                    <p className="truncate text-caption text-text-secondary">
                      {item.category.name}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-1 items-center">
            <div className="flex items-center gap-3 text-caption text-text-secondary">
              <CheckCircle2
                size={18}
                className={plan.totalRemaining === 0 ? 'text-accent-success' : 'text-accent-primary'}
                aria-hidden="true"
              />
              <span>
                {plan.totalRemaining === 0
                  ? 'All groups complete'
                  : 'One clear practice is enough for this plan.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {hiddenCount > 0 ? (
        <p className="mt-3 border-t border-border pt-3 text-caption text-text-secondary">
          +{hiddenCount} more in the Practice Library
        </p>
      ) : null}
    </section>
  );
}

function RhythmMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[72px] rounded-md bg-muted/55 px-3 py-2 text-center">
      <p className="text-[0.7rem] font-semibold uppercase text-text-secondary">{label}</p>
      <p className="mt-0.5 text-subheading tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function getModeLabel(mode: DailyPlanMode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getRitualTone(score: number, completed: number): string {
  if (score >= 100) return 'A complete day. Let the record stay quiet and honest.';
  if (score >= 70) return 'A strong rhythm is forming. Keep the day light and deliberate.';
  if (completed > 0) return 'Momentum has started. Let the next action be simple and steady.';
  return 'Begin with one clear action. The day needs attention, not force.';
}
