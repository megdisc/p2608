import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SYSTEM_NAME_PROJECT, SYSTEM_ID, BUTTON_LABELS } from '../../constants';

type ProjectAppLayoutProps = {
  children: ReactNode;
};

export function ProjectAppLayout({ children }: ProjectAppLayoutProps) {
  const { logout, user } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <header className="header">
          <span className="system-id">{SYSTEM_ID}</span>
          <h1>{SYSTEM_NAME_PROJECT}</h1>
        </header>

        <nav className="nav-menu">
          <div className="nav-section">
            <div className="nav-category">メインメニュー</div>
            <button className="nav-button active">
              ダッシュボード
            </button>
            <button className="nav-button">
              案件一覧
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
      <main className="main-content">
        <div className="page-transition">
          {children}
        </div>
      </main>
    </div>
  );
}
