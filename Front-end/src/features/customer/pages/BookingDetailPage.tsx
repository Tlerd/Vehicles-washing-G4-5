import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  MapPin,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { formatVND } from '@/lib/money';
import { formatBookingDayKey } from '@/lib/datetime';
import { newIdempotencyKey } from '@/lib/idempotency';
import { BOOKING_STATUS_TONE } from '@/lib/bookingStatusTone';
import { useBooking, useCheckIn, useCompleteBooking, useSubmitFeedback } from '@/lib/mock/customerApi';
import type { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

const STAR_VALUES = [1, 2, 3, 4, 5];

function NotFound({ t }: { t: (key: string) => string }) {
  return (
    <EmptyState
      icon={<CalendarClock className="h-8 w-8" />}
      title={t('detail.notFound.title')}
      description={t('detail.notFound.description')}
      action={
        <Link to="/app/history">
          <Button variant="secondary">{t('detail.notFound.action')}</Button>
        </Link>
      }
    />
  );
}

/** D-01 + lỗi #13: the customer, not staff, drives check-in → completion, and
 *  the feedback form appears immediately once the booking becomes COMPLETED. */
export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('feedback');
  const { data: booking, isLoading, isError, refetch } = useBooking(id);

  const checkIn = useCheckIn();
  const completeBooking = useCompleteBooking();
  const submitFeedback = useSubmitFeedback();

  // BR-028: stable per booking id, so a resend of the same action reuses the
  // same key instead of minting a new one on every render.
  const checkInKey = useMemo(newIdempotencyKey, [id]);
  const completeKey = useMemo(newIdempotencyKey, [id]);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [justCompleted, setJustCompleted] = useState(false);
  const prevStatusRef = useRef<BookingStatus | undefined>(undefined);

  useEffect(() => {
    if (prevStatusRef.current === 'CHECKED_IN' && booking?.status === 'COMPLETED') {
      setJustCompleted(true);
    }
    prevStatusRef.current = booking?.status;
  }, [booking?.status]);

  if (!id) return <NotFound t={t} />;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-36" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState message={t('detail.loadError')} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!booking) return <NotFound t={t} />;

  const showFeedbackForm = booking.status === 'COMPLETED' && !booking.feedbackRating;
  const showFeedbackSummary = booking.status === 'COMPLETED' && Boolean(booking.feedbackRating);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-3">
        <Link
          to="/app/history"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary"
          aria-label={t('detail.backToHistory')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-text-primary">
            {t('detail.bookingId', { id: booking.id })}
          </h1>
        </div>
        <Badge tone={BOOKING_STATUS_TONE[booking.status]} className="shrink-0">
          {t(`detail.status.${booking.status}`)}
        </Badge>
      </header>

      <Card>
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
            <MapPin className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-primary">{booking.branchName}</p>
            <p className="text-sm text-text-secondary">{booking.serviceNames.join(', ')}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <CalendarClock className="h-4 w-4" />
              {t('detail.summary.schedule')}
            </span>
            <span className="font-medium text-text-primary">
              {formatBookingDayKey(booking.dayKey, i18n.language)} · {booking.time}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Wallet className="h-4 w-4" />
              {t('detail.summary.total')}
            </span>
            <span className="font-bold text-text-primary">{formatVND(booking.total)}</span>
          </div>
        </div>
      </Card>

      {justCompleted && showFeedbackForm && (
        <div className="flex items-start gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('detail.complete.successBanner')}</span>
        </div>
      )}

      {booking.status === 'CONFIRMED' && (
        <Card>
          <p className="text-sm text-text-secondary">{t('detail.checkIn.explanation')}</p>
          <Button
            className="mt-4 w-full sm:w-auto"
            onClick={() => checkIn.mutate({ id, idempotencyKey: checkInKey })}
            disabled={checkIn.isPending}
          >
            {checkIn.isPending ? t('detail.checkIn.pending') : t('detail.checkIn.action')}
          </Button>
          {checkIn.isError && <p className="mt-2 text-sm text-danger">{t('detail.checkIn.error')}</p>}
        </Card>
      )}

      {booking.status === 'CHECKED_IN' && (
        <Card>
          <p className="text-sm text-text-secondary">{t('detail.complete.explanation')}</p>
          <Button
            className="mt-4 w-full sm:w-auto"
            onClick={() => completeBooking.mutate({ id, idempotencyKey: completeKey })}
            disabled={completeBooking.isPending}
          >
            {completeBooking.isPending ? t('detail.complete.pending') : t('detail.complete.action')}
          </Button>
          {completeBooking.isError && (
            <p className="mt-2 text-sm text-danger">{t('detail.complete.error')}</p>
          )}
        </Card>
      )}

      {showFeedbackForm && (
        <Card>
          <p className="font-semibold text-text-primary">{t('detail.feedback.title')}</p>
          <p className="mt-1 text-sm text-text-secondary">{t('detail.feedback.description')}</p>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-text-primary">
              {t('detail.feedback.ratingLabel')}
            </p>
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-label={t('detail.feedback.ratingLabel')}
            >
              {STAR_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  onClick={() => setRating(value)}
                  aria-label={t('detail.feedback.starAria', { count: value })}
                  aria-checked={rating === value}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-soft"
                >
                  <Star
                    className={cn(
                      'h-6 w-6',
                      rating >= value ? 'fill-current text-warning' : 'text-text-muted',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <label className="mt-3 block space-y-1.5">
            <span className="text-sm font-medium text-text-primary">
              {t('detail.feedback.commentLabel')}
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('detail.feedback.commentPlaceholder')}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface-soft px-4 py-3 text-sm text-text-primary transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          {rating === 0 && (
            <p className="mt-2 text-xs text-text-muted">{t('detail.feedback.validation')}</p>
          )}

          <Button
            className="mt-4 w-full sm:w-auto"
            disabled={rating < 1 || submitFeedback.isPending}
            onClick={() => submitFeedback.mutate({ id, rating, comment })}
          >
            {submitFeedback.isPending ? t('detail.feedback.pending') : t('detail.feedback.submit')}
          </Button>
          {submitFeedback.isError && (
            <p className="mt-2 text-sm text-danger">{t('detail.feedback.error')}</p>
          )}
        </Card>
      )}

      {showFeedbackSummary && (
        <Card>
          <p className="font-semibold text-text-primary">{t('detail.feedback.submitted.title')}</p>
          <div className="mt-2 flex items-center gap-1">
            {STAR_VALUES.map((value) => (
              <Star
                key={value}
                className={cn(
                  'h-5 w-5',
                  (booking.feedbackRating ?? 0) >= value ? 'fill-current text-warning' : 'text-text-muted',
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {booking.feedbackComment || t('detail.feedback.submitted.noComment')}
          </p>
        </Card>
      )}

      {booking.status === 'NO_SHOW' && (
        <div className="flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('detail.readOnly.NO_SHOW')}</span>
        </div>
      )}

      {booking.status === 'CHANGE_REQUESTED' && (
        <div className="flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm text-warning">
          <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('detail.readOnly.CHANGE_REQUESTED')}</span>
        </div>
      )}
    </div>
  );
}
