import { DataPage, Button, type Column } from '../components';
import { useEffect } from 'react';
import type { DeductionItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { MESSAGES, PAGE_NAMES, TABLE_COLUMNS, OCCURRENCE_TYPE_OPTIONS, CALC_TRIGGER_BASIS_OPTIONS, THRESHOLD_UNIT_OPTIONS, THRESHOLD_OPERATOR_OPTIONS } from '../constants';
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
    { key: 'name', header: TABLE_COLUMNS.DEDUCTION_NAME, editable: true, inputType: 'text', sortable: false },
    { 
      key: 'occurrence_type', 
      header: TABLE_COLUMNS.OCCURRENCE_TYPE, 
      editable: true, 
      inputType: 'select',
      options: OCCURRENCE_TYPE_OPTIONS,
      sortable: false,
    },
    {
      key: 'calc_trigger_basis',
      header: TABLE_COLUMNS.CALC_TRIGGER_BASIS,
      editable: true,
      inputType: 'select',
      options: CALC_TRIGGER_BASIS_OPTIONS,
      sortable: false,
    },
    { key: 'threshold_value', header: TABLE_COLUMNS.THRESHOLD_VALUE, editable: true, inputType: 'number', className: 'number-column', sortable: false },
    {
      key: 'threshold_unit',
      header: TABLE_COLUMNS.THRESHOLD_UNIT,
      editable: true,
      inputType: 'select',
      options: THRESHOLD_UNIT_OPTIONS,
      sortable: false,
    },
    {
      key: 'threshold_operator',
      header: TABLE_COLUMNS.THRESHOLD_OPERATOR,
      editable: true,
      inputType: 'select',
      options: THRESHOLD_OPERATOR_OPTIONS,
      sortable: false,
    },
    { key: 'unit_price', header: TABLE_COLUMNS.DEFAULT_UNIT_PRICE, editable: true, inputType: 'currency', className: 'number-column', sortable: false },
    {
      key: 'reorder',
      header: TABLE_COLUMNS.REORDER,
      sortable: false,
      render: (item: DeductionItem, draftData: DeductionItem[], updateData?: (newData: DeductionItem[]) => void) => {
        if (!updateData) return null;
        
        const index = draftData.findIndex(d => d.id === item.id);
        
        const handleUp = () => {
          if (index > 0) {
            const newData = [...draftData];
            const temp = newData[index - 1];
            newData[index - 1] = newData[index];
            newData[index] = temp;
            newData.forEach((d, idx) => {
              d.sort_order = idx;
            });
            updateData(newData);
          }
        };

        const handleDown = () => {
          if (index >= 0 && index < draftData.length - 1) {
            const newData = [...draftData];
            const temp = newData[index + 1];
            newData[index + 1] = newData[index];
            newData[index] = temp;
            newData.forEach((d, idx) => {
              d.sort_order = idx;
            });
            updateData(newData);
          }
        };

        return (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <Button onClick={handleUp} disabled={index <= 0} style={{ padding: '4px 8px', minWidth: 'auto' }}>↑</Button>
            <Button onClick={handleDown} disabled={index === -1 || index >= draftData.length - 1} style={{ padding: '4px 8px', minWidth: 'auto' }}>↓</Button>
          </div>
        );
      }
    }
  ];

  const handleBatchSave = async (drafts: DeductionItem[], deletedIds: string[]) => {
    try {
      await batchSaveDeductions(drafts, deletedIds, selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = (currentDrafts?: DeductionItem[]) => {
    const count = currentDrafts ? currentDrafts.length : items.length;
    return {
      id: `DED-${Date.now()}`,
      name: '',
      occurrence_type: 'daily',
      calc_trigger_basis: 'manual',
      threshold_value: null,
      threshold_unit: '',
      threshold_operator: '',
      unit_price: 0,
      sort_order: count,
    } as DeductionItem;
  };

  if (loading && items.length === 0) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.DEDUCTION}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_DEDUCTION}
      initialSort={{ key: '', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
