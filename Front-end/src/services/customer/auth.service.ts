import { Customer } from '../../types';
<<<<<<< HEAD
<<<<<<< HEAD
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
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      return { success: false, customer: null, error: errorMsg };
    }
  },

  sendOtp(email: string): { success: boolean; otpExpiresIn: number } {
    // Mock sending OTP (Deprecated for Client SDK Phone Auth but kept for potential fallbacks)
    console.log(`Mock OTP sent to ${email}: 123456`);
    return { success: true, otpExpiresIn: 60 };
  },

  verifyOtp(email: string, otp: string): { success: boolean; error?: string } {
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
      return { success: false, customer: null, error: 'Registration failed' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed';
      return { success: false, customer: null, error: errorMsg };
    }
  },

  loginAsGuest(): Customer {
=======
import apiClient from '../../config/axios';

interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: Customer;
  customer?: Customer;
  data?: AuthResponse;
}

const getApiMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeAuthResponse = (payload: AuthResponse) => {
  const data = payload.data || payload;
  return {
    token: data.token || data.accessToken || data.jwt,
    customer: data.customer || data.user || null,
  };
};

export const authService = {
  async login(phone: string, password: string): Promise<{ success: boolean; customer: Customer | null; token?: string; error?: string }> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { phone, password });
      const { token, customer } = normalizeAuthResponse(response.data);
      return { success: Boolean(customer), customer, token };
    } catch (error: any) {
      return { success: false, customer: null, error: getApiMessage(error, 'Invalid login credentials') };
    }
  },

  async sendOtp(email: string): Promise<{ success: boolean; otpExpiresIn: number }> {
    const response = await apiClient.post('/auth/send-otp', { email });
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
=======
import apiClient from '../../config/axios';

interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: Customer;
  customer?: Customer;
  data?: AuthResponse;
}

const getApiMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeAuthResponse = (payload: AuthResponse) => {
  const data = payload.data || payload;
  return {
    token: data.token || data.accessToken || data.jwt,
    customer: data.customer || data.user || null,
  };
};

export const authService = {
  async login(phone: string, password: string): Promise<{ success: boolean; customer: Customer | null; token?: string; error?: string }> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { phone, password });
      const { token, customer } = normalizeAuthResponse(response.data);
      return { success: Boolean(customer), customer, token };
    } catch (error: any) {
      return { success: false, customer: null, error: getApiMessage(error, 'Invalid login credentials') };
    }
  },

  async sendOtp(email: string): Promise<{ success: boolean; otpExpiresIn: number }> {
    const response = await apiClient.post('/auth/send-otp', { email });
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
    return {
      success: true,
      otpExpiresIn: response.data?.otpExpiresIn || response.data?.expiresIn || 60,
    };
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post('/auth/verify-otp', { email, otp });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: getApiMessage(error, 'Invalid OTP') };
    }
  },

  async register(name: string, phone: string, email: string, password: string): Promise<{ success: boolean; customer: Customer | null; token?: string; error?: string }> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        name,
        fullName: name,
        phone,
        email,
        password,
      });
      const { token, customer } = normalizeAuthResponse(response.data);
      return { success: true, customer, token };
    } catch (error: any) {
      return { success: false, customer: null, error: getApiMessage(error, 'Registration failed') };
    }
  }
};
