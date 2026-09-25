import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useOffices, type OfficeItem } from '../hooks/useOffices';

type OfficeContextType = {
  offices: OfficeItem[];
  selectedOfficeId: string;
  setSelectedOfficeId: (id: string) => void;
  selectedOffice: OfficeItem | null;
  loading: boolean;
};

const OfficeContext = createContext<OfficeContextType | undefined>(undefined);

export function OfficeProvider({ children }: { children: ReactNode }) {
  const { items: offices, loading, fetchOffices } = useOffices();
  const [selectedOfficeId, setSelectedOfficeIdState] = useState<string>(() => {
    return sessionStorage.getItem('selectedOfficeId') || '';
  });

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  useEffect(() => {
    if (offices.length > 0) {
      if (!selectedOfficeId || !offices.some(o => o.id === selectedOfficeId)) {
        const defaultId = offices[0].id;
        setSelectedOfficeIdState(defaultId);
        sessionStorage.setItem('selectedOfficeId', defaultId);
      }
    }
  }, [offices, selectedOfficeId]);

  const setSelectedOfficeId = useCallback((id: string) => {
    setSelectedOfficeIdState(id);
    sessionStorage.setItem('selectedOfficeId', id);
  }, []);

  const selectedOffice = offices.find(o => o.id === selectedOfficeId) || null;

  return (
    <OfficeContext.Provider
      value={{
        offices,
        selectedOfficeId,
        setSelectedOfficeId,
        selectedOffice,
        loading,
      }}
    >
      {children}
    </OfficeContext.Provider>
  );
}

export function useOffice() {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error('useOffice must be used within an OfficeProvider');
  }
  return context;
}
