import type { UserRole } from '../../types';

export type PortalTarget = 'auth' | 'customer' | 'admin';

interface RoleBearingUser {
  role?: UserRole;
}

export function canAccessAdminPortal(user: RoleBearingUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function getPortalForUser(user: RoleBearingUser | null): PortalTarget {
  if (!user) return 'auth';
  return canAccessAdminPortal(user) ? 'admin' : 'customer';
}
