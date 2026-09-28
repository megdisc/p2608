import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import type { StaffTableItem, OfficeTableItem, OfficeStaffSettingTableItem } from '../types/db';

type StaffOfficeRow = {
  id: string; // staff_id
  code: string;
  name: string;
  yomigana: string;
  // officeId -> assigned boolean
  assignedOffices: Record<string, boolean>;
  // officeId which is primary (only one office per staff, or null)
  primaryOfficeId: string | null;
};

export function StaffOfficePage() {
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const [matrixData, setMatrixData] = useState<StaffOfficeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const rows: StaffOfficeRow[] = activeStaffs.map(staff => {
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

        // Fallback: If assigned to some offices but no primary is set, pick the first assigned as primary
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

  const handleToggleAssigned = (staffId: string, officeId: string) => {
    setMatrixData(prev =>
      prev.map(row => {
        if (row.id !== staffId) return row;

        const nextAssigned = !row.assignedOffices[officeId];
        const updatedAssigned = {
          ...row.assignedOffices,
          [officeId]: nextAssigned,
        };

        let nextPrimary = row.primaryOfficeId;

        if (nextAssigned) {
          // If no primary was set, set this newly assigned office as primary
          if (!nextPrimary) {
            nextPrimary = officeId;
          }
        } else {
          // If we uncheck the primary office, find another assigned office to be primary
          if (nextPrimary === officeId) {
            const remainingOffice = offices.find(o => o.id !== officeId && updatedAssigned[o.id]);
            nextPrimary = remainingOffice ? remainingOffice.id : null;
          }
        }

        return {
          ...row,
          assignedOffices: updatedAssigned,
          primaryOfficeId: nextPrimary,
        };
      })
    );
  };

  const handleSetPrimary = (staffId: string, officeId: string) => {
    setMatrixData(prev =>
      prev.map(row => {
        if (row.id !== staffId) return row;

        // Setting primary automatically ensures it is assigned
        return {
          ...row,
          assignedOffices: {
            ...row.assignedOffices,
            [officeId]: true,
          },
          primaryOfficeId: officeId,
        };
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Fetch latest settings from DB to compute diff accurately
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

      matrixData.forEach(row => {
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

      // Execute Deletions
      if (toDeleteIds.length > 0) {
        const { error: delErr } = await supabase
          .from('office_staff_settings')
          .delete()
          .in('id', toDeleteIds);
        if (delErr) throw delErr;
      }

      // Execute Updates
      for (const item of toUpdate) {
        const { error: upErr } = await supabase
          .from('office_staff_settings')
          .update({ is_primary: item.is_primary })
          .eq('id', item.id);
        if (upErr) throw upErr;
      }

      // Execute Insertions
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>職員事業所割当設定</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            登録済の事業所（通称名）に対して、各職員の所属割り当ておよび「主たる事業所」を管理します。
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 20px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'background-color 0.2s',
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {offices.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
          登録されている事業所がありません。「施設管理」画面で事業所を登録してください。
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', minWidth: '100px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
                  職員コード
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', minWidth: '140px', position: 'sticky', left: '100px', backgroundColor: '#f8fafc', zIndex: 10 }}>
                  職員氏名
                </th>
                {offices.map(office => (
                  <th key={office.id} style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'center', minWidth: '160px', borderLeft: '1px solid #f1f5f9' }}>
                    <div>{office.short_name || office.name}</div>
                    <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b', display: 'block', marginTop: '2px' }}>
                      {office.code || ''}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: idx === matrixData.length - 1 ? 'none' : '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#64748b', position: 'sticky', left: 0, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd', zIndex: 5 }}>
                    {row.code || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', position: 'sticky', left: '100px', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd', zIndex: 5 }}>
                    {row.name}
                  </td>
                  {offices.map(office => {
                    const isAssigned = !!row.assignedOffices[office.id];
                    const isPrimary = row.primaryOfficeId === office.id;

                    return (
                      <td key={office.id} style={{ padding: '12px 16px', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: isAssigned ? '#1e293b' : '#94a3b8' }}>
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleToggleAssigned(row.id, office.id)}
                              style={{
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                                accentColor: '#2563eb',
                              }}
                            />
                            <span>割当</span>
                          </label>

                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: isAssigned ? 'pointer' : 'not-allowed', fontSize: '12px', color: isPrimary ? '#2563eb' : (isAssigned ? '#64748b' : '#cbd5e1'), fontWeight: isPrimary ? 600 : 400 }}>
                            <input
                              type="radio"
                              name={`primary_office_${row.id}`}
                              checked={isPrimary}
                              disabled={!isAssigned}
                              onChange={() => handleSetPrimary(row.id, office.id)}
                              style={{
                                width: '15px',
                                height: '15px',
                                cursor: isAssigned ? 'pointer' : 'not-allowed',
                                accentColor: '#2563eb',
                              }}
                            />
                            <span>主たる事業所</span>
                          </label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
