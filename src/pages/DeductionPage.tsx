import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { DeductionItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { MESSAGES, PAGE_NAMES, TABLE_COLUMNS, OCCURRENCE_TYPE_OPTIONS, CALC_TRIGGER_BASIS_OPTIONS, THRESHOLD_UNIT_OPTIONS, THRESHOLD_OPERATOR_OPTIONS, IS_AUTO_APPLIED_OPTIONS } from '../constants';
import { useDeductions } from '../hooks';

export function DeductionPage() {
  const { items, loading, fetchDeductions, batchSaveDeductions } = useDeductions();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchDeductions(selectedOfficeId).catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchDeductions, selectedOfficeId, showAlert]);

  const columns: Column<DeductionItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.DEDUCTION_NAME, editable: true, inputType: 'text' },
    { 
      key: 'occurrence_type', 
      header: TABLE_COLUMNS.OCCURRENCE_TYPE, 
      editable: true, 
      inputType: 'select',
      options: OCCURRENCE_TYPE_OPTIONS,
      render: (item) => (
        <span>{OCCURRENCE_TYPE_OPTIONS.find(o => o.value === item.occurrence_type)?.label || item.occurrence_type}</span>
      )
    },
    {
      key: 'calc_trigger_basis',
      header: TABLE_COLUMNS.CALC_TRIGGER_BASIS,
      editable: true,
      inputType: 'select',
      options: CALC_TRIGGER_BASIS_OPTIONS,
      render: (item) => (
        <span>{CALC_TRIGGER_BASIS_OPTIONS.find(o => o.value === item.calc_trigger_basis)?.label || item.calc_trigger_basis || '手入力'}</span>
      )
    },
    { key: 'threshold_value', header: TABLE_COLUMNS.THRESHOLD_VALUE, editable: true, inputType: 'number', className: 'number-column' },
    {
      key: 'threshold_unit',
      header: TABLE_COLUMNS.THRESHOLD_UNIT,
      editable: true,
      inputType: 'select',
      options: THRESHOLD_UNIT_OPTIONS,
      render: (item) => (
        <span>{THRESHOLD_UNIT_OPTIONS.find(o => o.value === item.threshold_unit)?.label || item.threshold_unit || 'ー'}</span>
      )
    },
    {
      key: 'threshold_operator',
      header: TABLE_COLUMNS.THRESHOLD_OPERATOR,
      editable: true,
      inputType: 'select',
      options: THRESHOLD_OPERATOR_OPTIONS,
      render: (item) => (
        <span>{THRESHOLD_OPERATOR_OPTIONS.find(o => o.value === item.threshold_operator)?.label || item.threshold_operator || 'ー'}</span>
      )
    },
    {
      key: 'is_auto_applied',
      header: TABLE_COLUMNS.IS_AUTO_APPLIED,
      editable: true,
      inputType: 'select',
      options: IS_AUTO_APPLIED_OPTIONS,
      render: (item) => {
        const valStr = String(item.is_auto_applied === true || item.is_auto_applied === 'true');
        return <span>{IS_AUTO_APPLIED_OPTIONS.find(o => o.value === valStr)?.label || 'ー'}</span>;
      }
    },
    { key: 'unit_price', header: TABLE_COLUMNS.DEFAULT_UNIT_PRICE, editable: true, inputType: 'currency', className: 'number-column' },
  ];

  const handleBatchSave = async (drafts: DeductionItem[], deletedIds: string[]) => {
    try {
      await batchSaveDeductions(drafts, deletedIds, selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `DED-${Date.now()}`,
      name: '',
      occurrence_type: 'daily',
      calc_trigger_basis: 'manual',
      threshold_value: null,
      threshold_unit: '',
      threshold_operator: '',
      is_auto_applied: 'false',
      unit_price: 0,
    } as DeductionItem;
  };

  if (loading && items.length === 0) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.DEDUCTION}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_DEDUCTION}
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
