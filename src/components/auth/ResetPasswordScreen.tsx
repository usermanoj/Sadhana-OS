import { useState } from 'react';
import { KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { getFriendlyAuthError } from '../../lib/authErrors';

type FormStatus = {
  tone: 'success' | 'error';
  message: string;
} | null;

export default function ResetPasswordScreen() {
  const auth = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<FormStatus>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      setStatus({ tone: 'error', message: 'Use at least 8 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ tone: 'error', message: 'Passwords do not match.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      await auth.updatePassword(password);
      setStatus({ tone: 'success', message: 'Password updated.' });
    } catch (error) {
      setStatus({ tone: 'error', message: getFriendlyAuthError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh bg-ivory px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
          <Sparkles size={24} aria-hidden="true" />
        </span>

        <section className="sadhana-surface p-4 sm:p-5" aria-label="Reset password">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-secondary/15 text-amber-700">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-subheading text-text-primary">Set New Password</h1>
              <p className="text-caption text-text-secondary">Choose a password for your account.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="new-password">
              New Password
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="sadhana-input"
              />
            </label>

            <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="confirm-password">
              Confirm Password
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="sadhana-input"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                void submit();
              }}
              disabled={isSubmitting}
              className="sadhana-button-primary"
            >
              <KeyRound size={18} aria-hidden="true" />
              {isSubmitting ? 'Updating' : 'Update Password'}
            </button>
          </div>

          {status ? (
            <p
              role="status"
              className={`mt-4 rounded-md border px-3 py-2 text-body ${
                status.tone === 'success'
                  ? 'border-accent-success/20 bg-accent-success/10 text-green-700'
                  : 'border-accent-danger/20 bg-accent-danger/10 text-red-700'
              }`}
            >
              {status.message}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
