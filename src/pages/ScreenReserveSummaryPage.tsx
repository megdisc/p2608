import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { ReserveSummaryPage } from './ReserveSummaryPage';

export function ScreenReserveSummaryPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_RESERVE_REPORT;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_RESERVE_REPORT;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={navContext.activeTab === 'reserveSummary' ? 'reserveSummary' : screenConfig.tabs[0]?.id || 'reserveSummary'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>
      <ReserveSummaryPage />
    </>
  );
}
