import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
<<<<<<< HEAD
  Car,
  Droplets,
  LogOut,
  UserCircle,
=======
  CalendarClock,
  Car,
  Droplets,
  LayoutDashboard,
  LogOut,
  Star,
  Ticket,
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { roleHomePath } from '@/features/auth/roleNavigation';
import { LanguageToggle, ThemeToggle } from '@/components/ui';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
<<<<<<< HEAD
  { to: '/app/garage', label: 'Xe của tôi', icon: Car },
  { to: '/app/profile', label: 'Hồ sơ', icon: UserCircle },
=======
  { to: '/app', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/app/garage', label: 'Xe của tôi', icon: Car },
  { to: '/app/points', label: 'Điểm thưởng', icon: Star },
  { to: '/app/vouchers', label: 'Voucher', icon: Ticket },
  { to: '/app/history', label: 'Lịch sử', icon: CalendarClock },
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
];

/** Authenticated shell for Phase 2 customer pages. Redirects to /login,
 *  preserving the intended path so LoginPage can send the user back. */
export function CustomerLayout() {
  const { customer, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-text-muted">Đang tải…</div>;
  }
  if (!customer) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (customer.role !== 'CUSTOMER') {
    return <Navigate to={roleHomePath(customer.role)} replace />;
  }

  return (
    <div data-density="comfortable" className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Droplets className="h-5 w-5" />
            </span>
            <span className="font-display font-bold text-text-primary">AutoWash Pro</span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
<<<<<<< HEAD
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
=======
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-light/60 text-primary-dark'
                      : 'text-text-secondary hover:bg-surface-soft hover:text-text-primary',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => void signOut()}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:text-danger"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
<<<<<<< HEAD
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
=======
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                  isActive ? 'bg-primary-light/60 text-primary-dark' : 'text-text-secondary',
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
