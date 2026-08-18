import { ProjectAppLayout } from './components';
import { useState, useEffect, useRef } from 'react';
import './index.css';
import type { Tab } from './types';
import {
  ScreenCompositionPage,
  ScreenFinancePage,
  ScreenProjectPage,
  ScreenUserPage,
  ScreenStaffPage,
  ScreenClientPage,
  ScreenSkillPage,
  ScreenWagePage,
  ScreenDailyWorkPage,
  LoginPage,
  DashboardPage
} from './pages';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { MESSAGES } from './constants';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('activeTab');
    if (saved) return saved as Tab;
    return 'dashboard';
  });

  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    if (!prevAuth.current && isAuthenticated) {
      setActiveTab('dashboard');
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <NavigationProvider activeTab={activeTab} setActiveTab={setActiveTab}>
      <AlertProvider>
        <ProjectAppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {['dashboard'].includes(activeTab) ? (
            <DashboardPage />
          ) : ['dailyWorkRecord', 'screenDailyWork'].includes(activeTab) ? (
            <ScreenDailyWorkPage />
          ) : ['projectUser', 'skillEvaluation', 'baseWageAssignment', 'screenUser'].includes(activeTab) ? (
            <ScreenUserPage />
          ) : ['staff', 'screenStaff'].includes(activeTab) ? (
            <ScreenStaffPage />
          ) : ['client', 'screenClient'].includes(activeTab) ? (
            <ScreenClientPage />
          ) : ['skill', 'skillLevel', 'screenSkill'].includes(activeTab) ? (
            <ScreenSkillPage />
          ) : ['baseWage', 'screenWage'].includes(activeTab) ? (
            <ScreenWagePage />
          ) : ['project', 'budgetPlanning', 'assigneeAllocation', 'progressRecord', 'rewardAllocation', 'projectFinancialRecord', 'screenProject'].includes(activeTab) ? (
            <ScreenProjectPage />
          ) : ['financialRecord', 'financialSummary', 'welfareFinancialSummary', 'wageSummary', 'screenFinance'].includes(activeTab) ? (
            <ScreenFinancePage />
          ) : ['screenComposition', 'tableComposition', 'mainFeatures', 'workflow'].includes(activeTab) ? (
            <ScreenCompositionPage />
          ) : (
            <div style={{ padding: '32px' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>{MESSAGES.PAGE_UNDER_CONSTRUCTION}</p>
            </div>
          )}
        </ProjectAppLayout>
      </AlertProvider>
    </NavigationProvider>
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
