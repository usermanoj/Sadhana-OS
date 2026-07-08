import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { reportError } from '../../lib/observability';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(error, 'react_render_error', {
      severity: 'fatal',
      tags: {
        boundary: 'root',
        componentStackAvailable: String(Boolean(errorInfo.componentStack)),
      },
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen min-h-dvh items-center justify-center bg-ivory px-4 py-8">
        <section
          className="sadhana-surface w-full max-w-md p-5"
          aria-labelledby="app-error-title"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-danger/10 text-red-700">
              <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 id="app-error-title" className="text-subheading text-text-primary">
                Sadhana OS needs a refresh
              </h1>
              <p className="mt-2 text-body text-text-secondary">
                Your practice data is preserved. Refresh the app to continue.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="sadhana-button-primary mt-5 w-full"
          >
            <RefreshCw size={18} aria-hidden="true" />
            Refresh app
          </button>
        </section>
      </main>
    );
  }
}
