import { AppLayout, ProjectAppLayout } from './components';
import { useState, useEffect, useRef } from 'react';
import './index.css';
import type { Tab } from './types';
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
  SkillPage,
  ClientPage,
  DailyWorkRecordPage,
  ProgressRecordPage,
  RewardAllocationPage,
  ProjectSummaryPage,
  AssigneeSummaryPage,
  WageSummaryPage,
  BudgetPlanningPage,
  AssigneeAllocationPage,
  BaseWagePage,
  BaseWageAssignmentPage
} from './pages';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MESSAGES } from './constants';

function AppContent() {
  const { isAuthenticated, activeSystem } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('activeTab');
    if (saved) return saved as Tab;
    return activeSystem === 'project' ? 'projectSummary' : 'inventory';
  });

  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    if (!prevAuth.current && isAuthenticated) {
      if (activeSystem === 'inventory') {
        setActiveTab('inventory');
      } else if (activeSystem === 'project') {
        setActiveTab('projectSummary');
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
          ) : activeTab === 'dailyWorkRecord' ? (
            <DailyWorkRecordPage />
          ) : activeTab === 'progressRecord' ? (
            <ProgressRecordPage />
          ) : activeTab === 'client' ? (
            <ClientPage />
          ) : activeTab === 'project' ? (
            <ProjectPage />
          ) : activeTab === 'staff' ? (
            <StaffPage />
          ) : activeTab === 'rewardAllocation' ? (
            <RewardAllocationPage />
          ) : activeTab === 'projectSummary' ? (
            <ProjectSummaryPage />
          ) : activeTab === 'assigneeSummary' ? (
            <AssigneeSummaryPage />
          ) : activeTab === 'wageSummary' ? (
            <WageSummaryPage />
          ) : activeTab === 'budgetPlanning' ? (
            <BudgetPlanningPage />
          ) : activeTab === 'assigneeAllocation' ? (
            <AssigneeAllocationPage />
          ) : activeTab === 'baseWage' ? (
            <BaseWagePage />
          ) : activeTab === 'baseWageAssignment' ? (
            <BaseWageAssignmentPage />
          ) : (
            <div style={{ padding: '32px' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>{MESSAGES.PAGE_UNDER_CONSTRUCTION}</p>
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
