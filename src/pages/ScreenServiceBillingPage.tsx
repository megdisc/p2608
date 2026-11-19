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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
