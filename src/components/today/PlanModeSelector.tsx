import { Layers3, ListChecks, Minus } from 'lucide-react';
import type { DailyPlanMode } from '../../lib/todayPlan';

interface PlanModeSelectorProps {
  value: DailyPlanMode;
  onChange: (mode: DailyPlanMode) => void;
}

const modeOptions = [
  {
    value: 'minimum',
    label: 'Minimum',
    detail: 'One practice',
    icon: Minus,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    detail: 'Next three',
    icon: ListChecks,
  },
  {
    value: 'full',
    label: 'Full',
    detail: 'All remaining',
    icon: Layers3,
  },
] satisfies Array<{
  value: DailyPlanMode;
  label: string;
  detail: string;
  icon: typeof Minus;
}>;

export default function PlanModeSelector({ value, onChange }: PlanModeSelectorProps) {
  return (
    <div
      className="grid w-full grid-cols-3 gap-1 rounded-lg border border-border bg-muted/55 p-1"
      role="group"
      aria-label="Daily plan depth"
    >
      {modeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={`${option.label} plan`}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={`flex min-h-[52px] min-w-0 items-center justify-center gap-2 rounded-md px-2 py-2 text-left
                        transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2
                        focus-visible:ring-accent-primary/30 sm:min-h-[58px] sm:px-3
                        ${isSelected
                          ? 'bg-surface text-text-primary shadow-sm'
                          : 'text-text-secondary hover:bg-surface/60 hover:text-text-primary'
                        }`}
          >
            <Icon
              size={17}
              className={isSelected ? 'text-accent-primary' : 'text-text-secondary'}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block truncate text-caption font-semibold sm:text-body">
                {option.label}
              </span>
              <span className="hidden truncate text-[0.72rem] text-text-secondary sm:block">
                {option.detail}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
