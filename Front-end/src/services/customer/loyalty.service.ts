import apiClient from '../../config/axios';
import { PointsTransaction, RedeemedVoucher } from '../../types';

export interface PointHistoryDTO {
  pointHistoryId: number;
  points: number;
  activityType: string;
  description: string;
  createdAt: string;
}

export interface VoucherDTO {
  voucherId: number;
  voucherCode: string;
  voucherType: string;
  discountAmount: number;
  status: string;
  expiredAt: string;
  redeemedAt: string;
}

export const loyaltyService = {
  async getPointsHistory(customerId: string): Promise<PointsTransaction[]> {
    if (!customerId || customerId === 'guest') return [];
    try {
      const response = await apiClient.get(`/loyalty/customers/${customerId}/points`);
      return response.data.map((item: PointHistoryDTO) => ({
        id: String(item.pointHistoryId),
        customerId,
        type: item.activityType,
        points: item.points,
        description: item.description,
        createdAt: item.createdAt,
      }));
    } catch (err) {
      console.error('Failed to fetch points history:', err);
      return [];
    }
  },

  async getVouchers(customerId: string): Promise<RedeemedVoucher[]> {
    if (!customerId || customerId === 'guest') return [];
    try {
      const response = await apiClient.get(`/loyalty/customers/${customerId}/vouchers`);
      return response.data.map((item: VoucherDTO) => ({
        id: String(item.voucherId),
        customerId,
        type: item.voucherType,
        title: item.voucherType === 'discount_50k' ? '50k Discount Voucher' : 
               item.voucherType === 'free_basic' ? 'Free Basic Wash' : 'Free Detail Upgrade',
        pointsCost: 0, // Backend might not return the cost originally spent
        code: item.voucherCode,
        isUsed: item.status === 'USED',
        createdAt: item.redeemedAt || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Failed to fetch vouchers:', err);
      return [];
    }
  },

  async redeemVoucher(customerId: string, voucherType: string, pointsCost: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post('/loyalty/vouchers/redeem', {
        customerId: Number(customerId),
        voucherType,
        pointsCost,
      });
      return { success: true, data: response.data };
    } catch (err: any) {
      console.error('Failed to redeem voucher:', err);
      return { success: false, error: err.response?.data?.message || 'Không đủ điểm để đổi voucher này.' };
    }
  },
};
