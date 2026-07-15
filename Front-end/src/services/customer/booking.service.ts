import { Booking, BookingDraft, TimeSlot } from '../../types';
import apiClient from '../../config/axios';

export const bookingService = {
  async createBooking(draft: BookingDraft, customerId: string): Promise<Booking & { vietQrUrl?: string }> {
    if (!draft.branchId || !draft.date || !draft.time) {
      throw new Error('Missing required booking information');
    }

    if (customerId === 'guest') throw new Error('Please login before booking');
    const serviceCodes = draft.selectedServices;
    const branchId = draft.branchId === 'D1' ? 1 : draft.branchId === 'D7' ? 2 : Number(draft.branchId);
    const response = await apiClient.post('/bookings', {
      customerId: Number(customerId), vehicleId: draft.vehicleId ? Number(draft.vehicleId) : null,
      licensePlate: draft.vehiclePlate, brand: draft.vehicleBrand, vehicleSize: draft.carSize.toUpperCase(), branchId,
      serviceCodes, bookingDate: draft.date, bookingTime: draft.time,
      voucherId: draft.voucherId ? Number(draft.voucherId) : null,
    });
    const data = response.data;
    return {
      id: String(data.id), bookingRef: data.bookingRef, customerId: String(data.customerId),
      customerName: data.customerName, customerPhone: data.customerPhone,
      vehicleId: String(data.vehicleId), licensePlate: data.licensePlate, vehicleBrand: data.vehicleBrand,
      services: Array.isArray(data.serviceNames) ? data.serviceNames : draft.selectedServices,
      carSize: String(data.vehicleSize || draft.carSize).toLowerCase() as Booking['carSize'],
      branchId: String(data.branchId) === '1' ? 'D1' : String(data.branchId) === '2' ? 'D7' : String(data.branchId),
      date: data.bookingDate, time: data.bookingTime, endTime: data.endTime,
      durationMinutes: Number(data.durationMinutes || 0),
      totalPrice: Number(data.totalPrice), status: data.status, pointsEarned: data.pointsEarned,
      appliedVoucherId: data.appliedVoucherId ? String(data.appliedVoucherId) : undefined,
      createdAt: data.createdAt, vietQrUrl: data.vietQrUrl,
    };
  },

  async hasActiveBooking(customerId:string):Promise<boolean>{
    const bookings=await this.getBookings(customerId);
    return bookings.some(item=>item.status==='PENDING'||item.status==='CONFIRMED');
  },

  async getBookings(customerId: string): Promise<Booking[]> {
    if (!customerId) return [];
    const response = await apiClient.get(`/bookings/customer/${customerId}`);
    return response.data.map((data: Record<string, unknown>) => ({
      id: String(data.id), bookingRef: String(data.bookingRef), customerId: String(data.customerId),
      customerName: String(data.customerName || ''), customerPhone: String(data.customerPhone || ''),
      vehicleId: String(data.vehicleId), licensePlate: String(data.licensePlate || ''),
      vehicleBrand: String(data.vehicleBrand || ''),
      services: Array.isArray(data.serviceNames) ? data.serviceNames.map(String) : [],
      carSize: String(data.vehicleSize || 'SEDAN').toLowerCase() as Booking['carSize'],
      branchId: String(data.branchId) === '1' ? 'D1' : String(data.branchId) === '2' ? 'D7' : String(data.branchId),
      date: String(data.bookingDate), time: String(data.bookingTime), endTime: String(data.endTime || ''),
      durationMinutes: Number(data.durationMinutes || 0), totalPrice: Number(data.totalPrice),
      status: data.status, pointsEarned: Number(data.pointsEarned),
      appliedVoucherId: data.appliedVoucherId ? String(data.appliedVoucherId) : undefined,
      createdAt: String(data.createdAt),
    })) as Booking[];
  },

  async getAvailableSlots(branchId: string, date: string, serviceCodes: string[]): Promise<TimeSlot[]> {
    const numericBranch = branchId === 'D1' ? 1 : branchId === 'D7' ? 2 : Number(branchId);
    return (await apiClient.get('/bookings/availability', { params: { branchId: numericBranch, date, serviceCodes }, paramsSerializer: { indexes: null } })).data;
  },

  validateBooking(draft: BookingDraft): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!draft.carSize) errors.push('Please select a vehicle type');
    if (draft.selectedServices.length === 0) errors.push('Please select at least one service');
    if (!draft.branchId) errors.push('Please select a branch');
    if (!draft.date) errors.push('Please select a date');
    if (!draft.time) errors.push('Please select a time slot');

    return { valid: errors.length === 0, errors };
  },

  getNextDays(limit=7): { date: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }[] {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < limit; i++) {
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
