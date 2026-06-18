import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { DateTimeInput } from './DateTimeInput';
import { BUTTON_LABELS, TABLE_COLUMNS, MESSAGES } from '../../constants';
import { formatJSTDateOnly, getCurrentJSTDateOnly, getCurrentJSTMonth } from '../../utils/date';

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
        className="date-filter-pill"
        style={{ width: '160px' }}
      />
    );
  }

  return (
    <div 
      className="date-filter-pill" 
      onClick={handleClick}
      style={{ width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
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
  mainRender?: (item: T, addSubRow?: () => void) => React.ReactNode;
  rowType?: 'main' | 'sub' | 'sub-sub';
  className?: string;
  style?: React.CSSProperties | ((item: T) => React.CSSProperties);
  editable?: boolean | ((item: T) => boolean);
  inputType?: 'text' | 'number' | 'select' | 'date' | 'datetime-local' | 'email' | 'password';
  options?: { label: string; value: string }[] | ((item: T) => { label: string; value: string }[]);
  onCellChange?: (newValue: any, item: T, updateRow: (updates: Partial<T>) => void) => Partial<T> | void;
  customEditRender?: (value: any, item: T, onChange: (newValue: any) => void) => React.ReactNode;
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
  showSingleDateFilter?: boolean;
  singleDate?: string;
  onSingleDateChange?: (date: string) => void;
  canEditRow?: (item: T) => boolean;
  canDeleteRow?: (item: T) => boolean;
  hideDeleteColumn?: boolean;
  showRestrictionColumn?: boolean;
  footerLeft?: React.ReactNode;
  subItemsKey?: keyof T;
  onAddSubRow?: (parentId: string) => any;
  subSubItemsKey?: string;
  onAddSubSubRow?: (parentId: string, subParentId: string) => any;
  showMonthFilter?: boolean;
  singleMonth?: string;
  onSingleMonthChange?: (month: string) => void;
};

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  emptyMessage, 
  initialSort,
  onBatchSave,
  onAddRow,
  showDateFilter,
  showSingleDateFilter,
  singleDate: externalSingleDate,
  onSingleDateChange,
  canEditRow,
  canDeleteRow,
  hideDeleteColumn,
  showRestrictionColumn,
  footerLeft,
  subItemsKey,
  onAddSubRow,
  subSubItemsKey,
  onAddSubSubRow,
  showMonthFilter,
  singleMonth,
  onSingleMonthChange
}: DataTableProps<T>) {
  const [firstColWidth, setFirstColWidth] = useState(0);
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, text: string }>({ visible: false, x: 0, y: 0, text: '' });
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
    // 2ヶ月前の日付をJSTで取得
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return formatJSTDateOnly(d);
  });
  const [endDate, setEndDate] = useState(() => getCurrentJSTDateOnly());
  const [internalSingleDate, setInternalSingleDate] = useState(() => getCurrentJSTDateOnly());

  const singleDate = externalSingleDate !== undefined ? externalSingleDate : internalSingleDate;
  const setSingleDate = onSingleDateChange || setInternalSingleDate;

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
        const dStr = formatJSTDateOnly(dateVal);
        return dStr >= effStart && dStr <= effEnd;
      });
    } else if (showSingleDateFilter) {
      sourceData = sourceData.filter(item => {
        const dateVal = (item as any)['date'];
        if (!dateVal) return false;
        const dStr = formatJSTDateOnly(dateVal);
        return dStr === singleDate;
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
  }, [draftData, sortConfig, newRowIds, columns, showDateFilter, showSingleDateFilter, startDate, endDate, singleDate]);

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

  const handleCellChange = (id: string, key: string, value: any, col?: Column<T>, isSubItem: boolean = false, parentId?: string, isSubSubItem: boolean = false, subParentId?: string) => {
    if (isSubSubItem && subParentId && parentId && subItemsKey && subSubItemsKey) {
      setDraftData(prev => prev.map(item => {
        if (item.id === parentId) {
          const subItems = ((item as any)[subItemsKey] as any[]) || [];
          const newSubItems = subItems.map(subItem => {
            if (subItem.id === subParentId) {
              const subSubItems = (subItem[subSubItemsKey] as any[]) || [];
              const newSubSubItems = subSubItems.map(subSubItem =>
                subSubItem.id === id ? { ...subSubItem, [key]: value } : subSubItem
              );
              return { ...subItem, [subSubItemsKey]: newSubSubItems };
            }
            return subItem;
          });
          return { ...item, [subItemsKey]: newSubItems };
        }
        return item;
      }));
      return;
    }

    if (isSubItem && !isSubSubItem && parentId && subItemsKey) {
      setDraftData(prev => prev.map(item => {
        if (item.id === parentId) {
          const subItems = ((item as any)[subItemsKey] as any[]) || [];
          const newSubItems = subItems.map(subItem => 
            subItem.id === id ? { ...subItem, [key]: value } : subItem
          );
          return { ...item, [subItemsKey]: newSubItems };
        }
        return item;
      }));
      return;
    }

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

  const handleAddSubRowClick = (parentId: string) => {
    if (!onAddSubRow || !subItemsKey) return;
    const newSubRow = onAddSubRow(parentId);
    setDraftData(prev => prev.map(item => {
      if (item.id === parentId) {
        const subItems = ((item as any)[subItemsKey] as any[]) || [];
        return { ...item, [subItemsKey]: [...subItems, newSubRow] };
      }
      return item;
    }));
  };

  const handleAddSubSubRowClick = (parentId: string, subParentId: string) => {
    if (!onAddSubSubRow || !subItemsKey || !subSubItemsKey) return;
    const newSubSubRow = onAddSubSubRow(parentId, subParentId);
    setDraftData(prev => prev.map(item => {
      if (item.id === parentId) {
        const subItems = ((item as any)[subItemsKey] as any[]) || [];
        const newSubItems = subItems.map(subItem => {
          if (subItem.id === subParentId) {
            const subSubItems = (subItem[subSubItemsKey] as any[]) || [];
            return { ...subItem, [subSubItemsKey]: [...subSubItems, newSubSubRow] };
          }
          return subItem;
        });
        return { ...item, [subItemsKey]: newSubItems };
      }
      return item;
    }));
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
          if (subItemsKey && (newItem as any)[subItemsKey]) {
            (newItem as any)[subItemsKey] = ((newItem as any)[subItemsKey] as any[])
              .filter(sub => !deletedIds.has(sub.id))
              .map(sub => {
                const newSub = { ...sub };
                if (subSubItemsKey && newSub[subSubItemsKey]) {
                  newSub[subSubItemsKey] = (newSub[subSubItemsKey] as any[]).filter(ssub => !deletedIds.has(ssub.id));
                }
                return newSub;
              });
          }
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

  const renderCellContent = (col: Column<T>, item: any, isSubItem: boolean = false, parentId?: string, isSubSubItem: boolean = false, subParentId?: string) => {
    const isDeleted = deletedIds.has(item.id);
    const isRowEditable = canEditRow && !isSubItem && !isSubSubItem ? canEditRow(item) : true;
    const isEditable = !isDeleted && isRowEditable && !!onBatchSave && (typeof col.editable === 'function' ? col.editable(item) : col.editable !== false) && col.inputType;
    
    if (isEditable) {
      const value = item[col.key] ?? '';
      
      if (col.customEditRender) {
        return col.customEditRender(value, item, (newVal) => handleCellChange(item.id, col.key, newVal, col, isSubItem, parentId, isSubSubItem, subParentId));
      }
      
      if (col.inputType === 'select') {
        const currentOptions = typeof col.options === 'function' ? col.options(item) : col.options;
        return (
          <Select 
            value={value} 
            options={currentOptions}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value, col, isSubItem, parentId, isSubSubItem, subParentId)}
          />
        );
      }
      
      if (col.inputType === 'datetime-local') {
        return (
          <DateTimeInput 
            value={value as string}
            onChange={(newVal) => handleCellChange(item.id, col.key, newVal, col, isSubItem, parentId, isSubSubItem, subParentId)}
          />
        );
      }

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue: string | number = e.target.value;
        if (col.inputType === 'number') {
          newValue = newValue === '' ? '' : Number(newValue);
        }
        handleCellChange(item.id, col.key, newValue, col, isSubItem, parentId, isSubSubItem, subParentId);
      };

      return (
        <Input 
          type={col.inputType} 
          value={value} 
          onChange={handleChange}
        />
      );
    }
    
    return col.render ? col.render(item) : item[col.key];
  };

  const tableStyle = { '--first-col-width': `${firstColWidth}px` } as React.CSSProperties;
  const isEditingEnabled = !!onBatchSave;
  const showDeleteCol = isEditingEnabled && !hideDeleteColumn;

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
              {showDeleteCol && <th className="sticky-right" style={{ width: '40px', textAlign: 'center', right: showRestrictionColumn ? '40px' : '0' }}>{BUTTON_LABELS.DELETE}</th>}
              {showRestrictionColumn && <th className="sticky-right" style={{ width: '40px', textAlign: 'center', right: '0' }}>{TABLE_COLUMNS.RESTRICTION}</th>}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((item) => {
              const isDeleted = deletedIds.has(item.id);
              const isRowDeletable = canDeleteRow ? canDeleteRow(item) : true;
              const isRowEditable = canEditRow ? canEditRow(item) : true;
              const subItems = subItemsKey ? ((item as any)[subItemsKey] as any[]) || [] : [];

              const renderSubSubRows = (subItem: any) => {
                const subSubItems = subSubItemsKey ? (subItem[subSubItemsKey] as any[]) || [] : [];
                return (
                  <React.Fragment key={`${subItem.id}-skills`}>
                    {subSubItems.map(subSubItem => (
                      <tr key={subSubItem.id} className={deletedIds.has(subSubItem.id) || deletedIds.has(subItem.id) || isDeleted ? 'deleted-row' : ''}>
                        {columns.map((col, idx) => {
                          const isMainCol = col.rowType === 'main' || !col.rowType;
                          const isSubCol = col.rowType === 'sub';
                          let borderBottomStyle: string | undefined;
                          if (isMainCol) {
                            const isLastSubItem = subItem === subItems[subItems.length - 1];
                            const isLastSubSubItem = subSubItem === subSubItems[subSubItems.length - 1];
                            if (!isLastSubItem || !isLastSubSubItem) {
                              borderBottomStyle = 'none';
                            }
                          } else if (isSubCol) {
                            const isLastSubSubItem = subSubItem === subSubItems[subSubItems.length - 1];
                            if (!isLastSubSubItem) {
                              borderBottomStyle = 'none';
                            }
                          }
                          const baseStyle = typeof col.style === 'function' ? col.style(subSubItem) : col.style;
                          const customStyle = borderBottomStyle ? { ...baseStyle, borderBottom: borderBottomStyle } : baseStyle;
                          return (
                            <td key={col.key || idx} className={col.className} style={customStyle}>
                              {col.rowType === 'sub-sub' ? renderCellContent(col, subSubItem, false, undefined, true, subItem.id) : null}
                            </td>
                          );
                        })}
                        {showDeleteCol && (
                          <td className="sticky-right" style={{ textAlign: 'center', right: showRestrictionColumn ? '40px' : '0' }}>
                            <Input 
                              type="checkbox" 
                              checked={deletedIds.has(subSubItem.id) || deletedIds.has(subItem.id) || isDeleted}
                              disabled={deletedIds.has(subItem.id) || isDeleted}
                              onChange={() => toggleDelete(subSubItem.id)}
                              className="custom-checkbox"
                            />
                          </td>
                        )}
                        {showRestrictionColumn && <td className="sticky-right" style={{ textAlign: 'center', right: '0' }}></td>}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              };

              return (
                <React.Fragment key={item.id}>
                  <tr 
                    className={isDeleted ? 'deleted-row' : ''}
                    onMouseEnter={(e) => {
                      if (showRestrictionColumn && !isRowEditable) {
                        setTooltip({ visible: true, x: e.clientX, y: e.clientY - 15, text: MESSAGES.RESTRICTED_EDIT });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (showRestrictionColumn && !isRowEditable) {
                        setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY - 15 }));
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltip(prev => ({ ...prev, visible: false }));
                    }}
                  >
                    {columns.map((col, idx) => {
                      const isMainCol = col.rowType === 'main' || !col.rowType;
                      let borderBottomStyle: string | undefined;
                      if (isMainCol && subItems.length > 0) {
                        borderBottomStyle = 'none';
                      }
                      const baseStyle = typeof col.style === 'function' ? col.style(item) : col.style;
                      const customStyle = borderBottomStyle ? { ...baseStyle, borderBottom: borderBottomStyle } : baseStyle;

                      if (col.rowType === 'sub') {
                        return (
                          <td key={col.key || idx} className={col.className} style={customStyle}>
                            {col.mainRender ? col.mainRender(item, () => handleAddSubRowClick(item.id)) : null}
                          </td>
                        );
                      }
                      if (col.rowType === 'sub-sub') {
                        return (
                          <td key={col.key || idx} className={col.className} style={customStyle}>
                            {null}
                          </td>
                        );
                      }
                      return (
                        <td key={col.key || idx} className={col.className} style={customStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {renderCellContent(col, item, false)}
                          </div>
                        </td>
                      );
                    })}
                    {showDeleteCol && (
                      <td className="sticky-right" style={{ textAlign: 'center', right: showRestrictionColumn ? '40px' : '0' }}>
                        {isRowDeletable && (
                          <Input 
                            type="checkbox" 
                            checked={isDeleted}
                            onChange={() => toggleDelete(item.id)}
                            className="custom-checkbox"
                          />
                        )}
                      </td>
                    )}
                    {showRestrictionColumn && (
                      <td className="sticky-right" style={{ textAlign: 'center', right: '0' }}>
                        {!isRowEditable && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        )}
                      </td>
                    )}
                  </tr>

                  {subItems.map(subItem => {
                    const isSubDeleted = deletedIds.has(subItem.id);
                    return (
                      <React.Fragment key={subItem.id}>
                        <tr className={isSubDeleted || isDeleted ? 'deleted-row' : ''}>
                          {columns.map((col, idx) => {
                            const isMainCol = col.rowType === 'main' || !col.rowType;
                            let borderBottomStyle: string | undefined;
                            if (isMainCol) {
                              const isLastSubItem = subItem === subItems[subItems.length - 1];
                              const subSubItems = subSubItemsKey ? (subItem[subSubItemsKey] as any[]) || [] : [];
                              if (!isLastSubItem || subSubItems.length > 0) {
                                borderBottomStyle = 'none';
                              }
                            }
                            const baseStyle = typeof col.style === 'function' ? col.style(subItem) : col.style;
                            const customStyle = borderBottomStyle ? { ...baseStyle, borderBottom: borderBottomStyle } : baseStyle;

                            if (col.rowType === 'sub-sub') {
                              return (
                                <td key={col.key || idx} className={col.className} style={customStyle}>
                                  {col.mainRender ? col.mainRender(item, () => handleAddSubSubRowClick(item.id, subItem.id)) : null}
                                </td>
                              );
                            }
                            return (
                              <td key={col.key || idx} className={col.className} style={customStyle}>
                                {col.rowType === 'sub' ? renderCellContent(col, subItem, true, item.id) : null}
                              </td>
                            );
                          })}
                          {showDeleteCol && (
                            <td className="sticky-right" style={{ textAlign: 'center', right: showRestrictionColumn ? '40px' : '0' }}>
                              <Input 
                                type="checkbox" 
                                checked={isSubDeleted || isDeleted}
                                disabled={isDeleted}
                                onChange={() => toggleDelete(subItem.id)}
                                className="custom-checkbox"
                              />
                            </td>
                          )}
                          {showRestrictionColumn && (
                            <td className="sticky-right" style={{ textAlign: 'center', right: '0' }}>
                            </td>
                          )}
                        </tr>
                        {renderSubSubRows(subItem)}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {visibleData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (showDeleteCol ? 1 : 0) + (showRestrictionColumn ? 1 : 0)} className="empty-message">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="action-bar">
        <div className="filter-controls">
          {showDateFilter ? (
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
          ) : showSingleDateFilter ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  const d = new Date(singleDate);
                  d.setDate(d.getDate() - 1);
                  setSingleDate(formatJSTDateOnly(d));
                }}
              >
                ＜
              </Button>
              <DateFilterInput 
                value={singleDate} 
                onChange={(val) => setSingleDate(val)} 
              />
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  const d = new Date(singleDate);
                  d.setDate(d.getDate() + 1);
                  setSingleDate(formatJSTDateOnly(d));
                }}
              >
                ＞
              </Button>
              <Button 
                variant="secondary"
                style={{ 
                  padding: '0 12px', height: '28px', fontSize: '12px',
                  ...(singleDate === getCurrentJSTDateOnly() ? { backgroundColor: '#cccccc', color: '#666666', cursor: 'not-allowed', borderColor: '#cccccc' } : {})
                }}
                onClick={() => setSingleDate(getCurrentJSTDateOnly())}
                disabled={singleDate === getCurrentJSTDateOnly()}
              >
                今日
              </Button>
            </div>
          ) : showMonthFilter ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  if (singleMonth && onSingleMonthChange) {
                    const [y, m] = singleMonth.split('-');
                    let date = new Date(parseInt(y), parseInt(m) - 1, 1);
                    date.setMonth(date.getMonth() - 1);
                    const newY = date.getFullYear();
                    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                    onSingleMonthChange(`${newY}-${newM}`);
                  }
                }}
              >
                ＜
              </Button>
              <input 
                type="month"
                value={singleMonth || ''}
                onChange={(e) => {
                  if (e.target.value && onSingleMonthChange) {
                    onSingleMonthChange(e.target.value);
                  }
                }}
                className="date-filter-pill"
                style={{ width: '160px' }}
              />
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  if (singleMonth && onSingleMonthChange) {
                    const [y, m] = singleMonth.split('-');
                    let date = new Date(parseInt(y), parseInt(m) - 1, 1);
                    date.setMonth(date.getMonth() + 1);
                    const newY = date.getFullYear();
                    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                    onSingleMonthChange(`${newY}-${newM}`);
                  }
                }}
              >
                ＞
              </Button>
              <Button 
                variant="secondary"
                style={{ 
                  padding: '0 12px', height: '28px', fontSize: '12px',
                  ...(singleMonth === getCurrentJSTMonth() ? { backgroundColor: '#cccccc', color: '#666666', cursor: 'not-allowed', borderColor: '#cccccc' } : {})
                }}
                onClick={() => {
                  if (onSingleMonthChange) {
                    onSingleMonthChange(getCurrentJSTMonth());
                  }
                }}
                disabled={singleMonth === getCurrentJSTMonth()}
              >
                今月
              </Button>
            </div>
          ) : footerLeft ? (
            footerLeft
          ) : null}
        </div>

        {isEditingEnabled ? (
          <div className="action-buttons">
            {onAddRow && (
              <Button onClick={handleAddClick}>
                {BUTTON_LABELS.ADD}
              </Button>
            )}
            <Button onClick={handleCancelClick} disabled={!canCancel}>
              {BUTTON_LABELS.CANCEL}
            </Button>
            <Button variant="primary" onClick={handleSaveClick} disabled={!canSave}>
              {BUTTON_LABELS.SAVE}
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

      {tooltip.visible && createPortal(
        <div 
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'var(--color-bg-inverse)',
            color: 'var(--color-text-inverse)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 99999,
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.text}
        </div>,
        document.body
      )}
    </>
  );
}
