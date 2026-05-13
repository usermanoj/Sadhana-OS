import type { TabId } from '../../types';
import {
  CheckCircle,
  BarChart3,
  BookOpen,
  Calendar,
  Settings,
} from 'lucide-react';

interface BottomTabBarProps {
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

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav
      id="bottom-tab-bar"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around
                 border-t border-border bg-surface/95 backdrop-blur-sm
                 h-14 px-1 lg:hidden"
      aria-label="Main navigation"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            id={`tab-${id}`}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1
                        min-w-[44px] min-h-[44px] rounded-lg transition-colors duration-150
                        ${isActive
                          ? 'text-accent-primary'
                          : 'text-text-secondary hover:text-text-primary'
                        }`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
