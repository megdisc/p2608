import type { Tab } from '../../types';
import { useAuth, useOffice } from '../../contexts';
import { SYSTEM_NAME, SYSTEM_ID, PAGE_NAMES, BUTTON_LABELS, MENU_CATEGORIES } from '../../constants';

type ProjectSidebarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export function ProjectSidebar({ activeTab, setActiveTab }: ProjectSidebarProps) {
  const { logout, user } = useAuth();
  const { offices, selectedOfficeId, setSelectedOfficeId } = useOffice();

  return (
    <aside className="sidebar">
      <header className="header">
        <span className="system-id">{SYSTEM_ID}</span>
        <h1>{SYSTEM_NAME}</h1>
        <div className="sidebar-office-wrapper">
          <select
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            className="sidebar-office-select"
          >
            {offices.map((office) => (
              <option key={office.id} value={office.id} className="sidebar-office-option">
                {office.short_name || office.name}
              </option>
            ))}
          </select>
        </div>
      </header>
      
      <nav className="nav-menu">
        <div className="nav-section">
          <button 
            className={`nav-button ${['dashboard'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            {PAGE_NAMES.SCREEN_DASHBOARD}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.DAILY_RECORDS}</div>
          <button 
            className={`nav-button ${['screenProject', 'project', 'budgetPlanning', 'assigneeAllocation', 'progressRecord'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('progressRecord')}
          >
            {PAGE_NAMES.SCREEN_PROJECT}
          </button>
          <button 
            className={`nav-button ${['screenAccounting', 'accounting', 'screenExpenseLedger', 'expenseLedger', 'projectFinancialRecord', 'screenRewardAllocation', 'rewardAllocation'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('expenseLedger')}
          >
            {PAGE_NAMES.SCREEN_ACCOUNTING}
          </button>
          <button 
            className={`nav-button ${['screenSchedule', 'attendanceMonth', 'scheduleStaff', 'scheduleMember', 'scheduleDay', 'attendanceDay', 'screenCalendar', 'calendarMonth', 'screenAttendance', 'screenCalendarDailyReport', 'calendarDailyReportCalendar', 'calendarDailyReportDay'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('attendanceMonth')}
          >
            {PAGE_NAMES.SCREEN_SCHEDULE}
          </button>
          <button 
            className={`nav-button ${['screenDailyReport', 'staffAttendanceRecord', 'dailyWorkRecord', 'screenStaffDailyReport', 'screenDailyWork'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('dailyWorkRecord')}
          >
            {PAGE_NAMES.SCREEN_DAILY_REPORT}
          </button>
          <button 
            className={`nav-button ${['screenWageSummary', 'wageSummary'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('wageSummary')}
          >
            {PAGE_NAMES.SCREEN_WAGE_SUMMARY}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.REPORTS}</div>
          <button 
            className={`nav-button ${['screenProductionBusiness', 'financialSummary', 'projectFinancialSummary', 'financialRecord', 'screenFinance'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('financialSummary')}
          >
            {PAGE_NAMES.SCREEN_PRODUCTION_BUSINESS}
          </button>
          <button 
            className={`nav-button ${['screenAverageWage', 'averageWage'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('averageWage')}
          >
            {PAGE_NAMES.SCREEN_AVERAGE_WAGE}
          </button>
          <button 
            className={`nav-button ${['screenWelfareBusiness', 'welfareFinancialSummary'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('welfareFinancialSummary')}
          >
            {PAGE_NAMES.SCREEN_WELFARE_BUSINESS}
          </button>
          <button 
            className={`nav-button ${['screenServiceBilling', 'serviceBilling'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('serviceBilling')}
          >
            {PAGE_NAMES.SCREEN_SERVICE_BILLING}
          </button>
          <button 
            className={`nav-button ${['screenReserveReport', 'reserveSummary'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('reserveSummary')}
          >
            {PAGE_NAMES.SCREEN_RESERVE_REPORT}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.PEOPLE}</div>
          <button 
            className={`nav-button ${['screenUser', 'projectUser', 'memberRecipientCertificate', 'memberOffice', 'memberSchedule', 'skillEvaluation', 'baseWageAssignment'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('projectUser')}
          >
            {PAGE_NAMES.SCREEN_USER}
          </button>
          <button 
            className={`nav-button ${['screenStaff', 'staff', 'staffQualification', 'staffOffice', 'staffWorkStyle', 'staffSchedule'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            {PAGE_NAMES.SCREEN_STAFF}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.SETTINGS}</div>
          <button 
            className={`nav-button ${['screenWelfare', 'serviceType', 'qualification', 'staffRole', 'rewardItem', 'regionalGrade'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('serviceType')}
          >
            {PAGE_NAMES.SCREEN_WELFARE}
          </button>
          <button 
            className={`nav-button ${['screenFacility', 'organization', 'office', 'officeServiceType', 'officeReward'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            {PAGE_NAMES.SCREEN_FACILITY}
          </button>
          <button 
            className={`nav-button ${['screenClient', 'client'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            {PAGE_NAMES.SCREEN_CLIENT}
          </button>
          <button 
            className={`nav-button ${['screenSkill', 'skillCategory', 'skill', 'skillLevel'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('skill')}
          >
            {PAGE_NAMES.SCREEN_SKILL}
          </button>
          <button 
            className={`nav-button ${['screenWage', 'baseWage', 'allowance', 'deduction', 'closingDate'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('baseWage')}
          >
            {PAGE_NAMES.SCREEN_WAGE}
          </button>
          <button 
            className={`nav-button ${['screenSalary', 'salaryClosingDate'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('salaryClosingDate')}
          >
            {PAGE_NAMES.SCREEN_SALARY}
          </button>
          <button 
            className={`nav-button ${['screenReserve', 'reserveSetting', 'reserve'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('reserveSetting')}
          >
            {PAGE_NAMES.SCREEN_RESERVE}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.DEVELOPMENT}</div>
          <button 
            className={`nav-button ${['screenComposition'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('screenComposition')}
          >
            {PAGE_NAMES.TAB_SCREEN_COMPOSITION}
          </button>
          <button 
            className={`nav-button ${['tableComposition'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('tableComposition')}
          >
            {PAGE_NAMES.TAB_TABLE_COMPOSITION}
          </button>
        </div>
      </nav>

      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
        )}
        <button 
          className="sidebar-logout-btn"
          onClick={logout}
        >
          {BUTTON_LABELS.LOGOUT}
        </button>
      </div>
    </aside>
  );
}
