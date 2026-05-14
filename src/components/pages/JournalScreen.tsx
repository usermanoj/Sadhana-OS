import { useJournal } from '../../hooks/useJournal';
import DateNavigator from '../today/DateNavigator';
import JournalForm from '../journal/JournalForm';
import JournalHistory from '../journal/JournalHistory';

export default function JournalScreen() {
  const { 
    selectedDate, 
    dateKey, 
    entry, 
    history, 
    goToDate, 
    saveEntry 
  } = useJournal();

  return (
    <div id="page-journal" className="pb-24 pt-6 px-4 max-w-5xl mx-auto flex flex-col h-full">
      
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Journal</h1>
          <p className="text-body text-text-secondary">Reflect on your spiritual journey and daily experiences.</p>
        </div>
        
        <div className="shrink-0">
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
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <JournalForm 
            entry={entry} 
            onSave={saveEntry} 
          />
        </div>

        {/* History Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <JournalHistory 
            history={history} 
            currentDateKey={dateKey} 
            onSelectDate={goToDate} 
          />
        </div>

      </div>
      
      {/* Mobile History (Shown below form on small screens) */}
      <div className="mt-8 lg:hidden">
        <JournalHistory 
          history={history} 
          currentDateKey={dateKey} 
          onSelectDate={goToDate} 
        />
      </div>

    </div>
  );
}
