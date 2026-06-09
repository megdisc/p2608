import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import { DateTimeDisplay } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import type { Column } from '../components/ui';
import type { TransactionItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';

export function TransactionPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [masters, setMasters] = useState<{id: string, name: string, category: string, location: string}[]>([]);
  const [staffs, setStaffs] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: txData },
          { data: catData },
          { data: locData },
          { data: masterData },
          { data: staffData }
        ] = await Promise.all([
          supabase.from('transactions').select(`
            *,
            item:items(name, category:categories(name)),
            location:locations(name),
            staff:staffs(name)
          `),
          supabase.from('categories').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('locations').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('items').select('id, name, yomigana, category:categories(name), location:locations(name)').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('staffs').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true })
        ]);

        if (txData) {
          const mapped: TransactionItem[] = txData.map((tx: any) => ({
            id: tx.id,
            date: tx.date,
            itemId: tx.item_id,
            category: tx.item?.category?.name || 'Unknown',
            itemName: tx.item?.name || 'Unknown',
            type: tx.type,
            quantity: tx.quantity,
            location: tx.location?.name || 'Unknown',
            personInCharge: tx.staff?.name || 'Unknown',
          }));
          setItems(mapped);
        }
        if (catData) setCategories(catData);
        if (locData) setLocations(locData);
        if (masterData) {
          setMasters(masterData.map((m: any) => ({
            id: m.id,
            name: m.name,
            category: m.category?.name || '',
            location: m.location?.name || ''
          })));
        }
        if (staffData) setStaffs(staffData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...categories.map(c => ({ label: c.name, value: c.name }))], [categories]);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...locations.map(l => ({ label: l.name, value: l.name }))], [locations]);
  const itemOptions = useMemo(() => [{ label: '', value: '' }, ...masters.map(m => ({ label: m.name, value: m.name }))], [masters]);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.name }))], [staffs]);

  const typeOptions = [
    { label: '', value: '' },
    { label: '受入', value: '受入' },
    { label: '払出', value: '払出' }
  ];

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
    { key: 'type', header: TABLE_COLUMNS.TYPE, editable: true, inputType: 'select', options: typeOptions },
    { key: 'quantity', header: TABLE_COLUMNS.QUANTITY, className: 'quantity', editable: true, inputType: 'number' },
    { key: 'personInCharge', header: TABLE_COLUMNS.PERSON_IN_CHARGE, editable: true, inputType: 'select', options: staffOptions },
  ];

  const handleBatchSave = async (drafts: TransactionItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const { error } = await supabase.from('transactions').delete().in('id', deletedIds);
        if (error) throw error;
      }

      const itemMap = new Map(masters.map(m => [m.name, m.id]));
      const locMap = new Map(locations.map(l => [l.name, l.id]));
      const staffMap = new Map(staffs.map(s => [s.name, s.id]));

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('TRX-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('TRX-'));

      for (const item of existingItems) {
        const original = items.find(i => i.id === item.id);
        if (original && JSON.stringify(original) === JSON.stringify(item)) {
          continue;
        }

        const dateObj = new Date(item.date.replace(' ', 'T'));
        const isoDateStr = isNaN(dateObj.getTime()) ? item.date : dateObj.toISOString();

        const { error } = await supabase.from('transactions').update({
          date: isoDateStr,
          item_id: itemMap.get(item.itemName) || null,
          type: item.type,
          quantity: item.quantity,
          location_id: locMap.get(item.location) || null,
          staff_id: staffMap.get(item.personInCharge) || null
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => {
          const dateObj = new Date(item.date.replace(' ', 'T'));
          const isoDateStr = isNaN(dateObj.getTime()) ? item.date : dateObj.toISOString();
          
          return {
            date: isoDateStr,
            item_id: itemMap.get(item.itemName) || null,
            type: item.type,
            quantity: item.quantity,
            location_id: locMap.get(item.location) || null,
            staff_id: staffMap.get(item.personInCharge) || null
          };
        });
        const { error } = await supabase.from('transactions').insert(inserts);
        if (error) throw error;
      }

      // Reload
      const { data: txData, error: reloadError } = await supabase.from('transactions').select(`
        *,
        item:items(name, category:categories(name)),
        location:locations(name),
        staff:staffs(name)
      `);
      if (reloadError) throw reloadError;

      if (txData) {
        const mapped: TransactionItem[] = txData.map((tx: any) => ({
          id: tx.id,
          date: tx.date,
          itemId: tx.item_id,
          category: tx.item?.category?.name || 'Unknown',
          itemName: tx.item?.name || 'Unknown',
          type: tx.type,
          quantity: tx.quantity,
          location: tx.location?.name || 'Unknown',
          personInCharge: tx.staff?.name || 'Unknown',
        }));
        setItems(mapped);
      }
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
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
    />
  );
}
