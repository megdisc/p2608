import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { SkillItem } from '../types';

export function useSkills() {
  const [items, setItems] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('is_deleted', false)
        .order('yomigana', { ascending: true });
      
      if (error) throw error;
      
      const formatted = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        yomigana: d.yomigana || '',
        description: d.description || ''
      }));
      setItems(formatted);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveSkills = async (drafts: SkillItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('skills').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        id: item.id.startsWith('SKL-') ? undefined : item.id,
        name: item.name,
        yomigana: item.yomigana,
        description: item.description
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('skills').upsert(upserts);
        if (error) throw error;
      }

      await fetchSkills();
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
    fetchSkills,
    batchSaveSkills
  };
}
