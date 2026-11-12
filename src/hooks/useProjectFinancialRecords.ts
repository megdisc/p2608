import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ProjectFinancialSummaryRow, ProjectFinancialRecordSubRow } from '../types';
import { useOffice } from '../contexts';

export function useProjectFinancialRecords() {
  const [items, setItems] = useState<ProjectFinancialSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedOfficeId } = useOffice();

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all projects and financial records
      const [
        { data: projData, error: projError },
        { data: recData, error: recError }
      ] = await Promise.all([
        supabase.from('projects').select('id, office_id, name, project_type').eq('is_deleted', false).order('name', { ascending: true }),
        supabase.from('financial_records').select('id, project_id, type, subject, amount, target_period')
      ]);

      if (projError) throw projError;
      if (recError) throw recError;

      if (projData && recData) {
        let filteredProjects = projData;
        if (selectedOfficeId) {
          filteredProjects = filteredProjects.filter((p: any) => p.office_id === selectedOfficeId);
        }

        const mappedItems: ProjectFinancialSummaryRow[] = filteredProjects.map((p: any) => {
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
              period: r.target_period ? r.target_period.substring(0, 7) : '',
              recordedDate: r.target_period
            };
          });

          // Sort records by period desc
          records.sort((a, b) => {
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
