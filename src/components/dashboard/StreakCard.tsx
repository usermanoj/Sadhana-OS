import { Flame } from 'lucide-react';

interface StreakCardProps {
  streak: number;
}

export default function StreakCard({ streak }: StreakCardProps) {
  const isActive = streak > 0;

  return (
    <section
      className={`flex min-h-[148px] items-center justify-between rounded-md border p-5 shadow-sm lg:p-6 2xl:min-h-[170px] ${
        isActive ? 'border-accent-primary/20 bg-accent-primary/10' : 'border-border bg-surface'
      }`}
      aria-label="Current streak"
    >
      <div>
        <h2 className="text-subheading text-text-primary">Current Streak</h2>
        <p className="text-caption text-text-secondary">consecutive days</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-heading text-text-primary tabular-nums">{streak}</span>
          <span className="text-body text-text-secondary">days</span>
        </div>
      </div>

      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          isActive ? 'bg-accent-warning text-white' : 'bg-muted text-text-secondary'
        }`}
      >
        <Flame size={24} strokeWidth={isActive ? 2 : 1.5} />
      </div>
    </section>
  );
}
