import type { Customer, UserRole } from '../../types';

export type PortalTarget = 'auth' | 'customer' | 'counter' | 'admin';
export type LoginRole = 'CUSTOMER' | 'COUNTER' | 'ADMIN';

interface RoleBearingUser {
  role?: UserRole;
  id?: string;
  phone?: string;
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
    demoPhone: '0901234567',
    demoPassword: 'password123',
    supportText: 'Use your member account to continue booking faster and keep loyalty benefits in sync.',
  },
  {
    id: 'COUNTER',
    label: 'Staff',
    heading: 'Staff counter access',
    description: 'Approve arrivals, check vehicles in, and keep daily operations moving without friction.',
    destination: '/counter',
    demoPhone: '0987654321',
    demoPassword: 'password123',
    supportText: 'Use the counter workspace for branch-level check-in, queue handling, and handoff updates.',
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    heading: 'Admin control access',
    description: 'Monitor customers, campaigns, revenue, and reward rules from the operations workspace.',
    destination: '/admin',
    demoPhone: '0999999999',
    demoPassword: 'password123',
    supportText: 'Use the admin workspace for governance, reporting, and service-growth decisions.',
  },
];

export function getUserRole(user: RoleBearingUser | Customer | null): UserRole | null {
  if (!user) {
    return null;
  }

  if ('role' in user && user.role) {
    return user.role;
  }

  if (user.id === 'admin' || user.phone === '0999999999') {
    return 'ADMIN';
  }

  if (user.id === 'counter' || user.phone === '0987654321') {
    return 'COUNTER';
  }

  return 'CUSTOMER';
}

export function canAccessAdminPortal(user: RoleBearingUser | Customer | null): boolean {
  return getUserRole(user) === 'ADMIN';
}

export function getPortalForUser(user: RoleBearingUser | Customer | null): PortalTarget {
  const role = getUserRole(user);

  if (!role) {
    return 'auth';
  }

  if (role === 'ADMIN') {
    return 'admin';
  }

  if (role === 'COUNTER') {
    return 'counter';
  }

  return 'customer';
}

export function getDestinationForRole(role: UserRole | null): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'COUNTER':
      return '/counter';
    case 'CUSTOMER':
      return '/app';
    default:
      return '/login';
  }
}
