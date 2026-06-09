import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { DateTimeInput } from './DateTimeInput';

const DateFilterInput = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        try {
          if ('showPicker' in inputRef.current) {
            (inputRef.current as any).showPicker();
          }
        } catch (e) {
          // Ignore
        }
      }
    }, 10);
  };

  const formattedDate = `${value.split('-')[0]}年${value.split('-')[1]}月${value.split('-')[2]}日`;

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        onBlur={() => setIsEditing(false)}
        className="filter-input"
        style={{ width: '160px', padding: '6px 16px', borderRadius: '9999px' }}
      />
    );
  }

  return (
    <div 
      className="filter-input" 
      onClick={handleClick}
      style={{ width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 6px 16px', cursor: 'pointer', borderRadius: '9999px' }}
    >
      <span>{formattedDate}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'static' }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </div>
  );
};

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
  showDateFilter?: boolean;
};

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  emptyMessage, 
  initialSort,
  onBatchSave,
  onAddRow,
  showDateFilter
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

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

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
    let sourceData = draftData;
    if (showDateFilter) {
      const effStart = startDate <= endDate ? startDate : endDate;
      const effEnd = startDate <= endDate ? endDate : startDate;
      sourceData = sourceData.filter(item => {
        const dateVal = (item as any)['date'];
        if (!dateVal) return false;
        const dStr = typeof dateVal === 'string' ? dateVal.substring(0, 10) : new Date(dateVal).toISOString().substring(0, 10);
        return dStr >= effStart && dStr <= effEnd;
      });
    }

    const existingRows = sourceData.filter(item => !newRowIds.has(item.id));
    const newRows = sourceData.filter(item => newRowIds.has(item.id));

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
  }, [draftData, sortConfig, newRowIds, columns, showDateFilter, startDate, endDate]);

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
    const currentItem = draftData.find(d => d.id === id);
    if (!currentItem) return;

    let newItem = { ...currentItem, [key]: value };
    let syncUpdates: Partial<T> | void = undefined;

    if (col && col.onCellChange) {
      const updateRow = (asyncUpdates: Partial<T>) => {
        setDraftData(currentData => currentData.map(d => d.id === id ? { ...d, ...asyncUpdates } : d));
      };
      syncUpdates = col.onCellChange(value, newItem, updateRow);
      if (syncUpdates) {
        newItem = { ...newItem, ...syncUpdates };
      }
    }

    setDraftData(prev => prev.map(item => item.id === id ? newItem : item));
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
      const sanitizedDrafts = draftData
        .filter(item => {
          if (newRowIds.has(item.id)) {
            const original = originalNewRows.find(r => r.id === item.id);
            if (original && JSON.stringify(original) === JSON.stringify(item)) {
              return false;
            }
          }
          return true;
        })
        .map(item => {
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
        {showDateFilter ? (
          <div className="filter-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DateFilterInput 
                value={startDate} 
                onChange={(val) => setStartDate(val)} 
              />
              <span>～</span>
              <DateFilterInput 
                value={endDate} 
                onChange={(val) => setEndDate(val)} 
              />
            </div>
          </div>
        ) : (
          <div className="filter-controls"></div>
        )}

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
