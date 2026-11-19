import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { AverageWagePage } from './AverageWagePage';

export function ScreenAverageWagePage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_AVERAGE_WAGE;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_AVERAGE_WAGE;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={navContext.activeTab === 'averageWage' ? 'averageWage' : screenConfig.tabs[0]?.id || 'averageWage'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>
      <AverageWagePage />
    </>
  );
}
