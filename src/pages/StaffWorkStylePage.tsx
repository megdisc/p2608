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
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const currentOffice = useMemo(() => {
    return offices.find(o => o.id === selectedOfficeId) || null;
  }, [offices, selectedOfficeId]);

  const fetchData = useCallback(async () => {
    if (!selectedOfficeId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 1. 親テーブル (office_staff_settings) から選択中の事業所に所属する割当を取得
      const [staffRes, officeStaffRes, summariesRes, detailsRes] = await Promise.all([
        supabase.from('staffs').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('office_staff_settings').select('*').eq('office_id', selectedOfficeId),
        supabase.from('staff_work_style_summaries').select('*').order('valid_from', { ascending: false }),
        supabase.from('staff_work_style_details').select('*'),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (officeStaffRes.error) throw officeStaffRes.error;
      if (summariesRes.error) throw summariesRes.error;
      if (detailsRes.error) throw detailsRes.error;

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

      // summary_id ごとに staff_roles を集約
      const rolesMap = new Map<string, string[]>();
      details.forEach(d => {
        if (!rolesMap.has(d.summary_id)) {
          rolesMap.set(d.summary_id, []);
        }
        rolesMap.get(d.summary_id)!.push(d.staff_role);
      });

      // 職員ごとに親割当IDに紐づく勤務形態履歴（子）を集約
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
      showAlert(err instanceof Error ? err.message : '勤務形態データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedOfficeId, showAlert]);

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
      staff_roles: ['life_supporter'],
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
        style: { width: '120px' },
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
          } as Partial<StaffWorkStyleSettingRow>;
        },
      },
      {
        key: 'staff_roles',
        header: TABLE_COLUMNS.STAFF_ROLE,
        sortable: false,
        rowType: 'sub',
        editable: true,
        style: { minWidth: '260px' },
        customEditRender: (value: string[], _subItem: StaffWorkStyleSettingRow, onChange: (newVal: string[]) => void) => {
          return (
            <MultiSelectDropdown
              options={OFFICE_STAFF_ROLE_OPTIONS}
              value={value || []}
              onChange={onChange}
              placeholder="配置職種を選択"
            />
          );
        },
        render: (subItem: StaffWorkStyleSettingRow) => {
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
  }, []);

  const handleBatchSave = async (drafts: StaffWithWorkStyleSettings[], deletedIds: string[]) => {
    if (!selectedOfficeId) {
      throw new Error('事業所を選択してください');
    }

    try {
      // 1. 削除処理
      const realDeletedIds = deletedIds.filter(id => !id.startsWith('NEW-') && id.includes('-'));
      if (realDeletedIds.length > 0) {
        await supabase
          .from('staff_work_style_details')
          .delete()
          .in('summary_id', realDeletedIds);

        await supabase
          .from('staff_work_style_summaries')
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
          const weeklyHours = setting.weekly_working_hours !== '' ? Number(setting.weekly_working_hours) : null;
          const employmentTypeVal = deriveEmploymentType(weeklyHours);

          // 2a. 概要テーブル (子) のUpsert (親の office_staff_setting_id を参照)
          const { error: summaryErr } = await supabase
            .from('staff_work_style_summaries')
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
            .from('staff_work_style_details')
            .delete()
            .eq('summary_id', summaryId);

          if (setting.staff_roles && setting.staff_roles.length > 0) {
            const detailRows = setting.staff_roles.map(role => ({
              id: generateId(),
              summary_id: summaryId,
              staff_role: role,
            }));

            const { error: insDetailsErr } = await supabase
              .from('staff_work_style_details')
              .insert(detailRows);

            if (insDetailsErr) throw insDetailsErr;
          }
        }
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '勤務形態データの保存に失敗しました', 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="勤務形態"
      data={data}
      columns={columns}
      emptyMessage={
        !selectedOfficeId
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
