import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { SystemType } from '../types';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
} | null;

type AuthContextType = {
  isAuthenticated: boolean;
  user: User;
  activeSystem: SystemType | null;
  login: (email?: string, password?: string, system?: SystemType) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [activeSystem, setActiveSystem] = useState<SystemType | null>(() => {
    return (sessionStorage.getItem('activeSystem') as SystemType) || null;
  });
  
  const [user, setUser] = useState<User>(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true' 
      ? { id: 'dummy', email: 'dummy@example.com', name: '佐藤健', role: 'システム管理者' } 
      : null;
  });



  const login = async (_email?: string, _password?: string, system?: SystemType) => {
    // 将来的にはここで supabase.auth.signInWithPassword などを呼び出す
    // 現状はダミーとして常に成功させる
    const selectedSystem = system || 'inventory';
    setIsAuthenticated(true);
    setUser({ id: 'dummy', email: 'dummy@example.com', name: '佐藤健', role: 'システム管理者' });
    setActiveSystem(selectedSystem);
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('activeSystem', selectedSystem);
    sessionStorage.removeItem('activeTab');
  };

  const logout = async () => {
    // 将来的にはここで supabase.auth.signOut などを呼び出す
    setIsAuthenticated(false);
    setUser(null);
    setActiveSystem(null);
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('activeSystem');
    sessionStorage.removeItem('activeTab');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, activeSystem, login, logout }}>
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
