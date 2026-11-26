import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { ServiceProvisionSystemPage } from './ServiceProvisionSystemPage';

export function ScreenServiceProvisionSystemPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_SERVICE_PROVISION_SYSTEM;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_SERVICE_PROVISION_SYSTEM;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={navContext.activeTab === 'serviceProvisionSystem' ? 'serviceProvisionSystem' : screenConfig.tabs[0]?.id || 'serviceProvisionSystem'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>
      <ServiceProvisionSystemPage />
    </>
  );
}
