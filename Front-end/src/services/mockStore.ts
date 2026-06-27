import { Booking, Customer, Vehicle, PointsTransaction } from '../types';

const mockCustomers: Customer[] = [
  { id: 'c1', name: 'John Doe', phone: '0901234567', email: 'john@example.com', tier: 'Gold', accumulatedPoints: 2450, totalSpend: 7500000, createdAt: '2026-01-10T12:00:00Z' },
  { id: 'c2', name: 'Bob Marvin', phone: '0912345678', email: 'bob@example.com', tier: 'Silver', accumulatedPoints: 800, totalSpend: 2800000, createdAt: '2026-02-15T12:00:00Z' },
  { id: 'c3', name: 'Alice Cooper', phone: '0907654321', email: 'alice@example.com', tier: 'Platinum', accumulatedPoints: 4200, totalSpend: 16500000, createdAt: '2026-03-10T12:00:00Z' },
];

const mockVehicles: Vehicle[] = [
  { id: 'v1', customerId: 'c1', licensePlate: '51G-123.45', brand: 'Toyota Camry', size: 'sedan', isDefault: true },
  { id: 'v2', customerId: 'c1', licensePlate: '51A-777.77', brand: 'Honda CRV', size: 'suv', isDefault: false },
  { id: 'v3', customerId: 'c2', licensePlate: '51A-999.99', brand: 'Mazda 3', size: 'hatchback', isDefault: true },
  { id: 'v4', customerId: 'c3', licensePlate: '30F-888.88', brand: 'Ford Ranger', size: 'pickup', isDefault: true },
];

const today = new Date().toISOString().split('T')[0];

const mockBookings: Booking[] = [
  { id: 'b1', bookingRef: 'AWP-1001', customerId: 'c1', vehicleId: 'v1', services: ['wc1', 'ec8'], carSize: 'sedan', branchId: 'D1', date: today, time: '09:00', totalPrice: 220000, status: 'COMPLETED', pointsEarned: 220, createdAt: '2026-06-20T09:00:00Z' },
  { id: 'b2', bookingRef: 'AWP-1002', customerId: 'c1', vehicleId: 'v1', services: ['wc2'], carSize: 'sedan', branchId: 'D7', date: today, time: '14:00', totalPrice: 280000, status: 'CONFIRMED', pointsEarned: 280, createdAt: '2026-06-22T10:00:00Z' },
  { id: 'b3', bookingRef: 'AWP-1003', customerId: 'c1', vehicleId: 'v2', services: ['wc3'], carSize: 'suv', branchId: 'D1', date: '2026-06-18', time: '10:00', totalPrice: 780000, status: 'COMPLETED', pointsEarned: 780, createdAt: '2026-06-18T10:00:00Z' },
  { id: 'b4', bookingRef: 'AWP-1004', customerId: 'c2', vehicleId: 'v3', services: ['wc4', 'ic5'], carSize: 'hatchback', branchId: 'D7', date: today, time: '15:30', totalPrice: 320000, status: 'PENDING', pointsEarned: 320, createdAt: '2026-06-23T11:30:00Z' },
];

const mockTransactions: PointsTransaction[] = [
  { id: 't1', customerId: 'c1', type: 'earn', points: 220, description: 'Earned from booking AWP-1001', createdAt: '2026-06-20T09:30:00Z' },
  { id: 't2', customerId: 'c1', type: 'earn', points: 780, description: 'Earned from booking AWP-1003', createdAt: '2026-06-18T10:30:00Z' },
  { id: 't3', customerId: 'c1', type: 'redeem', points: -500, description: 'Redeemed 50k Discount Voucher', createdAt: '2026-06-15T14:00:00Z' },
  { id: 't4', customerId: 'c1', type: 'tier_change', points: 0, description: 'Upgraded to Gold Tier', createdAt: '2026-06-10T12:00:00Z' },
];

class MockStore {
  private customers: Customer[] = [...mockCustomers];
  private vehicles: Vehicle[] = [...mockVehicles];
  private bookings: Booking[] = [...mockBookings];
  private transactions: PointsTransaction[] = [...mockTransactions];
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

  // Vehicles
  getVehiclesByCustomer(customerId: string): Vehicle[] {
    return this.vehicles.filter(v => v.customerId === customerId);
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

  addTransaction(transaction: PointsTransaction): void {
    this.transactions.push(transaction);
  }

  // Update customer points
  updateCustomerPoints(customerId: string, points: number): void {
    this.customers = this.customers.map(c => 
      c.id === customerId ? { ...c, accumulatedPoints: c.accumulatedPoints + points } : c
    );
  }
}

export const mockStore = new MockStore();
