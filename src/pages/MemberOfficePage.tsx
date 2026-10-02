import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import type { OfficeMemberSettingTableItem, OfficeTableItem } from '../types/db';

type MemberOfficeGridRow = {
  id: string; // member_id
  code: string;
  name: string;
  yomigana: string;
  assignedOffices: Record<string, boolean>;
  copaymentOfficeId: string | null;
  [officeId: string]: any;
};

export function MemberOfficePage() {
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const [matrixData, setMatrixData] = useState<MemberOfficeGridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchMatrixData = useCallback(async () => {
    try {
      setLoading(true);
      const [memberRes, officeRes, settingsRes, certRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('office_member_settings').select('*'),
        supabase.from('member_recipient_certificates').select('*').or('is_deleted.eq.false,is_deleted.is.null'),
      ]);

      if (memberRes.error) throw memberRes.error;
      if (officeRes.error) throw officeRes.error;
      if (settingsRes.error) throw settingsRes.error;

      const activeMembers: any[] = memberRes.data || [];
      const activeOffices: OfficeTableItem[] = officeRes.data || [];
      const settings: OfficeMemberSettingTableItem[] = settingsRes.data || [];
      const certs: any[] = certRes.data || [];

      setOffices(activeOffices);

      const rows: MemberOfficeGridRow[] = activeMembers.map(member => {
        const assignedMap: Record<string, boolean> = {};

        // Find certificate for this member with copayment management type self_internal/self and valid office id
        const memberCerts = certs.filter((c: any) => c.member_id === member.id && !c.is_deleted);
        const selfManagedCert = memberCerts.find((c: any) =>
          (c.copayment_management_type === 'self_internal' || c.copayment_management_type === 'self') &&
          c.copayment_office_id
        );
        const copaymentOfficeId = selfManagedCert ? selfManagedCert.copayment_office_id : null;

        activeOffices.forEach(office => {
          const setting = settings.find(s => s.member_id === member.id && s.office_id === office.id);
          const isCopaymentOffice = copaymentOfficeId === office.id;
          if (isCopaymentOffice) {
            assignedMap[office.id] = true;
          } else {
            assignedMap[office.id] = !!setting;
          }
        });

        return {
          id: member.id,
          code: member.code || '',
          name: member.name,
          yomigana: member.yomigana || '',
          assignedOffices: assignedMap,
          copaymentOfficeId,
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

  const columns: Column<MemberOfficeGridRow>[] = useMemo(() => {
    const cols: Column<MemberOfficeGridRow>[] = [
      {
        key: 'code',
        header: TABLE_COLUMNS.MEMBER_ID,
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
        style: (item: MemberOfficeGridRow) => ({
          textAlign: 'center',
          minWidth: '120px',
          whiteSpace: 'nowrap',
          backgroundColor: item.copaymentOfficeId === office.id ? '#ffffff' : undefined,
        }),
        onCellChange: (newValue, _item, updateRow) => {
          if (newValue && typeof newValue === 'object') {
            updateRow(newValue);
            return newValue;
          }
        },
        customEditRender: (_val, item: MemberOfficeGridRow, onChange) => {
          const assignedOfficesMap = item.assignedOffices || {};
          const isCopaymentOffice = item.copaymentOfficeId === office.id;
          const isAssigned = isCopaymentOffice || !!assignedOfficesMap[office.id];

          const handleToggleAssigned = () => {
            if (isCopaymentOffice) return;

            const nextAssigned = !isAssigned;
            const updatedAssigned = {
              ...assignedOfficesMap,
              [office.id]: nextAssigned,
            };

            onChange({
              assignedOffices: updatedAssigned,
            });
          };

          if (isCopaymentOffice) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', minWidth: '100px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'not-allowed', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={true}
                    disabled={true}
                    style={{ cursor: 'not-allowed' }}
                  />
                  <span>（主たる事業所）</span>
                </label>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', minWidth: '100px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
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

  const handleBatchSave = async (drafts: MemberOfficeGridRow[]) => {
    try {
      const { data: currentSettings, error: fetchErr } = await supabase
        .from('office_member_settings')
        .select('*');

      if (fetchErr) throw fetchErr;

      const existingMap = new Map<string, OfficeMemberSettingTableItem>();
      (currentSettings || []).forEach(s => {
        existingMap.set(`${s.member_id}_${s.office_id}`, s);
      });

      const toInsert: { office_id: string; member_id: string }[] = [];
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
                member_id: row.id,
              });
            }
          } else if (existing && existing.id) {
            toDeleteIds.push(existing.id);
          }
        });
      });

      if (toDeleteIds.length > 0) {
        const { error: delErr } = await supabase
          .from('office_member_settings')
          .delete()
          .in('id', toDeleteIds);
        if (delErr) throw delErr;
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase
          .from('office_member_settings')
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
          : MESSAGES.EMPTY_PROJECT_USER
      }
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}


