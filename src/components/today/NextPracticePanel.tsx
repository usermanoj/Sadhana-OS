import { Check, Clock3, Compass, RefreshCw, Scissors, Sparkles } from 'lucide-react';
import type { DailyPlanStatus, TrackingValue } from '../../types';
import type { ResolvedDailyPlanItem } from '../../lib/adaptiveDailyPlan';
import { DynamicCategoryIcon } from './CategoryIcon';
import SubComponentToggle from './SubComponentToggle';

interface NextPracticePanelProps {
  focus: ResolvedDailyPlanItem | null;
  value: TrackingValue | undefined;
  reason: string | null;
  planStatus: DailyPlanStatus;
  allActiveComplete: boolean;
  onToggle: (habitId: string) => void;
  onValueChange: (habitId: string, value: TrackingValue) => void;
  onShorten: (habitId: string) => void;
  onReplace: (habitId: string) => void;
  onConfirm: () => void;
}

export default function NextPracticePanel({
  focus,
  value,
  reason,
  planStatus,
  allActiveComplete,
  onToggle,
  onValueChange,
  onShorten,
  onReplace,
  onConfirm,
}: NextPracticePanelProps) {
  if (!focus) {
    return (
      <section
        className="sadhana-focus-surface flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center sm:px-8"
        aria-labelledby="next-practice-heading"
        aria-live="polite"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent-success/10 text-accent-success">
          <Sparkles size={27} aria-hidden="true" />
        </span>
        <h2 id="next-practice-heading" className="mt-5 text-heading text-text-primary">
          {allActiveComplete ? 'Your practice is complete' : 'Today\'s plan is complete'}
        </h2>
        <p className="mt-2 max-w-md text-body text-text-secondary">
          {allActiveComplete
            ? 'Every active practice has been recorded. Let the rest of the day stay spacious.'
            : 'You completed the practices in this plan. Tune it only if another step would genuinely help.'}
        </p>
      </section>
    );
  }

  const { category, habit } = focus;
  const categoryTint = `${category.color}12`;

  return (
    <section
      className="sadhana-focus-surface relative min-h-[280px] overflow-hidden px-5 py-6 sm:px-7 sm:py-7 lg:min-h-[340px] lg:px-9 lg:py-8"
      aria-labelledby="next-practice-heading"
      aria-live="polite"
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />

      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-caption font-medium text-text-secondary">
            <Compass size={16} className="text-accent-primary" aria-hidden="true" />
            <span>{reason ?? 'Based on your current plan context'}</span>
          </div>
          <span className="rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[0.72rem] font-semibold uppercase text-text-secondary">
            {planStatus === 'confirmed' ? 'Confirmed' : 'Suggested'}
          </span>
        </div>

        <div className="mt-5 flex items-start gap-4 sm:mt-7 lg:mt-10">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg shadow-sm lg:h-16 lg:w-16"
            style={{ backgroundColor: categoryTint }}
          >
            <DynamicCategoryIcon
              iconName={category.icon}
              color={category.color}
              size={27}
            />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-semibold uppercase text-text-secondary">
              {category.name}
            </p>
            <h2
              id="next-practice-heading"
              className="mt-1 break-words text-[1.85rem] font-semibold leading-tight text-text-primary sm:text-[2.15rem] lg:text-[2.45rem]"
            >
              Your next practice
            </h2>
            <p className="mt-2 break-words text-[1.35rem] font-medium leading-snug text-text-primary sm:text-[1.55rem]">
              {habit.name}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-caption text-text-secondary">
              <Clock3 size={15} aria-hidden="true" />
              About {focus.item.plannedMinutes} minutes
            </p>
          </div>
        </div>

        <div className="mt-auto pt-5 sm:pt-7 lg:pt-8">
          {habit.trackingType === 'boolean' ? (
            <button
              type="button"
              className="sadhana-button-primary w-full sm:w-auto sm:min-w-[190px]"
              onClick={() => onToggle(habit.id)}
              aria-label={`Complete ${habit.name}`}
            >
              <Check size={19} aria-hidden="true" />
              Mark complete
            </button>
          ) : (
            <div className="rounded-lg border border-border/75 bg-surface/80 px-4 py-3">
              <SubComponentToggle
                habit={habit}
                value={value}
                onToggle={onToggle}
                onValueChange={onValueChange}
              />
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {planStatus === 'suggested' ? (
              <button
                type="button"
                className="sadhana-button-secondary"
                onClick={onConfirm}
              >
                <Check size={17} aria-hidden="true" />
                Use this plan
              </button>
            ) : null}
            {focus.item.plannedMinutes > 1 ? (
              <button
                type="button"
                className="sadhana-button-secondary"
                onClick={() => onShorten(habit.id)}
              >
                <Scissors size={17} aria-hidden="true" />
                Shorten
              </button>
            ) : null}
            <button
              type="button"
              className="sadhana-button-secondary"
              onClick={() => onReplace(habit.id)}
            >
              <RefreshCw size={17} aria-hidden="true" />
              Replace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
