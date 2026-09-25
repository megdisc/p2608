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
    { key: 'default_unit_price', header: TABLE_COLUMNS.DEFAULT_UNIT_PRICE, editable: true, inputType: 'currency', className: 'number-column' },
    { 
      key: 'is_active', 
      header: TABLE_COLUMNS.STATUS, 
      editable: true, 
      inputType: 'select',
      options: [
        { label: '有効', value: 'true' },
        { label: '無効', value: 'false' }
      ],
      render: (item) => (
        <span style={{ 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '12px',
          backgroundColor: item.is_active ? 'var(--palette-bluegreen-200)' : 'var(--color-bg-subtle)',
          color: item.is_active ? 'var(--palette-bluegreen-900)' : 'var(--color-text-subtle)'
        }}>
          {item.is_active ? '有効' : '無効'}
        </span>
      )
    },
  ];

  const handleBatchSave = async (drafts: DeductionItem[], deletedIds: string[]) => {
    try {
      const formattedDrafts = drafts.map(d => ({
        ...d,
        is_active: String(d.is_active) === 'true' || d.is_active === true
      }));
      await batchSaveDeductions(formattedDrafts, deletedIds, selectedOfficeId);
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
      default_unit_price: 0,
      is_active: true,
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
