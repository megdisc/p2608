import { useState, useEffect, useRef } from 'react';
import './index.css';
import type { Tab } from './types';
import { AppLayout } from './components/layout';
import { 
  InventoryPage, 
  TransactionPage, 
  StocktakingPage, 
  MasterPage, 
  CategoryPage, 
  SupplierPage, 
  LocationPage,
  StaffPage,
  LoginPage
} from './pages';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved as Tab) || 'inventory';
  });

  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    if (!prevAuth.current && isAuthenticated) {
      setActiveTab('inventory');
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AlertProvider>
      <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'transaction' && <TransactionPage />}
        {activeTab === 'stocktaking' && <StocktakingPage />}
        {activeTab === 'master' && <MasterPage />}
        {activeTab === 'category' && <CategoryPage />}
        {activeTab === 'supplier' && <SupplierPage />}
        {activeTab === 'location' && <LocationPage />}
        {activeTab === 'staff' && <StaffPage />}
      </AppLayout>
    </AlertProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
