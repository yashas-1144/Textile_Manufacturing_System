import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  authenticate,
  clearSession,
  getStoredSession,
  type DemoSession,
} from '@/services/authService';

export interface AuthUser {
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(session: DemoSession): AuthUser {
  return { email: session.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const session = getStoredSession();
    return session ? toUser(session) : null;
  });

  const login = async (email: string, password: string) => {
    const result = await authenticate(email, password);
    if (result.ok) {
      const session = getStoredSession();
      if (session) setUser(toUser(session));
    }
    return result;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}