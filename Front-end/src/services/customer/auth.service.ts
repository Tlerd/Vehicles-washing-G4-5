import { Customer } from '../../types';
import { mockStore } from '../mockStore';

const ADMIN_CREDENTIALS = {
  phone: '0999999999',
  password: 'password123',
};

const adminUser: Customer = {
  id: 'admin',
  name: 'System Admin',
  phone: ADMIN_CREDENTIALS.phone,
  email: 'admin@autowash.pro',
  role: 'ADMIN',
  tier: 'Platinum',
  accumulatedPoints: 0,
  totalSpend: 0,
  createdAt: '2026-06-26T00:00:00Z',
};

export const authService = {
  login(phone: string, password: string): { success: boolean; customer: Customer | null; error?: string } {
    if (phone === ADMIN_CREDENTIALS.phone) {
      if (password === ADMIN_CREDENTIALS.password) {
        return { success: true, customer: adminUser };
      }
      return { success: false, customer: null, error: 'Invalid admin password' };
    }

    const customer = mockStore.getCustomerByPhone(phone);
    if (customer) {
      return { success: true, customer };
    }
    return {
      success: false,
      customer: null,
      error: 'Invalid login. Try customer 0901234567 or admin 0999999999.',
    };
  },

  register(name: string, phone: string, email: string, _password: string): { success: boolean; customer: Customer | null; error?: string } {
    const existing = mockStore.getCustomerByPhone(phone);
    if (existing || phone === ADMIN_CREDENTIALS.phone) {
      return { success: false, customer: null, error: 'Phone number is already registered' };
    }

    const newCustomer: Customer = {
      id: `c_${Date.now()}`,
      name,
      phone,
      email,
      role: 'CUSTOMER',
      tier: 'Member',
      accumulatedPoints: 100,
      totalSpend: 0,
      createdAt: new Date().toISOString(),
    };

    mockStore.addCustomer(newCustomer);
    return { success: true, customer: newCustomer };
  },

  loginAsGuest(): Customer {
    return {
      id: 'guest',
      name: 'Khach vang lai',
      phone: '',
      role: 'CUSTOMER',
      tier: 'Member',
      accumulatedPoints: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString(),
    };
  },
};
