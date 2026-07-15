import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer } from '../types';
import { authService } from '../services/customer/auth.service';
import { getUserRole } from '../features/auth/roleAccess';

interface AuthContextType {
  currentUser: Customer | null;
  role: 'ADMIN' | 'COUNTER' | 'CUSTOMER' | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email: string, password: string, firebaseToken: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = useCallback(async (phone: string, password: string) => {
    const result = await authService.login(phone, password);
    if (result.success && result.customer) {
      setCurrentUser(result.customer);
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
      localStorage.setItem('user', JSON.stringify(result.customer));
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const register = useCallback(async (name: string, phone: string, email: string, password: string, firebaseToken: string) => {
    const result = await authService.register(name, phone, email, password, firebaseToken);
    if (result.success && result.customer) {
      // Auto-login after successful registration to retrieve real JWT token
      const loginResult = await authService.login(phone, password);
      if (loginResult.success && loginResult.customer) {
        setCurrentUser(loginResult.customer);
        if (loginResult.token) {
          localStorage.setItem('auth_token', loginResult.token);
        }
        localStorage.setItem('user', JSON.stringify(loginResult.customer));
        return { success: true };
      }
      setCurrentUser(result.customer);
      localStorage.setItem('user', JSON.stringify(result.customer));
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const loginAsGuest = useCallback(() => {
    const guest = authService.loginAsGuest();
    setCurrentUser(guest);
    localStorage.setItem('user', JSON.stringify(guest));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    localStorage.removeItem('booking_draft');
  }, []);

  const role = React.useMemo(() => {
    return getUserRole(currentUser);
  }, [currentUser]);

  const refreshUser = useCallback(() => {
    if (currentUser?.phone) {
      // In a real app this would fetch from API. 
      // For mock, we can just read from mockStore if available, but AuthContext shouldn't strictly depend on it.
      // We will do a simple hack to re-fetch from mockStore via authService.login without password check
      // Or simply read from localStorage if it was updated, but localStorage might be stale.
      // Best is to use mockStore directly. Let's import mockStore.
      import('../services/mockStore').then(({ mockStore }) => {
        const updated = mockStore.getCustomerById(currentUser.id);
        if (updated) {
          setCurrentUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }
      });
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      role,
      isAuthenticated: currentUser !== null,
      isGuest: currentUser?.id === 'guest',
      login,
      register,
      loginAsGuest,
      logout,
      refreshUser,
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
