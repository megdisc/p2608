import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { StaffAttendanceRecordPage } from './StaffAttendanceRecordPage';

export function ScreenStaffDailyReportPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_STAFF_DAILY_REPORT;

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
      
      <StaffAttendanceRecordPage />
    </>
  );
}
