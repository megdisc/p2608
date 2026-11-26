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
    { key: 'name', header: TABLE_COLUMNS.QUALIFICATION_NAME, sortable: true, className: 'bg-base-data', style: { backgroundColor: 'var(--palette-yellow-300)' } },
    { key: 'category', header: TABLE_COLUMNS.TYPE, sortable: true },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, sortable: true },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: QualificationItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: QualificationItem) => item.valid_to || '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

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
