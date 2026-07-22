import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<Tone, string> = {
  primary: 'bg-primary-light/60 text-primary-dark',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-surface-soft text-text-secondary',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
