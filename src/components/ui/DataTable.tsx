import React, { useState, useRef, useEffect } from 'react';

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

export function DataTable<T extends { id: string }>({ data, columns, emptyMessage }: DataTableProps<T>) {
  const [firstColWidth, setFirstColWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

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

  const tableStyle = { '--first-col-width': `${firstColWidth}px` } as React.CSSProperties;

  return (
    <div className="table-container">
      <table className="inventory-table" ref={tableRef} style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((col, idx) => (
                <td key={col.key || idx} className={col.className} style={col.style}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="empty-message">{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
