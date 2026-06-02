import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const detectTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export default function OnboardingScreen() {
  const auth = useAuth();
  const detectedTimezone = useMemo(() => detectTimezone(), []);
  const [displayName, setDisplayName] = useState(auth.profile?.displayName ?? '');
  const [timezone, setTimezone] = useState(auth.profile?.timezone ?? detectedTimezone);
  const [weekStartsOn, setWeekStartsOn] = useState(String(auth.profile?.weekStartsOn ?? 1));
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    try {
      setIsSaving(true);
      setStatus(null);
      await auth.completeOnboarding({
        displayName,
        timezone: timezone.trim() || detectedTimezone,
        weekStartsOn: Number(weekStartsOn),
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Onboarding could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh bg-ivory px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col justify-center">
        <section className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
              <CheckCircle2 size={22} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-heading text-text-primary">Set Your Practice Rhythm</h1>
              <p className="text-caption text-text-secondary">A few details keep dates and reminders aligned.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="onboarding-name">
              Name
              <span className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  id="onboarding-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="min-h-[44px] w-full rounded-md border border-border bg-ivory px-10 text-body text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/30"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="onboarding-timezone">
              Timezone
              <span className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  id="onboarding-timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="min-h-[44px] w-full rounded-md border border-border bg-ivory px-10 text-body text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/30"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1 text-caption font-medium text-text-secondary" htmlFor="onboarding-week-start">
              Week Starts On
              <span className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <select
                  id="onboarding-week-start"
                  value={weekStartsOn}
                  onChange={(event) => setWeekStartsOn(event.target.value)}
                  className="min-h-[44px] w-full rounded-md border border-border bg-ivory px-10 text-body text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/30"
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="6">Saturday</option>
                </select>
              </span>
            </label>

            {status ? (
              <p role="status" className="rounded-md border border-accent-danger/20 bg-accent-danger/10 px-3 py-2 text-body text-red-700">
                {status}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void save();
              }}
              disabled={isSaving}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-body font-medium text-white shadow-sm disabled:opacity-60"
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              {isSaving ? 'Saving' : 'Begin Practice'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
