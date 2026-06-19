import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES } from '../constants';
import { supabase } from '../lib/supabase';
import { getCurrentISOString, formatJST } from '../utils/date';

type SummaryRow = {
  id: string; // 一意のID
  projectName: string;
  taskName: string;
  progressRate: number;
  assigneeName: string;
};

export function ProjectSummaryPage() {
  const [data, setData] = useState<SummaryRow[]>([]);
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
          supabase.from('monthly_progress_records').select('member_id, task_id, current_progress, year_month')
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

        // task_id + member_id ごとに最新の進捗率を取得
        const latestProgressMap = new Map<string, number>();
        const sortedRecords = [...records].sort((a, b) => a.year_month.localeCompare(b.year_month));
        for (const r of sortedRecords) {
          const key = `${r.task_id}_${r.member_id}`;
          latestProgressMap.set(key, Number(r.current_progress));
        }

        const rows: SummaryRow[] = [];

        for (const p of projects) {
          const tasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);
          for (const t of tasks) {
            const assignees = t.project_task_assignees || [];
            if (assignees.length === 0) {
              rows.push({
                id: `${p.id}_${t.id}_unassigned`,
                projectName: p.name,
                taskName: t.name,
                progressRate: 0,
                assigneeName: '未割り当て'
              });
              continue;
            }

            for (const a of assignees) {
              let assigneeName = '不明';
              let progressRate = 0;
              
              if (a.member_id) {
                assigneeName = memberMap.get(a.member_id) || '不明';
                const pKey = `${t.id}_${a.member_id}`;
                progressRate = latestProgressMap.get(pKey) || 0;
              } else if (a.client_id) {
                assigneeName = clientMap.get(a.client_id) || '不明';
              } else if (a.staff_id) {
                assigneeName = staffMap.get(a.staff_id) || '不明';
              }

              rows.push({
                id: a.id || `${p.id}_${t.id}_${a.member_id || a.client_id || a.staff_id}`,
                projectName: p.name,
                taskName: t.name,
                progressRate,
                assigneeName
              });
            }
          }
        }

        // ソート: 案件名 -> タスク名 -> 担当者名
        rows.sort((a, b) => {
          if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName);
          if (a.taskName !== b.taskName) return a.taskName.localeCompare(b.taskName);
          return a.assigneeName.localeCompare(b.assigneeName);
        });

        setData(rows);
      } catch (err) {
        console.error('Error fetching project summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<SummaryRow>[] = useMemo(() => [
    { key: 'projectName', header: TABLE_COLUMNS.PROJECT_NAME },
    { key: 'taskName', header: TABLE_COLUMNS.TASK },
    { 
      key: 'progressRate', 
      header: TABLE_COLUMNS.PROGRESS_RATE, 
      className: 'quantity',
      render: (item) => `${item.progressRate}%`
    },
    { key: 'assigneeName', header: TABLE_COLUMNS.ASSIGNEE }
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
    />
  );
}
