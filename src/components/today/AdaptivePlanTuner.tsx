import { useEffect, useState } from 'react';
import { BatteryMedium, Clock3, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import type { Category, DailyEnergyLevel, DailySadhanaPlan } from '../../types';
import type { DailyPlanContext } from '../../hooks/useAdaptiveDailyPlan';

interface AdaptivePlanTunerProps {
  plan: DailySadhanaPlan;
  categories: Category[];
  onGenerate: (context: DailyPlanContext) => void;
}

const timeOptions = [5, 10, 15, 30];
const energyOptions: Array<{ value: DailyEnergyLevel; label: string }> = [
  { value: 1, label: 'Very low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Strong' },
];

export default function AdaptivePlanTuner({
  plan,
  categories,
  onGenerate,
}: AdaptivePlanTunerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState(plan.availableMinutes);
  const [energyLevel, setEnergyLevel] = useState(plan.energyLevel);
  const [focusCategoryIds, setFocusCategoryIds] = useState(plan.focusCategoryIds);
  const [intention, setIntention] = useState(plan.intention ?? '');

  useEffect(() => {
    setAvailableMinutes(plan.availableMinutes);
    setEnergyLevel(plan.energyLevel);
    setFocusCategoryIds(plan.focusCategoryIds);
    setIntention(plan.intention ?? '');
  }, [plan]);

  const toggleFocus = (categoryId: string) => {
    setFocusCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }
      if (current.length >= 2) return current;
      return [...current, categoryId];
    });
  };

  const apply = () => {
    onGenerate({
      mode: plan.mode,
      availableMinutes,
      energyLevel,
      focusCategoryIds,
      intention,
    });
    setIsOpen(false);
  };

  return (
    <div
      className="mt-3 border-t border-border pt-3 sm:mt-5 sm:pt-5"
      role="region"
      aria-labelledby="plan-context-heading"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 id="plan-context-heading" className="text-subheading text-text-primary">
            Plan context
          </h2>
          <button
            type="button"
            className="sadhana-button-secondary"
            aria-label={isOpen ? 'Close plan tuner' : 'Tune plan'}
            aria-expanded={isOpen}
            aria-controls="adaptive-plan-tuner"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X size={18} aria-hidden="true" /> : <SlidersHorizontal size={18} aria-hidden="true" />}
            {isOpen ? 'Close' : 'Tune'}
          </button>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={15} aria-hidden="true" />
            {plan.availableMinutes} minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BatteryMedium size={15} aria-hidden="true" />
            Energy {plan.energyLevel}/5
          </span>
          <span>
            {plan.focusCategoryIds.length > 0
              ? `${plan.focusCategoryIds.length} focus ${plan.focusCategoryIds.length === 1 ? 'area' : 'areas'}`
              : 'No focus selected'}
          </span>
        </p>
      </div>

      {isOpen ? (
        <div
          id="adaptive-plan-tuner"
          className="mt-5 grid gap-6 border-t border-border pt-5 lg:grid-cols-2 lg:gap-x-8"
        >
          <fieldset>
            <legend className="text-body font-semibold text-text-primary">Time available</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {timeOptions.map((minutes) => (
                <ChoiceButton
                  key={minutes}
                  selected={availableMinutes === minutes}
                  onClick={() => setAvailableMinutes(minutes)}
                  label={`${minutes} min`}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-body font-semibold text-text-primary">Energy right now</legend>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {energyOptions.map((option) => (
                <ChoiceButton
                  key={option.value}
                  selected={energyLevel === option.value}
                  onClick={() => setEnergyLevel(option.value)}
                  label={String(option.value)}
                  accessibleLabel={`${option.label} energy, ${option.value} of 5`}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="lg:col-span-2">
            <legend className="text-body font-semibold text-text-primary">
              Focus areas <span className="font-normal text-text-secondary">(up to two)</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((category) => (
                <ChoiceButton
                  key={category.id}
                  selected={focusCategoryIds.includes(category.id)}
                  onClick={() => toggleFocus(category.id)}
                  label={category.name}
                  disabled={!focusCategoryIds.includes(category.id) && focusCategoryIds.length >= 2}
                />
              ))}
            </div>
          </fieldset>

          <label className="lg:col-span-2">
            <span className="text-body font-semibold text-text-primary">
              Intention <span className="font-normal text-text-secondary">(optional)</span>
            </span>
            <input
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              value={intention}
              maxLength={80}
              onChange={(event) => setIntention(event.target.value)}
              placeholder="What should this practice protect today?"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
            <p className="max-w-xl text-caption text-text-secondary">
              Your check-in shapes today&apos;s suggestion only. It never marks a practice complete.
            </p>
            <button type="button" className="sadhana-button-primary" onClick={apply}>
              <Sparkles size={18} aria-hidden="true" />
              Prepare my plan
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
  accessibleLabel,
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  accessibleLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 rounded-md border px-3 py-2 text-caption font-medium transition-colors
                  focus-visible:ring-2 focus-visible:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-40
                  ${selected
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border bg-surface text-text-secondary hover:border-accent-primary/40 hover:text-text-primary'
                  }`}
    >
      {label}
    </button>
  );
}
