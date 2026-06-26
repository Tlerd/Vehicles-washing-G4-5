import { Booking, Customer, Vehicle, PointsTransaction, Promotion } from '../types';

const mockCustomers: Customer[] = [
  { id: 'c1', name: 'John Doe', phone: '0901234567', email: 'john@example.com', role: 'CUSTOMER', tier: 'Gold', accumulatedPoints: 2450, totalSpend: 7500000, createdAt: '2026-01-10T12:00:00Z' },
  { id: 'c2', name: 'Bob Marvin', phone: '0912345678', email: 'bob@example.com', role: 'CUSTOMER', tier: 'Silver', accumulatedPoints: 800, totalSpend: 2800000, createdAt: '2026-02-15T12:00:00Z' },
  { id: 'c3', name: 'Alice Cooper', phone: '0907654321', email: 'alice@example.com', role: 'CUSTOMER', tier: 'Platinum', accumulatedPoints: 4200, totalSpend: 16500000, createdAt: '2026-03-10T12:00:00Z' },
];

const mockVehicles: Vehicle[] = [
  { id: 'v1', customerId: 'c1', licensePlate: '51G-123.45', brand: 'Toyota Camry', size: 'sedan', isDefault: true },
  { id: 'v2', customerId: 'c1', licensePlate: '51A-777.77', brand: 'Honda CRV', size: 'suv', isDefault: false },
  { id: 'v3', customerId: 'c2', licensePlate: '51A-999.99', brand: 'Mazda 3', size: 'hatchback', isDefault: true },
  { id: 'v4', customerId: 'c3', licensePlate: '30F-888.88', brand: 'Ford Ranger', size: 'pickup', isDefault: true },
];

const today = new Date().toISOString().split('T')[0];

const mockBookings: Booking[] = Array.from({ length: 24 }, (_, index) => {
  const customer = mockCustomers[index % mockCustomers.length];
  const customerVehicles = mockVehicles.filter(vehicle => vehicle.customerId === customer.id);
  const vehicle = customerVehicles[index % customerVehicles.length] ?? mockVehicles[0];
  const statuses: Booking['status'][] = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'];
  const services = index % 3 === 0 ? ['s1', 's7'] : index % 3 === 1 ? ['s2'] : ['s3'];
  const timeHour = 8 + (index % 10);

  return {
    id: `b${index + 1}`,
    bookingRef: `AWP-${String(1001 + index)}`,
    customerId: customer.id,
    vehicleId: vehicle.id,
    services,
    carSize: vehicle.size,
    branchId: index % 2 === 0 ? 'D1' : 'D7',
    date: index < 21 ? today : '2026-06-18',
    time: `${String(timeHour).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`,
    totalPrice: 180000 + index * 25000,
    status: statuses[index % statuses.length],
    pointsEarned: 180 + index * 25,
    createdAt: `2026-06-${String(1 + (index % 24)).padStart(2, '0')}T${String(timeHour).padStart(2, '0')}:00:00Z`,
  };
});

const mockTransactions: PointsTransaction[] = [
  { id: 't1', customerId: 'c1', type: 'earn', points: 220, description: 'Earned from booking AWP-1001', createdAt: '2026-06-20T09:30:00Z' },
  { id: 't2', customerId: 'c1', type: 'earn', points: 780, description: 'Earned from booking AWP-1003', createdAt: '2026-06-18T10:30:00Z' },
  { id: 't3', customerId: 'c1', type: 'redeem', points: -500, description: 'Redeemed 50k Discount Voucher', createdAt: '2026-06-15T14:00:00Z' },
  { id: 't4', customerId: 'c1', type: 'tier_change', points: 0, description: 'Upgraded to Gold Tier', createdAt: '2026-06-10T12:00:00Z' },
];

const mockPromotions: Promotion[] = [
  {
    id: 'promo-admin-1',
    title: 'Gold Weekday Shine',
    description: '18% off weekday washes for Gold members returning before month end.',
    discount: '18% OFF',
    validUntil: '2026-07-31',
    bgGradient: 'linear-gradient(135deg, #0b7f86, #18344f)',
    icon: 'Sparkles',
    targetTier: 'Gold',
    kmMultiplier: 1.18,
    isActive: true,
    createdAt: '2026-06-26T09:00:00Z',
  },
  {
    id: 'promo-admin-2',
    title: 'Rain Check Recovery',
    description: 'All members get a cleaner reset after rainy commutes.',
    discount: '10% OFF',
    validUntil: '2026-08-15',
    bgGradient: 'linear-gradient(135deg, #c8553d, #f4a261)',
    icon: 'TicketPercent',
    targetTier: 'ALL',
    kmMultiplier: 1.1,
    isActive: true,
    createdAt: '2026-06-24T09:00:00Z',
  },
];

class MockStore {
  private customers: Customer[] = [...mockCustomers];
  private vehicles: Vehicle[] = [...mockVehicles];
  private bookings: Booking[] = [...mockBookings];
  private transactions: PointsTransaction[] = [...mockTransactions];
  private promotions: Promotion[] = [...mockPromotions];
  private bookedSlots: Map<string, string[]> = new Map([
    [`D1_${today}`, ['09:00', '09:30', '14:00']],
    [`D7_${today}`, ['11:00', '11:30', '15:00', '15:30']],
  ]);

  // Customers
  getCustomerByPhone(phone: string): Customer | null {
    return this.customers.find(c => c.phone === phone) || null;
  }

  getCustomerById(id: string): Customer | null {
    return this.customers.find(c => c.id === id) || null;
  }

  addCustomer(customer: Customer): void {
    this.customers.push(customer);
  }

  getCustomers(): Customer[] {
    return [...this.customers];
  }

  updateCustomer(id: string, updates: Pick<Customer, 'name' | 'phone' | 'email'>): Customer | null {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return null;

    const updatedCustomer = { ...customer, ...updates };
    this.customers = this.customers.map(c => (c.id === id ? updatedCustomer : c));
    return updatedCustomer;
  }

  // Vehicles
  getVehiclesByCustomer(customerId: string): Vehicle[] {
    return this.vehicles.filter(v => v.customerId === customerId);
  }

  getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  addVehicle(vehicle: Vehicle): void {
    this.vehicles.push(vehicle);
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): void {
    this.vehicles = this.vehicles.map(v => v.id === id ? { ...v, ...updates } : v);
  }

  deleteVehicle(id: string): void {
    this.vehicles = this.vehicles.filter(v => v.id !== id);
  }

  // Bookings
  getBookingsByCustomer(customerId: string): Booking[] {
    return this.bookings.filter(b => b.customerId === customerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getBookings(): Booking[] {
    return [...this.bookings];
  }

  addBooking(booking: Booking): void {
    this.bookings.push(booking);
    // Mark slots as booked
    const key = `${booking.branchId}_${booking.date}`;
    const existing = this.bookedSlots.get(key) || [];
    existing.push(booking.time);
    this.bookedSlots.set(key, existing);
  }

  getBookedSlots(branchId: string, date: string): string[] {
    return this.bookedSlots.get(`${branchId}_${date}`) || [];
  }

  // Transactions
  getTransactionsByCustomer(customerId: string): PointsTransaction[] {
    return this.transactions.filter(t => t.customerId === customerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getTransactions(): PointsTransaction[] {
    return [...this.transactions];
  }

  addTransaction(transaction: PointsTransaction): void {
    this.transactions.push(transaction);
  }

  // Promotions
  getPromotions(): Promotion[] {
    return [...this.promotions];
  }

  addPromotion(promotion: Promotion): void {
    this.promotions = [promotion, ...this.promotions];
  }

  // Update customer points
  updateCustomerPoints(customerId: string, points: number): void {
    this.customers = this.customers.map(c => 
      c.id === customerId ? { ...c, accumulatedPoints: c.accumulatedPoints + points } : c
    );
  }
}

export const mockStore = new MockStore();
