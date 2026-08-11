import { useState } from 'react';
import { MultiRowHeader, type HeaderCell, Pagination, MonthDisplay } from '../components/ui';
import { MESSAGES, WORDS_PROJECT } from '../constants';
import { useProjectFinancialRecords } from '../hooks';
import { useAlert } from '../contexts';
import { useEffect } from 'react';

export function ProjectFinancialRecordPage() {
  const { items, loading, fetchRecords } = useProjectFinancialRecords();
  const { showAlert } = useAlert();
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'projectName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert('収支記録の取得に失敗しました', 'error');
    });
  }, [fetchRecords, showAlert]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0;
    if (sortConfig.key === 'projectName') {
      const aVal = a.projectName || '';
      const bVal = b.projectName || '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / pageSize);
  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const headerRows: HeaderCell[][] = [
    [
      { label: '案件', rowSpan: 2, width: '200px', sortKey: 'projectName' },
      { label: '対象時期', rowSpan: 2, width: '120px' },
      { label: '収益', colSpan: 2 },
      { label: '費用', colSpan: 2 },
      { label: '積立金', colSpan: 2 },
      { label: '余剰', rowSpan: 2, width: '120px' }
    ],
    [
      { label: '科目' },
      { label: '金額' },
      { label: '科目' },
      { label: '金額' },
      { label: '科目' },
      { label: '金額' }
    ]
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          {paginatedItems.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={10} className="empty-message">案件データがありません</td>
              </tr>
            </tbody>
          ) : (
            paginatedItems.map(proj => {
              // Group records by period
              const periodMap: Record<string, { rev: number, exp: number, res: number }> = {};
              
              if (proj.records.length === 0) {
                periodMap['-'] = { rev: 0, exp: 0, res: 0 };
              } else {
                proj.records.forEach(r => {
                  const p = r.period || '-';
                  if (!periodMap[p]) periodMap[p] = { rev: 0, exp: 0, res: 0 };
                  if (r.type === 'revenue') periodMap[p].rev += r.amount;
                  if (r.type === 'expense') periodMap[p].exp += r.amount;
                  if (r.type === 'reserve') periodMap[p].res += r.amount;
                });
              }

              const periods = Object.keys(periodMap).sort((a, b) => b.localeCompare(a)); // desc
              
              return (
                <tbody key={proj.id} style={{ display: 'contents' }}>
                  {periods.map((period, index) => {
                    const data = periodMap[period];
                    const surplus = data.rev - data.exp - data.res;
                    return (
                      <tr key={`${proj.id}-${period}`}>
                        <td style={{ borderBottom: 'none' }}>
                          {index === 0 ? proj.projectName : ''}
                        </td>
                        <td>{period !== '-' ? <MonthDisplay value={period} /> : '-'}</td>
                        <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                          <strong>{WORDS_PROJECT.TOTAL}</strong>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          ¥{data.rev.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                          <strong>{WORDS_PROJECT.TOTAL}</strong>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          ¥{data.exp.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                          <strong>{WORDS_PROJECT.TOTAL}</strong>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          ¥{data.res.toLocaleString()}
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          fontWeight: 'bold', 
                          WebkitTextStroke: '0.5px currentColor',
                          fontVariantNumeric: 'tabular-nums',
                          paddingRight: '8px'
                        }}>
                          <strong style={{ color: surplus !== 0 ? 'var(--color-error)' : 'inherit' }}>
                            ¥{surplus.toLocaleString()}
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })
          )}
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls"></div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        <div style={{ flex: 1 }}></div>
      </div>
    </>
  );
}
