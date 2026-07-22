import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-surface-soft', className)} aria-hidden />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-soft/40 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-text-muted">{icon}</div>}
      <p className="font-semibold text-text-primary">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 px-6 py-8 text-center">
      <p className="font-semibold text-danger">{t('state.error')}</p>
      <p className="mt-1 text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-medium text-primary hover:underline">
          {t('button.retry')}
        </button>
      )}
    </div>
  );
}
