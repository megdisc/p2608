import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, MultiSelectDropdown, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, MESSAGES } from '../constants';
import { getCurrentJSTDateOnly, recomputeHistoryPeriods } from '../utils';
import type { OfficeTableItem, ServiceTypeTableItem, OfficeServiceTypeSettingTableItem } from '../types/db';

export type OfficeRewardHistoryItem = {
  id: string; // summary_id (UUID or NEW-xxx)
  office_id: string;
  service_type_id: string;
  rewardItemIds: string[];
  valid_from: string;
  valid_to: string | null;
};

export type OfficeServiceTypeRewardGroup = {
  id: string; // composite key: `${office_id}__${service_type_id}`
  office_id: string;
  office_code: string;
  office_name: string;
  service_type_id: string;
  service_type_code: string;
  service_type_name: string;
  rewards: OfficeRewardHistoryItem[];
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
  const [data, setData] = useState<OfficeServiceTypeRewardGroup[]>([]);
  const [rewardItems, setRewardItems] = useState<RewardItemMinimal[]>([]);
  const [loading, setLoading] = useState(true);

  const { showAlert } = useAlert();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        summariesRes,
        detailsRes,
        officesRes,
        serviceTypesRes,
        rewardItemsRes,
        officeSettingsRes,
      ] = await Promise.all([
        supabase.from('office_reward_setting_summaries').select('*').order('valid_from', { ascending: false }),
        supabase.from('office_reward_setting_details').select('*'),
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
      const summaries = summariesRes.data || [];
      const details = detailsRes.data || [];

      setRewardItems(loadedRewardItems);

      // 事業所×支援種別のペア一覧を構成
      const groupMap = new Map<string, OfficeServiceTypeRewardGroup>();

      // 1. office_service_type_settings から登録済みの事業所・支援種別を網羅
      loadedSettings.forEach(setting => {
        const office = loadedOffices.find(o => o.id === setting.office_id);
        const st = loadedSTs.find(t => t.id === setting.service_type_id);
        if (office && st) {
          const groupId = `${office.id}__${st.id}`;
          if (!groupMap.has(groupId)) {
            groupMap.set(groupId, {
              id: groupId,
              office_id: office.id,
              office_code: office.code || '',
              office_name: office.short_name || office.name,
              service_type_id: st.id,
              service_type_code: st.code || '',
              service_type_name: st.name,
              rewards: [],
            });
          }
        }
      });

      // 2. 既存の office_reward_setting_summaries にあるペアも確実に含める
      summaries.forEach((s: any) => {
        if (!s.office_id || !s.service_type_id) return;
        const groupId = `${s.office_id}__${s.service_type_id}`;
        if (!groupMap.has(groupId)) {
          const office = loadedOffices.find(o => o.id === s.office_id);
          const st = loadedSTs.find(t => t.id === s.service_type_id);
          groupMap.set(groupId, {
            id: groupId,
            office_id: s.office_id,
            office_code: office?.code || '',
            office_name: office ? (office.short_name || office.name) : '',
            service_type_id: s.service_type_id,
            service_type_code: st?.code || '',
            service_type_name: st ? st.name : '',
            rewards: [],
          });
        }
      });

      // 3. 各グループに該当する履歴データを紐づけ
      groupMap.forEach(group => {
        const matchingSummaries = summaries.filter(
          (s: any) => s.office_id === group.office_id && s.service_type_id === group.service_type_id
        );

        const rewardItemsList: OfficeRewardHistoryItem[] = matchingSummaries.map((s: any) => {
          const matchingDetails = details.filter((d: any) => d.summary_id === s.id);
          const rewardItemIds = matchingDetails.map((d: any) => d.reward_item_id);

          return {
            id: s.id,
            office_id: s.office_id,
            service_type_id: s.service_type_id,
            rewardItemIds,
            valid_from: s.valid_from || getCurrentJSTDateOnly(),
            valid_to: s.valid_to || null,
          };
        });

        // 共通履歴期間計算ロジック（直前データの適用終了日＝直後データの適用開始日の前日、最新は継続中）
        group.rewards = recomputeHistoryPeriods(rewardItemsList, {
          fromKey: 'valid_from',
          toKey: 'valid_to',
        });
      });

      const rows = Array.from(groupMap.values()).sort((a, b) => {
        const codeDiff = (a.office_code || '').localeCompare(b.office_code || '');
        if (codeDiff !== 0) return codeDiff;
        return (a.service_type_code || '').localeCompare(b.service_type_code || '');
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

  const handleAddSubRow = (parentId: string): OfficeRewardHistoryItem => {
    const parent = data.find(p => p.id === parentId);
    if (!parent) {
      throw new Error('対象の事業所・支援種別が見つかりません');
    }

    const today = getCurrentJSTDateOnly();
    let defaultStart = today;

    // 既存履歴の最新開始日を確認
    const existing = parent.rewards || [];
    const sortedDesc = [...existing].sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
    if (sortedDesc.length > 0 && sortedDesc[0].valid_from >= today) {
      const [y, m, d] = sortedDesc[0].valid_from.split('-').map(Number);
      const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
      defaultStart = nextDate.toISOString().substring(0, 10);
    }

    return {
      id: `NEW-${generateId()}`,
      office_id: parent.office_id,
      service_type_id: parent.service_type_id,
      rewardItemIds: [],
      valid_from: defaultStart,
      valid_to: null,
    };
  };

  const columns: Column<any>[] = useMemo(() => {
    return [
      {
        key: 'office_name',
        header: TABLE_COLUMNS.OFFICE,
        rowType: 'main',
        sortable: true,
        sortKey: 'office_code',
        editable: false,
        style: { minWidth: '160px' },
        render: (item: OfficeServiceTypeRewardGroup) => item.office_name,
      },
      {
        key: 'service_type_name',
        header: TABLE_COLUMNS.SERVICE_TYPE,
        rowType: 'main',
        sortable: true,
        sortKey: 'service_type_code',
        editable: false,
        style: { minWidth: '160px' },
        render: (item: OfficeServiceTypeRewardGroup) => item.service_type_name,
      },
      {
        key: 'rewardItemIds',
        header: TABLE_COLUMNS.REWARD_ITEM,
        rowType: 'sub',
        sortable: false,
        editable: true,
        inputType: 'select',
        style: { minWidth: '360px' },
        mainRender: (_parentItem, addSubRow) => (
          <Button onClick={addSubRow}>
            ＋ 加算・減算追加
          </Button>
        ),
        customEditRender: (value: string[], subItem: OfficeRewardHistoryItem, onChange: (newVal: string[]) => void) => {
          const availableItems = rewardItems.filter(
            ri => ri.service_type_id === subItem.service_type_id && ri.item_category !== 'base_reward'
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
              placeholder="加算・減算項目を選択"
            />
          );
        },
        render: (subItem: OfficeRewardHistoryItem) => {
          const selected = (subItem.rewardItemIds || [])
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
        header: TABLE_COLUMNS.VALID_PERIOD_FROM,
        rowType: 'sub',
        sortable: false,
        editable: true,
        inputType: 'date',
        style: { width: '150px' },
      },
      {
        key: 'valid_to',
        header: TABLE_COLUMNS.VALID_PERIOD_TO,
        rowType: 'sub',
        sortable: false,
        editable: false,
        inputType: 'date',
        style: { width: '150px' },
      },
    ];
  }, [rewardItems]);

  const handleBatchSave = async (drafts: OfficeServiceTypeRewardGroup[], deletedIds: string[]) => {
    try {
      // 1. 削除処理
      const realDeletedIds = deletedIds.filter(id => !id.startsWith('NEW-') && id.includes('-'));
      if (realDeletedIds.length > 0) {
        await supabase
          .from('office_reward_setting_details')
          .delete()
          .in('summary_id', realDeletedIds);

        await supabase
          .from('office_reward_setting_summaries')
          .delete()
          .in('id', realDeletedIds);
      }

      // 2. 有効な履歴の保存処理
      for (const group of drafts) {
        if (!group.rewards || group.rewards.length === 0) continue;

        // 共通履歴期間ロジックで適用期間（前日設定）を連動計算
        const computedRewards = recomputeHistoryPeriods(group.rewards, {
          fromKey: 'valid_from',
          toKey: 'valid_to',
          deletedIds,
        });

        for (const reward of computedRewards) {
          if (deletedIds.includes(reward.id)) continue;
          if (!reward.valid_from) {
            throw new Error(`${group.office_name}（${group.service_type_name}）の適用開始日を入力してください`);
          }

          const summaryId = reward.id.startsWith('NEW-') ? generateId() : reward.id;
          const validToVal = reward.valid_to ? reward.valid_to : null;

          // 2a. 概要テーブルのUpsert
          const { error: summaryErr } = await supabase
            .from('office_reward_setting_summaries')
            .upsert({
              id: summaryId,
              office_id: group.office_id,
              service_type_id: group.service_type_id,
              valid_from: reward.valid_from,
              valid_to: validToVal,
            });

          if (summaryErr) throw summaryErr;

          // 2b. 詳細テーブルの同期
          await supabase
            .from('office_reward_setting_details')
            .delete()
            .eq('summary_id', summaryId);

          if (reward.rewardItemIds && reward.rewardItemIds.length > 0) {
            const detailRows = reward.rewardItemIds.map(riId => ({
              id: generateId(),
              summary_id: summaryId,
              reward_item_id: riId,
            }));

            const { error: insDetailsErr } = await supabase
              .from('office_reward_setting_details')
              .insert(detailRows);

            if (insDetailsErr) throw insDetailsErr;
          }
        }
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所加算・減算データの保存に失敗しました', 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title={TABLE_COLUMNS.REWARD_ITEM}
      data={data}
      columns={columns}
      emptyMessage="事業所・支援種別データがありません"
      initialSort={{ key: 'office_code', direction: 'asc' }}
      subItemsKey="rewards"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={(subItems, _parent, deletedIds) =>
        recomputeHistoryPeriods(subItems, { fromKey: 'valid_from', toKey: 'valid_to', deletedIds })
      }
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
