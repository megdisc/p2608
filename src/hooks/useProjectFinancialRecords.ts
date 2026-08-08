import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ProjectFinancialSummaryRow, ProjectFinancialRecordSubRow } from '../types';

export function useProjectFinancialRecords() {
  const [items, setItems] = useState<ProjectFinancialSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all projects and financial records
      const [
        { data: projData, error: projError },
        { data: recData, error: recError }
      ] = await Promise.all([
        supabase.from('projects').select('id, name, project_type').eq('is_deleted', false).order('name', { ascending: true }),
        supabase.from('financial_records').select('id, project_id, type, subject, amount, period, recorded_date')
      ]);

      if (projError) throw projError;
      if (recError) throw recError;

      if (projData && recData) {
        const mappedItems: ProjectFinancialSummaryRow[] = projData.map((p: any) => {
          const recordsForProject = recData.filter((r: any) => r.project_id === p.id);
          
          let totalRevenue = 0;
          let totalExpense = 0;
          let totalReserve = 0;

          const records: ProjectFinancialRecordSubRow[] = recordsForProject.map((r: any) => {
            const amount = r.amount || 0;
            if (r.type === 'revenue') totalRevenue += amount;
            else if (r.type === 'expense') totalExpense += amount;
            else if (r.type === 'reserve') totalReserve += amount;

            return {
              id: r.id,
              type: r.type,
              subject: r.subject,
              amount,
              period: r.period ? r.period.substring(0, 7) : '',
              recordedDate: r.recorded_date
            };
          });

          // Sort records by period desc
          records.sort((a, b) => {
            if (a.period !== b.period) return b.period.localeCompare(a.period);
            return b.recordedDate.localeCompare(a.recordedDate);
          });

          return {
            id: p.id,
            projectName: p.name,
            projectType: p.project_type,
            totalRevenue,
            totalExpense,
            totalReserve,
            records
          };
        });

        // Optionally hide projects with no financial records? Or show them all?
        // Let's show all projects so users can see which have no records.
        setItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching project financial records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    fetchRecords
  };
}
