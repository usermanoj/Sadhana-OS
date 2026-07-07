import { BookOpen } from 'lucide-react';
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

  return (
    <div id="page-journal" className="flex w-full flex-col gap-5 pb-4 lg:gap-7">
      <ScreenHeader
        icon={BookOpen}
        title="Journal"
        subtitle="Reflective notes and daily insight"
        actions={(
          <div className="rounded-md border border-border bg-surface px-2 py-1 shadow-sm md:min-w-80">
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
