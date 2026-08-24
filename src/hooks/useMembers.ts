import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { MemberItem } from '../types';

export function useMembers() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [lastDbCode, setLastDbCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, allCodesRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('members').select('code, created_at').order('created_at', { ascending: false })
      ]);
      if (membersRes.error) throw membersRes.error;
      if (membersRes.data) setItems(membersRes.data);

      const rawCodes = allCodesRes.data || [];
      const latestCode = rawCodes.find((p: any) => p.code && p.code.trim() !== '')?.code || null;
      setLastDbCode(latestCode);
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveMembers = async (drafts: MemberItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('members').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      for (const item of drafts) {
        if (!deletedIds.includes(item.id)) {
          const cleanName = item.name.replace(/[\s　]+/g, '');
          if (item.id.startsWith('MBR-')) {
            const { error } = await supabase.from('members').insert({
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email || null,
              role: item.role || '利用者'
            });
            if (error) {
              if (error.code === '23505' || error.message?.includes('duplicate key') || error.details?.includes('code')) {
                throw new Error(`利用者ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw error;
            }
          } else {
            const { error: memberError } = await supabase.from('members').update({
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email || null,
              role: item.role
            }).eq('id', item.id);
            if (memberError) {
              if (memberError.code === '23505' || memberError.message?.includes('duplicate key') || memberError.details?.includes('code')) {
                throw new Error(`利用者ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw memberError;
            }

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
    }
  };

  return {
    items,
    lastDbCode,
    loading,
    fetchMembers,
    batchSaveMembers
  };
}
