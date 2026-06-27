import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { MasterItem } from '../types';

export function useMasterItems() {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMasterItems = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: itemsData },
        { data: categoriesData },
        { data: suppliersData },
        { data: locationsData },
      ] = await Promise.all([
        supabase.from('items').select(`
          id, name, yomigana, standard_price, standard_purchase_qty,
          category:categories(name, yomigana),
          location:locations(name),
          supplier:suppliers(name)
        `).eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('categories').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('suppliers').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('locations').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
      ]);

      if (itemsData) {
        const mapped: MasterItem[] = itemsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          yomigana: item.yomigana,
          description: item.description || '',
          supplier: item.supplier?.name || 'Unknown',
          standardPrice: item.standard_price,
          standardPurchaseQty: item.standard_purchase_qty,
          category: item.category?.name || 'Unknown',
          categoryYomigana: item.category?.yomigana || '',
          location: item.location?.name || 'Unknown',
        }));
        setItems(mapped);
      }
      if (categoriesData) setCategories(categoriesData);
      if (suppliersData) setSuppliers(suppliersData);
      if (locationsData) setLocations(locationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveMasterItems = async (drafts: MasterItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const { error } = await supabase.from('items').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const catMap = new Map(categories.map(c => [c.name, c.id]));
      const supMap = new Map(suppliers.map(s => [s.name, s.id]));
      const locMap = new Map(locations.map(l => [l.name, l.id]));

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('MST-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('MST-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('items').update({
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description,
          supplier_id: supMap.get(item.supplier) || null,
          standard_price: item.standardPrice,
          standard_purchase_qty: item.standardPurchaseQty,
          category_id: catMap.get(item.category) || null,
          location_id: locMap.get(item.location) || null
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `MST-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description,
          supplier_id: supMap.get(item.supplier) || null,
          standard_price: item.standardPrice,
          standard_purchase_qty: item.standardPurchaseQty,
          category_id: catMap.get(item.category) || null,
          location_id: locMap.get(item.location) || null
        }));
        const { error } = await supabase.from('items').insert(inserts);
        if (error) throw error;
      }

      await fetchMasterItems();
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
    suppliers,
    locations,
    loading,
    fetchMasterItems,
    batchSaveMasterItems
  };
}
