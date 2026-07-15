import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Customer, UserRole } from '../types';
import { authService } from '../services/customer/auth.service';

interface AuthContextType {
  currentUser: Customer | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (
    name: string,
    phone: string,
    email: string,
    password: string,
    firebaseToken: string,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const restoreUser = (): Customer | null => {
  const token = localStorage.getItem('auth_token');
  const saved = localStorage.getItem('user');
  if (!token || !saved) return null;

  try {
    const parsed = JSON.parse(saved) as Customer;
    if (!parsed.id || !parsed.role) throw new Error('Invalid saved session');
    return parsed;
  } catch {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(restoreUser);
  const hasHydratedProfile = useRef(false);

  const persistSession = useCallback((customer: Customer, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(customer));
    setCurrentUser(customer);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    hasHydratedProfile.current = false;
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('autowash:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('autowash:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!currentUser || hasHydratedProfile.current) return;
    hasHydratedProfile.current = true;
    void authService.getProfile(currentUser).then((updated) => {
      localStorage.setItem('user', JSON.stringify(updated));
      setCurrentUser(updated);
    }).catch(() => {
      // Page-level loaders expose recoverable failures; the interceptor handles expired JWTs.
    });
  }, [currentUser]);

  const login = useCallback(async (phone: string, password: string) => {
    const result = await authService.login(phone, password);
    if (!result.success || !result.customer || !result.token) {
      return { success: false, error: result.error };
    }
    persistSession(result.customer, result.token);
    return { success: true, role: result.customer.role };
  }, [persistSession]);

  const register = useCallback(async (
    name: string,
    phone: string,
    email: string,
    password: string,
    firebaseToken: string,
  ) => {
    const result = await authService.register(name, phone, email, password, firebaseToken);
    if (!result.success) return { success: false, error: result.error };

    const loginResult = await authService.login(phone, password);
    if (!loginResult.success || !loginResult.customer || !loginResult.token) {
      return {
        success: false,
        error: loginResult.error || 'The account was created, but automatic sign-in failed.',
      };
    }

    persistSession(loginResult.customer, loginResult.token);
    return { success: true };
  }, [persistSession]);

  const refreshUser = useCallback(async () => {
    if (!currentUser) return;
    const updated = await authService.getProfile(currentUser);
    localStorage.setItem('user', JSON.stringify(updated));
    setCurrentUser(updated);
  }, [currentUser]);

  const role = useMemo(() => currentUser?.role ?? null, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      role,
      isAuthenticated: currentUser !== null,
      login,
      register,
      refreshUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
