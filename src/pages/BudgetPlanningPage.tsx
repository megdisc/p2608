import { useState, useEffect } from 'react';
import { DataPage } from '../components/page/DataPage';
import type { Column } from '../components/ui';
import type { ProjectBudget, ProjectItem } from '../types';
import { PAGE_NAMES, TABLE_COLUMNS, MESSAGES, PLACEHOLDERS } from '../constants';
import { supabase } from '../lib/supabase';

export function BudgetPlanningPage() {
  const [data, setData] = useState<ProjectBudget[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
        
      if (projectsError) throw projectsError;
      setProjects((projectsData as unknown as ProjectItem[]) || []);

      const { data: budgetsData, error: budgetsError } = await supabase
        .from('project_budgets')
        .select('*');

      if (budgetsError) throw budgetsError;

      const formattedData: ProjectBudget[] = (budgetsData || []).map(b => ({
        id: b.id,
        projectId: b.project_id,
        revenueSubject: b.revenue_subject || 'システム開発売上',
        revenueAmount: b.revenue_amount,
        expenseSubject: b.expense_subject || '人件費・インセンティブ',
        expenseAmount: b.expense_amount,
        reserveSubject: b.reserve_subject || 'システム保守積立',
        reserveAmount: b.reserve_amount,
        surplusSubject: b.surplus_subject || '営業利益',
        surplusAmount: b.surplus_amount,
      }));
      
      // Assign project names
      formattedData.forEach(b => {
        const p = projectsData?.find((proj: any) => proj.id === b.projectId);
        if (p) {
          b.projectName = p.name;
        }
      });

      setData(formattedData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      alert(MESSAGES.FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSave = async (drafts: ProjectBudget[], deletedIds: string[]) => {
    try {
      // Delete removed rows
      for (const id of deletedIds) {
        const { error } = await supabase.from('project_budgets').delete().eq('id', id);
        if (error) throw error;
      }

      // Upsert drafts
      for (const draft of drafts) {
        if (!draft.projectId) continue;
        const payload = {
          project_id: draft.projectId,
          revenue_subject: draft.revenueSubject,
          revenue_amount: draft.revenueAmount,
          expense_subject: draft.expenseSubject,
          expense_amount: draft.expenseAmount,
          reserve_subject: draft.reserveSubject,
          reserve_amount: draft.reserveAmount,
          surplus_subject: draft.surplusSubject,
          surplus_amount: draft.surplusAmount,
        };

        if (draft.id && !draft.id.startsWith('new-')) {
          const { error } = await supabase
            .from('project_budgets')
            .update(payload)
            .eq('id', draft.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('project_budgets')
            .insert(payload);
          if (error) throw error;
        }
      }

      await fetchData();
      alert(MESSAGES.SAVE_SUCCESS);
    } catch (error) {
      console.error('Error saving budget data:', error);
      alert(MESSAGES.SAVE_ERROR);
    }
  };

  const handleAddRow = (): ProjectBudget => {
    return {
      id: `new-${Date.now()}`,
      projectId: '',
      revenueSubject: 'システム開発売上',
      revenueAmount: 0,
      expenseSubject: '人件費・インセンティブ',
      expenseAmount: 0,
      reserveSubject: 'システム保守積立',
      reserveAmount: 0,
      surplusSubject: '営業利益',
      surplusAmount: 0,
    };
  };

  const columns: Column<ProjectBudget>[] = [
    {
      key: 'projectId',
      header: TABLE_COLUMNS.PROJECT_NAME,
      editable: (item) => item.id.startsWith('new-'), // Only editable for new rows
      inputType: 'select',
      options: [
        { label: PLACEHOLDERS.SELECT, value: '' },
        ...projects.map(p => ({ label: p.name, value: p.id }))
      ],
      render: (item) => item.projectName || '',
      style: { minWidth: '200px' }
    },
    // Revenue
    {
      key: 'revenueSubject',
      header: `${TABLE_COLUMNS.REVENUE} - ${TABLE_COLUMNS.SUBJECT}`,
      editable: false,
      render: (item) => item.revenueSubject,
      style: { backgroundColor: 'var(--color-bg-subtle)' }
    },
    {
      key: 'revenueAmount',
      header: `${TABLE_COLUMNS.REVENUE} - ${TABLE_COLUMNS.AMOUNT}`,
      editable: true,
      inputType: 'currency',
      style: { textAlign: 'right' }
    },
    // Expense
    {
      key: 'expenseSubject',
      header: `${TABLE_COLUMNS.EXPENSE} - ${TABLE_COLUMNS.SUBJECT}`,
      editable: false,
      render: (item) => item.expenseSubject,
      style: { backgroundColor: 'var(--color-bg-subtle)' }
    },
    {
      key: 'expenseAmount',
      header: `${TABLE_COLUMNS.EXPENSE} - ${TABLE_COLUMNS.AMOUNT}`,
      editable: true,
      inputType: 'currency',
      style: { textAlign: 'right' }
    },
    // Reserve
    {
      key: 'reserveSubject',
      header: `${TABLE_COLUMNS.RESERVE} - ${TABLE_COLUMNS.SUBJECT}`,
      editable: false,
      render: (item) => item.reserveSubject,
      style: { backgroundColor: 'var(--color-bg-subtle)' }
    },
    {
      key: 'reserveAmount',
      header: `${TABLE_COLUMNS.RESERVE} - ${TABLE_COLUMNS.AMOUNT}`,
      editable: true,
      inputType: 'currency',
      style: { textAlign: 'right' }
    },
    // Surplus
    {
      key: 'surplusSubject',
      header: `${TABLE_COLUMNS.SURPLUS} - ${TABLE_COLUMNS.SUBJECT}`,
      editable: false,
      render: (item) => item.surplusSubject,
      style: { backgroundColor: 'var(--color-bg-subtle)' }
    },
    {
      key: 'surplusAmount',
      header: `${TABLE_COLUMNS.SURPLUS} - ${TABLE_COLUMNS.AMOUNT}`,
      editable: true,
      inputType: 'currency',
      style: { textAlign: 'right' }
    }
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.BUDGET_PLANNING}
      data={data}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_BUDGET}
      onBatchSave={handleBatchSave}
      onAddRow={handleAddRow}
      highlightInputColumns
    />
  );
}
