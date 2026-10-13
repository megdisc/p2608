import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ProjectItem, BudgetCategory } from '../types';
import { WORDS_PROJECT } from '../constants';
import { useOffice } from '../contexts';

export type DetailItem = {
  id?: string;
  subject: string;
  taskId?: string;
  amount: number;
  summary?: string;
  remarks?: string;
};

export type ProjectDraft = {
  project: ProjectItem & { clientName?: string };
  revenues: DetailItem[];
  expenses: DetailItem[];
  reserves: DetailItem[];
};

export function useBudgetPlanning() {
  const [drafts, setDrafts] = useState<ProjectDraft[]>([]);
  const [originalDrafts, setOriginalDrafts] = useState<ProjectDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedOfficeId } = useOffice();

  const fetchBudgetPlanning = useCallback(async () => {
    try {
      setLoading(true);

      const [projectsRes, partnersRes, budgetsRes] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            id, office_id, code, name, project_type, client_id,
            project_tasks(id, name, is_deleted, assignee_type, is_completed, completed_at)
          `)
          .eq('is_deleted', false)
          .order('code'),
        supabase.from('partners').select('id, name'),
        supabase.from('project_budgets').select('*')
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;

      const items = (budgetsRes.data as any[]) || [];
      const partnersList = (partnersRes.data as any[]) || [];
      const clientMap = new Map<string, string>(partnersList.map((p: any) => [p.id, p.name]));

      let rawProjects = (projectsRes.data as any[]) || [];
      if (selectedOfficeId) {
        rawProjects = rawProjects.filter((p: any) => p.office_id === selectedOfficeId);
      }

      const initialDrafts: ProjectDraft[] = rawProjects
        .filter((p: any) => p.project_type !== 'other' && p.project_type !== 'その他')
        .map(p => {
        const clientName = (p.client_id && clientMap.get(p.client_id)) || '';
        const pItems = items.filter(b => b.project_id === p.id);

        const revSubjects = [WORDS_PROJECT.SUBJECT_REVENUE_SALES];
        const revenues = revSubjects.map(subj => {
          const dbItem = pItems.find(b => b.category === 'revenue' && b.subject === subj);
          return { id: dbItem?.id, subject: subj, amount: dbItem?.amount || 0, summary: clientName };
        });

        const activeTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);
        
        const expSubjects: { subject: string; taskId?: string; taskName?: string }[] = [];
        // 1. 材料費
        expSubjects.push({ subject: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, taskId: undefined });

        // 2. 経費
        expSubjects.push({ subject: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, taskId: undefined });

        // 3. 外注加工費
        const externalTasks = activeTasks.filter((t: any) => t.assignee_type === 'external');
        externalTasks.forEach((t: any) => {
          expSubjects.push({ subject: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE, taskId: t.id, taskName: t.name });
        });

        // 4. 労務費（利用者工賃以外）
        expSubjects.push({ subject: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER, taskId: undefined });

        // 5. 労務費（利用者工賃）
        const internalTasks = activeTasks.filter((t: any) => t.assignee_type !== 'external');
        internalTasks.forEach((t: any) => {
          expSubjects.push({ subject: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER, taskId: t.id, taskName: t.name });
        });

        const expenses = expSubjects.map((es: any) => {
          let dbItem;
          if (es.taskId) {
            dbItem = pItems.find(b => b.category === 'expense' && b.task_id === es.taskId);
          } else {
            dbItem = pItems.find(b => b.category === 'expense' && (
              b.subject === es.subject ||
              (es.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER && (b.subject === 'その他経費' || b.subject === '経費')) ||
              (es.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER && (b.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER || b.subject.startsWith('労務費（利用者工賃以外）') || b.subject.includes('その他')))
            ) && !b.task_id);
          }
          return {
            id: dbItem?.id,
            subject: es.subject,
            taskId: es.taskId,
            amount: dbItem?.amount || 0,
            summary: es.taskName || '-'
          };
        });

        const resSubjects = [WORDS_PROJECT.SUBJECT_RESERVE_WAGE, WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT];
        const reserves = resSubjects.map(subj => {
          const dbItem = pItems.find(b => b.category === 'reserve' && b.subject === subj);
          return { id: dbItem?.id, subject: subj, amount: dbItem?.amount || 0 };
        });

        return {
          project: {
            id: p.id,
            code: p.code || '',
            name: p.name,
            clientName,
            projectType: p.project_type,
            tasks: activeTasks.map((t: any) => ({
              id: t.id,
              task: t.name,
              isCompleted: t.is_completed || false,
              completedAt: t.completed_at,
              requiredSkills: []
            }))
          },
          revenues,
          expenses,
          reserves
        };
      });

      setDrafts(initialDrafts);
      setOriginalDrafts(JSON.parse(JSON.stringify(initialDrafts)));
    } catch (error) {
      console.error('Error fetching budget data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveBudgets = async (currentDrafts: ProjectDraft[]) => {
    try {
      setLoading(true);
      const upserts: any[] = [];

      for (const draft of currentDrafts) {
        if (draft.project.id) {
          const { error: projErr } = await supabase
            .from('projects')
            .update({ project_type: draft.project.projectType || 'one-off' })
            .eq('id', draft.project.id);
          if (projErr) throw projErr;
        }

        const processCategory = (items: DetailItem[], category: BudgetCategory) => {
          for (const item of items) {
            upserts.push({
              id: item.id || undefined,
              project_id: draft.project.id,
              category,
              subject: item.subject,
              task_id: item.taskId || null,
              amount: Number(item.amount) || 0
            });
          }
        };

        processCategory(draft.revenues, 'revenue');
        processCategory(draft.expenses, 'expense');
        processCategory(draft.reserves, 'reserve');
      }

      for (const payload of upserts) {
        if (payload.id) {
          const { error } = await supabase.from('project_budgets').update({ amount: payload.amount }).eq('id', payload.id);
          if (error) throw error;
        } else {
          const { id, ...insertPayload } = payload;
          const { error } = await supabase.from('project_budgets').insert(insertPayload);
          if (error) throw error;
        }
      }

      await fetchBudgetPlanning();
    } catch (error) {
      console.error('Error saving budget data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    drafts,
    setDrafts,
    originalDrafts,
    setOriginalDrafts,
    loading,
    fetchBudgetPlanning,
    batchSaveBudgets
  };
}
