import { CloudOff, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthBootstrapScreenProps {
  mode: 'loading' | 'error';
  hasKnownSession?: boolean;
  onRetry?: () => void;
}

export default function AuthBootstrapScreen({
  mode,
  hasKnownSession = false,
  onRetry,
}: AuthBootstrapScreenProps) {
  const isLoading = mode === 'loading';

  return (
    <main className="min-h-screen min-h-dvh bg-ivory px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl items-center justify-center">
        <section
          role={isLoading ? 'status' : 'alert'}
          aria-busy={isLoading}
          aria-labelledby="auth-bootstrap-title"
          className="sadhana-surface w-full max-w-xl p-5 text-center sm:p-8"
        >
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
            {isLoading ? (
              <LoaderCircle className="motion-safe:animate-spin" size={24} aria-hidden="true" />
            ) : (
              <CloudOff size={24} aria-hidden="true" />
            )}
          </span>

          <p className="mb-2 flex items-center justify-center gap-2 text-caption font-medium uppercase text-text-secondary">
            <Sparkles size={14} aria-hidden="true" />
            Sadhana OS
          </p>
          <h1 id="auth-bootstrap-title" className="text-heading text-text-primary">
            {isLoading
              ? 'Opening your practice space...'
              : "We couldn't open your practice space."}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-body text-text-secondary">
            {isLoading
              ? 'Confirming your secure cloud session and account data.'
              : 'Your data has not been changed. Check your connection, then try again.'}
          </p>

          {!isLoading && hasKnownSession ? (
            <div className="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-md border border-border bg-muted/45 px-4 py-3 text-left">
              <ShieldCheck className="mt-0.5 shrink-0 text-accent-success" size={18} aria-hidden="true" />
              <p className="text-caption text-text-secondary">
                The app remains locked until this account's cloud data can be confirmed.
              </p>
            </div>
          ) : null}

          {!isLoading && onRetry ? (
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={onRetry} className="sadhana-button-primary">
                <RefreshCw size={18} aria-hidden="true" />
                Retry connection
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
