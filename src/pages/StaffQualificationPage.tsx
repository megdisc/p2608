import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import type { QualificationTableItem, StaffQualificationSettingTableItem, StaffTableItem } from '../types/db';

type StaffQualificationGridRow = {
  id: string; // staff_id
  code: string;
  name: string;
  yomigana: string;
  [qualId: string]: any;
};

export const B_TYPE_QUALIFICATION_CODES = new Set([
  'QUAL-001', // サービス管理責任者
  'QUAL-003', // 社会福祉士
  'QUAL-004', // 精神保健福祉士
  'QUAL-005', // 介護福祉士
  'QUAL-006', // 公認心理師
  'QUAL-007', // 看護師・准看護師
  'QUAL-008', // 理学療法士（PT）
  'QUAL-009', // 作業療法士（OT）
  'QUAL-010', // 言語聴覚士（ST）
  'QUAL-011', // 目標工賃達成指導員
  'QUAL-012', // 職業指導員
  'QUAL-013', // 生活支援員
  'QUAL-014', // 強度行動障害支援者養成研修修了者
  'QUAL-022', // 喀痰吸引等研修修了者
  'QUAL-025', // 障害者ピアサポート研修修了者
  'QUAL-026', // 職場適応援助者（ジョブコーチ）
  'QUAL-027', // 手話通訳士・手話通訳者・要約筆記者
  'QUAL-028', // 管理者（就労継続支援B型）
]);

export const isBTypeQualification = (qual: { code?: string; name?: string }) => {
  if (qual.code && B_TYPE_QUALIFICATION_CODES.has(qual.code)) {
    return true;
  }
  const name = qual.name || '';
  return (
    name.includes('サービス管理責任者') ||
    name.includes('サビ管') ||
    name.includes('社会福祉士') ||
    name.includes('精神保健福祉士') ||
    name.includes('介護福祉士') ||
    name.includes('公認心理師') ||
    name.includes('看護師') ||
    name.includes('理学療法士') ||
    name.includes('作業療法士') ||
    name.includes('言語聴覚士') ||
    name.includes('目標工賃達成指導員') ||
    name.startsWith('職業指導員') ||
    name.startsWith('生活支援員') ||
    name.includes('強度行動障害') ||
    name.includes('喀痰吸引') ||
    name.includes('ピアサポート') ||
    name.includes('ジョブコーチ') ||
    name.includes('手話通訳') ||
    name.includes('要約筆記') ||
    name.includes('管理者')
  );
};

export function StaffQualificationPage() {
  const [qualifications, setQualifications] = useState<QualificationTableItem[]>([]);
  const [matrixData, setMatrixData] = useState<StaffQualificationGridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchMatrixData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffRes, qualRes, settingsRes] = await Promise.all([
        supabase.from('staffs').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('qualifications').select('*').order('code', { ascending: true }),
        supabase.from('staff_qualification_settings').select('*'),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (qualRes.error) throw qualRes.error;
      if (settingsRes.error) throw settingsRes.error;

      const activeStaffs: StaffTableItem[] = staffRes.data || [];
      const activeQuals: QualificationTableItem[] = qualRes.data || [];
      const settings: StaffQualificationSettingTableItem[] = settingsRes.data || [];

      setQualifications(activeQuals);

      const rows: StaffQualificationGridRow[] = activeStaffs.map(staff => {
        const row: StaffQualificationGridRow = {
          id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
        };
        activeQuals.forEach(qual => {
          const exists = settings.some(s => s.staff_id === staff.id && s.qualification_id === qual.id);
          row[qual.id] = exists;
        });

        return row;
      });

      setMatrixData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '資格割当データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  const columns: Column<StaffQualificationGridRow>[] = useMemo(() => {
    const cols: Column<StaffQualificationGridRow>[] = [
      {
        key: 'code',
        header: TABLE_COLUMNS.STAFF_ID,
        sortable: true,
        sortKey: 'code',
        editable: false,
      },
      {
        key: 'name',
        header: TABLE_COLUMNS.NAME,
        sortable: true,
        sortKey: 'yomigana',
        editable: false,
      },
    ];

    qualifications.forEach(qual => {
      const isBType = isBTypeQualification(qual);
      cols.push({
        key: qual.id,
        header: qual.name,
        sortable: false,
        editable: isBType,
        inputType: 'checkbox',
        style: { textAlign: 'center', opacity: isBType ? 1 : 0.6 },
        onCellChange: isBType ? (newValue, _item, updateRow) => {
          updateRow({ [qual.id]: Boolean(newValue) });
        } : undefined,
      });
    });

    return cols;
  }, [qualifications]);

  const handleBatchSave = async (drafts: StaffQualificationGridRow[]) => {
    try {
      const { data: currentSettings, error: fetchErr } = await supabase
        .from('staff_qualification_settings')
        .select('*');

      if (fetchErr) throw fetchErr;

      const existingMap = new Set<string>();
      (currentSettings || []).forEach(s => {
        existingMap.add(`${s.staff_id}_${s.qualification_id}`);
      });

      const toInsert: { staff_id: string; qualification_id: string }[] = [];
      const toDeleteStaffQualPairs: { staff_id: string; qualification_id: string }[] = [];

      drafts.forEach(row => {
        qualifications.forEach(qual => {
          if (!isBTypeQualification(qual)) return;
          const key = `${row.id}_${qual.id}`;
          const isSelected = Boolean(row[qual.id]);
          const existsInDb = existingMap.has(key);

          if (isSelected && !existsInDb) {
            toInsert.push({ staff_id: row.id, qualification_id: qual.id });
          } else if (!isSelected && existsInDb) {
            toDeleteStaffQualPairs.push({ staff_id: row.id, qualification_id: qual.id });
          }
        });
      });

      for (const pair of toDeleteStaffQualPairs) {
        const { error: delErr } = await supabase
          .from('staff_qualification_settings')
          .delete()
          .eq('staff_id', pair.staff_id)
          .eq('qualification_id', pair.qualification_id);
        if (delErr) throw delErr;
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase
          .from('staff_qualification_settings')
          .insert(toInsert);
        if (insErr) throw insErr;
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchMatrixData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="資格割当"
      data={matrixData}
      columns={columns}
      emptyMessage={
        qualifications.length === 0
          ? '適用済の資格マスタが登録されていません。「福祉制度マスタ」画面で資格を登録・適用してください。'
          : MESSAGES.EMPTY_STAFF
      }
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
