import { DataPage, type Column, SummaryPopup } from '../components';
import { useEffect, useMemo, useCallback } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { useFinancialRecords, isManuallyEditableItem } from '../hooks';
import { getCurrentJSTDateOnly, getTransactionTypeDisplayLabel, getDefaultClientBySubject, getSubjectActivityCategory } from '../utils';

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
      let normalizedSubject = item.subject || '';
      if (normalizedSubject === 'その他経費' || normalizedSubject === '経費') {
        normalizedSubject = WORDS_PROJECT.SUBJECT_EXPENSE_OTHER;
      } else if (normalizedSubject === '控除' || normalizedSubject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_DEDUCTION) {
        normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_DEDUCTION;
      } else if (normalizedSubject === '労務費（その他）' || normalizedSubject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER) {
        normalizedSubject = WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER;
      } else if (normalizedSubject === '事業収益') {
        const desc = item.remarks || '';
        if (desc.includes('給付費') || desc.includes('訓練') || !desc) {
          normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_BENEFIT;
        } else {
          normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_REVENUE_OTHER;
        }
      } else if (normalizedSubject === '事業費用・経費' || normalizedSubject === '事業費用') {
        normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER;
      }

      // 勘定科目から事業区分を自動判定・補完
      const determinedCategory = item.activity_category || getSubjectActivityCategory(normalizedSubject);
      const isManualReserveWithdrawal = (item.type === 'reserve' || normalizedSubject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT) && !item.projectId;

      return {
        ...item,
        type: (isManualReserveWithdrawal ? 'reserve' : item.type) as 'revenue' | 'expense' | 'reserve',
        subject: normalizedSubject,
        activity_category: determinedCategory,
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

  // 手動入力用の勘定科目プルダウン（3択）
  const subjectOptions = useMemo(() => [
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER },
    { label: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, value: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT }
  ], []);

  const columns: Column<FinancialRecordItem>[] = [
    // 1. 対象時期（日付ピッカー）: 入力可
    { 
      key: 'targetPeriod', 
      header: TABLE_COLUMNS.PERIOD,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'date'
    },
    // 2. 事業区分: 入力不可（就労支援／福祉 表示）
    {
      key: 'activity_category',
      header: TABLE_COLUMNS.ACTIVITY_CATEGORY,
      editable: false,
      render: (item: FinancialRecordItem) => item.activity_category === 'welfare' 
        ? TABLE_COLUMNS.ACTIVITY_CATEGORY_WELFARE_SHORT 
        : TABLE_COLUMNS.ACTIVITY_CATEGORY_PRODUCTION_SHORT
    },
    // 3. 取引区分: 入力不可（勘定科目から自動判定）
    { 
      key: 'type', 
      header: TABLE_COLUMNS.TRANSACTION_TYPE, 
      editable: false,
      render: (item: FinancialRecordItem) => getTransactionTypeDisplayLabel({
        subject: item.subject,
        projectId: item.projectId,
        type: item.type
      })
    },
    // 4. 勘定科目（プルダウン選択肢: 材料費、経費、設備等修繕維持積立金の3択）: 入力可
    {
      key: 'subject',
      header: TABLE_COLUMNS.ACCOUNT_SUBJECT,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'select',
      options: subjectOptions,
      render: (item: FinancialRecordItem) => item.subject || '-',
      onCellChange: (val: unknown, updatedItem: FinancialRecordItem) => {
        if (val === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT) {
          // 設備等修繕維持積立金の場合は案件名・取引先をクリアし、取引区分を積立金取崩に自動判定
          return { 
            type: 'reserve' as const, 
            subject: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, 
            projectId: '',
            clientId: ''
          };
        } else {
          // 材料費・経費の場合は費用に自動判定。案件が選択されていれば取引先も自動判定
          const selProj = projects.find(p => p.id === updatedItem.projectId);
          return {
            type: 'expense' as const,
            subject: String(val || WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL),
            clientId: selProj?.clientId || ''
          };
        }
      }
    },
    // 5. 案件名（登録済み・未完了案件のプルダウン）: 入力可（材料費・経費のみ）
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: (item: FinancialRecordItem) => canEditRow(item) && item.subject !== WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, 
      inputType: 'select', 
      options: (item: FinancialRecordItem) => [
        { label: WORDS_PROJECT.SELECT_PROJECT, value: '' },
        ...projects
          .filter(p => !p.isFinished || p.id === item.projectId)
          .map(p => ({ label: p.name, value: p.id }))
      ],
      render: (item: FinancialRecordItem) => {
        if (item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || item.type === 'reserve') {
          return '-';
        }
        return projects.find(p => p.id === item.projectId)?.name || '-';
      },
      onCellChange: (val: unknown) => {
        // 取引先を案件名から自動判定！
        const selProj = projects.find(p => p.id === val);
        return { clientId: selProj?.clientId || '' };
      }
    },
    // 6. 取引先: 入力不可（案件名から自動判定）
    {
      key: 'clientId',
      header: TABLE_COLUMNS.CLIENT_NAME,
      editable: false,
      render: (item: FinancialRecordItem) => {
        const defaultClient = getDefaultClientBySubject(item.subject);
        if (defaultClient) {
          return defaultClient;
        }
        const selProj = projects.find(p => p.id === item.projectId);
        const effClientId = item.clientId || selProj?.clientId;
        return clients.find(c => c.id === effClientId)?.name || '-';
      }
    },
    // 7. 摘要（文字入力）: 入力可
    {
      key: 'remarks',
      header: TABLE_COLUMNS.SUMMARY,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'text',
      render: (item: FinancialRecordItem) => item.remarks || '-'
    },
    // 8. 金額（数値入力）: 入力可
    { 
      key: 'amount', 
      header: TABLE_COLUMNS.AMOUNT, 
      editable: (item: FinancialRecordItem) => canEditRow(item), 
      inputType: 'currency' 
    },
    // 9. 記録日: 入力不可（自動判定）
    {
      key: 'recordedDate',
      header: TABLE_COLUMNS.RECORDED_DATE,
      editable: false,
      render: (item: FinancialRecordItem) => item.recordedDate || item.period || item.targetPeriod || '-'
    },
    // 10. 記録者: 入力不可（疑似ロジックで自動判定）
    {
      key: 'recordedBy',
      header: TABLE_COLUMNS.PERSON_IN_CHARGE,
      editable: false,
      render: (item: FinancialRecordItem) => {
        const staff = staffs.find(s => s.id === item.recordedBy);
        return staff?.name || (staffs[0]?.name || '-');
      }
    }
  ];

  const handleBatchSave = async (drafts: FinancialRecordItem[]) => {
    try {
      const defaultStaffId = staffs[0]?.id || '';
      const today = getCurrentJSTDateOnly();

      const sanitizedDrafts = drafts.map(d => {
        const isReserveWithdrawal = d.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT;
        const selProj = projects.find(p => p.id === d.projectId);
        return {
          ...d,
          projectId: isReserveWithdrawal ? '' : d.projectId,
          clientId: isReserveWithdrawal ? '' : (d.clientId || selProj?.clientId || ''),
          subject: d.subject,
          type: (isReserveWithdrawal ? 'reserve' : 'expense') as 'reserve' | 'expense',
          recordedDate: d.recordedDate || today,
          recordedBy: d.recordedBy || defaultStaffId,
          activity_category: 'production' as const
        };
      });
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
    recordedBy: staffs[0]?.id || '',
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
