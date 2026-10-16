import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { ServiceTypeItem } from '../hooks';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useServiceTypes } from '../hooks';

export function ServiceTypePage() {
  const { items, loading, fetchServiceTypes } = useServiceTypes();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchServiceTypes().catch(() => {
      showAlert('支援種別データの取得に失敗しました', 'error');
    });
  }, [fetchServiceTypes, showAlert]);

  const columns: Column<ServiceTypeItem>[] = [
    { key: 'code', header: TABLE_COLUMNS.SERVICE_TYPE_CODE, sortable: true },
    { key: 'name', header: TABLE_COLUMNS.SERVICE_TYPE_NAME, sortable: true },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, sortable: true },
  ];

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="支援種別"
      data={items} 
      columns={columns} 
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている支援種別がありません" 
      hideHeader={true}
    />
  );
}
