import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type QualificationItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  is_deleted?: boolean;
};

export function useQualifications() {
  const [items, setItems] = useState<QualificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQualifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('qualifications')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;

      const formatted: QualificationItem[] = (data || []).map((q: any) => ({
        id: q.id,
        code: q.code || '',
        name: q.name || '',
        category: q.category || '',
        description: q.description || '',
        is_deleted: q.deleted_at !== null && q.deleted_at !== undefined
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching qualifications:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveQualifications = async (drafts: QualificationItem[], deletedIds: string[]) => {
    try {
      for (const item of drafts) {
        const isDeleted = !!item.is_deleted || deletedIds.includes(item.id);
        const upsertData: any = {
          code: item.code.trim(),
          name: item.name,
          category: item.category || null,
          description: item.description || null,
          deleted_at: isDeleted ? new Date().toISOString() : null,
        };
        if (!item.id.startsWith('QUAL-')) {
          upsertData.id = item.id;
        }

        const { error } = await supabase.from('qualifications').upsert(upsertData);
        if (error) throw error;
      }

      await fetchQualifications();
    } catch (err) {
      console.error('Error saving qualifications:', err);
      throw err;
    }
  };

  return {
    items,
    loading,
    fetchQualifications,
    batchSaveQualifications
  };
}
