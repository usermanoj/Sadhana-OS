import type { TabId } from '../../types';
import packageMetadata from '../../../package.json';
import {
  CheckCircle,
  BarChart3,
  BookOpen,
  Calendar,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof CheckCircle }[] = [
  { id: 'today', label: 'Today', icon: CheckCircle },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'history', label: 'History', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      id="sidebar"
      className="fixed bottom-0 left-0 top-0 z-50 hidden w-72 flex-col border-r border-border bg-surface/95 shadow-nav backdrop-blur-sm lg:flex"
    >
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-primary shadow-card">
          <span className="text-sm font-semibold text-white">SO</span>
        </div>
        <p className="text-heading text-text-primary">Sadhana OS</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-4" aria-label="Main navigation">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              id={`sidebar-${id}`}
              onClick={() => onTabChange(id)}
              aria-label={label}
              className={`flex min-h-[46px] items-center gap-3 rounded-md px-3.5 py-3 text-left
                          transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-primary/30
                          ${isActive
                            ? 'bg-accent-primary/10 font-medium text-accent-primary shadow-sm ring-1 ring-accent-primary/10'
                            : 'text-text-secondary hover:bg-muted/70 hover:text-text-primary'
                          }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span className="text-body">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-caption text-text-secondary">v{packageMetadata.version}</p>
      </div>
    </aside>
  );
}
