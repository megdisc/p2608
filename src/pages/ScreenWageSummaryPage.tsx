import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { WageSummaryPage } from './WageSummaryPage';

export function ScreenWageSummaryPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_WAGE_SUMMARY;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_WAGE_SUMMARY;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab="wageSummary"
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      <WageSummaryPage />
    </>
  );
}

