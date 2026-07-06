import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseEnvironment } from '../lib/env';
import { getSupabaseClient } from '../lib/supabaseClient';
import {
  completeCloudOnboarding,
  fetchAuthProfile,
  mapSessionUser,
  sendPasswordResetEmail,
  signInWithMagicLink,
  signInWithOAuth,
  signInWithPassword,
  signUpWithPassword,
  signOut as signOutOfSupabase,
  updateAccountPassword,
  type AuthProfile,
  type CompleteOnboardingInput,
  type SupportedOAuthProvider,
} from '../lib/auth';
import AuthScreen from '../components/auth/AuthScreen';
import OnboardingScreen from '../components/onboarding/OnboardingScreen';
import ResetPasswordScreen from '../components/auth/ResetPasswordScreen';

export type AuthStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn' | 'passwordRecovery' | 'error';

export interface AuthContextValue {
  isCloudConfigured: boolean;
  missingConfigKeys: string[];
  status: AuthStatus;
  user: User | null;
  profile: AuthProfile | null;
  errorMessage: string | null;
  signInWithEmail: (email: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signInWithProvider: (provider: SupportedOAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<void>;
}

const unavailable = async (): Promise<void> => {
  throw new Error('Cloud accounts are not configured.');
};

export const defaultAuthContext: AuthContextValue = {
  isCloudConfigured: false,
  missingConfigKeys: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  status: 'unconfigured',
  user: null,
  profile: null,
  errorMessage: null,
  signInWithEmail: unavailable,
  sendMagicLink: unavailable,
  signInWithPassword: unavailable,
  signUpWithPassword: unavailable,
  sendPasswordReset: unavailable,
  updatePassword: unavailable,
  signInWithProvider: unavailable,
  signOut: unavailable,
  refreshProfile: unavailable,
  completeOnboarding: unavailable,
};

export const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

export const useAuth = (): AuthContextValue => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const environment = useMemo(() => getSupabaseEnvironment(), []);
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [status, setStatus] = useState<AuthStatus>(
    environment.isConfigured ? 'loading' : 'unconfigured',
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async (nextUser: User | null): Promise<void> => {
    if (!supabase || !nextUser) {
      setProfile(null);
      return;
    }

    const nextProfile = await fetchAuthProfile(supabase, nextUser);
    setProfile(nextProfile);
  }, [supabase]);

  useEffect(() => {
    if (!environment.isConfigured || !supabase) {
      setStatus('unconfigured');
      return undefined;
    }

    let isMounted = true;

    const loadSession = async () => {
      setStatus('loading');
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }

      const nextUser = mapSessionUser(data.session);
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setStatus('signedOut');
        return;
      }

      try {
        await loadProfile(nextUser);
        if (isMounted) setStatus('signedIn');
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Profile sync failed.');
        setStatus('error');
      }
    };

    void loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = mapSessionUser(session);
      setUser(nextUser);

      if (event === 'PASSWORD_RECOVERY' && nextUser) {
        setProfile(null);
        setStatus('passwordRecovery');
        return;
      }

      if (!nextUser) {
        setProfile(null);
        setStatus('signedOut');
        return;
      }

      setStatus('loading');
      void loadProfile(nextUser)
        .then(() => setStatus('signedIn'))
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Profile sync failed.');
          setStatus('error');
        });
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [environment.isConfigured, loadProfile, supabase]);

  const value: AuthContextValue = {
    isCloudConfigured: environment.isConfigured,
    missingConfigKeys: environment.missingKeys,
    status,
    user,
    profile,
    errorMessage,
    signInWithEmail: async (email: string) => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await signInWithMagicLink(supabase, email);
    },
    sendMagicLink: async (email: string) => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await signInWithMagicLink(supabase, email);
    },
    signInWithPassword: async (email: string, password: string) => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await signInWithPassword(supabase, email, password);
    },
    signUpWithPassword: async (email: string, password: string) => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await signUpWithPassword(supabase, email, password);
    },
    sendPasswordReset: async (email: string) => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await sendPasswordResetEmail(supabase, email);
    },
    updatePassword: async (password: string) => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await updateAccountPassword(supabase, password);
      if (user) {
        await loadProfile(user);
        setStatus('signedIn');
      }
    },
    signInWithProvider: async (provider: SupportedOAuthProvider) => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await signInWithOAuth(supabase, provider);
    },
    signOut: async () => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await signOutOfSupabase(supabase);
      setUser(null);
      setProfile(null);
      setStatus('signedOut');
    },
    refreshProfile: async () => {
      if (!supabase || !user) return;
      await loadProfile(user);
    },
    completeOnboarding: async (input: CompleteOnboardingInput) => {
      if (!supabase || !user) return unavailable();
      setErrorMessage(null);
      await completeCloudOnboarding(supabase, user.id, input);
      await loadProfile(user);
      setStatus('signedIn');
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthGate({ children }: AuthProviderProps) {
  const auth = useAuth();

  if (!auth.isCloudConfigured || auth.status === 'unconfigured') {
    return <>{children}</>;
  }

  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-screen min-h-dvh items-center justify-center bg-ivory px-6">
        <div className="rounded-md border border-border bg-surface px-5 py-4 text-body text-text-secondary shadow-sm">
          Opening your practice space...
        </div>
      </div>
    );
  }

  if (auth.status === 'signedOut') {
    return <AuthScreen />;
  }

  if (auth.status === 'passwordRecovery') {
    return <ResetPasswordScreen />;
  }

  if (auth.status === 'signedIn' && auth.profile && !auth.profile.onboardingCompletedAt) {
    return <OnboardingScreen />;
  }

  if (auth.status === 'error' && !auth.user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
