import type { ReactNode } from 'react';
import type { TabId } from '../../types';
import BottomTabBar from './BottomTabBar';
import Sidebar from './Sidebar';

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen min-h-dvh bg-ivory">
      {/* Desktop sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main content */}
      <main
        id="main-content"
        className="pb-16 lg:pb-0 lg:pl-60 min-h-screen min-h-dvh flex justify-center"
      >
        <div className="w-full max-w-3xl px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
