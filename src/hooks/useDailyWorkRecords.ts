import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../lib';
import { useOffice } from '../contexts';
import type { MemberItem, ProjectItem } from '../types';
import { getCurrentJSTDateOnly } from '../utils';

export type DailyRecord = {
  id: string;
  office_id?: string | null;
  target_period: string;
  member_id: string;
  task_id: string;
  work_time: number;
};

export type DailyAttendanceRecord = {
  id?: string;
  office_id?: string | null;
  target_period: string;
  member_id: string;
  status: string;
  contact_date?: string | null;
  is_absentee_supported: boolean;
  has_meal: boolean;
  has_pickup: boolean;
  has_dropoff: boolean;
  remarks?: string | null;
};

export type DailyFlatRecord = {
  id: string;
  userId: string;
  userCode: string;
  userName: string;
  userYomigana: string;
  status: string;
  contactDate: string;
  isAbsenteeSupported: boolean;
  hasMeal: boolean;
  hasPickup: boolean;
  hasDropoff: boolean;
  remarks: string;
  date: string;
  projectId: string;
  projectYomigana: string;
  projectType: string;
  taskId: string;
  workTime: number;
  isSaved: boolean;
  isEmptyRow?: boolean;
  isFirstInUser?: boolean;
  isFirstInProject?: boolean;
  isLastInUser?: boolean;
  isLastInProject?: boolean;
};

export function useDailyWorkRecords() {
  const { selectedOfficeId } = useOffice();
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  const fetchMasters = useCallback(async (officeId?: string) => {
    const targetOfficeId = officeId !== undefined ? officeId : selectedOfficeId;
    try {
      setLoading(true);
      const [membersRes, projectsRes] = await Promise.all([
        supabase.from('members').select('*').order('yomigana', { ascending: true }),
        supabase.from('projects').select(`
          id, code, name, project_type, is_deleted,
          project_tasks (
            id, name, is_deleted,
            project_task_assignees ( member_id )
          )
        `).order('code', { ascending: true }),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (projectsRes.error) throw projectsRes.error;

      // 選択された事業所に割当のある利用者を抽出
      let memberIdsForOffice: Set<string> | null = null;
      if (targetOfficeId) {
        memberIdsForOffice = new Set<string>();
        const [settingsRes, certRes] = await Promise.all([
          supabase.from('office_member_settings').select('member_id').eq('office_id', targetOfficeId),
          supabase.from('member_recipient_certificates').select('member_id').eq('copayment_office_id', targetOfficeId)
        ]);
        (settingsRes.data || []).forEach(s => memberIdsForOffice!.add(s.member_id));
        (certRes.data || []).forEach(c => memberIdsForOffice!.add(c.member_id));
      }

      const membersData = (membersRes.data || [])
        .filter((m: any) => {
          if (!memberIdsForOffice || memberIdsForOffice.size === 0) return true;
          return memberIdsForOffice.has(m.id);
        })
        .map((m: any) => ({
          ...m,
          name: m.is_deleted ? `${m.name} (削除済)` : m.name
        }));

      setDbMembers(membersData);
      
      const formattedProjects = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        code: p.code || '',
        name: p.is_deleted ? `${p.name} (削除済)` : p.name,
        is_deleted: p.is_deleted,
        projectType: p.project_type || 'one-off',
        tasks: (p.project_tasks || [])
          .map((pt: any) => ({
            id: pt.id,
            code: pt.code || '',
            task: pt.is_deleted ? `${pt.name} (削除済)` : pt.name,
            is_deleted: pt.is_deleted,
            assigneeIds: (pt.project_task_assignees || [])
              .map((pta: any) => pta.member_id)
              .filter(Boolean)
          }))
      }));
      setDbProjects(formattedProjects as ProjectItem[]);

    } catch (error) {
      console.error('Error fetching masters:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedOfficeId]);

  const fetchRecords = useCallback(async (date: string, officeId?: string) => {
    const targetOfficeId = officeId !== undefined ? officeId : selectedOfficeId;
    try {
      setLoading(true);
      let workQuery = supabase.from('daily_work_records').select('*').eq('target_period', date);
      let attendanceQuery = supabase.from('member_attendance_records').select('*').eq('target_period', date);

      if (targetOfficeId) {
        workQuery = workQuery.or(`office_id.eq.${targetOfficeId},office_id.is.null`);
        attendanceQuery = attendanceQuery.or(`office_id.eq.${targetOfficeId},office_id.is.null`);
      }

      const [workRes, attendanceRes] = await Promise.all([workQuery, attendanceQuery]);

      if (workRes.error) throw workRes.error;
      if (attendanceRes.error && attendanceRes.error.code !== 'PGRST116') {
        console.warn('Warning fetching attendance records:', attendanceRes.error);
      }

      setRecords(workRes.data || []);
      setAttendanceRecords(attendanceRes.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedOfficeId]);

  useEffect(() => {
    fetchMasters(selectedOfficeId);
    fetchRecords(currentDate, selectedOfficeId);
  }, [selectedOfficeId, currentDate, fetchMasters, fetchRecords]);

  const [confirmedDates, setConfirmedDates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('daily_work_confirmations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-29', '2026-06-30',
      '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05',
      '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10',
      '2026-07-11', '2026-07-12', '2026-07-13', '2026-07-14', '2026-07-15',
      '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20',
      '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25',
      '2026-07-26', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30',
      '2026-07-31',
      '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
      '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10',
      '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15',
      '2026-08-16',
      '2027-07-01', '2027-07-02', '2027-07-03', '2027-07-04', '2027-07-05',
      '2027-07-06', '2027-07-07', '2027-07-08', '2027-07-09', '2027-07-10',
      '2027-07-11', '2027-07-12', '2027-07-13', '2027-07-14', '2027-07-15',
      '2027-07-16', '2027-07-17', '2027-07-18', '2027-07-19', '2027-07-20',
      '2027-07-21', '2027-07-22', '2027-07-23', '2027-07-24', '2027-07-25',
      '2027-07-26', '2027-07-27', '2027-07-28', '2027-07-29', '2027-07-30',
      '2027-07-31'
    ];
  });

  const displayData = useMemo(() => {
    if (dbMembers.length === 0) return [];
    
    const isConfirmed = confirmedDates.includes(currentDate);
    const activeProjects = dbProjects;
    const flatRows: DailyFlatRecord[] = [];

    const OTHER_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
    const OTHER_TASK_ID = '00000000-0000-0000-0000-000000000002';

    const normalizeStatus = (rawStatus?: string) => {
      if (!rawStatus || rawStatus === 'present') return '通所利用';
      if (rawStatus === 'absent') return '非利用／欠席';
      if (['通所利用', '在宅利用', '施設外利用', '非利用／欠席'].includes(rawStatus)) return rawStatus;
      return '通所利用';
    };

    for (const member of dbMembers) {
      const userRecords = records.filter(r => r.member_id === member.id);
      if (member.is_deleted && userRecords.length === 0) continue;
      
      const userAttendance = attendanceRecords.find(a => a.member_id === member.id);
      const status = normalizeStatus(userAttendance?.status);
      const contactDate = userAttendance ? (userAttendance.contact_date || '') : '';
      const isAbsenteeSupported = userAttendance ? Boolean(userAttendance.is_absentee_supported) : false;
      const hasMeal = userAttendance ? Boolean(userAttendance.has_meal) : false;
      const hasPickup = userAttendance ? Boolean(userAttendance.has_pickup) : false;
      const hasDropoff = userAttendance ? Boolean(userAttendance.has_dropoff) : false;
      const remarks = userAttendance ? (userAttendance.remarks || '') : '';
      const userCode = (member as any).code || '';

      const taskMap = new Map<string, DailyFlatRecord>();

      // 1. 作業記録テーブル（daily_work_records）に記録されているデータ
      for (const r of userRecords) {
        if (r.task_id === OTHER_TASK_ID) {
          taskMap.set(r.task_id, {
            id: r.id,
            userId: member.id,
            userCode,
            userName: member.name,
            userYomigana: member.yomigana || '',
            status,
            contactDate,
            isAbsenteeSupported,
            hasMeal,
            hasPickup,
            hasDropoff,
            remarks,
            date: currentDate,
            projectId: OTHER_PROJECT_ID,
            projectYomigana: 'んんん',
            projectType: 'その他',
            taskId: r.task_id,
            workTime: Number(r.work_time),
            isSaved: true
          });
        } else {
          let projectId = '';
          for (const p of dbProjects) {
            if (p.tasks.some(t => t.id === r.task_id)) {
              projectId = p.id;
              break;
            }
          }
          const targetProject = dbProjects.find(p => p.id === projectId);
          taskMap.set(r.task_id, {
            id: r.id,
            userId: member.id,
            userCode,
            userName: member.name,
            userYomigana: member.yomigana || '',
            status,
            contactDate,
            isAbsenteeSupported,
            hasMeal,
            hasPickup,
            hasDropoff,
            remarks,
            date: currentDate,
            projectId,
            projectYomigana: targetProject?.yomigana || '',
            projectType: targetProject?.projectType || 'one-off',
            taskId: r.task_id,
            workTime: Number(r.work_time),
            isSaved: true
          });
        }
      }

      // 2. 案件タスク担当者テーブルで各利用者毎に割り当てられているタスク（未確定の日のみ表示）
      if (!isConfirmed) {
        for (const p of activeProjects) {
          if (p.is_deleted) continue;
          for (const t of p.tasks) {
            if (t.is_deleted) continue;
            if (t.assigneeIds?.includes(member.id) && !taskMap.has(t.id)) {
              taskMap.set(t.id, {
                id: `UNSAVED-${currentDate}-${member.id}-${t.id}`,
                userId: member.id,
                userCode,
                userName: member.name,
                userYomigana: member.yomigana || '',
                status,
                contactDate,
                isAbsenteeSupported,
                hasMeal,
                hasPickup,
                hasDropoff,
                remarks,
                date: currentDate,
                projectId: p.id,
                projectYomigana: p.yomigana || '',
                projectType: p.projectType || 'one-off',
                taskId: t.id,
                workTime: 0,
                isSaved: false
              });
            }
          }
        }

        // 3. その他（未確定の日のみ追加）
        if (!taskMap.has(OTHER_TASK_ID)) {
          taskMap.set(OTHER_TASK_ID, {
            id: `UNSAVED-${currentDate}-${member.id}-${OTHER_TASK_ID}`,
            userId: member.id,
            userCode,
            userName: member.name,
            userYomigana: member.yomigana || '',
            status,
            contactDate,
            isAbsenteeSupported,
            hasMeal,
            hasPickup,
            hasDropoff,
            remarks,
            date: currentDate,
            projectId: OTHER_PROJECT_ID,
            projectYomigana: 'んんん',
            projectType: 'その他',
            taskId: OTHER_TASK_ID,
            workTime: 0,
            isSaved: false
          });
        }
      } else {
        // 確定済の日：記録データが1つも無い利用者は、氏名以外のセルは「-」と表示
        if (taskMap.size === 0) {
          taskMap.set('EMPTY_RECORD', {
            id: `EMPTY-${currentDate}-${member.id}`,
            userId: member.id,
            userCode,
            userName: member.name,
            userYomigana: member.yomigana || '',
            status,
            contactDate,
            isAbsenteeSupported,
            hasMeal,
            hasPickup,
            hasDropoff,
            remarks,
            date: currentDate,
            projectId: '',
            projectYomigana: '',
            projectType: '',
            taskId: '',
            workTime: 0,
            isSaved: false,
            isEmptyRow: true
          });
        }
      }

      flatRows.push(...Array.from(taskMap.values()));
    }

    flatRows.sort((a, b) => {
      const codeA = a.userCode || '';
      const codeB = b.userCode || '';
      if (codeA !== codeB) return codeA.localeCompare(codeB, undefined, { numeric: true });

      const mA = dbMembers.find(m => m.id === a.userId)?.yomigana || '';
      const mB = dbMembers.find(m => m.id === b.userId)?.yomigana || '';
      if (mA !== mB) return mA.localeCompare(mB);

      const getPTypeOrder = (p: string) => p === 'ongoing' ? 0 : p === 'その他' ? 2 : 1;
      const pOrderA = getPTypeOrder(a.projectType);
      const pOrderB = getPTypeOrder(b.projectType);
      if (pOrderA !== pOrderB) return pOrderA - pOrderB;

      const pA = dbProjects.find(p => p.id === a.projectId)?.code || '';
      const pB = dbProjects.find(p => p.id === b.projectId)?.code || '';
      if (pA !== pB) return pA.localeCompare(pB);

      const tA = dbProjects.flatMap(p => p.tasks).find(t => t.id === a.taskId)?.task || '';
      const tB = dbProjects.flatMap(p => p.tasks).find(t => t.id === b.taskId)?.task || '';
      return tA.localeCompare(tB);
    });

    let prevUserId = '';
    let prevProjectId = '';

    const finalRows = flatRows.map((r, i) => {
      const isFirstInUser = r.userId !== prevUserId;
      const isFirstInProject = isFirstInUser || r.projectId !== prevProjectId;

      let isLastInUser = true;
      let isLastInProject = true;

      if (i < flatRows.length - 1) {
        const next = flatRows[i + 1];
        if (next.userId === r.userId) {
          isLastInUser = false;
          if (next.projectId === r.projectId) {
            isLastInProject = false;
          }
        }
      }

      prevUserId = r.userId;
      prevProjectId = r.projectId;

      return { ...r, isFirstInUser, isFirstInProject, isLastInUser, isLastInProject };
    });

    return finalRows;
  }, [currentDate, dbMembers, dbProjects, records, attendanceRecords, confirmedDates]);

  const batchSaveDailyWorkRecords = async (drafts: DailyFlatRecord[], deletedIds: string[]) => {
    try {
      const upserts: any[] = [];
      const inserts: any[] = [];
      const deletes: string[] = [];

      // 1. 出欠・欠席連絡・サービス利用記録を member_attendance_records テーブルに保存
      const userAttendanceMap = new Map<string, { 
        status: string;
        contactDate: string;
        hasMeal: boolean;
        hasPickup: boolean;
        hasDropoff: boolean;
        remarks: string;
      }>();

      for (const r of drafts) {
        if (!userAttendanceMap.has(r.userId)) {
          userAttendanceMap.set(r.userId, {
            status: r.status || '通所利用',
            contactDate: r.contactDate || '',
            hasMeal: Boolean(r.hasMeal),
            hasPickup: Boolean(r.hasPickup),
            hasDropoff: Boolean(r.hasDropoff),
            remarks: r.remarks || ''
          });
        }
      }

      const attendanceUpserts = Array.from(userAttendanceMap.entries()).map(([memberId, s]) => {
        const existing = attendanceRecords.find(a => a.member_id === memberId && (a.office_id === selectedOfficeId || !a.office_id));
        const isAbsenteeSupported = Boolean(s.contactDate && s.status === '非利用／欠席');

        return {
          id: existing?.id,
          office_id: selectedOfficeId || null,
          target_period: currentDate,
          member_id: memberId,
          status: s.status,
          contact_date: s.contactDate ? s.contactDate : null,
          is_absentee_supported: isAbsenteeSupported,
          has_meal: s.hasMeal,
          has_pickup: s.hasPickup,
          has_dropoff: s.hasDropoff,
          remarks: s.remarks || null
        };
      });

      if (attendanceUpserts.length > 0) {
        const { error: aErr } = await supabase
          .from('member_attendance_records')
          .upsert(attendanceUpserts, { onConflict: 'target_period,member_id' });
        if (aErr) throw aErr;
      }

      // 2. 作業時間記録の保存
      for (const r of drafts) {
        const isRealRecord = r.isSaved || (!r.id.startsWith('UNSAVED-') && !r.id.startsWith('EMPTY-'));
        if (deletedIds.includes(r.id)) {
          if (isRealRecord) deletes.push(r.id);
          continue;
        }

        const workTimeNum = Number(r.workTime) || 0;

        if (r.projectId && r.taskId && workTimeNum > 0) {
          if (isRealRecord) {
            upserts.push({
              id: r.id,
              office_id: selectedOfficeId || null,
              target_period: currentDate,
              member_id: r.userId,
              task_id: r.taskId,
              work_time: workTimeNum
            });
          } else {
            inserts.push({
              office_id: selectedOfficeId || null,
              target_period: currentDate,
              member_id: r.userId,
              task_id: r.taskId,
              work_time: workTimeNum
            });
          }
        } else if (isRealRecord && workTimeNum === 0) {
          deletes.push(r.id);
        }
      }

      if (deletes.length > 0) {
        if (confirmedDates.includes(currentDate)) {
          throw new Error('確定済みの日の作業記録は削除できません。');
        }
        const { error } = await supabase.from('daily_work_records').delete().in('id', deletes);
        if (error) throw error;
      }
      
      if (upserts.length > 0) {
        const { error } = await supabase.from('daily_work_records').upsert(upserts);
        if (error) throw error;
      }

      if (inserts.length > 0) {
        const { error } = await supabase.from('daily_work_records').insert(inserts);
        if (error) throw error;
      }

      await fetchRecords(currentDate, selectedOfficeId);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchConfirmations = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('daily_work_confirmations').select('target_period').eq('is_confirmed', true);
      if (!error && data && data.length > 0) {
        const dbDates = data.map((d: any) => d.target_period);
        setConfirmedDates(prev => {
          const merged = Array.from(new Set([...prev, ...dbDates]));
          localStorage.setItem('daily_work_confirmations', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error('Error fetching daily work confirmations:', err);
    }
  }, []);

  const confirmDate = useCallback(async (date: string) => {
    try {
      setConfirmedDates(prev => {
        if (prev.includes(date)) return prev;
        const next = [...prev, date];
        localStorage.setItem('daily_work_confirmations', JSON.stringify(next));
        return next;
      });
      await supabase.from('daily_work_confirmations').upsert({ target_period: date, is_confirmed: true, confirmed_at: new Date().toISOString() }, { onConflict: 'target_period' });
    } catch (err) {
      console.error('Error confirming date:', err);
    }
  }, []);

  const unconfirmDate = useCallback(async (date: string) => {
    try {
      setConfirmedDates(prev => {
        const next = prev.filter(d => d !== date);
        localStorage.setItem('daily_work_confirmations', JSON.stringify(next));
        return next;
      });
      await supabase.from('daily_work_confirmations').delete().eq('target_period', date);
    } catch (err) {
      console.error('Error unconfirming date:', err);
    }
  }, []);

  return {
    dbMembers,
    dbProjects,
    records,
    attendanceRecords,
    loading,
    currentDate,
    setCurrentDate,
    displayData,
    confirmedDates,
    confirmDate,
    unconfirmDate,
    fetchConfirmations,
    fetchMasters,
    fetchRecords,
    batchSaveDailyWorkRecords
  };
}
