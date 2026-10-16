import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { QualificationItem } from '../hooks';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useQualifications } from '../hooks';

export function QualificationPage() {
  const { items, loading, fetchQualifications } = useQualifications();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchQualifications().catch(() => {
      showAlert('資格データの取得に失敗しました', 'error');
    });
  }, [fetchQualifications, showAlert]);

  const columns: Column<QualificationItem>[] = [
    { key: 'code', header: TABLE_COLUMNS.QUALIFICATION_CODE, sortable: true },
    { key: 'name', header: TABLE_COLUMNS.QUALIFICATION_NAME, sortable: true },
    { key: 'category', header: TABLE_COLUMNS.TYPE, sortable: true },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, sortable: true },
  ];

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="資格"
      data={items} 
      columns={columns} 
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている資格がありません" 
      hideHeader={true}
    />
  );
}
