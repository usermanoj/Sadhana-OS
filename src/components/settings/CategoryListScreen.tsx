import { Archive, Plus, RotateCcw } from 'lucide-react';
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
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-heading text-text-primary">Categories</h2>
          <p className="text-caption text-text-secondary">Tracker structure</p>
        </div>
        <button
          type="button"
          onClick={onAddCategory}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4
                     py-2 text-body font-medium text-white shadow-sm transition-colors duration-150 sm:w-auto"
        >
          <Plus size={18} />
          Add Category
        </button>
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
        <div className="rounded-md border border-border bg-surface px-4 py-5 text-body text-text-secondary shadow-sm">
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

  return (
    <div className="rounded-md border border-border bg-surface p-3 shadow-sm lg:p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEditCategory(category.id)}
          aria-label={`Edit ${category.name}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 pr-2 text-left transition-colors duration-150 hover:bg-muted/60"
        >
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${category.color}18` }}
          >
            <DynamicCategoryIcon iconName={category.icon} color={category.color} size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-medium text-text-primary">
              {category.name}
            </span>
            <span className="block text-caption text-text-secondary">
              {activePracticeCount}/{totalPracticeCount} practices
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
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border
                     border-border text-text-secondary transition-colors duration-150 hover:bg-muted"
        >
          {archived ? <RotateCcw size={18} /> : <Archive size={18} />}
        </button>
      </div>
    </div>
  );
}
