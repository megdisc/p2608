import type { Tab } from '../../types';
import { useAuth } from '../../contexts';
import { SYSTEM_NAME, SYSTEM_ID, PAGE_NAMES, BUTTON_LABELS } from '../../constants';

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
        <h1>{SYSTEM_NAME}</h1>
      </header>
      
      <nav className="nav-menu">
        <div className="nav-section">

          <button 
            className={`nav-button ${['screenFinance', 'financialRecord', 'financialSummary', 'wageSummary'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('financialSummary')}
          >
            {PAGE_NAMES.SCREEN_FINANCE}
          </button>
          <button 
            className={`nav-button ${['screenProject', 'project', 'budgetPlanning', 'assigneeAllocation', 'progressRecord', 'rewardAllocation'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('progressRecord')}
          >
            {PAGE_NAMES.SCREEN_PROJECT}
          </button>
          <button 
            className={`nav-button ${['screenUser', 'projectUser', 'skillEvaluation', 'baseWageAssignment', 'dailyWorkRecord', 'assigneeSummary'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('dailyWorkRecord')}
          >
            {PAGE_NAMES.SCREEN_USER}
          </button>
          <button 
            className={`nav-button ${['screenStaff', 'staff'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            {PAGE_NAMES.SCREEN_STAFF}
          </button>
          <button 
            className={`nav-button ${['screenClient', 'client'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            {PAGE_NAMES.SCREEN_CLIENT}
          </button>
          <button 
            className={`nav-button ${['screenSkill', 'skill', 'skillLevel'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('skill')}
          >
            {PAGE_NAMES.SCREEN_SKILL}
          </button>
          <button 
            className={`nav-button ${['screenWage', 'baseWage'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('baseWage')}
          >
            {PAGE_NAMES.SCREEN_WAGE}
          </button>
          <button 
            className={`nav-button ${['screenComposition', 'tableComposition'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('screenComposition')}
          >
            システム構成（開発用）
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
