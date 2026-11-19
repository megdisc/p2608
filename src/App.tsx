import { ProjectAppLayout } from './components';
import { useState, useEffect, useRef } from 'react';
import './index.css';
import type { Tab } from './types';
import {
  ScreenCompositionPage,
  ScreenAverageWagePage,
  ScreenProductionBusinessPage,
  ScreenWelfareBusinessPage,
  ScreenReserveSummaryPage,
  ScreenServiceBillingPage,
  ScreenProjectPage,
  ScreenUserPage,
  ScreenStaffPage,
  ScreenClientPage,
  ScreenWelfarePage,
  ScreenFacilityPage,
  ScreenSkillPage,
  ScreenWagePage,
  ScreenSalaryPage,
  ScreenReservePage,
  ScreenAccountingPage,
  ScreenDailyReportPage,
  ScreenSchedulePage,
  ScreenWageSummaryPage,
  LoginPage,
  DashboardPage
} from './pages';
import {
  AlertProvider,
  AuthProvider,
  useAuth,
  NavigationProvider,
  OfficeProvider
} from './contexts';
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
            ) : ['screenSchedule', 'scheduleStaff', 'scheduleMember', 'scheduleDay', 'attendanceDay', 'screenAttendance', 'screenCalendar', 'calendarMonth', 'attendanceMonth', 'screenCalendarDailyReport', 'calendarDailyReportCalendar', 'calendarDailyReportDay'].includes(activeTab) ? (
              <ScreenSchedulePage />
            ) : ['screenDailyReport', 'staffAttendanceRecord', 'dailyWorkRecord', 'screenStaffDailyReport', 'screenDailyWork'].includes(activeTab) ? (
              <ScreenDailyReportPage />
            ) : ['projectUser', 'memberRecipientCertificate', 'memberOffice', 'memberSchedule', 'skillEvaluation', 'baseWageAssignment', 'screenUser'].includes(activeTab) ? (
              <ScreenUserPage />
            ) : ['staff', 'screenStaff', 'staffQualification', 'staffOffice', 'staffWorkStyle', 'staffSchedule'].includes(activeTab) ? (
              <ScreenStaffPage />
            ) : ['client', 'screenClient'].includes(activeTab) ? (
              <ScreenClientPage />
            ) : ['screenWelfare', 'serviceType', 'qualification', 'staffRole', 'rewardItem', 'regionalGrade'].includes(activeTab) ? (
              <ScreenWelfarePage />
            ) : ['screenFacility', 'organization', 'office', 'serviceScheme', 'officeServiceType', 'officeReward'].includes(activeTab) ? (
              <ScreenFacilityPage />
            ) : ['skillCategory', 'skill', 'skillLevel', 'screenSkill'].includes(activeTab) ? (
              <ScreenSkillPage />
            ) : ['baseWage', 'allowance', 'deduction', 'closingDate', 'screenWage'].includes(activeTab) ? (
              <ScreenWagePage />
            ) : ['salaryClosingDate', 'screenSalary'].includes(activeTab) ? (
              <ScreenSalaryPage />
            ) : ['reserveSetting', 'reserve', 'screenReserve'].includes(activeTab) ? (
              <ScreenReservePage />
            ) : ['project', 'budgetPlanning', 'assigneeAllocation', 'progressRecord', 'assigneeSummary', 'screenProject'].includes(activeTab) ? (
              <ScreenProjectPage />
            ) : ['screenAccounting', 'accounting', 'screenExpenseLedger', 'expenseLedger', 'projectFinancialRecord', 'screenRewardAllocation', 'rewardAllocation'].includes(activeTab) ? (
              <ScreenAccountingPage />
            ) : ['screenWageSummary', 'wageSummary'].includes(activeTab) ? (
              <ScreenWageSummaryPage />
            ) : ['screenAverageWage', 'averageWage'].includes(activeTab) ? (
              <ScreenAverageWagePage />
            ) : ['screenServiceBilling', 'serviceBilling'].includes(activeTab) ? (
              <ScreenServiceBillingPage />
            ) : ['screenProductionBusiness', 'financialSummary', 'projectFinancialSummary', 'financialRecord', 'screenFinance'].includes(activeTab) ? (
              <ScreenProductionBusinessPage />
            ) : ['screenWelfareBusiness', 'welfareFinancialSummary'].includes(activeTab) ? (
              <ScreenWelfareBusinessPage />
            ) : ['screenReserveReport', 'reserveSummary'].includes(activeTab) ? (
              <ScreenReserveSummaryPage />
            ) : ['screenComposition', 'tableComposition'].includes(activeTab) ? (
              <ScreenCompositionPage />
            ) : (
              <div className="under-construction">
                <p>{MESSAGES.PAGE_UNDER_CONSTRUCTION}</p>
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
