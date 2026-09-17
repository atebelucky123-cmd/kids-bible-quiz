import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, type LoginInput, type PublicUser, type RegisterInput } from '@/lib/api';

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        setUser(await api.me());
      } catch {
        // Stored token is missing/expired/invalid — treat as logged out.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    register: async (input) => setUser(await api.register(input)),
    login: async (input) => setUser(await api.login(input)),
    logout: async () => {
      await api.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within <AuthProvider>');
  return ctx;
}
