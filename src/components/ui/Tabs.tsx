import type { Tab } from '../../types';
import type { ScreenTabConfig } from '../../config';

type TabsProps = {
  tabs: ScreenTabConfig[];
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="tabs-container">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tab-pill ${isActive ? 'active' : ''}`.trim()}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
