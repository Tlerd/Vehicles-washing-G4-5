import { Navigate, createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { LandingPage } from '@/features/landing/LandingPage';
import { BookingWizardPage } from '@/features/booking/BookingWizardPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { GaragePage } from '@/features/customer/pages/GaragePage';
import { ProfilePage } from '@/features/customer/pages/ProfilePage';
import { GuestOverviewPage } from '@/features/guest/GuestOverviewPage';
import { GuestBookingPreviewPage } from '@/features/guest/GuestBookingPreviewPage';
import { RoleOverviewPage } from '@/features/roles/RoleOverviewPage';
import { StaffQueuePage } from '@/features/staff/StaffQueuePage';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/guest', element: <GuestOverviewPage /> },
      { path: '/guest/booking', element: <GuestBookingPreviewPage /> },
      { path: '/booking', element: <Navigate to="/guest/booking" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/staff', element: <StaffQueuePage /> },
      {
        path: '/admin',
        element: <RoleOverviewPage requiredRole="ADMIN" title="Tổng quan quản trị" description="Khu vực quản trị dành cho tài khoản quản trị viên." />,
      },
    ],
  },
  {
    element: <CustomerLayout />,
    children: [
      { path: '/app', element: <Navigate to="/app/profile" replace /> },
      { path: '/app/booking', element: <BookingWizardPage /> },
      { path: '/app/garage', element: <GaragePage /> },
      { path: '/app/profile', element: <ProfilePage /> },
    ],
  },
]);
