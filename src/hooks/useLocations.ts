import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { LocationItem } from '../types';

export function useLocations() {
  const [items, setItems] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('locations').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveLocations = async (drafts: LocationItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('locations').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('LOC-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('LOC-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('locations').update({
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `LOC-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }));
        const { error } = await supabase.from('locations').insert(inserts);
        if (error) throw error;
      }

      await fetchLocations();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    fetchLocations,
    batchSaveLocations
  };
}
