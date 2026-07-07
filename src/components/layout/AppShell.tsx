import type { ReactNode } from 'react';
import type { TabId } from '../../types';
import CloudSyncStatusBanner from '../cloud/CloudSyncStatusBanner';
import BottomTabBar from './BottomTabBar';
import EnvironmentBadge from './EnvironmentBadge';
import Sidebar from './Sidebar';

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen min-h-dvh overflow-x-hidden bg-ivory text-text-primary">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      <main
        id="main-content"
        className="flex min-h-screen min-h-dvh justify-center pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:justify-start lg:pb-0 lg:pl-72"
      >
        <div
          key={activeTab}
          className="motion-safe:animate-pageFade w-full max-w-[1360px] px-4 py-5 sm:px-6 md:py-8 lg:px-10 xl:px-12"
        >
          <EnvironmentBadge />
          <CloudSyncStatusBanner />
          {children}
        </div>
      </main>

      <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
