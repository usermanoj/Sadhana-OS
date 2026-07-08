import { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import type { Category, TrackingValue } from '../../types';
import type { CategoryStats } from '../../hooks/useDailyEntry';
import ScoreBar from './ScoreBar';
import SubComponentToggle from './SubComponentToggle';
import { DynamicCategoryIcon } from './CategoryIcon';

interface CategoryAccordionProps {
  category: Category;
  stats: CategoryStats;
  completions: Record<string, TrackingValue>;
  defaultOpen?: boolean;
  onToggle: (subId: string) => void;
  onValueChange: (subId: string, value: TrackingValue) => void;
}

export default function CategoryAccordion({
  category,
  stats,
  completions,
  defaultOpen = false,
  onToggle,
  onValueChange,
}: CategoryAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const activeSubs = category.subComponents
    .filter((s) => !s.isArchived)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const statusLabel = getStatusLabel(stats.completed, stats.total);
  const categoryTint = `${category.color}12`;
  const categoryBorder = `${category.color}28`;
  const isComplete = stats.total > 0 && stats.completed === stats.total;

  return (
    <div
      id={`category-${category.id}`}
      data-complete={isComplete ? 'true' : 'false'}
      className={`group relative overflow-hidden rounded-lg border border-border bg-surface shadow-card
                 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lifted
                 ${isComplete ? 'animate-completionPulse' : ''}`}
      style={{
        borderColor: isComplete
          ? 'color-mix(in srgb, var(--accent-success) 35%, var(--border))'
          : isOpen ? categoryBorder : undefined,
      }}
    >
      <span
        className="absolute inset-y-0 left-0 w-1 opacity-90"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />

      <button
        id={`category-header-${category.id}`}
        onClick={() => setIsOpen((o) => !o)}
        className="flex min-h-[76px] w-full items-center gap-3 px-4 py-4 pl-5 text-left
                   transition-colors duration-150 hover:bg-muted/25 focus-visible:ring-2
                   focus-visible:ring-inset focus-visible:ring-accent-primary/30 lg:min-h-[88px] lg:px-6 lg:pl-7"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.name}`}
      >
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg shadow-sm lg:h-12 lg:w-12"
          style={{ backgroundColor: categoryTint }}
        >
          <DynamicCategoryIcon
            iconName={category.icon}
            color={category.color}
            size={22}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block break-words text-subheading leading-snug text-text-primary lg:text-[1.35rem]">
            {category.name}
          </span>
          <span className="mt-1 block text-caption text-text-secondary">
            {statusLabel}
          </span>
        </span>

        <span className="flex flex-shrink-0 items-center gap-2">
          {isComplete ? (
            <span className="hidden items-center gap-1 rounded-full border border-accent-success/25 bg-accent-success/10 px-2.5 py-1 text-caption font-medium text-accent-success sm:inline-flex">
              <CheckCircle2 size={14} aria-hidden="true" />
              Complete
            </span>
          ) : null}
          <span className="inline-flex rounded-full border border-border bg-muted/45 px-2.5 py-1 text-caption tabular-nums text-text-secondary">
            {stats.completed}/{stats.total}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-text-secondary transition-transform duration-200
                      ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {/* Score bar (always visible) */}
      <div className="px-5 pb-4 lg:px-7">
        <ScoreBar score={stats.score} height={5} />
      </div>

      {/* Body — sub-components */}
      {isOpen ? (
        <div className="overflow-hidden transition-all duration-200 ease-in-out">
          <div className="divide-y divide-border/50 border-t border-border/60 bg-muted/25 px-5 py-2 lg:px-7">
            {activeSubs.length === 0 ? (
              <p className="py-3 text-body text-text-secondary">No active practices</p>
            ) : (
              activeSubs.map((sub) => (
                <SubComponentToggle
                  key={sub.id}
                  habit={sub}
                  value={completions[sub.id]}
                  onToggle={onToggle}
                  onValueChange={onValueChange}
                />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getStatusLabel(completed: number, total: number): string {
  if (total === 0) return 'No active items';
  if (completed === total) return 'Complete for today';
  if (completed > 0) return 'In progress';
  return 'Ready when you are';
}
