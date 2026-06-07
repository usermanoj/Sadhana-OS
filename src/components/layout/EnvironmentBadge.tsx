import { getSadhanaEnvironment, type SadhanaEnvironment } from '../../lib/env';

interface EnvironmentBadgeProps {
  environment?: SadhanaEnvironment;
}

const badgeClasses: Record<SadhanaEnvironment['name'], string> = {
  local: 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary',
  development: 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary',
  staging: 'border-accent-warning/30 bg-accent-warning/10 text-amber-700',
  production: 'border-transparent bg-transparent text-transparent',
};

export default function EnvironmentBadge({
  environment = getSadhanaEnvironment(),
}: EnvironmentBadgeProps) {
  if (!environment.showBadge) {
    return null;
  }

  return (
    <div className="mb-3 flex justify-end">
      <span
        aria-label={`Environment: ${environment.label}`}
        className={`inline-flex min-h-7 items-center rounded-sm border px-2.5 text-[11px] font-medium uppercase tracking-normal ${badgeClasses[environment.name]}`}
      >
        {environment.label}
      </span>
    </div>
  );
}
