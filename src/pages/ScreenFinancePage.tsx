
import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { FinancialSummaryPage } from './FinancialSummaryPage';
import { WageSummaryPage } from './WageSummaryPage';
import { ProjectFinancialSummaryPage } from './ProjectFinancialSummaryPage';
import { AverageWagePage } from './AverageWagePage';

export function ScreenFinancePage() {
  const navContext = useNavigation();
  const currentTab = (navContext.activeTab === 'screenFinance' || navContext.activeTab === 'financialRecord')
    ? 'wageSummary'
    : navContext.activeTab;
  const screenConfig = getScreenConfigForTab(currentTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_FINANCE;

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
      
      {currentTab === 'averageWage' ? (
        <AverageWagePage />
      ) : currentTab === 'projectFinancialSummary' ? (
        <ProjectFinancialSummaryPage />
      ) : currentTab === 'welfareFinancialSummary' ? (
        <FinancialSummaryPage activityCategory="welfare" />
      ) : currentTab === 'financialSummary' ? (
        <FinancialSummaryPage activityCategory="production" />
      ) : (
        <WageSummaryPage />
      )}
    </>
  );
}
