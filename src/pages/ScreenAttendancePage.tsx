import { useState, useCallback, useEffect } from 'react';
import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { getCurrentJSTDateOnly, getCurrentJSTMonth } from '../utils';
import { AttendanceMonthPage } from './AttendanceMonthPage';
import { AttendanceDayPage } from './AttendanceDayPage';

export function ScreenAttendancePage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_ATTENDANCE;
  const displayTitle = screenConfig.screenName || PAGE_NAMES.SCREEN_ATTENDANCE;

  // 画面表示時のデフォルト表示タブは月タブとする
  useEffect(() => {
    if (navContext.activeTab === 'screenAttendance') {
      navContext.setActiveTab('attendanceMonth');
    }
  }, [navContext]);

  // 日付・年月の共通状態管理（デフォルトは本日/今月）
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  // 日付変更時に年月も連動
  const handleDateChange = useCallback((date: string) => {
    setCurrentDate(date);
    if (date && date.length >= 7) {
      setCurrentMonth(date.substring(0, 7));
    }
  }, []);

  // 月タブの日付行クリックで日タブへ遷移
  const handleSelectDateFromMonth = useCallback(
    (date: string) => {
      handleDateChange(date);
      navContext.setActiveTab('attendanceDay');
    },
    [handleDateChange, navContext]
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={navContext.activeTab === 'attendanceDay' ? 'attendanceDay' : 'attendanceMonth'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      {navContext.activeTab === 'attendanceDay' ? (
        <AttendanceDayPage
          currentDate={currentDate}
          onDateChange={handleDateChange}
        />
      ) : (
        <AttendanceMonthPage
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onSelectDate={handleSelectDateFromMonth}
        />
      )}
    </>
  );
}

