import type { Tab } from '../../types';
import { useAuth, useOffice } from '../../contexts';
import { SYSTEM_NAME, SYSTEM_ID, PAGE_NAMES, BUTTON_LABELS } from '../../constants';

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
        <div style={{ marginTop: '12px', width: '100%', padding: '0 4px' }}>
          <select
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#2a2d34',
              color: 'var(--color-text-inverse)',
              border: '1px solid #444444',
              fontSize: 'var(--text-caption)',
              fontWeight: 'var(--weight-heading)',
              fontFamily: 'inherit',
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          >
            {offices.map((office) => (
              <option key={office.id} value={office.id} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
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
          <button 
            className={`nav-button ${['screenDailyWork', 'dailyWorkRecord'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('dailyWorkRecord')}
          >
            {PAGE_NAMES.SCREEN_DAILY_WORK}
          </button>
          <button 
            className={`nav-button ${['screenProject', 'project', 'budgetPlanning', 'assigneeAllocation', 'progressRecord', 'projectFinancialRecord', 'rewardAllocation'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('progressRecord')}
          >
            {PAGE_NAMES.SCREEN_PROJECT}
          </button>
          <button 
            className={`nav-button ${['screenFinance', 'financialRecord', 'financialSummary', 'projectFinancialSummary', 'welfareFinancialSummary', 'wageSummary', 'averageWage'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('wageSummary')}
          >
            {PAGE_NAMES.SCREEN_FINANCE}
          </button>
          <button 
            className={`nav-button ${['screenUser', 'projectUser', 'skillEvaluation', 'baseWageAssignment'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('projectUser')}
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
            className={`nav-button ${['screenWelfare', 'serviceType', 'qualification', 'rewardItem'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('serviceType')}
          >
            {PAGE_NAMES.SCREEN_WELFARE}
          </button>
          <button 
            className={`nav-button ${['screenFacility', 'organization', 'office'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            {PAGE_NAMES.SCREEN_FACILITY}
          </button>
          <button 
            className={`nav-button ${['screenSkill', 'skill', 'skillLevel'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('skill')}
          >
            {PAGE_NAMES.SCREEN_SKILL}
          </button>
          <button 
            className={`nav-button ${['screenWage', 'baseWage', 'allowance', 'deduction'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('baseWage')}
          >
            {PAGE_NAMES.SCREEN_WAGE}
          </button>
          <button 
            className={`nav-button ${['screenReserve', 'reserveSetting', 'reserve'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setActiveTab('reserveSetting')}
          >
            {PAGE_NAMES.SCREEN_RESERVE}
          </button>
          <button 
            className={`nav-button ${['screenComposition', 'tableComposition', 'mainFeatures', 'workflow'].includes(activeTab) ? 'active' : ''}`}
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
