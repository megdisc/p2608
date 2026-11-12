import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { WORDS_PROJECT } from '../constants';

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

export function useProjectFinancialSummary(year: string, officeId?: string) {
  const [data, setData] = useState<ProjectFinancialSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      let projQuery = supabase.from('projects').select('id, name, code, office_id').eq('is_deleted', false).order('code', { ascending: true });
      
      let closingsQuery = supabase
        .from('monthly_closings')
        .select('target_period, is_financial_confirmed')
        .gte('target_period', `${year}-01`)
        .lte('target_period', `${year}-12`)
        .eq('is_financial_confirmed', true);

      let snapQuery = supabase
        .from('financial_snapshot')
        .select('id, project_id, type, subject, amount, target_period, activity_category, office_id')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`);

      let recQuery = supabase
        .from('financial_records')
        .select('id, project_id, type, subject, amount, target_period, activity_category, office_id')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`);

      if (officeId) {
        projQuery = projQuery.eq('office_id', officeId);
        closingsQuery = closingsQuery.eq('office_id', officeId);
        snapQuery = snapQuery.eq('office_id', officeId);
        recQuery = recQuery.eq('office_id', officeId);
      }

      const [
        { data: projData, error: projError },
        { data: closingsData },
        { data: snapData },
        { data: recData, error: recError }
      ] = await Promise.all([
        projQuery,
        closingsQuery,
        snapQuery,
        recQuery
      ]);

      if (projError) throw projError;
      if (recError) throw recError;

      const confirmedMonths = new Set((closingsData || []).map((c: { target_period: string }) => c.target_period));
      const snapRecords = snapData || [];
      const actRecords = recData || [];
      const snapMonthSet = new Set(snapRecords.map(r => r.target_period ? r.target_period.substring(0, 7) : ''));

      type RawProjectFinancialRecord = {
        id: string;
        project_id?: string | null;
        type?: string | null;
        subject?: string | null;
        amount?: number | null;
        target_period?: string | null;
        activity_category?: string | null;
        office_id?: string | null;
      };

      // 各月ごとに確定済み月はスナップショット、未確定月はレコード系を採用
      const mergedRecords: RawProjectFinancialRecord[] = [];
      for (let i = 1; i <= 12; i++) {
        const monthStr = `${year}-${i.toString().padStart(2, '0')}`;
        const isClosed = confirmedMonths.has(monthStr);

        if (isClosed && snapMonthSet.has(monthStr)) {
          mergedRecords.push(...snapRecords.filter(r => r.target_period && r.target_period.startsWith(monthStr)));
        } else {
          mergedRecords.push(...actRecords.filter(r => r.target_period && r.target_period.startsWith(monthStr)));
        }
      }

      if (projData) {
        // Filter out 'その他' project and filter financial records for production activity
        const filteredProjData = projData.filter((p: any) => p.name !== 'その他');
        const productionRecords = mergedRecords.filter((r: any) => r.activity_category !== 'welfare');

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
            const subj = r.subject || '';
            if (r.type === 'revenue') {
              revTotal += amount;
              revSales += amount;
            } else if (r.type === 'expense') {
              expTotal += amount;
              if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL || subj.includes('材料費')) {
                expMaterial += amount;
              } else if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER || subj.includes('労務費（利用者工賃）') || subj.includes('メンバー工賃') || subj.includes('基本工賃') || subj.includes('工賃')) {
                expLaborMember += amount;
              } else if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER || subj.includes('労務費（利用者工賃以外）') || subj.includes('労務費（その他）') || subj.includes('その他人件費')) {
                expLaborOther += amount;
              } else if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE || subj.includes('外注加工費')) {
                expOutsource += amount;
              } else {
                expOther += amount;
              }
            } else if (r.type === 'reserve') {
              resTotal += amount;
              if (subj === WORDS_PROJECT.SUBJECT_RESERVE_WAGE || subj.includes('工賃変動積立金')) {
                resWage += amount;
              } else if (subj === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || subj.includes('設備等修繕維持積立金') || subj.includes('設備等整備積立金') || subj.includes('積立金')) {
                resEquipment += amount;
              } else {
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
  }, [year, officeId]);

  return {
    data,
    loading,
    fetchSummary
  };
}
