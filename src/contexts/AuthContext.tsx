import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type User = {
  id: string;
  email: string;
} | null;

type AuthContextType = {
  isAuthenticated: boolean;
  user: User;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // 開発用にローカルストレージから状態を復元（任意）
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [user, setUser] = useState<User>(null);

  const login = async (email?: string, _password?: string) => {
    // 将来的にはここで supabase.auth.signInWithPassword などを呼び出す
    // 現状はダミーとして常に成功させる
    setIsAuthenticated(true);
    setUser({ id: 'dummy-id', email: email || 'dummy@example.com' });
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = async () => {
    // 将来的にはここで supabase.auth.signOut などを呼び出す
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
