import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppRouter } from './AppRouter';
import { AdminRouter } from './AdminRouter';
import { ProtectedRoute } from './ProtectedRoute';
import { UnauthorizedPage } from './UnauthorizedPage';
import { LandingPage } from '../features/customer/pages/LandingPage';
import { LoginPage } from '../features/customer/pages/LoginPage';
import { useAuth } from '../context/AuthContext';
import { WashingCounterPage } from '../pages/washing-counter/WashingCounterPage';
import { BookingProvider } from '../context/BookingContext';
import { getDestinationForRole } from '../features/auth/roleAccess';

const RootRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/landing" replace />;

  return <Navigate to={getDestinationForRole(role)} replace />;
};

export const RootRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        
        {/* Public Routes */}
        <Route path="/landing" element={<LandingPage onNavigateToAuth={() => { window.location.href = '/login'; }} />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={() => {}} />} />
        <Route path="/counter-login" element={<Navigate to="/login" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Protected Customer Routes */}
        <Route 
           path="/app/*" 
           element={
             <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <AppRouter />
             </ProtectedRoute>
           } 
        />
        
        {/* Protected Admin Routes */}
        <Route 
           path="/admin/*" 
           element={
             <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminRouter />
             </ProtectedRoute>
           } 
        />

        {/* Protected Counter Route */}
        <Route
           path="/counter/*"
           element={
             <ProtectedRoute allowedRoles={['COUNTER']}>
                <BookingProvider>
                  <WashingCounterPage />
                </BookingProvider>
             </ProtectedRoute>
           }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
