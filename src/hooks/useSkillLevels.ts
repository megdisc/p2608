import { useState, useCallback } from 'react';
import type { SkillLevelItem } from '../types';
import { supabase } from '../lib/supabase';

export function useSkillLevels() {
  const [items, setItems] = useState<SkillLevelItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSkillLevels = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('skill_levels')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setItems(data as SkillLevelItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveSkillLevels = useCallback(async (drafts: SkillLevelItem[], deletedIds: string[]) => {
    setLoading(true);
    try {
      // Handle deletions
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('skill_levels')
          .delete()
          .in('id', deletedIds);
        if (deleteError) throw deleteError;
      }

      // Handle upserts
      const upserts = drafts.map(draft => {
        // If ID starts with prefix (e.g. SKL-L-), let DB generate UUID
        const isNew = draft.id.startsWith('SKL-L-') || draft.id.startsWith('temp-');
        return {
          ...(isNew ? {} : { id: draft.id }),
          name: draft.name,
          description: draft.description,
          updated_at: new Date().toISOString()
        };
      });

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase
          .from('skill_levels')
          .upsert(upserts);
        if (upsertError) throw upsertError;
      }

      await fetchSkillLevels();
    } finally {
      setLoading(false);
    }
  }, [fetchSkillLevels]);

  return { items, loading, fetchSkillLevels, batchSaveSkillLevels };
}
