import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer } from '../types';
import { authService } from '../services/customer/auth.service';

interface AuthContextType {
  currentUser: Customer | null;
  isAuthenticated: boolean;
  role: 'CUSTOMER' | 'ADMIN' | null;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
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

  const register = useCallback(async (name: string, phone: string, email: string, password: string) => {
    const result = await authService.register(name, phone, email, password);
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

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('session');
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: currentUser !== null,
      role: currentUser?.role || null,
      login,
      register,
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
