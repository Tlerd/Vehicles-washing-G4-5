import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { Button, LanguageToggle, ThemeToggle } from '@/components/ui';

/** Guest is an unauthenticated booking mode, not a backend account role. */
export function GuestOverviewPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary">
      <header className="mx-auto flex max-w-3xl items-center justify-end gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </header>
      <section className="mx-auto mt-20 max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-12">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><UserRound /></div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">Guest overview</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Đặt lịch với tư cách khách</h1>
        <p className="mt-4 max-w-xl text-text-secondary">
          Bạn có thể đặt lịch ngay. Thông tin xe và liên hệ chỉ dùng cho lần đặt lịch này; chúng sẽ không được lưu vào garage.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/guest/booking')}>Đặt lịch ngay</Button>
          <Button variant="secondary" onClick={() => navigate('/login')}>Đăng nhập hoặc đăng ký</Button>
        </div>
      </section>
    </main>
  );
}
