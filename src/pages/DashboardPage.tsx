import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGE_NAMES, MESSAGES, TABLE_COLUMNS } from '../constants';
import { useNavigation, useOffice } from '../contexts';
import { Button } from '../components/ui';
import { supabase } from '../lib';
import { getCurrentJSTDateOnly } from '../utils';
import type { Tab } from '../types';

type QuickAccessButton = {
  id: string;
  title: string;
  tab: Tab;
};

type MemberTodaySchedule = {
  id: string;
  memberId: string;
  name: string;
  code: string;
  isScheduled: boolean;
  status: 'present' | 'offsite' | 'remote' | 'absent';
  startTime: string;
  endTime: string;
  hasMeal: boolean;
  hasPickup: boolean;
  hasDropoff: boolean;
  remarks: string;
};

type StaffTodaySchedule = {
  id: string;
  staffId: string;
  name: string;
  code: string;
  isWorkDay: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  remarks: string;
};

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

const STATUS_TEXT: Record<string, string> = {
  present: '通所',
  offsite: '施設外就労',
  remote: '在宅利用',
  absent: '欠席',
};

const getYesterdayString = (dateStr: string): string => {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function DashboardPage() {
  const { setActiveTab } = useNavigation();
  const { offices, selectedOfficeId } = useOffice();

  // 今日の日付 (JST)
  const todayDateStr = useMemo(() => getCurrentJSTDateOnly(), []);
  const todayDateObj = useMemo(() => {
    const parts = todayDateStr.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }, [todayDateStr]);
  const dayOfWeek = todayDateObj.getDay();

  const formattedTodayJP = useMemo(() => {
    const parts = todayDateStr.split('-');
    return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日（${WEEKDAY_NAMES[dayOfWeek]}）`;
  }, [todayDateStr, dayOfWeek]);

  const targetOfficeId = selectedOfficeId || (offices.length > 0 ? offices[0].id : '');

  // 6個のクイックアクセスワーク
  const quickAccessItems: QuickAccessButton[] = [
    { id: 'work-attendance', title: '出欠', tab: 'attendanceMonth' },
    { id: 'work-daily-report', title: '日報', tab: 'dailyWorkRecord' },
    { id: 'work-progress', title: '進捗', tab: 'progressRecord' },
    { id: 'work-expense-ledger', title: '会計帳簿', tab: 'expenseLedger' },
    { id: 'work-reward-allocation', title: '収益分配', tab: 'rewardAllocation' },
    { id: 'work-wage-summary', title: '月締め', tab: 'wageSummary' },
  ];

  // 通知ステート（1パネル構成）
  const [notificationMessage, setNotificationMessage] = useState<string>('通知はありません');
  const [hasPendingNotification, setHasPendingNotification] = useState<boolean>(false);

  // ローディングステート
  const [loading, setLoading] = useState<boolean>(true);

  // 今日の予定ステート
  const [memberSchedules, setMemberSchedules] = useState<MemberTodaySchedule[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffTodaySchedule[]>([]);

  // データフェッチ
  const fetchDashboardData = useCallback(async () => {
    if (!targetOfficeId) return;

    setLoading(true);
    try {
      // 1. 通知判定（前日の日報確定未処理チェック）
      const yesterdayStr = getYesterdayString(todayDateStr);
      const { data: yesterdayConf } = await supabase
        .from('daily_closings')
        .select('target_period, is_confirmed')
        .eq('target_period', yesterdayStr);

      const isYesterdayConfirmed = yesterdayConf && yesterdayConf.length > 0 && yesterdayConf[0].is_confirmed;
      if (!isYesterdayConfirmed) {
        setNotificationMessage(`前日（${yesterdayStr}）の日報確定が未処理です。`);
        setHasPendingNotification(true);
      } else {
        setNotificationMessage('通知はありません');
        setHasPendingNotification(false);
      }

      // 2. 今日の予定データ取得
      const [
        memberRes,
        officeMemberRes,
        memberBasicRes,
        memberExceptionRes,
        staffRes,
        officeStaffRes,
        staffBasicRes,
        staffExceptionRes,
      ] = await Promise.all([
        supabase.from('members').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('code', { ascending: true }),
        supabase.from('office_member_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('member_basic_schedules').select('*').eq('office_id', targetOfficeId),
        supabase.from('member_exception_schedules').select('*').eq('office_id', targetOfficeId).eq('target_date', todayDateStr),
        supabase.from('staffs').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('code', { ascending: true }),
        supabase.from('office_staff_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('staff_basic_schedules').select('*').eq('office_id', targetOfficeId),
        supabase.from('staff_exception_schedules').select('*').eq('office_id', targetOfficeId).eq('target_date', todayDateStr),
      ]);

      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

      // 利用者リスト組み立て
      const members = memberRes.data || [];
      const officeMemberIds = new Set((officeMemberRes.data || []).map(om => om.member_id));
      const targetMembers = members.filter(m => officeMemberIds.has(m.id));
      const memberBasics = memberBasicRes.data || [];
      const memberExceptions = memberExceptionRes.data || [];

      const todayMemberItems: MemberTodaySchedule[] = targetMembers.map(m => {
        const exception = memberExceptions.find(e => e.member_id === m.id);
        const basic = memberBasics.find(b => b.member_id === m.id && Number(b.day_of_week) === dayOfWeek);

        if (exception) {
          const rawStatus = exception.status;
          const statusVal: 'present' | 'offsite' | 'remote' | 'absent' =
            rawStatus === 'offsite' || rawStatus === 'remote' || rawStatus === 'absent'
              ? rawStatus
              : exception.is_scheduled === false ? 'absent' : 'present';

          return {
            id: `member-${m.id}`,
            memberId: m.id,
            name: m.name,
            code: m.code || '',
            isScheduled: exception.is_scheduled ?? true,
            status: statusVal,
            startTime: (exception.start_time || '').substring(0, 5),
            endTime: (exception.end_time || '').substring(0, 5),
            hasMeal: exception.has_meal ?? false,
            hasPickup: exception.has_pickup ?? false,
            hasDropoff: exception.has_dropoff ?? false,
            remarks: exception.remarks || '',
          };
        } else if (basic) {
          const rawStatus = basic.status;
          const statusVal: 'present' | 'offsite' | 'remote' | 'absent' =
            rawStatus === 'offsite' || rawStatus === 'remote' || rawStatus === 'absent'
              ? rawStatus
              : basic.is_scheduled === false ? 'absent' : 'present';

          return {
            id: `member-${m.id}`,
            memberId: m.id,
            name: m.name,
            code: m.code || '',
            isScheduled: basic.is_scheduled ?? true,
            status: statusVal,
            startTime: (basic.start_time || '').substring(0, 5),
            endTime: (basic.end_time || '').substring(0, 5),
            hasMeal: basic.has_meal ?? false,
            hasPickup: basic.has_pickup ?? false,
            hasDropoff: basic.has_dropoff ?? false,
            remarks: basic.remarks || '',
          };
        } else {
          return {
            id: `member-${m.id}`,
            memberId: m.id,
            name: m.name,
            code: m.code || '',
            isScheduled: isWeekday,
            status: isWeekday ? 'present' : 'absent',
            startTime: isWeekday ? '09:30' : '',
            endTime: isWeekday ? '15:30' : '',
            hasMeal: isWeekday,
            hasPickup: false,
            hasDropoff: false,
            remarks: '',
          };
        }
      });
      setMemberSchedules(todayMemberItems);

      // 職員リスト組み立て
      const staffs = staffRes.data || [];
      const officeStaffIds = new Set((officeStaffRes.data || []).map(os => os.staff_id));
      const targetStaffs = staffs.filter(s => officeStaffIds.has(s.id));
      const staffBasics = staffBasicRes.data || [];
      const staffExceptions = staffExceptionRes.data || [];

      const todayStaffItems: StaffTodaySchedule[] = targetStaffs.map(s => {
        const exception = staffExceptions.find(e => e.staff_id === s.id);
        const basic = staffBasics.find(b => b.staff_id === s.id && Number(b.day_of_week) === dayOfWeek);

        if (exception) {
          return {
            id: `staff-${s.id}`,
            staffId: s.id,
            name: s.name,
            code: s.code || '',
            isWorkDay: exception.is_work_day ?? true,
            startTime: (exception.start_time || '').substring(0, 5),
            endTime: (exception.end_time || '').substring(0, 5),
            breakMinutes: exception.break_minutes ?? 60,
            remarks: exception.remarks || '',
          };
        } else if (basic) {
          return {
            id: `staff-${s.id}`,
            staffId: s.id,
            name: s.name,
            code: s.code || '',
            isWorkDay: basic.is_work_day ?? true,
            startTime: (basic.start_time || '').substring(0, 5),
            endTime: (basic.end_time || '').substring(0, 5),
            breakMinutes: basic.break_minutes ?? 60,
            remarks: basic.remarks || '',
          };
        } else {
          return {
            id: `staff-${s.id}`,
            staffId: s.id,
            name: s.name,
            code: s.code || '',
            isWorkDay: isWeekday,
            startTime: isWeekday ? '08:30' : '',
            endTime: isWeekday ? '17:30' : '',
            breakMinutes: isWeekday ? 60 : 0,
            remarks: '',
          };
        }
      });
      setStaffSchedules(todayStaffItems);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [targetOfficeId, todayDateStr, dayOfWeek]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 利用者サマリー集計
  const memberSummary = useMemo(() => {
    const present = memberSchedules.filter(m => m.isScheduled && m.status === 'present').length;
    const offsite = memberSchedules.filter(m => m.isScheduled && m.status === 'offsite').length;
    const remote = memberSchedules.filter(m => m.isScheduled && m.status === 'remote').length;
    const absent = memberSchedules.filter(m => !m.isScheduled || m.status === 'absent').length;
    const totalScheduled = present + offsite + remote;
    return { present, offsite, remote, absent, totalScheduled, total: memberSchedules.length };
  }, [memberSchedules]);

  // 職員サマリー集計
  const staffSummary = useMemo(() => {
    const working = staffSchedules.filter(s => s.isWorkDay).length;
    const off = staffSchedules.filter(s => !s.isWorkDay).length;
    return { working, off, total: staffSchedules.length };
  }, [staffSchedules]);

  return (
    <div
      className="dashboard-container"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        paddingBottom: 'var(--space-10)',
        paddingRight: 'var(--space-2)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {/* ページヘッダー */}
      <div>
        <h2 style={{ margin: 0, fontSize: 'var(--text-heading-2)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
          {PAGE_NAMES.SCREEN_DASHBOARD}
        </h2>
      </div>

      {/* 1. 通知セクション（1パネル構成） */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: 0
        }}>
          通知
        </h3>
        <div className="dashboard-panel" style={{
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{notificationMessage}</span>
          {hasPendingNotification && (
            <Button
              variant="edit"
              style={{ height: '24px', fontSize: 'var(--text-caption)', padding: '0 var(--space-3)' }}
              onClick={() => setActiveTab('dailyWorkRecord')}
            >
              日報画面を開く
            </Button>
          )}
        </div>
      </section>

      {/* 2. クイックアクセスセクション（6個） */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: 0
        }}>
          クイックアクセス
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 'var(--space-2)'
        }}>
          {quickAccessItems.map(item => (
            <button
              key={item.id}
              type="button"
              className="dashboard-quick-access-btn"
              onClick={() => setActiveTab(item.tab)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </section>

      {/* 3. 今日の予定セクション */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
          <h3 style={{
            fontSize: 'var(--text-heading-3)',
            fontWeight: 'var(--weight-heading)',
            color: 'var(--color-text-main)',
            margin: 0
          }}>
            今日の予定
          </h3>
          <span style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)' }}>
            {formattedTodayJP}
          </span>
        </div>

        {/* 左右の小セクション（左: 利用者データ / 右: 職員データ） */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start'
        }}>
          {/* 左側小セクション: 利用者データ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* 上側: 出欠の状況概要 */}
            <div
              key={`member-summary-${targetOfficeId}`}
              className="dashboard-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
                minHeight: '104px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
                利用者 出欠状況
              </div>
              <div style={{ fontSize: 'var(--text-heading-2)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
                {memberSummary.totalScheduled} / {memberSummary.total} 名
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-main)' }}>
                内訳: 通所 {memberSummary.present}名 / 施設外 {memberSummary.offsite}名 / 在宅 {memberSummary.remote}名 / 欠席 {memberSummary.absent}名
              </div>
            </div>

            {/* 下側: 利用時間の予定 */}
            <div className="table-container" style={{ maxHeight: '360px' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>{TABLE_COLUMNS.NAME}</th>
                    <th style={{ width: '100px' }}>{TABLE_COLUMNS.STATUS}</th>
                    <th style={{ width: '150px' }}>{TABLE_COLUMNS.SERVICE_HOURS_PLAIN}</th>
                    <th>{TABLE_COLUMNS.REMARKS}</th>
                  </tr>
                </thead>
                <tbody key={`members-${targetOfficeId}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                        {MESSAGES.LOADING}
                      </td>
                    </tr>
                  ) : memberSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-message">表示するデータがありません</td>
                    </tr>
                  ) : (
                    memberSchedules.map(m => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{STATUS_TEXT[m.status] || '通所'}</td>
                        <td>{m.isScheduled && m.startTime ? `${m.startTime} 〜 ${m.endTime}` : '-'}</td>
                        <td>{m.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 右側小セクション: 職員データ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* 上側: 勤怠の状況概要 */}
            <div
              key={`staff-summary-${targetOfficeId}`}
              className="dashboard-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
                minHeight: '104px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
                職員 勤怠状況
              </div>
              <div style={{ fontSize: 'var(--text-heading-2)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
                {staffSummary.working} / {staffSummary.total} 名
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-main)' }}>
                内訳: 勤務 {staffSummary.working}名 / 休み {staffSummary.off}名
              </div>
            </div>

            {/* 下側: 勤務時間の予定 */}
            <div className="table-container" style={{ maxHeight: '360px' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>{TABLE_COLUMNS.NAME}</th>
                    <th style={{ width: '100px' }}>{TABLE_COLUMNS.STATUS}</th>
                    <th style={{ width: '150px' }}>{TABLE_COLUMNS.WORK_HOURS_PLAIN}</th>
                    <th>{TABLE_COLUMNS.REMARKS}</th>
                  </tr>
                </thead>
                <tbody key={`staff-${targetOfficeId}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                        {MESSAGES.LOADING}
                      </td>
                    </tr>
                  ) : staffSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-message">表示するデータがありません</td>
                    </tr>
                  ) : (
                    staffSchedules.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.isWorkDay ? '出勤' : '休み'}</td>
                        <td>{s.isWorkDay && s.startTime ? `${s.startTime} 〜 ${s.endTime}` : '-'}</td>
                        <td>{s.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}