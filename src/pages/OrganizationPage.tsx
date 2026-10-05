import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { OrganizationItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
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
    { key: 'name', header: TABLE_COLUMNS.ORGANIZATION_NAME, sortable: false, editable: true, inputType: 'text' },
    { key: 'representative_name', header: TABLE_COLUMNS.REPRESENTATIVE_NAME, sortable: false, editable: true, inputType: 'text' },
    { key: 'corporate_number', header: TABLE_COLUMNS.CORPORATE_NUMBER, sortable: false, editable: true, inputType: 'text' },
    { key: 'postal_code_prefix', header: TABLE_COLUMNS.POSTAL_CODE_PREFIX, sortable: false, editable: true, inputType: 'text' },
    { key: 'postal_code_suffix', header: TABLE_COLUMNS.POSTAL_CODE_SUFFIX, sortable: false, editable: true, inputType: 'text' },
    { key: 'prefecture', header: TABLE_COLUMNS.PREFECTURE, sortable: false, editable: true, inputType: 'text' },
    { key: 'city', header: TABLE_COLUMNS.CITY, sortable: false, editable: true, inputType: 'text' },
    { key: 'town_street', header: TABLE_COLUMNS.TOWN_STREET, sortable: false, editable: true, inputType: 'text' },
    { key: 'building', header: TABLE_COLUMNS.BUILDING, sortable: false, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, sortable: false, editable: true, inputType: 'text' },
    { key: 'fax', header: TABLE_COLUMNS.FAX, sortable: false, editable: true, inputType: 'text' },
    { key: 'email', header: TABLE_COLUMNS.EMAIL, sortable: false, editable: true, inputType: 'text' },
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
