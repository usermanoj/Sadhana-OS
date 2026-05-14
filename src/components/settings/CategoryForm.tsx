import { Archive, Check, Pencil, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Category, SubComponent, TrackingType } from '../../types';
import type { CategoryInput, SubComponentInput } from '../../hooks/useCategories';
import ColourPicker, { CATEGORY_COLOURS } from './ColourPicker';
import IconPicker from './IconPicker';

const TRACKING_TYPE_OPTIONS: { value: TrackingType; label: string }[] = [
  { value: 'boolean', label: 'Toggle' },
  { value: 'scale5', label: 'Scale 1-5' },
  { value: 'scale10', label: 'Scale 1-10' },
  { value: 'duration', label: 'Duration' },
  { value: 'count', label: 'Count' },
  { value: 'numeric', label: 'Number' },
  { value: 'text', label: 'Text' },
];

interface CategoryFormProps {
  category: Category | null;
  onSaveCategory: (data: CategoryInput) => void;
  onCancel: () => void;
  onAddSubComponent: (data: SubComponentInput) => void;
  onUpdateSubComponent: (subComponentId: string, data: SubComponentInput) => void;
  onArchiveSubComponent: (subComponentId: string) => void;
  onRestoreSubComponent: (subComponentId: string) => void;
}

export default function CategoryForm({
  category,
  onSaveCategory,
  onCancel,
  onAddSubComponent,
  onUpdateSubComponent,
  onArchiveSubComponent,
  onRestoreSubComponent,
}: CategoryFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('sparkles');
  const [color, setColor] = useState<string>(CATEGORY_COLOURS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(category?.name ?? '');
    setIcon(category?.icon ?? 'sparkles');
    setColor(category?.color ?? CATEGORY_COLOURS[0]);
    setError('');
  }, [category]);

  const activeSubComponents = useMemo(
    () => sortSubComponents(category?.subComponents.filter((sub) => !sub.isArchived) ?? []),
    [category],
  );

  const archivedSubComponents = useMemo(
    () => sortSubComponents(category?.subComponents.filter((sub) => sub.isArchived) ?? []),
    [category],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Category name is required');
      return;
    }

    onSaveCategory({ name: trimmed, icon, color });
  };

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-md border border-border bg-surface p-4 shadow-sm"
      >
        <div className="mb-4">
          <h2 className="text-heading text-text-primary">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <p className="text-caption text-text-secondary">Categories shape the Today tracker.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category-name" className="text-caption font-medium text-text-secondary">
              Category name
            </label>
            <input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-[44px] rounded-md border border-border bg-surface px-3 text-body
                         text-text-primary outline-none transition-shadow duration-150
                         focus:ring-2 focus:ring-accent-primary/25"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-caption font-medium text-text-secondary">Icon</span>
            <IconPicker value={icon} color={color} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-caption font-medium text-text-secondary">Colour</span>
            <ColourPicker value={color} onChange={setColor} />
          </div>

          {error && (
            <p role="alert" className="text-caption text-accent-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] rounded-md border border-border px-4 py-2 text-body
                         font-medium text-text-secondary transition-colors duration-150 hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-md bg-accent-primary px-4 py-2 text-body
                         font-medium text-white shadow-sm transition-colors duration-150"
            >
              Save Category
            </button>
          </div>
        </div>
      </form>

      {category && (
        <PracticeManager
          activeSubComponents={activeSubComponents}
          archivedSubComponents={archivedSubComponents}
          onAddSubComponent={onAddSubComponent}
          onUpdateSubComponent={onUpdateSubComponent}
          onArchiveSubComponent={onArchiveSubComponent}
          onRestoreSubComponent={onRestoreSubComponent}
        />
      )}
    </div>
  );
}

function sortSubComponents(subComponents: SubComponent[]): SubComponent[] {
  return [...subComponents].sort((a, b) => a.displayOrder - b.displayOrder);
}

interface PracticeManagerProps {
  activeSubComponents: SubComponent[];
  archivedSubComponents: SubComponent[];
  onAddSubComponent: (data: SubComponentInput) => void;
  onUpdateSubComponent: (subComponentId: string, data: SubComponentInput) => void;
  onArchiveSubComponent: (subComponentId: string) => void;
  onRestoreSubComponent: (subComponentId: string) => void;
}

function PracticeManager({
  activeSubComponents,
  archivedSubComponents,
  onAddSubComponent,
  onUpdateSubComponent,
  onArchiveSubComponent,
  onRestoreSubComponent,
}: PracticeManagerProps) {
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newTrackingType, setNewTrackingType] = useState<TrackingType>('boolean');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [practiceError, setPracticeError] = useState('');

  const handleAddPractice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newPracticeName.trim();

    if (!trimmed) {
      setPracticeError('Practice name is required');
      return;
    }

    onAddSubComponent({ name: trimmed, trackingType: newTrackingType });
    setNewPracticeName('');
    setNewTrackingType('boolean');
    setPracticeError('');
  };

  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-sm" aria-label="Practices">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-subheading text-text-primary">Practices</h3>
        <span className="text-caption text-text-secondary tabular-nums">
          {activeSubComponents.length}/{activeSubComponents.length + archivedSubComponents.length}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <PracticeSection
          title="Active Practices"
          subComponents={activeSubComponents}
          editingId={editingId}
          onEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onSave={(subComponentId, data) => {
            onUpdateSubComponent(subComponentId, data);
            setEditingId(null);
          }}
          onArchive={onArchiveSubComponent}
          onRestore={onRestoreSubComponent}
        />

        {archivedSubComponents.length > 0 && (
          <PracticeSection
            title="Archived Practices"
            subComponents={archivedSubComponents}
            editingId={editingId}
            onEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            onSave={(subComponentId, data) => {
              onUpdateSubComponent(subComponentId, data);
              setEditingId(null);
            }}
            onArchive={onArchiveSubComponent}
            onRestore={onRestoreSubComponent}
          />
        )}

        <form
          onSubmit={handleAddPractice}
          className="rounded-md border border-border bg-muted/40 p-3"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-practice-name" className="text-caption font-medium text-text-secondary">
                New practice name
              </label>
              <input
                id="new-practice-name"
                value={newPracticeName}
                onChange={(event) => setNewPracticeName(event.target.value)}
                className="min-h-[44px] rounded-md border border-border bg-surface px-3 text-body
                           text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
              />
            </div>

            <TrackingTypeSelect
              id="new-practice-tracking-type"
              label="New tracking type"
              value={newTrackingType}
              onChange={setNewTrackingType}
            />

            <button
              type="submit"
              className="min-h-[44px] rounded-md bg-accent-primary px-4 py-2 text-body
                         font-medium text-white shadow-sm"
            >
              Add Practice
            </button>
          </div>

          {practiceError && (
            <p role="alert" className="mt-2 text-caption text-accent-danger">
              {practiceError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

interface PracticeSectionProps {
  title: string;
  subComponents: SubComponent[];
  editingId: string | null;
  onEdit: (subComponentId: string) => void;
  onCancelEdit: () => void;
  onSave: (subComponentId: string, data: SubComponentInput) => void;
  onArchive: (subComponentId: string) => void;
  onRestore: (subComponentId: string) => void;
}

function PracticeSection({
  title,
  subComponents,
  editingId,
  onEdit,
  onCancelEdit,
  onSave,
  onArchive,
  onRestore,
}: PracticeSectionProps) {
  return (
    <div className="flex flex-col gap-2" aria-label={title}>
      <h4 className="text-caption font-medium uppercase tracking-normal text-text-secondary">
        {title}
      </h4>

      {subComponents.length === 0 ? (
        <p className="rounded-md border border-border bg-surface px-3 py-3 text-body text-text-secondary">
          No practices
        </p>
      ) : (
        subComponents.map((subComponent) => (
          editingId === subComponent.id ? (
            <PracticeEditRow
              key={subComponent.id}
              subComponent={subComponent}
              onCancel={onCancelEdit}
              onSave={(data) => onSave(subComponent.id, data)}
            />
          ) : (
            <PracticeRow
              key={subComponent.id}
              subComponent={subComponent}
              onEdit={() => onEdit(subComponent.id)}
              onArchive={() => onArchive(subComponent.id)}
              onRestore={() => onRestore(subComponent.id)}
            />
          )
        ))
      )}
    </div>
  );
}

interface PracticeRowProps {
  subComponent: SubComponent;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

function PracticeRow({
  subComponent,
  onEdit,
  onArchive,
  onRestore,
}: PracticeRowProps) {
  const archived = subComponent.isArchived;

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-body text-text-primary">{subComponent.name}</p>
          <p className="text-caption text-text-secondary">
            {trackingTypeLabel(subComponent.trackingType)}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${subComponent.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-border
                     text-text-secondary transition-colors duration-150 hover:bg-muted"
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={archived ? onRestore : onArchive}
          aria-label={`${archived ? 'Restore' : 'Archive'} ${subComponent.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-border
                     text-text-secondary transition-colors duration-150 hover:bg-muted"
        >
          {archived ? <RotateCcw size={17} /> : <Archive size={17} />}
        </button>
      </div>
    </div>
  );
}

interface PracticeEditRowProps {
  subComponent: SubComponent;
  onCancel: () => void;
  onSave: (data: SubComponentInput) => void;
}

function PracticeEditRow({ subComponent, onCancel, onSave }: PracticeEditRowProps) {
  const [name, setName] = useState(subComponent.name);
  const [trackingType, setTrackingType] = useState<TrackingType>(subComponent.trackingType);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Practice name is required');
      return;
    }

    onSave({ name: trimmed, trackingType });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-accent-primary/25 bg-muted/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`practice-name-${subComponent.id}`} className="text-caption font-medium text-text-secondary">
            Practice name
          </label>
          <input
            id={`practice-name-${subComponent.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-[44px] rounded-md border border-border bg-surface px-3 text-body
                       text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
          />
        </div>

        <TrackingTypeSelect
          id={`practice-type-${subComponent.id}`}
          label="Tracking type"
          value={trackingType}
          onChange={setTrackingType}
        />

        <button
          type="submit"
          aria-label={`Save ${subComponent.name}`}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent-primary
                     px-3 py-2 text-body font-medium text-white"
        >
          <Check size={17} />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label={`Cancel editing ${subComponent.name}`}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-md border
                     border-border px-3 py-2 text-body font-medium text-text-secondary hover:bg-muted"
        >
          <X size={17} />
          Cancel
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-caption text-accent-danger">
          {error}
        </p>
      )}
    </form>
  );
}

interface TrackingTypeSelectProps {
  id: string;
  label: string;
  value: TrackingType;
  onChange: (value: TrackingType) => void;
}

function TrackingTypeSelect({
  id,
  label,
  value,
  onChange,
}: TrackingTypeSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-caption font-medium text-text-secondary">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as TrackingType)}
        className="min-h-[44px] rounded-md border border-border bg-surface px-3 text-body
                   text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
      >
        {TRACKING_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function trackingTypeLabel(value: TrackingType): string {
  return TRACKING_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
