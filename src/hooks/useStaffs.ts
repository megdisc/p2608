import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { StaffItem } from '../types';

export function useStaffs() {
  const [items, setItems] = useState<StaffItem[]>([]);
  const [lastDbCode, setLastDbCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStaffs = useCallback(async () => {
    try {
      setLoading(true);
      const [staffsRes, allCodesRes] = await Promise.all([
        supabase.from('staffs').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('staffs').select('code, created_at').order('created_at', { ascending: false })
      ]);
      if (staffsRes.error) throw staffsRes.error;
      if (staffsRes.data) setItems(staffsRes.data);

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
      setLoading(true);

      if (deletedIds.length > 0) {
        const { error } = await supabase.from('staffs').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      for (const item of drafts) {
        if (!deletedIds.includes(item.id)) {
          const cleanName = item.name.replace(/[\s　]+/g, '');
          if (item.id.startsWith('STF-')) {
            const { error } = await supabase.from('staffs').insert({
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email || null,
              role: item.role || '職員'
            });
            if (error) {
              if (error.code === '23505' || error.message?.includes('duplicate key') || error.details?.includes('code')) {
                throw new Error(`職員ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw error;
            }
          } else {
            const { error: staffError } = await supabase.from('staffs').update({
              code: item.code?.trim() || null,
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email || null,
              role: item.role
            }).eq('id', item.id);
            if (staffError) {
              if (staffError.code === '23505' || staffError.message?.includes('duplicate key') || staffError.details?.includes('code')) {
                throw new Error(`職員ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
              }
              throw staffError;
            }

            if (item.password) {
              const { error: passError } = await supabase.rpc('update_staff_password', {
                user_id: item.id,
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
    } finally {
      setLoading(false);
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
