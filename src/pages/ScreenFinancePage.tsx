import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { FinancialSummaryPage } from './FinancialSummaryPage';
import { ProjectFinancialSummaryPage } from './ProjectFinancialSummaryPage';
import { AverageWagePage } from './AverageWagePage';

export function ScreenFinancePage() {
  const navContext = useNavigation();
  const currentTab = (navContext.activeTab === 'screenFinance' || navContext.activeTab === 'financialRecord' || navContext.activeTab === 'wageSummary')
    ? 'averageWage'
    : navContext.activeTab;
  const screenConfig = getScreenConfigForTab(currentTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_FINANCE;

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
      
      {currentTab === 'projectFinancialSummary' ? (
        <ProjectFinancialSummaryPage />
      ) : currentTab === 'welfareFinancialSummary' ? (
        <FinancialSummaryPage activityCategory="welfare" />
      ) : currentTab === 'financialSummary' ? (
        <FinancialSummaryPage activityCategory="production" />
      ) : (
        <AverageWagePage />
      )}
    </>
  );
}
