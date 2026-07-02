import React, { useEffect, useState } from 'react';
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
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetchWageSummary(currentMonth).catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [currentMonth, fetchWageSummary, showAlert]);

    const headerRows: HeaderCell[][] = [
    [
      { label: '氏名', rowSpan: 2, width: '200px', sortKey: 'name' },
      { label: '工賃', colSpan: 3 },
      { label: '控除', colSpan: 3 },
      { label: '支給額', rowSpan: 2, width: '150px' }
    ],
    [
      { label: '科目', width: '150px' },
      { label: '内容' },
      { label: '金額', width: '120px' },
      { label: '科目', width: '150px' },
      { label: '内容' },
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
                <td colSpan={8} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => {
                const incentiveRows = row.taskIncentives.length > 0 
                  ? [
                      ...row.taskIncentives.map((t, i) => ({ 
                        subject: 'インセンティブ', 
                        content: `${t.projectName}：${t.taskName}`, 
                        amount: t.amount, 
                        isBold: false,
                        rowSpan: i === 0 ? row.taskIncentives.length + 2 : undefined,
                        hideSubject: i > 0
                      })),
                      { subject: 'インセンティブ', content: '差引（基本工賃分）', amount: row.basicWage === null ? null : -row.basicWage, isBold: false, rowSpan: undefined, hideSubject: true },
                      { subject: 'インセンティブ', content: '合計', amount: row.incentiveTotal, isBold: true, rowSpan: undefined, hideSubject: true }
                    ]
                  : [
                      { subject: 'インセンティブ', content: '差引（基本工賃分）', amount: row.basicWage === null ? null : -row.basicWage, isBold: false, rowSpan: 2, hideSubject: false },
                      { subject: 'インセンティブ', content: '合計', amount: row.incentiveTotal, isBold: true, rowSpan: undefined, hideSubject: true }
                    ];

                const wageItems = [
                  { subject: '基本工賃', content: `工賃単価¥${row.wageRate?.toLocaleString() ?? 0}*作業時間${row.workTime}h`, amount: row.basicWage, isBold: false, rowSpan: 2, hideSubject: false },
                  { subject: '基本工賃', content: '合計', amount: row.basicWage, isBold: true, rowSpan: undefined, hideSubject: true },
                  ...incentiveRows,
                  { subject: 'その他加算', content: '未設計', amount: 0, isBold: false, rowSpan: 2, hideSubject: false },
                  { subject: 'その他加算', content: '合計', amount: 0, isBold: true, rowSpan: undefined, hideSubject: true },
                  { subject: '工賃合計', content: '', amount: row.wageTotal, isBold: true, rowSpan: undefined, hideSubject: false },
                ];
                
                const maxRows = wageItems.length;
                
                return (
                  <React.Fragment key={row.id}>
                    {wageItems.map((item, index) => {
                      const isLast = index === maxRows - 1;
                      return (
                        <tr 
                          key={`${row.id}-item-${index}`}
                          onMouseEnter={() => setHoveredMemberId(isLast ? row.id : null)}
                          onMouseLeave={() => setHoveredMemberId(null)}
                        >
                          {index === 0 && (
                            <td 
                              rowSpan={maxRows} 
                              style={{ 
                                verticalAlign: 'top',
                                backgroundColor: hoveredMemberId === row.id ? 'var(--color-bg-subtle)' : undefined,
                                transition: 'background-color 0.2s'
                              }}
                            >
                              {row.name}
                            </td>
                          )}
                          {!item.hideSubject && (
                            <td 
                              rowSpan={item.rowSpan}
                              style={item.isBold ? { fontWeight: 'bold', verticalAlign: 'top' } : { verticalAlign: 'top' }}
                            >
                              {item.subject}
                            </td>
                          )}
                          <td style={item.isBold ? { fontWeight: 'bold' } : undefined}>
                            {item.content}
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...(item.isBold ? { fontWeight: 'bold' } : {}) }}>
                            {item.amount === null ? '-' : `¥${item.amount.toLocaleString()}`}
                          </td>
                          {isLast ? (
                            <>
                              <td style={{ fontWeight: 'bold' }}>控除合計</td>
                              <td></td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                                {row.dedTotal === null ? '-' : `¥${row.dedTotal.toLocaleString()}`}
                              </td>
                            </>
                          ) : (
                            <>
                              <td></td>
                              <td></td>
                              <td></td>
                            </>
                          )}
                          {isLast ? (
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              ¥{row.payment.toLocaleString()}
                            </td>
                          ) : (
                            <td></td>
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
