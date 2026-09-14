import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { OfficeItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useOffices } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function OfficePage() {
  const { items, loading, fetchOffices, batchSaveOffices } = useOffices();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchOffices().catch(() => {
      showAlert('事業所データの取得に失敗しました', 'error');
    });
  }, [fetchOffices, showAlert]);

  const columns: Column<OfficeItem>[] = [
    { key: 'code', header: '事業所コード', sortKey: 'code', editable: true, inputType: 'text' },
    { key: 'name', header: '事業所名', editable: true, inputType: 'text' },
    { key: 'orgName', header: '所属法人', editable: false },
    { key: 'is_type_b', header: '就労継続支援B型', editable: true, inputType: 'checkbox' },
    { key: 'is_type_a', header: '就労継続支援A型', editable: true, inputType: 'checkbox' },
    { key: 'is_transition', header: '就労移行支援', editable: true, inputType: 'checkbox' },
    { key: 'unit_price', header: '地域区分単価(円)', editable: true, inputType: 'number' },
    { key: 'address', header: '所在地・住所', editable: true, inputType: 'text' },
    { key: 'phone', header: '電話番号', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: OfficeItem[], deletedIds: string[]) => {
    try {
      await batchSaveOffices(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: OfficeItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    return {
      id: `OFF-${Date.now()}-${Math.random()}`,
      code: generateNextUnifiedCode(existingCodes, 'OFF-'),
      name: '',
      orgName: '社会福祉法人未来福祉会',
      is_type_b: true,
      is_type_a: false,
      is_transition: false,
      unit_price: 10.68,
      address: '',
      phone: '',
      email: ''
    } as OfficeItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="事業所管理"
      data={items} 
      columns={columns} 
      emptyMessage="登録されている事業所がありません" 
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
