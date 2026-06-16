import type { Tab } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
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
          {/* 追加予定 */}
        </div>

        <div className="nav-section">
          <div className="nav-category">
            {MENU_CATEGORIES.RECORDING}
            <div className="nav-subcategory">{MENU_SUBCATEGORIES.RECORDING}</div>
          </div>
          <button 
            className={`nav-button ${activeTab === 'dailyWorkRecord' ? 'active' : ''}`}
            onClick={() => setActiveTab('dailyWorkRecord')}
          >
            {PAGE_NAMES.DAILY_WORK_RECORD}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">
            {MENU_CATEGORIES.INFORMATION}
            <div className="nav-subcategory">{MENU_SUBCATEGORIES.INFORMATION}</div>
          </div>
          <button 
            className={`nav-button ${activeTab === 'project' ? 'active' : ''}`}
            onClick={() => setActiveTab('project')}
          >
            {PAGE_NAMES.PROJECT_INFO}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">
            {MENU_CATEGORIES.SETTINGS}
            <div className="nav-subcategory">{MENU_SUBCATEGORIES.SETTINGS}</div>
          </div>
          <button 
            className={`nav-button ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            {PAGE_NAMES.STAFF}
          </button>
          <button 
            className={`nav-button ${activeTab === 'projectUser' ? 'active' : ''}`}
            onClick={() => setActiveTab('projectUser')}
          >
            {PAGE_NAMES.PROJECT_USER}
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
        </div>
      </nav>

      <div style={{ marginTop: 'auto', padding: '40px 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {user && (
          <div style={{ color: '#cccccc', fontSize: '13px', textAlign: 'center', lineHeight: '1.5' }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: '#aaaaaa' }}>{user.role}</div>
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
