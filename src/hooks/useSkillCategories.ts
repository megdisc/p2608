import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { SkillCategoryItem } from '../types';

export function useSkillCategories() {
  const [categories, setCategories] = useState<SkillCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('skill_categories')
        .select('*')
        .eq('is_deleted', false);

      if (officeId) {
        query = query.or(`office_id.eq.${officeId},office_id.is.null`);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('fetchCategories error:', error);
        throw error;
      }

      const formatted: SkillCategoryItem[] = (data || []).map(d => ({
        id: d.id,
        office_id: d.office_id,
        name: d.name,
        description: d.description || '',
      }));
      setCategories(formatted);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveCategories = async (drafts: SkillCategoryItem[], deletedIds: string[], officeId?: string) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const { error } = await supabase
          .from('skill_categories')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        ...(item.id.startsWith('CAT-') ? {} : { id: item.id }),
        ...(officeId ? { office_id: officeId } : {}),
        name: item.name,
        description: item.description || '',
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('skill_categories').upsert(upserts);
        if (error) throw error;
      }

      await fetchCategories(officeId);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    fetchCategories,
    batchSaveCategories,
  };
}
