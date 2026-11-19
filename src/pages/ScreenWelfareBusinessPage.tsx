import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { FinancialSummaryPage } from './FinancialSummaryPage';

export function ScreenWelfareBusinessPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_WELFARE_BUSINESS;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_WELFARE_BUSINESS;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={navContext.activeTab === 'welfareFinancialSummary' ? 'welfareFinancialSummary' : screenConfig.tabs[0]?.id || 'welfareFinancialSummary'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>
      <FinancialSummaryPage activityCategory="welfare" />
    </>
  );
}
