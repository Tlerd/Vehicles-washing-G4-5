import { Customer } from '../../types';
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
      return { success: true, customer, token };
    } catch (error: any) {
      return { success: false, customer: null, error: getApiMessage(error, 'Invalid login credentials') };
    }
  },

  async sendOtp(email: string): Promise<{ success: boolean; otpExpiresIn: number }> {
    const response = await apiClient.post('/auth/send-otp', { email });
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
