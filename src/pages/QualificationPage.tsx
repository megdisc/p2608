import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { QualificationItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useQualifications } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function QualificationPage() {
  const { items, loading, fetchQualifications, batchSaveQualifications } = useQualifications();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchQualifications().catch(() => {
      showAlert('資格データの取得に失敗しました', 'error');
    });
  }, [fetchQualifications, showAlert]);

  const columns: Column<QualificationItem>[] = [
    { key: 'code', header: '資格コード', sortable: false, editable: true, inputType: 'text' },
    { key: 'name', header: '資格名称', sortable: false, editable: true, inputType: 'text' },
    { key: 'category', header: '区分', sortable: false, editable: true, inputType: 'text' },
    { key: 'description', header: '説明・概要', sortable: false, editable: true, inputType: 'text' },
    { key: 'is_active', header: '適用', sortable: false, editable: true, inputType: 'checkbox' },
  ];

  const handleBatchSave = async (drafts: QualificationItem[], deletedIds: string[]) => {
    try {
      await batchSaveQualifications(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: QualificationItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    return {
      id: `QUAL-${Date.now()}-${Math.random()}`,
      code: generateNextUnifiedCode(existingCodes, 'QUAL-'),
      name: '',
      category: '福祉専門職',
      description: '',
      is_active: true,
    } as QualificationItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="資格"
      data={items} 
      columns={columns} 
      emptyMessage="登録されている資格がありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideDeleteColumn={true}
      hideHeader={true}
    />
  );
}
