import { useState, useEffect } from 'react';
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
  StaffPage
} from './pages';
import { AlertProvider } from './contexts/AlertContext';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved as Tab) || 'inventory';
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

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

export default App;
