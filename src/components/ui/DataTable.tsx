import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';

export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  inputType?: 'text' | 'number' | 'select' | 'date';
  options?: { label: string; value: string }[]; // For select
};

type SortConfig = { key: string; direction: 'asc' | 'desc' };

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
  initialSort?: SortConfig;
  onBatchSave?: (drafts: T[], deletedIds: string[]) => void;
  onAddRow?: () => T;
};

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  emptyMessage, 
  initialSort,
  onBatchSave,
  onAddRow
}: DataTableProps<T>) {
  const [firstColWidth, setFirstColWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);
  
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => initialSort || {
    key: columns.length > 0 ? columns[0].key : '',
    direction: 'asc'
  });

  const [draftData, setDraftData] = useState<T[]>(data);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  
  // Sync when parent data changes (e.g. after save)
  useEffect(() => {
    setDraftData(data);
    setDeletedIds(new Set());
    setNewRowIds(new Set());
  }, [data]);

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
  }, [draftData, columns, onBatchSave]);

  const sortedData = useMemo(() => {
    const existingRows = draftData.filter(item => !newRowIds.has(item.id));
    const newRows = draftData.filter(item => newRowIds.has(item.id));

    if (!sortConfig.key) return [...existingRows, ...newRows];
    
    existingRows.sort((a, b) => {
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

    return [...existingRows, ...newRows];
  }, [draftData, sortConfig, newRowIds]);

  const handleSort = (key: string) => {
    if (!key) return;
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleCellChange = (id: string, key: string, value: any) => {
    setDraftData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [key]: value };
      }
      return item;
    }));
  };

  const toggleDelete = (id: string) => {
    setDeletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddClick = () => {
    if (!onAddRow) return;
    const newRow = onAddRow();
    setDraftData(prev => [...prev, newRow]);
    setNewRowIds(prev => new Set(prev).add(newRow.id));
  };

  const handleSaveClick = () => {
    if (onBatchSave) {
      onBatchSave(draftData, Array.from(deletedIds));
    }
  };

  const handleCancelClick = () => {
    setDraftData(data);
    setDeletedIds(new Set());
    setNewRowIds(new Set());
  };

  const renderCellContent = (col: Column<T>, item: T) => {
    const isEditable = !!onBatchSave && col.editable !== false && col.inputType;
    
    if (isEditable) {
      const value = (item as any)[col.key] ?? '';
      
      if (col.inputType === 'select') {
        return (
          <Select 
            value={value} 
            options={col.options}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
          />
        );
      }
      
      return (
        <Input 
          type={col.inputType} 
          value={value} 
          onChange={(e) => handleCellChange(item.id, col.key, col.inputType === 'number' ? Number(e.target.value) : e.target.value)}
        />
      );
    }
    
    return col.render ? col.render(item) : (item as any)[col.key];
  };

  const tableStyle = { '--first-col-width': `${firstColWidth}px` } as React.CSSProperties;
  const isEditingEnabled = !!onBatchSave;


// ... 

  return (
    <>
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
              {isEditingEnabled && <th className="sticky-right" style={{ width: '40px', textAlign: 'center' }}>削除</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => {
              const isDeleted = deletedIds.has(item.id);
              return (
                <tr key={item.id} style={{ opacity: isDeleted ? 0.5 : 1, textDecoration: isDeleted ? 'line-through' : 'none' }}>
                  {columns.map((col, idx) => (
                    <td key={col.key || idx} className={col.className} style={col.style}>
                      {renderCellContent(col, item)}
                    </td>
                  ))}
                  {isEditingEnabled && (
                    <td className="sticky-right" style={{ textAlign: 'center' }}>
                      <Input 
                        type="checkbox" 
                        checked={isDeleted}
                        onChange={() => toggleDelete(item.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (isEditingEnabled ? 1 : 0)} className="empty-message">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isEditingEnabled && (
        <div className="action-bar">
          {onAddRow && (
            <Button onClick={handleAddClick}>
              追加
            </Button>
          )}
          <Button onClick={handleCancelClick}>
            キャンセル
          </Button>
          <Button onClick={handleSaveClick}>
            保存
          </Button>
        </div>
      )}
    </>
  );
}
