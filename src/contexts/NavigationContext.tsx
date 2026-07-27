import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Tab } from '../types';

type NavigationContextType = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ 
  activeTab, 
  setActiveTab, 
  children 
}: NavigationContextType & { children: ReactNode }) {
  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
