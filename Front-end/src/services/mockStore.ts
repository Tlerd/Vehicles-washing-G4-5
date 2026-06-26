import { Booking, Customer, CustomerTier, RedeemedVoucher, Vehicle, PointsTransaction } from '../types';
import { LOYALTY_TIERS } from '../config/constants';

const addMonths = (isoDate: string, months: number) => {
  const date = new Date(isoDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
};

const calculateTier = (points: number): CustomerTier => {
  const tiers = [...LOYALTY_TIERS].sort((a, b) => b.requiredPoints - a.requiredPoints);
  return tiers.find(tier => points >= tier.requiredPoints)?.name || 'Member';
};

const calculateEarnedPoints = (totalPrice: number, tier: CustomerTier) => {
  const tierDef = LOYALTY_TIERS.find(item => item.name === tier);
  return Math.floor((totalPrice / 1000) * (tierDef?.multiplier || 1));
};

const mockCustomers: Customer[] = [];
const mockVehicles: Vehicle[] = [];
const mockBookings: Booking[] = [];
const mockTransactions: PointsTransaction[] = [];
const mockVouchers: RedeemedVoucher[] = [];

class MockStore {
  private customers: Customer[] = [...mockCustomers];
  private vehicles: Vehicle[] = [...mockVehicles];
  private bookings: Booking[] = [...mockBookings];
  private transactions: PointsTransaction[] = [...mockTransactions];
  private vouchers: RedeemedVoucher[] = [...mockVouchers];
  private bookedSlots: Map<string, string[]> = new Map();

  // Customers
  getCustomerByPhone(phone: string): Customer | null {
    return this.customers.find(c => c.phone === phone) || null;
  }

  getCustomerById(id: string): Customer | null {
    this.expireOldPoints(id);
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
    this.expireOldPoints(customerId);
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

  getVouchersByCustomer(customerId: string): RedeemedVoucher[] {
    return this.vouchers.filter(v => v.customerId === customerId);
  }

  redeemVoucher(customerId: string, type: RedeemedVoucher['type'], pointsCost: number, title: string): RedeemedVoucher | null {
    const customer = this.getCustomerById(customerId);
    if (!customer || customer.accumulatedPoints < pointsCost) return null;

    const voucher: RedeemedVoucher = {
      id: `rv_${Date.now()}`,
      customerId,
      type,
      title,
      pointsCost,
      status: 'active',
      code: `${type.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    this.vouchers.push(voucher);
    this.customers = this.customers.map(c =>
      c.id === customerId ? { ...c, accumulatedPoints: c.accumulatedPoints - pointsCost } : c
    );
    this.addTransaction({
      id: `pt_redeem_${Date.now()}`,
      customerId,
      type: 'redeem',
      points: -pointsCost,
      description: `Redeemed ${title}`,
      createdAt: new Date().toISOString(),
    });
    this.refreshCustomerTier(customerId);
    return voucher;
  }

  updateBookingStatus(id: string, status: Booking['status']): Booking | null {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking) return null;

    const previousStatus = booking.status;
    this.bookings = this.bookings.map(b => b.id === id ? { ...b, status } : b);

    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      this.checkoutBooking(booking);
    }

    return this.bookings.find(b => b.id === id) || null;
  }

  // Missing methods for Admin Panel
  getCustomers(): Customer[] { return this.customers; }
  getVehicles(): Vehicle[] { return this.vehicles; }
  getBookings(): Booking[] { return this.bookings; }
  getTransactions(): PointsTransaction[] { return this.transactions; }
  getVouchers(): RedeemedVoucher[] { return this.vouchers; }
  
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

  private checkoutBooking(booking: Booking): void {
    const customer = this.getCustomerById(booking.customerId);
    if (!customer) return;

    const pointsEarned = calculateEarnedPoints(booking.totalPrice, customer.tier);
    this.bookings = this.bookings.map(b =>
      b.id === booking.id ? { ...b, pointsEarned, status: 'COMPLETED' } : b
    );
    this.customers = this.customers.map(c =>
      c.id === customer.id
        ? {
            ...c,
            accumulatedPoints: c.accumulatedPoints + pointsEarned,
            totalSpend: c.totalSpend + booking.totalPrice,
          }
        : c
    );
    this.addTransaction({
      id: `pt_earn_${Date.now()}`,
      customerId: customer.id,
      type: 'earn',
      points: pointsEarned,
      description: `Earned from booking ${booking.bookingRef}: floor(${booking.totalPrice.toLocaleString('vi-VN')} / 1,000 x ${customer.tier})`,
      createdAt: new Date().toISOString(),
      expiresAt: addMonths(new Date().toISOString(), 12),
    });
    this.refreshCustomerTier(customer.id);
  }

  private refreshCustomerTier(customerId: string): void {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return;

    const nextTier = calculateTier(customer.accumulatedPoints);
    if (nextTier === customer.tier) return;

    this.customers = this.customers.map(c => c.id === customerId ? { ...c, tier: nextTier } : c);
    this.addTransaction({
      id: `pt_tier_${Date.now()}`,
      customerId,
      type: 'tier_change',
      points: 0,
      description: `Tier updated to ${nextTier}`,
      createdAt: new Date().toISOString(),
    });
  }

  private expireOldPoints(customerId: string): void {
    const now = Date.now();
    const expirable = this.transactions.filter(tx =>
      tx.customerId === customerId &&
      tx.type === 'earn' &&
      tx.points > 0 &&
      tx.expiresAt &&
      new Date(tx.expiresAt).getTime() <= now &&
      !this.transactions.some(existing => existing.type === 'expire' && existing.description.includes(tx.id))
    );

    if (expirable.length === 0) return;

    const expiredPoints = expirable.reduce((sum, tx) => sum + tx.points, 0);
    this.customers = this.customers.map(c =>
      c.id === customerId ? { ...c, accumulatedPoints: Math.max(0, c.accumulatedPoints - expiredPoints) } : c
    );
    expirable.forEach(tx => {
      this.addTransaction({
        id: `pt_expire_${tx.id}`,
        customerId,
        type: 'expire',
        points: -tx.points,
        description: `Expired points from ${tx.id} after 12 months`,
        createdAt: new Date().toISOString(),
      });
    });
    this.refreshCustomerTier(customerId);
  }
}

export const mockStore = new MockStore();
