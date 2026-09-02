import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type ProjectFinancialSummaryRow = {
  id: string;
  projectCode: string;
  projectName: string;
  revSales: number;
  revTotal: number;
  expMaterial: number;
  expLaborMember: number;
  expLaborOther: number;
  expOutsource: number;
  expOther: number;
  expTotal: number;
  resWage: number;
  resEquipment: number;
  resTotal: number;
};

export function useProjectFinancialSummary(year: string) {
  const [data, setData] = useState<ProjectFinancialSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: projData, error: projError },
        { data: recData, error: recError }
      ] = await Promise.all([
        supabase.from('projects').select('id, name, code').eq('is_deleted', false).order('code', { ascending: true }),
        supabase
          .from('financial_records')
          .select('id, project_id, type, subject, amount, target_period, activity_category')
          .gte('target_period', `${year}-01-01`)
          .lte('target_period', `${year}-12-31`)
      ]);

      if (projError) throw projError;
      if (recError) throw recError;

      if (projData) {
        // Filter out 'その他' project and filter financial records for production activity
        const filteredProjData = projData.filter((p: any) => p.name !== 'その他');
        const productionRecords = (recData || []).filter((r: any) => r.activity_category !== 'welfare');

        const rows: ProjectFinancialSummaryRow[] = filteredProjData.map((p: any) => {
          const pRecs = productionRecords.filter((r: any) => r.project_id === p.id);

          let revSales = 0;
          let revTotal = 0;
          let expMaterial = 0;
          let expLaborMember = 0;
          let expLaborOther = 0;
          let expOutsource = 0;
          let expOther = 0;
          let expTotal = 0;
          let resWage = 0;
          let resEquipment = 0;
          let resTotal = 0;

          pRecs.forEach((r: any) => {
            const amount = Number(r.amount) || 0;
            if (r.type === 'revenue') {
              revTotal += amount;
              if (r.subject === '売上' || r.subject === '売上高' || !r.subject) {
                revSales += amount;
              } else {
                revSales += amount;
              }
            } else if (r.type === 'expense') {
              expTotal += amount;
              if (r.subject === '材料費') {
                expMaterial += amount;
              } else if (r.subject === 'メンバー工賃' || r.subject === '基本工賃' || r.subject === '工賃') {
                expLaborMember += amount;
              } else if (r.subject === 'その他人件費') {
                expLaborOther += amount;
              } else if (r.subject === '外注加工費') {
                expOutsource += amount;
              } else {
                expOther += amount;
              }
            } else if (r.type === 'reserve') {
              resTotal += amount;
              if (r.subject === '工賃変動積立金') {
                resWage += amount;
              } else if (r.subject === '設備等整備積立金') {
                resEquipment += amount;
              }
            }
          });

          return {
            id: p.id,
            projectCode: p.code || '',
            projectName: p.name,
            revSales,
            revTotal,
            expMaterial,
            expLaborMember,
            expLaborOther,
            expOutsource,
            expOther,
            expTotal,
            resWage,
            resEquipment,
            resTotal
          };
        });

        setData(rows);
      }
    } catch (error) {
      console.error('Error fetching project financial summary:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [year]);

  return {
    data,
    loading,
    fetchSummary
  };
}
