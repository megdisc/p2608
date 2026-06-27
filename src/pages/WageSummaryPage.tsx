import { useEffect } from 'react';
import { MonthInput, Pagination, MultiRowHeader, Button, type HeaderCell } from '../components/ui';
import { PAGE_NAMES, MESSAGES } from '../constants';
import { getCurrentJSTMonth } from '../utils';
import { useAlert } from '../contexts/AlertContext';
import { useWageSummary } from '../hooks';

export function WageSummaryPage() {
  const {
    loading,
    currentMonth,
    setCurrentMonth,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    fetchWageSummary,
    totalPages,
    paginatedRows,
  } = useWageSummary();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchWageSummary(currentMonth).catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [currentMonth, fetchWageSummary, showAlert]);

  const headerRows: HeaderCell[][] = [
    [
      { label: '氏名', rowSpan: 2, width: '200px', sortKey: 'name' },
      { label: '工賃　A', colSpan: 3 },
      { label: '控除　B', colSpan: 3 },
      { label: '支給額　A-B', rowSpan: 2, width: '150px' }
    ],
    [
      { label: '基本工賃', width: '120px' },
      { label: 'インセンティブ', width: '120px' },
      { label: '合計', width: '120px' },
      { label: '項目A', width: '120px' },
      { label: '項目B', width: '120px' },
      { label: '合計', width: '120px' },
    ]
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.WAGE_SUMMARY}</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.basicWage === null ? '-' : `¥${row.basicWage.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    ¥{row.incentive.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                    ¥{row.wageTotal.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.dedA === null ? '-' : `¥${row.dedA.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.dedB === null ? '-' : `¥${row.dedB.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                    {row.dedTotal === 0 ? '-' : `¥${row.dedTotal.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    ¥{row.payment.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const [y, m] = currentMonth.split('-');
                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                date.setMonth(date.getMonth() - 1);
                const newY = date.getFullYear();
                const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                setCurrentMonth(`${newY}-${newM}`);
              }}
            >
              ＜
            </Button>
            <MonthInput 
              value={currentMonth}
              onChange={setCurrentMonth}
              className="date-filter-pill"
              style={{ width: 'auto', minWidth: '140px' }}
            />
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const [y, m] = currentMonth.split('-');
                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                date.setMonth(date.getMonth() + 1);
                const newY = date.getFullYear();
                const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                setCurrentMonth(`${newY}-${newM}`);
              }}
            >
              ＞
            </Button>
            <Button 
              variant="secondary"
              style={{ padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)' }}
              onClick={() => setCurrentMonth(getCurrentJSTMonth())}
              disabled={currentMonth === getCurrentJSTMonth()}
            >
              今月
            </Button>
          </div>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
