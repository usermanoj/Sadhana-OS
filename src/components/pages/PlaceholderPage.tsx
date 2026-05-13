import type { TabId } from '../../types';

interface PlaceholderPageProps {
  tabId: TabId;
}

const descriptions: Record<TabId, string> = {
  today: 'Daily practice will appear here.',
  dashboard: 'Analytics and trends will appear here.',
  journal: 'Date-linked reflections will appear here.',
  history: 'Past entries will appear here.',
  settings: 'Configuration and data tools will appear here.',
};

const titles: Record<TabId, string> = {
  today: 'Today',
  dashboard: 'Dashboard',
  journal: 'Journal',
  history: 'History',
  settings: 'Settings',
};

export default function PlaceholderPage({ tabId }: PlaceholderPageProps) {
  return (
    <div id={`page-${tabId}`} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-4">
        <span className="text-xl font-semibold text-accent-primary">SO</span>
      </div>
      <h2 className="text-heading text-text-primary mb-2">{titles[tabId]}</h2>
      <p className="text-body text-text-secondary max-w-sm">{descriptions[tabId]}</p>
      <div className="mt-6 px-4 py-2 rounded-full bg-muted text-caption text-text-secondary">
        Coming soon
      </div>
    </div>
  );
}
