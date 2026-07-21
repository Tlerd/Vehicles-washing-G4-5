import { useNavigate } from 'react-router-dom';
import { CalendarCheck, LogIn, UserPlus } from 'lucide-react';
import { Button, LanguageToggle, ThemeToggle } from '@/components/ui';
import { WIZARD_STEPS } from '@/features/booking/store';

/** FR-004 Phase 1 decision #2: /guest/booking stays a preview/redirect-to-
 *  login stub. Every wizard step now calls real, JWT-required backend APIs
 *  (catalog/availability/booking), so it can no longer share the interactive
 *  BookingWizardPage with an unauthenticated route. */
export function GuestBookingPreviewPage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      <header className="mb-10 flex items-center justify-end gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </header>
      <section className="rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-12">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <CalendarCheck />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-text-primary">
          Quy trình đặt lịch
        </h1>
        <p className="mt-3 text-text-secondary">
          Đặt lịch trực tuyến cần tài khoản để lưu xe, áp dụng điểm thưởng và theo dõi lịch sử.
          Đăng nhập hoặc đăng ký miễn phí để tiếp tục.
        </p>
        <ol className="mt-6 space-y-2">
          {WIZARD_STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-soft text-xs font-semibold text-text-primary">
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/login')}>
            <LogIn className="h-4 w-4" /> Đăng nhập
          </Button>
          <Button variant="secondary" onClick={() => navigate('/login', { state: { mode: 'register' } })}>
            <UserPlus className="h-4 w-4" /> Đăng ký
          </Button>
        </div>
      </section>
    </main>
  );
}
