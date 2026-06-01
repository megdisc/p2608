import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { Tab } from '../../types';

type AppLayoutProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  children: ReactNode;
};

export function AppLayout({ activeTab, setActiveTab, children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
