import { useState, useMemo, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { Button } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { supabase } from '../lib/supabase';
import type { MemberItem, ProjectItem } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { getCurrentJSTMonth, getPreviousMonth } from '../utils/date';

type MonthlyRecord = {
  id: string;
  year_month: string;
  member_id: string;
  task_id: string;
  current_progress: number;
  contribution_ratio: number;
};

type DisplaySubRow = {
  id: string;
  projectId: string;
  taskId: string;
  prevProgress: string | number;
  currentProgress: number;
  workTime: number;
  contributionRatio: number;
  isSaved: boolean;
};

type DisplayUserRow = {
  id: string;
  userId: string;
  userName: string;
  yearMonth: string;
  records: DisplaySubRow[];
};

export function ProgressRecordPage() {
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);
  const [currentMonthRecords, setCurrentMonthRecords] = useState<MonthlyRecord[]>([]);
  const [prevMonthRecords, setPrevMonthRecords] = useState<MonthlyRecord[]>([]);
  const [workTimeSummary, setWorkTimeSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  // マスターデータ取得
  useEffect(() => {
    async function fetchMasters() {
      try {
        setLoading(true);
        const [membersRes, projectsRes] = await Promise.all([
          supabase.from('members').select('*').eq('is_deleted', false),
          supabase.from('projects').select(`
            id, name, start_date, end_date,
            project_tasks (
              id, name, assignee_type, is_deleted,
              project_task_assignees ( member_id )
            )
          `).eq('is_deleted', false)
        ]);

        if (membersRes.error) throw membersRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setDbMembers(membersRes.data || []);
        
        const formattedProjects = (projectsRes.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          startDate: p.start_date,
          endDate: p.end_date,
          tasks: (p.project_tasks || [])
            .filter((pt: any) => !pt.is_deleted)
            .map((pt: any) => ({
              id: pt.id,
              task: pt.name,
              assigneeIds: (pt.project_task_assignees || [])
                .map((pta: any) => pta.member_id)
                .filter(Boolean)
            }))
        }));
        setDbProjects(formattedProjects as ProjectItem[]);

      } catch (error) {
        console.error('Error fetching masters:', error);
        showAlert('データ取得に失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMasters();
  }, []);

  // 選択された月のデータと前月のデータを取得
  const fetchRecords = async (monthStr: string) => {
    try {
      setLoading(true);
      const prevMonthStr = getPreviousMonth(monthStr);

      const [currentRes, prevRes, workTimeRes] = await Promise.all([
        supabase.from('monthly_progress_records').select('*').eq('year_month', monthStr),
        supabase.from('monthly_progress_records').select('*').eq('year_month', prevMonthStr),
        // 月ごとの作業時間を集計するため、daily_work_records を取得 (YYYY-MM の前方一致)
        supabase.from('daily_work_records').select('member_id, task_id, work_time').like('date', `${monthStr}-%`)
      ]);
      
      if (currentRes.error) throw currentRes.error;
      if (prevRes.error) throw prevRes.error;
      if (workTimeRes.error) throw workTimeRes.error;

      setCurrentMonthRecords(currentRes.data || []);
      setPrevMonthRecords(prevRes.data || []);

      // 作業時間の集計
      const timeMap: Record<string, number> = {};
      (workTimeRes.data || []).forEach((r: any) => {
        const key = `${r.member_id}_${r.task_id}`;
        timeMap[key] = (timeMap[key] || 0) + Number(r.work_time);
      });
      setWorkTimeSummary(timeMap);

    } catch (error) {
      console.error('Error fetching records:', error);
      showAlert('進捗記録の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbMembers.length > 0) {
      fetchRecords(currentMonth);
    }
  }, [currentMonth, dbMembers]);

  // 表示用データの生成（実績＋アサイン済みタスクまたは作業時間があるタスク）
  const displayData = useMemo(() => {
    if (dbMembers.length === 0) return [];
    
    // 対象月の末日を取得してアクティブ判定に使う
    const [year, month] = currentMonth.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const lastDayStr = `${year}-${month}-${lastDay.getDate().toString().padStart(2, '0')}`;
    const firstDayStr = `${year}-${month}-01`;
    
    // 月内に一部でも被っているプロジェクト
    const activeProjects = dbProjects.filter(p => p.startDate <= lastDayStr && firstDayStr <= p.endDate);
    const rows: DisplayUserRow[] = [];

    for (const member of dbMembers) {
      const userRecords = currentMonthRecords.filter(r => r.member_id === member.id);
      const taskMap = new Map<string, DisplaySubRow>();

      // 1. 保存済みの進捗実績をセット
      for (const r of userRecords) {
        let projectId = '';
        for (const p of dbProjects) {
          if (p.tasks.some(t => t.id === r.task_id)) {
            projectId = p.id;
            break;
          }
        }
        
        const prevRec = prevMonthRecords.find(pr => pr.task_id === r.task_id && pr.member_id === member.id);
        const prevProgress = prevRec ? prevRec.current_progress : '-';
        const workTime = workTimeSummary[`${member.id}_${r.task_id}`] || 0;
        
        taskMap.set(r.task_id, {
          id: r.id,
          projectId,
          taskId: r.task_id,
          prevProgress,
          currentProgress: Number(r.current_progress),
          workTime,
          contributionRatio: Number(r.contribution_ratio),
          isSaved: true
        });
      }

      // 2. 現在の割り当てタスク、または今月作業時間があるタスクをセット（未保存のもの）
      for (const p of activeProjects) {
        for (const t of p.tasks) {
          const hasWorkTime = (workTimeSummary[`${member.id}_${t.id}`] || 0) > 0;
          if ((t.assigneeIds?.includes(member.id) || hasWorkTime) && !taskMap.has(t.id)) {
            const prevRec = prevMonthRecords.find(pr => pr.task_id === t.id && pr.member_id === member.id);
            const prevProgress = prevRec ? prevRec.current_progress : '-';
            const workTime = workTimeSummary[`${member.id}_${t.id}`] || 0;

            taskMap.set(t.id, {
              id: `UNSAVED-${currentMonth}-${member.id}-${t.id}`,
              projectId: p.id,
              taskId: t.id,
              prevProgress,
              currentProgress: prevRec ? Number(prevRec.current_progress) : 0, // デフォルトは前月と同じか0
              workTime,
              contributionRatio: 0,
              isSaved: false
            });
          }
        }
      }

      const subRows = Array.from(taskMap.values());

      rows.push({
        id: member.id,
        userId: member.id,
        userName: member.name,
        yearMonth: currentMonth,
        records: subRows
      });
    }

    return rows;
  }, [currentMonth, dbMembers, dbProjects, currentMonthRecords, prevMonthRecords, workTimeSummary]);

  const columns: Column<any>[] = [
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.USER_NAME, 
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbMembers.map(u => ({ label: u.name, value: u.id }))],
      render: (item: any) => dbMembers.find(u => u.id === item.userId)?.name || '',
      rowType: 'main'
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: true, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => dbProjects.find(p => p.id === item.projectId)?.name || '',
      rowType: 'sub',
      mainRender: (_item: any, addSubRow?: () => void) => (
        <Button 
          onClick={addSubRow}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          ＋ 案件追加
        </Button>
      ),
      onCellChange: () => ({ taskId: '' })
    },
    { 
      key: 'taskId', 
      header: TABLE_COLUMNS.TASK, 
      editable: true, 
      inputType: 'select',
      options: (item: any) => {
        const project = dbProjects.find(p => p.id === item.projectId);
        const taskOptions = project ? project.tasks.map(t => ({ label: t.task, value: t.id })) : [];
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        return task?.task || '';
      },
      rowType: 'sub'
    },
    { 
      key: 'prevProgress', 
      header: TABLE_COLUMNS.PREV_MONTH_PROGRESS, 
      editable: false,
      rowType: 'sub',
      style: { width: '120px', textAlign: 'right' }
    },
    { 
      key: 'currentProgress', 
      header: TABLE_COLUMNS.CURRENT_MONTH_PROGRESS, 
      editable: true,
      inputType: 'number',
      rowType: 'sub',
      style: { width: '120px' }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.CURRENT_MONTH_WORK_TIME, 
      editable: false,
      rowType: 'sub',
      style: { width: '120px', textAlign: 'right' }
    },
    { 
      key: 'contributionRatio', 
      header: TABLE_COLUMNS.CONTRIBUTION_RATIO, 
      editable: true,
      inputType: 'number',
      rowType: 'sub',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: DisplayUserRow[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      const upserts: any[] = [];
      const deletes: string[] = [];

      for (const userRow of drafts) {
        if (deletedIds.includes(userRow.id)) continue;

        for (const r of userRow.records) {
          if (deletedIds.includes(r.id)) {
            if (r.isSaved) deletes.push(r.id);
            continue;
          }

          if (r.projectId && r.taskId) {
            upserts.push({
              ...(r.isSaved ? { id: r.id } : {}),
              year_month: currentMonth,
              member_id: userRow.userId,
              task_id: r.taskId,
              current_progress: r.currentProgress || 0,
              contribution_ratio: r.contributionRatio || 0
            });
          }
        }
      }

      if (deletes.length > 0) {
        const { error } = await supabase.from('monthly_progress_records').delete().in('id', deletes);
        if (error) throw error;
      }
      
      if (upserts.length > 0) {
        const { error } = await supabase.from('monthly_progress_records').upsert(upserts, { onConflict: 'year_month,member_id,task_id' });
        if (error) throw error;
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchRecords(currentMonth);
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    return null; // メイン行は全利用者を自動表示するため手動追加は不要
  };

  const handleAddSubRow = (_parentId: string) => {
    return {
      id: `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      projectId: '',
      taskId: '',
      prevProgress: '-',
      currentProgress: 0,
      workTime: 0,
      contributionRatio: 0,
      isSaved: false
    };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.PROGRESS_RECORD}
      data={displayData}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_PROGRESS_RECORD}
      onBatchSave={handleBatchSave}
      showMonthFilter={true}
      singleMonth={currentMonth}
      onSingleMonthChange={setCurrentMonth}
      onAddRow={handleAddRow}
      subItemsKey="records"
      onAddSubRow={handleAddSubRow}
    />
  );
}
