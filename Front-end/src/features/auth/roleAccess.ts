import type { UserRole } from '../../types';

export type PortalTarget = 'auth' | 'customer' | 'washing' | 'admin';
export type LoginRole = UserRole;

interface RoleBearingUser {
  role?: UserRole;
}

export interface LoginRoleOption {
  id: LoginRole;
  label: string;
  heading: string;
  description: string;
  destination: string;
  demoPhone: string;
  demoPassword: string;
  supportText: string;
}

export const LOGIN_ROLE_OPTIONS: LoginRoleOption[] = [
  {
    id: 'CUSTOMER',
    label: 'Customer',
    heading: 'Customer account access',
    description: 'Book services, manage vehicles, and track rewards from one personal portal.',
    destination: '/app',
    demoPhone: '',
    demoPassword: '',
    supportText: 'Use the phone number and password from your registered customer account.',
  },
  {
    id: 'STAFF',
    label: 'Staff',
    heading: 'Staff counter access',
    description: 'Approve arrivals, check vehicles in, and keep daily operations moving.',
    destination: '/counter',
    demoPhone: '0900000001',
    demoPassword: 'Staff@123',
    supportText: 'Use the seeded staff account to open the live washing-counter queue.',
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    heading: 'Admin control access',
    description: 'Monitor customers, campaigns, revenue, and operational activity.',
    destination: '/admin',
    demoPhone: '0900000002',
    demoPassword: 'Admin@123',
    supportText: 'Use the seeded admin account to access protected management APIs.',
  },
];

export function getUserRole(user: RoleBearingUser | null): UserRole | null {
  return user?.role ?? null;
}

export function canAccessAdminPortal(user: RoleBearingUser | null): boolean {
  return getUserRole(user) === 'ADMIN';
}

export function getPortalForUser(user: RoleBearingUser | null): PortalTarget {
  const role = getUserRole(user);
  if (!role) return 'auth';
  if (role === 'ADMIN') return 'admin';
  if (role === 'STAFF') return 'washing';
  return 'customer';
}

export function getDestinationForRole(role: UserRole | null): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'STAFF') return '/counter';
  if (role === 'CUSTOMER') return '/app';
  return '/login';
}
