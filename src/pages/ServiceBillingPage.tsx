import { useState, Fragment } from 'react';
import { MonthInput, Button } from '../components/ui';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useOffice } from '../contexts';
import { useServiceBilling } from '../hooks/useServiceBilling';
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
              <th style={{ width: '40px', textAlign: 'center' }}></th>
              <th style={{ width: '100px', textAlign: 'left' }}>{TABLE_COLUMNS.MEMBER_CODE}</th>
              <th style={{ width: '150px', textAlign: 'left' }}>{TABLE_COLUMNS.NAME}</th>
              <th style={{ width: '80px', textAlign: 'right' }}>{TABLE_COLUMNS.ATTENDANCE_DAYS}</th>
              <th style={{ width: '100px', textAlign: 'right' }}>{TABLE_COLUMNS.BASE_REWARD}</th>
              <th style={{ width: '90px', textAlign: 'right' }}>{TABLE_COLUMNS.ADDITION_TOTAL}</th>
              <th style={{ width: '100px', textAlign: 'right' }}>{TABLE_COLUMNS.TOTAL_UNITS}</th>
              <th style={{ width: '130px', textAlign: 'right' }}>{TABLE_COLUMNS.TOTAL_COST}</th>
              <th style={{ width: '140px', textAlign: 'right' }}>{TABLE_COLUMNS.COPAYMENT_LIMIT}</th>
              <th style={{ width: '110px', textAlign: 'right' }}>{TABLE_COLUMNS.SERVICE_FEE}</th>
              <th style={{ width: '120px', textAlign: 'right' }}>{TABLE_COLUMNS.BENEFIT_BILLING}</th>
              <th style={{ textAlign: 'left' }}>{TABLE_COLUMNS.REMARKS}</th>
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
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? 'var(--color-bg-subtle)' : undefined,
                      }}
                      className="hover-row"
                    >
                      <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          transition: 'transform 0.2s', 
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          fontSize: '10px'
                        }}>
                          ▶
                        </span>
                      </td>
                      <td style={{ textAlign: 'left' }}>{row.memberCode}</td>
                      <td style={{ textAlign: 'left' }}>
                        {row.memberName}
                        {row.recipientNumber && (
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            受給者証: {row.recipientNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.attendanceDays}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.baseRewardUnits.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.additionUnits.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{row.totalCostAmount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{row.copaymentLimitAmount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{row.finalCopaymentAmount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{row.benefitBillingAmount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'left', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                        {row.remarks}
                      </td>
                    </tr>

                    {/* 行展開：加算・減算の内訳明細 */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                        <td></td>
                        <td colSpan={11} style={{ padding: '12px 16px' }}>
                          <div style={{ background: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', marginBottom: '8px', color: 'var(--color-text-main)' }}>
                              【{row.memberName} 様の算定内訳明細】 (地域単価: ¥{row.unitPrice.toFixed(2)})
                            </div>
                            {row.details.length === 0 ? (
                              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                                算定された明細項目はありません
                              </div>
                            ) : (
                              <table style={{ width: '100%', fontSize: 'var(--text-caption)', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                                    <th style={{ textAlign: 'left', padding: '4px' }}>{TABLE_COLUMNS.ITEM_CATEGORY}</th>
                                    <th style={{ textAlign: 'left', padding: '4px' }}>{TABLE_COLUMNS.SERVICE_CODE_OR_ITEM}</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>{TABLE_COLUMNS.UNIT_VALUE}</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>{TABLE_COLUMNS.COUNT_DAYS}</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>{TABLE_COLUMNS.TOTAL_UNITS}</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>{TABLE_COLUMNS.AMOUNT_CONVERTED}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.details.map((d, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px dashed var(--color-border)' }}>
                                      <td style={{ padding: '6px 4px' }}>
                                        <span style={{ 
                                          padding: '1px 6px', 
                                          borderRadius: '3px', 
                                          fontSize: '10px',
                                          background: d.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-100)' : 'var(--palette-yellow-100)',
                                          color: d.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-800)' : 'var(--palette-yellow-800)'
                                        }}>
                                          {d.itemCategory === 'base_reward' ? TABLE_COLUMNS.BASE_REWARD : '加算'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '6px 4px' }}>
                                        {d.serviceCode && <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>[{d.serviceCode}]</span>}
                                        {d.itemName}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
                                        {d.unitValue.toLocaleString()}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
                                        {d.count}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
                                        {d.totalItemUnits.toLocaleString()}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
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
              <tr style={{ background: 'var(--color-bg-subtle)', fontWeight: 'var(--weight-heading)' }}>
                <td colSpan={3} style={{ textAlign: 'center' }}>
                  合計 ({data.length}名)
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.attendanceDays, 0)}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.baseRewardUnits, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.additionUnits, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.totalUnits, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  ¥{data.reduce((acc, r) => acc + r.totalCostAmount, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right' }}>-</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  ¥{data.reduce((acc, r) => acc + r.finalCopaymentAmount, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={handlePrevMonth}
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
              onClick={handleNextMonth}
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
      </div>
    </>
  );
}
