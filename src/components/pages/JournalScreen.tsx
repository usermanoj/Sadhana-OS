import { BookOpen, CalendarDays, Feather, Sparkles } from 'lucide-react';
import { useJournal } from '../../hooks/useJournal';
import DateNavigator from '../today/DateNavigator';
import JournalForm from '../journal/JournalForm';
import JournalHistory from '../journal/JournalHistory';
import ScreenHeader from '../ui/ScreenHeader';

export default function JournalScreen() {
  const {
    selectedDate,
    dateKey,
    entry,
    history,
    goToDate,
    saveEntry,
  } = useJournal();
  const filledSections = getFilledSectionCount(entry);
  const wordCount = countWords(entry.content);

  return (
    <div id="page-journal" className="flex w-full flex-col gap-5 pb-4 lg:gap-7">
      <ScreenHeader
        icon={BookOpen}
        title="Journal"
        subtitle="Reflective notes and daily insight"
        actions={(
          <div className="sadhana-surface px-2 py-1 md:min-w-80">
            <DateNavigator
              selectedDate={selectedDate}
              onPrev={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                goToDate(d);
              }}
              onNext={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                if (d <= new Date()) {
                  goToDate(d);
                }
              }}
            />
          </div>
        )}
      />

      <section
        className="relative overflow-hidden rounded-lg border border-border px-4 py-5 shadow-lifted sm:px-6 lg:px-8 lg:py-7"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,253,252,0.98) 0%, rgba(250,247,241,0.98) 54%, rgba(198,106,27,0.08) 100%)',
        }}
        aria-labelledby="journal-hero-title"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-success" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-secondary/15 text-accent-secondary shadow-sm">
                <Feather size={24} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Inner record
                </p>
                <h2 id="journal-hero-title" className="text-heading text-text-primary">
                  Reflect without pressure
                </h2>
              </div>
            </div>
            <p className="max-w-2xl text-body text-text-secondary lg:text-[1.08rem]">
              Keep the day honest. A few clear words are enough when they help you see what changed.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1">
            <JournalMetric icon={Sparkles} label="Depth" value={`${filledSections}/6`} />
            <JournalMetric icon={BookOpen} label="Words" value={String(wordCount)} />
            <JournalMetric icon={CalendarDays} label="History" value={String(history.length)} />
          </div>
        </div>
      </section>

      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(20rem,0.9fr)] 2xl:gap-6">
        {/* Main Editor */}
        <JournalForm entry={entry} onSave={saveEntry} />

        {/* History Sidebar */}
        <div className="hidden lg:block">
          <JournalHistory
            history={history}
            currentDateKey={dateKey}
            onSelectDate={goToDate}
          />
        </div>
      </div>

      {/* Mobile History (Shown below form on small screens) */}
      <div className="lg:hidden">
        <JournalHistory
          history={history}
          currentDateKey={dateKey}
          onSelectDate={goToDate}
        />
      </div>
    </div>
  );
}

interface JournalMetricProps {
  icon: typeof Sparkles;
  label: string;
  value: string;
}

function JournalMetric({ icon: Icon, label, value }: JournalMetricProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/70 bg-white/60 px-2.5 py-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:px-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary sm:h-8 sm:w-8">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-text-secondary sm:text-[0.72rem] sm:tracking-[0.12em]">
          {label}
        </p>
        <p className="text-[1.15rem] font-semibold leading-tight text-text-primary sm:text-subheading">
          {value}
        </p>
      </div>
    </div>
  );
}

function getFilledSectionCount(entry: ReturnType<typeof useJournal>['entry']): number {
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
