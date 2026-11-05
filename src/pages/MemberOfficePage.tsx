import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { getCurrentJSTDateOnly, recomputeHistoryPeriods } from '../utils';
import type { OfficeTableItem, MemberTableItem } from '../types/db';

export type MemberOfficeHistoryRow = {
  id: string; // 一時IDまたは設定ID
  valid_from: string;
  valid_to: string | null;
  assignedOffices: Record<string, boolean>;
  copaymentOfficeId?: string | null;
  [officeId: string]: any;
};

export type MemberWithOfficeHistories = {
  id: string; // member_id
  code: string;
  name: string;
  yomigana: string;
  copaymentOfficeId: string | null;
  settings: MemberOfficeHistoryRow[];
};

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
};

export function MemberOfficePage() {
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const [data, setData] = useState<MemberWithOfficeHistories[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [memberRes, officeRes, summariesRes, detailsRes, certRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('office_member_setting_summaries').select('*'),
        supabase.from('office_member_setting_details').select('*'),
        supabase.from('member_recipient_certificates').select('*').or('is_deleted.eq.false,is_deleted.is.null'),
      ]);

      if (memberRes.error) throw memberRes.error;
      if (officeRes.error) throw officeRes.error;
      if (summariesRes.error) throw summariesRes.error;
      if (detailsRes.error) throw detailsRes.error;

      const activeMembers: MemberTableItem[] = memberRes.data || [];
      const activeOffices: OfficeTableItem[] = officeRes.data || [];
      const summaries: any[] = summariesRes.data || [];
      const details: any[] = detailsRes.data || [];
      const certs: any[] = certRes.data || [];

      setOffices(activeOffices);

      const summaryMap = new Map<string, any>(summaries.map(s => [s.id, s]));

      // 利用者ごとに割当（summary + detail）を集約
      const rows: MemberWithOfficeHistories[] = activeMembers.map(member => {
        // 自法人の上限額管理事業所（主たる事業所）を特定
        const memberCerts = certs.filter((c: any) => c.member_id === member.id && !c.is_deleted);
        const selfManagedCert = memberCerts.find((c: any) =>
          (c.copayment_management_type === 'self_internal' || c.copayment_management_type === 'self') &&
          c.copayment_office_id
        );
        const copaymentOfficeId = selfManagedCert ? selfManagedCert.copayment_office_id : null;

        const memberDetails = details.filter(d => d.member_id === member.id);

        // 期間 (valid_from, valid_to) ごとにグループ化
        const periodGroups = new Map<string, {
          id: string;
          valid_from: string;
          valid_to: string | null;
          assignedOffices: Record<string, boolean>;
        }>();

        memberDetails.forEach(d => {
          const s = summaryMap.get(d.summary_id);
          if (!s) return;
          const pKey = `${s.valid_from}__${s.valid_to || 'NULL'}`;
          if (!periodGroups.has(pKey)) {
            periodGroups.set(pKey, {
              id: d.id, // 代表IDとして詳細IDを使用
              valid_from: s.valid_from,
              valid_to: s.valid_to || null,
              assignedOffices: {},
            });
          }
          const group = periodGroups.get(pKey)!;
          group.assignedOffices[s.office_id] = true;
        });

        // 主たる事業所がある場合、各期間で自動割当
        if (copaymentOfficeId) {
          periodGroups.forEach(group => {
            group.assignedOffices[copaymentOfficeId] = true;
          });
        }

        let settings: MemberOfficeHistoryRow[] = Array.from(periodGroups.values()).map(g => ({
          id: g.id,
          valid_from: g.valid_from,
          valid_to: g.valid_to,
          assignedOffices: g.assignedOffices,
          copaymentOfficeId,
          ...g.assignedOffices,
        }));

        // 割当履歴が1件もない場合はデフォルト行を用意
        if (settings.length === 0) {
          const defaultAssigned: Record<string, boolean> = {};
          if (copaymentOfficeId) {
            defaultAssigned[copaymentOfficeId] = true;
          }
          settings = [{
            id: `INIT-${member.id}`,
            valid_from: '2024-04-01',
            valid_to: null,
            assignedOffices: defaultAssigned,
            copaymentOfficeId,
            ...defaultAssigned,
          }];
        } else {
          // valid_from 降順（新しい順）でソート
          settings.sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
        }

        return {
          id: member.id,
          code: member.code || '',
          name: member.name,
          yomigana: member.yomigana || '',
          copaymentOfficeId,
          settings,
        };
      });

      setData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所利用者割当データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubRow = useCallback((parentId: string): MemberOfficeHistoryRow => {
    const parent = data.find(p => p.id === parentId);
    if (!parent) {
      throw new Error('対象の利用者が見つかりません');
    }

    const today = getCurrentJSTDateOnly();
    const existing = parent.settings || [];
    const sortedDesc = [...existing].sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));

    let defaultStart = today;
    let inheritedAssigned: Record<string, boolean> = {};

    if (sortedDesc.length > 0) {
      const latest = sortedDesc[0];
      inheritedAssigned = { ...(latest.assignedOffices || {}) };

      if (latest.valid_from >= today) {
        const [y, m, d] = latest.valid_from.split('-').map(Number);
        const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
        defaultStart = nextDate.toISOString().substring(0, 10);
      }
    }

    if (parent.copaymentOfficeId) {
      inheritedAssigned[parent.copaymentOfficeId] = true;
    }

    return {
      id: `NEW-${generateId()}`,
      valid_from: defaultStart,
      valid_to: null,
      assignedOffices: inheritedAssigned,
      copaymentOfficeId: parent.copaymentOfficeId,
      ...inheritedAssigned,
    };
  }, [data]);

  const handleRecomputeSubItems = useCallback((
    subItems: MemberOfficeHistoryRow[],
    _parent: MemberWithOfficeHistories,
    deletedIds?: Set<string> | string[]
  ): MemberOfficeHistoryRow[] => {
    const recomputed = recomputeHistoryPeriods(subItems, {
      fromKey: 'valid_from',
      toKey: 'valid_to',
      deletedIds,
    });
    return recomputed.sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
  }, []);

  const columns: Column<any>[] = useMemo(() => {
    const cols: Column<any>[] = [
      {
        key: 'code',
        header: TABLE_COLUMNS.MEMBER_ID,
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
        key: 'valid_from',
        header: TABLE_COLUMNS.MEMBER_OFFICE_VALID_FROM,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'date',
        style: { width: '150px' },
        mainRender: (_parentItem: any, addSubRow: any) => (
          <Button onClick={addSubRow}>
            ＋ 履歴追加
          </Button>
        ),
      },
      {
        key: 'valid_to',
        header: TABLE_COLUMNS.MEMBER_OFFICE_VALID_TO,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'date',
        style: { width: '150px' },
      },
    ];

    offices.forEach(office => {
      cols.push({
        key: office.id,
        header: office.short_name || office.name,
        sortable: false,
        editable: true,
        rowType: 'sub',
        inputType: 'checkbox',
        style: () => ({
          textAlign: 'center',
          minWidth: '130px',
          whiteSpace: 'nowrap',
        }),
        customEditRender: (_val: unknown, subItem: MemberOfficeHistoryRow, onChange: (patch: any) => void) => {
          const isCopaymentOffice = subItem.copaymentOfficeId === office.id;
          const isAssigned = isCopaymentOffice || !!subItem.assignedOffices?.[office.id];

          const handleToggle = () => {
            if (isCopaymentOffice) return;

            const nextMap = {
              ...(subItem.assignedOffices || {}),
              [office.id]: !isAssigned,
            };
            onChange({
              assignedOffices: nextMap,
              [office.id]: !isAssigned,
            });
          };

          if (isCopaymentOffice) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', minWidth: '100px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'not-allowed', fontSize: 'var(--text-caption)', whiteSpace: 'nowrap' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={isAssigned}
                onChange={handleToggle}
              />
            </div>
          );
        },
      });
    });

    return cols;
  }, [offices]);

  const handleBatchSave = async (drafts: MemberWithOfficeHistories[], deletedIds: string[] = []) => {
    try {
      // 1. 現在のDBの summaries と details を取得
      const [sumRes, detRes] = await Promise.all([
        supabase.from('office_member_setting_summaries').select('*'),
        supabase.from('office_member_setting_details').select('*'),
      ]);
      if (sumRes.error) throw sumRes.error;
      if (detRes.error) throw detRes.error;

      const dbSummaries: any[] = sumRes.data || [];
      const dbDetails: any[] = detRes.data || [];
      const summaryMap = new Map<string, any>(dbSummaries.map(s => [s.id, s]));

      // 既存の詳細レコード情報を構造化
      type ExistingDetailInfo = {
        detailId: string;
        summaryId: string;
        memberId: string;
        officeId: string;
        validFrom: string;
        validTo: string | null;
        matched: boolean;
      };

      const existingDetailsList: ExistingDetailInfo[] = [];
      dbDetails.forEach(d => {
        const s = summaryMap.get(d.summary_id);
        if (s) {
          existingDetailsList.push({
            detailId: d.id,
            summaryId: d.summary_id,
            memberId: d.member_id,
            officeId: s.office_id,
            validFrom: s.valid_from,
            validTo: s.valid_to || null,
            matched: false,
          });
        }
      });

      // 2. 有効なドラフトから希望割当リストを構築
      const deletedSet = new Set(deletedIds);
      type DesiredAssignment = {
        memberId: string;
        officeId: string;
        validFrom: string;
        validTo: string | null;
      };
      const desiredList: DesiredAssignment[] = [];

      drafts.forEach(member => {
        (member.settings || []).forEach(row => {
          if (deletedSet.has(row.id)) return;
          const vFrom = row.valid_from ? row.valid_from.trim() : '2024-04-01';
          const vTo = row.valid_to && row.valid_to.trim() !== '' ? row.valid_to.trim() : null;

          offices.forEach(office => {
            const isCopaymentOffice = member.copaymentOfficeId === office.id;
            const checked = isCopaymentOffice || !!row.assignedOffices?.[office.id];
            if (checked) {
              desiredList.push({
                memberId: member.id,
                officeId: office.id,
                validFrom: vFrom,
                validTo: vTo,
              });
            }
          });
        });
      });

      // 3. 必要な (office_id, valid_from, valid_to) に対する summary を確保
      const uniquePeriods = new Map<string, { officeId: string; validFrom: string; validTo: string | null }>();
      desiredList.forEach(d => {
        const key = `${d.officeId}__${d.validFrom}__${d.validTo || 'NULL'}`;
        if (!uniquePeriods.has(key)) {
          uniquePeriods.set(key, { officeId: d.officeId, validFrom: d.validFrom, validTo: d.validTo });
        }
      });

      const periodToSummaryIdMap = new Map<string, string>();
      for (const [key, p] of uniquePeriods.entries()) {
        const existing = dbSummaries.find(
          s => s.office_id === p.officeId && s.valid_from === p.validFrom && (s.valid_to || null) === p.validTo
        );
        if (existing) {
          periodToSummaryIdMap.set(key, existing.id);
        } else {
          // 新規概要レコード作成
          const { data: newSum, error: insSumErr } = await supabase
            .from('office_member_setting_summaries')
            .insert({
              office_id: p.officeId,
              valid_from: p.validFrom,
              valid_to: p.validTo,
            })
            .select('id')
            .single();
          if (insSumErr) throw insSumErr;
          periodToSummaryIdMap.set(key, newSum.id);
          dbSummaries.push({ id: newSum.id, office_id: p.officeId, valid_from: p.validFrom, valid_to: p.validTo });
        }
      }

      // 4. details の同期（既存IDの引き継ぎ・更新・新規作成）
      for (const desired of desiredList) {
        const periodKey = `${desired.officeId}__${desired.validFrom}__${desired.validTo || 'NULL'}`;
        const targetSummaryId = periodToSummaryIdMap.get(periodKey)!;

        // 同一 memberId, officeId, targetSummaryId の未マッチ既存レコードを探す（完全一致）
        const exactMatch = existingDetailsList.find(
          e => !e.matched && e.memberId === desired.memberId && e.officeId === desired.officeId && e.summaryId === targetSummaryId
        );

        if (exactMatch) {
          exactMatch.matched = true;
          continue;
        }

        // 同一 memberId, officeId の未マッチ既存レコードを探す（期間変更により summaryId が変わった場合）
        const partialMatch = existingDetailsList.find(
          e => !e.matched && e.memberId === desired.memberId && e.officeId === desired.officeId
        );

        if (partialMatch) {
          const { error: updErr } = await supabase
            .from('office_member_setting_details')
            .update({ summary_id: targetSummaryId, updated_at: new Date().toISOString() })
            .eq('id', partialMatch.detailId);
          if (updErr) throw updErr;
          partialMatch.matched = true;
          partialMatch.summaryId = targetSummaryId;
          continue;
        }

        // 新規割当の場合、INSERT
        const { error: insErr } = await supabase
          .from('office_member_setting_details')
          .insert({
            summary_id: targetSummaryId,
            member_id: desired.memberId,
          });
        if (insErr) throw insErr;
      }

      // 5. チェックが外された / 削除された既存詳細レコードの削除
      const unmatchedDetailIds = existingDetailsList
        .filter(e => !e.matched)
        .map(e => e.detailId);

      if (unmatchedDetailIds.length > 0) {
        const { error: delErr } = await supabase
          .from('office_member_setting_details')
          .delete()
          .in('id', unmatchedDetailIds);
        if (delErr) throw delErr;
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
      title="事業所割当"
      data={data}
      columns={columns}
      subItemsKey="settings"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={handleRecomputeSubItems}
      onBatchSave={handleBatchSave}
      emptyMessage={
        offices.length === 0
          ? '登録されている事業所がありません。「施設管理」画面で事業所を登録してください。'
          : MESSAGES.EMPTY_PROJECT_USER
      }
      initialSort={{ key: 'code', direction: 'asc' }}
      hideDeleteColumn={false}
      canDeleteRow={(item: any) => !item.code}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
