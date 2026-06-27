import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ProjectItem, BudgetCategory } from '../types';
import { WORDS_PROJECT } from '../constants';

export type DetailItem = {
  id?: string;
  subject: string;
  taskId?: string;
  amount: number;
};

export type ProjectDraft = {
  project: ProjectItem;
  revenues: DetailItem[];
  expenses: DetailItem[];
  reserves: DetailItem[];
};

export function useBudgetPlanning() {
  const [drafts, setDrafts] = useState<ProjectDraft[]>([]);
  const [originalDrafts, setOriginalDrafts] = useState<ProjectDraft[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBudgetPlanning = useCallback(async () => {
    try {
      setLoading(true);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, yomigana, project_type,
          project_tasks(id, name, yomigana, is_deleted)
        `)
        .eq('is_deleted', false)
        .order('yomigana');

      if (projectsError) throw projectsError;

      const { data: budgetsData, error: budgetsError } = await supabase
        .from('project_budget_items')
        .select('*');

      if (budgetsError) throw budgetsError;

      const items = (budgetsData as any[]) || [];

      const initialDrafts: ProjectDraft[] = (projectsData as any[]).map(p => {
        const pItems = items.filter(b => b.project_id === p.id);

        const revSubjects = [WORDS_PROJECT.SUBJECT_REVENUE_SALES, WORDS_PROJECT.SUBJECT_REVENUE_OTHER];
        const revenues = revSubjects.map(subj => {
          const dbItem = pItems.find(b => b.category === 'revenue' && b.subject === subj);
          return { id: dbItem?.id, subject: subj, amount: dbItem?.amount || 0 };
        });

        const activeTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);
        const expSubjects = activeTasks.map((t: any) => ({
          subject: `${WORDS_PROJECT.SUBJECT_EXPENSE_LABOR}（${t.name}）`,
          taskId: t.id
        }));
        expSubjects.push({ subject: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, taskId: undefined });

        const expenses = expSubjects.map(es => {
          let dbItem;
          if (es.taskId) {
            dbItem = pItems.find(b => b.category === 'expense' && b.task_id === es.taskId);
          } else {
            dbItem = pItems.find(b => b.category === 'expense' && b.subject === es.subject && !b.task_id);
          }
          return { id: dbItem?.id, subject: es.subject, taskId: es.taskId, amount: dbItem?.amount || 0 };
        });

        const resSubjects = [WORDS_PROJECT.SUBJECT_RESERVE_WAGE, WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT];
        const reserves = resSubjects.map(subj => {
          const dbItem = pItems.find(b => b.category === 'reserve' && b.subject === subj);
          return { id: dbItem?.id, subject: subj, amount: dbItem?.amount || 0 };
        });

        return {
          project: {
            id: p.id,
            name: p.name,
            yomigana: p.yomigana,
            projectType: p.project_type,
            startDate: '',
            endDate: null,
            tasks: []
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
          const { error } = await supabase.from('project_budget_items').update({ amount: payload.amount }).eq('id', payload.id);
          if (error) throw error;
        } else {
          const { id, ...insertPayload } = payload;
          const { error } = await supabase.from('project_budget_items').insert(insertPayload);
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
