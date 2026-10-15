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
    canConfirmWageSummary,
    isWageSummaryConfirmed
  } = useWageSummary();
  const { showAlert } = useAlert();


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
      { label: '利用者ID', width: '120px', sortKey: 'code' },
      { label: '氏名', width: '160px', sortKey: 'name' },
      { label: '取引区分', width: '130px' },
      { label: '勘定科目', width: '150px' },
      { label: '摘要' },
      { label: '金額', width: '130px' },
      { label: '備考', width: '220px' }
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
                <td colSpan={7} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => {
                type DetailItem = {
                  categoryGroup: '工賃　A' | '控除　B' | '差額　A-B';
                  categoryLabel?: string;
                  subject?: string;
                  content?: string;
                  amount: number;
                  remarks?: string;
                  isBold?: boolean;
                  isHighlight?: boolean;
                  isTotalRow?: boolean;
                };

                const items: DetailItem[] = [];

                // 1. 工賃　A 親行
                items.push({
                  categoryGroup: '工賃　A',
                  categoryLabel: '工賃　A',
                  subject: '',
                  content: '',
                  amount: row.wageTotal ?? 0,
                  remarks: '',
                  isBold: true,
                  isTotalRow: true
                });

                // 2. 基本工賃行
                let effectiveWorkTime = row.workTime ?? 0;
                const effectiveBasicWage = row.basicWage ?? 0;
                let effectiveWageRate = row.wageRate ?? 0;

                if (effectiveBasicWage > 0) {
                  if (effectiveWageRate > 0 && effectiveWorkTime > 0 && effectiveWageRate * effectiveWorkTime === effectiveBasicWage) {
                    // 完全に整合している
                  } else if (effectiveWageRate > 0 && effectiveBasicWage % effectiveWageRate === 0) {
                    effectiveWorkTime = effectiveBasicWage / effectiveWageRate;
                  } else if (effectiveWorkTime > 0 && effectiveBasicWage % effectiveWorkTime === 0) {
                    effectiveWageRate = effectiveBasicWage / effectiveWorkTime;
                  } else if (effectiveWageRate > 0) {
                    effectiveWorkTime = Math.max(1, Math.round(effectiveBasicWage / effectiveWageRate));
                    if (effectiveWageRate * effectiveWorkTime !== effectiveBasicWage && effectiveWorkTime > 0) {
                      effectiveWageRate = Math.round(effectiveBasicWage / effectiveWorkTime);
                    }
                  } else if (effectiveWorkTime > 0) {
                    effectiveWageRate = Math.round(effectiveBasicWage / effectiveWorkTime);
                  }
                }

                const basicWageRemark = (effectiveWorkTime > 0 && effectiveWageRate > 0)
                  ? `工賃単価¥${effectiveWageRate.toLocaleString()}*作業時間${effectiveWorkTime}h`
                  : (effectiveWageRate > 0 ? `工賃単価¥${effectiveWageRate.toLocaleString()}` : '');

                items.push({
                  categoryGroup: '工賃　A',
                  categoryLabel: '',
                  subject: '基本工賃',
                  content: '',
                  amount: effectiveBasicWage,
                  remarks: basicWageRemark,
                  isBold: false
                });

                // 3. インセンティブ合計行
                items.push({
                  categoryGroup: '工賃　A',
                  categoryLabel: '',
                  subject: 'インセンティブ',
                  content: '',
                  amount: row.incentiveTotal ?? 0,
                  remarks: '',
                  isBold: false
                });

                // 4. インセンティブ明細
                (row.taskIncentives || []).forEach(t => {
                  items.push({
                    categoryGroup: '工賃　A',
                    categoryLabel: '',
                    subject: '',
                    content: `案件：${t.projectName}、タスク：${t.taskName}`,
                    amount: t.amount ?? 0,
                    remarks: '',
                    isBold: false
                  });
                });

                // 5. 加算手当合計行
                items.push({
                  categoryGroup: '工賃　A',
                  categoryLabel: '',
                  subject: '加算手当',
                  content: '',
                  amount: row.allowanceTotal ?? 0,
                  remarks: '',
                  isBold: false
                });

                // 6. 加算手当明細
                (row.allowanceItems || []).forEach(item => {
                  items.push({
                    categoryGroup: '工賃　A',
                    categoryLabel: '',
                    subject: '',
                    content: item.name,
                    amount: item.amount ?? 0,
                    remarks: item.remarks || '',
                    isBold: false
                  });
                });

                // 7. 控除　B 親行
                items.push({
                  categoryGroup: '控除　B',
                  categoryLabel: '控除　B',
                  subject: '',
                  content: '',
                  amount: row.dedTotal ?? 0,
                  remarks: '',
                  isBold: true,
                  isTotalRow: true
                });

                // 8. 控除明細
                (row.deductionItems || []).forEach(item => {
                  let remarks = item.remarks || '';
                  if (item.amount > 0) {
                    if (item.name.includes('昼食')) {
                      let unit = 200;
                      let count = Math.max(1, Math.round(item.amount / unit));
                      if (unit * count !== item.amount) {
                        if (item.amount % count === 0) {
                          unit = item.amount / count;
                        } else if (item.amount % unit === 0) {
                          count = item.amount / unit;
                        }
                      }
                      remarks = `単価¥${unit.toLocaleString()}*利用回数${count}回`;
                    } else if (item.name.includes('飲料')) {
                      let unit = 30;
                      let days = Math.max(1, Math.round(item.amount / unit));
                      if (unit * days !== item.amount) {
                        if (item.amount % days === 0) {
                          unit = item.amount / days;
                        } else if (item.amount % unit === 0) {
                          days = item.amount / unit;
                        }
                      }
                      remarks = `単価¥${unit.toLocaleString()}*利用日数${days}日`;
                    }
                  }
                  items.push({
                    categoryGroup: '控除　B',
                    categoryLabel: '',
                    subject: '',
                    content: item.name,
                    amount: item.amount ?? 0,
                    remarks: remarks || '',
                    isBold: false
                  });
                });

                // 9. 差額　A-B 行（支給額）
                items.push({
                  categoryGroup: '差額　A-B',
                  categoryLabel: '差額　A-B',
                  subject: '支給額',
                  content: '',
                  amount: row.payment ?? 0,
                  remarks: '',
                  isBold: true,
                  isHighlight: true,
                  isTotalRow: true
                });

                const totalRows = items.length;

                return (
                  <React.Fragment key={row.id}>
                    {items.map((item, idx) => {
                      const isFirstRow = idx === 0;
                      const isLastRow = idx === totalRows - 1;
                      const nextItem = idx < totalRows - 1 ? items[idx + 1] : null;

                      const isLastInCategory = !nextItem || nextItem.categoryGroup !== item.categoryGroup;

                      const rowBorderBottom = isLastRow ? undefined : 'none';
                      const rowBg = item.isTotalRow ? 'var(--color-bg-subtle, #f9fafb)' : undefined;

                      return (
                        <tr
                          key={`${row.id}-item-${idx}`}
                          style={{ backgroundColor: rowBg }}
                        >
                          <td style={{ backgroundColor: '#ffffff', borderBottom: rowBorderBottom }}>
                            {isFirstRow ? row.code : ''}
                          </td>
                          <td style={{ backgroundColor: '#ffffff', borderBottom: rowBorderBottom }}>
                            {isFirstRow ? row.name : ''}
                          </td>
                          <td
                            style={{
                              fontWeight: item.isTotalRow ? 'bold' : 'normal',
                              WebkitTextStroke: item.isTotalRow ? '0.5px currentColor' : undefined,
                              borderBottom: isLastInCategory ? undefined : 'none'
                            }}
                          >
                            {item.categoryLabel || ''}
                          </td>
                          <td
                            style={{
                              fontWeight: (item.isBold && item.subject) ? 'bold' : 'normal',
                              WebkitTextStroke: (item.isBold && item.subject) ? '0.5px currentColor' : undefined
                            }}
                          >
                            {item.subject || ''}
                          </td>
                          <td>
                            {item.content || ''}
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
                            {item.remarks || ''}
                          </td>
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
