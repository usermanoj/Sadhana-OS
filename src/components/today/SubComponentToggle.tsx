import type { Habit, TrackingValue } from '../../types';

interface SubComponentToggleProps {
  habit: Habit;
  value: TrackingValue | undefined;
  onToggle: (subId: string) => void;
  onValueChange: (subId: string, value: TrackingValue) => void;
}

export default function SubComponentToggle({
  habit,
  value,
  onToggle,
  onValueChange,
}: SubComponentToggleProps) {
  const stacksOnMobile = habit.trackingType !== 'boolean';

  return (
    <div className="py-3 first:pt-0 last:pb-0 lg:py-3.5">
      <div
        className={
          stacksOnMobile
            ? 'flex flex-col gap-2 sm:min-h-[44px] sm:flex-row sm:items-center sm:gap-3'
            : 'flex min-h-[44px] items-center gap-3'
        }
      >
        <span
          className={`min-w-0 flex-1 text-body font-medium text-text-primary ${
            stacksOnMobile ? 'break-words' : 'truncate'
          }`}
        >
          {habit.name}
        </span>

        <div
          className={
            stacksOnMobile
              ? 'flex w-full justify-end sm:w-auto sm:flex-shrink-0'
              : 'flex-shrink-0'
          }
        >
          {renderInput(habit, value, onToggle, onValueChange)}
        </div>
      </div>
    </div>
  );
}

function renderInput(
  habit: Habit,
  value: TrackingValue | undefined,
  onToggle: (subId: string) => void,
  onValueChange: (subId: string, value: TrackingValue) => void,
) {
  switch (habit.trackingType) {
    case 'boolean':
      return (
        <BooleanToggle
          id={habit.id}
          label={habit.name}
          checked={value === true}
          onToggle={onToggle}
        />
      );
    case 'scale5':
      return (
        <ScaleInput
          id={habit.id}
          label={habit.name}
          max={5}
          value={typeof value === 'number' ? value : 0}
          onChange={onValueChange}
        />
      );
    case 'scale10':
      return (
        <ScaleInput
          id={habit.id}
          label={habit.name}
          max={10}
          value={typeof value === 'number' ? value : 0}
          onChange={onValueChange}
        />
      );
    case 'duration':
      return (
        <NumberInput
          id={habit.id}
          label={habit.name}
          value={typeof value === 'number' ? value : 0}
          onChange={onValueChange}
          unit="min"
        />
      );
    case 'count':
      return (
        <NumberInput
          id={habit.id}
          label={habit.name}
          value={typeof value === 'number' ? value : 0}
          onChange={onValueChange}
          unit="x"
        />
      );
    case 'numeric':
      return (
        <NumberInput
          id={habit.id}
          label={habit.name}
          value={typeof value === 'number' ? value : 0}
          onChange={onValueChange}
          unit=""
        />
      );
    case 'text':
      return (
        <TextInput
          id={habit.id}
          label={habit.name}
          value={typeof value === 'string' ? value : ''}
          onChange={onValueChange}
        />
      );
    default:
      return (
        <BooleanToggle
          id={habit.id}
          label={habit.name}
          checked={value === true}
          onToggle={onToggle}
        />
      );
  }
}

function BooleanToggle({
  id,
  label,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      id={`toggle-${id}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onToggle(id)}
      className="relative flex h-11 w-14 flex-shrink-0 items-center justify-center rounded-full
                  transition-colors duration-200 ease-in-out focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-accent-primary/50
                  touch-manipulation"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${
          checked ? 'bg-accent-primary' : 'bg-border'
        }`}
      >
        <span
          className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm
                      transition-transform duration-200 ease-in-out
                      ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}
        />
      </span>
    </button>
  );
}

function ScaleInput({
  id,
  label,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  max: number;
  value: number;
  onChange: (id: string, val: TrackingValue) => void;
}) {
  return (
    <div
      className="flex max-w-full flex-wrap items-center justify-end gap-1"
      role="group"
      aria-label={`${label} rating`}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(id, value === n ? 0 : n)}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-caption font-medium
                      transition-all duration-150
                      ${n <= value
                        ? 'scale-105 bg-accent-primary text-white shadow-sm'
                        : 'bg-muted text-text-secondary hover:bg-border'
                      }`}
          aria-label={`${label}: ${n} of ${max}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function NumberInput({
  id,
  label,
  value,
  onChange,
  unit,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (id: string, val: TrackingValue) => void;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      <button
        onClick={() => onChange(id, Math.max(0, value - 1))}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-muted
                   text-body font-medium text-text-secondary transition-colors duration-150
                   hover:bg-border md:text-subheading"
        aria-label={`Decrease ${label}`}
      >
        -
      </button>
      <input
        type="number"
        aria-label={`${label} value`}
        min={0}
        value={value || ''}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          onChange(id, Number.isNaN(num) ? 0 : Math.max(0, num));
        }}
        className="h-11 w-16 rounded-md border border-border/50 bg-muted/60 text-center
                   text-body font-medium focus:outline-none focus:ring-1
                   focus:ring-accent-primary/30 md:w-20 [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
      />
      {unit && (
        <span className="min-w-[20px] text-body text-text-secondary">{unit}</span>
      )}
      <button
        onClick={() => onChange(id, value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-muted
                   text-body font-medium text-text-secondary transition-colors duration-150
                   hover:bg-border md:text-subheading"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, val: TrackingValue) => void;
}) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="flex w-full items-center sm:w-auto">
      <input
        type="text"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder="Write..."
        className={`h-11 w-full rounded-md border bg-muted/60 px-3 text-body
                    transition-colors duration-150 focus:outline-none
                    focus:ring-1 focus:ring-accent-primary/30 sm:w-48
                    ${hasValue ? 'border-accent-primary/30 text-text-primary' : 'border-border/50 text-text-secondary'}`}
      />
    </div>
  );
}
