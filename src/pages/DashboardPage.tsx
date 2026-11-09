import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGE_NAMES } from '../constants';
import { useNavigation, useOffice } from '../contexts';
import { supabase } from '../lib';
import { getCurrentJSTDateOnly } from '../utils';
import type { Tab } from '../types';

type NotificationItem = {
  id: string;
  type: 'warning' | 'info' | 'success';
  badge: string;
  title: string;
  message: string;
  tab: Tab;
};

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

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  present: { label: '通所', color: '#16a34a', bg: '#f0fdf4' },
  offsite: { label: '施設外就労', color: '#0284c7', bg: '#f0f9ff' },
  remote: { label: '在宅利用', color: '#7c3aed', bg: '#f5f3ff' },
  absent: { label: '欠席', color: '#dc2626', bg: '#fef2f2' },
};

export function DashboardPage() {
  const { setActiveTab } = useNavigation();
  const { offices, selectedOfficeId, selectedOffice } = useOffice();

  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);
  const [scheduleViewType, setScheduleViewType] = useState<'member' | 'staff'>('member');

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

  // 通知データ
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // 今日の予定データ
  const [memberSchedules, setMemberSchedules] = useState<MemberTodaySchedule[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffTodaySchedule[]>([]);
  const [activeProjectCount, setActiveProjectCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // データフェッチ
  const fetchDashboardData = useCallback(async () => {
    if (!targetOfficeId) return;

    try {
      setLoading(true);

      // 1. 通知判定用データの取得
      // 受給者証の期限確認 (60日以内または過去日)
      const sixtyDaysLater = new Date(todayDateObj);
      sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
      const sixtyDaysLaterStr = sixtyDaysLater.toISOString().substring(0, 10);

      const [certRes, dailyConfRes, closingRes, projectRes] = await Promise.all([
        supabase
          .from('member_recipient_certificates')
          .select('id, member_id, valid_to')
          .lte('valid_to', sixtyDaysLaterStr)
          .or('is_deleted.eq.false,is_deleted.is.null'),
        supabase
          .from('daily_work_confirmations')
          .select('target_period, is_confirmed')
          .eq('target_period', todayDateStr),
        supabase
          .from('monthly_financial_closings')
          .select('target_period, status')
          .order('target_period', { ascending: false })
          .limit(1),
        supabase
          .from('projects')
          .select('id, status, is_deleted')
          .or('is_deleted.eq.false,is_deleted.is.null')
      ]);

      const notifs: NotificationItem[] = [];

      // 受給者証期限通知
      const expiringCerts = certRes.data || [];
      if (expiringCerts.length > 0) {
        notifs.push({
          id: 'notif-cert',
          type: 'warning',
          badge: '要対応',
          title: '受給者証更新の確認',
          message: `直近に有効期限を迎える、または期限切れの受給者証が ${expiringCerts.length} 件あります。更新手続きや支給量の確認を行ってください。`,
          tab: 'memberRecipientCertificate',
        });
      }

      // 本日の日報確定通知
      const isTodayConfirmed = dailyConfRes.data && dailyConfRes.data.length > 0 && dailyConfRes.data[0].is_confirmed;
      if (isTodayConfirmed) {
        notifs.push({
          id: 'notif-daily-confirmed',
          type: 'success',
          badge: '日次確定済',
          title: '本日の日次日報 確定完了',
          message: `本日（${todayDateStr}）の日次作業記録および出欠実績は確定済みです。`,
          tab: 'dailyWorkRecord',
        });
      } else {
        notifs.push({
          id: 'notif-daily-pending',
          type: 'info',
          badge: '日次確認',
          title: '本日の日次日報 未確定',
          message: `本日（${todayDateStr}）の日次記録・日報は未確定です。業務終了時に記録内容を確認の上、確定処理を行ってください。`,
          tab: 'dailyWorkRecord',
        });
      }

      // 月次決算ステータス
      const latestClosing = closingRes.data && closingRes.data.length > 0 ? closingRes.data[0] : null;
      if (latestClosing && latestClosing.status === 'closed') {
        notifs.push({
          id: 'notif-closing',
          type: 'info',
          badge: '月次状況',
          title: `月次決算（${latestClosing.target_period}）確定完了`,
          message: `${latestClosing.target_period} 度の月次決算・工賃確定処理は完了しています。最新の収支状況をご確認ください。`,
          tab: 'financialSummary',
        });
      } else {
        notifs.push({
          id: 'notif-closing-reminder',
          type: 'info',
          badge: '月次確認',
          title: '月次決算・工賃精算の確認',
          message: '前月および当月の案件売上・経費精算、工賃計算の確定状況を確認してください。',
          tab: 'wageSummary',
        });
      }

      setNotifications(notifs);

      // 稼働案件数
      type SimpleProject = { id: string; status?: string | null; is_deleted?: boolean | null };
      const allProjects = (projectRes.data || []) as SimpleProject[];
      const activeProjects = allProjects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
      setActiveProjectCount(activeProjects.length);

      // 2. 今日の予定データ取得
      // 利用者予定
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
  }, [targetOfficeId, todayDateStr, todayDateObj, dayOfWeek]);

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
    const mealCount = memberSchedules.filter(m => m.isScheduled && m.hasMeal && m.status !== 'absent').length;
    return { present, offsite, remote, absent, totalScheduled, mealCount, total: memberSchedules.length };
  }, [memberSchedules]);

  // 職員サマリー集計
  const staffSummary = useMemo(() => {
    const working = staffSchedules.filter(s => s.isWorkDay).length;
    const off = staffSchedules.filter(s => !s.isWorkDay).length;
    return { working, off, total: staffSchedules.length };
  }, [staffSchedules]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6, 24px)', paddingBottom: 'var(--space-8, 32px)' }}>
      {/* ページヘッダー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 'var(--space-2, 8px)',
        borderBottom: '1px solid var(--color-border, #e2e8f0)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--color-text-main)' }}>
            {PAGE_NAMES.SCREEN_DASHBOARD}
          </h2>
        </div>
        {selectedOffice && (
          <div style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-subtle, #f1f5f9)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontWeight: 500
          }}>
            事業所: {selectedOffice.name}
          </div>
        )}
      </div>

      {/* 1. 通知セクション（クイックアクセスの上） */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3, 12px)' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-text-main)' }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <h3 style={{
            fontSize: 'var(--text-heading-3, 16px)',
            fontWeight: 'var(--weight-heading, 600)',
            color: 'var(--color-text-main)',
            margin: 0
          }}>
            通知
          </h3>
          {notifications.some(n => n.type === 'warning') && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '2px 8px',
              borderRadius: '9999px'
            }}>
              要確認あり
            </span>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-3, 12px)'
        }}>
          {notifications.map(notif => {
            const isWarning = notif.type === 'warning';
            const isSuccess = notif.type === 'success';
            const borderColor = isWarning ? '#fca5a5' : isSuccess ? '#86efac' : 'var(--color-border, #e2e8f0)';
            const badgeBg = isWarning ? '#fee2e2' : isSuccess ? '#dcfce7' : '#e0e7ff';
            const badgeColor = isWarning ? '#b91c1c' : isSuccess ? '#15803d' : '#4338ca';

            return (
              <div
                key={notif.id}
                onClick={() => setActiveTab(notif.tab)}
                style={{
                  backgroundColor: 'var(--color-bg-main, #ffffff)',
                  border: `1px solid ${borderColor}`,
                  borderLeft: `4px solid ${badgeColor}`,
                  borderRadius: 'var(--radius-md, 6px)',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: badgeBg,
                    color: badgeColor
                  }}>
                    {notif.badge}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    開く
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                  {notif.message}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. クイックアクセスセクション（2行 × 6列、シンプルパネル） */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3, 12px)' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-text-main)' }}
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <h3 style={{
            fontSize: 'var(--text-heading-3, 16px)',
            fontWeight: 'var(--weight-heading, 600)',
            color: 'var(--color-text-main)',
            margin: 0
          }}>
            クイックアクセス
          </h3>
        </div>

        {/* 2行 × 6列 のボタングリッド */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: '10px'
        }}>
          {quickAccessItems.map(item => {
            const isHovered = hoveredButtonId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                onMouseEnter={() => setHoveredButtonId(item.id)}
                onMouseLeave={() => setHoveredButtonId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '46px',
                  padding: '0 8px',
                  backgroundColor: isHovered ? 'var(--color-bg-subtle, #f8fafc)' : 'var(--color-bg-main, #ffffff)',
                  border: isHovered ? '1px solid var(--color-border-focus, #3b82f6)' : '1px solid var(--color-border, #cbd5e1)',
                  borderRadius: 'var(--radius-md, 6px)',
                  boxShadow: isHovered ? '0 2px 4px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  transform: isHovered ? 'translateY(-1px)' : 'none',
                  color: isHovered ? 'var(--color-primary, #2563eb)' : 'var(--color-text-main, #1e293b)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. 今日の予定セクション（クイックアクセスの下） */}
      <section style={{
        backgroundColor: 'var(--color-bg-main, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 8px)',
        padding: 'var(--space-5, 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4, 16px)'
      }}>
        {/* セクションヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--color-border, #f1f5f9)',
          paddingBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--color-primary, #2563eb)' }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3 style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              margin: 0
            }}>
              今日の予定
            </h3>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
              padding: '2px 10px',
              borderRadius: '6px'
            }}>
              {formattedTodayJP}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('scheduleMember')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-primary, #2563eb)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              予定一覧を開く
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* サマリーカード指標（KPI） */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          {/* 利用者 通所予定 */}
          <div style={{
            backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '6px',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              利用者 通所予定
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {memberSummary.totalScheduled}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                / 登録 {memberSummary.total}名
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              flexWrap: 'wrap'
            }}>
              <span>通所: <strong style={{ color: '#16a34a' }}>{memberSummary.present}</strong></span>
              <span>施設外: <strong style={{ color: '#0284c7' }}>{memberSummary.offsite}</strong></span>
              <span>在宅: <strong style={{ color: '#7c3aed' }}>{memberSummary.remote}</strong></span>
              <span>欠席: <strong style={{ color: '#dc2626' }}>{memberSummary.absent}</strong></span>
            </div>
          </div>

          {/* 職員 出勤予定 */}
          <div style={{
            backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '6px',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              職員 出勤予定
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {staffSummary.working}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                / 所属 {staffSummary.total}名
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--color-text-muted)'
            }}>
              <span>勤務: <strong>{staffSummary.working}名</strong></span>
              <span>公休・休職: <strong>{staffSummary.off}名</strong></span>
            </div>
          </div>

          {/* 昼食・送迎・案件 */}
          <div style={{
            backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '6px',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              食事・稼働案件
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {memberSummary.mealCount}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                食（昼食提供予定）
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--color-text-muted)'
            }}>
              <span>稼働中案件: <strong>{activeProjectCount}件</strong></span>
            </div>
          </div>
        </div>

        {/* 予定詳細プレビュー（タブ切り替え） */}
        <div>
          {/* タブ切り替えボタン */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--color-border, #e2e8f0)',
            marginBottom: '12px'
          }}>
            <button
              type="button"
              onClick={() => setScheduleViewType('member')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: scheduleViewType === 'member' ? 'var(--color-primary, #2563eb)' : 'var(--color-text-muted)',
                borderBottom: scheduleViewType === 'member' ? '2px solid var(--color-primary, #2563eb)' : '2px solid transparent',
                backgroundColor: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer'
              }}
            >
              利用者 予定一覧 ({memberSchedules.length}名)
            </button>
            <button
              type="button"
              onClick={() => setScheduleViewType('staff')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: scheduleViewType === 'staff' ? 'var(--color-primary, #2563eb)' : 'var(--color-text-muted)',
                borderBottom: scheduleViewType === 'staff' ? '2px solid var(--color-primary, #2563eb)' : '2px solid transparent',
                backgroundColor: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer'
              }}
            >
              職員 予定一覧 ({staffSchedules.length}名)
            </button>
          </div>

          {/* 利用者 予定リスト */}
          {scheduleViewType === 'member' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {memberSchedules.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  {loading ? '読み込み中...' : '登録された利用者がいません。'}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '8px'
                }}>
                  {memberSchedules.map(m => {
                    const statusConfig = STATUS_LABELS[m.status] || STATUS_LABELS.present;
                    return (
                      <div
                        key={m.id}
                        style={{
                          border: '1px solid var(--color-border, #e2e8f0)',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          backgroundColor: m.isScheduled ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                              {m.code}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                              {m.name}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: statusConfig.bg,
                            color: statusConfig.color
                          }}>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          <div>
                            {m.isScheduled && m.startTime && m.endTime ? (
                              <span>時間: <strong style={{ color: 'var(--color-text-main)' }}>{m.startTime} 〜 {m.endTime}</strong></span>
                            ) : (
                              <span>予定なし</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {m.hasMeal && (
                              <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                昼食
                              </span>
                            )}
                            {(m.hasPickup || m.hasDropoff) && (
                              <span style={{ fontSize: '10px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                送迎
                              </span>
                            )}
                          </div>
                        </div>

                        {m.remarks && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.remarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 職員 予定リスト */}
          {scheduleViewType === 'staff' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staffSchedules.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  {loading ? '読み込み中...' : '登録された職員がいません。'}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '8px'
                }}>
                  {staffSchedules.map(s => (
                    <div
                      key={s.id}
                      style={{
                        border: '1px solid var(--color-border, #e2e8f0)',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        backgroundColor: s.isWorkDay ? '#ffffff' : '#fafafa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            {s.code}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {s.name}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: s.isWorkDay ? '#dcfce7' : '#f1f5f9',
                          color: s.isWorkDay ? '#15803d' : '#64748b'
                        }}>
                          {s.isWorkDay ? '出勤' : '公休'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <div>
                          {s.isWorkDay && s.startTime && s.endTime ? (
                            <span>勤務: <strong style={{ color: 'var(--color-text-main)' }}>{s.startTime} 〜 {s.endTime}</strong></span>
                          ) : (
                            <span>勤務なし</span>
                          )}
                        </div>
                        {s.isWorkDay && s.breakMinutes > 0 && (
                          <span style={{ fontSize: '11px' }}>
                            休憩 {s.breakMinutes}分
                          </span>
                        )}
                      </div>

                      {s.remarks && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}