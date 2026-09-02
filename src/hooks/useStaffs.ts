import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { StaffItem } from '../types';
import { WORDS_PERSON } from '../constants';

export function useStaffs() {
  const [items, setItems] = useState<StaffItem[]>([]);
  const [lastDbCode, setLastDbCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStaffs = useCallback(async () => {
    try {
      setLoading(true);
      const [staffsRes, allCodesRes] = await Promise.all([
        supabase.from('staffs').select('*, users(email, role)').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('staffs').select('code, created_at').order('created_at', { ascending: false })
      ]);
      if (staffsRes.error) throw staffsRes.error;
      
      const mapped: StaffItem[] = (staffsRes.data || []).map((s: any) => {
        let roleVal = s.users?.role || WORDS_PERSON.ROLE_STAFF;
        if (roleVal === 'Administrator') roleVal = WORDS_PERSON.ROLE_ADMIN;
        if (roleVal === 'Staff') roleVal = WORDS_PERSON.ROLE_STAFF;
        return {
          id: s.id,
          user_id: s.user_id,
          code: s.code,
          name: s.name,
          yomigana: s.yomigana,
          email: s.users?.email || '',
          role: roleVal,
          is_deleted: s.is_deleted,
        };
      });
      setItems(mapped);

      const rawCodes = allCodesRes.data || [];
      const latestCode = rawCodes.find((p: any) => p.code && p.code.trim() !== '')?.code || null;
      setLastDbCode(latestCode);
    } catch (error) {
      console.error('Error fetching staffs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveStaffs = async (drafts: StaffItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('staffs').update({ deleted_at: new Date().toISOString() }).in('id', deletedIds);
        if (error) throw error;
      }

      for (const item of drafts) {
        if (!deletedIds.includes(item.id)) {
          const cleanName = item.name.replace(/[\s　]+/g, '');
          if (item.id.startsWith('STF-')) {
            // Create user first in users table
            const { data: userData, error: userError } = await supabase.from('users').insert({
              email: item.email || null,
              role: item.role || WORDS_PERSON.ROLE_STAFF,
              user_type: 'staff'
            }).select('id').single();
            if (userError) throw userError;

            const { error } = await supabase.from('staffs').insert({
              user_id: userData.id,
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || ''
            });
            if (error) {
              if (error.code === '23505' || error.message?.includes('duplicate key') || error.details?.includes('code')) {
                throw new Error(`職員ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw error;
            }
          } else {
            if (item.user_id) {
              const { error: userError } = await supabase.from('users').update({
                email: item.email || null,
                role: item.role || WORDS_PERSON.ROLE_STAFF
              }).eq('id', item.user_id);
              if (userError) throw userError;
            }

            const { error: staffError } = await supabase.from('staffs').update({
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || ''
            }).eq('id', item.id);
            if (staffError) {
              if (staffError.code === '23505' || staffError.message?.includes('duplicate key') || staffError.details?.includes('code')) {
                throw new Error(`職員ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw staffError;
            }

            if (item.password) {
              const { error: passError } = await supabase.rpc('update_staff_password', {
                user_id: item.user_id || item.id,
                new_password: item.password
              });
              if (passError) throw passError;
            }
          }
        }
      }

      await fetchStaffs();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    items,
    lastDbCode,
    loading,
    fetchStaffs,
    batchSaveStaffs
  };
}
