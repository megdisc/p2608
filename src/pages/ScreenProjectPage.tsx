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
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_PROJECT;

  const renderContent = () => {
    switch (navContext.activeTab) {
      case 'project':
        return <ProjectPage />;
      case 'budgetPlanning':
        return <BudgetPlanningPage />;
      case 'assigneeAllocation':
        return <AssigneeAllocationPage />;
      case 'projectFinancialRecord':
        return <ProjectFinancialRecordPage />;
      case 'progressRecord':
        return <ProgressRecordPage />;
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
            <Tabs tabs={screenConfig.tabs} activeTab={navContext.activeTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
