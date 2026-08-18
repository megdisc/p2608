import React, { useEffect } from 'react';
import { MonthInput, Pagination, MultiRowHeader, Button, type HeaderCell } from '../components/ui';
import { MESSAGES } from '../constants';

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
    confirmWageSummary,
    cancelWageSummary,
    totalPages,
    paginatedRows,
    canConfirmWageSummary,
    isWageSummaryConfirmed
  } = useWageSummary();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchWageSummary(currentMonth).catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [currentMonth, fetchWageSummary, showAlert]);

  const handleConfirm = async () => {
    if (!canConfirmWageSummary) {
      showAlert('当該月の作業記録および案件の月次精算が確定済になった後のみ確定できます。', 'error');
      return;
    }
    try {
      await confirmWageSummary(currentMonth);
      showAlert(MESSAGES.SAVE_SUCCESS || '確定・保存が完了しました。', 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR || '確定処理に失敗しました。', 'error');
    }
  };

  const handleUnconfirm = async () => {
    try {
      await cancelWageSummary(currentMonth);
      showAlert('確定を解除しました。', 'success');
    } catch {
      showAlert('解除処理に失敗しました。', 'error');
    }
  };

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
                const totalTaskIncentives = row.taskIncentives.reduce((sum, t) => sum + (t.amount || 0), 0);
                const deductionAmount = row.basicWage === null ? null : -Math.min(totalTaskIncentives, row.basicWage);
                
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
                      { subject: 'インセンティブ', content: '差引（基本工賃分）', amount: deductionAmount, isBold: false, rowSpan: undefined, hideSubject: true },
                      { subject: 'インセンティブ', content: '合計', amount: row.incentiveTotal, isBold: true, rowSpan: undefined, hideSubject: true }
                    ]
                  : [
                      { subject: 'インセンティブ', content: '差引（基本工賃分）', amount: deductionAmount, isBold: false, rowSpan: 2, hideSubject: false },
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
                        <tr key={`${row.id}-item-${index}`}>
                          <td style={{ borderBottom: isLast ? undefined : 'none' }}>
                            {index === 0 ? row.name : ''}
                          </td>
                          <td 
                            style={{ 
                              borderBottom: (wageItems[index + 1]?.hideSubject && wageItems[index + 1]?.subject === item.subject) ? 'none' : undefined,
                              ...(item.isBold && !item.hideSubject ? { fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' } : {})
                            }}
                          >
                            {!item.hideSubject ? item.subject : ''}
                          </td>
                          <td style={item.isBold ? { fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' } : undefined}>
                            {item.content}
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...(item.isBold ? { fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' } : {}) }}>
                            {item.amount === null ? '-' : `¥${item.amount.toLocaleString()}`}
                          </td>
                          {isLast ? (
                            <>
                              <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>控除合計</td>
                              <td></td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                                {row.dedTotal === null ? '-' : `¥${row.dedTotal.toLocaleString()}`}
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ borderBottom: 'none' }}></td>
                              <td style={{ borderBottom: 'none' }}></td>
                              <td style={{ borderBottom: 'none' }}></td>
                            </>
                          )}
                          {isLast ? (
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', color: 'var(--color-primary)' }}>
                              ¥{row.payment.toLocaleString()}
                            </td>
                          ) : (
                            <td style={{ borderBottom: 'none' }}></td>
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
            {isWageSummaryConfirmed ? (
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                確定済
              </span>
            ) : (
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#92400e' }}>
                暫定
              </span>
            )}
          </div>
        </div>
        <div className="action-buttons">
          {!isWageSummaryConfirmed ? (
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!canConfirmWageSummary}
              title={!canConfirmWageSummary ? '作業記録および月次精算が確定済になった後のみ確定できます' : undefined}
            >
              確定
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleUnconfirm}>
              解除
            </Button>
          )}
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
