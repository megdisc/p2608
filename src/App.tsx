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
  ScreenWelfarePage,
  ScreenFacilityPage,
  ScreenSkillPage,
  ScreenWagePage,
  ScreenReservePage,
  ScreenDailyReportPage,
  ScreenCalendarPage,
  ScreenSchedulePage,
  LoginPage,
  DashboardPage
} from './pages';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { OfficeProvider } from './contexts/OfficeContext';
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
    <OfficeProvider>
      <NavigationProvider activeTab={activeTab} setActiveTab={setActiveTab}>
        <AlertProvider>
          <ProjectAppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            {['dashboard'].includes(activeTab) ? (
              <DashboardPage />
            ) : ['screenCalendar', 'calendarMonth', 'attendanceMonth'].includes(activeTab) ? (
              <ScreenCalendarPage />
            ) : ['screenSchedule', 'scheduleStaff', 'scheduleMember', 'scheduleDay', 'attendanceDay', 'screenAttendance'].includes(activeTab) ? (
              <ScreenSchedulePage />
            ) : ['screenDailyReport', 'staffAttendanceRecord', 'dailyWorkRecord', 'screenStaffDailyReport', 'screenDailyWork'].includes(activeTab) ? (
              <ScreenDailyReportPage />
            ) : ['projectUser', 'memberRecipientCertificate', 'memberOffice', 'memberSchedule', 'skillEvaluation', 'baseWageAssignment', 'screenUser'].includes(activeTab) ? (
              <ScreenUserPage />
            ) : ['staff', 'screenStaff', 'staffQualification', 'staffOffice', 'staffWorkStyle', 'staffSchedule'].includes(activeTab) ? (
              <ScreenStaffPage />
            ) : ['client', 'screenClient'].includes(activeTab) ? (
              <ScreenClientPage />
            ) : ['screenWelfare', 'serviceType', 'qualification', 'rewardItem', 'regionalGrade'].includes(activeTab) ? (
              <ScreenWelfarePage />
            ) : ['screenFacility', 'organization', 'office', 'serviceScheme', 'officeServiceType', 'officeReward'].includes(activeTab) ? (
              <ScreenFacilityPage />
            ) : ['skillCategory', 'skill', 'skillLevel', 'screenSkill'].includes(activeTab) ? (
              <ScreenSkillPage />
            ) : ['baseWage', 'allowance', 'deduction', 'screenWage'].includes(activeTab) ? (
              <ScreenWagePage />
            ) : ['reserveSetting', 'reserve', 'screenReserve'].includes(activeTab) ? (
              <ScreenReservePage />
            ) : ['project', 'budgetPlanning', 'assigneeAllocation', 'progressRecord', 'projectFinancialRecord', 'rewardAllocation', 'assigneeSummary', 'screenProject'].includes(activeTab) ? (
              <ScreenProjectPage />
            ) : ['financialRecord', 'financialSummary', 'projectFinancialSummary', 'welfareFinancialSummary', 'wageSummary', 'averageWage', 'screenFinance'].includes(activeTab) ? (
              <ScreenFinancePage />
            ) : ['screenComposition', 'tableComposition'].includes(activeTab) ? (
              <ScreenCompositionPage />
            ) : (
              <div style={{ padding: '32px' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>{MESSAGES.PAGE_UNDER_CONSTRUCTION}</p>
              </div>
            )}
          </ProjectAppLayout>
        </AlertProvider>
      </NavigationProvider>
    </OfficeProvider>
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
