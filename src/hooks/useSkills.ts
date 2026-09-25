import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { SkillItem } from '../types';

export function useSkills() {
  const [items, setItems] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSkills = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('skills')
        .select('*')
        .eq('is_deleted', false);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query.order('name', { ascending: true });
      
      if (error) throw error;
      
      const formatted = (data || []).map(d => ({
        id: d.id,
        name: d.name,
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

  const batchSaveSkills = async (drafts: SkillItem[], deletedIds: string[], officeId?: string) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('skill_items').update({ deleted_at: new Date().toISOString() }).in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        ...(item.id.startsWith('SKL-') ? {} : { id: item.id }),
        ...(officeId ? { office_id: officeId } : {}),
        name: item.name,
        description: item.description
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('skill_items').upsert(upserts);
        if (error) throw error;
      }

      await fetchSkills(officeId);
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

