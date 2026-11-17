import { DataPage, type Column, SummaryPopup } from '../components';
import { useEffect, useMemo, useCallback } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { useFinancialRecords, isManuallyEditableItem, useWageClosingSettings, useSalaryClosingSettings, useReserveSettings } from '../hooks';
import { getCurrentJSTDateOnly, getTransactionTypeDisplayLabel, getDefaultClientBySubject, getSubjectActivityCategory, getDefaultTransactionDate } from '../utils';

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

  const { items: closingSettings, fetchWageClosingSettings } = useWageClosingSettings();
  const { items: salaryClosingSettings, fetchSalaryClosingSettings } = useSalaryClosingSettings();
  const { items: reserveSettings, fetchReserveSettings } = useReserveSettings();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert(MESSAGES.FETCH_EXPENSE_LEDGER_ERROR, 'error');
    });
    fetchWageClosingSettings(selectedOfficeId).catch(console.error);
    fetchSalaryClosingSettings(selectedOfficeId).catch(console.error);
    fetchReserveSettings(selectedOfficeId).catch(console.error);
  }, [fetchRecords, fetchWageClosingSettings, fetchSalaryClosingSettings, fetchReserveSettings, selectedOfficeId, showAlert]);

  const currentWageSetting = useMemo(() => {
    return (selectedOfficeId && selectedOfficeId !== 'all')
      ? closingSettings.find(s => s.office_id === selectedOfficeId) || closingSettings[0]
      : closingSettings[0];
  }, [closingSettings, selectedOfficeId]);

  const currentSalarySetting = useMemo(() => {
    return (selectedOfficeId && selectedOfficeId !== 'all')
      ? salaryClosingSettings.find(s => s.office_id === selectedOfficeId) || salaryClosingSettings[0]
      : salaryClosingSettings[0];
  }, [salaryClosingSettings, selectedOfficeId]);

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
      } else if (normalizedSubject === '控除' || normalizedSubject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_DEDUCTION || normalizedSubject.includes('実費控除')) {
        normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_DEDUCTION;
      } else if (normalizedSubject === 'サービス利用料' || normalizedSubject.includes('サービス利用料')) {
        normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_USAGE_FEE;
      } else if (normalizedSubject === '労務費（その他）' || normalizedSubject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER) {
        normalizedSubject = WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER;
      } else if (normalizedSubject === '事業収益') {
        const desc = item.remarks || '';
        if (desc.includes('給付費') || desc.includes('訓練') || !desc) {
          normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_BENEFIT;
        } else {
          normalizedSubject = WORDS_PROJECT.SUBJECT_WELFARE_REVENUE_OTHER;
        }
      } else if (
        normalizedSubject === '事業費用・経費' ||
        normalizedSubject === '事業費用' ||
        normalizedSubject === 'その他福祉事業費用' ||
        normalizedSubject === 'その他事業費用' ||
        normalizedSubject === '福祉事業費用' ||
        normalizedSubject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER
      ) {
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

  // 手動入力用の勘定科目プルダウン
  const subjectOptions = useMemo(() => [
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE, value: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER, value: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER },
    { label: WORDS_PROJECT.SUBJECT_REVENUE_SALES, value: WORDS_PROJECT.SUBJECT_REVENUE_SALES },
    { label: `${WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT}取崩`, value: `${WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT}取崩` },
    { label: `${WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT}繰入`, value: `${WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT}繰入` },
    { label: `${WORDS_PROJECT.SUBJECT_RESERVE_WAGE}取崩`, value: `${WORDS_PROJECT.SUBJECT_RESERVE_WAGE}取崩` },
    { label: `${WORDS_PROJECT.SUBJECT_RESERVE_WAGE}繰入`, value: `${WORDS_PROJECT.SUBJECT_RESERVE_WAGE}繰入` },
    { label: WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER },
  ], []);

  const columns: Column<FinancialRecordItem>[] = [
    // 1. 取引時期（日付ピッカー）: 入力可
    { 
      key: 'targetPeriod', 
      header: TABLE_COLUMNS.TRANSACTION_PERIOD,
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
    // 4. 勘定科目（プルダウン選択肢）: 入力可
    {
      key: 'subject',
      header: TABLE_COLUMNS.ACCOUNT_SUBJECT,
      editable: (item: FinancialRecordItem) => canEditRow(item),
      inputType: 'select',
      options: subjectOptions,
      render: (item: FinancialRecordItem) => item.subject || '-',
      onCellChange: (val: unknown, updatedItem: FinancialRecordItem) => {
        const subj = String(val || '');
        const selProj = projects.find(p => p.id === updatedItem.projectId);
        const targetClient = clients.find(c => c.id === (updatedItem.clientId || selProj?.clientId));

        // 勘定科目に応じた取引時期の自動判定
        const targetPeriod = getDefaultTransactionDate(subj, {
          targetYearMonth: updatedItem.targetPeriod ? updatedItem.targetPeriod.slice(0, 7) : undefined,
          client: targetClient,
          wageClosingSetting: currentWageSetting,
          salaryClosingSetting: currentSalarySetting,
          reserveSettings,
        });

        const isReserve = subj.includes('積立金');
        const isRevenue = subj === WORDS_PROJECT.SUBJECT_REVENUE_SALES || subj.includes('就労支援事業収益');
        const isWelfare = subj === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER || subj.includes('福祉');

        let type: 'revenue' | 'expense' | 'reserve' = 'expense';
        if (isRevenue) type = 'revenue';
        else if (isReserve) type = 'reserve';

        const activityCategory = isWelfare ? 'welfare' : 'production';
        const isClearProject = isReserve || isWelfare;

        return {
          type,
          subject: subj,
          targetPeriod,
          projectId: isClearProject ? '' : updatedItem.projectId,
          clientId: isClearProject ? '' : (selProj?.clientId || updatedItem.clientId || ''),
          activity_category: activityCategory,
        };
      }
    },
    // 5. 案件名（登録済み・未完了案件のプルダウン）: 入力可
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: (item: FinancialRecordItem) => canEditRow(item) && !item.subject.includes('積立金') && item.subject !== WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER, 
      inputType: 'select', 
      options: (item: FinancialRecordItem) => [
        { label: WORDS_PROJECT.SELECT_PROJECT, value: '' },
        ...projects
          .filter(p => !p.isFinished || p.id === item.projectId)
          .map(p => ({ label: p.name, value: p.id }))
      ],
      render: (item: FinancialRecordItem) => {
        if (
          item.subject.includes('積立金') ||
          item.type === 'reserve' ||
          item.subject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER ||
          item.activity_category === 'welfare'
        ) {
          return '-';
        }
        return projects.find(p => p.id === item.projectId)?.name || '-';
      },
      onCellChange: (val: unknown, updatedItem: FinancialRecordItem) => {
        // 取引先を案件名から自動判定！
        const selProj = projects.find(p => p.id === val);
        const newClientId = selProj?.clientId || '';
        const targetClient = clients.find(c => c.id === newClientId);

        // 案件変更に伴う取引時期の自動再計算（顧客入金日・外注先出金日等の連動）
        const targetPeriod = getDefaultTransactionDate(updatedItem.subject, {
          targetYearMonth: updatedItem.targetPeriod ? updatedItem.targetPeriod.slice(0, 7) : undefined,
          client: targetClient,
          wageClosingSetting: currentWageSetting,
          salaryClosingSetting: currentSalarySetting,
          reserveSettings,
        });

        return { 
          clientId: newClientId,
          targetPeriod,
        };
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
        const isWelfareExpense = d.subject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER || d.activity_category === 'welfare';
        const isNonProject = isReserveWithdrawal || isWelfareExpense;
        const selProj = projects.find(p => p.id === d.projectId);

        return {
          ...d,
          projectId: isNonProject ? '' : d.projectId,
          clientId: isNonProject ? '' : (d.clientId || selProj?.clientId || ''),
          subject: d.subject,
          type: (isReserveWithdrawal ? 'reserve' : 'expense') as 'reserve' | 'expense',
          recordedDate: d.recordedDate || today,
          recordedBy: d.recordedBy || defaultStaffId,
          activity_category: isWelfareExpense ? ('welfare' as const) : ('production' as const)
        };
      });
      await batchSaveRecords(sanitizedDrafts);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAddRow = (): FinancialRecordItem => {
    const initialSubject = WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL;
    const initialDate = getDefaultTransactionDate(initialSubject, {
      wageClosingSetting: currentWageSetting,
      salaryClosingSetting: currentSalarySetting,
      reserveSettings,
    });

    return {
      id: `draft-${Date.now()}`,
      targetPeriod: initialDate,
      period: initialDate,
      projectId: '',
      clientId: '',
      type: 'expense',
      subject: initialSubject,
      amount: 0,
      remarks: '',
      recordedDate: getCurrentJSTDateOnly(),
      recordedBy: staffs[0]?.id || '',
      activity_category: 'production',
      costCategory: 'manufacturing',
      isLimited: false
    };
  };

  const summaryItems = useMemo(() => [
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: totals.material || 0 },
    { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: totals.other || 0 },
    { label: `${WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT}取崩`, value: totals.equipmentReserve || 0 },
    { label: WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER, value: totals.welfareExpense || 0 },
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
