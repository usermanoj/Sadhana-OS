import { useEffect, useState } from 'react';
import type { TabId } from './types';
import AppShell from './components/layout/AppShell';
import DashboardScreen from './components/pages/DashboardScreen';
import HistoryScreen from './components/pages/HistoryScreen';
import JournalScreen from './components/pages/JournalScreen';
import PlaceholderPage from './components/pages/PlaceholderPage';
import SettingsScreen from './components/pages/SettingsScreen';
import TodayScreen from './components/pages/TodayScreen';
import { getTabFromHash, setHashRoute } from './lib/navigation';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => getCurrentTab());

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getCurrentTab());
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setHashRoute(tab);
  };

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'today' ? (
        <TodayScreen />
      ) : activeTab === 'dashboard' ? (
        <DashboardScreen />
      ) : activeTab === 'journal' ? (
        <JournalScreen />
      ) : activeTab === 'history' ? (
        <HistoryScreen />
      ) : activeTab === 'settings' ? (
        <SettingsScreen />
      ) : (
        <PlaceholderPage tabId={activeTab} />
      )}
    </AppShell>
  );
}

function getCurrentTab(): TabId {
  if (typeof window === 'undefined') return 'today';
  return getTabFromHash(window.location.hash);
}
