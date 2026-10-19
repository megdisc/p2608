import { DataPage, Button, type Column } from '../components';
import { useEffect } from 'react';
import type { AllowanceItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { MESSAGES, PAGE_NAMES, TABLE_COLUMNS, OCCURRENCE_TYPE_OPTIONS, CALC_TRIGGER_BASIS_OPTIONS, THRESHOLD_UNIT_OPTIONS, THRESHOLD_OPERATOR_OPTIONS } from '../constants';
import { useAllowances } from '../hooks';

export function AllowancePage() {
  const { items, loading, fetchAllowances, batchSaveAllowances } = useAllowances();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchAllowances(selectedOfficeId).catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchAllowances, selectedOfficeId, showAlert]);

  const columns: Column<AllowanceItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.ALLOWANCE_NAME, editable: true, inputType: 'text', sortable: false },
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
      render: (item: AllowanceItem, draftData: AllowanceItem[], updateData?: (newData: AllowanceItem[]) => void) => {
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
            newData[index + 1] = temp;
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

  const handleBatchSave = async (drafts: AllowanceItem[], deletedIds: string[]) => {
    try {
      await batchSaveAllowances(drafts, deletedIds, selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = (currentDrafts?: AllowanceItem[]) => {
    const count = currentDrafts ? currentDrafts.length : items.length;
    return {
      id: `ALW-${Date.now()}`,
      name: '',
      occurrence_type: 'daily',
      calc_trigger_basis: 'manual',
      threshold_value: null,
      threshold_unit: '',
      threshold_operator: '',
      unit_price: 0,
      sort_order: count,
    } as AllowanceItem;
  };

  if (loading && items.length === 0) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.ALLOWANCE}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_ALLOWANCE}
      initialSort={{ key: '', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
