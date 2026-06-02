import { useState } from 'react';
import './index.css';
import type { Tab } from './types';
import { AppLayout } from './components/layout';
import { 
  InventoryPage, 
  TransactionPage, 
  StocktakingPage, 
  MasterPage, 
  UnitPage,
  CategoryPage, 
  SupplierPage, 
  LocationPage,
  StaffPage
} from './pages';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'inventory' && <InventoryPage />}
      {activeTab === 'transaction' && <TransactionPage />}
      {activeTab === 'stocktaking' && <StocktakingPage />}
      {activeTab === 'master' && <MasterPage />}
      {activeTab === 'unit' && <UnitPage />}
      {activeTab === 'category' && <CategoryPage />}
      {activeTab === 'supplier' && <SupplierPage />}
      {activeTab === 'location' && <LocationPage />}
      {activeTab === 'staff' && <StaffPage />}
    </AppLayout>
  );
}

export default App;
