import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { getCurrentISOString } from '../utils';

export type PivotInventoryItem = {
  id: string;
  category: string;
  name: string;
  totalQuantity: number;
  [locationName: string]: string | number;
};

export function useInventory() {
  const [inventories, setInventories] = useState<any[]>([]);
  const [locations, setLocations] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetDate] = useState(() => getCurrentISOString());

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: invData },
        { data: locData }
      ] = await Promise.all([
        supabase.rpc('get_inventory_summary', { p_target_date: targetDate }),
        supabase.from('locations').select('name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true })
      ]);

      if (invData) setInventories(invData);
      if (locData) setLocations(locData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  return {
    inventories,
    locations,
    loading,
    targetDate,
    fetchInventory
  };
}
