import { CalendarDays, CheckCircle2, Flame, Sunrise } from 'lucide-react';
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

  const completedGroups = categories.filter((cat) => {
    const stats = categoryStats[cat.id];
    return stats && stats.total > 0 && stats.completed === stats.total;
  }).length;
  const remainingHabits = Math.max(totalHabits - totalCompleted, 0);
  const hasOpenFocus = categories.some((cat) => {
    const stats = categoryStats[cat.id];
    return stats && stats.total > 0 && stats.completed < stats.total;
  });
  const ritualTone = getRitualTone(overallScore, totalCompleted);

  return (
    <div id="page-today" className="flex w-full flex-col gap-5 pb-4 lg:gap-7">
      <section
        className="relative overflow-hidden rounded-lg border border-border px-4 py-5 shadow-lifted sm:px-6 lg:px-8 lg:py-7"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,253,252,0.98) 0%, rgba(250,247,241,0.98) 48%, rgba(109,74,255,0.08) 100%)',
        }}
        aria-labelledby="today-title"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-success" />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(280px,380px)] lg:items-center lg:gap-8">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-secondary/15 text-accent-secondary shadow-sm">
                <Sunrise size={25} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Daily Sadhana
                </p>
                <h1 id="today-title" className="truncate text-[2rem] font-semibold leading-tight text-text-primary lg:text-[2.35rem]">
                  Today
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-body text-text-secondary lg:text-[1.08rem]">
              {ritualTone}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <RitualMetric
                icon={CheckCircle2}
                label="Done"
                value={`${totalCompleted}/${totalHabits}`}
              />
              <RitualMetric
                icon={Flame}
                label="Open"
                value={String(remainingHabits)}
              />
              <RitualMetric
                icon={CalendarDays}
                label="Groups"
                value={`${completedGroups}/${categories.length}`}
              />
            </div>
          </div>

          <div className="grid items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)] lg:contents">
            <RitualProgressRing
              score={overallScore}
              completed={totalCompleted}
              total={totalHabits}
            />

            <div className="flex min-w-0 flex-col gap-3">
              <div className="rounded-lg border border-border bg-white/75 px-2 py-1 shadow-card backdrop-blur">
                <DateNavigator
                  selectedDate={selectedDate}
                  onPrev={goToPrev}
                  onNext={goToNext}
                />
              </div>
              <div className="hidden rounded-lg border border-border/70 bg-white/55 px-4 py-3 sm:block">
                <p className="text-caption font-medium text-text-secondary">Next focus</p>
                <p className="mt-1 truncate text-subheading text-text-primary">
                  {hasOpenFocus ? 'One steady step' : 'All groups complete'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sadhana-surface px-4 py-4 sm:px-5 lg:px-7 lg:py-6" aria-labelledby="daily-score-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="daily-score-heading" className="text-subheading text-text-primary">Daily Score</h2>
          <span className="text-caption text-text-secondary tabular-nums">
            {totalCompleted}/{totalHabits} practices
          </span>
        </div>
        <ScoreBar score={overallScore} height={8} showLabel />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="practice-path-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="practice-path-heading" className="text-heading text-text-primary">Practice Path</h2>
            <p className="text-caption text-text-secondary">Your active groups for this day</p>
          </div>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-caption text-text-secondary shadow-sm">
            {categories.length} groups
          </span>
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
      </section>
    </div>
  );
}

function getRitualTone(score: number, completed: number): string {
  if (score >= 100) return 'A complete day. Let the record stay quiet and honest.';
  if (score >= 70) return 'A strong rhythm is forming. Keep the day light and deliberate.';
  if (completed > 0) return 'Momentum has started. Let the next action be simple and steady.';
  return 'Begin with one clear action. The day does not need force, only attention.';
}

interface RitualProgressRingProps {
  score: number;
  completed: number;
  total: number;
}

function RitualProgressRing({ score, completed, total }: RitualProgressRingProps) {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="mx-auto flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white/65 shadow-card backdrop-blur sm:h-36 sm:w-36 lg:h-44 lg:w-44">
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 128 128"
          role="progressbar"
          aria-label={`Daily Score: ${clampedScore}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedScore}
        >
          <defs>
            <linearGradient id="ritual-progress" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-danger)" />
              <stop offset="50%" stopColor="var(--accent-warning)" />
              <stop offset="100%" stopColor="var(--accent-success)" />
            </linearGradient>
          </defs>
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="var(--bg-muted)"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="url(#ritual-progress)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[1.65rem] font-semibold leading-none text-text-primary sm:text-[1.85rem] lg:text-[2rem]">
            {clampedScore}%
          </span>
          <span className="mt-1 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-text-secondary">
            {completed}/{total}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RitualMetricProps {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
}

function RitualMetric({ icon: Icon, label, value }: RitualMetricProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/70 bg-white/55 px-2.5 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary sm:h-8 sm:w-8">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-text-secondary sm:text-[0.72rem] sm:tracking-[0.12em]">
          {label}
        </p>
        <p className="text-[1.15rem] font-semibold leading-tight text-text-primary sm:text-subheading">{value}</p>
      </div>
    </div>
  );
}
