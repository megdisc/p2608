import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES } from '../constants';
import { supabase } from '../lib/supabase';
import { getCurrentISOString, formatJST } from '../utils/date';

type DisplayAssigneeRow = {
  id: string;
  assigneeName: string;
};

type DisplayTaskRow = {
  id: string;
  taskName: string;
  progressRate: number;
  assignees: DisplayAssigneeRow[];
};

type DisplayProjectRow = {
  id: string;
  projectName: string;
  tasks: DisplayTaskRow[];
};

export function ProjectSummaryPage() {
  const [data, setData] = useState<DisplayProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetDate] = useState(() => getCurrentISOString());

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [
          projectsRes,
          membersRes,
          clientsRes,
          staffsRes,
          progressRes
        ] = await Promise.all([
          supabase.from('projects').select(`
            id, name,
            project_tasks (
              id, name, is_deleted,
              project_task_assignees (
                id, member_id, client_id, staff_id
              )
            )
          `).eq('is_deleted', false),
          supabase.from('members').select('id, name').eq('is_deleted', false),
          supabase.from('clients').select('id, name').eq('is_deleted', false),
          supabase.from('staffs').select('id, name').eq('is_deleted', false),
          supabase.from('monthly_task_progress').select('task_id, current_progress, year_month')
        ]);

        if (projectsRes.error) throw projectsRes.error;
        if (membersRes.error) throw membersRes.error;
        if (clientsRes.error) throw clientsRes.error;
        if (staffsRes.error) throw staffsRes.error;
        if (progressRes.error) throw progressRes.error;

        const projects = projectsRes.data || [];
        const members = membersRes.data || [];
        const clients = clientsRes.data || [];
        const staffs = staffsRes.data || [];
        const records = progressRes.data || [];

        // Map作成
        const memberMap = new Map(members.map(m => [m.id, m.name]));
        const clientMap = new Map(clients.map(c => [c.id, c.name]));
        const staffMap = new Map(staffs.map(s => [s.id, s.name]));

        // task_id ごとに最新の進捗率を取得
        const latestProgressMap = new Map<string, number>();
        const sortedRecords = [...records].sort((a, b) => a.year_month.localeCompare(b.year_month));
        for (const r of sortedRecords) {
          latestProgressMap.set(r.task_id, Number(r.current_progress));
        }

        const projectRows: DisplayProjectRow[] = [];

        for (const p of projects) {
          const projectTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);
          
          if (projectTasks.length === 0) continue;

          const taskRows: DisplayTaskRow[] = [];
          
          for (const t of projectTasks) {
            const assignees = t.project_task_assignees || [];
            const assigneeRows: DisplayAssigneeRow[] = [];
            
            if (assignees.length === 0) {
              assigneeRows.push({
                id: `${p.id}_${t.id}_unassigned`,
                assigneeName: '未割り当て'
              });
            } else {
              for (const a of assignees) {
                let assigneeName = '不明';
                
                if (a.member_id) {
                  assigneeName = memberMap.get(a.member_id) || '不明';
                } else if (a.client_id) {
                  assigneeName = clientMap.get(a.client_id) || '不明';
                } else if (a.staff_id) {
                  assigneeName = staffMap.get(a.staff_id) || '不明';
                }

                assigneeRows.push({
                  id: a.id || `${p.id}_${t.id}_${a.member_id || a.client_id || a.staff_id}`,
                  assigneeName
                });
              }
            }

            assigneeRows.sort((a, b) => a.assigneeName.localeCompare(b.assigneeName));

            taskRows.push({
              id: t.id,
              taskName: t.name,
              progressRate: latestProgressMap.get(t.id) || 0,
              assignees: assigneeRows
            });
          }

          taskRows.sort((a, b) => a.taskName.localeCompare(b.taskName));

          projectRows.push({
            id: p.id,
            projectName: p.name,
            tasks: taskRows
          });
        }

        projectRows.sort((a, b) => a.projectName.localeCompare(b.projectName));

        setData(projectRows);
      } catch (err) {
        console.error('Error fetching project summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<any>[] = useMemo(() => [
    { 
      key: 'projectName', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      rowType: 'main'
    },
    { 
      key: 'taskName', 
      header: TABLE_COLUMNS.TASK, 
      rowType: 'sub'
    },
    { 
      key: 'progressRate', 
      header: TABLE_COLUMNS.PROGRESS_RATE, 
      className: 'quantity',
      rowType: 'sub',
      render: (item) => `${item.progressRate}%`
    },
    { 
      key: 'assigneeName', 
      header: TABLE_COLUMNS.ASSIGNEE,
      rowType: 'sub-sub'
    }
  ], []);

  if (loading) return <div>Loading...</div>;

  const formattedDate = formatJST(targetDate);

  return (
    <DataPage 
      title={PAGE_NAMES.PROJECT_SUMMARY}
      data={data}
      columns={columns}
      emptyMessage="案件の集計データがありません"
      footerLeft={<span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>集計日時：{formattedDate}</span>}
      subItemsKey="tasks"
      subSubItemsKey="assignees"
    />
  );
}
