import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { CategoryItem } from '../types';

export function useCategories() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('categories').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveCategories = async (drafts: CategoryItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('categories').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('CAT-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('CAT-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('categories').update({
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `CAT-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }));
        const { error } = await supabase.from('categories').insert(inserts);
        if (error) throw error;
      }

      await fetchCategories();
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
    fetchCategories,
    batchSaveCategories
  };
}
