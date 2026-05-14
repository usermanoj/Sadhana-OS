import { useState } from 'react';
import type { TabId } from './types';
import AppShell from './components/layout/AppShell';
import PlaceholderPage from './components/pages/PlaceholderPage';
import SettingsScreen from './components/pages/SettingsScreen';
import TodayScreen from './components/pages/TodayScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'today' ? (
        <TodayScreen />
      ) : activeTab === 'settings' ? (
        <SettingsScreen />
      ) : (
        <PlaceholderPage tabId={activeTab} />
      )}
    </AppShell>
  );
}
