import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<LucideProps>;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

const toneClasses = {
  primary: 'bg-accent-primary/10 text-accent-primary',
  success: 'bg-accent-success/10 text-accent-success',
  warning: 'bg-accent-warning/10 text-accent-warning',
  danger: 'bg-accent-danger/10 text-accent-danger',
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'primary',
}: MetricCardProps) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption text-text-secondary">{title}</p>
          <p className="mt-2 break-words text-heading text-text-primary tabular-nums">{value}</p>
          <p className="mt-1 text-caption text-text-secondary">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
