import { DataPage, Button, type Column } from '../components';
import { useEffect } from 'react';
import type { BaseWageItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useBaseWages } from '../hooks';

export function BaseWagePage() {
  const { items, loading, fetchBaseWages, batchSaveBaseWages } = useBaseWages();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchBaseWages(selectedOfficeId).catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchBaseWages, selectedOfficeId, showAlert]);

  const columns: Column<BaseWageItem>[] = [
    { key: 'wage', header: TABLE_COLUMNS.BASE_WAGE, editable: true, inputType: 'currency', className: 'number-column', sortable: false },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text', sortable: false },
    {
      key: 'reorder',
      header: TABLE_COLUMNS.REORDER,
      sortable: false,
      render: (item: BaseWageItem, draftData: BaseWageItem[], updateData?: (newData: BaseWageItem[]) => void) => {
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

  const handleBatchSave = async (drafts: BaseWageItem[], deletedIds: string[]) => {
    try {
      await batchSaveBaseWages(drafts, deletedIds, selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = (currentDrafts?: BaseWageItem[]) => {
    const count = currentDrafts ? currentDrafts.length : items.length;
    return {
      id: `BWG-${Date.now()}`,
      wage: 0,
      description: '',
      sort_order: count,
    } as BaseWageItem;
  };

  if (loading && items.length === 0) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.BASE_WAGE}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_BASE_WAGE}
      initialSort={{ key: '', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}

