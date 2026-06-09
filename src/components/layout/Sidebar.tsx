import type { Tab } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

type SidebarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar">
      <header className="header">
        <h1>在庫管理システム</h1>
        <span className="system-id">p2608</span>
      </header>
      
      <nav className="nav-menu">
        <div className="nav-section">
          <div className="nav-category">集計系</div>
          <button 
            className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            在庫集計
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">記録系</div>
          <button 
            className={`nav-button ${activeTab === 'transaction' ? 'active' : ''}`}
            onClick={() => setActiveTab('transaction')}
          >
            受入・払出記録
          </button>
          <button 
            className={`nav-button ${activeTab === 'stocktaking' ? 'active' : ''}`}
            onClick={() => setActiveTab('stocktaking')}
          >
            棚卸記録
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-category">設定系</div>
          <button 
            className={`nav-button ${activeTab === 'master' ? 'active' : ''}`}
            onClick={() => setActiveTab('master')}
          >
            品目設定
          </button>
          <button 
            className={`nav-button ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => setActiveTab('category')}
          >
            カテゴリ設定
          </button>
          <button 
            className={`nav-button ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            保管場所設定
          </button>
          <button 
            className={`nav-button ${activeTab === 'supplier' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplier')}
          >
            仕入先設定
          </button>
          <button 
            className={`nav-button ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            スタッフ設定
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
          ログアウト
        </button>
      </div>
    </aside>
  );
}
