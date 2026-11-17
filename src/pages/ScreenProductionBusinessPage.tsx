import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { FinancialSummaryPage } from './FinancialSummaryPage';
import { ProjectFinancialSummaryPage } from './ProjectFinancialSummaryPage';

export function ScreenProductionBusinessPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_PRODUCTION_BUSINESS;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_PRODUCTION_BUSINESS;

  const currentTab = navContext.activeTab === 'projectFinancialSummary'
    ? 'projectFinancialSummary'
    : 'financialSummary';

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
      {currentTab === 'projectFinancialSummary' ? (
        <ProjectFinancialSummaryPage />
      ) : (
        <FinancialSummaryPage activityCategory="production" />
      )}
    </>
  );
}
