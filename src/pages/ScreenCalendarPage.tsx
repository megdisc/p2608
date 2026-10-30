import { useState, useCallback, useEffect } from 'react';
import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { getCurrentJSTMonth } from '../utils';
import { AttendanceMonthPage } from './AttendanceMonthPage';

export function ScreenCalendarPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_CALENDAR;
  const displayTitle = screenConfig.screenName || PAGE_NAMES.SCREEN_CALENDAR || 'カレンダー';

  // 画面表示時のデフォルト表示タブはカレンダータブとする
  useEffect(() => {
    if (navContext.activeTab === 'screenCalendar') {
      navContext.setActiveTab('attendanceMonth');
    }
  }, [navContext]);

  // 年月の状態管理（デフォルトは今月）
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  // カレンダーの日付行クリックで日報画面へ遷移
  const handleSelectDateFromCalendar = useCallback(
    (_date: string) => {
      // 日報画面の利用者タブへ遷移
      navContext.setActiveTab('dailyWorkRecord');
    },
    [navContext]
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab="attendanceMonth"
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      <AttendanceMonthPage
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onSelectDate={handleSelectDateFromCalendar}
      />
    </>
  );
}

