import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { ProjectPage } from './ProjectPage';
import { BudgetPlanningPage } from './BudgetPlanningPage';
import { AssigneeAllocationPage } from './AssigneeAllocationPage';
import { ProgressRecordPage } from './ProgressRecordPage';

export function ScreenProjectPage() {
  const navContext = useNavigation();
  const currentTab = navContext.activeTab === 'screenProject' ? 'progressRecord' : navContext.activeTab;
  const screenConfig = getScreenConfigForTab(currentTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_PROJECT;

  const renderContent = () => {
    switch (currentTab) {
      case 'project':
        return <ProjectPage />;
      case 'budgetPlanning':
        return <BudgetPlanningPage />;
      case 'assigneeAllocation':
        return <AssigneeAllocationPage />;
      case 'progressRecord':
      default:
        return <ProgressRecordPage />;
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={currentTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
