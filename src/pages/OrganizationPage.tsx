import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { OrganizationItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useOrganizations } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function OrganizationPage() {
  const { items, loading, fetchOrganizations, batchSaveOrganizations } = useOrganizations();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchOrganizations().catch(() => {
      showAlert('法人データの取得に失敗しました', 'error');
    });
  }, [fetchOrganizations, showAlert]);

  const columns: Column<OrganizationItem>[] = [
    { key: 'code', header: '法人コード', sortKey: 'code', editable: true, inputType: 'text' },
    { key: 'name', header: '法人名', sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: 'フリガナ', editable: true, inputType: 'text' },
    { key: 'representative_name', header: '代表者職・氏名', editable: true, inputType: 'text' },
    { key: 'corporate_number', header: '法人番号（13桁）', editable: true, inputType: 'text' },
    { key: 'address', header: '所在地・住所', editable: true, inputType: 'text' },
    { key: 'phone', header: '電話番号・連絡先', editable: true, inputType: 'text' },
    { key: 'email', header: 'メールアドレス', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: OrganizationItem[], deletedIds: string[]) => {
    try {
      await batchSaveOrganizations(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: OrganizationItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    return {
      id: `ORG-${Date.now()}-${Math.random()}`,
      code: generateNextUnifiedCode(existingCodes, 'O-'),
      name: '',
      yomigana: '',
      representative_name: '',
      corporate_number: '',
      address: '',
      phone: '',
      email: ''
    } as OrganizationItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="法人管理"
      data={items} 
      columns={columns} 
      emptyMessage="登録されている法人がありません" 
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
