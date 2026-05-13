import type { TabId } from '../../types';
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
      className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50
                 w-60 flex-col border-r border-border bg-surface"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center">
          <span className="text-white text-sm font-semibold">SO</span>
        </div>
        <h1 className="text-heading text-text-primary">Sadhana OS</h1>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-3" aria-label="Main navigation">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`sidebar-${id}`}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-left
                          min-h-[44px] transition-colors duration-150
                          ${isActive
                            ? 'bg-accent-primary/10 text-accent-primary font-medium'
                            : 'text-text-secondary hover:bg-muted hover:text-text-primary'
                          }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-body">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-caption text-text-secondary">v0.1.0</p>
      </div>
    </aside>
  );
}
