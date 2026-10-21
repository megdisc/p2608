import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, MultiSelectDropdown, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, MESSAGES } from '../constants';
import { getCurrentJSTDateOnly } from '../utils';
import type { OfficeTableItem, ServiceTypeTableItem, OfficeServiceTypeSettingTableItem } from '../types/db';

export type OfficeRewardRow = {
  id: string; // summary_id (UUID or NEW-xxx)
  office_id: string;
  office_name?: string;
  service_type_id: string;
  service_type_name?: string;
  rewardItemIds: string[];
  valid_from: string;
  valid_to: string | null;
};

type RewardItemMinimal = {
  id: string;
  service_type_id: string;
  code: string;
  name: string;
  item_category: string;
};

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
};

export function OfficeRewardPage() {
  const [data, setData] = useState<OfficeRewardRow[]>([]);
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeTableItem[]>([]);
  const [rewardItems, setRewardItems] = useState<RewardItemMinimal[]>([]);
  const [officeSettings, setOfficeSettings] = useState<OfficeServiceTypeSettingTableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { showAlert } = useAlert();
  const { selectedOfficeId } = useOffice();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        summariesRes,
        detailsRes,
        officesRes,
        serviceTypesRes,
        rewardItemsRes,
        officeSettingsRes
      ] = await Promise.all([
        supabase.from('office_reward_summaries').select('*').order('valid_from', { ascending: false }),
        supabase.from('office_reward_details').select('*'),
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('service_types').select('*').order('code', { ascending: true }),
        supabase.from('reward_items').select('*').order('code', { ascending: true }),
        supabase.from('office_service_type_settings').select('*').eq('is_deleted', false),
      ]);

      if (summariesRes.error) throw summariesRes.error;
      if (detailsRes.error) throw detailsRes.error;
      if (officesRes.error) throw officesRes.error;
      if (serviceTypesRes.error) throw serviceTypesRes.error;
      if (rewardItemsRes.error) throw rewardItemsRes.error;
      if (officeSettingsRes.error) throw officeSettingsRes.error;

      const loadedOffices: OfficeTableItem[] = officesRes.data || [];
      const loadedSTs: ServiceTypeTableItem[] = serviceTypesRes.data || [];
      const loadedRewardItems: RewardItemMinimal[] = (rewardItemsRes.data || []).map((ri: any) => ({
        id: ri.id,
        service_type_id: ri.service_type_id,
        code: ri.code || '',
        name: ri.name || '',
        item_category: ri.item_category || 'addition',
      }));
      const loadedSettings: OfficeServiceTypeSettingTableItem[] = officeSettingsRes.data || [];
      const details = detailsRes.data || [];

      setOffices(loadedOffices);
      setServiceTypes(loadedSTs);
      setRewardItems(loadedRewardItems);
      setOfficeSettings(loadedSettings);

      const rows: OfficeRewardRow[] = (summariesRes.data || []).map((s: any) => {
        const matchingDetails = details.filter((d: any) => d.summary_id === s.id);
        const rewardItemIds = matchingDetails.map((d: any) => d.reward_item_id);

        let serviceTypeId = s.service_type_id;
        if (!serviceTypeId) {
          // Fallback: derive from existing details' reward items
          for (const d of matchingDetails) {
            const ri = loadedRewardItems.find(item => item.id === d.reward_item_id);
            if (ri?.service_type_id) {
              serviceTypeId = ri.service_type_id;
              break;
            }
          }
        }
        if (!serviceTypeId) {
          // Fallback: derive from office_service_type_settings
          const ost = loadedSettings.find(st => st.office_id === s.office_id);
          if (ost?.service_type_id) {
            serviceTypeId = ost.service_type_id;
          }
        }
        if (!serviceTypeId && loadedSTs.length > 0) {
          serviceTypeId = loadedSTs[0].id;
        }

        const office = loadedOffices.find(o => o.id === s.office_id);
        const st = loadedSTs.find(t => t.id === serviceTypeId);

        return {
          id: s.id,
          office_id: s.office_id,
          office_name: office ? (office.short_name || office.name) : '',
          service_type_id: serviceTypeId || '',
          service_type_name: st ? st.name : '',
          rewardItemIds,
          valid_from: s.valid_from || getCurrentJSTDateOnly(),
          valid_to: s.valid_to || null,
        };
      });

      setData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所加算・減算データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddRow = (): OfficeRewardRow => {
    // Determine default office
    const defaultOfficeId = (selectedOfficeId && offices.some(o => o.id === selectedOfficeId))
      ? selectedOfficeId
      : (offices[0]?.id || '');

    // Determine default service type for this office
    const officeSetting = officeSettings.find(s => s.office_id === defaultOfficeId);
    const defaultServiceTypeId = officeSetting?.service_type_id || serviceTypes[0]?.id || '';

    const defaultOffice = offices.find(o => o.id === defaultOfficeId);
    const defaultST = serviceTypes.find(t => t.id === defaultServiceTypeId);

    return {
      id: `NEW-${generateId()}`,
      office_id: defaultOfficeId,
      office_name: defaultOffice ? (defaultOffice.short_name || defaultOffice.name) : '',
      service_type_id: defaultServiceTypeId,
      service_type_name: defaultST ? defaultST.name : '',
      rewardItemIds: [],
      valid_from: getCurrentJSTDateOnly(),
      valid_to: null,
    };
  };

  const columns: Column<OfficeRewardRow>[] = useMemo(() => {
    const officeOptions = offices.map(o => ({
      value: o.id,
      label: o.short_name || o.name,
    }));

    const serviceTypeOptions = serviceTypes
      .filter(st => rewardItems.some(ri => ri.service_type_id === st.id))
      .map(st => ({
        value: st.id,
        label: st.name,
      }));

    return [
      {
        key: 'office_id',
        header: TABLE_COLUMNS.OFFICE,
        sortable: true,
        sortKey: 'office_name',
        inputType: 'select',
        options: officeOptions,
        style: { minWidth: '180px' },
        onCellChange: (newOfficeId: string, row: OfficeRewardRow) => {
          const setting = officeSettings.find(s => s.office_id === newOfficeId);
          const newStId = setting ? setting.service_type_id : row.service_type_id;
          const office = offices.find(o => o.id === newOfficeId);
          const st = serviceTypes.find(t => t.id === newStId);

          const validRewardItemIds = (row.rewardItemIds || []).filter(itemId => {
            const item = rewardItems.find(ri => ri.id === itemId);
            return item && item.service_type_id === newStId;
          });

          return {
            office_name: office ? (office.short_name || office.name) : '',
            service_type_id: newStId,
            service_type_name: st ? st.name : '',
            rewardItemIds: validRewardItemIds,
          };
        },
        render: (row: OfficeRewardRow) => {
          const o = offices.find(off => off.id === row.office_id);
          return o ? (o.short_name || o.name) : '';
        },
      },
      {
        key: 'service_type_id',
        header: TABLE_COLUMNS.SERVICE_TYPE,
        sortable: true,
        sortKey: 'service_type_name',
        inputType: 'select',
        options: (row: OfficeRewardRow) => {
          const officeSTIds = officeSettings
            .filter(s => s.office_id === row.office_id)
            .map(s => s.service_type_id);

          return [...serviceTypeOptions].sort((a, b) => {
            const aIsOffice = officeSTIds.includes(a.value);
            const bIsOffice = officeSTIds.includes(b.value);
            if (aIsOffice && !bIsOffice) return -1;
            if (!aIsOffice && bIsOffice) return 1;
            return 0;
          });
        },
        style: { minWidth: '160px' },
        onCellChange: (newStId: string, row: OfficeRewardRow) => {
          const st = serviceTypes.find(t => t.id === newStId);
          const validRewardItemIds = (row.rewardItemIds || []).filter(itemId => {
            const item = rewardItems.find(ri => ri.id === itemId);
            return item && item.service_type_id === newStId;
          });

          return {
            service_type_name: st ? st.name : '',
            rewardItemIds: validRewardItemIds,
          };
        },
        render: (row: OfficeRewardRow) => {
          const st = serviceTypes.find(s => s.id === row.service_type_id);
          return st ? st.name : '';
        },
      },
      {
        key: 'rewardItemIds',
        header: TABLE_COLUMNS.REWARD_ITEM,
        sortable: false,
        editable: true,
        style: { minWidth: '340px' },
        customEditRender: (value: string[], row: OfficeRewardRow, onChange: (newVal: string[]) => void) => {
          const availableItems = rewardItems.filter(
            ri => ri.service_type_id === row.service_type_id && ri.item_category !== 'base_reward'
          );
          const options = availableItems.map(ri => ({
            value: ri.id,
            label: ri.name,
          }));

          return (
            <MultiSelectDropdown
              options={options}
              value={value || []}
              onChange={onChange}
              placeholder={row.service_type_id ? '加算・減算項目を選択' : '支援種別を先に選択してください'}
            />
          );
        },
        render: (row: OfficeRewardRow) => {
          const selected = (row.rewardItemIds || [])
            .map(id => rewardItems.find(ri => ri.id === id)?.name)
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
        header: '開始日',
        groupHeader: '有効期間',
        sortable: true,
        inputType: 'date',
        style: { width: '130px' },
      },
      {
        key: 'valid_to',
        header: '終了日',
        groupHeader: '有効期間',
        sortable: false,
        inputType: 'date',
        style: { width: '130px' },
        render: (row: OfficeRewardRow) =>
          row.valid_to ? (
            row.valid_to
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>- (継続中)</span>
          ),
      },
    ];
  }, [offices, serviceTypes, rewardItems, officeSettings]);

  const handleBatchSave = async (drafts: OfficeRewardRow[], deletedIds: string[]) => {
    try {
      // 1. 削除処理
      const realDeletedIds = deletedIds.filter(id => !id.startsWith('NEW-'));
      if (realDeletedIds.length > 0) {
        // Foreign key constraint cascade deletes details, but explicit delete is safe
        const { error: delDetailsErr } = await supabase
          .from('office_reward_details')
          .delete()
          .in('summary_id', realDeletedIds);
        if (delDetailsErr) throw delDetailsErr;

        const { error: delSummaryErr } = await supabase
          .from('office_reward_summaries')
          .delete()
          .in('id', realDeletedIds);
        if (delSummaryErr) throw delSummaryErr;
      }

      // 2. 有効な行の保存処理
      const activeRows = drafts.filter(r => !deletedIds.includes(r.id));

      for (const row of activeRows) {
        if (!row.office_id) {
          throw new Error('事業所を選択してください');
        }
        if (!row.service_type_id) {
          throw new Error('支援種別を選択してください');
        }
        if (!row.valid_from) {
          throw new Error('開始日を入力してください');
        }
        if (row.valid_to && row.valid_to < row.valid_from) {
          throw new Error('終了日は開始日以降の日付を指定してください');
        }

        const summaryId = row.id.startsWith('NEW-') ? generateId() : row.id;

        // 2a. 概要テーブルのUpsert（valid_from, valid_to）
        const summaryData = {
          id: summaryId,
          office_id: row.office_id,
          service_type_id: row.service_type_id,
          valid_from: row.valid_from,
          valid_to: row.valid_to ? String(row.valid_to).trim() : null,
          updated_at: new Date().toISOString(),
        };

        const { error: summaryErr } = await supabase
          .from('office_reward_summaries')
          .upsert(summaryData);
        if (summaryErr) throw summaryErr;

        // 2b. 詳細テーブルの同期（既存詳細を一旦クリアして新規作成）
        const { error: clearErr } = await supabase
          .from('office_reward_details')
          .delete()
          .eq('summary_id', summaryId);
        if (clearErr) throw clearErr;

        if (row.rewardItemIds && row.rewardItemIds.length > 0) {
          const detailInserts = row.rewardItemIds.map(itemId => ({
            id: generateId(),
            summary_id: summaryId,
            reward_item_id: itemId,
            updated_at: new Date().toISOString(),
          }));

          const { error: insertErr } = await supabase
            .from('office_reward_details')
            .insert(detailInserts);
          if (insertErr) throw insertErr;
        }
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="事業所加算・減算設定"
      data={data}
      columns={columns}
      emptyMessage="登録されている事業所加算・減算設定がありません"
      initialSort={{ key: 'office_id', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAddRow}
      hideHeader={true}
      canDeleteRow={() => true}
    />
  );
}
