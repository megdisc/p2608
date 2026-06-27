import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { MemberItem } from '../types';

export function useMembers() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveMembers = async (drafts: MemberItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('members').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      for (const item of drafts) {
        if (!deletedIds.includes(item.id)) {
          const cleanName = item.name.replace(/[\s　]+/g, '');
          if (item.id.startsWith('MBR-')) {
            const { error } = await supabase.rpc('create_member_user', {
              email: item.email || '',
              password: item.password || '',
              name: cleanName,
              yomigana: item.yomigana || '',
              role: item.role
            });
            if (error) throw error;
          } else {
            const { error: memberError } = await supabase.from('members').update({
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email,
              role: item.role
            }).eq('id', item.id);
            if (memberError) throw memberError;

            if (item.password) {
              const { error: passError } = await supabase.rpc('update_member_password', {
                user_id: item.id,
                new_password: item.password
              });
              if (passError) throw passError;
            }
          }
        }
      }

      await fetchMembers();
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
    fetchMembers,
    batchSaveMembers
  };
}
