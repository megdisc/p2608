import type { ReactNode } from 'react';
import type { Tab } from '../../types';
import { ProjectSidebar } from './ProjectSidebar';

type ProjectAppLayoutProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  children: ReactNode;
};

export function ProjectAppLayout({ activeTab, setActiveTab, children }: ProjectAppLayoutProps) {
  return (
    <div className="app-layout">
      <ProjectSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <div className="page-transition">
          {children}
        </div>
      </main>
    </div>
  );
}
