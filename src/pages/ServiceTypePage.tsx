import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { ServiceTypeItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useServiceTypes } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function ServiceTypePage() {
  const { items, loading, fetchServiceTypes, batchSaveServiceTypes } = useServiceTypes();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchServiceTypes().catch(() => {
      showAlert('支援種別データの取得に失敗しました', 'error');
    });
  }, [fetchServiceTypes, showAlert]);

  const columns: Column<ServiceTypeItem>[] = [
    { key: 'code', header: '種別コード', sortable: false, editable: true, inputType: 'text' },
    { key: 'name', header: '種別名称', sortable: false, editable: true, inputType: 'text' },
    { key: 'description', header: '説明・概要', sortable: false, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: ServiceTypeItem[], deletedIds: string[]) => {
    try {
      await batchSaveServiceTypes(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: ServiceTypeItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    return {
      id: `ST-${Date.now()}-${Math.random()}`,
      code: generateNextUnifiedCode(existingCodes, 'ST-'),
      name: '',
      description: ''
    } as ServiceTypeItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="支援種別"
      data={items} 
      columns={columns} 
      emptyMessage="登録されている支援種別がありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
