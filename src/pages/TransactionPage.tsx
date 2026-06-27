import { DataPage, DateTimeDisplay, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, TRANSACTION_TYPE_OPTIONS } from '../constants';
import type { TransactionItem } from '../types';
import { useAlert } from '../contexts';
import { formatJSTForInput } from '../utils';
import { useTransactions } from '../hooks';

export function TransactionPage() {
  const { 
    items, 
    categories, 
    locations, 
    masters, 
    staffs, 
    loading, 
    fetchTransactions, 
    canEditRow, 
    batchSaveTransactions 
  } = useTransactions();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchTransactions().catch(() => {
      showAlert('入出庫データの取得に失敗しました', 'error');
    });
  }, [fetchTransactions, showAlert]);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...categories.map(c => ({ label: c.name, value: c.name }))], [categories]);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...locations.map(l => ({ label: l.name, value: l.name }))], [locations]);
  const itemOptions = useMemo(() => [{ label: '', value: '' }, ...masters.map(m => ({ label: m.name, value: m.name }))], [masters]);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.name }))], [staffs]);

  const columns: Column<TransactionItem>[] = [
    { 
      key: 'date', 
      header: '記録日時',
      editable: true,
      inputType: 'datetime-local',
      render: (item) => <DateTimeDisplay value={item.date} />
    },
    { 
      key: 'category', 
      header: 'カテゴリ', 
      editable: true, 
      inputType: 'select', 
      options: categoryOptions,
      onCellChange: (newCategory, item) => {
        const updates: Partial<TransactionItem> = {};
        if (newCategory) {
          const filteredItems = masters.filter(m => m.category === newCategory);
          if (filteredItems.length === 1) {
            updates.itemName = filteredItems[0].name;
            if (!item.location) {
              updates.location = filteredItems[0].location;
            }
          } else {
            const currentItemValid = filteredItems.some(m => m.name === item.itemName);
            if (!currentItemValid) updates.itemName = '';
          }
        } else {
          updates.itemName = '';
        }
        return updates;
      }
    },
    { 
      key: 'itemName', 
      header: TABLE_COLUMNS.ITEM, 
      sortKey: 'itemYomigana',
      editable: true, 
      inputType: 'select', 
      options: (item) => {
        if (!item.category) return itemOptions;
        const filtered = masters.filter(m => m.category === item.category);
        return [{ label: '', value: '' }, ...filtered.map(m => ({ label: m.name, value: m.name }))];
      },
      onCellChange: (newItemName, item) => {
        const updates: Partial<TransactionItem> = {};
        if (newItemName) {
          const masterItem = masters.find(m => m.name === newItemName);
          if (masterItem) {
            updates.category = masterItem.category;
            if (!item.location) {
              updates.location = masterItem.location;
            }
          }
        }
        return updates;
      }
    },
    { key: 'location', header: TABLE_COLUMNS.LOCATION, editable: true, inputType: 'select', options: locationOptions },
    { key: 'type', header: TABLE_COLUMNS.TYPE, editable: true, inputType: 'select', options: TRANSACTION_TYPE_OPTIONS },
    { key: 'quantity', header: TABLE_COLUMNS.QUANTITY, editable: true, inputType: 'number' },
    { key: 'personInCharge', header: TABLE_COLUMNS.PERSON_IN_CHARGE, sortKey: 'personInChargeYomigana', editable: true, inputType: 'select', options: staffOptions },
  ];

  const handleBatchSave = async (drafts: TransactionItem[], deletedIds: string[]) => {
    try {
      await batchSaveTransactions(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    const formattedDate = formatJSTForInput(new Date());
    
    return {
      id: `TRX-${Date.now()}`,
      date: formattedDate,
      itemId: '',
      category: '',
      itemName: '',
      type: '',
      quantity: 0,
      location: '',
      personInCharge: ''
    } as unknown as TransactionItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.TRANSACTION}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_TRANSACTION}
      initialSort={{ key: 'date', direction: 'desc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      showDateFilter={true}
      canEditRow={canEditRow}
      canDeleteRow={canEditRow}
      showRestrictionColumn={true}
    />
  );
}
