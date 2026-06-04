import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { DateTimeInput } from './DateTimeInput';

export type Column<T> = {
  key: string;
  header: string;
  sortKey?: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  inputType?: 'text' | 'number' | 'select' | 'date' | 'datetime-local' | 'email' | 'password';
  options?: { label: string; value: string }[] | ((item: T) => { label: string; value: string }[]);
  onCellChange?: (newValue: any, item: T, updateRow: (updates: Partial<T>) => void) => Partial<T> | void;
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
  const [originalNewRows, setOriginalNewRows] = useState<T[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  // Sync when parent data changes (e.g. after save)
  useEffect(() => {
    setDraftData(data);
    setDeletedIds(new Set());
    setNewRowIds(new Set());
    setOriginalNewRows([]);
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

  const { sortedExistingRows, newRows } = useMemo(() => {
    const existingRows = draftData.filter(item => !newRowIds.has(item.id));
    const newRows = draftData.filter(item => newRowIds.has(item.id));

    if (!sortConfig.key) return { sortedExistingRows: existingRows, newRows };
    
    existingRows.sort((a, b) => {
      const col = columns.find(c => c.key === sortConfig.key);
      const actualSortKey = col?.sortKey || sortConfig.key;

      let aVal = (a as any)[actualSortKey];
      let bVal = (b as any)[actualSortKey];
      
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return { sortedExistingRows: existingRows, newRows };
  }, [draftData, sortConfig, newRowIds, columns]);

  const totalItems = sortedExistingRows.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const visibleData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedExisting = sortedExistingRows.slice(startIndex, startIndex + pageSize);
    return [...paginatedExisting, ...newRows];
  }, [sortedExistingRows, newRows, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (!key) return;
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleCellChange = (id: string, key: string, value: any, col?: Column<T>) => {
    setDraftData(prev => prev.map(item => {
      if (item.id === id) {
        let newItem = { ...item, [key]: value };
        if (col && col.onCellChange) {
          const updateRow = (asyncUpdates: Partial<T>) => {
            setDraftData(currentData => currentData.map(d => d.id === id ? { ...d, ...asyncUpdates } : d));
          };
          const updates = col.onCellChange(value, newItem, updateRow);
          if (updates) {
            newItem = { ...newItem, ...updates };
          }
        }
        return newItem;
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
    setOriginalNewRows(prev => [...prev, newRow]);
    
    setTimeout(() => {
      const container = tableRef.current?.closest('.table-container');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSaveClick = () => {
    if (onBatchSave) {
      const sanitizedDrafts = draftData.map(item => {
        const newItem = { ...item };
        columns.forEach(col => {
          if (col.inputType === 'number' && (newItem as any)[col.key] === '') {
            (newItem as any)[col.key] = 0;
          }
        });
        return newItem;
      });
      onBatchSave(sanitizedDrafts, Array.from(deletedIds));
      setDraftData(sanitizedDrafts);
    }
  };

  const handleCancelClick = () => {
    setDraftData(data);
    setDeletedIds(new Set());
    setNewRowIds(new Set());
    setOriginalNewRows([]);
  };

  const renderCellContent = (col: Column<T>, item: T) => {
    const isEditable = !!onBatchSave && col.editable !== false && col.inputType;
    
    if (isEditable) {
      const value = (item as any)[col.key] ?? '';
      
      if (col.inputType === 'select') {
        const currentOptions = typeof col.options === 'function' ? col.options(item) : col.options;
        return (
          <Select 
            value={value} 
            options={currentOptions}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value, col)}
          />
        );
      }
      
      if (col.inputType === 'datetime-local') {
        return (
          <DateTimeInput 
            value={value as string}
            onChange={(newVal) => handleCellChange(item.id, col.key, newVal, col)}
          />
        );
      }

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue: string | number = e.target.value;
        if (col.inputType === 'number') {
          newValue = newValue === '' ? '' : Number(newValue);
        }
        handleCellChange(item.id, col.key, newValue, col);
      };

      return (
        <Input 
          type={col.inputType} 
          value={value} 
          onChange={handleChange}
        />
      );
    }
    
    return col.render ? col.render(item) : (item as any)[col.key];
  };

  const tableStyle = { '--first-col-width': `${firstColWidth}px` } as React.CSSProperties;
  const isEditingEnabled = !!onBatchSave;

  const isExistingModified = useMemo(() => {
    if (deletedIds.size > 0) return true;
    const existingDrafts = draftData.filter(item => !newRowIds.has(item.id));
    return JSON.stringify(existingDrafts) !== JSON.stringify(data);
  }, [draftData, data, deletedIds, newRowIds]);

  const isAddedRowModified = useMemo(() => {
    if (newRowIds.size === 0) return false;
    const addedDrafts = draftData.filter(item => newRowIds.has(item.id));
    return JSON.stringify(addedDrafts) !== JSON.stringify(originalNewRows);
  }, [draftData, newRowIds, originalNewRows]);

  const canCancel = newRowIds.size > 0 || isExistingModified;
  const canSave = isExistingModified || isAddedRowModified;


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
            {visibleData.map((item) => {
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
            {visibleData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (isEditingEnabled ? 1 : 0)} className="empty-message">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="action-bar">
        <div className="filter-controls">
          <div className="filter-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" className="filter-input" placeholder="検索キーワード... (準備中)" disabled />
          </div>
          <button className="icon-btn" disabled title="絞り込み (準備中)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
        </div>

        {isEditingEnabled ? (
          <div className="action-buttons">
            {onAddRow && (
              <Button onClick={handleAddClick}>
                追加
              </Button>
            )}
            <Button onClick={handleCancelClick} disabled={!canCancel}>
              取消
            </Button>
            <Button onClick={handleSaveClick} disabled={!canSave}>
              確定
            </Button>
          </div>
        ) : (
          <div className="action-buttons"></div>
        )}

        <div className="pagination-controls" style={{ gap: '8px' }}>
          <div className="pagination-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ＜
            </Button>
            
            <select 
              className="page-select-pill"
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              disabled={totalPages <= 1}
            >
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>

            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={currentPage === Math.max(1, totalPages) || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              ＞
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
