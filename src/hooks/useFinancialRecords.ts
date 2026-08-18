import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { FinancialRecordItem } from '../types';
import { getCurrentJSTDateOnly } from '../utils';

export function useFinancialRecords(
  initialSort: { key: string, direction: 'asc' | 'desc' } = { key: 'period', direction: 'desc' }
) {
  const [items, setItems] = useState<FinancialRecordItem[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [staffs, setStaffs] = useState<{id: string, name: string}[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>(initialSort);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear().toString());

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('financial_records').select(`
          id, period, type, subject, amount, remarks, recorded_date, is_limited, activity_category,
          project:projects(id, name),
          staff:staffs(id, name),
          client:partners(id, name)
        `, { count: 'exact' });

      if (currentYear) {
        query = query.gte('period', `${currentYear}-01-01`).lte('period', `${currentYear}-12-31`);
      }

      let dbSortKey = 'period';
      if (sortConfig.key === 'projectId') dbSortKey = 'project_id';
      else if (sortConfig.key === 'clientId') dbSortKey = 'client_id';
      else if (sortConfig.key === 'recordedDate') dbSortKey = 'recorded_date';
      else if (sortConfig.key === 'recordedBy') dbSortKey = 'recorded_by';
      else if (['period', 'type', 'subject', 'amount', 'remarks', 'is_limited', 'activity_category'].includes(sortConfig.key)) dbSortKey = sortConfig.key;

      query = query.order(dbSortKey, { ascending: sortConfig.direction === 'asc' });
      if (dbSortKey !== 'recorded_date') {
        query = query.order('recorded_date', { ascending: sortConfig.direction === 'asc' });
      }

      const startIdx = (page - 1) * pageSize;
      query = query.range(startIdx, startIdx + pageSize - 1);

      const [
        { data: recData, error: recError, count },
        { data: projData, error: projError },
        { data: staffData, error: staffError },
        { data: clientData, error: clientError },
      ] = await Promise.all([
        query,
        supabase.from('projects').select('id, name, code').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('staffs').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('partners').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true })
      ]);

      if (recError) throw recError;
      if (projError) throw projError;
      if (staffError) throw staffError;
      if (clientError) throw clientError;

      if (recData) {
        const mapped: FinancialRecordItem[] = recData.map((r: any) => ({
          id: r.id,
          period: r.period || '',
          projectId: r.project?.id || '',
          clientId: r.client?.id || '',
          type: r.type,
          subject: r.subject,
          amount: r.amount,
          remarks: r.remarks || '',
          recordedDate: r.recorded_date,
          recordedBy: r.staff?.id || '',
          isLimited: r.is_limited,
          activity_category: r.activity_category || 'production'
        }));
        setItems(mapped);
      }
      if (count !== null) setTotalCount(count);
      if (projData) setProjects(projData);
      if (staffData) setStaffs(staffData);
      if (clientData) setClients(clientData);
    } catch (error) {
      console.error('Error fetching financial records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortConfig, currentYear]);

  const batchSaveRecords = useCallback(async (drafts: FinancialRecordItem[]) => {
    const today = getCurrentJSTDateOnly();
    
    // Process new and updated records
    const upserts = drafts.map(d => ({
      ...(d.id.startsWith('draft-') ? {} : { id: d.id }),
      period: d.period || today,
      project_id: d.projectId || null,
      client_id: d.clientId || null,
      type: d.type || 'revenue',
      subject: d.subject || '',
      amount: d.amount || 0,
      remarks: d.remarks || null,
      recorded_date: d.recordedDate || today,
      recorded_by: d.recordedBy || null,
      is_limited: d.isLimited || false,
      activity_category: d.activity_category || 'production'
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

  const handleSortChange = useCallback((newConfig: { key: string, direction: 'asc'|'desc' }) => {
    setSortConfig(newConfig);
    setPage(1);
  }, []);

  const handleYearChange = useCallback((year: string) => {
    setCurrentYear(year);
    setPage(1);
  }, []);

  return {
    items,
    totalCount,
    page,
    setPage,
    currentYear,
    sortConfig,
    handleSortChange,
    handleYearChange,
    projects,
    staffs,
    clients,
    loading,
    fetchRecords,
    batchSaveRecords
  };
}
