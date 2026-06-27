import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer, UserRole } from '../types';
import { authService } from '../services/customer/auth.service';

interface AuthContextType {
  currentUser: Customer | null;
  isAuthenticated: boolean;
<<<<<<< HEAD
  isGuest: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email: string, password: string, firebaseToken: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
=======
  role: UserRole | null;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;

<<<<<<< HEAD
=======
    return JSON.parse(stored) as Customer;
  });

>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
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

<<<<<<< HEAD
  const register = useCallback(async (name: string, phone: string, email: string, password: string, firebaseToken: string) => {
    const result = await authService.register(name, phone, email, password, firebaseToken);
=======
  const register = useCallback(async (name: string, phone: string, email: string, password: string) => {
    const result = await authService.register(name, phone, email, password);
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
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
<<<<<<< HEAD
=======
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
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
    localStorage.removeItem('counter_session');
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
