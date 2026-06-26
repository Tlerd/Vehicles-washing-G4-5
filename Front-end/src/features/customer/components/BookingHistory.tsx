import React from 'react';
import { Booking } from '../../../types';
import { Badge } from '../../../components/Badge/Badge';
import { formatPrice, formatDate, formatTime } from '../../../utils/formatters';
import { SERVICES, BRANCHES } from '../../../config/constants';
import styles from '../styles/BookingHistory.module.css';

interface BookingHistoryProps {
  bookings: Booking[];
}

const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'CONFIRMED': return 'info';
    case 'PENDING': return 'warning';
    case 'CANCELLED': return 'error';
    case 'CHECKED_IN': return 'info';
    default: return 'default';
  }
};

const translateStatus = (status: string): string => {
  switch (status) {
    case 'PENDING': return 'CHỜ XỬ LÝ';
    case 'CONFIRMED': return 'ĐÃ XÁC NHẬN';
    case 'COMPLETED': return 'HOÀN THÀNH';
    case 'CANCELLED': return 'ĐÃ HUỶ';
    case 'CHECKED_IN': return 'ĐÃ CHECK-IN';
    default: return status;
  }
};

export const BookingHistory: React.FC<BookingHistoryProps> = ({ bookings }) => {
  if (bookings.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        Chưa có lịch đặt nào. Đặt lịch rửa xe ngay!
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {bookings.map(booking => {
        const branch = BRANCHES.find(b => b.id === booking.branchId);
        const serviceNames = booking.services
          .map(sid => SERVICES.find(s => s.id === sid)?.name)
          .filter(Boolean)
          .join(', ');

        return (
          <div key={booking.id} className={styles.item}>
            <span className={styles.refBadge}>{booking.bookingRef || booking.id}</span>
            <div className={styles.info}>
              <div className={styles.infoTop}>{serviceNames || 'Dịch vụ rửa xe'}</div>
              <div className={styles.infoBottom}>
                {branch?.name || booking.branchId} • {formatDate(booking.date)} • {formatTime(booking.time)}
              </div>
            </div>
            <div className={styles.meta}>
              <span className={styles.price}>{formatPrice(booking.totalPrice)}</span>
              <Badge variant={getStatusVariant(booking.status)} size="sm">{translateStatus(booking.status)}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};
