import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppRouter } from './AppRouter';
import { AdminRouter } from './AdminRouter';
import { ProtectedRoute } from './ProtectedRoute';
import { UnauthorizedPage } from './UnauthorizedPage';
import { LandingPage } from '../features/customer/pages/LandingPage';
import { LoginPage } from '../features/customer/pages/LoginPage';
import { useAuth } from '../context/AuthContext';
import { WashingCounterPage } from '../pages/washing-counter/WashingCounterPage';
import { getDestinationForRole } from '../features/auth/roleAccess';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  return <Navigate to={isAuthenticated ? getDestinationForRole(role) : '/landing'} replace />;
};

const LandingRoute: React.FC = () => {
  const navigate = useNavigate();
  return <LandingPage onNavigateToAuth={() => navigate('/login')} />;
};

export const RootRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/landing" element={<LandingRoute />} />
      <Route path="/login" element={<LoginPage onLoginSuccess={() => undefined} />} />
      <Route path="/counter-login" element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/app/*"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <AppRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counter/*"
        element={
          <ProtectedRoute allowedRoles={['STAFF']}>
            <WashingCounterPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
