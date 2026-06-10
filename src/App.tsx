import { useState, useEffect, useRef } from 'react';
import './index.css';
import type { Tab } from './types';
import { AppLayout, ProjectAppLayout } from './components/layout';
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
  const { isAuthenticated, activeSystem } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved as Tab) || 'inventory';
  });

  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    if (!prevAuth.current && isAuthenticated) {
      if (activeSystem === 'inventory') {
        setActiveTab('inventory');
      }
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, activeSystem]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (activeSystem === 'project') {
    return (
      <AlertProvider>
        <ProjectAppLayout>
          <div style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>案件管理ダッシュボード</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>案件管理システムの機能は現在開発中です。</p>
          </div>
        </ProjectAppLayout>
      </AlertProvider>
    );
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
