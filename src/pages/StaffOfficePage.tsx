import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import type { OfficeStaffSettingTableItem, OfficeTableItem, StaffTableItem } from '../types/db';

type StaffOfficeGridRow = {
  id: string; // staff_id
  code: string;
  name: string;
  yomigana: string;
  assignedOffices: Record<string, boolean>;
  [officeId: string]: any;
};

export function StaffOfficePage() {
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const [matrixData, setMatrixData] = useState<StaffOfficeGridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchMatrixData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffRes, officeRes, settingsRes] = await Promise.all([
        supabase.from('staffs').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('office_staff_settings').select('*'),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (officeRes.error) throw officeRes.error;
      if (settingsRes.error) throw settingsRes.error;

      const activeStaffs: StaffTableItem[] = staffRes.data || [];
      const activeOffices: OfficeTableItem[] = officeRes.data || [];
      const settings: OfficeStaffSettingTableItem[] = settingsRes.data || [];

      setOffices(activeOffices);

      const rows: StaffOfficeGridRow[] = activeStaffs.map(staff => {
        const assignedMap: Record<string, boolean> = {};

        activeOffices.forEach(office => {
          const isAssigned = settings.some(s => s.staff_id === staff.id && s.office_id === office.id);
          assignedMap[office.id] = isAssigned;
        });

        return {
          id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
          assignedOffices: assignedMap,
        };
      });

      setMatrixData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所割当データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  const columns: Column<StaffOfficeGridRow>[] = useMemo(() => {
    const cols: Column<StaffOfficeGridRow>[] = [
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

    offices.forEach(office => {
      cols.push({
        key: office.id,
        header: office.short_name || office.name,
        sortable: false,
        editable: true,
        inputType: 'checkbox',
        style: () => ({
          textAlign: 'center',
          minWidth: '120px',
          whiteSpace: 'nowrap',
        }),
        onCellChange: (newValue, _item, updateRow) => {
          if (newValue && typeof newValue === 'object') {
            updateRow(newValue);
            return newValue;
          }
        },
        customEditRender: (_val, item: StaffOfficeGridRow, onChange) => {
          const assignedOfficesMap = item.assignedOffices || {};
          const isAssigned = !!assignedOfficesMap[office.id];

          const handleToggleAssigned = () => {
            const updatedAssigned = {
              ...assignedOfficesMap,
              [office.id]: !isAssigned,
            };

            onChange({
              assignedOffices: updatedAssigned,
            });
          };

          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', minWidth: '100px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 'var(--text-caption)' }}>
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={isAssigned}
                  onChange={handleToggleAssigned}
                />
              </label>
            </div>
          );
        },
      });
    });

    return cols;
  }, [offices]);

  const handleBatchSave = async (drafts: StaffOfficeGridRow[]) => {
    try {
      const { data: currentSettings, error: fetchErr } = await supabase
        .from('office_staff_settings')
        .select('*');

      if (fetchErr) throw fetchErr;

      const existingMap = new Map<string, OfficeStaffSettingTableItem>();
      (currentSettings || []).forEach(s => {
        existingMap.set(`${s.staff_id}_${s.office_id}`, s);
      });

      const toInsert: { office_id: string; staff_id: string }[] = [];
      const toDeleteIds: string[] = [];

      drafts.forEach(row => {
        offices.forEach(office => {
          const key = `${row.id}_${office.id}`;
          const isSelected = !!row.assignedOffices[office.id];
          const existing = existingMap.get(key);

          if (isSelected) {
            if (!existing) {
              toInsert.push({
                office_id: office.id,
                staff_id: row.id,
              });
            }
          } else if (existing && existing.id) {
            toDeleteIds.push(existing.id);
          }
        });
      });

      if (toDeleteIds.length > 0) {
        const { error: delErr } = await supabase
          .from('office_staff_settings')
          .delete()
          .in('id', toDeleteIds);
        if (delErr) throw delErr;
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase
          .from('office_staff_settings')
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
      title="事業所割当"
      data={matrixData}
      columns={columns}
      emptyMessage={
        offices.length === 0
          ? '登録されている事業所がありません。「施設管理」画面で事業所を登録してください。'
          : '職員が登録されていません。「職員」タブで職員を登録してください。'
      }
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
