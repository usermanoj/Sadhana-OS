import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import { seedIfNeeded } from './lib/seed';
import { AuthGate, AuthProvider } from './auth/AuthProvider';
import CloudSyncProvider from './cloud/CloudSyncProvider';
import { registerPwaServiceWorker } from './lib/pwa';

seedIfNeeded();
registerPwaServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CloudSyncProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </CloudSyncProvider>
    </AuthProvider>
  </StrictMode>,
);
