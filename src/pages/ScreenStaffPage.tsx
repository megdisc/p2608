import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { StaffPage } from './StaffPage';
import { StaffQualificationPage } from './StaffQualificationPage';
import { StaffOfficePage } from './StaffOfficePage';

export function ScreenStaffPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_STAFF;

  const renderContent = () => {
    switch (navContext.activeTab) {
      case 'staff':
        return <StaffPage />;
      case 'staffQualification':
        return <StaffQualificationPage />;
      case 'staffOffice':
        return <StaffOfficePage />;
      default:
        return <StaffPage />;
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={navContext.activeTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
