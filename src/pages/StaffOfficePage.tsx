import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, MultiSelectDropdown, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import {
  MESSAGES,
  TABLE_COLUMNS,
  DUTY_TYPE_OPTIONS,
  OFFICE_STAFF_ROLE_OPTIONS,
} from '../constants';
import { getCurrentJSTDateOnly, recomputeHistoryPeriods } from '../utils';
import type { OfficeTableItem, StaffTableItem } from '../types/db';

export type StaffOfficeSettingRow = {
  id: string; // summary_id (UUID or NEW-xxx)
  office_id: string;
  staff_id: string;
  employment_type: string;
  duty_type: string;
  weekly_working_hours: number | string;
  staff_roles: string[];
  valid_from: string;
  valid_to: string | null;
};

export type StaffWithOfficeSettings = {
  id: string; // staff_id
  code: string;
  name: string;
  yomigana: string;
  settings: StaffOfficeSettingRow[];
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

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
};

export function StaffOfficePage() {
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const [data, setData] = useState<StaffWithOfficeSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffRes, officeRes, summariesRes, detailsRes] = await Promise.all([
        supabase.from('staffs').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('office_staff_setting_summaries').select('*').order('valid_from', { ascending: false }),
        supabase.from('office_staff_setting_details').select('*'),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (officeRes.error) throw officeRes.error;
      if (summariesRes.error) throw summariesRes.error;
      if (detailsRes.error) throw detailsRes.error;

      const activeStaffs: StaffTableItem[] = staffRes.data || [];
      const activeOffices: OfficeTableItem[] = officeRes.data || [];
      const summaries: any[] = summariesRes.data || [];
      const details: any[] = detailsRes.data || [];

      setOffices(activeOffices);

      // summary_id ごとに staff_roles を集約
      const rolesMap = new Map<string, string[]>();
      details.forEach(d => {
        if (!rolesMap.has(d.summary_id)) {
          rolesMap.set(d.summary_id, []);
        }
        rolesMap.get(d.summary_id)!.push(d.staff_role);
      });

      // 職員ごとに settings を集約
      const rows: StaffWithOfficeSettings[] = activeStaffs.map(staff => {
        const staffSummaries = summaries.filter(s => s.staff_id === staff.id);
        const settings: StaffOfficeSettingRow[] = staffSummaries.map(s => ({
          id: s.id,
          office_id: s.office_id,
          staff_id: s.staff_id,
          employment_type: s.employment_type || deriveEmploymentType(s.weekly_working_hours),
          duty_type: s.duty_type || 'dedicated',
          weekly_working_hours: s.weekly_working_hours ?? '',
          staff_roles: rolesMap.get(s.id) || [],
          valid_from: s.valid_from,
          valid_to: s.valid_to,
        }));

        return {
          id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
          settings,
        };
      });

      setData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所割当データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubRow = (parentId: string): StaffOfficeSettingRow => {
    const parent = data.find(p => p.id === parentId);
    if (!parent) {
      throw new Error('対象の職員が見つかりません');
    }

    const defaultOfficeId = offices[0]?.id || '';
    const today = getCurrentJSTDateOnly();

    // 既存履歴の最新開始日を確認
    const existing = parent.settings?.filter(s => s.office_id === defaultOfficeId) || [];
    const sortedDesc = [...existing].sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
    let defaultStart = today;
    if (sortedDesc.length > 0 && sortedDesc[0].valid_from >= today) {
      const [y, m, d] = sortedDesc[0].valid_from.split('-').map(Number);
      const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
      defaultStart = nextDate.toISOString().substring(0, 10);
    }

    return {
      id: `NEW-${generateId()}`,
      office_id: defaultOfficeId,
      staff_id: parent.id,
      employment_type: 'full_time',
      duty_type: 'dedicated',
      weekly_working_hours: 40,
      staff_roles: ['life_supporter'],
      valid_from: defaultStart,
      valid_to: null,
    };
  };

  const handleRecomputeSubItems = (
    subItems: StaffOfficeSettingRow[],
    _parent: StaffWithOfficeSettings,
    deletedIds?: Set<string> | string[]
  ): StaffOfficeSettingRow[] => {
    // office_id ごとにグループ化して期間を連動計算
    const officeGroups: Record<string, StaffOfficeSettingRow[]> = {};
    subItems.forEach(item => {
      const oId = item.office_id || 'unknown';
      if (!officeGroups[oId]) officeGroups[oId] = [];
      officeGroups[oId].push(item);
    });

    const allRecomputed: StaffOfficeSettingRow[] = [];
    Object.values(officeGroups).forEach(group => {
      const recomputed = recomputeHistoryPeriods(group, {
        fromKey: 'valid_from',
        toKey: 'valid_to',
        deletedIds,
      });
      allRecomputed.push(...recomputed);
    });

    return allRecomputed.sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
  };

  const officeOptions = useMemo(() => {
    return offices.map(o => ({
      value: o.id,
      label: o.short_name || o.name,
    }));
  }, [offices]);

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
        style: { width: '140px' },
      },
      {
        key: 'office_id',
        header: TABLE_COLUMNS.OFFICE,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'select',
        options: officeOptions,
        style: { minWidth: '220px' },
        mainRender: (_parentItem, addSubRow) => (
          <Button onClick={addSubRow}>
            ＋ 事業所追加
          </Button>
        ),
        render: (subItem: StaffOfficeSettingRow) => {
          const office = offices.find(o => o.id === subItem.office_id);
          return office ? (office.short_name || office.name) : '-';
        },
      },
      {
        key: 'employment_type',
        header: TABLE_COLUMNS.EMPLOYMENT_TYPE,
        sortable: false,
        rowType: 'sub',
        editable: false,
        style: { width: '100px', textAlign: 'center' },
        render: (subItem: StaffOfficeSettingRow) => {
          return formatEmploymentType(subItem.weekly_working_hours);
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
        style: { width: '110px' },
      },
      {
        key: 'weekly_working_hours',
        header: TABLE_COLUMNS.WEEKLY_WORKING_HOURS,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'number',
        className: 'quantity',
        style: { width: '130px', textAlign: 'right' },
        onCellChange: (newVal: unknown) => {
          const hours = Number(newVal);
          return {
            employment_type: deriveEmploymentType(hours),
          } as Partial<StaffOfficeSettingRow>;
        },
      },
      {
        key: 'staff_roles',
        header: TABLE_COLUMNS.STAFF_ROLE,
        sortable: false,
        rowType: 'sub',
        editable: true,
        style: { minWidth: '260px' },
        customEditRender: (value: string[], _subItem: StaffOfficeSettingRow, onChange: (newVal: string[]) => void) => {
          return (
            <MultiSelectDropdown
              options={OFFICE_STAFF_ROLE_OPTIONS}
              value={value || []}
              onChange={onChange}
              placeholder="配置職種を選択"
            />
          );
        },
        render: (subItem: StaffOfficeSettingRow) => {
          const selected = (subItem.staff_roles || [])
            .map(roleVal => OFFICE_STAFF_ROLE_OPTIONS.find(opt => opt.value === roleVal)?.label)
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
  }, [offices, officeOptions]);

  const handleBatchSave = async (drafts: StaffWithOfficeSettings[], deletedIds: string[]) => {
    try {
      // 1. 削除処理
      const realDeletedIds = deletedIds.filter(id => !id.startsWith('NEW-') && id.includes('-'));
      if (realDeletedIds.length > 0) {
        await supabase
          .from('office_staff_setting_details')
          .delete()
          .in('summary_id', realDeletedIds);

        await supabase
          .from('office_staff_setting_summaries')
          .delete()
          .in('id', realDeletedIds);
      }

      // 2. 有効な履歴の保存処理
      for (const staff of drafts) {
        if (!staff.settings || staff.settings.length === 0) continue;

        // 同一事業所ごとに期間連動計算
        const computedSettings = handleRecomputeSubItems(staff.settings, staff, deletedIds);

        for (const setting of computedSettings) {
          if (deletedIds.includes(setting.id)) continue;
          if (!setting.office_id) {
            throw new Error(`${staff.name}の事業所を選択してください`);
          }
          if (!setting.valid_from) {
            throw new Error(`${staff.name}の適用開始日を入力してください`);
          }

          const summaryId = setting.id.startsWith('NEW-') ? generateId() : setting.id;
          const validToVal = setting.valid_to ? setting.valid_to : null;
          const weeklyHours = setting.weekly_working_hours !== '' ? Number(setting.weekly_working_hours) : null;
          const employmentTypeVal = deriveEmploymentType(weeklyHours);

          // 2a. 概要テーブルのUpsert
          const { error: summaryErr } = await supabase
            .from('office_staff_setting_summaries')
            .upsert({
              id: summaryId,
              office_id: setting.office_id,
              staff_id: staff.id,
              employment_type: employmentTypeVal,
              duty_type: setting.duty_type || 'dedicated',
              weekly_working_hours: weeklyHours,
              valid_from: setting.valid_from,
              valid_to: validToVal,
            });

          if (summaryErr) throw summaryErr;

          // 2b. 詳細テーブルの同期
          await supabase
            .from('office_staff_setting_details')
            .delete()
            .eq('summary_id', summaryId);

          if (setting.staff_roles && setting.staff_roles.length > 0) {
            const detailRows = setting.staff_roles.map(role => ({
              id: generateId(),
              summary_id: summaryId,
              staff_role: role,
            }));

            const { error: insDetailsErr } = await supabase
              .from('office_staff_setting_details')
              .insert(detailRows);

            if (insDetailsErr) throw insDetailsErr;
          }
        }
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所職員割当データの保存に失敗しました', 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="事業所割当"
      data={data}
      columns={columns}
      emptyMessage="職員が登録されていません。"
      subItemsKey="settings"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={handleRecomputeSubItems}
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
