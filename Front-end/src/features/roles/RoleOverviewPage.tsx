import { Navigate, useNavigate } from 'react-router-dom';
import { Button, LanguageToggle, ThemeToggle } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { roleHomePath } from '@/features/auth/roleNavigation';
import type { Role } from '@/lib/api/auth';

interface RoleOverviewPageProps {
  requiredRole: Extract<Role, 'STAFF' | 'ADMIN'>;
  title: string;
  description: string;
}

/** Explicit landing page for operational roles. Full staff/admin workspaces
 * are not part of the customer console, so a session can never fall through
 * into `/app` or the public booking wizard. */
export function RoleOverviewPage({ requiredRole, title, description }: RoleOverviewPageProps) {
  const { customer, signOut } = useAuth();
  const navigate = useNavigate();

  if (!customer) return <Navigate to="/login" replace />;
  if (customer.role !== requiredRole) return <Navigate to={roleHomePath(customer.role)} replace />;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary">
      <header className="mx-auto flex max-w-3xl items-center justify-end gap-3">
        <LanguageToggle />
        <ThemeToggle />
        <Button variant="secondary" onClick={() => void signOut()}>Đăng xuất</Button>
      </header>
      <section className="mx-auto mt-20 max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">{requiredRole}</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{title}</h1>
        <p className="mt-4 max-w-xl text-text-secondary">{description}</p>
        <p className="mt-8 rounded-xl bg-surface-soft p-4 text-sm text-text-secondary">
          Xin chào, <span className="font-semibold text-text-primary">{customer.name}</span>. Bạn đang ở đúng khu vực theo quyền tài khoản.
        </p>
        <Button className="mt-8" onClick={() => navigate('/')}>Về trang chủ</Button>
      </section>
    </main>
  );
}
