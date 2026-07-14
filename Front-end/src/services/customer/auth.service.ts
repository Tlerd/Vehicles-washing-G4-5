import { Customer } from '../../types';
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
        createdAt: data.customer.createdAt || new Date().toISOString(),
        role: data.customer.role || 'CUSTOMER'
      };
      return { success: true, token: data.token, customer };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      return { success: false, customer: null, error: errorMsg };
    }
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
          createdAt: new Date().toISOString(), role: 'CUSTOMER'
        };
        return { success: true, customer };
      }
      return { success: false, customer: null, error: 'Registration failed' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed';
      return { success: false, customer: null, error: errorMsg };
    }
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
      role: 'CUSTOMER',
    };
  }
};
