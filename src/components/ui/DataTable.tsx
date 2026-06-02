import React, { useState, useRef, useEffect, useMemo } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

type SortConfig = { key: string; direction: 'asc' | 'desc' };

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
  initialSort?: SortConfig;
};

export function DataTable<T extends { id: string }>({ data, columns, emptyMessage, initialSort }: DataTableProps<T>) {
  const [firstColWidth, setFirstColWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Default to initialSort or first column, ascending
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => initialSort || {
    key: columns.length > 0 ? columns[0].key : '',
    direction: 'asc'
  });

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
    if (!sortConfig.key) return data;
    
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
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
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
                  <span style={{ fontSize: '0.8em', color: sortConfig.key === col.key ? 'inherit' : 'var(--color-border)', transition: 'color 0.2s' }}>
                    {sortConfig.key === col.key && sortConfig.direction === 'desc' ? '▼' : '▲'}
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
