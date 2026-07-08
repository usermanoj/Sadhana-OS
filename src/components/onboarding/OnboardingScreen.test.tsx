import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import OnboardingScreen from './OnboardingScreen';

function createAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    ...defaultAuthContext,
    isCloudConfigured: true,
    missingConfigKeys: [],
    status: 'signedIn',
    user: {
      id: 'user-1',
      email: 'practitioner@example.com',
    } as User,
    profile: {
      id: 'user-1',
      email: 'practitioner@example.com',
      displayName: '',
      timezone: 'Asia/Singapore',
      onboardingCompletedAt: null,
      weekStartsOn: 1,
    },
    completeOnboarding: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderOnboarding(auth = createAuthContext()): AuthContextValue {
  render(
    <AuthContext.Provider value={auth}>
      <OnboardingScreen />
    </AuthContext.Provider>,
  );

  return auth;
}

describe('OnboardingScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('presents a premium first-run practice setup journey', () => {
    renderOnboarding();

    expect(screen.getByRole('heading', { name: 'Shape Your Daily Sadhana' })).toBeInTheDocument();
    expect(screen.getByText('Choose Your Starting Focus')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Steady Practice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inner Clarity/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Life Balance/i })).toBeInTheDocument();
    expect(screen.getByText('Private by design')).toBeInTheDocument();
    expect(screen.getByText('Cloud ready')).toBeInTheDocument();
  });

  it('lets the user choose a starting focus without changing the saved auth payload', async () => {
    const auth = renderOnboarding();

    fireEvent.click(screen.getByRole('button', { name: /Inner Clarity/i }));
    expect(screen.getByRole('button', { name: /Inner Clarity/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: '  Mira  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Begin Practice' }));

    await waitFor(() => {
      expect(auth.completeOnboarding).toHaveBeenCalledWith({
        displayName: 'Mira',
        timezone: 'Asia/Singapore',
        weekStartsOn: 1,
      });
    });
  });

  it('persists timezone and week start preferences through the existing onboarding API', async () => {
    const auth = renderOnboarding();

    fireEvent.change(screen.getByLabelText('Timezone'), {
      target: { value: 'Europe/London' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sunday' }));
    fireEvent.click(screen.getByRole('button', { name: 'Begin Practice' }));

    await waitFor(() => {
      expect(auth.completeOnboarding).toHaveBeenCalledWith({
        displayName: '',
        timezone: 'Europe/London',
        weekStartsOn: 0,
      });
    });
  });

  it('shows a friendly error when onboarding cannot be saved', async () => {
    renderOnboarding(
      createAuthContext({
        completeOnboarding: vi.fn(async () => {
          throw new Error('Network unavailable');
        }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Begin Practice' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Network unavailable');
    });
  });
});
