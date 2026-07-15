import { useMemo } from 'react';
import { priceService } from '../../../services/customer/price.service';
import { CarSize } from '../../../types';

export const usePriceCalculation = (serviceIds: string[], carSize: CarSize) => {
  const basePrice = useMemo(() => priceService.calculateBasePrice(serviceIds), [serviceIds]);
  const multiplier = useMemo(() => priceService.getCarMultiplier(carSize), [carSize]);
  const finalPrice = useMemo(() => priceService.calculateFinalPrice(serviceIds, carSize), [serviceIds, carSize]);
  const formattedPrice = useMemo(() => priceService.formatPrice(finalPrice), [finalPrice]);

  return {
    basePrice,
    multiplier,
    finalPrice,
    formattedPrice,
  };
};
