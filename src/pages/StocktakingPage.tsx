import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import { DateTimeDisplay } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import type { Column } from '../components/ui';
import type { StocktakingItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';

export function StocktakingPage() {
  const [items, setItems] = useState<StocktakingItem[]>([]);
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
          { data: stData },
          { data: catData },
          { data: locData },
          { data: masterData },
          { data: staffData }
        ] = await Promise.all([
          supabase.from('stocktakings').select(`
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

        if (stData) {
          const mapped: StocktakingItem[] = stData.map((st: any) => ({
            id: st.id,
            date: st.date,
            itemId: st.item_id,
            category: st.item?.category?.name || 'Unknown',
            itemName: st.item?.name || 'Unknown',
            systemQty: st.system_qty,
            actualQty: st.actual_qty,
            difference: st.difference,
            location: st.location?.name || 'Unknown',
            personInCharge: st.staff?.name || 'Unknown',
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
        console.error('Error fetching stocktakings:', error);
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

  // 最新の棚卸日時マップを作成
  const latestStocktakingMap = useMemo(() => {
    const map = new Map<string, Date>(); // key: "itemName_location", value: Date
    for (const item of items) {
      if (item.id.startsWith('STK-')) continue; // 新規追加行は無視
      const key = `${item.itemName}_${item.location}`;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) continue;
      
      const currentLatest = map.get(key);
      if (!currentLatest || d > currentLatest) {
        map.set(key, d);
      }
    }
    return map;
  }, [items]);

  const canEditRow = (item: StocktakingItem) => {
    if (item.id.startsWith('STK-')) return true; // 新規行は編集可能
    const key = `${item.itemName}_${item.location}`;
    const latestDate = latestStocktakingMap.get(key);
    if (!latestDate) return true;
    
    const d = new Date(item.date);
    // 自身の時間が最新時間と同じ、もしくは未来の場合は編集可能
    return d.getTime() >= latestDate.getTime();
  };

  const recalculateSystemQty = async (updatedItem: StocktakingItem, updateRow: (updates: Partial<StocktakingItem>) => void) => {
    if (updatedItem.itemName && updatedItem.location && updatedItem.date) {
      const itemMaster = masters.find(m => m.name === updatedItem.itemName);
      const locationMaster = locations.find(l => l.name === updatedItem.location);
      
      if (itemMaster && locationMaster) {
        try {
          const dateObj = new Date(updatedItem.date.replace(' ', 'T'));
          const isoDateStr = isNaN(dateObj.getTime()) ? updatedItem.date : dateObj.toISOString();
          
          const { data, error } = await supabase.rpc('calculate_book_inventory', {
            p_item_id: itemMaster.id,
            p_location_id: locationMaster.id,
            p_target_date: isoDateStr
          });
          
          if (!error && data !== null) {
            const sysQty = Number(data);
            const diff = Number(updatedItem.actualQty) - sysQty;
            updateRow({ systemQty: sysQty, difference: diff });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

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
    { key: 'personInCharge', header: TABLE_COLUMNS.PERSON_IN_CHARGE, editable: true, inputType: 'select', options: staffOptions },
  ];

  const handleBatchSave = async (drafts: StocktakingItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const { error } = await supabase.from('stocktakings').delete().in('id', deletedIds);
        if (error) throw error;
      }

      const itemMap = new Map(masters.map(m => [m.name, m.id]));
      const locMap = new Map(locations.map(l => [l.name, l.id]));
      const staffMap = new Map(staffs.map(s => [s.name, s.id]));

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('STK-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('STK-'));

      for (const item of existingItems) {
        const original = items.find(i => i.id === item.id);
        if (original && JSON.stringify(original) === JSON.stringify(item)) {
          continue;
        }

        const dateObj = new Date(item.date.replace(' ', 'T'));
        const isoDateStr = isNaN(dateObj.getTime()) ? item.date : dateObj.toISOString();

        const { error } = await supabase.from('stocktakings').update({
          date: isoDateStr,
          item_id: itemMap.get(item.itemName) || null,
          system_qty: item.systemQty,
          actual_qty: item.actualQty,
          difference: item.actualQty - item.systemQty,
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
            system_qty: item.systemQty,
            actual_qty: item.actualQty,
            difference: item.actualQty - item.systemQty,
            location_id: locMap.get(item.location) || null,
            staff_id: staffMap.get(item.personInCharge) || null
          };
        });
        const { error } = await supabase.from('stocktakings').insert(inserts);
        if (error) throw error;
      }

      // Reload
      const { data: stData, error: reloadError } = await supabase.from('stocktakings').select(`
        *,
        item:items(name, category:categories(name)),
        location:locations(name),
        staff:staffs(name)
      `);
      if (reloadError) throw reloadError;

      if (stData) {
        const mapped: StocktakingItem[] = stData.map((st: any) => ({
          id: st.id,
          date: st.date,
          itemId: st.item_id,
          category: st.item?.category?.name || 'Unknown',
          itemName: st.item?.name || 'Unknown',
          systemQty: st.system_qty,
          actualQty: st.actual_qty,
          difference: st.difference,
          location: st.location?.name || 'Unknown',
          personInCharge: st.staff?.name || 'Unknown',
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
