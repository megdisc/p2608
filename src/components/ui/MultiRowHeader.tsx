import { SortIcon } from './SortIcon';

export type HeaderCell = {
  label: string;
  rowSpan?: number;
  colSpan?: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortKey?: string;
};

type MultiRowHeaderProps = {
  rows: HeaderCell[][];
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
};

export function MultiRowHeader({ rows, sortConfig, onSort }: MultiRowHeaderProps) {
  return (
    <thead>
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cell, cellIndex) => {
            const isSortable = !!cell.sortKey;
            // 1行目は左寄せ (Requirement: テーブルヘッダーが複数行ある場合でも、1行目は左寄せとせよ)
            const defaultAlign = rowIndex === 0 ? 'left' : 'center';
            const textAlign = cell.align || defaultAlign;

            return (
              <th
                key={cellIndex}
                rowSpan={cell.rowSpan}
                colSpan={cell.colSpan}
                style={{
                  width: cell.width,
                  textAlign,
                  cursor: isSortable ? 'pointer' : 'default',
                  userSelect: isSortable ? 'none' : 'auto',
                  backgroundColor: rowIndex > 0 ? 'var(--color-bg-subtle)' : undefined,
                  top: rowIndex > 0 ? '43px' : undefined
                }}
                onClick={() => {
                  if (isSortable && onSort && cell.sortKey) {
                    onSort(cell.sortKey);
                  }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  justifyContent: textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start' 
                }}>
                  {cell.label}
                  {isSortable && (
                    <SortIcon
                      active={sortConfig?.key === cell.sortKey}
                      direction={sortConfig?.key === cell.sortKey ? sortConfig!.direction : 'asc'}
                    />
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
