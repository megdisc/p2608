import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import type { StocktakingItem } from '../types';
import { parseLocalInputAsUTC } from '../utils';

export function useStocktakings() {
  const [items, setItems] = useState<StocktakingItem[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [masters, setMasters] = useState<{id: string, name: string, category: string, location: string}[]>([]);
  const [staffs, setStaffs] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStocktakings = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: stData },
        { data: catData },
        { data: locData },
        { data: masterData },
        { data: staffData }
      ] = await Promise.all([
        supabase.from('stocktakings').select(`
          *,
          item:items(name, yomigana, category:categories(name)),
          location:locations(name),
          staff:staffs(name, yomigana)
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
          itemYomigana: st.item?.yomigana || '',
          systemQty: st.system_qty,
          actualQty: st.actual_qty,
          difference: st.difference,
          location: st.location?.name || 'Unknown',
          personInCharge: st.staff?.name || 'Unknown',
          personInChargeYomigana: st.staff?.yomigana || '',
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
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const latestStocktakingMap = useMemo(() => {
    const map = new Map<string, Date>();
    for (const item of items) {
      if (item.id.startsWith('STK-')) continue;
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

  const canEditRow = useCallback((item: StocktakingItem) => {
    if (item.id.startsWith('STK-')) return true;
    const key = `${item.itemName}_${item.location}`;
    const latestDate = latestStocktakingMap.get(key);
    if (!latestDate) return true;
    
    const d = new Date(item.date);
    return d.getTime() >= latestDate.getTime();
  }, [latestStocktakingMap]);

  const recalculateSystemQty = async (updatedItem: StocktakingItem, updateRow: (updates: Partial<StocktakingItem>) => void) => {
    if (updatedItem.itemName && updatedItem.location && updatedItem.date) {
      const itemMaster = masters.find(m => m.name === updatedItem.itemName);
      const locationMaster = locations.find(l => l.name === updatedItem.location);
      
      if (itemMaster && locationMaster) {
        try {
          const isoDateStr = parseLocalInputAsUTC(updatedItem.date);
          
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

  const batchSaveStocktakings = async (drafts: StocktakingItem[], deletedIds: string[]) => {
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

        const isoDateStr = parseLocalInputAsUTC(item.date);

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
          const isoDateStr = parseLocalInputAsUTC(item.date);
          
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

      await fetchStocktakings();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
