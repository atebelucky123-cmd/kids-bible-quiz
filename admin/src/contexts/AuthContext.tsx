import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AdminUser } from '../lib/api';

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (firstName: string, password: string) => Promise<void>;
  // Optional message for the login screen, e.g. after a password change.
  logout: (notice?: string) => Promise<void>;
  notice: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then((u) => setUser(u.role === 'ADMIN' ? u : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (firstName: string, password: string) => {
    const loggedIn = await api.login({ firstName, password });
    // A student who happens to know a valid password never reaches the
    // dashboard — requireAdmin on the backend already blocks every
    // /api/admin/* call, but rejecting here too gives an immediate,
    // honest message instead of a dashboard full of failed requests.
    if (loggedIn.role !== 'ADMIN') {
      await api.logout().catch(() => {});
      throw new Error('This account does not have admin access.');
    }
    setNotice(null);
    setUser(loggedIn);
  }, []);

  const logout = useCallback(async (nextNotice?: string) => {
    await api.logout().catch(() => {});
    setNotice(nextNotice ?? null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout, notice }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
