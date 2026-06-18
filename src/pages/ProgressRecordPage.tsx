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
  taskId: string;
  userId: string;
  prevProgress: string | number;
  currentProgress: number;
  workTime: number;
  contributionRatio: number;
  isSaved: boolean;
};

type DisplayProjectRow = {
  id: string;
  projectId: string;
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

  const fetchRecords = async (monthStr: string) => {
    try {
      setLoading(true);
      const prevMonthStr = getPreviousMonth(monthStr);

      const [year, month] = monthStr.split('-').map(Number);
      const startDate = `${monthStr}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      const [currentRes, prevRes, workTimeRes] = await Promise.all([
        supabase.from('monthly_progress_records').select('*').eq('year_month', monthStr),
        supabase.from('monthly_progress_records').select('*').eq('year_month', prevMonthStr),
        supabase.from('daily_work_records').select('member_id, task_id, work_time').gte('date', startDate).lt('date', endDate)
      ]);
      
      if (currentRes.error) throw currentRes.error;
      if (prevRes.error) throw prevRes.error;
      if (workTimeRes.error) throw workTimeRes.error;

      setCurrentMonthRecords(currentRes.data || []);
      setPrevMonthRecords(prevRes.data || []);

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
    if (dbProjects.length > 0) {
      fetchRecords(currentMonth);
    }
  }, [currentMonth, dbProjects]);

  const displayData = useMemo(() => {
    if (dbProjects.length === 0) return [];
    

    
    const rows: DisplayProjectRow[] = [];

    for (const project of dbProjects) {
      const taskIdsInProject = project.tasks.map(t => t.id);
      const projectRecords = currentMonthRecords.filter(r => taskIdsInProject.includes(r.task_id));
      
      const taskMap = new Map<string, DisplaySubRow>();

      for (const t of project.tasks) {
        const membersToProcess = new Set<string>(t.assigneeIds || []);
        
        // 今月作業時間があるメンバーを追加
        for (const member of dbMembers) {
          if ((workTimeSummary[`${member.id}_${t.id}`] || 0) > 0) {
            membersToProcess.add(member.id);
          }
        }

        // 今月の保存済み進捗記録があるメンバーを追加
        const taskRecords = projectRecords.filter(r => r.task_id === t.id);
        for (const r of taskRecords) {
          membersToProcess.add(r.member_id);
        }

        for (const memberId of membersToProcess) {
          const mapKey = `${t.id}_${memberId}`;
          const savedRecord = taskRecords.find(r => r.member_id === memberId);
          const prevRec = prevMonthRecords.find(pr => pr.task_id === t.id && pr.member_id === memberId);
          const prevProgress = prevRec ? prevRec.current_progress : '-';
          const workTime = workTimeSummary[`${memberId}_${t.id}`] || 0;

          if (savedRecord) {
            taskMap.set(mapKey, {
              id: savedRecord.id,
              taskId: t.id,
              userId: memberId,
              prevProgress,
              currentProgress: Number(savedRecord.current_progress),
              workTime,
              contributionRatio: Number(savedRecord.contribution_ratio),
              isSaved: true
            });
          } else {
            taskMap.set(mapKey, {
              id: `UNSAVED-${currentMonth}-${memberId}-${t.id}`,
              taskId: t.id,
              userId: memberId,
              prevProgress,
              currentProgress: prevRec ? Number(prevRec.current_progress) : 0,
              workTime,
              contributionRatio: 0,
              isSaved: false
            });
          }
        }
      }

      const subRows = Array.from(taskMap.values());

      rows.push({
        id: project.id,
        projectId: project.id,
        yearMonth: currentMonth,
        records: subRows
      });
    }

    return rows;
  }, [currentMonth, dbMembers, dbProjects, currentMonthRecords, prevMonthRecords, workTimeSummary]);

  const columns: Column<any>[] = [
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => dbProjects.find(p => p.id === item.projectId)?.name || '',
      rowType: 'main'
    },
    { 
      key: 'taskId', 
      header: TABLE_COLUMNS.TASK, 
      editable: true, 
      inputType: 'select',
      options: (_item: any) => {
        // subRowから直接projectIdが取れないため、dbProjects全体から該当タスクを探す
        const taskOptions = dbProjects.flatMap(p => p.tasks).map(t => ({ label: t.task, value: t.id }));
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        const task = dbProjects.flatMap(p => p.tasks).find(t => t.id === item.taskId);
        return task?.task || '';
      },
      rowType: 'sub',
      mainRender: (_item: any, addSubRow?: () => void) => (
        <Button 
          onClick={addSubRow}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          ＋ 担当者・タスク追加
        </Button>
      ),
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
      key: 'userId', 
      header: TABLE_COLUMNS.USER_NAME, 
      editable: true, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbMembers.map(u => ({ label: u.name, value: u.id }))],
      render: (item: any) => dbMembers.find(u => u.id === item.userId)?.name || '',
      rowType: 'sub'
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

  const handleBatchSave = async (drafts: DisplayProjectRow[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      const upserts: any[] = [];
      const deletes: string[] = [];

      for (const projectRow of drafts) {
        if (deletedIds.includes(projectRow.id)) continue;

        for (const r of projectRow.records) {
          if (deletedIds.includes(r.id)) {
            if (r.isSaved) deletes.push(r.id);
            continue;
          }

          if (r.taskId && r.userId) {
            upserts.push({
              ...(r.isSaved ? { id: r.id } : {}),
              year_month: currentMonth,
              member_id: r.userId,
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

  const handleAddRow = () => {
    return {
      id: `TEMP-MAIN-${Date.now()}`,
      projectId: '',
      yearMonth: currentMonth,
      records: []
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
      subItemsKey="records"
      onAddRow={handleAddRow}
      onAddSubRow={handleAddSubRow}
      disableAddButton={true}
    />
  );
}
