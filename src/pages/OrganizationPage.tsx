import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { OrganizationItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useOrganizations } from '../hooks';

export function OrganizationPage() {
  const { items, loading, fetchOrganizations, batchSaveOrganizations } = useOrganizations();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchOrganizations().catch(() => {
      showAlert('法人データの取得に失敗しました', 'error');
    });
  }, [fetchOrganizations, showAlert]);

  const columns: Column<OrganizationItem>[] = [
    { key: 'name', header: '法人名', sortable: false, editable: true, inputType: 'text' },
    { key: 'representative_name', header: '代表者職・氏名', sortable: false, editable: true, inputType: 'text' },
    { key: 'corporate_number', header: '法人番号（13桁）', sortable: false, editable: true, inputType: 'text' },
    { key: 'postal_code_prefix', header: '郵便番号（前3桁）', sortable: false, editable: true, inputType: 'text' },
    { key: 'postal_code_suffix', header: '郵便番号（後4桁）', sortable: false, editable: true, inputType: 'text' },
    { key: 'prefecture', header: '都道府県', sortable: false, editable: true, inputType: 'text' },
    { key: 'city', header: '市区町村・郡', sortable: false, editable: true, inputType: 'text' },
    { key: 'town_street', header: '町名・番地', sortable: false, editable: true, inputType: 'text' },
    { key: 'building', header: '建物名・部屋番号', sortable: false, editable: true, inputType: 'text' },
    { key: 'phone', header: '電話番号', sortable: false, editable: true, inputType: 'text' },
    { key: 'fax', header: 'FAX番号', sortable: false, editable: true, inputType: 'text' },
    { key: 'email', header: 'メールアドレス', sortable: false, editable: true, inputType: 'text' },
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

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="法人管理"
      data={items} 
      columns={columns} 
      emptyMessage="登録されている法人がありません" 
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
