import { Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import {
  getSettingsSectionFromHash,
  setHashRoute,
  type SettingsSectionId,
} from '../../lib/navigation';
import AuditLogScreen from '../settings/AuditLogScreen';
import AccountScreen from '../settings/AccountScreen';
import CategoryForm from '../settings/CategoryForm';
import CategoryListScreen from '../settings/CategoryListScreen';
import DataScreen from '../settings/DataScreen';
import PrivacyScreen from '../settings/PrivacyScreen';
import ScreenHeader from '../ui/ScreenHeader';

type SettingsMode = 'list' | 'add' | 'edit';
type SettingsSection = SettingsSectionId;

const settingsSections: Array<{ id: SettingsSection; label: string }> = [
  { id: 'categories', label: 'Categories' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'data', label: 'Data' },
  { id: 'account', label: 'Account' },
  { id: 'privacy', label: 'Privacy' },
];

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
  const [section, setSection] = useState<SettingsSection>(() => getCurrentSettingsSection());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const showList = () => {
    setMode('list');
    setSelectedCategoryId(null);
  };

  useEffect(() => {
    const handleHashChange = () => {
      setSection(getCurrentSettingsSection());
      setMode('list');
      setSelectedCategoryId(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div id="page-settings" className="flex w-full flex-col gap-5 pb-4 lg:gap-7">
      <header className="flex flex-col gap-3">
        <ScreenHeader
          icon={Settings}
          title="Settings"
          subtitle="Tracker management"
        />

        <div
          className="flex gap-2 overflow-x-auto rounded-md border border-border bg-surface p-1 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Settings sections"
        >
          {settingsSections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => {
                setSection(item.id);
                setHashRoute('settings', item.id);
                showList();
              }}
              className={`min-h-[44px] flex-shrink-0 rounded-sm px-4 py-2 text-body font-medium transition-colors duration-150 ${
                section === item.id
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-muted/70 hover:text-text-primary'
              }`}
              aria-current={section === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {section === 'privacy' ? (
        <PrivacyScreen />
      ) : section === 'account' ? (
        <AccountScreen />
      ) : section === 'data' ? (
        <DataScreen />
      ) : section === 'audit' ? (
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

function getCurrentSettingsSection(): SettingsSection {
  if (typeof window === 'undefined') return 'categories';
  return getSettingsSectionFromHash(window.location.hash);
}
