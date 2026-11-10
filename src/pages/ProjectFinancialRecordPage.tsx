import { DataPage, type Column, SummaryPopup } from '../components';
import { useEffect, useMemo, useCallback } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { useFinancialRecords } from '../hooks';
import { getCurrentJSTDateOnly } from '../utils';

export function ProjectFinancialRecordPage() {
  const { selectedOfficeId } = useOffice();
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
    onlyUnassignedReserves: true,
    officeId: selectedOfficeId
  });
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert(MESSAGES.FETCH_EXPENSE_LEDGER_ERROR, 'error');
    });
  }, [fetchRecords, showAlert]);

  const canEditRow = useCallback((item: FinancialRecordItem) => !item.isLimited, []);
  const canDeleteRow = useCallback((item: FinancialRecordItem) => !item.isLimited, []);

  const normalizedItems = useMemo(() => {
    return items.map(item => {
      const isReserve = item.type === 'reserve' || item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT;
      return {
        ...item,
        type: (isReserve ? 'reserve' : 'expense') as 'reserve' | 'expense',
        subject: isReserve
          ? WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT
          : (item.subject === 'その他経費' ? WORDS_PROJECT.SUBJECT_EXPENSE_OTHER : item.subject)
      };
    });
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
      editable: (item: FinancialRecordItem) => item.type !== 'reserve', 
      inputType: 'select', 
      options: projectOptions,
      render: (item: FinancialRecordItem) => {
        if (item.type === 'reserve') {
          return '-';
        }
        return projectOptions.find(p => p.value === item.projectId)?.label || '-';
      }
    },
    { 
      key: 'type', 
      header: TABLE_COLUMNS.TRANSACTION_TYPE, 
      editable: true, 
      inputType: 'radio',
      options: [
        { label: TABLE_COLUMNS.TRANSACTION_TYPE_EXPENSE, value: 'expense' },
        { label: TABLE_COLUMNS.TRANSACTION_TYPE_RESERVE_WITHDRAWAL, value: 'reserve' }
      ],
      onCellChange: (val: unknown, updatedItem: FinancialRecordItem) => {
        if (val === 'reserve') {
          return { type: 'reserve' as const, subject: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, projectId: '' };
        } else {
          return {
            type: 'expense' as const,
            subject: updatedItem.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT
              ? WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL
              : updatedItem.subject
          };
        }
      }
    },
    {
      key: 'subject',
      header: TABLE_COLUMNS.ACCOUNT_SUBJECT,
      editable: true,
      inputType: 'radio',
      options: (item: FinancialRecordItem) => {
        if (item.type === 'reserve') {
          return [
            { label: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, value: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT }
          ];
        }
        return [
          { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL },
          { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER }
        ];
      }
    },
    {
      key: 'remarks',
      header: TABLE_COLUMNS.SUMMARY,
      editable: true,
      inputType: 'text'
    },
    { 
      key: 'amount', 
      header: TABLE_COLUMNS.AMOUNT, 
      editable: true, 
      inputType: 'currency' 
    }
  ];

  const handleBatchSave = async (drafts: FinancialRecordItem[]) => {
    try {
      const sanitizedDrafts = drafts.map(d => ({
        ...d,
        projectId: d.type === 'reserve' ? '' : d.projectId,
        subject: d.type === 'reserve' ? WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT : d.subject,
        type: d.type === 'reserve' ? ('reserve' as const) : ('expense' as const)
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
    { label: WORDS_PROJECT.CUMULATIVE_TOTAL, value: totals.total || 0, isTotal: true }
  ], [totals]);

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <DataPage 
        title={PAGE_NAMES.EXPENSE_LEDGER}
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
        restrictionTooltipText={MESSAGES.CONFIRMED_CANNOT_EDIT}
        canEditRow={canEditRow}
        canDeleteRow={canDeleteRow}
      />
      <SummaryPopup 
        title={WORDS_PROJECT.SUMMARY_POPUP_TITLE}
        items={summaryItems}
      />
    </>
  );
}
