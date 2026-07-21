import { Outlet } from 'react-router-dom';

/** Customer-facing shell uses the "comfortable" density tokens (D-24). */
export function PublicLayout() {
  return (
    <div
      data-density="comfortable"
      className="min-h-screen bg-background text-text-primary selection:bg-primary/20 selection:text-primary-dark"
    >
      <Outlet />
    </div>
  );
}
