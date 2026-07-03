import type { Tab } from '../../types';
import { useAuth } from '../../contexts';
import { SYSTEM_NAME_PROJECT, SYSTEM_ID, MENU_CATEGORIES, MENU_SUBCATEGORIES, PAGE_NAMES, BUTTON_LABELS } from '../../constants';

type ProjectSidebarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export function ProjectSidebar({ activeTab, setActiveTab }: ProjectSidebarProps) {
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar">
      <header className="header">
        <span className="system-id">{SYSTEM_ID}</span>
        <h1>{SYSTEM_NAME_PROJECT}</h1>
      </header>
      
      <nav className="nav-menu">
        <div className="nav-section">
          <div className="nav-category">
            {MENU_CATEGORIES.AGGREGATION}
            <div className="nav-subcategory">{MENU_SUBCATEGORIES.AGGREGATION}</div>
          </div>
          <button 
            className={`nav-button ${activeTab === 'projectSummary' ? 'active' : ''}`}
            onClick={() => setActiveTab('projectSummary')}
          >
            {PAGE_NAMES.PROJECT_SUMMARY}
          </button>
          <button 
            className={`nav-button ${activeTab === 'assigneeSummary' ? 'active' : ''}`}
            onClick={() => setActiveTab('assigneeSummary')}
          >
            {PAGE_NAMES.ASSIGNEE_SUMMARY}
          </button>
          <button 
            className={`nav-button ${activeTab === 'wageSummary' ? 'active' : ''}`}
            onClick={() => setActiveTab('wageSummary')}
          >
            {PAGE_NAMES.WAGE_SUMMARY}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">
            {MENU_CATEGORIES.RECORDING}
            <div className="nav-subcategory">{MENU_SUBCATEGORIES.RECORDING}</div>
          </div>
          <button 
            className={`nav-button ${activeTab === 'skillEvaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('skillEvaluation')}
          >
            {PAGE_NAMES.SKILL_EVALUATION}
          </button>
          <button 
            className={`nav-button ${activeTab === 'baseWageAssignment' ? 'active' : ''}`}
            onClick={() => setActiveTab('baseWageAssignment')}
          >
            {PAGE_NAMES.BASE_WAGE_ASSIGNMENT}
          </button>
          <button 
            className={`nav-button ${activeTab === 'project' ? 'active' : ''}`}
            onClick={() => setActiveTab('project')}
          >
            {PAGE_NAMES.PROJECT_INFO}
          </button>
          <button 
            className={`nav-button ${activeTab === 'budgetPlanning' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgetPlanning')}
          >
            {PAGE_NAMES.BUDGET_PLANNING}
          </button>
          <button 
            className={`nav-button ${activeTab === 'assigneeAllocation' ? 'active' : ''}`}
            onClick={() => setActiveTab('assigneeAllocation')}
          >
            {PAGE_NAMES.ASSIGNEE_ALLOCATION}
          </button>
          <button 
            className={`nav-button ${activeTab === 'dailyWorkRecord' ? 'active' : ''}`}
            onClick={() => setActiveTab('dailyWorkRecord')}
          >
            {PAGE_NAMES.DAILY_WORK_RECORD}
          </button>
          <button 
            className={`nav-button ${activeTab === 'progressRecord' ? 'active' : ''}`}
            onClick={() => setActiveTab('progressRecord')}
          >
            {PAGE_NAMES.PROGRESS_RECORD}
          </button>
          <button 
            className={`nav-button ${activeTab === 'rewardAllocation' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewardAllocation')}
          >
            {PAGE_NAMES.REWARD_ALLOCATION}
          </button>
          <button 
            className={`nav-button ${activeTab === 'financialRecord' ? 'active' : ''}`}
            onClick={() => setActiveTab('financialRecord')}
          >
            {PAGE_NAMES.FINANCIAL_RECORD}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">
            {MENU_CATEGORIES.SETTINGS}
            <div className="nav-subcategory">{MENU_SUBCATEGORIES.SETTINGS}</div>
          </div>
          <button 
            className={`nav-button ${activeTab === 'projectUser' ? 'active' : ''}`}
            onClick={() => setActiveTab('projectUser')}
          >
            {PAGE_NAMES.PROJECT_USER}
          </button>
          <button 
            className={`nav-button ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            {PAGE_NAMES.STAFF}
          </button>
          <button 
            className={`nav-button ${activeTab === 'client' ? 'active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            {PAGE_NAMES.CLIENT}
          </button>
          <button 
            className={`nav-button ${activeTab === 'skill' ? 'active' : ''}`}
            onClick={() => setActiveTab('skill')}
          >
            {PAGE_NAMES.SKILL}
          </button>
          <button 
            className={`nav-button ${activeTab === 'skillLevel' ? 'active' : ''}`}
            onClick={() => setActiveTab('skillLevel')}
          >
            {PAGE_NAMES.SKILL_LEVEL}
          </button>
          <button 
            className={`nav-button ${activeTab === 'baseWage' ? 'active' : ''}`}
            onClick={() => setActiveTab('baseWage')}
          >
            {PAGE_NAMES.BASE_WAGE}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">
            画面構成
            <div className="nav-subcategory">検討中</div>
          </div>
          <button 
            className={`nav-button ${activeTab === 'screenProject' ? 'active' : ''}`}
            onClick={() => setActiveTab('screenProject')}
          >
            {PAGE_NAMES.SCREEN_PROJECT}
          </button>
          <button 
            className={`nav-button ${activeTab === 'screenUser' ? 'active' : ''}`}
            onClick={() => setActiveTab('screenUser')}
          >
            {PAGE_NAMES.SCREEN_USER}
          </button>
          <button 
            className={`nav-button ${activeTab === 'screenStaff' ? 'active' : ''}`}
            onClick={() => setActiveTab('screenStaff')}
          >
            {PAGE_NAMES.SCREEN_STAFF}
          </button>
          <button 
            className={`nav-button ${activeTab === 'screenClient' ? 'active' : ''}`}
            onClick={() => setActiveTab('screenClient')}
          >
            {PAGE_NAMES.SCREEN_CLIENT}
          </button>
          <button 
            className={`nav-button ${activeTab === 'screenFinance' ? 'active' : ''}`}
            onClick={() => setActiveTab('screenFinance')}
          >
            {PAGE_NAMES.SCREEN_FINANCE}
          </button>
          <button 
            className={`nav-button ${activeTab === 'screenSkill' ? 'active' : ''}`}
            onClick={() => setActiveTab('screenSkill')}
          >
            {PAGE_NAMES.SCREEN_SKILL}
          </button>
          <button 
            className={`nav-button ${activeTab === 'screenWage' ? 'active' : ''}`}
            onClick={() => setActiveTab('screenWage')}
          >
            {PAGE_NAMES.SCREEN_WAGE}
          </button>
        </div>
      </nav>

      <div style={{ marginTop: 'auto', padding: '40px 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {user && (
          <div style={{ color: '#cccccc', textAlign: 'center', lineHeight: '1.5' }}>
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)' }}>{user.name}</div>
            <div style={{ fontSize: 'var(--text-nano)', color: '#aaaaaa' }}>{user.role}</div>
          </div>
        )}
        <button 
          className="action-btn"
          onClick={logout}
          style={{ 
            background: 'transparent', 
            border: '1px solid #555555', 
            color: '#aaaaaa', 
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#444444';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#aaaaaa';
          }}
        >
          {BUTTON_LABELS.LOGOUT}
        </button>
      </div>
    </aside>
  );
}
