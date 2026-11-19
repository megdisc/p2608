import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { ServiceBillingPage } from './ServiceBillingPage';

export function ScreenServiceBillingPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_SERVICE_BILLING;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_SERVICE_BILLING;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab="serviceBilling"
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>
      <ServiceBillingPage />
    </>
  );
}
