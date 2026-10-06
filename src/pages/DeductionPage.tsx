import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { DeductionItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { MESSAGES, PAGE_NAMES, TABLE_COLUMNS } from '../constants';
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
      options: [
        { label: '日次発生', value: 'daily' },
        { label: '月次発生', value: 'monthly' }
      ],
      render: (item) => (
        <span>{item.occurrence_type === 'monthly' ? '月次発生' : '日次発生'}</span>
      )
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
