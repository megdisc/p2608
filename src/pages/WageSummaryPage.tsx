import React, { useEffect } from 'react';
import { MonthInput, Pagination, MultiRowHeader, Button, type HeaderCell } from '../components/ui';
import { MESSAGES } from '../constants';

import { getCurrentJSTMonth } from '../utils';
import { useAlert, useOffice } from '../contexts';
import { useWageSummary } from '../hooks';

export function WageSummaryPage() {
  const { selectedOfficeId } = useOffice();
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
    sortedData,
    canConfirmWageSummary,
    isWageSummaryConfirmed
  } = useWageSummary();
  const { showAlert } = useAlert();

  const totals = React.useMemo(() => {
    return sortedData.reduce(
      (acc, r) => ({
        basicWage: acc.basicWage + (r.basicWage || 0),
        incentiveTotal: acc.incentiveTotal + (r.incentiveTotal || 0),
        allowanceTotal: acc.allowanceTotal + (r.allowanceTotal || 0),
        wageTotal: acc.wageTotal + (r.wageTotal || 0),
        dedTotal: acc.dedTotal + (r.dedTotal || 0),
        payment: acc.payment + (r.payment || 0),
      }),
      { basicWage: 0, incentiveTotal: 0, allowanceTotal: 0, wageTotal: 0, dedTotal: 0, payment: 0 }
    );
  }, [sortedData]);

  useEffect(() => {
    fetchWageSummary(currentMonth, selectedOfficeId).catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [currentMonth, selectedOfficeId, fetchWageSummary, showAlert]);

  const handleConfirm = async () => {
    if (!canConfirmWageSummary) {
      showAlert('当該月の作業記録および案件の月次インセンティブ分配が確定済になった後のみ確定できます。', 'error');
      return;
    }
    try {
      await confirmWageSummary(currentMonth, selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS || '確定・保存が完了しました。', 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR || '確定処理に失敗しました。', 'error');
    }
  };

  const handleUnconfirm = async () => {
    try {
      await cancelWageSummary(currentMonth, selectedOfficeId);
      showAlert('確定を解除しました。', 'success');
    } catch {
      showAlert('解除処理に失敗しました。', 'error');
    }
  };

  const headerRows: HeaderCell[][] = [
    [
      { label: '氏名', width: '200px', sortKey: 'name' },
      { label: '勘定科目', width: '180px' },
      { label: '摘要' },
      { label: '金額', width: '140px' },
      { label: '備考', width: '160px' }
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
                <td colSpan={5} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => {
                type DetailItem = {
                  subject: string;
                  content: string;
                  amount: number;
                  remarks: string;
                  isBold?: boolean;
                  isHighlight?: boolean;
                  isTotalRow?: boolean;
                };

                const incentiveRows: DetailItem[] = (row.taskIncentives && row.taskIncentives.length > 0)
                  ? [
                      ...row.taskIncentives.map(t => ({
                        subject: 'インセンティブ',
                        content: `案件：${t.projectName}、タスク：${t.taskName}`,
                        amount: t.amount ?? 0,
                        remarks: '-',
                        isBold: false
                      })),
                      { subject: 'インセンティブ', content: '合計', amount: row.incentiveTotal ?? 0, remarks: '-', isBold: true }
                    ]
                  : [
                      { subject: 'インセンティブ', content: '（該当なし）', amount: 0, remarks: '-', isBold: false },
                      { subject: 'インセンティブ', content: '合計', amount: row.incentiveTotal ?? 0, remarks: '-', isBold: true }
                    ];

                const allowanceRows: DetailItem[] = (row.allowanceItems && row.allowanceItems.length > 0)
                  ? [
                      ...row.allowanceItems.map(item => ({
                        subject: '加算手当',
                        content: item.name,
                        amount: item.amount ?? 0,
                        remarks: '-',
                        isBold: false
                      })),
                      { subject: '加算手当', content: '合計', amount: row.allowanceTotal ?? 0, remarks: '-', isBold: true }
                    ]
                  : [
                      { subject: '加算手当', content: '（該当なし）', amount: 0, remarks: '-', isBold: false },
                      { subject: '加算手当', content: '合計', amount: row.allowanceTotal ?? 0, remarks: '-', isBold: true }
                    ];

                const deductionRows: DetailItem[] = (row.deductionItems && row.deductionItems.length > 0)
                  ? [
                      ...row.deductionItems.map(item => ({
                        subject: '控除',
                        content: item.name,
                        amount: item.amount ?? 0,
                        remarks: '-',
                        isBold: false
                      })),
                      { subject: '控除', content: '合計', amount: row.dedTotal ?? 0, remarks: '-', isBold: true }
                    ]
                  : [
                      { subject: '控除', content: '（該当なし）', amount: 0, remarks: '-', isBold: false },
                      { subject: '控除', content: '合計', amount: row.dedTotal ?? 0, remarks: '-', isBold: true }
                    ];

                const items: DetailItem[] = [
                  { subject: '基本工賃', content: `工賃単価¥${(row.wageRate ?? 0).toLocaleString()}*作業時間${row.workTime ?? 0}h`, amount: row.basicWage ?? 0, remarks: '-', isBold: false },
                  { subject: '基本工賃', content: '合計', amount: row.basicWage ?? 0, remarks: '-', isBold: true },
                  ...incentiveRows,
                  ...allowanceRows,
                  { subject: '工賃合計', content: '合計', amount: row.wageTotal ?? 0, remarks: '-', isBold: true, isTotalRow: true },
                  ...deductionRows,
                  { subject: '支給額', content: '差引支給額', amount: row.payment ?? 0, remarks: '-', isBold: true, isHighlight: true, isTotalRow: true }
                ];

                const totalRows = items.length;

                return (
                  <React.Fragment key={row.id}>
                    {items.map((item, idx) => {
                      const isFirstRow = idx === 0;
                      const isLastRow = idx === totalRows - 1;
                      const prevItem = idx > 0 ? items[idx - 1] : null;
                      const nextItem = idx < totalRows - 1 ? items[idx + 1] : null;

                      const isSameSubjectAsPrev = prevItem && prevItem.subject === item.subject;
                      const isSameSubjectAsNext = nextItem && nextItem.subject === item.subject;
                      const isFirstInSubject = !isSameSubjectAsPrev;
                      const isLastInSubject = !isSameSubjectAsNext;

                      const rowBorderBottom = isLastRow ? undefined : 'none';
                      const rowBg = item.isTotalRow ? 'var(--color-bg-subtle, #f9fafb)' : undefined;

                      return (
                        <tr
                          key={`${row.id}-item-${idx}`}
                          style={{ backgroundColor: rowBg }}
                        >
                          <td style={{ borderBottom: rowBorderBottom }}>
                            {isFirstRow ? row.name : ''}
                          </td>
                          <td
                            style={{
                              fontWeight: item.isBold ? 'bold' : 'normal',
                              WebkitTextStroke: item.isBold ? '0.5px currentColor' : undefined,
                              borderBottom: isLastInSubject ? undefined : 'none'
                            }}
                          >
                            {isFirstInSubject ? item.subject : ''}
                          </td>
                          <td
                            style={{
                              fontWeight: item.isBold ? 'bold' : 'normal',
                              WebkitTextStroke: item.isBold ? '0.5px currentColor' : undefined
                            }}
                          >
                            {item.content}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: item.isBold ? 'bold' : 'normal',
                              WebkitTextStroke: item.isBold ? '0.5px currentColor' : undefined,
                              color: item.isHighlight ? 'var(--color-primary)' : undefined
                            }}
                          >
                            ¥{(item.amount ?? 0).toLocaleString()}
                          </td>
                          <td>
                            {item.remarks}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
          {sortedData.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle, #f9fafb)', borderTop: '2px solid var(--color-border)' }}>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }} rowSpan={6}>
                  事業所合計
                </td>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>基本工賃</td>
                <td>合計</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  ¥{totals.basicWage.toLocaleString()}
                </td>
                <td>-</td>
              </tr>
              <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>インセンティブ</td>
                <td>合計</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  ¥{totals.incentiveTotal.toLocaleString()}
                </td>
                <td>-</td>
              </tr>
              <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>加算手当</td>
                <td>合計</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  ¥{totals.allowanceTotal.toLocaleString()}
                </td>
                <td>-</td>
              </tr>
              <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>工賃合計</td>
                <td>合計</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  ¥{totals.wageTotal.toLocaleString()}
                </td>
                <td>-</td>
              </tr>
              <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>控除</td>
                <td>合計</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  ¥{totals.dedTotal.toLocaleString()}
                </td>
                <td>-</td>
              </tr>
              <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle, #f9fafb)', borderBottom: '2px solid var(--color-border)' }}>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>支給額</td>
                <td>差引支給額</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', color: 'var(--color-primary)' }}>
                  ¥{totals.payment.toLocaleString()}
                </td>
                <td>-</td>
              </tr>
            </tfoot>
          )}
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
              title={!canConfirmWageSummary ? '作業記録および月次インセンティブ分配が確定済になった後のみ確定できます' : undefined}
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
