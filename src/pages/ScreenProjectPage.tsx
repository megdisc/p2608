import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { ProjectPage } from './ProjectPage';
import { BudgetPlanningPage } from './BudgetPlanningPage';
import { AssigneeAllocationPage } from './AssigneeAllocationPage';
import { ProgressRecordPage } from './ProgressRecordPage';
import { RewardAllocationPage } from './RewardAllocationPage';
import { ProjectFinancialRecordPage } from './ProjectFinancialRecordPage';

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
        return <ProgressRecordPage />;
      case 'projectFinancialRecord':
        return <ProjectFinancialRecordPage />;
      case 'rewardAllocation':
        return <RewardAllocationPage />;
      default:
        return <ProgressRecordPage />;
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={currentTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
