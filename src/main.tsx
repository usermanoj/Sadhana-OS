import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import { seedIfNeeded } from './lib/seed';
import { AuthGate, AuthProvider } from './auth/AuthProvider';
import CloudSyncProvider from './cloud/CloudSyncProvider';
import { registerPwaServiceWorker } from './lib/pwa';
import { initializeObservability } from './lib/observability';
import AppErrorBoundary from './components/layout/AppErrorBoundary';

initializeObservability();
seedIfNeeded();
registerPwaServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <CloudSyncProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </CloudSyncProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
