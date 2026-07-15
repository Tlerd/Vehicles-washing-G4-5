import type { Customer, CustomerTier, Vehicle } from '../../types';

export type CustomerTierFilter = CustomerTier | 'ALL';
export type CustomerSortKey = 'createdAt' | 'totalSpend' | 'points';

interface FilterCustomersInput {
  customers: Customer[];
  vehicles: Vehicle[];
  search: string;
  tier: CustomerTierFilter;
  sortBy: CustomerSortKey;
}

const normalize = (value: string) => value.trim().toLowerCase();

export function getFilteredCustomers({
  customers,
  vehicles,
  search,
  tier,
  sortBy,
}: FilterCustomersInput): Customer[] {
  const query = normalize(search);

  return customers
    .filter(customer => {
      const matchesTier = tier === 'ALL' || customer.tier === tier;
      if (!matchesTier) return false;
      if (!query) return true;

      const customerVehicles = vehicles.filter(vehicle => vehicle.customerId === customer.id);
      const matchesCustomer =
        normalize(customer.name).includes(query) ||
        normalize(customer.phone).includes(query) ||
        normalize(customer.email ?? '').includes(query);
      const matchesVehicle = customerVehicles.some(vehicle =>
        normalize(vehicle.licensePlate).includes(query),
      );

      return matchesCustomer || matchesVehicle;
    })
    .sort((left, right) => {
      if (sortBy === 'totalSpend') return right.totalSpend - left.totalSpend;
      if (sortBy === 'points') return right.accumulatedPoints - left.accumulatedPoints;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}

export function isValidOptionalEmail(email: string): boolean {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
