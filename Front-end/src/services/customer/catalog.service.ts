import apiClient from '../../config/axios';
import { Branch, ServiceItem } from '../../types';
import { SERVICES } from '../../config/constants';

interface ServiceApiResponse { serviceCode:string; serviceName:string; description?:string; basePrice:number; durationMinutes?:number; }
interface BranchApiResponse {
  branchId: number;
  branchName: string;
  address?: string;
  phone?: string;
  openTime?: string;
  closeTime?: string;
  status?: string;
}
let cached: ServiceItem[] = [];
let cachedBranches: Branch[] = [];
export const catalogService = {
  async getServices(): Promise<ServiceItem[]> {
    const { data } = await apiClient.get<ServiceApiResponse[]>('/catalog/services');
    cached = data.map(s => {
      const presentation = SERVICES.find(item => item.id === s.serviceCode);
      return {
        id:s.serviceCode,
        name:s.serviceName,
        description:s.description||'',
        basePrice:Number(s.basePrice),
        duration:Number(s.durationMinutes||30),
        category:presentation?.category || 'single',
        group:presentation?.group || 'Other',
        icon:presentation?.icon || '✨',
        includes:presentation?.includes,
        suitableFor:presentation?.suitableFor,
        isPremium:presentation?.isPremium,
      };
    });
    return cached;
  },
  getCachedServices: (): ServiceItem[] => cached,

  async getBranches(): Promise<Branch[]> {
    const { data } = await apiClient.get<BranchApiResponse[]>('/catalog/branches');
    cachedBranches = data.map((branch) => ({
      id: branch.branchId === 1 ? 'D1' : branch.branchId === 2 ? 'D7' : String(branch.branchId),
      name: branch.branchName,
      address: branch.address || '',
      phone: branch.phone || '',
      openTime: String(branch.openTime || '').slice(0, 5),
      closeTime: String(branch.closeTime || '').slice(0, 5),
      status: branch.status?.toUpperCase() === 'COMING_SOON' ? 'COMING_SOON' : 'ACTIVE',
    }));
    return cachedBranches;
  },

  getCachedBranches: (): Branch[] => cachedBranches,
};
