import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { ProjectFinancialRecordPage } from './ProjectFinancialRecordPage';
import { RewardAllocationPage } from './RewardAllocationPage';

export function ScreenAccountingPage() {
  const navContext = useNavigation();
  const currentTab = (
    navContext.activeTab === 'screenAccounting' ||
    navContext.activeTab === 'accounting' ||
    navContext.activeTab === 'screenExpenseLedger' ||
    navContext.activeTab === 'projectFinancialRecord'
  )
    ? 'expenseLedger'
    : (navContext.activeTab === 'screenRewardAllocation')
      ? 'rewardAllocation'
      : navContext.activeTab;

  const screenConfig = getScreenConfigForTab(currentTab as any);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_ACCOUNTING;

  const renderContent = () => {
    switch (currentTab) {
      case 'rewardAllocation':
        return <RewardAllocationPage />;
      case 'expenseLedger':
      default:
        return <ProjectFinancialRecordPage />;
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={currentTab}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      {renderContent()}
    </>
  );
}
