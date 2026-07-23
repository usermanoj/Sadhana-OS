import { Check, Compass, Sparkles } from 'lucide-react';
import type { TrackingValue } from '../../types';
import type { PlannedPractice } from '../../lib/todayPlan';
import { DynamicCategoryIcon } from './CategoryIcon';
import SubComponentToggle from './SubComponentToggle';

interface NextPracticePanelProps {
  focus: PlannedPractice | null;
  value: TrackingValue | undefined;
  onToggle: (habitId: string) => void;
  onValueChange: (habitId: string, value: TrackingValue) => void;
}

export default function NextPracticePanel({
  focus,
  value,
  onToggle,
  onValueChange,
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
          Your practice is complete
        </h2>
        <p className="mt-2 max-w-md text-body text-text-secondary">
          Every active practice has been recorded. Let the rest of the day stay spacious.
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
            <span>Based on your current practice order</span>
          </div>
          <span className="rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[0.72rem] font-semibold uppercase text-text-secondary">
            Next
          </span>
        </div>

        <div className="mt-8 flex items-start gap-4 lg:mt-10">
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
          </div>
        </div>

        <div className="mt-auto pt-8">
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
        </div>
      </div>
    </section>
  );
}
