import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import type { StaffTableItem, QualificationTableItem, StaffQualificationSettingTableItem } from '../types/db';

type StaffRow = {
  id: string;
  code: string;
  name: string;
  yomigana: string;
  // qualificationId -> boolean (assigned)
  assignedQualifications: Record<string, boolean>;
};

export function StaffQualificationPage() {
  const [qualifications, setQualifications] = useState<QualificationTableItem[]>([]);
  const [matrixData, setMatrixData] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const rows: StaffRow[] = activeStaffs.map(staff => {
        const assignedMap: Record<string, boolean> = {};
        activeQuals.forEach(qual => {
          const exists = settings.some(s => s.staff_id === staff.id && s.qualification_id === qual.id);
          assignedMap[qual.id] = exists;
        });

        return {
          id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
          assignedQualifications: assignedMap,
        };
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

  const handleToggleAssigned = (staffId: string, qualId: string) => {
    setMatrixData(prev =>
      prev.map(row => {
        if (row.id !== staffId) return row;
        return {
          ...row,
          assignedQualifications: {
            ...row.assignedQualifications,
            [qualId]: !row.assignedQualifications[qualId],
          },
        };
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Fetch latest settings from DB to compute diff accurately
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

      matrixData.forEach(row => {
        qualifications.forEach(qual => {
          const key = `${row.id}_${qual.id}`;
          const isSelected = !!row.assignedQualifications[qual.id];
          const existsInDb = existingMap.has(key);

          if (isSelected && !existsInDb) {
            toInsert.push({ staff_id: row.id, qualification_id: qual.id });
          } else if (!isSelected && existsInDb) {
            toDeleteStaffQualPairs.push({ staff_id: row.id, qualification_id: qual.id });
          }
        });
      });

      // Execute Deletions
      for (const pair of toDeleteStaffQualPairs) {
        const { error: delErr } = await supabase
          .from('staff_qualification_settings')
          .delete()
          .eq('staff_id', pair.staff_id)
          .eq('qualification_id', pair.qualification_id);
        if (delErr) throw delErr;
      }

      // Execute Insertions
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
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>職員資格割当設定</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            適用済の資格マスタに対して、各職員の保有資格をマトリクス形式で割り当てます。
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

      {qualifications.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
          適用済の資格マスタが登録されていません。「福祉制度マスタ」画面で資格を登録・適用してください。
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
                {qualifications.map(qual => (
                  <th key={qual.id} style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'center', minWidth: '140px', borderLeft: '1px solid #f1f5f9' }}>
                    <div>{qual.name}</div>
                    {qual.category && (
                      <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b', display: 'block', marginTop: '2px' }}>
                        {qual.category}
                      </span>
                    )}
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
                  {qualifications.map(qual => {
                    const isChecked = !!row.assignedQualifications[qual.id];
                    return (
                      <td key={qual.id} style={{ padding: '12px 16px', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '4px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAssigned(row.id, qual.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#2563eb',
                            }}
                          />
                        </label>
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
