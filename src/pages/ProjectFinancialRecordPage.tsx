import { DataPage, type Column, SummaryPopup } from '../components';
import { useEffect, useMemo, useCallback } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert } from '../contexts';
import { useFinancialRecords } from '../hooks';
import { getCurrentJSTDateOnly } from '../utils';

export function ProjectFinancialRecordPage() {
  const expenseSubjects = useMemo(() => [
    WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL,
    WORDS_PROJECT.SUBJECT_EXPENSE_OTHER,
    'その他経費',
    WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT
  ], []);

  const { 
    items, 
    totalCount,
    totals,
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
    subjects: expenseSubjects,
    disableYearFilter: true,
    onlyUnassignedReserves: true
  });
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert('費用帳簿の取得に失敗しました', 'error');
    });
  }, [fetchRecords, showAlert]);

  const canEditRow = useCallback((item: FinancialRecordItem) => !item.isLimited, []);
  const canDeleteRow = useCallback((item: FinancialRecordItem) => !item.isLimited, []);

  const normalizedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      subject: item.subject === 'その他経費' ? WORDS_PROJECT.SUBJECT_EXPENSE_OTHER : item.subject
    }));
  }, [items]);

  const sortedItems = useMemo(() => {
    return [...normalizedItems].sort((a, b) => {
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
  }, [normalizedItems, projects, sortConfig]);

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
      editable: (item: FinancialRecordItem) => item.subject !== WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, 
      inputType: 'select', 
      options: projectOptions,
      render: (item: FinancialRecordItem) => {
        if (item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT) {
          return '-';
        }
        return projectOptions.find(p => p.value === item.projectId)?.label || '-';
      }
    },
    { 
      key: 'type', 
      header: TABLE_COLUMNS.FINANCIAL_TYPE, 
      editable: false, 
      render: (item: FinancialRecordItem) => (item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || item.type === 'reserve')
        ? WORDS_PROJECT.RESERVE
        : WORDS_PROJECT.EXPENSE
    },
    {
      key: 'subject',
      header: TABLE_COLUMNS.SUBJECT,
      editable: true,
      inputType: 'radio',
      options: [
        { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL },
        { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER },
        { label: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, value: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT }
      ],
      onCellChange: (val: unknown) => {
        if (val === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT) {
          return { projectId: '', type: 'reserve' as const };
        } else {
          return { type: 'expense' as const };
        }
      }
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

  const handleBatchSave = async (drafts: FinancialRecordItem[]) => {
    try {
      const sanitizedDrafts = drafts.map(d => ({
        ...d,
        projectId: d.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT ? '' : d.projectId,
        type: d.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT ? ('reserve' as const) : ('expense' as const)
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
    recordedBy: '',
    isLimited: false
  });

  const summaryItems = useMemo(() => [
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: totals.material || 0 },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: totals.other || 0 },
    { label: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, value: totals.equipmentReserve || 0 },
    { label: '累計合計', value: totals.total || 0, isTotal: true }
  ], [totals]);

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
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
        showRestrictionColumn={true}
        restrictionTooltipText="確定済のため変更不可"
        canEditRow={canEditRow}
        canDeleteRow={canDeleteRow}
      />
      <SummaryPopup 
        title="累計金額サマリ"
        items={summaryItems}
      />
    </>
  );
}
