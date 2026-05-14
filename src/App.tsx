import { useState } from 'react';
import type { TabId } from './types';
import AppShell from './components/layout/AppShell';
import DashboardScreen from './components/pages/DashboardScreen';
import HistoryScreen from './components/pages/HistoryScreen';
import JournalScreen from './components/pages/JournalScreen';
import PlaceholderPage from './components/pages/PlaceholderPage';
import SettingsScreen from './components/pages/SettingsScreen';
import TodayScreen from './components/pages/TodayScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
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
