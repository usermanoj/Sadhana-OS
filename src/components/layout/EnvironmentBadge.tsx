import { getSadhanaEnvironment, type SadhanaEnvironment } from '../../lib/env';

interface EnvironmentBadgeProps {
  environment?: SadhanaEnvironment;
}

const badgeClasses: Record<SadhanaEnvironment['name'], string> = {
  local: 'border-border bg-muted/70 text-text-secondary',
  development: 'border-border bg-muted/70 text-text-secondary',
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
        aria-label={`App environment: ${environment.description}`}
        title={environment.description}
        className={`inline-flex min-h-6 items-center rounded-sm border px-2 text-[10px] font-medium uppercase tracking-normal ${badgeClasses[environment.name]}`}
      >
        <span className="mr-1 text-text-secondary/70">ENV</span>
        {environment.label}
      </span>
    </div>
  );
}
