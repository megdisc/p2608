import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { OrganizationPage } from './OrganizationPage';
import { OfficePage } from './OfficePage';
import { OfficeServiceTypePage } from './OfficeServiceTypePage';
import { OfficeRewardPage } from './OfficeRewardPage';

export function ScreenFacilityPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_FACILITY;

  const renderContent = () => {
    switch (navContext.activeTab) {
      case 'organization':
        return <OrganizationPage />;
      case 'office':
        return <OfficePage />;
      case 'officeServiceType':
        return <OfficeServiceTypePage />;
      case 'officeReward':
        return <OfficeRewardPage />;
      default:
        return <OrganizationPage />;
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={navContext.activeTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
