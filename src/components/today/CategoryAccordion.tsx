import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

  return (
    <div
      id={`category-${category.id}`}
      className="overflow-hidden rounded-md border border-border bg-surface shadow-sm
                 transition-[border-color,box-shadow] duration-200 hover:border-accent-primary/20 hover:shadow-md"
    >
      <button
        id={`category-header-${category.id}`}
        onClick={() => setIsOpen((o) => !o)}
        className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left
                   transition-colors duration-150 hover:bg-muted/30 focus-visible:ring-2
                   focus-visible:ring-inset focus-visible:ring-accent-primary/30 lg:min-h-[70px] lg:px-6"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.name}`}
      >
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md lg:h-11 lg:w-11"
          style={{ backgroundColor: `${category.color}15` }}
        >
          <DynamicCategoryIcon
            iconName={category.icon}
            color={category.color}
            size={20}
          />
        </span>

        <span className="flex-1 truncate text-subheading text-text-primary">
          {category.name}
        </span>

        <span className="flex-shrink-0 text-caption tabular-nums text-text-secondary">
          {stats.completed}/{stats.total}
        </span>

        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-text-secondary transition-transform duration-200
                      ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {/* Score bar (always visible) */}
      <div className="px-4 pb-3 lg:px-6">
        <ScoreBar score={stats.score} height={5} />
      </div>

      {/* Body — sub-components */}
      {isOpen ? (
        <div className="overflow-hidden transition-all duration-200 ease-in-out">
          <div className="divide-y divide-border/50 px-4 pb-3 lg:px-6 lg:pb-5">
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
