import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  Sparkles,
} from 'lucide-react';

export type StateFeedbackTone = 'neutral' | 'success' | 'warning' | 'error' | 'loading';

interface StateFeedbackBaseProps {
  tone?: StateFeedbackTone;
  icon?: ComponentType<LucideProps>;
  title: string;
  children?: ReactNode;
  className?: string;
}

interface StatePanelProps extends StateFeedbackBaseProps {
  action?: ReactNode;
  role?: 'status' | 'alert' | 'note';
}

interface StateBannerProps extends StateFeedbackBaseProps {
  role?: 'status' | 'alert';
}

const toneClassMap: Record<StateFeedbackTone, {
  border: string;
  background: string;
  icon: string;
  text: string;
}> = {
  neutral: {
    border: 'border-border',
    background: 'bg-surface',
    icon: 'bg-accent-primary/10 text-accent-primary',
    text: 'text-text-secondary',
  },
  success: {
    border: 'border-accent-success/20',
    background: 'bg-accent-success/10',
    icon: 'bg-accent-success/15 text-accent-success',
    text: 'text-green-700',
  },
  warning: {
    border: 'border-accent-warning/30',
    background: 'bg-accent-warning/10',
    icon: 'bg-accent-warning/15 text-amber-700',
    text: 'text-amber-800',
  },
  error: {
    border: 'border-accent-danger/20',
    background: 'bg-accent-danger/10',
    icon: 'bg-accent-danger/10 text-red-700',
    text: 'text-red-700',
  },
  loading: {
    border: 'border-accent-primary/20',
    background: 'bg-accent-primary/10',
    icon: 'bg-accent-primary/10 text-accent-primary',
    text: 'text-text-secondary',
  },
};

const defaultIconMap: Record<StateFeedbackTone, ComponentType<LucideProps>> = {
  neutral: Inbox,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  loading: Loader2,
};

export function StatePanel({
  tone = 'neutral',
  icon,
  title,
  children,
  action,
  role = 'note',
  className = '',
}: StatePanelProps) {
  const Icon = icon ?? defaultIconMap[tone];
  const classes = toneClassMap[tone];

  return (
    <section
      role={role}
      className={`rounded-lg border ${classes.border} ${classes.background} px-4 py-6 text-center shadow-card sm:px-6 ${className}`}
    >
      <span className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${classes.icon}`}>
        <Icon
          size={24}
          aria-hidden="true"
          className={tone === 'loading' ? 'motion-safe:animate-spin' : undefined}
        />
      </span>
      <h3 className="text-subheading text-text-primary">{title}</h3>
      {children ? (
        <div className={`mx-auto mt-2 max-w-xl text-body ${classes.text}`}>
          {children}
        </div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  );
}

export function StateBanner({
  tone = 'neutral',
  icon,
  title,
  children,
  role,
  className = '',
}: StateBannerProps) {
  const resolvedRole = role ?? (tone === 'error' || tone === 'warning' ? 'alert' : 'status');
  const Icon = icon ?? defaultIconMap[tone];
  const classes = toneClassMap[tone];

  return (
    <div
      role={resolvedRole}
      className={`rounded-md border ${classes.border} ${classes.background} px-4 py-3 shadow-card ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${classes.icon}`}>
          <Icon
            size={18}
            aria-hidden="true"
            className={tone === 'loading' ? 'motion-safe:animate-spin' : undefined}
          />
        </span>
        <div className="min-w-0">
          <p className="text-body font-medium text-text-primary">{title}</p>
          {children ? (
            <div className={`mt-1 text-caption ${classes.text}`}>{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmptyDataPanel({
  icon = Sparkles,
  title,
  children,
  className,
}: Omit<StatePanelProps, 'tone' | 'icon'> & { icon?: ComponentType<LucideProps> }) {
  return (
    <StatePanel
      tone="neutral"
      icon={icon}
      title={title}
      className={className}
    >
      {children}
    </StatePanel>
  );
}
