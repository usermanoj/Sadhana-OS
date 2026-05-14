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
        className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px]
                   text-left transition-colors duration-150 hover:bg-muted/30"
        aria-expanded={isOpen}
      >
        {/* Category icon */}
        <span
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${category.color}15` }}
        >
          <DynamicCategoryIcon
            iconName={category.icon}
            color={category.color}
            size={18}
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
      <div className="px-4 pb-2">
        <ScoreBar score={stats.score} />
      </div>

      {/* Body — sub-components */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out
                    ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-3 divide-y divide-border/50">
          {activeSubs.map((sub) => (
            <SubComponentToggle
              key={sub.id}
              habit={sub}
              value={completions[sub.id]}
              onToggle={onToggle}
              onValueChange={onValueChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
