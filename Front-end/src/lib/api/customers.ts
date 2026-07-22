import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

interface CustomerProfileApiResponse {
  customerId: number;
  fullName: string;
  phone: string;
  email: string | null;
  tier: string;
  accumulatedPoints: number;
  totalSpent: number;
  totalWashes: number;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  tier: string;
  accumulatedPoints: number;
  totalSpent: number;
  totalWashes: number;
}

function mapProfile(c: CustomerProfileApiResponse): CustomerProfile {
  return {
    id: String(c.customerId),
    fullName: c.fullName,
    phone: c.phone,
    email: c.email ?? '',
    tier: c.tier,
    accumulatedPoints: c.accumulatedPoints,
    totalSpent: c.totalSpent,
    totalWashes: c.totalWashes,
  };
}

/** GET /api/v1/customers/me — self-service profile, distinct from the
 *  admin-only /api/v1/customers/{id} surface. */
export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => mapProfile(await apiClient.get<CustomerProfileApiResponse>('/customers/me')),
  });
}

export interface ProfileUpdateInput {
  fullName: string;
  email: string;
}

/** PUT /api/v1/customers/me — name and email only; phone/tier/points/role
 *  are server-owned and cannot be changed through this endpoint. */
export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) =>
      apiClient
        .put<CustomerProfileApiResponse>('/customers/me', input)
        .then(mapProfile),
    onSuccess: (profile) => qc.setQueryData(['my-profile'], profile),
  });
}
