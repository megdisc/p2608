import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { MemberItem } from '../types';
import { WORDS_PERSON } from '../constants';

export function useMembers() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [lastDbCode, setLastDbCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, allCodesRes] = await Promise.all([
        supabase.from('members').select('*, users(email, role)').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('members').select('code, created_at').order('created_at', { ascending: false })
      ]);
      if (membersRes.error) throw membersRes.error;

      const mapped: MemberItem[] = (membersRes.data || []).map((m: any) => {
        let roleVal = m.users?.role || WORDS_PERSON.ROLE_MEMBER;
        if (roleVal === 'Member') roleVal = WORDS_PERSON.ROLE_MEMBER;
        return {
          id: m.id,
          user_id: m.user_id,
          code: m.code,
          name: m.name,
          yomigana: m.yomigana,
          email: m.users?.email || '',
          role: roleVal,
          contract_status: m.contract_status,
          contract_type: m.contract_type,
          is_deleted: m.is_deleted,
        };
      });
      setItems(mapped);

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
            // Create user first in users table
            const { data: userData, error: userError } = await supabase.from('users').insert({
              email: item.email || null,
              role: item.role || WORDS_PERSON.ROLE_MEMBER,
              user_type: 'member'
            }).select('id').single();
            if (userError) throw userError;

            const { error } = await supabase.from('members').insert({
              user_id: userData.id,
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || ''
            });
            if (error) {
              if (error.code === '23505' || error.message?.includes('duplicate key') || error.details?.includes('code')) {
                throw new Error(`利用者ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw error;
            }
          } else {
            if (item.user_id) {
              const { error: userError } = await supabase.from('users').update({
                email: item.email || null,
                role: item.role || WORDS_PERSON.ROLE_MEMBER
              }).eq('id', item.user_id);
              if (userError) throw userError;
            }

            const { error: memberError } = await supabase.from('members').update({
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || ''
            }).eq('id', item.id);
            if (memberError) {
              if (memberError.code === '23505' || memberError.message?.includes('duplicate key') || memberError.details?.includes('code')) {
                throw new Error(`利用者ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw memberError;
            }

            if (item.password) {
              const { error: passError } = await supabase.rpc('update_member_password', {
                user_id: item.user_id || item.id,
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
