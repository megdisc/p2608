import { useState, useCallback, useEffect } from 'react';
import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { getCurrentJSTDateOnly } from '../utils';
import { AttendanceDayPage } from './AttendanceDayPage';

export function ScreenSchedulePage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_SCHEDULE;
  const displayTitle = screenConfig.screenName || PAGE_NAMES.SCREEN_SCHEDULE || '予定';

  // 画面表示時のデフォルト表示タブは職員タブとする
  useEffect(() => {
    if (navContext.activeTab === 'screenSchedule' || navContext.activeTab === 'attendanceDay') {
      navContext.setActiveTab('scheduleStaff');
    }
  }, [navContext]);

  // 日付の状態管理（デフォルトは本日）
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  const handleDateChange = useCallback((date: string) => {
    setCurrentDate(date);
  }, []);

  const activeTab = navContext.activeTab === 'scheduleMember' ? 'scheduleMember' : 'scheduleStaff';
  const targetType = activeTab === 'scheduleMember' ? 'member' : 'staff';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={activeTab}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      <AttendanceDayPage
        key={targetType}
        targetType={targetType}
        currentDate={currentDate}
        onDateChange={handleDateChange}
      />
    </>
  );
}

