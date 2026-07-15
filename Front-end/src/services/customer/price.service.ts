import { CAR_MULTIPLIERS, SERVICES } from '../../config/constants';
import { CarSize } from '../../types';
import { catalogService } from './catalog.service';

const getServiceCatalog = () => {
  const liveCatalog = catalogService.getCachedServices();
  return liveCatalog.length > 0 ? liveCatalog : SERVICES;
};

export const priceService = {
  calculateBasePrice(serviceIds: string[]): number {
    return serviceIds.reduce((total, id) => {
      const service = getServiceCatalog().find(s => s.id === id);
      return total + (service?.basePrice || 0);
    }, 0);
  },

  getCarMultiplier(carSize: CarSize): number {
    return CAR_MULTIPLIERS[carSize] || 1.0;
  },

  calculateFinalPrice(serviceIds: string[], carSize: CarSize): number {
    const basePrice = this.calculateBasePrice(serviceIds);
    const multiplier = this.getCarMultiplier(carSize);
    return Math.round(basePrice * multiplier);
  },

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  },

  getServiceDetails(serviceIds: string[]) {
    return serviceIds.map(id => getServiceCatalog().find(s => s.id === id)).filter(Boolean);
  }
};
