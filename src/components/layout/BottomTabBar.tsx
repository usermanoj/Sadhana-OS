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
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[calc(4.75rem+env(safe-area-inset-bottom))] items-center justify-around
                 border-t border-border bg-surface/95 px-[calc(0.375rem+env(safe-area-inset-left))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pr-[calc(0.375rem+env(safe-area-inset-right))] shadow-nav backdrop-blur-md lg:hidden"
      aria-label="Main navigation"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            id={`tab-${id}`}
            onClick={() => onTabChange(id)}
            className={`flex min-h-[48px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5
                        rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-primary/30
                        touch-manipulation
                        ${isActive
                          ? 'bg-accent-primary/10 text-accent-primary shadow-sm ring-1 ring-accent-primary/10'
                          : 'text-text-secondary hover:text-text-primary'
                        }`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
            <span className="text-[0.68rem] font-medium leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
