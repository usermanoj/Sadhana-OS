import { useMemo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Sparkles,
  Sunrise,
} from 'lucide-react';
import { useDailyEntry } from '../../hooks/useDailyEntry';
import { useAdaptiveDailyPlan } from '../../hooks/useAdaptiveDailyPlan';
import { buildTodayPlan } from '../../lib/todayPlan';
import {
  getPlanReasonText,
  resolveDailyPlanItems,
  type ResolvedDailyPlanItem,
} from '../../lib/adaptiveDailyPlan';
import type { DailyPlanMode, DailySadhanaPlan } from '../../types';
import DateNavigator from '../today/DateNavigator';
import ScoreBar from '../today/ScoreBar';
import CategoryAccordion from '../today/CategoryAccordion';
import NextPracticePanel from '../today/NextPracticePanel';
import PlanModeSelector from '../today/PlanModeSelector';
import AdaptivePlanTuner from '../today/AdaptivePlanTuner';
import { DynamicCategoryIcon } from '../today/CategoryIcon';

export default function TodayScreen() {
  const {
    selectedDate,
    entry,
    entries,
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

  const adaptive = useAdaptiveDailyPlan({
    date: entry.date,
    categories,
    entries,
    currentCompletions: entry.completions,
  });
  const resolvedPlanItems = useMemo(
    () => resolveDailyPlanItems(adaptive.plan, categories, entry.completions),
    [adaptive.plan, categories, entry.completions],
  );
  const libraryPlan = useMemo(
    () => buildTodayPlan(categories, entry.completions, 'full'),
    [categories, entry.completions],
  );
  const focus = resolvedPlanItems[0] ?? null;
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

      <section className="border-y border-border py-3 sm:py-5" aria-labelledby="plan-depth-heading">
        <div className="grid gap-2.5 sm:gap-4 lg:grid-cols-[minmax(220px,0.55fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div>
            <h2
              id="plan-depth-heading"
              className="sr-only text-subheading text-text-primary sm:not-sr-only"
            >
              Choose today&apos;s depth
            </h2>
            <p className="mt-1 hidden text-caption text-text-secondary sm:block">
              Keep the plan realistic for the day you have.
            </p>
          </div>
          <PlanModeSelector value={adaptive.plan.mode} onChange={adaptive.setMode} />
        </div>
        <AdaptivePlanTuner
          plan={adaptive.plan}
          categories={categories}
          onGenerate={adaptive.generate}
        />
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)] lg:gap-5">
        <NextPracticePanel
          focus={focus}
          value={focus ? entry.completions[focus.habit.id] : undefined}
          reason={focus ? getPlanReasonText(focus.item, focus.category.name) : null}
          planStatus={adaptive.plan.status}
          allActiveComplete={libraryPlan.totalRemaining === 0}
          onToggle={toggleSubComponent}
          onValueChange={setTrackingValue}
          onShorten={adaptive.shorten}
          onReplace={adaptive.replace}
          onConfirm={adaptive.confirm}
        />
        <PlanOverview
          plan={adaptive.plan}
          items={resolvedPlanItems}
          totalActive={libraryPlan.totalActive}
          totalRemaining={libraryPlan.totalRemaining}
        />
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
            <RhythmMetric label="Open" value={String(libraryPlan.totalRemaining)} />
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
  plan: DailySadhanaPlan;
  items: ResolvedDailyPlanItem[];
  totalActive: number;
  totalRemaining: number;
}

function PlanOverview({ plan, items, totalActive, totalRemaining }: PlanOverviewProps) {
  const planCount = items.length;
  const upcoming = items.slice(1, 4);
  const hiddenCount = Math.max(planCount - 4, 0);
  const plannedMinutes = items.reduce((total, item) => total + item.item.plannedMinutes, 0);

  return (
    <section
      className="sadhana-surface flex min-h-[280px] flex-col px-5 py-6 sm:px-6 lg:min-h-[340px]"
      aria-labelledby="today-focus-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-semibold uppercase text-text-secondary">
            {getModeLabel(plan.mode)} plan
          </p>
          <h2 id="today-focus-heading" className="mt-1 text-subheading text-text-primary">
            Today&apos;s focus
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[0.7rem] font-semibold uppercase text-text-secondary">
          <CircleDot size={13} className="text-accent-primary" aria-hidden="true" />
          {plan.status}
        </span>
      </div>

      <p className="mt-3 text-body font-medium text-text-primary">
        {planCount} {planCount === 1 ? 'practice' : 'practices'} - {plannedMinutes} min
      </p>
      <p className="mt-1 text-caption text-text-secondary">
        {totalRemaining === 0
          ? 'Nothing remains to record.'
          : `${totalRemaining} of ${totalActive} active practices remain today.`}
      </p>
      {plan.intention ? (
        <p className="mt-3 border-l-2 border-accent-primary/40 pl-3 text-caption text-text-secondary">
          Intention: {plan.intention}
        </p>
      ) : null}

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
                      {item.category.name} - {item.item.plannedMinutes} min
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
                className={totalRemaining === 0 ? 'text-accent-success' : 'text-accent-primary'}
                aria-hidden="true"
              />
              <span>
                {totalRemaining === 0
                  ? 'All groups complete'
                  : planCount === 0
                    ? 'This saved plan is complete. Tune it to add another practice.'
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
