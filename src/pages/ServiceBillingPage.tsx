import { useState, Fragment } from 'react';
import { MonthInput, Button } from '../components/ui';
import { MESSAGES, TABLE_COLUMNS, BUTTON_LABELS } from '../constants';
import { useOffice } from '../contexts';
import { useServiceBilling } from '../hooks';
import { getCurrentJSTMonth } from '../utils';

export function ServiceBillingPage() {
  const { selectedOfficeId } = useOffice();
  const {
    currentMonth,
    setCurrentMonth,
    loading,
    data,
  } = useServiceBilling(selectedOfficeId);

  const [expandedMemberIds, setExpandedMemberIds] = useState<Record<string, boolean>>({});

  const toggleMemberExpand = (id: string) => {
    setExpandedMemberIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const newY = date.getFullYear();
    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
    setCurrentMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const newY = date.getFullYear();
    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
    setCurrentMonth(`${newY}-${newM}`);
  };

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th className="w-40 text-center"></th>
              <th className="w-100 text-left">{TABLE_COLUMNS.MEMBER_CODE}</th>
              <th className="w-150 text-left">{TABLE_COLUMNS.NAME}</th>
              <th className="w-80 text-right">{TABLE_COLUMNS.ATTENDANCE_DAYS}</th>
              <th className="w-100 text-right">{TABLE_COLUMNS.BASE_REWARD}</th>
              <th className="w-90 text-right">{TABLE_COLUMNS.ADDITION_TOTAL}</th>
              <th className="w-100 text-right">{TABLE_COLUMNS.TOTAL_UNITS}</th>
              <th className="w-130 text-right">{TABLE_COLUMNS.TOTAL_COST}</th>
              <th className="w-140 text-right">{TABLE_COLUMNS.COPAYMENT_LIMIT}</th>
              <th className="w-110 text-right">{TABLE_COLUMNS.SERVICE_FEE}</th>
              <th className="w-120 text-right">{TABLE_COLUMNS.BENEFIT_BILLING}</th>
              <th className="text-left">{TABLE_COLUMNS.REMARKS}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={12} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              data.map(row => {
                const isExpanded = !!expandedMemberIds[row.memberId];

                return (
                  <Fragment key={row.memberId}>
                    <tr 
                      onClick={() => toggleMemberExpand(row.memberId)}
                      className={`hover-row ${isExpanded ? 'row-bg-subtle' : ''}`}
                    >
                      <td className="text-center text-muted">
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                          ▶
                        </span>
                      </td>
                      <td className="text-left">{row.memberCode}</td>
                      <td className="text-left">
                        {row.memberName}
                        {row.recipientNumber && (
                          <span className="text-nano text-muted d-block">
                            受給者証: {row.recipientNumber}
                          </span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">
                        {row.attendanceDays}
                      </td>
                      <td className="text-right tabular-nums">
                        {row.baseRewardUnits.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums">
                        {row.additionUnits.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums">
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums">
                        ¥{row.totalCostAmount.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums">
                        ¥{row.copaymentLimitAmount.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums">
                        ¥{row.finalCopaymentAmount.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums">
                        ¥{row.benefitBillingAmount.toLocaleString()}
                      </td>
                      <td className="text-left text-caption text-muted">
                        {row.remarks}
                      </td>
                    </tr>

                    {/* 行展開：加算・減算の内訳明細 */}
                    {isExpanded && (
                      <tr className="row-bg-subtle">
                        <td></td>
                        <td colSpan={11} className="cell-padding-wide">
                          <div className="billing-detail-container">
                            <div className="billing-detail-header">
                              【{row.memberName} 様の算定内訳明細】 (地域単価: ¥{row.unitPrice.toFixed(2)})
                            </div>
                            {row.details.length === 0 ? (
                              <div className="billing-detail-empty">
                                算定された明細項目はありません
                              </div>
                            ) : (
                              <table className="billing-detail-table">
                                <thead>
                                  <tr>
                                    <th className="text-left">{TABLE_COLUMNS.ITEM_CATEGORY}</th>
                                    <th className="text-left">{TABLE_COLUMNS.SERVICE_CODE_OR_ITEM}</th>
                                    <th className="text-right">{TABLE_COLUMNS.UNIT_VALUE}</th>
                                    <th className="text-right">{TABLE_COLUMNS.COUNT_DAYS}</th>
                                    <th className="text-right">{TABLE_COLUMNS.TOTAL_UNITS}</th>
                                    <th className="text-right">{TABLE_COLUMNS.AMOUNT_CONVERTED}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.details.map((d, idx) => (
                                    <tr key={idx}>
                                      <td>
                                        <span className={d.itemCategory === 'base_reward' ? 'status-badge-confirmed' : 'status-badge-warning'}>
                                          {d.itemCategory === 'base_reward' ? TABLE_COLUMNS.BASE_REWARD : '加算'}
                                        </span>
                                      </td>
                                      <td>
                                        {d.serviceCode && <span className="text-muted mr-2">[{d.serviceCode}]</span>}
                                        {d.itemName}
                                      </td>
                                      <td className="text-right tabular-nums">
                                        {d.unitValue.toLocaleString()}
                                      </td>
                                      <td className="text-right tabular-nums">
                                        {d.count}
                                      </td>
                                      <td className="text-right tabular-nums">
                                        {d.totalItemUnits.toLocaleString()}
                                      </td>
                                      <td className="text-right tabular-nums">
                                        ¥{Math.floor(d.totalItemUnits * row.unitPrice).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
          {/* 合計フッター */}
          {data.length > 0 && (
            <tfoot>
              <tr className="billing-total-row">
                <td colSpan={3} className="text-center">
                  合計 ({data.length}名)
                </td>
                <td className="text-right tabular-nums">
                  {data.reduce((acc, r) => acc + r.attendanceDays, 0)}
                </td>
                <td className="text-right tabular-nums">
                  {data.reduce((acc, r) => acc + r.baseRewardUnits, 0).toLocaleString()}
                </td>
                <td className="text-right tabular-nums">
                  {data.reduce((acc, r) => acc + r.additionUnits, 0).toLocaleString()}
                </td>
                <td className="text-right tabular-nums">
                  {data.reduce((acc, r) => acc + r.totalUnits, 0).toLocaleString()}
                </td>
                <td className="text-right tabular-nums">
                  ¥{data.reduce((acc, r) => acc + r.totalCostAmount, 0).toLocaleString()}
                </td>
                <td className="text-right">-</td>
                <td className="text-right tabular-nums">
                  ¥{data.reduce((acc, r) => acc + r.finalCopaymentAmount, 0).toLocaleString()}
                </td>
                <td className="text-right tabular-nums">
                  ¥{data.reduce((acc, r) => acc + r.benefitBillingAmount, 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls">
          <div className="flex-row">
            <Button 
              className="btn-circle"
              onClick={handlePrevMonth}
            >
              ＜
            </Button>
            <MonthInput 
              value={currentMonth}
              onChange={setCurrentMonth}
              className="date-filter-pill w-auto min-w-140"
            />
            <Button 
              className="btn-circle"
              onClick={handleNextMonth}
            >
              ＞
            </Button>
            <Button 
              variant="secondary"
              className="btn-compact"
              onClick={() => setCurrentMonth(getCurrentJSTMonth())}
              disabled={currentMonth === getCurrentJSTMonth()}
            >
              {BUTTON_LABELS.THIS_MONTH}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
