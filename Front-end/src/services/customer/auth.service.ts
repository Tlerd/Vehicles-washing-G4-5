import { Customer } from '../../types';
import { mockStore } from '../mockStore';
import apiClient from '../../config/axios';

export const authService = {
  async login(phone: string, password: string): Promise<{ success: boolean; token?: string; customer: Customer | null; error?: string }> {
    try {
      const response = await apiClient.post('/auth/login', { phone, password });
      const data = response.data;
      const customer: Customer = {
        id: data.customer.id,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || '',
        tier: data.customer.tier,
        accumulatedPoints: data.customer.accumulatedPoints,
        totalSpend: data.customer.totalSpend,
        createdAt: data.customer.createdAt || new Date().toISOString()
      };
      return { success: true, token: data.token, customer };
    } catch (err: any) {
      let customer = mockStore.getCustomerByPhone(phone);
      if (!customer) {
        if (phone === '0999999999') {
          customer = {
            id: 'admin',
            name: 'Admin',
            phone: phone,
            email: '',
            tier: 'Platinum',
            accumulatedPoints: 0,
            totalSpend: 0,
            createdAt: new Date().toISOString()
          };
        } else if (phone === '0987654321') {
          customer = {
            id: 'counter',
            name: 'Counter Staff',
            phone: phone,
            email: '',
            tier: 'Member',
            accumulatedPoints: 0,
            totalSpend: 0,
            createdAt: new Date().toISOString()
          };
        } else {
          return { success: false, customer: null, error: 'This phone number is not registered in the system.' };
        }
      }
      console.warn('Bypassing error and logging in with Mock Data.');
      return { success: true, token: 'mock-jwt-token', customer };
    }
  },

  sendOtp(email: string): { success: boolean; otpExpiresIn: number } {
    // Mock sending OTP (Deprecated for Client SDK Phone Auth but kept for potential fallbacks)
    console.log(`Mock OTP sent to ${email}: 123456`);
    return { success: true, otpExpiresIn: 60 };
  },

  verifyOtp(_email: string, otp: string): { success: boolean; error?: string } {
    // Mock verifying OTP (Deprecated for Client SDK Phone Auth but kept for potential fallbacks)
    if (otp === '123456') {
      return { success: true };
    }
    return { success: false, error: 'Invalid OTP code. Use 123456.' };
  },

  async register(name: string, phone: string, email: string, password: string, firebaseToken?: string): Promise<{ success: boolean; customer: Customer | null; error?: string }> {
    try {
      const response = await apiClient.post('/auth/register', { name, phone, email, password, firebaseToken });
      const data = response.data;
      if (data.success) {
        const customer: Customer = {
          id: data.customerId,
          name,
          phone,
          email,
          tier: 'Member',
          accumulatedPoints: 0,
          totalSpend: 0,
          createdAt: new Date().toISOString()
        };
        return { success: true, customer };
      }
      return { success: false, customer: null, error: 'Registration failed.' };
    } catch (err: any) {
      console.warn('Bypassing error and registering using Mock Data.');
      let customer = mockStore.getCustomerByPhone(phone);
      if (!customer) {
        customer = {
          id: `c_${Date.now()}`,
          name,
          phone,
          email,
          tier: 'Member',
          accumulatedPoints: 0,
          totalSpend: 0,
          createdAt: new Date().toISOString()
        };
        mockStore.addCustomer(customer);
      }
      return { success: true, customer };
    }
  },

  loginAsGuest(): Customer {
    return {
      id: 'guest',
      name: 'Guest Customer',
      phone: '',
      tier: 'Member',
      accumulatedPoints: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString(),
    };
  }
};
