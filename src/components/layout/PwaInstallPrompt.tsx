import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const INSTALL_DISMISSED_KEY = 'sadhana:pwa-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplayMode() || wasInstallPromptDismissed()) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      rememberInstallPromptDismissed();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!installPrompt) {
    return null;
  }

  const install = async () => {
    try {
      setIsInstalling(true);
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => null);
      if (!choice || choice.outcome === 'dismissed') {
        rememberInstallPromptDismissed();
      }
      setInstallPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  };

  const dismiss = () => {
    rememberInstallPromptDismissed();
    setInstallPrompt(null);
  };

  return (
    <aside
      aria-label="Install Sadhana OS"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 rounded-lg border border-accent-primary/20 bg-surface/95 p-3 shadow-lifted backdrop-blur lg:bottom-5 lg:left-auto lg:right-5 lg:w-[360px]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
          <Download size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-text-primary">Install Sadhana OS</p>
          <p className="mt-1 text-caption text-text-secondary">
            Add a focused app icon and open your practice in a standalone window.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void install();
              }}
              disabled={isInstalling}
              className="sadhana-button-primary min-h-[40px] px-3"
            >
              <Download size={16} aria-hidden="true" />
              {isInstalling ? 'Installing' : 'Install app'}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="sadhana-button-secondary min-h-[40px] px-3"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="sadhana-button-ghost h-9 min-h-9 w-9 shrink-0 px-0"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function isStandaloneDisplayMode(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(display-mode: standalone)').matches;
}

function wasInstallPromptDismissed(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberInstallPromptDismissed(): void {
  try {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
  } catch {
    // Ignore unavailable storage; the prompt will simply be eligible again later.
  }
}
