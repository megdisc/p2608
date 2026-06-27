import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import type { TransactionItem } from '../types';
import { parseLocalInputAsUTC } from '../utils';

export function useTransactions() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [masters, setMasters] = useState<{id: string, name: string, category: string, location: string}[]>([]);
  const [staffs, setStaffs] = useState<{id: string, name: string}[]>([]);
  const [stocktakings, setStocktakings] = useState<{itemName: string, location: string, date: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: txData },
        { data: catData },
        { data: locData },
        { data: masterData },
        { data: staffData },
        { data: stData }
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
        supabase.from('staffs').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('stocktakings').select('date, item:items(name), location:locations(name)')
      ]);

      if (txData) {
        const mapped: TransactionItem[] = txData.map((tx: any) => ({
          id: tx.id,
          date: tx.date,
          itemId: tx.item_id,
          category: tx.item?.category?.name || 'Unknown',
          itemName: tx.item?.name || 'Unknown',
          itemYomigana: tx.item?.yomigana || '',
          type: tx.type,
          quantity: tx.quantity,
          location: tx.location?.name || 'Unknown',
          personInCharge: tx.staff?.name || 'Unknown',
          personInChargeYomigana: tx.staff?.yomigana || '',
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
      if (stData) {
        setStocktakings(stData.map((st: any) => ({
          itemName: st.item?.name || 'Unknown',
          location: st.location?.name || 'Unknown',
          date: st.date
        })));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const latestStocktakingMap = useMemo(() => {
    const map = new Map<string, Date>();
    for (const st of stocktakings) {
      const key = `${st.itemName}_${st.location}`;
      const d = new Date(st.date);
      if (isNaN(d.getTime())) continue;
      
      const currentLatest = map.get(key);
      if (!currentLatest || d > currentLatest) {
        map.set(key, d);
      }
    }
    return map;
  }, [stocktakings]);

  const canEditRow = useCallback((item: TransactionItem) => {
    if (item.id.startsWith('TRX-')) return true;
    const key = `${item.itemName}_${item.location}`;
    const latestDate = latestStocktakingMap.get(key);
    if (!latestDate) return true;
    
    const d = new Date(item.date);
    return d.getTime() > latestDate.getTime();
  }, [latestStocktakingMap]);

  const batchSaveTransactions = async (drafts: TransactionItem[], deletedIds: string[]) => {
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

        const isoDateStr = parseLocalInputAsUTC(item.date);

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
          const isoDateStr = parseLocalInputAsUTC(item.date);
          
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

      await fetchTransactions();
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
    fetchTransactions,
    canEditRow,
    batchSaveTransactions
  };
}
