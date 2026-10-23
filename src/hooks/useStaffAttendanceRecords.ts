import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib';
import { useOffice } from '../contexts';
import { getCurrentJSTDateOnly } from '../utils';
import type { StaffAttendanceRecordRow } from '../types';

export function computeActualWorkHours(start: string, end: string, breakMin: number | string): number {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;
  
  const startTotal = sH * 60 + sM;
  const endTotal = eH * 60 + eM;
  if (endTotal <= startTotal) return 0;
  
  const bMin = Number(breakMin) || 0;
  const netMinutes = endTotal - startTotal - bMin;
  if (netMinutes <= 0) return 0;
  
  return Math.round((netMinutes / 60) * 10) / 10;
}

export function useStaffAttendanceRecords() {
  const { selectedOfficeId } = useOffice();
  const [currentDate, setCurrentDate] = useState<string>(getCurrentJSTDateOnly());
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<StaffAttendanceRecordRow[]>([]);

  const fetchRecords = useCallback(async (date: string, officeId: string | null) => {
    try {
      setLoading(true);

      // 1. 職員マスタの取得
      const staffsRes = await supabase
        .from('staffs')
        .select('id, code, name, yomigana')
        .eq('is_deleted', false)
        .order('code', { ascending: true });

      if (staffsRes.error) throw staffsRes.error;
      const allStaffs = staffsRes.data || [];

      // 2. 所属事業所・勤務形態情報の取得（事業所が選択されている場合）
      let targetStaffs = allStaffs;
      const defaultRoleMap = new Map<string, string>();

      if (officeId) {
        // 事業所職員割当 (office_staff_settings)
        const ossRes = await supabase
          .from('office_staff_settings')
          .select('id, staff_id')
          .eq('office_id', officeId);

        if (!ossRes.error && ossRes.data && ossRes.data.length > 0) {
          const settingStaffIds = new Set(ossRes.data.map(o => o.staff_id));
          targetStaffs = allStaffs.filter(s => settingStaffIds.has(s.id));

          // 勤務形態からデフォルト職種を引く
          const settingIds = ossRes.data.map(o => o.id);
          const workStyleRes = await supabase
            .from('staff_work_style_summaries')
            .select('office_staff_setting_id, staff_work_style_details(staff_role)')
            .in('office_staff_setting_id', settingIds);

          if (!workStyleRes.error && workStyleRes.data) {
            const settingToStaffMap = new Map(ossRes.data.map(o => [o.id, o.staff_id]));
            for (const ws of workStyleRes.data as any[]) {
              const staffId = settingToStaffMap.get(ws.office_staff_setting_id);
              if (staffId && ws.staff_work_style_details && ws.staff_work_style_details.length > 0) {
                const firstRole = ws.staff_work_style_details[0].staff_role;
                if (firstRole && !defaultRoleMap.has(staffId)) {
                  defaultRoleMap.set(staffId, firstRole);
                }
              }
            }
          }
        }
      }

      // 3. 当日の勤務実績レコード (staff_attendance_records) の取得
      let query = supabase
        .from('staff_attendance_records')
        .select('*')
        .eq('work_date', date);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const attendanceRes = await query;
      if (attendanceRes.error) throw attendanceRes.error;
      const dbAttendance = attendanceRes.data || [];
      const attendanceMap = new Map(dbAttendance.map((a: any) => [a.staff_id, a]));

      // 4. 行データのマッピング
      const rows: StaffAttendanceRecordRow[] = targetStaffs.map(staff => {
        const att = attendanceMap.get(staff.id);
        const defaultRole = defaultRoleMap.get(staff.id) || '';

        if (att) {
          const startTime = att.start_time ? String(att.start_time).substring(0, 5) : '';
          const endTime = att.end_time ? String(att.end_time).substring(0, 5) : '';
          const breakMin = att.break_minutes ?? 60;
          const assignedRole = att.assigned_role || defaultRole;
          const actualHours = computeActualWorkHours(startTime, endTime, breakMin);

          return {
            id: att.id,
            office_id: att.office_id || officeId || '',
            staff_id: staff.id,
            staff_code: staff.code || '',
            staff_name: staff.name || '',
            staff_yomigana: staff.yomigana || '',
            default_role: defaultRole,
            date: date,
            work_date: date,
            start_time: startTime,
            end_time: endTime,
            break_minutes: breakMin,
            assigned_role: assignedRole,
            actual_work_hours: actualHours,
            is_saved: true,
          };
        } else {
          return {
            id: `TMP-${staff.id}`,
            office_id: officeId || '',
            staff_id: staff.id,
            staff_code: staff.code || '',
            staff_name: staff.name || '',
            staff_yomigana: staff.yomigana || '',
            default_role: defaultRole,
            date: date,
            work_date: date,
            start_time: '',
            end_time: '',
            break_minutes: 60,
            assigned_role: defaultRole,
            actual_work_hours: 0,
            is_saved: false,
          };
        }
      });

      setRecords(rows);
    } catch (err) {
      console.error('Error fetching staff attendance records:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(currentDate, selectedOfficeId).catch(console.error);
  }, [fetchRecords, currentDate, selectedOfficeId]);

  const batchSaveStaffAttendanceRecords = async (drafts: StaffAttendanceRecordRow[], deletedIds: string[]) => {
    try {
      const upserts: any[] = [];
      const deletes: string[] = [];

      // 削除対象
      for (const id of deletedIds) {
        if (!id.startsWith('TMP-')) {
          deletes.push(id);
        }
      }

      // ドラフトの保存判定
      for (const d of drafts) {
        const isReal = !d.id.startsWith('TMP-');
        const hasTime = (d.start_time && d.start_time.trim() !== '') || (d.end_time && d.end_time.trim() !== '');

        if (hasTime) {
          const payload: any = {
            office_id: d.office_id || selectedOfficeId || null,
            staff_id: d.staff_id,
            work_date: currentDate,
            start_time: d.start_time ? `${d.start_time}:00` : null,
            end_time: d.end_time ? `${d.end_time}:00` : null,
            break_minutes: Number(d.break_minutes) || 0,
            assigned_role: d.assigned_role || null,
          };
          if (isReal) {
            payload.id = d.id;
          }
          upserts.push(payload);
        } else if (isReal && !hasTime) {
          // 入力が消された既存レコードは削除
          deletes.push(d.id);
        }
      }

      if (deletes.length > 0) {
        const { error: delErr } = await supabase
          .from('staff_attendance_records')
          .delete()
          .in('id', deletes);
        if (delErr) throw delErr;
      }

      if (upserts.length > 0) {
        const { error: upErr } = await supabase
          .from('staff_attendance_records')
          .upsert(upserts);
        if (upErr) throw upErr;
      }

      await fetchRecords(currentDate, selectedOfficeId);
    } catch (err) {
      console.error('Error saving staff attendance records:', err);
      throw err;
    }
  };

  // 定時（09:00〜18:00、休憩60分）一括適用
  const applyDefaultScheduleToAll = useCallback((currentRows: StaffAttendanceRecordRow[]): StaffAttendanceRecordRow[] => {
    return currentRows.map(row => {
      const startTime = row.start_time || '09:00';
      const endTime = row.end_time || '18:00';
      const breakMin = row.break_minutes || 60;
      const actual = computeActualWorkHours(startTime, endTime, breakMin);
      return {
        ...row,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMin,
        actual_work_hours: actual,
      };
    });
  }, []);

  // 全クリア
  const clearAllSchedule = useCallback((currentRows: StaffAttendanceRecordRow[]): StaffAttendanceRecordRow[] => {
    return currentRows.map(row => ({
      ...row,
      start_time: '',
      end_time: '',
      break_minutes: 60,
      actual_work_hours: 0,
    }));
  }, []);

  return {
    currentDate,
    setCurrentDate,
    loading,
    records,
    setRecords,
    fetchRecords: () => fetchRecords(currentDate, selectedOfficeId),
    batchSaveStaffAttendanceRecords,
    applyDefaultScheduleToAll,
    clearAllSchedule,
  };
}
