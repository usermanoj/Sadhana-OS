import {
  ArchiveRestore,
  Cloud,
  Database,
  FileClock,
  LockKeyhole,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';
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

type SettingsMode = 'list' | 'add' | 'edit';
type SettingsSection = SettingsSectionId;

interface SettingsSectionItem {
  id: SettingsSection;
  label: string;
  title: string;
  description: string;
  icon: ComponentType<LucideProps>;
  tone: string;
}

const settingsSections: SettingsSectionItem[] = [
  {
    id: 'categories',
    label: 'Categories',
    title: 'Practice Setup',
    description: 'Shape groups, habits, icons, and archive state.',
    icon: SlidersHorizontal,
    tone: 'bg-accent-primary/10 text-accent-primary',
  },
  {
    id: 'data',
    label: 'Data',
    title: 'Data & Backup',
    description: 'Export, import, refresh, and verify data trust.',
    icon: Database,
    tone: 'bg-accent-secondary/15 text-amber-700',
  },
  {
    id: 'account',
    label: 'Account',
    title: 'Account & Sync',
    description: 'Review identity, cloud status, and migration safety.',
    icon: Cloud,
    tone: 'bg-blue-500/10 text-blue-700',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    title: 'Privacy & Safety',
    description: 'Control portability, deletion, and retention choices.',
    icon: LockKeyhole,
    tone: 'bg-accent-success/10 text-accent-success',
  },
  {
    id: 'audit',
    label: 'Audit Log',
    title: 'Audit Trail',
    description: 'Review every configuration change with preserved history.',
    icon: FileClock,
    tone: 'bg-muted text-text-secondary',
  },
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

  const activePracticeCount = useMemo(
    () => activeCategories.reduce(
      (total, category) => total + category.subComponents.filter((sub) => !sub.isArchived).length,
      0,
    ),
    [activeCategories],
  );
  const archivedPracticeCount = useMemo(
    () => categories.reduce(
      (total, category) => total + category.subComponents.filter((sub) => sub.isArchived).length,
      0,
    ),
    [categories],
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );
  const currentSection = settingsSections.find((item) => item.id === section) ?? settingsSections[0]!;

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
      <header
        className="relative overflow-hidden rounded-lg border border-border px-4 py-5 shadow-lifted sm:px-6 lg:px-8 lg:py-7"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,253,252,0.98) 0%, rgba(250,247,241,0.98) 50%, rgba(109,74,255,0.08) 100%)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-success" />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-end">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary shadow-sm">
                <Settings size={25} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Sadhana Control Center
                </p>
                <h1 className="truncate text-[2rem] font-semibold leading-tight text-text-primary lg:text-[2.35rem]">
                  Settings
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-body text-text-secondary lg:text-[1.08rem]">
              Tune the structure, trust, privacy, and backup controls that keep your practice system calm and reliable.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <SettingsHeroMetric label="Active Groups" value={String(activeCategories.length)} icon={Sparkles} />
            <SettingsHeroMetric label="Practices" value={String(activePracticeCount)} icon={SlidersHorizontal} />
            <SettingsHeroMetric label="Archived" value={String(archivedCategories.length + archivedPracticeCount)} icon={ArchiveRestore} />
            <SettingsHeroMetric label="Trust Areas" value="3" icon={ShieldCheck} />
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="settings-sections-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="settings-sections-heading" className="text-heading text-text-primary">Control Areas</h2>
            <p className="text-caption text-text-secondary">Choose what you want to adjust or verify.</p>
          </div>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-caption text-text-secondary shadow-sm">
            {currentSection.title}
          </span>
        </div>

        <div
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          aria-label="Settings sections"
        >
          {settingsSections.map((item) => (
            <SettingsSectionButton
              key={item.id}
              item={item}
              active={section === item.id}
              onSelect={() => {
                setSection(item.id);
                setHashRoute('settings', item.id);
                showList();
              }}
            />
          ))}
        </div>
      </section>

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

function SettingsHeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<LucideProps>;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-white/60 px-3 py-3 shadow-card backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {label}
          </p>
          <p className="text-[1.25rem] font-semibold leading-tight text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SettingsSectionButton({
  item,
  active,
  onSelect,
}: {
  item: SettingsSectionItem;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      aria-label={item.label}
      onClick={onSelect}
      className={`sadhana-interactive-surface min-h-[132px] p-4 text-left transition-[border-color,box-shadow,transform] duration-150 ${
        active ? 'border-accent-primary/35 bg-white shadow-lifted' : ''
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="flex h-full flex-col justify-between gap-4">
        <span className="flex items-start justify-between gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${item.tone}`}>
            <Icon size={19} aria-hidden="true" />
          </span>
          {active ? (
            <span className="rounded-full border border-accent-primary/20 bg-accent-primary/10 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-accent-primary">
              Active
            </span>
          ) : null}
        </span>
        <span>
          <span className="block text-subheading text-text-primary">{item.title}</span>
          <span className="mt-1 block text-caption text-text-secondary">{item.description}</span>
        </span>
      </span>
    </button>
  );
}

function getCurrentSettingsSection(): SettingsSection {
  if (typeof window === 'undefined') return 'categories';
  return getSettingsSectionFromHash(window.location.hash);
}
