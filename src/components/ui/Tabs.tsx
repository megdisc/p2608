import type { Tab } from '../../types';
import type { ScreenTabConfig } from '../../constants';

type TabsProps = {
  tabs: ScreenTabConfig[];
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '8px 16px',
            background: activeTab === tab.id ? 'var(--color-bg-inverse)' : 'transparent',
            color: activeTab === tab.id ? 'var(--color-text-inverse)' : 'var(--color-text-main)',
            border: `1px solid ${activeTab === tab.id ? 'var(--color-bg-inverse)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: 'var(--text-caption)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = 'var(--color-bg-subtle)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
