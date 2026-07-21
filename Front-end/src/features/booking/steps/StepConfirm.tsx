<<<<<<< Updated upstream
import { ShieldCheck, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatVND } from '@/lib/money';
import { useCartSummary } from '../selectors';

export function StepConfirm() {
  const { t } = useTranslation('booking');
  const cart = useCartSummary();
  const remaining = Math.max(cart.total - cart.deposit, 0);
=======
import { AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatVND } from '@/lib/money';
import { ApiError } from '@/lib/api/client';
import { useCartSummary } from '../selectors';

export function StepConfirm({ error }: { error?: unknown }) {
  const { t } = useTranslation('booking');
  const cart = useCartSummary();
>>>>>>> Stashed changes

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-text-primary">{t('confirm.paymentTitle')}</p>
            <p className="text-sm text-text-secondary">{t('confirm.paymentSubtitle')}</p>
          </div>
        </div>
<<<<<<< Updated upstream
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('confirm.totalLabel')}</span>
            <span className="font-medium text-text-primary">{formatVND(cart.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('confirm.depositLabel')}</span>
            <span className="font-bold text-primary-dark">{formatVND(cart.deposit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('confirm.remainingLabel')}</span>
            <span className="font-medium text-text-primary">{formatVND(remaining)}</span>
          </div>
        </div>
      </div>

=======
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{t('confirm.totalLabel')}</span>
          <span className="font-bold text-primary-dark">{formatVND(cart.total)}</span>
        </div>
      </div>

      {error != null && (
        <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error instanceof ApiError ? error.message : t('confirm.submitError')}</span>
        </div>
      )}

>>>>>>> Stashed changes
      <div className="flex items-start gap-2 rounded-xl bg-surface-soft/60 px-4 py-3 text-xs text-text-secondary">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <span>{t('confirm.note')}</span>
      </div>
    </div>
  );
}
