import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGE_NAMES } from '../constants';
import { useNavigation, useOffice } from '../contexts';
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

const getPickupText = (pickup: boolean, dropoff: boolean): string => {
  if (pickup && dropoff) return '往復';
  if (pickup) return '迎えのみ';
  if (dropoff) return '送りのみ';
  return '-';
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
  const { offices, selectedOfficeId, selectedOffice } = useOffice();

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

  // 12個のクイックアクセスワーク（2行 × 6列）
  const quickAccessItems: QuickAccessButton[] = [
    // 1行目
    { id: 'work-schedule-change', title: '予定変更', tab: 'scheduleMember' },
    { id: 'work-project-manage', title: '案件登録・変更', tab: 'project' },
    { id: 'work-finance-check', title: '収支確認', tab: 'financialSummary' },
    { id: 'work-member-daily', title: '利用者日報', tab: 'dailyWorkRecord' },
    { id: 'work-staff-daily', title: '職員日報', tab: 'staffAttendanceRecord' },
    { id: 'work-daily-confirm', title: '日報確定', tab: 'dailyWorkRecord' },

    // 2行目
    { id: 'work-project-progress', title: '案件進捗確認', tab: 'progressRecord' },
    { id: 'work-project-settlement', title: '案件精算', tab: 'rewardAllocation' },
    { id: 'work-monthly-closing', title: '月次決算', tab: 'wageSummary' },
    { id: 'work-certificate-renewal', title: '受給者証更新', tab: 'memberRecipientCertificate' },
    { id: 'work-skill-evaluation', title: 'スキル評価', tab: 'skillEvaluation' },
    { id: 'work-base-wage-evaluation', title: '基本工賃評価', tab: 'baseWageAssignment' },
  ];

  // 通知ステート（1パネル構成）
  const [notificationMessage, setNotificationMessage] = useState<string>('通知はありません');
  const [hasPendingNotification, setHasPendingNotification] = useState<boolean>(false);

  // 今日の予定ステート
  const [memberSchedules, setMemberSchedules] = useState<MemberTodaySchedule[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffTodaySchedule[]>([]);

  // データフェッチ
  const fetchDashboardData = useCallback(async () => {
    if (!targetOfficeId) return;

    try {
      // 1. 通知判定（前日の日報確定未処理チェック）
      const yesterdayStr = getYesterdayString(todayDateStr);
      const { data: yesterdayConf } = await supabase
        .from('daily_work_confirmations')
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
    <div style={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
      paddingBottom: 'var(--space-10)',
      paddingRight: 'var(--space-2)'
    }}>
      {/* ページヘッダー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-heading-2)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
          {PAGE_NAMES.SCREEN_DASHBOARD}
        </h2>
        {selectedOffice && (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
            事業所: {selectedOffice.name}
          </div>
        )}
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
        <div style={{
          backgroundColor: 'var(--color-bg-main)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--text-body)',
          color: 'var(--color-text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{notificationMessage}</span>
          {hasPendingNotification && (
            <button
              type="button"
              onClick={() => setActiveTab('dailyWorkRecord')}
              style={{
                fontSize: 'var(--text-caption)',
                padding: '4px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-main)',
                cursor: 'pointer'
              }}
            >
              日報画面を開く
            </button>
          )}
        </div>
      </section>

      {/* 2. クイックアクセスセクション（2行 × 6列） */}
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
              onClick={() => setActiveTab(item.tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                padding: '0 var(--space-2)',
                backgroundColor: 'var(--color-bg-main)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--color-text-main)',
                fontSize: 'var(--text-caption)',
                fontWeight: 'var(--weight-heading)',
                textAlign: 'center',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                e.currentTarget.style.borderColor = 'var(--color-border-focus)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-main)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              {item.title}
            </button>
          ))}
        </div>
      </section>

      {/* 3. 今日の予定セクション */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <h3 style={{
              fontSize: 'var(--text-heading-3)',
              fontWeight: 'var(--weight-heading)',
              color: 'var(--color-text-main)',
              margin: 0
            }}>
              今日の予定
            </h3>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
              {formattedTodayJP}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('scheduleMember')}
            style={{
              fontSize: 'var(--text-caption)',
              padding: '4px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-bg-main)',
              color: 'var(--color-text-main)',
              cursor: 'pointer'
            }}
          >
            予定表を開く
          </button>
        </div>

        {/* サマリーパネル */}
        <div style={{
          backgroundColor: 'var(--color-bg-main)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {/* 職員 勤怠状況 */}
          <div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              職員 勤怠状況
            </div>
            <div style={{ fontSize: 'var(--text-heading-2)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)', marginBottom: 'var(--space-1)' }}>
              {staffSummary.working} / {staffSummary.total} 名
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
              内訳: 勤務 {staffSummary.working}名 / 休み {staffSummary.off}名
            </div>
          </div>

          {/* 利用者 出欠状況 */}
          <div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              利用者 出欠状況
            </div>
            <div style={{ fontSize: 'var(--text-heading-2)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)', marginBottom: 'var(--space-1)' }}>
              {memberSummary.totalScheduled} / {memberSummary.total} 名
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
              内訳: 通所 {memberSummary.present}名 / 施設外 {memberSummary.offsite}名 / 在宅 {memberSummary.remote}名 / 欠席 {memberSummary.absent}名
            </div>
          </div>
        </div>

        {/* 当日状況の詳細テーブル（上下スクロール可能） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* 利用者 当日状況詳細 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
              利用者 当日状況 ({memberSchedules.length}名)
            </div>
            <div style={{
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-main)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-caption)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>コード</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>氏名</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>状況</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>予定時間</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>昼食</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>送迎</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>備考</th>
                  </tr>
                </thead>
                <tbody>
                  {memberSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        データがありません
                      </td>
                    </tr>
                  ) : (
                    memberSchedules.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px var(--space-3)' }}>{m.code}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{m.name}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{STATUS_TEXT[m.status] || '通所'}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{m.isScheduled && m.startTime ? `${m.startTime} 〜 ${m.endTime}` : '-'}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{m.hasMeal ? 'あり' : '-'}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{getPickupText(m.hasPickup, m.hasDropoff)}</td>
                        <td style={{ padding: '8px var(--space-3)', color: 'var(--color-text-muted)' }}>{m.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 職員 当日状況詳細 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
              職員 当日状況 ({staffSchedules.length}名)
            </div>
            <div style={{
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-main)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-caption)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>コード</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>氏名</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>勤怠</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>勤務時間</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>休憩</th>
                    <th style={{ padding: '8px var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-heading)' }}>備考</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        データがありません
                      </td>
                    </tr>
                  ) : (
                    staffSchedules.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px var(--space-3)' }}>{s.code}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{s.name}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{s.isWorkDay ? '出勤' : '休み'}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{s.isWorkDay && s.startTime ? `${s.startTime} 〜 ${s.endTime}` : '-'}</td>
                        <td style={{ padding: '8px var(--space-3)' }}>{s.isWorkDay && s.breakMinutes > 0 ? `${s.breakMinutes}分` : '-'}</td>
                        <td style={{ padding: '8px var(--space-3)', color: 'var(--color-text-muted)' }}>{s.remarks || '-'}</td>
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