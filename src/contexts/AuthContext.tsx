import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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
    // 開発用にローカルストレージから状態を復元（任意）
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [activeSystem, setActiveSystem] = useState<SystemType | null>(() => {
    return (localStorage.getItem('activeSystem') as SystemType) || null;
  });
  
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    async function fetchDummyUser() {
      if (isAuthenticated) {
        try {
          const { data, error } = await supabase
            .from('staffs')
            .select('id, email, name, role')
            .eq('name', '佐藤健')
            .single();

          if (data && !error) {
            setUser({
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role
            });
          }
        } catch (error) {
          console.error('Failed to fetch dummy user:', error);
        }
      } else {
        setUser(null);
      }
    }
    fetchDummyUser();
  }, [isAuthenticated]);

  const login = async (_email?: string, _password?: string, system?: SystemType) => {
    // 将来的にはここで supabase.auth.signInWithPassword などを呼び出す
    // 現状はダミーとして常に成功させる
    const selectedSystem = system || 'inventory';
    setIsAuthenticated(true);
    setActiveSystem(selectedSystem);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('activeSystem', selectedSystem);
  };

  const logout = async () => {
    // 将来的にはここで supabase.auth.signOut などを呼び出す
    setIsAuthenticated(false);
    setUser(null);
    setActiveSystem(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('activeSystem');
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
