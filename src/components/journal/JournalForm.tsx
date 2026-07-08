import { useEffect, useRef, useState, type ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  BookOpen,
  CheckCircle2,
  Eye,
  Feather,
  Heart,
  Lightbulb,
  Save,
  SmilePlus,
  Sparkles,
} from 'lucide-react';
import { useCloudSync } from '../../cloud/CloudSyncProvider';
import type { JournalEntry } from '../../types';

interface JournalFormProps {
  entry: JournalEntry;
  onSave: (entry: JournalEntry) => void;
}

type JournalTextField = Exclude<keyof JournalEntry, 'date' | 'createdAt' | 'updatedAt'>;

interface ReflectionField {
  field: JournalTextField;
  label: string;
  guidance: string;
  placeholder: string;
  icon: ComponentType<LucideProps>;
}

const reflectionFields: ReflectionField[] = [
  {
    field: 'mood',
    label: 'Mood & Energy',
    guidance: 'Name the current inner weather without judging it.',
    placeholder: 'How are you feeling today?',
    icon: SmilePlus,
  },
  {
    field: 'gratitude',
    label: 'Gratitude',
    guidance: 'Notice one thing that quietly supported the day.',
    placeholder: 'What are you grateful for?',
    icon: Heart,
  },
  {
    field: 'spiritualInsight',
    label: 'Spiritual Insight',
    guidance: 'Capture a realization, question, or subtle shift.',
    placeholder: 'Any profound thoughts or realizations?',
    icon: Sparkles,
  },
  {
    field: 'lessonLearned',
    label: 'Lesson Learned',
    guidance: 'Turn the day into a small piece of wisdom.',
    placeholder: 'What did you learn today?',
    icon: Lightbulb,
  },
  {
    field: 'triggerObserved',
    label: 'Triggers Observed',
    guidance: 'Record moments that pulled you away from steadiness.',
    placeholder: 'Any mental or emotional triggers you noticed?',
    icon: Eye,
  },
];

const dailyPrompts = [
  'What did today ask you to practice most gently?',
  'Where did attention become clearer than reaction?',
  'What should be carried forward, and what can be released?',
  'Which action made the day feel more aligned?',
  'Where did speech, senses, or thought become more conscious?',
  'What would tomorrow need if it began from calm?',
  'What did you learn by slowing down today?',
];

export default function JournalForm({ entry, onSave }: JournalFormProps) {
  const [localEntry, setLocalEntry] = useState<JournalEntry>(entry);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceTimer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);
  const sync = useCloudSync();
  const filledSections = getFilledSectionCount(localEntry);
  const wordCount = countWords(localEntry.content);
  const dailyPrompt = getDailyPrompt(entry.date);

  const clearDebounce = () => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  };

  const clearSavedTimer = () => {
    if (savedTimer.current) {
      window.clearTimeout(savedTimer.current);
      savedTimer.current = null;
    }
  };

  const showSaved = () => {
    setSaveStatus('saved');
    clearSavedTimer();
    savedTimer.current = window.setTimeout(() => {
      setSaveStatus('idle');
      savedTimer.current = null;
    }, 3000);
  };

  useEffect(() => {
    setLocalEntry(entry);
    setSaveStatus('idle');
    clearSavedTimer();
    // Reset the editor only when the selected date changes; including the full
    // entry object clears the saved indicator during autosave rerenders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.date]);

  useEffect(() => () => {
    clearDebounce();
    clearSavedTimer();
  }, []);

  const triggerSave = (updatedEntry: JournalEntry) => {
    setSaveStatus('saving');
    clearDebounce();
    clearSavedTimer();

    debounceTimer.current = window.setTimeout(() => {
      onSave(updatedEntry);
      debounceTimer.current = null;
      showSaved();
    }, 2000);
  };

  const handleChange = (field: keyof JournalEntry, value: string) => {
    const next = { ...localEntry, [field]: value };
    setLocalEntry(next);
    triggerSave(next);
  };

  const handleBlur = () => {
    if (saveStatus === 'saving') {
      clearDebounce();
      onSave(localEntry);
      showSaved();
    }
  };

  return (
    <section className="sadhana-surface overflow-hidden" aria-labelledby="journal-reflection-heading">
      <div
        className="relative border-b border-border px-4 py-5 sm:px-5 lg:px-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,253,252,0.98) 0%, rgba(242,237,230,0.92) 62%, rgba(109,74,255,0.08) 100%)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-success" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary shadow-sm">
              <Feather size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                Reflection Space
              </p>
              <h2 id="journal-reflection-heading" className="text-heading text-text-primary">
                Daily Reflection
              </h2>
              <p className="mt-1 max-w-2xl text-caption text-text-secondary">
                A quiet place to turn practice into memory, meaning, and next steps.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div
              className="flex min-h-7 items-center rounded-full border border-border bg-white/70 px-3 py-1 text-caption shadow-sm"
              aria-live="polite"
              aria-atomic="true"
            >
              {saveStatus === 'saving' ? (
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Save size={14} className="animate-pulse" aria-hidden="true" /> Saving...
                </span>
              ) : saveStatus === 'saved' ? (
                <span className="flex items-center gap-1.5 text-accent-success">
                  <CheckCircle2 size={14} aria-hidden="true" /> Saved
                </span>
              ) : (
                <span className="text-text-secondary">Ready</span>
              )}
            </div>
            <p className="text-left text-caption text-text-secondary sm:text-right">
              {getSaveHelperCopy(saveStatus, sync.status)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5 lg:p-6 2xl:p-7">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
          <div className="rounded-lg border border-border bg-muted/45 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-secondary/15 text-accent-secondary">
                <BookOpen size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-caption font-medium text-text-secondary">Prompt for this day</p>
                <p className="mt-1 text-subheading text-text-primary">{dailyPrompt}</p>
              </div>
            </div>
          </div>

          <div className="grid min-w-[11rem] grid-cols-2 gap-3 rounded-lg border border-border bg-white/70 p-3 shadow-sm sm:grid-cols-2 md:grid-cols-1">
            <ReflectionMetric label="Entry depth" value={`${filledSections}/6 sections`} />
            <ReflectionMetric label="Notes" value={`${wordCount} words`} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {reflectionFields.map((field) => (
            <ReflectionInput
              key={field.field}
              field={field}
              value={localEntry[field.field] ?? ''}
              onChange={(value) => handleChange(field.field, value)}
              onBlur={handleBlur}
            />
          ))}
        </div>

        <div className="rounded-lg border border-border bg-white/70 p-3 shadow-sm sm:p-4">
          <label className="flex items-center gap-2 text-body font-medium text-text-primary" htmlFor="journal-content">
            <Sparkles size={18} className="text-accent-primary" aria-hidden="true" />
            Free-form Notes
          </label>
          <p className="mt-1 text-caption text-text-secondary">
            Use this space for the part of the day that does not fit into a field.
          </p>
          <textarea
            id="journal-content"
            placeholder="Write your thoughts here..."
            className="sadhana-input mt-3 min-h-[280px] w-full resize-y bg-surface py-3 text-body leading-relaxed sm:min-h-[320px] lg:min-h-[380px]"
            value={localEntry.content || ''}
            onChange={(event) => handleChange('content', event.target.value)}
            onBlur={handleBlur}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-caption text-text-secondary">
            <span>Private by default. Export includes this entry only when you choose to export data.</span>
            <span className="tabular-nums">{wordCount} words</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReflectionInput({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: ReflectionField;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const Icon = field.icon;
  const id = `journal-${field.field.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;

  return (
    <div className="rounded-lg border border-border bg-white/70 p-3 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-accent-primary/30 focus-within:shadow-card sm:p-4">
      <label className="flex items-center gap-2 text-body font-medium text-text-primary" htmlFor={id}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
          <Icon size={17} aria-hidden="true" />
        </span>
        {field.label}
      </label>
      <p className="mt-2 min-h-[2.4rem] text-caption text-text-secondary">
        {field.guidance}
      </p>
      <input
        id={id}
        type="text"
        placeholder={field.placeholder}
        className="sadhana-input mt-3 w-full bg-surface"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function ReflectionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/45 px-3 py-2">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-body font-medium text-text-primary">{value}</p>
    </div>
  );
}

function getDailyPrompt(dateKey: string): string {
  const seed = dateKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return dailyPrompts[seed % dailyPrompts.length] ?? dailyPrompts[0]!;
}

function getFilledSectionCount(entry: JournalEntry): number {
  return [
    entry.mood,
    entry.gratitude,
    entry.spiritualInsight,
    entry.lessonLearned,
    entry.triggerObserved,
    entry.content,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0).length;
}

function countWords(value: string | undefined): number {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function getSaveHelperCopy(
  saveStatus: 'idle' | 'saving' | 'saved',
  syncStatus: ReturnType<typeof useCloudSync>['status'],
): string {
  if (saveStatus === 'saving') {
    return 'Autosaving after a short pause.';
  }

  if (saveStatus !== 'saved') {
    return 'Autosave is ready when you begin typing.';
  }

  if (syncStatus === 'queued' || syncStatus === 'failed' || syncStatus === 'offline' || syncStatus === 'conflict') {
    return 'Saved on this device. Cloud sync needs attention.';
  }

  if (syncStatus === 'syncing' || syncStatus === 'retrying') {
    return 'Saved locally. Cloud confirmation is in progress.';
  }

  return syncStatus === 'localOnly'
    ? 'Saved on this device.'
    : 'Saved locally and ready for cloud sync.';
}
