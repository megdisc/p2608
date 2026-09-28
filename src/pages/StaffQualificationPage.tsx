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
        supabase.from('qualifications').select('*').eq('is_active', true).order('code', { ascending: true }),
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
      cols.push({
        key: qual.id,
        header: qual.name,
        sortable: false,
        editable: true,
        inputType: 'checkbox',
        style: { textAlign: 'center' },
        onCellChange: (newValue, _item, updateRow) => {
          updateRow({ [qual.id]: Boolean(newValue) });
        },
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
