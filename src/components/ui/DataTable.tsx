import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { RadioButton } from './RadioButton';
import { DateTimeInput } from './DateTimeInput';
import { BUTTON_LABELS, TABLE_COLUMNS, MESSAGES } from '../../constants';
import { formatJSTDateOnly, getCurrentJSTDateOnly, getCurrentJSTMonth, compareValues } from '../../utils';

import { DateInput } from './DateInput';
import { DateDisplay } from './DateDisplay';
import { MonthInput } from './MonthInput';
import { MonthDisplay } from './MonthDisplay';
import { YearInput } from './YearInput';
import { Pagination } from './Pagination';
import { NumberInput } from './NumberInput';
import { NumberDisplay } from './NumberDisplay';
import { CurrencyInput } from './CurrencyInput';
import { SortIcon } from './SortIcon';

export type Column<T> = {
  key: string;
  header: string;
  sortKey?: string;
  sortable?: boolean;
  render?: (item: T, draftData: T[], updateData: (newData: T[]) => void) => React.ReactNode;
  mainRender?: (item: T, addSubRow?: () => void, subItem?: any) => React.ReactNode;
  rowType?: 'main' | 'sub' | 'sub-sub';
  className?: string;
  style?: React.CSSProperties | ((item: T, draftData?: T[]) => React.CSSProperties);
  editable?: boolean | ((item: T) => boolean);
  inputType?: 'text' | 'number' | 'currency' | 'select' | 'radio' | 'date' | 'month' | 'datetime-local' | 'email' | 'password' | 'checkbox';
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
  onAddRow?: (currentData: T[]) => T;
  showDateFilter?: boolean;
  dateFilterKey?: string;
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
  showYearFilter?: boolean;
  singleYear?: string;
  onSingleYearChange?: (year: string) => void;
  disableAddButton?: boolean;
  highlightInputColumns?: boolean;
  restrictionTooltipText?: string;
  hideSubSubItems?: (subItem: any) => boolean;
  serverSidePagination?: boolean;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortConfig?: SortConfig;
  onSortChange?: (sortConfig: SortConfig) => void;
  onDateFilterChange?: (startDate: string, endDate: string) => void;
  isConfirmed?: boolean;
  onConfirm?: () => void;
  onUnconfirm?: () => void;
  confirmDisabled?: boolean;
  statusBadge?: React.ReactNode;
};

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  emptyMessage, 
  initialSort,
  onBatchSave,
  onAddRow,
  showDateFilter,
  dateFilterKey = 'date',
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
  onSingleMonthChange,
  showYearFilter,
  singleYear,
  onSingleYearChange,
  disableAddButton,
  highlightInputColumns = true,
  restrictionTooltipText,
  hideSubSubItems,
  serverSidePagination,
  totalCount,
  currentPage: externalCurrentPage,
  onPageChange,
  sortConfig: externalSortConfig,
  onSortChange,
  onDateFilterChange,
  isConfirmed,
  onConfirm,
  onUnconfirm,
  confirmDisabled,
  statusBadge
}: DataTableProps<T>) {
  const [firstColWidth, setFirstColWidth] = useState(0);
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, text: string }>({ visible: false, x: 0, y: 0, text: '' });
  const tableRef = useRef<HTMLTableElement>(null);
  
  const [internalSortConfig, setInternalSortConfig] = useState<SortConfig>(() => initialSort || {
    key: columns.length > 0 ? columns[0].key : '',
    direction: 'asc'
  });

  const sortConfig = externalSortConfig || internalSortConfig;

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

  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
  const setCurrentPage = (page: number) => {
    setInternalCurrentPage(page);
    if (onPageChange) onPageChange(page);
  };
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
    
    if (serverSidePagination) {
      const existingRows = sourceData.filter(item => !newRowIds.has(item.id));
      const newRows = sourceData.filter(item => newRowIds.has(item.id));
      return { sortedExistingRows: existingRows, newRows };
    }

    if (showDateFilter) {
      const effStart = startDate <= endDate ? startDate : endDate;
      const effEnd = startDate <= endDate ? endDate : startDate;
      sourceData = sourceData.filter(item => {
        const dateVal = (item as any)[dateFilterKey];
        if (!dateVal) return false;
        const dStr = formatJSTDateOnly(dateVal);
        return dStr >= effStart && dStr <= effEnd;
      });
    } else if (showSingleDateFilter) {
      sourceData = sourceData.filter(item => {
        const dateVal = (item as any)[dateFilterKey];
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

      return compareValues(aVal, bVal, sortConfig.direction, a, b);
    });

    return { sortedExistingRows: existingRows, newRows };
  }, [draftData, sortConfig, newRowIds, columns, showDateFilter, dateFilterKey, showSingleDateFilter, startDate, endDate, singleDate, serverSidePagination]);

  const totalItems = serverSidePagination && totalCount !== undefined ? totalCount : sortedExistingRows.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  useEffect(() => {
    if (!serverSidePagination && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, serverSidePagination]);

  const visibleData = useMemo(() => {
    if (serverSidePagination) {
      return [...sortedExistingRows, ...newRows];
    }
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedExisting = sortedExistingRows.slice(startIndex, startIndex + pageSize);
    return [...paginatedExisting, ...newRows];
  }, [sortedExistingRows, newRows, currentPage, pageSize, serverSidePagination]);

  const handleSort = (key: string) => {
    if (!key) return;
    const currentConfig = sortConfig;
    const newConfig: SortConfig = currentConfig.key === key 
      ? { key, direction: currentConfig.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' };
    setInternalSortConfig(newConfig);
    if (onSortChange) onSortChange(newConfig);
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
    const newRow = onAddRow(draftData);
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
            if ((col.inputType === 'number' || col.inputType === 'currency') && (newItem as any)[col.key] === '') {
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

  const renderCellContent = (col: Column<T>, item: any, isSubItem: boolean = false, parentId?: string, isSubSubItem: boolean = false, subParentId?: string, mainItem?: T) => {
    const isDeleted = deletedIds.has(item.id);
    const parentMainItem = mainItem || item;
    const isRowEditable = canEditRow ? canEditRow(parentMainItem) : true;
    const isColEditable = typeof col.editable === 'function' ? col.editable(parentMainItem) : col.editable !== false;
    const isEditable = !isDeleted && isRowEditable && !!onBatchSave && isColEditable && col.inputType;
    
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
      
      if (col.inputType === 'radio') {
        const currentOptions = typeof col.options === 'function' ? col.options(item) : col.options || [];
        return (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {currentOptions.map(opt => (
              <RadioButton
                key={opt.value}
                label={opt.label}
                name={`${item.id}-${col.key}`}
                value={opt.value}
                checked={String(value) === String(opt.value)}
                disabled={!isEditable}
                onChange={(e) => handleCellChange(item.id, col.key, e.target.value, col, isSubItem, parentId, isSubSubItem, subParentId)}
              />
            ))}
          </div>
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

      if (col.inputType === 'date') {
        return (
          <DateInput 
            value={value as string}
            onChange={(newVal) => handleCellChange(item.id, col.key, newVal, col, isSubItem, parentId, isSubSubItem, subParentId)}
          />
        );
      }

      if (col.inputType === 'month') {
        return (
          <MonthInput 
            value={value as string}
            onChange={(newVal) => handleCellChange(item.id, col.key, newVal, col, isSubItem, parentId, isSubSubItem, subParentId)}
          />
        );
      }

      if (col.inputType === 'number') {
        return (
          <NumberInput 
            value={value}
            onChange={(e) => {
              handleCellChange(item.id, col.key, e.target.value, col, isSubItem, parentId, isSubSubItem, subParentId);
            }}
          />
        );
      }

      if (col.inputType === 'currency') {
        return (
          <CurrencyInput 
            value={value}
            onChange={(newVal) => {
              handleCellChange(item.id, col.key, newVal, col, isSubItem, parentId, isSubSubItem, subParentId);
            }}
          />
        );
      }

      if (col.inputType === 'checkbox') {
        return (
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={Boolean(value)}
            onChange={(e) => {
              handleCellChange(item.id, col.key, e.target.checked, col, isSubItem, parentId, isSubSubItem, subParentId);
            }}
          />
        );
      }

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue: string | number = e.target.value;
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
    
    // Default render for non-editable state
    if (col.render) return col.render(item, draftData, setDraftData);
    
    if (col.inputType === 'radio') {
      const opts = typeof col.options === 'function' ? col.options(item) : (col.options || []);
      const value = item[col.key] ?? '';
      return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {opts.map(opt => (
            <RadioButton
              key={opt.value}
              label={opt.label}
              name={`${item.id}-${col.key}`}
              value={opt.value}
              checked={String(value) === String(opt.value)}
              disabled={true}
            />
          ))}
        </div>
      );
    }
    
    if (col.inputType === 'select') {
      const opts = typeof col.options === 'function' ? col.options(item) : (col.options || []);
      const option = opts.find(o => o.value === item[col.key]);
      return option ? option.label : item[col.key];
    }
    
    if (col.inputType === 'month' && item[col.key]) {
      return <MonthDisplay value={item[col.key]} />;
    }
    
    if (col.inputType === 'date' && item[col.key]) {
      return <DateDisplay value={item[col.key]} />;
    }
    
    if (col.inputType === 'number') {
      return <NumberDisplay value={item[col.key]} />;
    }

    if (col.inputType === 'currency') {
      const val = item[col.key];
      if (val === null || val === undefined || val === '') return null;
      return <span style={{ fontVariantNumeric: 'tabular-nums' }}>¥{Number(val).toLocaleString()}</span>;
    }

    return item[col.key];
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
              {columns.map((col, idx) => {
                const isSortable = col.sortable !== false;
                return (
                  <th 
                    key={col.key || idx}
                    onClick={() => isSortable && handleSort(col.key)}
                    style={{ cursor: isSortable ? 'pointer' : 'default', userSelect: 'none' }}
                    title={isSortable ? `${col.header}でソート` : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {col.header}
                      {isSortable && (
                        <SortIcon active={sortConfig.key === col.key} direction={sortConfig.direction} />
                      )}
                    </div>
                  </th>
                );
              })}
              {showDeleteCol && <th className="sticky-right" style={{ width: '40px', right: showRestrictionColumn ? '40px' : '0' }}>{BUTTON_LABELS.DELETE}</th>}
              {showRestrictionColumn && <th className="sticky-right" style={{ width: '40px', right: '0' }}>{TABLE_COLUMNS.RESTRICTION}</th>}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((item) => {
              const isDeleted = deletedIds.has(item.id);
              const isRowDeletable = canDeleteRow ? canDeleteRow(item) : true;
              const isRowEditable = canEditRow ? canEditRow(item) : true;
              const subItems = subItemsKey ? ((item as any)[subItemsKey] as any[]) || [] : [];

              const renderSubSubRows = (subItem: any) => {
                if (hideSubSubItems && hideSubSubItems(subItem)) return null;
                const subSubItems = subSubItemsKey ? (subItem[subSubItemsKey] as any[]) || [] : [];
                const isLastSubItem = subItem === subItems[subItems.length - 1];
                return (
                  <React.Fragment key={`${subItem.id}-skills`}>
                    {subSubItems.map(subSubItem => {
                      const isLastSubSubItem = subSubItem === subSubItems[subSubItems.length - 1];
                      return (
                        <tr key={subSubItem.id} className={deletedIds.has(subSubItem.id) || deletedIds.has(subItem.id) || isDeleted ? 'deleted-row' : ''}>
                          {columns.map((col, idx) => {
                            const isMainCol = col.rowType === 'main' || !col.rowType;
                            const isSubCol = col.rowType === 'sub';
                            let borderBottomStyle: string | undefined;
                            if (isMainCol) {
                              if (!isLastSubItem || !isLastSubSubItem) {
                                borderBottomStyle = 'none';
                              }
                            } else if (isSubCol) {
                              if (!isLastSubSubItem) {
                                borderBottomStyle = 'none';
                              }
                            }
                            
                            const isInputColumn = isRowEditable && highlightInputColumns && !!onBatchSave && col.inputType && col.editable !== false;
                            
                            const baseStyle = typeof col.style === 'function' ? col.style(subSubItem, draftData) : col.style;
                            const customStyle = {
                              ...baseStyle,
                              ...(borderBottomStyle ? { borderBottom: borderBottomStyle } : {})
                            };
                            
                            return (
                              <td key={col.key || idx} className={`${col.className || ''} ${isInputColumn ? 'bg-input-highlight' : ''}`.trim()} style={customStyle}>
                                {col.rowType === 'sub-sub' ? renderCellContent(col, subSubItem, false, item.id, true, subItem.id, item) : null}
                              </td>
                            );
                          })}
                          {showDeleteCol && (
                            <td className="sticky-right" style={{ textAlign: 'center', right: showRestrictionColumn ? '40px' : '0' }}>
                              <Input 
                                type="checkbox" 
                                checked={deletedIds.has(subSubItem.id) || deletedIds.has(subItem.id) || isDeleted}
                                disabled={deletedIds.has(subItem.id) || isDeleted || !isRowEditable || !isRowDeletable}
                                onChange={() => toggleDelete(subSubItem.id)}
                                className="custom-checkbox"
                              />
                            </td>
                          )}
                          {showRestrictionColumn && (
                            <td className="sticky-right" style={{ textAlign: 'center', right: '0', ...((!isLastSubItem || !isLastSubSubItem) ? { borderBottom: 'none' } : {}) }}></td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              };

              return (
                <React.Fragment key={item.id}>
                  <tr 
                    className={isDeleted ? 'deleted-row' : ''}
                    onMouseEnter={(e) => {
                      if (showRestrictionColumn && !isRowEditable) {
                        setTooltip({ visible: true, x: e.clientX, y: e.clientY - 15, text: restrictionTooltipText || MESSAGES.RESTRICTED_EDIT });
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
                      
                      const isInputColumn = isRowEditable && highlightInputColumns && !!onBatchSave && col.inputType && col.editable !== false;
                      
                      const baseStyle = typeof col.style === 'function' ? col.style(item, draftData) : col.style;
                      const customStyle = {
                        ...baseStyle,
                        ...(borderBottomStyle ? { borderBottom: borderBottomStyle } : {})
                      };

                      if (col.rowType === 'sub') {
                        return (
                          <td key={col.key || idx} className={`${col.className || ''} ${isInputColumn ? 'bg-input-highlight' : ''}`.trim()} style={customStyle}>
                            {col.mainRender ? col.mainRender(item, () => handleAddSubRowClick(item.id)) : null}
                          </td>
                        );
                      }
                      if (col.rowType === 'sub-sub') {
                        return (
                          <td key={col.key || idx} className={`${col.className || ''} ${isInputColumn ? 'bg-input-highlight' : ''}`.trim()} style={customStyle}>
                            {null}
                          </td>
                        );
                      }
                      return (
                        <td key={col.key || idx} className={`${col.className || ''} ${isInputColumn ? 'bg-input-highlight' : ''}`.trim()} style={customStyle}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            justifyContent: col.className?.includes('quantity') || (customStyle as any)?.textAlign === 'right' ? 'flex-end' : 'flex-start'
                          }}>
                            {renderCellContent(col, item, false, undefined, false, undefined, item)}
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
                      <td className="sticky-right" style={{ textAlign: 'center', right: '0', ...(subItems.length > 0 ? { borderBottom: 'none' } : {}) }}>
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
                    const subSubItems = subSubItemsKey ? (subItem[subSubItemsKey] as any[]) || [] : [];
                    const isSubSubHidden = hideSubSubItems && hideSubSubItems(subItem);
                    const isLastSubItem = subItem === subItems[subItems.length - 1];
                    return (
                      <React.Fragment key={subItem.id}>
                        <tr className={isSubDeleted || isDeleted ? 'deleted-row' : ''}>
                          {columns.map((col, idx) => {
                            const isMainCol = col.rowType === 'main' || !col.rowType;
                            let borderBottomStyle: string | undefined;
                            if (isMainCol) {
                              if (!isLastSubItem || (!isSubSubHidden && subSubItems.length > 0)) {
                                borderBottomStyle = 'none';
                              }
                            } else if (col.rowType === 'sub') {
                              if (!isSubSubHidden && subSubItems.length > 0) {
                                borderBottomStyle = 'none';
                              }
                            }
                            
                            const isInputColumn = isRowEditable && highlightInputColumns && !!onBatchSave && col.inputType && col.editable !== false;
                            
                            const baseStyle = typeof col.style === 'function' ? col.style(subItem, draftData) : col.style;
                            const customStyle = {
                              ...baseStyle,
                              ...(borderBottomStyle ? { borderBottom: borderBottomStyle } : {})
                            };

                            if (col.rowType === 'sub-sub') {
                              return (
                                <td key={col.key || idx} className={`${col.className || ''} ${isInputColumn ? 'bg-input-highlight' : ''}`.trim()} style={customStyle}>
                                  {col.mainRender ? col.mainRender(item, () => handleAddSubSubRowClick(item.id, subItem.id), subItem) : null}
                                </td>
                              );
                            }
                            return (
                              <td key={col.key || idx} className={`${col.className || ''} ${isInputColumn ? 'bg-input-highlight' : ''}`.trim()} style={customStyle}>
                                {col.rowType === 'sub' ? renderCellContent(col, subItem, true, item.id, false, undefined, item) : null}
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
                            <td className="sticky-right" style={{ textAlign: 'center', right: '0', ...((!isLastSubItem || (!isSubSubHidden && subSubItems.length > 0)) ? { borderBottom: 'none' } : {}) }}>
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
              <MonthInput 
                value={startDate.length >= 7 ? startDate.substring(0, 7) : startDate} 
                onChange={(val) => {
                  setStartDate(val);
                  if (onDateFilterChange) onDateFilterChange(val, endDate);
                }} 
                className="date-filter-pill"
                style={{ width: 'auto', minWidth: '140px' }}
              />
              <span>～</span>
              <MonthInput 
                value={endDate.length >= 7 ? endDate.substring(0, 7) : endDate} 
                onChange={(val) => {
                  setEndDate(val);
                  if (onDateFilterChange) onDateFilterChange(startDate, val);
                }} 
                className="date-filter-pill"
                style={{ width: 'auto', minWidth: '140px' }}
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
              <DateInput 
                value={singleDate} 
                onChange={(val) => setSingleDate(val)} 
                className="date-filter-pill"
                style={{ width: 'auto', minWidth: '160px' }}
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
                  padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)'
                }}
                onClick={() => setSingleDate(getCurrentJSTDateOnly())}
                disabled={singleDate === getCurrentJSTDateOnly()}
              >
                今日
              </Button>
              {statusBadge}
            </div>
          ) : showMonthFilter ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  if (singleMonth && onSingleMonthChange) {
                    const [y, m] = singleMonth.split('-');
                    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                    date.setMonth(date.getMonth() - 1);
                    const newY = date.getFullYear();
                    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                    onSingleMonthChange(`${newY}-${newM}`);
                  }
                }}
              >
                ＜
              </Button>
              <MonthInput 
                value={singleMonth || ''}
                onChange={(val) => {
                  if (val && onSingleMonthChange) {
                    onSingleMonthChange(val);
                  }
                }}
                className="date-filter-pill"
                style={{ width: 'auto', minWidth: '140px' }}
              />
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  if (singleMonth && onSingleMonthChange) {
                    const [y, m] = singleMonth.split('-');
                    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
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
                  padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)'
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
              {statusBadge}
            </div>
          ) : showYearFilter ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  if (singleYear && onSingleYearChange) {
                    onSingleYearChange(String(parseInt(singleYear) - 1));
                  }
                }}
              >
                ＜
              </Button>
              <YearInput 
                value={singleYear || ''}
                onChange={(val) => {
                  if (val && onSingleYearChange) {
                    onSingleYearChange(val);
                  }
                }}
                className="date-filter-pill"
                style={{ width: 'auto', minWidth: '100px' }}
              />
              <Button 
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  if (singleYear && onSingleYearChange) {
                    onSingleYearChange(String(parseInt(singleYear) + 1));
                  }
                }}
              >
                ＞
              </Button>
              <Button 
                variant="secondary"
                style={{ padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)' }}
                onClick={() => {
                  if (onSingleYearChange) {
                    onSingleYearChange(new Date().getFullYear().toString());
                  }
                }}
                disabled={singleYear === new Date().getFullYear().toString()}
              >
                今年
              </Button>
              {statusBadge}
            </div>
          ) : footerLeft ? (
            footerLeft
          ) : null}
        </div>

        {isEditingEnabled ? (
          <div className="action-buttons">
            {onAddRow && (
              <Button onClick={handleAddClick} disabled={isConfirmed || disableAddButton}>
                {BUTTON_LABELS.ADD}
              </Button>
            )}
            <Button onClick={handleCancelClick} disabled={isConfirmed || !canCancel}>
              {BUTTON_LABELS.CANCEL}
            </Button>
            <Button variant="primary" onClick={handleSaveClick} disabled={isConfirmed || !canSave}>
              {BUTTON_LABELS.SAVE}
            </Button>
            {!isConfirmed ? (
              onConfirm ? (
                <Button variant="primary" onClick={onConfirm} disabled={confirmDisabled}>
                  確定
                </Button>
              ) : null
            ) : (
              onUnconfirm ? (
                <Button variant="secondary" onClick={onUnconfirm}>
                  解除
                </Button>
              ) : null
            )}
          </div>
        ) : (
          <div className="action-buttons"></div>
        )}

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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
            fontSize: 'var(--text-caption)',
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
