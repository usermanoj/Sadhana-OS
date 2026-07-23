import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import AuthBootstrapScreen from '../components/auth/AuthBootstrapScreen';
import OnboardingScreen from '../components/onboarding/OnboardingScreen';
import ResetPasswordScreen from '../components/auth/ResetPasswordScreen';
import { reportError, trackEvent } from '../lib/observability';
import {
  AUTH_BOOTSTRAP_TIMEOUT_MS,
  withAuthBootstrapTimeout,
} from '../lib/authBootstrap';

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
  retryBootstrap: () => void;
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
  retryBootstrap: () => undefined,
  refreshProfile: unavailable,
  completeOnboarding: unavailable,
};

export const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

export const useAuth = (): AuthContextValue => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  bootstrapTimeoutMs?: number;
}

export function AuthProvider({
  children,
  bootstrapTimeoutMs = AUTH_BOOTSTRAP_TIMEOUT_MS,
}: AuthProviderProps) {
  const environment = useMemo(() => getSupabaseEnvironment(), []);
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [status, setStatus] = useState<AuthStatus>(
    environment.isConfigured ? 'loading' : 'unconfigured',
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const pendingSignInMethodRef = useRef<string | null>(null);

  const fetchProfileForUser = useCallback(async (
    nextUser: User | null,
  ): Promise<AuthProfile | null> => {
    if (!supabase || !nextUser) {
      return null;
    }

    return withAuthBootstrapTimeout(
      fetchAuthProfile(supabase, nextUser),
      bootstrapTimeoutMs,
    );
  }, [bootstrapTimeoutMs, supabase]);

  const loadProfile = useCallback(async (nextUser: User | null): Promise<void> => {
    setProfile(await fetchProfileForUser(nextUser));
  }, [fetchProfileForUser]);

  useEffect(() => {
    if (!environment.isConfigured || !supabase) {
      setStatus('unconfigured');
      return undefined;
    }

    let isMounted = true;

    const loadSession = async () => {
      setStatus('loading');
      setErrorMessage(null);
      try {
        const { data, error } = await withAuthBootstrapTimeout(
          supabase.auth.getSession(),
          bootstrapTimeoutMs,
        );

        if (!isMounted) return;
        if (error) throw error;

        const nextUser = mapSessionUser(data.session);
        setUser(nextUser);

        if (!nextUser) {
          setProfile(null);
          setStatus('signedOut');
          return;
        }

        const nextProfile = await fetchProfileForUser(nextUser);
        if (!isMounted) return;

        setProfile(nextProfile);
        setStatus('signedIn');
      } catch (error) {
        if (!isMounted) return;
        reportError(error, 'auth_bootstrap_failed');
        setErrorMessage('Cloud account verification is temporarily unavailable.');
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
      setErrorMessage(null);
      void fetchProfileForUser(nextUser)
        .then((nextProfile) => {
          if (!isMounted) return;
          setProfile(nextProfile);
          if (event === 'SIGNED_IN') {
            trackEvent('sign_in_succeeded', {
              method: pendingSignInMethodRef.current ?? 'session',
            });
            pendingSignInMethodRef.current = null;
          }
          setStatus('signedIn');
        })
        .catch((error: unknown) => {
          if (!isMounted) return;
          reportError(error, 'auth_profile_refresh_failed');
          setErrorMessage('Cloud account verification is temporarily unavailable.');
          setStatus('error');
        });
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [
    bootstrapAttempt,
    bootstrapTimeoutMs,
    environment.isConfigured,
    fetchProfileForUser,
    supabase,
  ]);

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
      pendingSignInMethodRef.current = 'password';
      try {
        await signInWithPassword(supabase, email, password);
      } catch (error) {
        pendingSignInMethodRef.current = null;
        throw error;
      }
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
      pendingSignInMethodRef.current = provider;
      try {
        await signInWithOAuth(supabase, provider);
      } catch (error) {
        pendingSignInMethodRef.current = null;
        throw error;
      }
    },
    signOut: async () => {
      if (!supabase) return unavailable();
      setErrorMessage(null);
      await signOutOfSupabase(supabase);
      setUser(null);
      setProfile(null);
      setStatus('signedOut');
    },
    retryBootstrap: () => {
      setErrorMessage(null);
      setStatus('loading');
      trackEvent('auth_bootstrap_retry_requested');
      setBootstrapAttempt((attempt) => attempt + 1);
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
      trackEvent('onboarding_completed');
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
    return <AuthBootstrapScreen mode="loading" />;
  }

  if (auth.status === 'error') {
    return (
      <AuthBootstrapScreen
        mode="error"
        hasKnownSession={Boolean(auth.user)}
        onRetry={auth.retryBootstrap}
      />
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

  return <>{children}</>;
}
