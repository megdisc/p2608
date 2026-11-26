import { useEffect } from 'react';
import { DataPage, type Column, DateDisplay } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, WORDS_SYSTEM } from '../constants';
import { useRegionalGradeRates, type RegionalGradeRateItem } from '../hooks';

export function RegionalGradeRatePage() {
  const { items, loading, fetchRates } = useRegionalGradeRates();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchRates().catch(() => {
      showAlert('所在地級数データの取得に失敗しました', 'error');
    });
  }, [fetchRates, showAlert]);

  const columns: Column<RegionalGradeRateItem>[] = [
    {
      key: 'grade',
      header: TABLE_COLUMNS.REGIONAL_GRADE,
      sortable: true,
      className: 'bg-base-data',
      style: { textAlign: 'center', backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'premium_rate',
      header: TABLE_COLUMNS.PREMIUM_RATE,
      sortable: true,
      className: 'quantity bg-base-data',
      style: { textAlign: 'right', backgroundColor: 'var(--palette-yellow-300)' },
      render: (item: RegionalGradeRateItem) => {
        const rate = Number(item.premium_rate) || 0;
        return (rate * 100).toFixed(1);
      },
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: RegionalGradeRateItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: RegionalGradeRateItem) => item.valid_to ? <DateDisplay value={item.valid_to} /> : '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage
      title={WORDS_SYSTEM.REGIONAL_GRADE_RATE}
      data={items}
      columns={columns}
      initialSort={{ key: 'grade', direction: 'asc' }}
      emptyMessage="登録されている所在地級数データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
