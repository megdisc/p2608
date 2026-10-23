import { useState, useCallback, useEffect } from 'react';
import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation, useAlert } from '../contexts';
import { Tabs } from '../components/ui';
import { getCurrentJSTDateOnly } from '../utils';
import { useDailyConfirmation } from '../hooks';
import { StaffAttendanceRecordPage } from './StaffAttendanceRecordPage';
import { DailyWorkRecordPage } from './DailyWorkRecordPage';

export function ScreenDailyReportPage() {
  const navContext = useNavigation();
  const { showAlert } = useAlert();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_DAILY_REPORT;
  const displayTitle = screenConfig.screenName || PAGE_NAMES.SCREEN_DAILY_REPORT;

  // 画面表示時のデフォルト表示タブは利用記録タブとする
  useEffect(() => {
    if (navContext.activeTab === 'screenDailyReport' || navContext.activeTab === 'screenDailyWork' || navContext.activeTab === 'screenStaffDailyReport') {
      navContext.setActiveTab('dailyWorkRecord');
    }
  }, [navContext]);

  // 日付の共通状態管理（デフォルトは本日）
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  // 1つの確定ボタンで共通のロック処理とするための日次確定フック
  const { isConfirmed, confirmDate, unconfirmDate } = useDailyConfirmation(currentDate);

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
              activeTab={navContext.activeTab === 'staffAttendanceRecord' ? 'staffAttendanceRecord' : 'dailyWorkRecord'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      {navContext.activeTab === 'staffAttendanceRecord' ? (
        <StaffAttendanceRecordPage
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          isConfirmed={isConfirmed}
          onConfirm={handleConfirm}
          onUnconfirm={handleUnconfirm}
        />
      ) : (
        <DailyWorkRecordPage
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          isConfirmed={isConfirmed}
          onConfirm={handleConfirm}
          onUnconfirm={handleUnconfirm}
        />
      )}
    </>
  );
}
