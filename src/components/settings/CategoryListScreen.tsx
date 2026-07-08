import { Archive, CheckCircle2, Layers3, Plus, RotateCcw, Sparkles } from 'lucide-react';
import type { Category } from '../../types';
import { DynamicCategoryIcon } from '../today/CategoryIcon';

interface CategoryListScreenProps {
  activeCategories: Category[];
  archivedCategories: Category[];
  onAddCategory: () => void;
  onEditCategory: (categoryId: string) => void;
  onArchiveCategory: (categoryId: string) => void;
  onRestoreCategory: (categoryId: string) => void;
}

export default function CategoryListScreen({
  activeCategories,
  archivedCategories,
  onAddCategory,
  onEditCategory,
  onArchiveCategory,
  onRestoreCategory,
}: CategoryListScreenProps) {
  const activePracticeCount = activeCategories.reduce(
    (total, category) => total + category.subComponents.filter((sub) => !sub.isArchived).length,
    0,
  );
  const archivedPracticeCount = [...activeCategories, ...archivedCategories].reduce(
    (total, category) => total + category.subComponents.filter((sub) => sub.isArchived).length,
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-text-secondary">
            Practice Setup
          </p>
          <h2 className="mt-1 text-heading text-text-primary">Categories</h2>
          <p className="mt-1 max-w-2xl text-body text-text-secondary">
            Organize the groups and practices that appear on Today. Archiving preserves history without cluttering daily tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddCategory}
          className="sadhana-button-primary w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SetupMetric
          icon={Layers3}
          label="Active groups"
          value={String(activeCategories.length)}
        />
        <SetupMetric
          icon={CheckCircle2}
          label="Active practices"
          value={String(activePracticeCount)}
        />
        <SetupMetric
          icon={Archive}
          label="Archived items"
          value={String(archivedCategories.length + archivedPracticeCount)}
        />
      </div>

      <CategorySection
        title="Active"
        categories={activeCategories}
        archived={false}
        onEditCategory={onEditCategory}
        onArchiveCategory={onArchiveCategory}
        onRestoreCategory={onRestoreCategory}
      />

      <CategorySection
        title="Archived"
        categories={archivedCategories}
        archived
        onEditCategory={onEditCategory}
        onArchiveCategory={onArchiveCategory}
        onRestoreCategory={onRestoreCategory}
      />
    </div>
  );
}

function SetupMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <div className="sadhana-surface-soft px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-caption font-medium text-text-secondary">{label}</p>
          <p className="text-subheading tabular-nums text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface CategorySectionProps {
  title: string;
  categories: Category[];
  archived: boolean;
  onEditCategory: (categoryId: string) => void;
  onArchiveCategory: (categoryId: string) => void;
  onRestoreCategory: (categoryId: string) => void;
}

function CategorySection({
  title,
  categories,
  archived,
  onEditCategory,
  onArchiveCategory,
  onRestoreCategory,
}: CategorySectionProps) {
  return (
    <section className="flex flex-col gap-3" aria-label={`${title} categories`}>
      <div className="flex items-center justify-between">
        <h3 className="text-subheading text-text-primary">{title}</h3>
        <span className="text-caption text-text-secondary tabular-nums">{categories.length}</span>
      </div>

      {categories.length === 0 ? (
        <div className="sadhana-surface px-4 py-5 text-body text-text-secondary">
          No {title.toLowerCase()} categories
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2 2xl:gap-4">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              archived={archived}
              onEditCategory={onEditCategory}
              onArchiveCategory={onArchiveCategory}
              onRestoreCategory={onRestoreCategory}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface CategoryRowProps {
  category: Category;
  archived: boolean;
  onEditCategory: (categoryId: string) => void;
  onArchiveCategory: (categoryId: string) => void;
  onRestoreCategory: (categoryId: string) => void;
}

function CategoryRow({
  category,
  archived,
  onEditCategory,
  onArchiveCategory,
  onRestoreCategory,
}: CategoryRowProps) {
  const activePracticeCount = category.subComponents.filter((sub) => !sub.isArchived).length;
  const totalPracticeCount = category.subComponents.length;
  const isFullyArchived = activePracticeCount === 0 && totalPracticeCount > 0;

  return (
    <div className="sadhana-interactive-surface p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEditCategory(category.id)}
          aria-label={`Edit ${category.name}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 pr-2 text-left transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-accent-primary/30"
        >
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${category.color}18` }}
          >
            <DynamicCategoryIcon iconName={category.icon} color={category.color} size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold text-text-primary">
              {category.name}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
              <span>{activePracticeCount}/{totalPracticeCount} practices</span>
              {isFullyArchived ? (
                <span className="rounded-full border border-accent-warning/20 bg-accent-warning/10 px-2 py-0.5 text-amber-700">
                  Quiet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent-success/20 bg-accent-success/10 px-2 py-0.5 text-accent-success">
                  <Sparkles size={12} aria-hidden="true" />
                  Active
                </span>
              )}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => (
            archived
              ? onRestoreCategory(category.id)
              : onArchiveCategory(category.id)
          )}
          aria-label={`${archived ? 'Restore' : 'Archive'} ${category.name}`}
          className="sadhana-button-secondary h-11 w-11 flex-shrink-0 px-0"
        >
          {archived ? <RotateCcw size={18} /> : <Archive size={18} />}
        </button>
      </div>
    </div>
  );
}
