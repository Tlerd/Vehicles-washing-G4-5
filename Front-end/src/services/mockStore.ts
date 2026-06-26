import { Booking, Customer, Vehicle, PointsTransaction } from '../types';

const mockCustomers: Customer[] = [];

const mockVehicles: Vehicle[] = [];

const today = new Date().toISOString().split('T')[0];

const mockBookings: Booking[] = [];

const mockTransactions: PointsTransaction[] = [];

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

  // Missing methods for Admin Panel
  getCustomers(): Customer[] { return this.customers; }
  getVehicles(): Vehicle[] { return this.vehicles; }
  getBookings(): Booking[] { return this.bookings; }
  getTransactions(): PointsTransaction[] { return this.transactions; }
  
  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    let updated: Customer | null = null;
    this.customers = this.customers.map(c => {
      if (c.id === id) {
        updated = { ...c, ...updates };
        return updated;
      }
      return c;
    });
    return updated;
  }

  private promotions: any[] = [];
  getPromotions(): any[] { return this.promotions; }
  addPromotion(promo: any): void { this.promotions.push(promo); }
}

export const mockStore = new MockStore();
