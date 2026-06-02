import React, { useState, useRef, useEffect, useMemo } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
};

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export function DataTable<T extends { id: string }>({ data, columns, emptyMessage }: DataTableProps<T>) {
  const [firstColWidth, setFirstColWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        const firstTh = tableRef.current.querySelector('th');
        if (firstTh) {
          setFirstColWidth(firstTh.getBoundingClientRect().width);
        }
      }
    };
    
    updateWidth();
    const timer = setTimeout(updateWidth, 50);
    return () => clearTimeout(timer);
  }, [data, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      let aVal = (a as any)[sortConfig.key];
      let bVal = (b as any)[sortConfig.key];
      
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    if (!key) return;
    setSortConfig(current => {
      if (current && current.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null; // Cycle: asc -> desc -> none
      }
      return { key, direction: 'asc' };
    });
  };

  const tableStyle = { '--first-col-width': `${firstColWidth}px` } as React.CSSProperties;

  return (
    <div className="table-container">
      <table className="inventory-table" ref={tableRef} style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={col.key || idx}
                onClick={() => handleSort(col.key)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title={`${col.header}でソート`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.header}
                  <span style={{ fontSize: '0.8em', color: sortConfig?.key === col.key ? 'inherit' : 'transparent' }}>
                    {sortConfig?.key === col.key && sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.id}>
              {columns.map((col, idx) => (
                <td key={col.key || idx} className={col.className} style={col.style}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="empty-message">{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
