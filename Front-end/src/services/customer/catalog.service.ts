import apiClient from '../../config/axios';
import { ServiceItem } from '../../types';
import { SERVICES } from '../../config/constants';

interface ServiceApiResponse { serviceCode:string; serviceName:string; description?:string; basePrice:number; durationMinutes?:number; }
let cached: ServiceItem[] = [];
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
};
