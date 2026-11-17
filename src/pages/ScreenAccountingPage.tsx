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
  const displayTitle = screenConfig ? screenConfig.screenName : (PAGE_NAMES.SCREEN_ACCOUNTING || '会計');

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
