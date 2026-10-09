import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert, useAuth } from '../contexts';
import { useFinancialRecords } from '../hooks';
import { getCurrentJSTDateOnly } from '../utils';

export function ProjectFinancialRecordPage() {
  const expenseSubjects = useMemo(() => [
    WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL,
    WORDS_PROJECT.SUBJECT_EXPENSE_OTHER
  ], []);

  const { 
    items, 
    totalCount,
    page,
    setPage,
    handleSortChange,
    sortConfig,
    projects, 
    loading, 
    fetchRecords, 
    batchSaveRecords 
  } = useFinancialRecords({ 
    initialSort: { key: 'period', direction: 'desc' },
    type: 'expense',
    subjects: expenseSubjects,
    disableYearFilter: true
  });
  const { showAlert } = useAlert();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert('材料費・経費記録の取得に失敗しました', 'error');
    });
  }, [fetchRecords, showAlert]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortConfig.key === 'period') {
        const pA = a.period || '';
        const pB = b.period || '';
        if (pA < pB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (pA > pB) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      if (sortConfig.key === 'projectId') {
        const projA = projects.find(p => p.id === a.projectId)?.name || '';
        const projB = projects.find(p => p.id === b.projectId)?.name || '';
        if (projA < projB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (projA > projB) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [items, projects, sortConfig]);

  const projectOptions = useMemo(() => [{ label: '', value: '' }, ...projects.map(p => ({ label: p.name, value: p.id }))], [projects]);

  const columns: Column<FinancialRecordItem>[] = [
    { 
      key: 'period', 
      header: TABLE_COLUMNS.PERIOD,
      editable: true,
      inputType: 'date'
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: true, 
      inputType: 'select', 
      options: projectOptions
    },
    { 
      key: 'type', 
      header: TABLE_COLUMNS.FINANCIAL_TYPE, 
      editable: false, 
      render: () => WORDS_PROJECT.EXPENSE
    },
    {
      key: 'subject',
      header: TABLE_COLUMNS.SUBJECT,
      editable: true,
      inputType: 'radio',
      options: [
        { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL },
        { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER }
      ]
    },
    { 
      key: 'amount', 
      header: TABLE_COLUMNS.AMOUNT, 
      editable: true, 
      inputType: 'currency' 
    },
    {
      key: 'remarks',
      header: TABLE_COLUMNS.REMARKS,
      editable: true,
      inputType: 'text'
    }
  ];

  const handleBatchSave = async (drafts: FinancialRecordItem[], _deletedIds: string[]) => {
    try {
      const sanitizedDrafts = drafts.map(d => ({
        ...d,
        type: 'expense' as const
      }));
      await batchSaveRecords(sanitizedDrafts);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAddRow = (): FinancialRecordItem => ({
    id: `draft-${Date.now()}`,
    targetPeriod: getCurrentJSTDateOnly(),
    period: getCurrentJSTDateOnly(),
    projectId: '',
    clientId: '',
    type: 'expense',
    subject: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL,
    amount: 0,
    remarks: '',
    recordedDate: getCurrentJSTDateOnly(),
    recordedBy: user?.id || '',
    isLimited: false
  });

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.PROJECT_FINANCIAL_RECORD}
      data={sortedItems}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_FINANCIAL_RECORD}
      onBatchSave={handleBatchSave}
      onAddRow={handleAddRow}
      initialSort={{ key: 'period', direction: 'desc' }}
      sortConfig={sortConfig}
      hideHeader={true}
      serverSidePagination={true}
      totalCount={totalCount}
      currentPage={page}
      onPageChange={setPage}
      onSortChange={handleSortChange}
      highlightInputColumns={true}
    />
  );
}
