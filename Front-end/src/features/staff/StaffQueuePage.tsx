import { Navigate } from 'react-router-dom';
import { Car, RefreshCcw } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, LanguageToggle, Skeleton, ThemeToggle } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { roleHomePath } from '@/features/auth/roleNavigation';
import { formatVND } from '@/lib/money';
import {
  useStaffQueue,
  useUpdateBookingStatus,
  type BookingStatusCode,
  type StaffBooking,
} from '@/lib/api/staffBookings';

const NEXT_STATUS: Partial<Record<BookingStatusCode, { label: string; next: BookingStatusCode }>> = {
  PENDING: { label: 'Xác nhận', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Check-in', next: 'CHECKED_IN' },
  CHECKED_IN: { label: 'Hoàn tất', next: 'COMPLETED' },
};

const STATUS_LABEL: Record<BookingStatusCode, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang rửa xe',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Real staff console: lists today's bookings (GET /washing-counter/queue)
 *  and lets staff advance the booking lifecycle (PATCH .../status). */
export function StaffQueuePage() {
  const { customer, signOut } = useAuth();
  const date = todayIso();
  const { data: bookings, isLoading, isError, refetch } = useStaffQueue(date);
  const updateStatus = useUpdateBookingStatus();

  if (!customer) return <Navigate to="/login" replace />;
  if (customer.role !== 'STAFF' && customer.role !== 'ADMIN') {
    return <Navigate to={roleHomePath(customer.role)} replace />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{customer.role}</p>
          <h1 className="font-display text-2xl font-bold">Danh sách đặt lịch hôm nay</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary"
            aria-label="Làm mới"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <LanguageToggle />
          <ThemeToggle />
          <Button variant="secondary" onClick={() => void signOut()}>Đăng xuất</Button>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-4xl space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        )}

        {!isLoading && isError && <ErrorState message="Không thể tải danh sách." onRetry={() => refetch()} />}

        {!isLoading && !isError && bookings && bookings.length === 0 && (
          <EmptyState
            icon={<Car className="h-8 w-8" />}
            title="Chưa có lịch đặt"
            description="Chưa có khách hàng nào đặt lịch cho hôm nay."
          />
        )}

        {!isLoading &&
          !isError &&
          bookings?.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              onAdvance={(next) => updateStatus.mutate({ id: booking.id, status: next })}
              isUpdating={updateStatus.isPending && updateStatus.variables?.id === booking.id}
            />
          ))}
        {updateStatus.isError && (
          <p className="text-sm text-danger">Không thể cập nhật trạng thái. Vui lòng thử lại.</p>
        )}
      </section>
    </main>
  );
}

function BookingRow({
  booking,
  onAdvance,
  isUpdating,
}: {
  booking: StaffBooking;
  onAdvance: (next: BookingStatusCode) => void;
  isUpdating: boolean;
}) {
  const action = NEXT_STATUS[booking.status];
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text-primary">
            {booking.customerName} · {booking.bookingRef}
          </p>
          <p className="text-sm text-text-secondary">
            {booking.licensePlate} ({booking.vehicleBrand}) · {booking.serviceNames.join(', ')}
          </p>
          <p className="text-sm text-text-secondary">
            {booking.bookingTime} · {formatVND(booking.totalPrice)}
            {booking.paymentStatus && ` · Thanh toán: ${booking.paymentStatus}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{STATUS_LABEL[booking.status]}</Badge>
          {action && (
            <Button onClick={() => onAdvance(action.next)} disabled={isUpdating}>
              {isUpdating ? 'Đang lưu…' : action.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
