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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
