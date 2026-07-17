import { CAR_MULTIPLIERS, SERVICES } from '../../config/constants';
import { CarSize } from '../../types';
import { formatPrice as formatCurrency } from '../../utils/formatters';

export const priceService = {
  calculateBasePrice(serviceIds: string[]): number {
    return serviceIds.reduce((total, id) => {
      const service = SERVICES.find(s => s.id === id);
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
    return formatCurrency(amount);
  },

  getServiceDetails(serviceIds: string[]) {
    return serviceIds.map(id => SERVICES.find(s => s.id === id)).filter(Boolean);
  }
};
