import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { FinancialRecordItem } from '../types';
import { getCurrentJSTDateOnly } from '../utils';

export function useFinancialRecords() {
  const [items, setItems] = useState<FinancialRecordItem[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [staffs, setStaffs] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: recData, error: recError },
        { data: projData, error: projError },
        { data: staffData, error: staffError },
      ] = await Promise.all([
        supabase.from('financial_records').select(`
          id, period, type, subject, amount, recorded_date, is_limited,
          project:projects(id, name),
          staff:staffs(id, name)
        `),
        supabase.from('projects').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('staffs').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true })
      ]);

      if (recError) throw recError;
      if (projError) throw projError;
      if (staffError) throw staffError;

      if (recData) {
        const mapped: FinancialRecordItem[] = recData.map((r: any) => ({
          id: r.id,
          period: r.period,
          projectId: r.project?.id || '',
          type: r.type,
          subject: r.subject,
          amount: r.amount,
          recordedDate: r.recorded_date,
          recordedBy: r.staff?.id || '',
          isLimited: r.is_limited
        }));
        // Sort by period descending, then recorded_date descending
        mapped.sort((a, b) => {
          if (a.period !== b.period) return b.period.localeCompare(a.period);
          return b.recordedDate.localeCompare(a.recordedDate);
        });
        setItems(mapped);
      }
      if (projData) setProjects(projData);
      if (staffData) setStaffs(staffData);
    } catch (error) {
      console.error('Error fetching financial records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveRecords = useCallback(async (drafts: FinancialRecordItem[]) => {
    const today = getCurrentJSTDateOnly();
    
    // Process new and updated records
    const upserts = drafts.map(d => ({
      ...(d.id.startsWith('draft-') ? {} : { id: d.id }),
      period: d.period || today,
      project_id: d.projectId || null,
      type: d.type || 'revenue',
      subject: d.subject || '',
      amount: d.amount || 0,
      recorded_date: d.recordedDate || today,
      recorded_by: d.recordedBy || null,
      is_limited: d.isLimited || false
    }));

    if (upserts.length > 0) {
      const { error: upsertError } = await supabase.from('financial_records').upsert(upserts);
      if (upsertError) throw upsertError;
    }

    // Process deletions
    const draftIds = drafts.map(d => d.id).filter(id => !id.startsWith('draft-'));
    const existingIds = items.map(i => i.id);
    const deletedIds = existingIds.filter(id => !draftIds.includes(id));

    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase.from('financial_records').delete().in('id', deletedIds);
      if (deleteError) throw deleteError;
    }

    await fetchRecords();
  }, [items, fetchRecords]);

  return {
    items,
    projects,
    staffs,
    loading,
    fetchRecords,
    batchSaveRecords
  };
}
