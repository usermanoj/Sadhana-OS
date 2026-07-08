import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PwaInstallPrompt from './PwaInstallPrompt';

describe('PwaInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '(display-mode: standalone)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it('stays hidden until the browser exposes an install prompt', () => {
    render(<PwaInstallPrompt />);

    expect(screen.queryByLabelText('Install Sadhana OS')).not.toBeInTheDocument();
  });

  it('captures the browser install prompt and offers install action', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = createInstallPromptEvent({
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    });

    render(<PwaInstallPrompt />);
    fireEvent(window, installEvent);

    expect(installEvent.defaultPrevented).toBe(true);
    expect(screen.getByLabelText('Install Sadhana OS')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Install app' }));

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(screen.queryByLabelText('Install Sadhana OS')).not.toBeInTheDocument();
    });
  });

  it('remembers when the user dismisses install guidance', () => {
    const installEvent = createInstallPromptEvent();

    render(<PwaInstallPrompt />);
    fireEvent(window, installEvent);
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));

    expect(localStorage.getItem('sadhana:pwa-install-dismissed')).toBe('true');
    expect(screen.queryByLabelText('Install Sadhana OS')).not.toBeInTheDocument();
  });
});

function createInstallPromptEvent({
  prompt = vi.fn().mockResolvedValue(undefined),
  userChoice = Promise.resolve({ outcome: 'dismissed' as const, platform: 'web' }),
}: {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
} = {}) {
  const event = new Event('beforeinstallprompt', { cancelable: true });

  Object.defineProperty(event, 'prompt', { value: prompt });
  Object.defineProperty(event, 'userChoice', { value: userChoice });

  return event;
}
