import { useMemo, useState, type ComponentType } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cloud,
  Compass,
  Heart,
  ShieldCheck,
  Sparkles,
  Sunrise,
  UserRound,
  type LucideProps,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const detectTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const focusOptions = [
  {
    id: 'steady',
    title: 'Steady Practice',
    description: 'Build a durable daily rhythm.',
    icon: Sunrise,
  },
  {
    id: 'clarity',
    title: 'Inner Clarity',
    description: 'Track speech, senses, and reflection.',
    icon: Sparkles,
  },
  {
    id: 'balance',
    title: 'Life Balance',
    description: 'Keep family, health, and work visible.',
    icon: Heart,
  },
] as const;

const weekStartOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 6, label: 'Saturday' },
] as const;

export default function OnboardingScreen() {
  const auth = useAuth();
  const detectedTimezone = useMemo(() => detectTimezone(), []);
  const [displayName, setDisplayName] = useState(auth.profile?.displayName ?? '');
  const [timezone, setTimezone] = useState(auth.profile?.timezone ?? detectedTimezone);
  const [weekStartsOn, setWeekStartsOn] = useState(auth.profile?.weekStartsOn ?? 1);
  const [selectedFocus, setSelectedFocus] = useState<(typeof focusOptions)[number]['id']>('steady');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    try {
      setIsSaving(true);
      setStatus(null);
      await auth.completeOnboarding({
        displayName: displayName.trim(),
        timezone: timezone.trim() || detectedTimezone,
        weekStartsOn,
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Onboarding could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh bg-ivory px-4 py-5 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-8">
        <section
          className="relative overflow-hidden rounded-lg border border-border px-5 py-6 shadow-lifted sm:px-7 lg:px-9 lg:py-8"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,253,252,0.98) 0%, rgba(250,247,241,0.98) 52%, rgba(109,74,255,0.08) 100%)',
          }}
          aria-labelledby="onboarding-title"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-success" />

          <div className="mb-7 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary shadow-sm">
              <Compass size={28} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
                Welcome to Sadhana OS
              </p>
              <h1 id="onboarding-title" className="mt-1 text-[2.15rem] font-semibold leading-tight text-text-primary sm:text-[2.6rem]">
                Shape Your Daily Sadhana
              </h1>
              <p className="mt-3 max-w-2xl text-body text-text-secondary sm:text-[1.08rem]">
                Start with a calm rhythm for tracking practice, reflection, and the parts of life you want to keep conscious.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TrustTile icon={ShieldCheck} title="Private by design" text="Your account owns its practice history." />
            <TrustTile icon={Cloud} title="Cloud ready" text="Sync is prepared for signed-in use." />
            <TrustTile icon={CheckCircle2} title="Daily rhythm" text="Begin with one clear record." />
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-subheading text-text-primary">Choose Your Starting Focus</h2>
                <p className="text-caption text-text-secondary">This orients the first experience; your tracker remains fully editable.</p>
              </div>
              <span className="hidden rounded-full border border-border bg-white/65 px-3 py-1 text-caption text-text-secondary shadow-sm sm:inline-flex">
                2 minute setup
              </span>
            </div>

            <div className="grid gap-3">
              {focusOptions.map((option) => (
                <FocusOption
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  selected={selectedFocus === option.id}
                  onClick={() => setSelectedFocus(option.id)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="sadhana-surface p-4 sm:p-6 lg:p-7" aria-labelledby="practice-rhythm-title">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-secondary/15 text-accent-secondary">
              <CalendarDays size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 id="practice-rhythm-title" className="text-heading text-text-primary">Set Your Practice Rhythm</h2>
              <p className="text-caption text-text-secondary">Dates, summaries, and weekly views will follow this setup.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5 text-caption font-medium text-text-secondary" htmlFor="onboarding-name">
              Display name
              <span className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  id="onboarding-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="What should Sadhana OS call you?"
                  className="sadhana-input w-full px-10"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-caption font-medium text-text-secondary" htmlFor="onboarding-timezone">
              Timezone
              <span className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  id="onboarding-timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="sadhana-input w-full px-10"
                />
              </span>
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-caption font-medium text-text-secondary">Week Starts On</legend>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Week Starts On">
                {weekStartOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={weekStartsOn === option.value}
                    onClick={() => setWeekStartsOn(option.value)}
                    className={`min-h-[44px] rounded-md border px-3 py-2 text-body font-medium transition-[background-color,border-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-accent-primary/30 ${
                      weekStartsOn === option.value
                        ? 'border-accent-primary/35 bg-accent-primary/10 text-accent-primary shadow-sm'
                        : 'border-border bg-surface text-text-secondary hover:border-accent-primary/20 hover:bg-muted/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

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
              className="sadhana-button-primary w-full"
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

interface TrustTileProps {
  icon: ComponentType<LucideProps>;
  title: string;
  text: string;
}

function TrustTile({ icon: Icon, title, text }: TrustTileProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-white/55 px-3 py-3 shadow-sm">
      <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
        <Icon size={17} aria-hidden="true" />
      </span>
      <p className="text-body font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-caption text-text-secondary">{text}</p>
    </div>
  );
}

interface FocusOptionProps {
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function FocusOption({ icon: Icon, title, description, selected, onClick }: FocusOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-[74px] items-center gap-3 rounded-lg border px-4 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-accent-primary/30 ${
        selected
          ? 'border-accent-primary/35 bg-white text-text-primary shadow-card'
          : 'border-border bg-white/55 text-text-secondary hover:-translate-y-0.5 hover:border-accent-primary/25 hover:bg-white hover:shadow-card'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
        selected ? 'bg-accent-primary text-white' : 'bg-accent-primary/10 text-accent-primary'
      }`}
      >
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-subheading text-text-primary">{title}</span>
        <span className="block text-caption text-text-secondary">{description}</span>
      </span>
    </button>
  );
}
