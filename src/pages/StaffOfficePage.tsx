import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, RadioButton, type Column } from '../components';
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
  primaryOfficeId: string | null;
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
        let primaryId: string | null = null;

        activeOffices.forEach(office => {
          const setting = settings.find(s => s.staff_id === staff.id && s.office_id === office.id);
          const isAssigned = !!setting;
          assignedMap[office.id] = isAssigned;

          if (setting?.is_primary) {
            primaryId = office.id;
          }
        });

        if (!primaryId) {
          const firstAssigned = activeOffices.find(o => assignedMap[o.id]);
          if (firstAssigned) {
            primaryId = firstAssigned.id;
          }
        }

        return {
          id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
          assignedOffices: assignedMap,
          primaryOfficeId: primaryId,
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
        style: { textAlign: 'center', minWidth: '120px', whiteSpace: 'nowrap' },
        onCellChange: (newValue, _item, updateRow) => {
          if (newValue && typeof newValue === 'object') {
            updateRow(newValue);
            return newValue;
          }
        },
        customEditRender: (_val, item: StaffOfficeGridRow, onChange) => {
          const assignedOfficesMap = item.assignedOffices || {};
          const isAssigned = !!assignedOfficesMap[office.id];
          const isPrimary = item.primaryOfficeId === office.id;

          const handleToggleAssigned = () => {
            const nextAssigned = !isAssigned;
            const updatedAssigned = {
              ...assignedOfficesMap,
              [office.id]: nextAssigned,
            };

            let nextPrimary = item.primaryOfficeId;
            if (nextAssigned) {
              if (!nextPrimary) {
                nextPrimary = office.id;
              }
            } else {
              if (nextPrimary === office.id) {
                const remainingOffice = offices.find(o => o.id !== office.id && updatedAssigned[o.id]);
                nextPrimary = remainingOffice ? remainingOffice.id : null;
              }
            }

            onChange({
              assignedOffices: updatedAssigned,
              primaryOfficeId: nextPrimary,
            });
          };

          const handleSetPrimary = () => {
            const updatedAssigned = {
              ...assignedOfficesMap,
              [office.id]: true,
            };
            onChange({
              assignedOffices: updatedAssigned,
              primaryOfficeId: office.id,
            });
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '4px 0', minWidth: '100px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={isAssigned}
                  onChange={handleToggleAssigned}
                />
                <span>勤務</span>
              </label>

              <RadioButton
                label="主たる事業所"
                name={`primary_office_${item.id}`}
                checked={isPrimary}
                disabled={!isAssigned}
                onChange={handleSetPrimary}
              />
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

      const toInsert: { office_id: string; staff_id: string; is_primary: boolean }[] = [];
      const toUpdate: { id: string; is_primary: boolean }[] = [];
      const toDeleteIds: string[] = [];

      drafts.forEach(row => {
        offices.forEach(office => {
          const key = `${row.id}_${office.id}`;
          const isSelected = !!row.assignedOffices[office.id];
          const isPrimary = row.primaryOfficeId === office.id;
          const existing = existingMap.get(key);

          if (isSelected) {
            if (!existing) {
              toInsert.push({
                office_id: office.id,
                staff_id: row.id,
                is_primary: isPrimary,
              });
            } else if (existing.is_primary !== isPrimary && existing.id) {
              toUpdate.push({
                id: existing.id,
                is_primary: isPrimary,
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

      for (const item of toUpdate) {
        const { error: upErr } = await supabase
          .from('office_staff_settings')
          .update({ is_primary: item.is_primary })
          .eq('id', item.id);
        if (upErr) throw upErr;
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
