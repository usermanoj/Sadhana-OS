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
      className="bg-surface border border-border rounded-md shadow-sm overflow-hidden
                 transition-shadow duration-200 hover:shadow-md"
    >
      {/* Header */}
      <button
        id={`category-header-${category.id}`}
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] lg:min-h-[70px] lg:px-6
                   text-left transition-colors duration-150 hover:bg-muted/30"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.name}`}
      >
        {/* Category icon */}
        <span
          className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 lg:h-11 lg:w-11"
          style={{ backgroundColor: `${category.color}15` }}
        >
          <DynamicCategoryIcon
            iconName={category.icon}
            color={category.color}
            size={20}
          />
        </span>

        {/* Name */}
        <span className="flex-1 text-subheading text-text-primary truncate">
          {category.name}
        </span>

        {/* Completed badge */}
        <span className="text-caption text-text-secondary tabular-nums flex-shrink-0">
          {stats.completed}/{stats.total}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={`text-text-secondary flex-shrink-0 transition-transform duration-200
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
          <div className="px-4 pb-3 divide-y divide-border/50 lg:px-6 lg:pb-5">
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
