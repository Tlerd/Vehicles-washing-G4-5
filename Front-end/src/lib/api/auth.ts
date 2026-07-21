import { apiClient } from './client';

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface AuthCustomer {
  id: string;
  name: string;
  phone: string;
  tier: string;
  role: Role;
  accumulatedPoints: number;
  totalSpend: number;
}

export interface LoginResult {
  token: string;
  customer: AuthCustomer;
}

/** POST /api/v1/auth/login — the real, primary customer session (JWT, 24h). */
export function login(phone: string, password: string): Promise<LoginResult> {
  return apiClient.post<LoginResult>('/auth/login', { phone, password });
}

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  email?: string;
  /** Firebase ID token from a completed Phone-OTP or Google Sign-In
   *  verification; the backend checks its phone_number or email claim
   *  against the submitted phone/email before creating the row. */
  firebaseToken: string;
}

export function register(input: RegisterInput): Promise<{ success: boolean; customerId: string }> {
  return apiClient.post('/auth/register', input);
}
