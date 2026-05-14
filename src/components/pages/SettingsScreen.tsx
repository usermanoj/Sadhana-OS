import { Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import AuditLogScreen from '../settings/AuditLogScreen';
import CategoryForm from '../settings/CategoryForm';
import CategoryListScreen from '../settings/CategoryListScreen';

type SettingsMode = 'list' | 'add' | 'edit';
type SettingsSection = 'categories' | 'audit';

export default function SettingsScreen() {
  const {
    categories,
    activeCategories,
    archivedCategories,
    addCategory,
    updateCategory,
    archiveCategory,
    restoreCategory,
    addSubComponent,
    updateSubComponent,
    archiveSubComponent,
    restoreSubComponent,
  } = useCategories();

  const [mode, setMode] = useState<SettingsMode>('list');
  const [section, setSection] = useState<SettingsSection>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const showList = () => {
    setMode('list');
    setSelectedCategoryId(null);
  };

  return (
    <div id="page-settings" className="flex flex-col gap-5 pb-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
            <Settings size={20} />
          </span>
          <div>
            <h1 className="text-heading text-text-primary">Settings</h1>
            <p className="text-caption text-text-secondary">Tracker Management</p>
          </div>
        </div>

        <div className="flex gap-2" aria-label="Settings sections">
          <button
            type="button"
            onClick={() => {
              setSection('categories');
              showList();
            }}
            className={`min-h-[44px] rounded-md px-4 py-2 text-body font-medium shadow-sm ${
              section === 'categories'
                ? 'bg-accent-primary text-white'
                : 'border border-border bg-surface text-text-secondary'
            }`}
            aria-current={section === 'categories' ? 'page' : undefined}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('audit');
              showList();
            }}
            className={`min-h-[44px] rounded-md px-4 py-2 text-body font-medium shadow-sm ${
              section === 'audit'
                ? 'bg-accent-primary text-white'
                : 'border border-border bg-surface text-text-secondary'
            }`}
            aria-current={section === 'audit' ? 'page' : undefined}
          >
            Audit Log
          </button>
        </div>
      </header>

      {section === 'audit' ? (
        <AuditLogScreen />
      ) : mode === 'list' ? (
        <CategoryListScreen
          activeCategories={activeCategories}
          archivedCategories={archivedCategories}
          onAddCategory={() => setMode('add')}
          onEditCategory={(categoryId) => {
            setSelectedCategoryId(categoryId);
            setMode('edit');
          }}
          onArchiveCategory={archiveCategory}
          onRestoreCategory={restoreCategory}
        />
      ) : (
        <CategoryForm
          category={mode === 'edit' ? selectedCategory : null}
          onSaveCategory={(data) => {
            if (mode === 'edit' && selectedCategoryId) {
              updateCategory(selectedCategoryId, data);
            } else {
              addCategory(data);
            }
            showList();
          }}
          onCancel={showList}
          onAddSubComponent={(data) => {
            if (selectedCategoryId) addSubComponent(selectedCategoryId, data);
          }}
          onUpdateSubComponent={(subComponentId, data) => {
            if (selectedCategoryId) updateSubComponent(selectedCategoryId, subComponentId, data);
          }}
          onArchiveSubComponent={(subComponentId) => {
            if (selectedCategoryId) archiveSubComponent(selectedCategoryId, subComponentId);
          }}
          onRestoreSubComponent={(subComponentId) => {
            if (selectedCategoryId) restoreSubComponent(selectedCategoryId, subComponentId);
          }}
        />
      )}
    </div>
  );
}
