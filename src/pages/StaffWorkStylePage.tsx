import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, MultiSelectDropdown, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert, useOffice } from '../contexts';
import {
  MESSAGES,
  TABLE_COLUMNS,
  DUTY_TYPE_OPTIONS,
  OFFICE_STAFF_ROLE_OPTIONS,
} from '../constants';
import { getCurrentJSTDateOnly, recomputeHistoryPeriods } from '../utils';
import type {
  StaffTableItem,
  OfficeStaffSettingTableItem,
  StaffRoleTableItem,
  StaffWorkStyleSummaryTableItem,
  StaffWorkStyleDetailTableItem,
} from '../types/db';

export type StaffWorkStyleSettingRow = {
  id: string; // summary_id (UUID or NEW-xxx)
  office_staff_setting_id: string; // FK -> office_staff_settings.id (親)
  employment_type: string;
  duty_type: string;
  weekly_working_hours: number | string;
  staff_roles: string[];
  role_allocated_hours?: Record<string, number | string>;
  valid_from: string;
  valid_to: string | null;
};

export type StaffWithWorkStyleSettings = {
  id: string; // staff_id
  code: string;
  name: string;
  yomigana: string;
  officeStaffSettingId: string; // 親の事業所職員割当ID
  settings: StaffWorkStyleSettingRow[];
};

const deriveEmploymentType = (hours: number | string | null | undefined): string => {
  if (hours === null || hours === undefined || hours === '') return '';
  const num = Number(hours);
  if (isNaN(num)) return '';
  return num >= 40 ? 'full_time' : 'part_time';
};

const formatEmploymentType = (hours: number | string | null | undefined): string => {
  const type = deriveEmploymentType(hours);
  if (type === 'full_time') return '常勤';
  if (type === 'part_time') return '非常勤';
  return '-';
};

const calculateTotalAllocatedHours = (
  roles: string[] | undefined,
  roleHours: Record<string, number | string> | undefined,
  fallbackWeeklyHours?: number | string
): number => {
  if (!roles || roles.length === 0) return 0;
  if (!roleHours || Object.keys(roleHours).length === 0) {
    return fallbackWeeklyHours ? Number(fallbackWeeklyHours) || 0 : 0;
  }
  let sum = 0;
  roles.forEach(role => {
    const val = roleHours[role];
    if (val !== undefined && val !== null && val !== '') {
      sum += Number(val) || 0;
    } else if (roles.length === 1 && fallbackWeeklyHours) {
      sum += Number(fallbackWeeklyHours) || 0;
    }
  });
  return sum;
};

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
};

export function StaffWorkStylePage() {
  const { selectedOfficeId, offices } = useOffice();
  const [data, setData] = useState<StaffWithWorkStyleSettings[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRoleTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const targetOfficeId = selectedOfficeId || (offices.length > 0 ? offices[0].id : '');

  const currentOffice = useMemo(() => {
    return offices.find(o => o.id === targetOfficeId) || null;
  }, [offices, targetOfficeId]);

  const fetchData = useCallback(async () => {
    if (!targetOfficeId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 1. 親テーブル (office_staff_settings) から選択中の事業所に所属する割当を取得
      // および職種マスタ (staff_roles) を取得
      const [staffRes, officeStaffRes, roleRes] = await Promise.all([
        supabase.from('staffs').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('code', { ascending: true }),
        supabase.from('office_staff_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('staff_roles').select('*').order('sort_order', { ascending: true }),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (officeStaffRes.error) throw officeStaffRes.error;

      if (roleRes.error) {
        console.error('Error fetching staff_roles:', roleRes.error);
      } else if (roleRes.data && roleRes.data.length > 0) {
        setStaffRoles(roleRes.data);
      }

      // 職員職種割当概要テーブルの取得（staff_role_setting_summaries -> staff_role_summaries -> staff_work_style_summaries の順でフォールバック）
      let summariesRes = await supabase.from('staff_role_setting_summaries').select('*').order('valid_from', { ascending: false });
      if (summariesRes.error) {
        summariesRes = await supabase.from('staff_role_summaries').select('*').order('valid_from', { ascending: false });
        if (summariesRes.error) {
          summariesRes = await supabase.from('staff_work_style_summaries').select('*').order('valid_from', { ascending: false });
        }
      }

      // 職員職種割当詳細テーブルの取得（staff_role_setting_details -> staff_role_details -> staff_work_style_details の順でフォールバック）
      let detailsRes = await supabase.from('staff_role_setting_details').select('*');
      if (detailsRes.error) {
        detailsRes = await supabase.from('staff_role_details').select('*');
        if (detailsRes.error) {
          detailsRes = await supabase.from('staff_work_style_details').select('*');
        }
      }

      const activeStaffs: StaffTableItem[] = staffRes.data || [];
      const assignedOfficeStaffs: OfficeStaffSettingTableItem[] = officeStaffRes.data || [];
      const summaries: StaffWorkStyleSummaryTableItem[] = summariesRes.data || [];
      const details: StaffWorkStyleDetailTableItem[] = detailsRes.data || [];

      // staff_id -> office_staff_settings.id (親ID) のマップを作成
      const staffSettingMap = new Map<string, string>();
      assignedOfficeStaffs.forEach(os => {
        if (os.id) {
          staffSettingMap.set(os.staff_id, os.id);
        }
      });

      // 選択中事業所に割り当てられている職員のみを抽出
      const targetStaffs = activeStaffs.filter(staff => staffSettingMap.has(staff.id));

      // summary_id ごとに staff_roles と 割当時間を集約
      const rolesMap = new Map<string, string[]>();
      const roleHoursMap = new Map<string, Record<string, number | string>>();
      details.forEach(d => {
        if (!rolesMap.has(d.summary_id)) {
          rolesMap.set(d.summary_id, []);
          roleHoursMap.set(d.summary_id, {});
        }
        rolesMap.get(d.summary_id)!.push(d.staff_role);
        if (d.allocated_hours !== undefined && d.allocated_hours !== null) {
          roleHoursMap.get(d.summary_id)![d.staff_role] = Number(d.allocated_hours);
        }
      });

      // 職員ごとに親割当IDに紐づく職種履歴（子）を集約
      const rows: StaffWithWorkStyleSettings[] = targetStaffs.map(staff => {
        const settingId = staffSettingMap.get(staff.id)!;
        const staffSummaries = summaries.filter(s => s.office_staff_setting_id === settingId);

        const settings: StaffWorkStyleSettingRow[] = staffSummaries.map(s => ({
          id: s.id || generateId(),
          office_staff_setting_id: settingId,
          employment_type: s.employment_type || deriveEmploymentType(s.weekly_working_hours),
          duty_type: s.duty_type || 'dedicated',
          weekly_working_hours: s.weekly_working_hours ?? '',
          staff_roles: (s.id ? rolesMap.get(s.id) : []) || [],
          role_allocated_hours: (s.id ? roleHoursMap.get(s.id) : {}) || {},
          valid_from: s.valid_from,
          valid_to: s.valid_to ?? null,
        }));

        return {
          id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
          officeStaffSettingId: settingId,
          settings,
        };
      });

      setData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '職種データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [targetOfficeId, showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubRow = (parentId: string): StaffWorkStyleSettingRow => {
    const parent = data.find(p => p.id === parentId);
    if (!parent || !parent.officeStaffSettingId) {
      throw new Error('対象の職員割当が見つかりません');
    }

    const today = getCurrentJSTDateOnly();

    // 既存履歴の最新開始日を確認
    const existing = parent.settings || [];
    const sortedDesc = [...existing].sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
    let defaultStart = today;
    if (sortedDesc.length > 0 && sortedDesc[0].valid_from >= today) {
      const [y, m, d] = sortedDesc[0].valid_from.split('-').map(Number);
      const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
      defaultStart = nextDate.toISOString().substring(0, 10);
    }

    return {
      id: `NEW-${generateId()}`,
      office_staff_setting_id: parent.officeStaffSettingId,
      employment_type: 'full_time',
      duty_type: 'dedicated',
      weekly_working_hours: 40,
      staff_roles: ['04'],
      role_allocated_hours: { '04': 40 },
      valid_from: defaultStart,
      valid_to: null,
    };
  };

  const handleRecomputeSubItems = (
    subItems: StaffWorkStyleSettingRow[],
    _parent: StaffWithWorkStyleSettings,
    deletedIds?: Set<string> | string[]
  ): StaffWorkStyleSettingRow[] => {
    const recomputed = recomputeHistoryPeriods(subItems, {
      fromKey: 'valid_from',
      toKey: 'valid_to',
      deletedIds,
    });
    return recomputed.sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
  };

  const roleOptions = useMemo(() => {
    if (staffRoles.length > 0) {
      return staffRoles.map(r => ({
        label: r.name,
        value: r.code,
      }));
    }
    return OFFICE_STAFF_ROLE_OPTIONS;
  }, [staffRoles]);

  const roleCodeToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    staffRoles.forEach(r => map.set(r.code, r.id));
    return map;
  }, [staffRoles]);

  const columns: Column<any>[] = useMemo(() => {
    return [
      {
        key: 'code',
        header: TABLE_COLUMNS.STAFF_ID,
        sortable: true,
        sortKey: 'code',
        editable: false,
        rowType: 'main',
        style: { width: '120px' },
      },
      {
        key: 'name',
        header: TABLE_COLUMNS.NAME,
        sortable: true,
        sortKey: 'yomigana',
        editable: false,
        rowType: 'main',
        style: { width: '160px' },
      },
      {
        key: 'employment_type',
        header: TABLE_COLUMNS.EMPLOYMENT_TYPE,
        sortable: false,
        rowType: 'sub',
        editable: false,
        style: { width: '140px', textAlign: 'center' },
        mainRender: (_parentItem, addSubRow) => (
          <Button onClick={addSubRow}>
            ＋ 履歴追加
          </Button>
        ),
        render: (subItem: StaffWorkStyleSettingRow) => {
          const total = calculateTotalAllocatedHours(
            subItem.staff_roles,
            subItem.role_allocated_hours,
            subItem.weekly_working_hours
          );
          return formatEmploymentType(total > 0 ? total : subItem.weekly_working_hours);
        },
      },
      {
        key: 'duty_type',
        header: TABLE_COLUMNS.DUTY_TYPE,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'select',
        options: DUTY_TYPE_OPTIONS,
        style: { width: '120px' },
      },
      {
        key: 'weekly_working_hours',
        header: TABLE_COLUMNS.WEEKLY_WORKING_HOURS,
        sortable: false,
        rowType: 'sub',
        editable: false, // 職種別割当時間から自動算出のため入力不可
        className: 'quantity',
        style: { width: '130px', textAlign: 'right' },
        render: (subItem: StaffWorkStyleSettingRow) => {
          const total = calculateTotalAllocatedHours(
            subItem.staff_roles,
            subItem.role_allocated_hours,
            subItem.weekly_working_hours
          );
          if (total <= 0) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          return <span style={{ fontWeight: 'bold' }}>{total}h</span>;
        },
      },
      {
        key: 'staff_roles',
        header: TABLE_COLUMNS.STAFF_ROLE,
        sortable: false,
        rowType: 'sub',
        editable: true,
        style: { minWidth: '260px' },
        onCellChange: (newRoles: string[], item: StaffWorkStyleSettingRow) => {
          const roles = newRoles || [];
          const currentHours = { ...(item.role_allocated_hours || {}) };

          if (roles.length === 1) {
            const baseHours = item.weekly_working_hours ? Number(item.weekly_working_hours) : 40;
            currentHours[roles[0]] = currentHours[roles[0]] || baseHours;
          } else {
            roles.forEach(r => {
              if (currentHours[r] === undefined) {
                currentHours[r] = 0;
              }
            });
          }

          Object.keys(currentHours).forEach(k => {
            if (!roles.includes(k)) {
              delete currentHours[k];
            }
          });

          const total = calculateTotalAllocatedHours(roles, currentHours, item.weekly_working_hours);
          return {
            role_allocated_hours: currentHours,
            weekly_working_hours: total,
            employment_type: deriveEmploymentType(total),
          } as Partial<StaffWorkStyleSettingRow>;
        },
        customEditRender: (value: string[], _subItem: StaffWorkStyleSettingRow, onChange: (newVal: string[]) => void) => {
          return (
            <MultiSelectDropdown
              options={roleOptions}
              value={value || []}
              onChange={onChange}
              placeholder="職種を選択"
            />
          );
        },
        render: (subItem: StaffWorkStyleSettingRow) => {
          const selected = (subItem.staff_roles || [])
            .map(roleVal => roleOptions.find(opt => opt.value === roleVal)?.label || roleVal)
            .filter(Boolean);

          if (selected.length === 0) {
            return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          }

          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {selected.map((name, i) => (
                <span
                  key={i}
                  style={{
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '0 8px',
                    fontSize: 'var(--text-caption)',
                    lineHeight: '18px',
                    display: 'inline-block',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        key: 'role_allocated_hours',
        header: TABLE_COLUMNS.ALLOCATED_HOURS || '職種別割当時間(h)',
        sortable: false,
        rowType: 'sub',
        editable: true,
        style: { minWidth: '220px' },
        onCellChange: (newMap: Record<string, number | string>, item: StaffWorkStyleSettingRow) => {
          const total = calculateTotalAllocatedHours(item.staff_roles, newMap, item.weekly_working_hours);
          return {
            weekly_working_hours: total,
            employment_type: deriveEmploymentType(total),
          } as Partial<StaffWorkStyleSettingRow>;
        },
        customEditRender: (
          value: Record<string, number | string> | undefined,
          subItem: StaffWorkStyleSettingRow,
          onChange: (newVal: Record<string, number | string>) => void
        ) => {
          const selectedRoles = subItem.staff_roles || [];
          if (selectedRoles.length === 0) {
            return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          }
          const currentHours = value || subItem.role_allocated_hours || {};

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {selectedRoles.map(roleCode => {
                const roleName = roleOptions.find(opt => opt.value === roleCode)?.label || roleCode;
                const hVal = currentHours[roleCode] !== undefined
                  ? currentHours[roleCode]
                  : (selectedRoles.length === 1 && subItem.weekly_working_hours ? subItem.weekly_working_hours : '');

                return (
                  <div key={roleCode} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', minWidth: '80px', color: 'var(--color-text-muted)' }}>
                      {roleName}:
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="168"
                      value={hVal}
                      onChange={(e) => {
                        const newMap = { ...currentHours, [roleCode]: e.target.value === '' ? '' : Number(e.target.value) };
                        onChange(newMap);
                      }}
                      style={{
                        width: '65px',
                        padding: '2px 6px',
                        fontSize: '12px',
                        textAlign: 'right',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>h</span>
                  </div>
                );
              })}
            </div>
          );
        },
        render: (subItem: StaffWorkStyleSettingRow) => {
          const selectedRoles = subItem.staff_roles || [];
          if (selectedRoles.length === 0) {
            return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          }
          const currentHours = subItem.role_allocated_hours || {};
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedRoles.map(roleCode => {
                const roleName = roleOptions.find(opt => opt.value === roleCode)?.label || roleCode;
                const hVal = currentHours[roleCode] !== undefined
                  ? currentHours[roleCode]
                  : (selectedRoles.length === 1 && subItem.weekly_working_hours ? subItem.weekly_working_hours : '-');
                return (
                  <span
                    key={roleCode}
                    style={{
                      fontSize: '11px',
                      background: 'var(--color-bg-subtle)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {roleName}: <strong>{hVal}</strong>h
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        key: 'valid_from',
        header: TABLE_COLUMNS.VALID_PERIOD_FROM,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'date',
        style: { width: '150px' },
      },
      {
        key: 'valid_to',
        header: TABLE_COLUMNS.VALID_PERIOD_TO,
        sortable: false,
        rowType: 'sub',
        editable: false,
        inputType: 'date',
        style: { width: '150px' },
      },
    ];
  }, [roleOptions]);

  const handleBatchSave = async (drafts: StaffWithWorkStyleSettings[], deletedIds: string[]) => {
    if (!targetOfficeId) {
      throw new Error('事業所を選択してください');
    }

    try {
      // 保存先テーブルの特定（フォールバック対応）
      let summaryTable = 'staff_role_setting_summaries';
      let detailTable = 'staff_role_setting_details';
      const checkRes = await supabase.from('staff_role_setting_summaries').select('id').limit(1);
      if (checkRes.error) {
        const checkRes2 = await supabase.from('staff_role_summaries').select('id').limit(1);
        if (!checkRes2.error) {
          summaryTable = 'staff_role_summaries';
          detailTable = 'staff_role_details';
        } else {
          summaryTable = 'staff_work_style_summaries';
          detailTable = 'staff_work_style_details';
        }
      }

      // 1. 削除処理
      const realDeletedIds = deletedIds.filter(id => !id.startsWith('NEW-') && id.includes('-'));
      if (realDeletedIds.length > 0) {
        await supabase
          .from(detailTable)
          .delete()
          .in('summary_id', realDeletedIds);

        await supabase
          .from(summaryTable)
          .delete()
          .in('id', realDeletedIds);
      }

      // 2. 有効な履歴の保存処理
      for (const staff of drafts) {
        if (!staff.settings || staff.settings.length === 0) continue;

        const computedSettings = handleRecomputeSubItems(staff.settings, staff, deletedIds);

        for (const setting of computedSettings) {
          if (deletedIds.includes(setting.id)) continue;
          if (!setting.valid_from) {
            throw new Error(`${staff.name}の適用開始日を入力してください`);
          }

          const summaryId = setting.id.startsWith('NEW-') ? generateId() : setting.id;
          const validToVal = setting.valid_to ? setting.valid_to : null;

          // 職種別割当時間から週所定労働時間を自動算出
          const autoWeeklyHours = calculateTotalAllocatedHours(
            setting.staff_roles,
            setting.role_allocated_hours,
            setting.weekly_working_hours
          );
          const weeklyHours = autoWeeklyHours > 0 ? autoWeeklyHours : (setting.weekly_working_hours !== '' ? Number(setting.weekly_working_hours) : null);
          const employmentTypeVal = deriveEmploymentType(weeklyHours);

          // 2a. 概要テーブル (子) のUpsert (親の office_staff_setting_id を参照)
          const { error: summaryErr } = await supabase
            .from(summaryTable)
            .upsert({
              id: summaryId,
              office_staff_setting_id: setting.office_staff_setting_id || staff.officeStaffSettingId,
              employment_type: employmentTypeVal,
              duty_type: setting.duty_type || 'dedicated',
              weekly_working_hours: weeklyHours,
              valid_from: setting.valid_from,
              valid_to: validToVal,
            });

          if (summaryErr) throw summaryErr;

          // 2b. 詳細テーブル (孫) の同期
          await supabase
            .from(detailTable)
            .delete()
            .eq('summary_id', summaryId);

          if (setting.staff_roles && setting.staff_roles.length > 0) {
            const detailRows = setting.staff_roles.map(role => {
              const customHours = setting.role_allocated_hours?.[role];
              const allocatedHoursVal = (customHours !== undefined && customHours !== '' && customHours !== null)
                ? Number(customHours)
                : (setting.staff_roles.length === 1 && weeklyHours ? weeklyHours : null);

              return {
                id: generateId(),
                summary_id: summaryId,
                staff_role: role,
                staff_role_id: roleCodeToIdMap.get(role) || null,
                allocated_hours: allocatedHoursVal,
              };
            });

            const { error: insDetailsErr } = await supabase
              .from(detailTable)
              .insert(detailRows);

            if (insDetailsErr) {
              // staff_role_id / allocated_hours カラム未適用の環境用フォールバック
              const fallbackRows = setting.staff_roles.map(role => ({
                id: generateId(),
                summary_id: summaryId,
                staff_role: role,
              }));
              const { error: retryErr } = await supabase
                .from(detailTable)
                .insert(fallbackRows);
              if (retryErr) throw retryErr;
            }
          }
        }
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '職種データの保存に失敗しました', 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="職種"
      data={data}
      columns={columns}
      emptyMessage={
        !targetOfficeId
          ? 'サイドバー上部で事業所を選択してください。'
          : `選択された事業所（${currentOffice?.short_name || currentOffice?.name || ''}）に勤務する職員が登録されていません。「事業所」タブで職員の割当を行ってください。`
      }
      subItemsKey="settings"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={handleRecomputeSubItems}
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}

export const StaffRolePage = StaffWorkStylePage;
