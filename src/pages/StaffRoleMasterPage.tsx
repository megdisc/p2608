import { useEffect } from 'react';
import { DataPage, type Column, DateDisplay } from '../components';
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
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.STAFF_ROLE_NAME,
      sortable: true,
      className: 'bg-base-data',
      style: { backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'category',
      header: TABLE_COLUMNS.STAFF_ROLE_CATEGORY,
      sortable: true,
      className: 'bg-base-data',
      style: { backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'is_direct_care',
      header: TABLE_COLUMNS.IS_DIRECT_CARE,
      sortable: true,
      className: 'bg-base-data',
      style: { textAlign: 'center', backgroundColor: 'var(--palette-yellow-300)' },
      render: (item: StaffRoleTableItem) => (item.is_direct_care ? '○' : '-'),
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: StaffRoleTableItem) => <DateDisplay value={item.valid_from} fallback="-" />,
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: StaffRoleTableItem) => <DateDisplay value={item.valid_to} fallback="-" />,
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage 
      title="職種"
      data={items} 
      columns={columns} 
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている職種がありません" 
      hideHeader={true}
    />
  );
}

