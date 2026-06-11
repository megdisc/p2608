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
  LoginPage,
  ProjectPage,
  ProjectUserPage,
  SkillPage
} from './pages';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, activeSystem } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('activeTab');
    if (saved) return saved as Tab;
    return activeSystem === 'project' ? 'project' : 'inventory';
  });

  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    if (!prevAuth.current && isAuthenticated) {
      if (activeSystem === 'inventory') {
        setActiveTab('inventory');
      } else if (activeSystem === 'project') {
        setActiveTab('project');
      }
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, activeSystem]);

  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (activeSystem === 'project') {
    return (
      <AlertProvider>
        <ProjectAppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {activeTab === 'projectUser' ? (
            <ProjectUserPage />
          ) : activeTab === 'skill' ? (
            <SkillPage />
          ) : activeTab === 'project' ? (
            <ProjectPage />
          ) : activeTab === 'staff' ? (
            <StaffPage />
          ) : (
            <div style={{ padding: '32px' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>選択されたページは現在開発中です。</p>
            </div>
          )}
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
