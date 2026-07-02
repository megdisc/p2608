import React, { useEffect } from 'react';
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
      { label: '工賃', colSpan: 2 },
      { label: '控除', colSpan: 2 },
      { label: '支給額', rowSpan: 2, width: '150px' }
    ],
    [
      { label: '科目' },
      { label: '金額', width: '120px' },
      { label: '科目' },
      { label: '金額', width: '120px' },
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
                <td colSpan={6} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => {
                const wageItems = [
                  { subject: `基本工賃（工賃単価¥${row.wageRate?.toLocaleString() ?? 0}*作業時間${row.workTime}h）`, amount: row.basicWage, isBold: false },
                  { subject: '基本工賃合計', amount: row.basicWage, isBold: true },
                  ...row.taskIncentives.map(t => ({ subject: `インセンティブ（${t.projectName}：${t.taskName}）`, amount: t.amount, isBold: false })),
                  { subject: 'インセンティブ差引', amount: row.basicWage, isBold: false },
                  { subject: 'インセンティブ合計', amount: row.incentiveTotal, isBold: true },
                  { subject: 'その他加算（未設計）', amount: 0, isBold: false },
                  { subject: 'その他加算手当合計', amount: 0, isBold: true },
                  { subject: '工賃合計', amount: row.wageTotal, isBold: true },
                ];
                
                const maxRows = wageItems.length;
                
                return (
                  <React.Fragment key={row.id}>
                    {wageItems.map((item, index) => {
                      const isLast = index === maxRows - 1;
                      return (
                        <tr key={`${row.id}-item-${index}`}>
                          {index === 0 && (
                            <td rowSpan={maxRows} style={{ verticalAlign: 'top' }}>
                              {row.name}
                            </td>
                          )}
                          <td style={item.isBold ? { fontWeight: 'bold' } : undefined}>
                            {item.subject}
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...(item.isBold ? { fontWeight: 'bold' } : {}) }}>
                            {item.amount === null ? '-' : `¥${item.amount.toLocaleString()}`}
                          </td>
                          {isLast ? (
                            <>
                              <td style={{ fontWeight: 'bold' }}>控除合計</td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                                {row.dedTotal === null ? '-' : `¥${row.dedTotal.toLocaleString()}`}
                              </td>
                            </>
                          ) : (
                            <>
                              <td></td>
                              <td></td>
                            </>
                          )}
                          {index === 0 && (
                            <td rowSpan={maxRows} style={{ verticalAlign: 'top', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              ¥{row.payment.toLocaleString()}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
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
