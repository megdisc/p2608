import { DataPage, DateTimeDisplay, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import type { StocktakingItem } from '../types';
import { useAlert } from '../contexts';
import { formatJSTForInput } from '../utils';
import { useStocktakings } from '../hooks';

export function StocktakingPage() {
  const { 
    items, 
    categories, 
    locations, 
    masters, 
    staffs, 
    loading, 
    fetchStocktakings, 
    canEditRow, 
    recalculateSystemQty, 
    batchSaveStocktakings 
  } = useStocktakings();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchStocktakings().catch(() => {
      showAlert('棚卸データの取得に失敗しました', 'error');
    });
  }, [fetchStocktakings, showAlert]);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...categories.map(c => ({ label: c.name, value: c.name }))], [categories]);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...locations.map(l => ({ label: l.name, value: l.name }))], [locations]);
  const itemOptions = useMemo(() => [{ label: '', value: '' }, ...masters.map(m => ({ label: m.name, value: m.name }))], [masters]);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.name }))], [staffs]);

  const columns: Column<StocktakingItem>[] = [
    { 
      key: 'date', 
      header: '記録日時',
      editable: true,
      inputType: 'datetime-local',
      render: (item) => <DateTimeDisplay value={item.date} />,
      onCellChange: (newDate, item, updateRow) => {
        recalculateSystemQty({ ...item, date: newDate }, updateRow);
      }
    },
    { 
      key: 'category', 
      header: 'カテゴリ', 
      editable: true, 
      inputType: 'select', 
      options: categoryOptions,
      onCellChange: (newCategory, item, updateRow) => {
        const updates: Partial<StocktakingItem> = {};
        let triggerRecalculate = false;
        if (newCategory) {
          const filteredItems = masters.filter(m => m.category === newCategory);
          if (filteredItems.length === 1) {
            updates.itemName = filteredItems[0].name;
            if (!item.location) {
              updates.location = filteredItems[0].location;
            }
            triggerRecalculate = true;
          } else {
            const currentItemValid = filteredItems.some(m => m.name === item.itemName);
            if (!currentItemValid) updates.itemName = '';
          }
        } else {
          updates.itemName = '';
        }
        
        if (triggerRecalculate) {
          recalculateSystemQty({ ...item, ...updates }, updateRow);
        }
        
        return updates;
      }
    },
    { 
      key: 'itemName', 
      header: '品目', 
      sortKey: 'itemYomigana',
      editable: true, 
      inputType: 'select', 
      options: (item) => {
        if (!item.category) return itemOptions;
        const filtered = masters.filter(m => m.category === item.category);
        return [{ label: '', value: '' }, ...filtered.map(m => ({ label: m.name, value: m.name }))];
      },
      onCellChange: (newItemName, item, updateRow) => {
        const updates: Partial<StocktakingItem> = {};
        if (newItemName) {
          const masterItem = masters.find(m => m.name === newItemName);
          if (masterItem) {
            updates.category = masterItem.category;
            if (!item.location) {
              updates.location = masterItem.location;
            }
          }
        }
        recalculateSystemQty({ ...item, itemName: newItemName, ...updates }, updateRow);
        return updates;
      }
    },
    { 
      key: 'location', 
      header: TABLE_COLUMNS.LOCATION, 
      editable: true, 
      inputType: 'select', 
      options: locationOptions,
      onCellChange: (newLocation, item, updateRow) => {
        recalculateSystemQty({ ...item, location: newLocation }, updateRow);
      }
    },
    { key: 'systemQty', header: TABLE_COLUMNS.BOOK_INVENTORY, className: 'quantity', editable: false },
    { 
      key: 'actualQty', 
      header: TABLE_COLUMNS.ACTUAL_INVENTORY, 
      className: 'quantity', 
      editable: true, 
      inputType: 'number',
      onCellChange: (newActualQty, item) => {
        return { difference: Number(newActualQty) - item.systemQty };
      }
    },
    { 
      key: 'difference', 
      header: TABLE_COLUMNS.DIFFERENCE, 
      className: 'quantity',
      editable: false,
      render: (item) => {
        const color = item.difference > 0 ? '#1c7ed6' : (item.difference < 0 ? '#e03131' : 'inherit');
        return (
          <span style={{ color }}>
            {item.difference > 0 ? `+${item.difference}` : item.difference}
          </span>
        );
      }
    },
    { key: 'personInCharge', header: TABLE_COLUMNS.PERSON_IN_CHARGE, sortKey: 'personInChargeYomigana', editable: true, inputType: 'select', options: staffOptions },
  ];

  const handleBatchSave = async (drafts: StocktakingItem[], deletedIds: string[]) => {
    try {
      await batchSaveStocktakings(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    const formattedDate = formatJSTForInput(new Date());
    
    return {
      id: `STK-${Date.now()}`,
      date: formattedDate,
      itemId: '',
      category: '',
      itemName: '',
      systemQty: 0,
      actualQty: 0,
      difference: 0,
      location: '',
      personInCharge: ''
    } as StocktakingItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.STOCKTAKING}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_STOCKTAKING}
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
