import { useState, useCallback } from 'react';
import type { SkillLevelItem } from '../types';
import { supabase } from '../lib/supabase';

export function useSkillLevels() {
  const [items, setItems] = useState<SkillLevelItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSkillLevels = useCallback(async (officeId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('skill_levels')
        .select('*')
        .eq('is_deleted', false);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query.order('level_value');
      
      if (error) throw error;
      setItems((data || []).map(d => ({
        id: d.id,
        levelValue: d.level_value,
        description: d.description
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveSkillLevels = useCallback(async (drafts: SkillLevelItem[], deletedIds: string[], officeId?: string) => {
    setLoading(true);
    try {
      // Handle deletions
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('skill_level_items')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', deletedIds);
        if (deleteError) throw deleteError;
      }

      // Handle upserts
      const upserts = drafts.map(draft => {
        const isNew = draft.id.startsWith('SKL-L-') || draft.id.startsWith('temp-');
        return {
          ...(isNew ? {} : { id: draft.id }),
          ...(officeId ? { office_id: officeId } : {}),
          level_value: Number(draft.levelValue),
          description: draft.description,
          updated_at: new Date().toISOString()
        };
      });

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase
          .from('skill_level_items')
          .upsert(upserts);
        if (upsertError) throw upsertError;
      }

      await fetchSkillLevels(officeId);
    } finally {
      setLoading(false);
    }
  }, [fetchSkillLevels]);

  return { items, loading, fetchSkillLevels, batchSaveSkillLevels };
}

