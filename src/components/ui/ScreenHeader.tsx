import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';

interface ScreenHeaderProps {
  icon: ComponentType<LucideProps>;
  title: string;
  subtitle: string;
  tone?: 'primary' | 'amber';
  actions?: ReactNode;
}

const toneClasses = {
  primary: 'bg-accent-primary/10 text-accent-primary',
  amber: 'bg-accent-secondary/15 text-amber-700',
};

export default function ScreenHeader({
  icon: Icon,
  title,
  subtitle,
  tone = 'primary',
  actions,
}: ScreenHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md lg:h-11 lg:w-11 ${toneClasses[tone]}`}
        >
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-heading text-text-primary">{title}</h1>
          <p className="text-caption text-text-secondary">{subtitle}</p>
        </div>
      </div>

      {actions ? (
        <div className="min-w-0 sm:shrink-0">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
