import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer } from '../types';
import { authService } from '../services/customer/auth.service';

interface AuthContextType {
  currentUser: Customer | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email: string, password: string, firebaseToken: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    const token=localStorage.getItem('auth_token'); const saved=localStorage.getItem('user');
    if(!token||!saved) return null;
    try { return JSON.parse(saved) as Customer; } catch { localStorage.removeItem('user'); localStorage.removeItem('auth_token'); return null; }
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
      isGuest: currentUser?.id === 'guest',
      login,
      register,
      loginAsGuest,
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
