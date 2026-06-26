import { Customer } from '../../types';
import { mockStore } from '../mockStore';

export const authService = {
  login(phone: string, _password: string): { success: boolean; customer: Customer | null; error?: string } {
    const customer = mockStore.getCustomerByPhone(phone);
    if (customer) {
      return { success: true, customer };
    }
    return { success: false, customer: null, error: 'Invalid login credentials. Try: 0901234567' };
  },

  sendOtp(email: string): { success: boolean; otpExpiresIn: number } {
    // Mock sending OTP
    console.log(`Mock OTP sent to ${email}: 123456`);
    return { success: true, otpExpiresIn: 60 };
  },

  verifyOtp(email: string, otp: string): { success: boolean; error?: string } {
    if (otp === '123456') {
      return { success: true };
    }
    return { success: false, error: 'Invalid OTP code. Use 123456.' };
  },

  register(name: string, phone: string, email: string, _password: string): { success: boolean; customer: Customer | null; error?: string } {
    const existing = mockStore.getCustomerByPhone(phone);
    if (existing) {
      return { success: false, customer: null, error: 'Phone number already registered' };
    }

    const newCustomer: Customer = {
      id: `c_${Date.now()}`,
      name,
      phone,
      email,
      tier: 'Member',
      accumulatedPoints: 100, // Welcome bonus
      totalSpend: 0,
      createdAt: new Date().toISOString(),
    };

    mockStore.addCustomer(newCustomer);
    return { success: true, customer: newCustomer };
  },

  loginAsGuest(): Customer {
    return {
      id: 'guest',
      name: 'Guest',
      phone: '',
      tier: 'Member',
      accumulatedPoints: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString(),
    };
  }
};
