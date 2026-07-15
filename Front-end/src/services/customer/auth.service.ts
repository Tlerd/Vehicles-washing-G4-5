import axios from 'axios';
import { Customer, UserRole } from '../../types';
import apiClient from '../../config/axios';

interface LoginApiResponse {
  token: string;
  customer: {
    id: string | number;
    name: string;
    phone: string;
    email?: string;
    tier: Customer['tier'];
    accumulatedPoints: number;
    totalSpend: number;
    createdAt?: string;
    role: UserRole;
  };
}

interface ProfileApiResponse {
  customerId: string | number;
  fullName: string;
  phone: string;
  email?: string;
  tier: Customer['tier'];
  accumulatedPoints: number;
  totalSpent: number;
  totalWashes?: number;
  createdAt: string;
}

const getApiError = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const mapLoginCustomer = (data: LoginApiResponse['customer']): Customer => ({
  id: String(data.id),
  name: data.name,
  phone: data.phone,
  email: data.email || '',
  tier: data.tier,
  accumulatedPoints: Number(data.accumulatedPoints || 0),
  totalSpend: Number(data.totalSpend || 0),
  createdAt: data.createdAt || new Date().toISOString(),
  role: data.role,
});

export const authService = {
  async login(phone: string, password: string): Promise<{ success: boolean; token?: string; customer: Customer | null; error?: string }> {
    try {
      const { data } = await apiClient.post<LoginApiResponse>('/auth/login', { phone, password });
      if (!data.token || !data.customer?.role) {
        return { success: false, customer: null, error: 'The server returned an incomplete login response.' };
      }
      return { success: true, token: data.token, customer: mapLoginCustomer(data.customer) };
    } catch (error: unknown) {
      return { success: false, customer: null, error: getApiError(error, 'Login failed.') };
    }
  },

  async register(
    name: string,
    phone: string,
    email: string,
    password: string,
    firebaseToken: string,
  ): Promise<{ success: boolean; customer: Customer | null; error?: string }> {
    try {
      const { data } = await apiClient.post<{ success: boolean; customerId: string | number }>('/auth/register', {
        name,
        phone,
        email,
        password,
        firebaseToken,
      });
      if (!data.success) return { success: false, customer: null, error: 'Registration failed.' };
      return {
        success: true,
        customer: {
          id: String(data.customerId),
          name,
          phone,
          email,
          tier: 'Member',
          accumulatedPoints: 0,
          totalSpend: 0,
          totalWashes: 0,
          createdAt: new Date().toISOString(),
          role: 'CUSTOMER',
        },
      };
    } catch (error: unknown) {
      return { success: false, customer: null, error: getApiError(error, 'Registration failed.') };
    }
  },

  async getProfile(customer: Customer): Promise<Customer> {
    const { data } = await apiClient.get<ProfileApiResponse>(`/customers/${customer.id}`);
    return {
      ...customer,
      name: data.fullName,
      phone: data.phone,
      email: data.email || '',
      tier: data.tier,
      accumulatedPoints: Number(data.accumulatedPoints || 0),
      totalSpend: Number(data.totalSpent || 0),
      totalWashes: Number(data.totalWashes || 0),
      createdAt: data.createdAt || customer.createdAt,
    };
  },
};
