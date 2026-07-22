import type { Role } from '@/lib/api/auth';

export function roleHomePath(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'STAFF':
      return '/staff';
    case 'CUSTOMER':
      return '/app';
  }
}
