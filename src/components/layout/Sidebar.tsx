import type { Tab } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { SYSTEM_NAME, SYSTEM_ID, MENU_CATEGORIES, PAGE_NAMES, BUTTON_LABELS } from '../../constants';

type SidebarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar">
      <header className="header">
        <h1>{SYSTEM_NAME}</h1>
        <span className="system-id">{SYSTEM_ID}</span>
      </header>
      
      <nav className="nav-menu">
        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.AGGREGATION}</div>
          <button 
            className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            {PAGE_NAMES.INVENTORY}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.RECORDING}</div>
          <button 
            className={`nav-button ${activeTab === 'transaction' ? 'active' : ''}`}
            onClick={() => setActiveTab('transaction')}
          >
            {PAGE_NAMES.TRANSACTION}
          </button>
          <button 
            className={`nav-button ${activeTab === 'stocktaking' ? 'active' : ''}`}
            onClick={() => setActiveTab('stocktaking')}
          >
            {PAGE_NAMES.STOCKTAKING}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">{MENU_CATEGORIES.SETTINGS}</div>
          <button 
            className={`nav-button ${activeTab === 'master' ? 'active' : ''}`}
            onClick={() => setActiveTab('master')}
          >
            {PAGE_NAMES.MASTER}
          </button>
          <button 
            className={`nav-button ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => setActiveTab('category')}
          >
            {PAGE_NAMES.CATEGORY}
          </button>
          <button 
            className={`nav-button ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            {PAGE_NAMES.LOCATION}
          </button>
          <button 
            className={`nav-button ${activeTab === 'supplier' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplier')}
          >
            {PAGE_NAMES.SUPPLIER}
          </button>
          <button 
            className={`nav-button ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            {PAGE_NAMES.STAFF}
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
