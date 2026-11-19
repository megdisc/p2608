import { useState, useCallback, useEffect } from 'react';
import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { getCurrentJSTDateOnly, getCurrentJSTMonth } from '../utils';
import { AttendanceDayPage } from './AttendanceDayPage';
import { AttendanceMonthPage } from './AttendanceMonthPage';

export function ScreenSchedulePage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_SCHEDULE;
  const displayTitle = screenConfig.screenName || PAGE_NAMES.SCREEN_SCHEDULE;

  // 画面表示時のデフォルト表示タブはカレンダータブとする
  useEffect(() => {
    if (
      navContext.activeTab === 'screenSchedule' ||
      navContext.activeTab === 'screenCalendar' ||
      navContext.activeTab === 'attendanceDay'
    ) {
      navContext.setActiveTab('attendanceMonth');
    }
  }, [navContext]);

  // 日付の状態管理（デフォルトは本日）
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());
  // 年月の状態管理（デフォルトは今月）
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  const handleDateChange = useCallback((date: string) => {
    setCurrentDate(date);
  }, []);

  // カレンダーの日付行クリックで日報画面へ遷移
  const handleSelectDateFromCalendar = useCallback(
    (_date: string) => {
      navContext.setActiveTab('dailyWorkRecord');
    },
    [navContext]
  );

  const activeTab = navContext.activeTab === 'scheduleMember'
    ? 'scheduleMember'
    : navContext.activeTab === 'scheduleStaff'
    ? 'scheduleStaff'
    : 'attendanceMonth';

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={activeTab}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      {activeTab === 'attendanceMonth' ? (
        <AttendanceMonthPage
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onSelectDate={handleSelectDateFromCalendar}
        />
      ) : activeTab === 'scheduleStaff' ? (
        <AttendanceDayPage
          key="staff"
          targetType="staff"
          currentDate={currentDate}
          onDateChange={handleDateChange}
        />
      ) : (
        <AttendanceDayPage
          key="member"
          targetType="member"
          currentDate={currentDate}
          onDateChange={handleDateChange}
        />
      )}
    </>
  );
}
