import { useRef, useState } from 'react';
import { CheckCircle2, Gift, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from '@/components/ui';
import type { VoucherOffer } from '@/types';

type CardStatus = 'idle' | 'confirming' | 'redeeming' | 'success' | 'error';

interface VoucherCardProps {
  voucher: VoucherOffer;
  tierOk: boolean;
  pointsOk: boolean;
  requiredTierName: string;
  pointsNeeded: number;
  onRedeem: () => Promise<void>;
}

const DISMISS_CLASS =
  'inline-flex min-h-[44px] items-center px-1 text-xs font-semibold underline underline-offset-2';

export function VoucherCard({
  voucher,
  tierOk,
  pointsOk,
  requiredTierName,
  pointsNeeded,
  onRedeem,
}: VoucherCardProps) {
  const { t } = useTranslation('vouchers');
  const [status, setStatus] = useState<CardStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  // Synchronous lock: a fast double-click can invoke handleConfirm twice
  // before React commits the 'redeeming' state, which would otherwise fire
  // onRedeem() (a points-deducting mutation) twice.
  const submittingRef = useRef(false);

  const redeemable = tierOk && pointsOk;

  async function handleConfirm(): Promise<void> {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus('redeeming');
    try {
      await onRedeem();
      setStatus('success');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : t('errors.redeem'));
      setStatus('error');
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
          <Gift className="h-5 w-5" />
        </span>
        <Badge tone="primary">{t('costPoints', { points: voucher.costPoints })}</Badge>
      </div>

      <div>
        <p className="font-semibold text-text-primary">{voucher.name}</p>
        <p className="mt-1 text-sm text-text-secondary">{voucher.description}</p>
      </div>

      {status === 'success' && (
        <div className="flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="flex-1">{t('redeemSuccess')}</p>
          <button type="button" onClick={() => setStatus('idle')} className={DISMISS_CLASS}>
            {t('dismiss')}
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="flex-1">{errorMessage}</p>
          <button type="button" onClick={() => setStatus('idle')} className={DISMISS_CLASS}>
            {t('dismiss')}
          </button>
        </div>
      )}

      {status === 'confirming' && (
        <div className="rounded-xl border border-border bg-surface-soft p-3">
          <p className="text-sm text-text-primary">
            {t('confirmPrompt', { points: voucher.costPoints, name: voucher.name })}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="md" variant="primary" className="flex-1" onClick={() => void handleConfirm()}>
              {t('confirmYes')}
            </Button>
            <Button
              size="md"
              variant="secondary"
              className="flex-1"
              onClick={() => setStatus('idle')}
            >
              {t('confirmNo')}
            </Button>
          </div>
        </div>
      )}

      {status === 'redeeming' && (
        <Button size="md" variant="primary" className="w-full" disabled>
          {t('redeeming')}
        </Button>
      )}

      {status === 'idle' && redeemable && (
        <Button size="md" variant="primary" className="w-full" onClick={() => setStatus('confirming')}>
          {t('redeemAction')}
        </Button>
      )}

      {status === 'idle' && !redeemable && (
        <div className="space-y-1.5">
          <Button size="md" variant="secondary" className="w-full" disabled>
            {t('redeemAction')}
          </Button>
          <p className="text-center text-xs text-text-muted">
            {!tierOk
              ? t('reasons.tier', { tier: requiredTierName })
              : t('reasons.points', { points: pointsNeeded })}
          </p>
        </div>
      )}
    </Card>
  );
}
