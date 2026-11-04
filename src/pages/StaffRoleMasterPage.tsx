import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useStaffRoles } from '../hooks';
import type { StaffRoleTableItem } from '../types/db';

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
      key: 'sort_order',
      header: '表示順',
      sortable: true,
      style: { width: '80px', textAlign: 'center' },
    },
    {
      key: 'code',
      header: TABLE_COLUMNS.STAFF_ROLE_CODE || '職種コード',
      sortable: true,
      style: { width: '160px' },
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.STAFF_ROLE_NAME || '職種名',
      sortable: true,
      style: { minWidth: '160px' },
    },
    {
      key: 'category',
      header: TABLE_COLUMNS.STAFF_ROLE_CATEGORY || '職種区分',
      sortable: true,
      style: { width: '120px' },
    },
    {
      key: 'is_direct_care',
      header: TABLE_COLUMNS.IS_DIRECT_CARE || '直接処遇',
      sortable: true,
      style: { width: '100px', textAlign: 'center' },
      render: (item: StaffRoleTableItem) => (item.is_direct_care ? '○' : '-'),
    },
    {
      key: 'description',
      header: TABLE_COLUMNS.DESCRIPTION || '説明',
      sortable: true,
      style: { minWidth: '240px' },
    },
  ];

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

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

