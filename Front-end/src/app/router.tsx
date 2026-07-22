import { Navigate, createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { LandingPage } from '@/features/landing/LandingPage';
import { BookingWizardPage } from '@/features/booking/BookingWizardPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
<<<<<<< HEAD
import { GaragePage } from '@/features/customer/pages/GaragePage';
import { ProfilePage } from '@/features/customer/pages/ProfilePage';
import { GuestOverviewPage } from '@/features/guest/GuestOverviewPage';
import { GuestBookingPreviewPage } from '@/features/guest/GuestBookingPreviewPage';
import { RoleOverviewPage } from '@/features/roles/RoleOverviewPage';
import { StaffQueuePage } from '@/features/staff/StaffQueuePage';
=======
import { DashboardPage } from '@/features/customer/pages/DashboardPage';
import { GaragePage } from '@/features/customer/pages/GaragePage';
import { PointsPage } from '@/features/customer/pages/PointsPage';
import { VouchersPage } from '@/features/customer/pages/VouchersPage';
import { HistoryPage } from '@/features/customer/pages/HistoryPage';
import { BookingDetailPage } from '@/features/customer/pages/BookingDetailPage';
import { GuestOverviewPage } from '@/features/guest/GuestOverviewPage';
import { GuestBookingPreviewPage } from '@/features/guest/GuestBookingPreviewPage';
import { RoleOverviewPage } from '@/features/roles/RoleOverviewPage';
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/guest', element: <GuestOverviewPage /> },
      { path: '/guest/booking', element: <GuestBookingPreviewPage /> },
      { path: '/booking', element: <Navigate to="/guest/booking" replace /> },
      { path: '/login', element: <LoginPage /> },
<<<<<<< HEAD
      { path: '/staff', element: <StaffQueuePage /> },
=======
      {
        path: '/staff',
        element: <RoleOverviewPage requiredRole="STAFF" title="Tổng quan nhân viên" description="Khu vực vận hành dành cho nhân viên rửa xe." />,
      },
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
      {
        path: '/admin',
        element: <RoleOverviewPage requiredRole="ADMIN" title="Tổng quan quản trị" description="Khu vực quản trị dành cho tài khoản quản trị viên." />,
      },
    ],
  },
  {
    element: <CustomerLayout />,
    children: [
<<<<<<< HEAD
      { path: '/app', element: <Navigate to="/app/profile" replace /> },
      { path: '/app/booking', element: <BookingWizardPage /> },
      { path: '/app/garage', element: <GaragePage /> },
      { path: '/app/profile', element: <ProfilePage /> },
=======
      { path: '/app', element: <DashboardPage /> },
      { path: '/app/booking', element: <BookingWizardPage /> },
      { path: '/app/garage', element: <GaragePage /> },
      { path: '/app/points', element: <PointsPage /> },
      { path: '/app/vouchers', element: <VouchersPage /> },
      { path: '/app/history', element: <HistoryPage /> },
      { path: '/app/bookings/:id', element: <BookingDetailPage /> },
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
    ],
  },
]);
