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
      showAlert('所在地級数上乗せ割合データの取得に失敗しました', 'error');
    });
  }, [fetchRates, showAlert]);

  const columns: Column<RegionalGradeRateItem>[] = [
    {
      key: 'grade',
      header: TABLE_COLUMNS.REGIONAL_GRADE,
      sortable: true,
      style: { width: '140px', textAlign: 'center' },
    },
    {
      key: 'premium_rate',
      header: TABLE_COLUMNS.PREMIUM_RATE,
      sortable: true,
      className: 'quantity',
      style: { width: '160px', textAlign: 'right', fontWeight: 'bold' },
      render: (item: RegionalGradeRateItem) => {
        const rate = Number(item.premium_rate) || 0;
        return `${(rate * 100).toFixed(1)}%`;
      },
    },
    {
      key: 'display_order',
      header: '表示順',
      sortable: true,
      style: { width: '100px', textAlign: 'center' },
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: RegionalGradeRateItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: RegionalGradeRateItem) => item.valid_to ? <DateDisplay value={item.valid_to} /> : '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage
      title={WORDS_SYSTEM.REGIONAL_GRADE_RATE}
      data={items}
      columns={columns}
      initialSort={{ key: 'display_order', direction: 'asc' }}
      emptyMessage="登録されている所在地級数上乗せ割合データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
