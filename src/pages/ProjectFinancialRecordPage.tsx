import { DataPage, type Column, SummaryPopup } from '../components';
import { useEffect, useMemo, useCallback } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { useFinancialRecords, isManuallyEditableItem } from '../hooks';
import { getCurrentJSTDateOnly } from '../utils';

export function ProjectFinancialRecordPage() {
  const { selectedOfficeId } = useOffice();

  const { 
    items, 
    totalCount,
    totals,
    page,
    setPage,
    handleSortChange,
    sortConfig,
    projects, 
    staffs,
    clients,
    loading, 
    fetchRecords, 
    batchSaveRecords 
  } = useFinancialRecords({ 
    initialSort: { key: 'period', direction: 'desc' },
    disableYearFilter: true,
    officeId: selectedOfficeId
  });
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert(MESSAGES.FETCH_EXPENSE_LEDGER_ERROR, 'error');
    });
  }, [fetchRecords, showAlert]);

  const canEditRow = useCallback((item: FinancialRecordItem) => {
    if (item.isLimited) return false;
    return isManuallyEditableItem(item);
  }, []);

  const canDeleteRow = useCallback((item: FinancialRecordItem) => {
    if (item.isLimited) return false;
    return isManuallyEditableItem(item);
  }, []);

  const normalizedItems = useMemo(() => {
    return items.map(item => {
      // 案件未紐付けの設備等修繕維持積立金は手動取崩データ
      const isManualReserveWithdrawal = (item.type === 'reserve' || item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT) && !item.projectId;
      return {
        ...item,
        type: (isManualReserveWithdrawal ? 'reserve' : item.type) as 'revenue' | 'expense' | 'reserve',
        subject: (item.subject === 'その他経費' || item.subject === '経費') ? WORDS_PROJECT.SUBJECT_EXPENSE_OTHER : item.subject,
        activity_category: item.activity_category || 'production',
        targetPeriod: item.targetPeriod || item.period || ''
      };
    });
  }, [items]);

  const sortedItems = useMemo(() => {
    return [...normalizedItems].sort((a, b) => {
      if (sortConfig.key === 'period' || sortConfig.key === 'targetPeriod') {
        const pA = a.targetPeriod || a.period || '';
        const pB = b.targetPeriod || b.period || '';
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
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.id }))], [staffs]);
  const clientOptions = useMemo(() => [{ label: '-', value: '' }, ...clients.map(c => ({ label: c.name, value: c.id }))], [clients]);

  const getTransactionTypeLabel = (item: FinancialRecordItem): string => {
    if (item.type === 'revenue') return TABLE_COLUMNS.TRANSACTION_TYPE_REVENUE;
    if (item.type === 'expense') return TABLE_COLUMNS.TRANSACTION_TYPE_EXPENSE;
    if (item.type === 'reserve') {
      if (item.projectId) {
        return TABLE_COLUMNS.TRANSACTION_TYPE_RESERVE_INFLOW;
      }
      return TABLE_COLUMNS.TRANSACTION_TYPE_RESERVE_WITHDRAWAL;
    }
    return item.type || '-';
  };

  const columns: Column<FinancialRecordItem>[] = [
    { 
      key: 'targetPeriod', 
      header: TABLE_COLUMNS.PERIOD,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'date'
    },
    {
      key: 'activity_category',
      header: TABLE_COLUMNS.ACTIVITY_CATEGORY,
      editable: false,
      render: (item: FinancialRecordItem) => item.activity_category === 'welfare' 
        ? TABLE_COLUMNS.ACTIVITY_CATEGORY_WELFARE_SHORT 
        : TABLE_COLUMNS.ACTIVITY_CATEGORY_PRODUCTION_SHORT
    },
    { 
      key: 'type', 
      header: TABLE_COLUMNS.TRANSACTION_TYPE, 
      editable: (item: FinancialRecordItem) => canEditRow(item), 
      inputType: 'radio',
      options: [
        { label: TABLE_COLUMNS.TRANSACTION_TYPE_EXPENSE, value: 'expense' },
        { label: TABLE_COLUMNS.TRANSACTION_TYPE_RESERVE_WITHDRAWAL, value: 'reserve' }
      ],
      render: (item: FinancialRecordItem) => getTransactionTypeLabel(item),
      onCellChange: (val: unknown, updatedItem: FinancialRecordItem) => {
        if (val === 'reserve') {
          return { 
            type: 'reserve' as const, 
            subject: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, 
            projectId: '',
            clientId: ''
          };
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
      editable: (item: FinancialRecordItem) => canEditRow(item),
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
      },
      render: (item: FinancialRecordItem) => item.subject || '-'
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: (item: FinancialRecordItem) => canEditRow(item) && item.type !== 'reserve', 
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
      key: 'clientId',
      header: TABLE_COLUMNS.CLIENT_NAME,
      editable: (item: FinancialRecordItem) => canEditRow(item) && item.type !== 'reserve',
      inputType: 'select',
      options: clientOptions,
      render: (item: FinancialRecordItem) => {
        if (
          item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER ||
          item.subject === WORDS_PROJECT.SUBJECT_DEDUCTION
        ) {
          return '利用者一括';
        }
        if (
          item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER ||
          item.subject === WORDS_PROJECT.SUBJECT_RESERVE_WAGE ||
          item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT
        ) {
          return '自社';
        }
        return clientOptions.find(o => o.value === item.clientId)?.label || '-';
      }
    },
    {
      key: 'remarks',
      header: TABLE_COLUMNS.SUMMARY,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'text',
      render: (item: FinancialRecordItem) => item.remarks || '-'
    },
    { 
      key: 'amount', 
      header: TABLE_COLUMNS.AMOUNT, 
      editable: (item: FinancialRecordItem) => canEditRow(item), 
      inputType: 'currency' 
    },
    {
      key: 'recordedDate',
      header: TABLE_COLUMNS.RECORDED_DATE,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'date',
      render: (item: FinancialRecordItem) => item.recordedDate || item.period || item.targetPeriod || '-'
    },
    {
      key: 'recordedBy',
      header: TABLE_COLUMNS.PERSON_IN_CHARGE,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'select',
      options: staffOptions,
      render: (item: FinancialRecordItem) => staffOptions.find(s => s.value === item.recordedBy)?.label || '-'
    }
  ];

  const handleBatchSave = async (drafts: FinancialRecordItem[]) => {
    try {
      const sanitizedDrafts = drafts.map(d => ({
        ...d,
        projectId: d.type === 'reserve' ? '' : d.projectId,
        clientId: d.type === 'reserve' ? '' : (d.clientId || ''),
        subject: d.type === 'reserve' ? WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT : d.subject,
        type: d.type === 'reserve' ? ('reserve' as const) : ('expense' as const),
        activity_category: 'production' as const
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
    activity_category: 'production',
    costCategory: 'manufacturing',
    isLimited: false
  });

  const summaryItems = useMemo(() => [
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: totals.material || 0 },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: totals.other || 0 },
    { label: `${WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT}取崩`, value: totals.equipmentReserve || 0 },
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
