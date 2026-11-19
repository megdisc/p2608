import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useStaffRoles } from '../hooks';
import type { StaffRoleTableItem } from '../types';

export function StaffRoleMasterPage() {
  const { items, loading, fetchStaffRoles } = useStaffRoles();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchStaffRoles().catch(() => {
      showAlert('職種データの取得に失敗しました', 'error');
    });
  }, [fetchStaffRoles, showAlert]);

  const columns: Column<StaffRoleTableItem>[] = [
    {
      key: 'code',
      header: TABLE_COLUMNS.STAFF_ROLE_CODE,
      sortable: true,
      style: { width: '160px' },
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.STAFF_ROLE_NAME,
      sortable: true,
      style: { minWidth: '160px' },
    },
    {
      key: 'category',
      header: TABLE_COLUMNS.STAFF_ROLE_CATEGORY,
      sortable: true,
      style: { width: '120px' },
    },
    {
      key: 'is_direct_care',
      header: TABLE_COLUMNS.IS_DIRECT_CARE,
      sortable: true,
      style: { width: '100px', textAlign: 'center' },
      render: (item: StaffRoleTableItem) => (item.is_direct_care ? '○' : '-'),
    },
    {
      key: 'description',
      header: TABLE_COLUMNS.DESCRIPTION,
      sortable: true,
      style: { minWidth: '240px' },
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: StaffRoleTableItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: StaffRoleTableItem) => item.valid_to || '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage 
      title="職種"
      data={items} 
      columns={columns} 
      initialSort={{ key: 'sort_order', direction: 'asc' }}
      emptyMessage="登録されている職種がありません" 
      hideHeader={true}
    />
  );
}

