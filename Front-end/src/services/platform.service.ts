import apiClient from '../config/axios';
import { Booking, PointsTransaction } from '../types';

const mapBooking = (d: Record<string, unknown>): Booking => ({
  id: String(d.id), bookingRef: String(d.bookingRef), customerId: String(d.customerId ?? ''), vehicleId: String(d.vehicleId ?? ''),
  customerName: String(d.customerName ?? ''), customerPhone: String(d.customerPhone ?? ''), licensePlate: String(d.licensePlate ?? ''), vehicleBrand: String(d.vehicleBrand ?? ''),
  services: Array.isArray(d.serviceNames) ? d.serviceNames.map(String) : [], carSize: String(d.vehicleSize ?? 'SEDAN').toLowerCase() as Booking['carSize'], branchId: String(d.branchId) === '1' ? 'D1' : 'D7', date: String(d.bookingDate ?? d.date),
  time: String(d.bookingTime ?? d.time), endTime: String(d.endTime ?? ''), durationMinutes: Number(d.durationMinutes ?? 0), totalPrice: Number(d.totalPrice), status: d.status as Booking['status'],
  pointsEarned: Number(d.pointsEarned ?? 0), createdAt: String(d.createdAt ?? new Date().toISOString()),
});

export const platformService = {
  async points(customerId: string): Promise<PointsTransaction[]> { const { data } = await apiClient.get(`/loyalty/customers/${customerId}/points`); return data.map((x: Record<string, unknown>) => ({ id:String(x.pointHistoryId), customerId, type:String(x.activityType).toLowerCase(), points:Number(x.points), description:String(x.description), createdAt:String(x.createdAt) })) as PointsTransaction[]; },
  async vouchers(customerId: string) { return (await apiClient.get(`/loyalty/customers/${customerId}/vouchers`)).data; },
  async redeem(customerId: string, voucherType: string, pointsCost: number) { return (await apiClient.post('/loyalty/vouchers/redeem',{customerId:Number(customerId),voucherType,pointsCost})).data; },
  async queue(date: string): Promise<Booking[]> { const {data}=await apiClient.get('/washing-counter/queue',{params:{date}});return data.map(mapBooking); },
  async status(id: string,status: Booking['status']) { return (await apiClient.patch(`/washing-counter/bookings/${id}/status`,{status})).data; },
  async customers(q='') { return (await apiClient.get('/admin/customers',{params:{q}})).data; },
  async adminBookings(page=0,status='') { return (await apiClient.get('/admin/bookings',{params:{page,size:20,status:status||undefined}})).data; },
  async revenue(period='month') { return (await apiClient.get('/admin/revenue',{params:{period}})).data; },
  async audit() { return (await apiClient.get('/admin/audit-logs')).data; },
  async campaigns() { return (await apiClient.get('/admin/campaigns')).data; },
  async createCampaign(body: object) { return (await apiClient.post('/admin/campaigns',body)).data; },
};
