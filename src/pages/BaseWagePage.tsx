import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { BaseWageItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useBaseWages } from '../hooks';

export function BaseWagePage() {
  const { items, loading, fetchBaseWages, batchSaveBaseWages } = useBaseWages();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchBaseWages().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchBaseWages, showAlert]);

  const columns: Column<BaseWageItem>[] = [
    { key: 'wage', header: TABLE_COLUMNS.BASE_WAGE, editable: true, inputType: 'currency', className: 'number-column' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: BaseWageItem[], deletedIds: string[]) => {
    try {
      await batchSaveBaseWages(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `BWG-${Date.now()}`,
      wage: 0,
      description: '',
    } as BaseWageItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.BASE_WAGE}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_BASE_WAGE}
      initialSort={{ key: 'wage', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
