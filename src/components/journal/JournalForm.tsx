import { useState, useEffect, useRef } from 'react';
import type { JournalEntry } from '../../types';
import { CheckCircle2, Save } from 'lucide-react';

interface JournalFormProps {
  entry: JournalEntry;
  onSave: (entry: JournalEntry) => void;
}

export default function JournalForm({ entry, onSave }: JournalFormProps) {
  const [localEntry, setLocalEntry] = useState<JournalEntry>(entry);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceTimer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);

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
    }, 2000); // 2 second debounce
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
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 md:p-6 space-y-6">
      
      <div className="flex justify-between items-center gap-3 pb-2 border-b border-border">
        <h2 className="text-xl font-semibold text-text-primary">Daily Reflection</h2>
        <div className="flex min-h-5 items-center text-sm" aria-live="polite" aria-atomic="true">
          {saveStatus === 'saving' && (
            <span className="text-text-secondary flex items-center gap-1">
              <Save size={14} className="animate-pulse" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-accent-success flex items-center gap-1">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-body font-medium text-text-secondary" htmlFor="journal-mood">
            Mood & Energy
          </label>
          <input 
            id="journal-mood"
            type="text" 
            placeholder="How are you feeling today?"
            className="w-full bg-ivory border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none"
            value={localEntry.mood || ''}
            onChange={(e) => handleChange('mood', e.target.value)}
            onBlur={handleBlur}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-body font-medium text-text-secondary" htmlFor="journal-gratitude">
            Gratitude
          </label>
          <input 
            id="journal-gratitude"
            type="text" 
            placeholder="What are you grateful for?"
            className="w-full bg-ivory border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none"
            value={localEntry.gratitude || ''}
            onChange={(e) => handleChange('gratitude', e.target.value)}
            onBlur={handleBlur}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-body font-medium text-text-secondary" htmlFor="journal-spiritual-insight">
            Spiritual Insight
          </label>
          <input 
            id="journal-spiritual-insight"
            type="text" 
            placeholder="Any profound thoughts or realizations?"
            className="w-full bg-ivory border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none"
            value={localEntry.spiritualInsight || ''}
            onChange={(e) => handleChange('spiritualInsight', e.target.value)}
            onBlur={handleBlur}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-body font-medium text-text-secondary" htmlFor="journal-lesson-learned">
            Lesson Learned
          </label>
          <input 
            id="journal-lesson-learned"
            type="text" 
            placeholder="What did you learn today?"
            className="w-full bg-ivory border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none"
            value={localEntry.lessonLearned || ''}
            onChange={(e) => handleChange('lessonLearned', e.target.value)}
            onBlur={handleBlur}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-body font-medium text-text-secondary" htmlFor="journal-trigger-observed">
          Triggers Observed
        </label>
        <input 
          id="journal-trigger-observed"
          type="text" 
          placeholder="Any mental or emotional triggers you noticed?"
          className="w-full bg-ivory border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none"
          value={localEntry.triggerObserved || ''}
          onChange={(e) => handleChange('triggerObserved', e.target.value)}
          onBlur={handleBlur}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-body font-medium text-text-secondary" htmlFor="journal-content">
          Free-form Notes
        </label>
        <textarea 
          id="journal-content"
          placeholder="Write your thoughts here..."
          className="w-full min-h-[300px] bg-ivory border border-border rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none resize-y leading-relaxed"
          value={localEntry.content || ''}
          onChange={(e) => handleChange('content', e.target.value)}
          onBlur={handleBlur}
        />
        <div className="flex justify-end text-caption text-text-secondary">
          {localEntry.content.trim() ? localEntry.content.trim().split(/\s+/).length : 0} words
        </div>
      </div>

    </div>
  );
}
