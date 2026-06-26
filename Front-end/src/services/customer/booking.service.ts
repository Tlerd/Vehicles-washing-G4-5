import { Booking, BookingDraft, TimeSlot } from '../../types';
import { SLOT_INTERVAL_MINUTES, TIME_SLOTS_START, TIME_SLOTS_END, LOYALTY_TIERS } from '../../config/constants';
import { mockStore } from '../mockStore';
import { priceService } from './price.service';

export const bookingService = {
  createBooking(draft: BookingDraft, customerId: string): Booking {
    if (!draft.branchId || !draft.date || !draft.time) {
      throw new Error('Thiếu thông tin đặt lịch bắt buộc');
    }

    const totalPrice = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);
    
    let tierMultiplier = 1.0;
    if (customerId !== 'guest') {
      const customer = mockStore.getCustomerById(customerId);
      if (customer) {
        const tierDef = LOYALTY_TIERS.find(t => t.name === customer.tier);
        if (tierDef) tierMultiplier = tierDef.multiplier;
      }
    }
    const pointsEarned = Math.floor((totalPrice / 1000) * tierMultiplier);
    const bookingRef = `AWP-${Math.floor(2000 + Math.random() * 8000)}`;

    const booking: Booking = {
      id: `b_${Date.now()}`,
      bookingRef,
      customerId,
      vehicleId: draft.vehicleId || '',
      services: [...draft.selectedServices],
      carSize: draft.carSize,
      branchId: draft.branchId,
      date: draft.date,
      time: draft.time,
      totalPrice,
      status: 'PENDING',
      pointsEarned,
      createdAt: new Date().toISOString(),
    };

    mockStore.addBooking(booking);
    return booking;
  },

  getBookings(customerId: string): Booking[] {
    return mockStore.getBookingsByCustomer(customerId);
  },

  getAvailableSlots(branchId: string, date: string): TimeSlot[] {
    const bookedSlots = mockStore.getBookedSlots(branchId, date);
    const slots: TimeSlot[] = [];
    
    const [startH, startM] = TIME_SLOTS_START.split(':').map(Number);
    const [endH, endM] = TIME_SLOTS_END.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m < endMinutes; m += SLOT_INTERVAL_MINUTES) {
      const hours = Math.floor(m / 60);
      const mins = m % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      // Check if the date is in the past
      const now = new Date();
      const slotDate = new Date(date);
      const isToday = slotDate.toDateString() === now.toDateString();
      const isPast = isToday && (hours < now.getHours() || (hours === now.getHours() && mins <= now.getMinutes()));

      slots.push({
        time: timeStr,
        available: !bookedSlots.includes(timeStr) && !isPast,
      });
    }

    return slots;
  },

  validateBooking(draft: BookingDraft): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!draft.carSize) errors.push('Vui lòng chọn loại xe');
    if (draft.selectedServices.length === 0) errors.push('Vui lòng chọn ít nhất một dịch vụ');
    if (!draft.branchId) errors.push('Vui lòng chọn chi nhánh');
    if (!draft.date) errors.push('Vui lòng chọn ngày');
    if (!draft.time) errors.push('Vui lòng chọn khung giờ');

    return { valid: errors.length === 0, errors };
  },

  getNextSevenDays(): { date: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }[] {
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()],
        isToday: i === 0,
      });
    }
    return days;
  }
};
