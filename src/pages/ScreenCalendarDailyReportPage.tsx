import { useState, useCallback, useEffect } from 'react';
import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation, useAlert } from '../contexts';
import { Tabs } from '../components/ui';
import { getCurrentJSTDateOnly, getCurrentJSTMonth } from '../utils';
import { useDailyConfirmation } from '../hooks';
import { CalendarDailyReportCalendarPage } from './CalendarDailyReportCalendarPage';
import { CalendarDailyReportDayPage } from './CalendarDailyReportDayPage';

export function ScreenCalendarDailyReportPage() {
  const navContext = useNavigation();
  const { showAlert } = useAlert();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_CALENDAR_DAILY_REPORT;
  const displayTitle = screenConfig.screenName || PAGE_NAMES.SCREEN_CALENDAR_DAILY_REPORT || 'カレンダー・日報';

  // 画面表示時のデフォルト表示タブはカレンダータブとする
  useEffect(() => {
    if (navContext.activeTab === 'screenCalendarDailyReport') {
      navContext.setActiveTab('calendarDailyReportCalendar');
    }
  }, [navContext]);

  // 日付・年月の共通状態管理（デフォルトは本日/今月）
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  // 日次確定フック（ヘッダーで統一的に管理）
  const { isConfirmed, confirmDate, unconfirmDate } = useDailyConfirmation(currentDate);

  // 日付変更時に年月も連動
  const handleDateChange = useCallback((date: string) => {
    setCurrentDate(date);
    if (date && date.length >= 7) {
      setCurrentMonth(date.substring(0, 7));
    }
  }, []);

  // カレンダーの日付行クリックで日報タブへ遷移
  const handleSelectDateFromCalendar = useCallback(
    (date: string) => {
      handleDateChange(date);
      navContext.setActiveTab('calendarDailyReportDay');
    },
    [handleDateChange, navContext]
  );

  const handleConfirm = useCallback(async () => {
    try {
      await confirmDate(currentDate);
      showAlert(`${currentDate}の日報を確定しました。`, 'success');
    } catch (err) {
      showAlert('日報の確定処理に失敗しました。', 'error');
    }
  }, [confirmDate, currentDate, showAlert]);

  const handleUnconfirm = useCallback(async () => {
    try {
      await unconfirmDate(currentDate);
      showAlert(`${currentDate}の確定を解除しました。`, 'success');
    } catch (err) {
      showAlert('日報の確定解除処理に失敗しました。', 'error');
    }
  }, [unconfirmDate, currentDate, showAlert]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={navContext.activeTab === 'calendarDailyReportDay' ? 'calendarDailyReportDay' : 'calendarDailyReportCalendar'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      {navContext.activeTab === 'calendarDailyReportDay' ? (
        <CalendarDailyReportDayPage
          currentDate={currentDate}
          onDateChange={handleDateChange}
          isConfirmed={isConfirmed}
          onConfirm={handleConfirm}
          onUnconfirm={handleUnconfirm}
        />
      ) : (
        <CalendarDailyReportCalendarPage
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onSelectDate={handleSelectDateFromCalendar}
        />
      )}
    </>
  );
}

