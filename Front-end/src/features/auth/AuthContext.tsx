import { createContext, useContext, useState, type ReactNode } from 'react';
import { setAuthToken } from '@/lib/api/client';
import { login as loginRequest, type AuthCustomer } from '@/lib/api/auth';

const STORAGE_KEY = 'aw-session';

interface StoredSession {
  token: string;
  customer: AuthCustomer;
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

interface AuthState {
  customer: AuthCustomer | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<AuthCustomer>;
  /** Called after a successful backend /auth/register to establish a session
   *  without asking the customer to log in again. */
  setSession: (token: string, customer: AuthCustomer) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Real backend JWT session (POST /api/v1/auth/login), persisted to
 *  localStorage. Firebase (lib/firebase.ts) is used only to verify phone
 *  ownership during registration — it is not the session source. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<StoredSession | null>(() => {
    const stored = readStoredSession();
    if (stored) setAuthToken(stored.token);
    return stored;
  });

  const persist = (next: StoredSession | null) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setAuthToken(next.token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    }
    setSessionState(next);
  };

  const login = async (phone: string, password: string) => {
    const result = await loginRequest(phone, password);
    persist({ token: result.token, customer: result.customer });
    return result.customer;
  };

  const setSession = (token: string, customer: AuthCustomer) => {
    persist({ token, customer });
  };

  const signOut = async () => {
    persist(null);
  };

  return (
    <AuthContext.Provider
      value={{
        customer: session?.customer ?? null,
        token: session?.token ?? null,
        loading: false,
        login,
        setSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
