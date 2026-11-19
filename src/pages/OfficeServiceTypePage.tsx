import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { getCurrentJSTDateOnly, recomputeHistoryPeriods } from '../utils';
import {
  MESSAGES,
  TABLE_COLUMNS,
  STAFFING_RATIO_OPTIONS,
} from '../constants';
import type {
  OfficeTableItem,
  ServiceTypeTableItem,
} from '../types';

export type OfficeServiceTypeRow = {
  id: string; // UUID of office_service_type_settings
  office_id: string;
  service_type_id: string;
  office_number: string;
  capacity: number;
  staffing_ratio: string;
  valid_from?: string;
  valid_to?: string | null;
};

export type OfficeWithServiceTypes = {
  id: string; // office_id
  code: string;
  name: string;
  short_name: string;
  service_type_name?: string;
  serviceTypes: OfficeServiceTypeRow[];
};

const isBTypeServiceType = (st: { code?: string; name?: string }) => {
  return st.code === '21' || st.name === '就労継続支援B型' || st.name === '就労支援B型';
};

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
};

export function OfficeServiceTypePage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeTableItem[]>([]);
  const [data, setData] = useState<OfficeWithServiceTypes[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [officeRes, serviceTypeRes, settingsRes] = await Promise.all([
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('service_types').select('*').order('code', { ascending: true }),
        supabase.from('office_service_type_settings').select('*').eq('is_deleted', false),
      ]);

      if (officeRes.error) throw officeRes.error;
      if (serviceTypeRes.error) throw serviceTypeRes.error;
      if (settingsRes.error) throw settingsRes.error;

      const activeOffices: OfficeTableItem[] = officeRes.data || [];
      const activeSTs: ServiceTypeTableItem[] = serviceTypeRes.data || [];
      const settings: any[] = settingsRes.data || [];

      setServiceTypes(activeSTs);

      const rows: OfficeWithServiceTypes[] = activeOffices.map(office => {
        const officeSettings = settings.filter(s => s.office_id === office.id);
        const formattedSettings: OfficeServiceTypeRow[] = officeSettings.map(s => {
          return {
            id: s.id || generateId(),
            office_id: office.id,
            service_type_id: s.service_type_id,
            office_number: s.office_number || '',
            capacity: s.capacity ?? 20,
            staffing_ratio: s.staffing_ratio || '7.5:1',
            valid_from: (s as any).valid_from || '2024-04-01',
            valid_to: (s as any).valid_to || '',
          };
        });
        formattedSettings.sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));

        return {
          id: office.id,
          code: office.code || '',
          name: office.name,
          short_name: office.short_name || '',
          service_type_name: '就労継続支援B型',
          serviceTypes: formattedSettings,
        };
      });

      setData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所支援種別割当データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubRow = (parentId: string): OfficeServiceTypeRow => {
    const parent = data.find(p => p.id === parentId);
    const existing = parent?.serviceTypes || [];
    const sortedDesc = [...existing].sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));

    const today = getCurrentJSTDateOnly();
    let defaultStart = today;
    let latestRow: Partial<OfficeServiceTypeRow> = {};

    if (sortedDesc.length > 0) {
      latestRow = sortedDesc[0];
      if (latestRow.valid_from && latestRow.valid_from >= today) {
        const [y, m, d] = latestRow.valid_from.split('-').map(Number);
        const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
        defaultStart = nextDate.toISOString().substring(0, 10);
      }
    }

    const bType = serviceTypes.find(isBTypeServiceType);

    return {
      id: generateId(),
      office_id: parentId,
      service_type_id: bType ? bType.id : (latestRow.service_type_id || '11111111-0000-0000-0000-000000000001'),
      office_number: latestRow.office_number || '',
      capacity: latestRow.capacity ?? 20,
      staffing_ratio: latestRow.staffing_ratio || '7.5:1',
      valid_from: defaultStart,
      valid_to: null,
    };
  };

  const handleRecomputeSubItems = (
    subItems: OfficeServiceTypeRow[],
    _parent: OfficeWithServiceTypes,
    deletedIds?: Set<string> | string[]
  ): OfficeServiceTypeRow[] => {
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
        header: TABLE_COLUMNS.OFFICE_ID,
        sortable: true,
        sortKey: 'code',
        editable: false,
        rowType: 'main',
      },
      {
        key: 'name',
        header: TABLE_COLUMNS.OFFICE_NAME,
        sortable: true,
        sortKey: 'name',
        editable: false,
        rowType: 'main',
      },
      {
        key: 'service_type_name',
        header: TABLE_COLUMNS.SERVICE_TYPE,
        sortable: false,
        editable: false,
        rowType: 'main',
        render: (item: any) => {
          const stId = item.serviceTypes?.[0]?.service_type_id;
          const st = serviceTypes.find(s => s.id === stId);
          return st ? st.name : (item.service_type_name || '就労継続支援B型');
        },
        style: { minWidth: '160px' },
      },
      {
        key: 'valid_from',
        header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'date',
        style: { minWidth: '130px' },
        mainRender: (_item, addSubRow) => (
          <Button onClick={addSubRow}>
            ＋ 履歴追加
          </Button>
        ),
      },
      {
        key: 'valid_to',
        header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
        sortable: false,
        rowType: 'sub',
        inputType: 'date',
        style: { minWidth: '130px' },
      },
      {
        key: 'office_number',
        header: TABLE_COLUMNS.OFFICE_NUMBER,
        sortable: false,
        rowType: 'sub',
        inputType: 'text',
        placeholder: '10桁番号',
        style: { minWidth: '130px' },
      },
      {
        key: 'capacity',
        header: TABLE_COLUMNS.CAPACITY,
        sortable: false,
        rowType: 'sub',
        inputType: 'number',
        className: 'quantity',
        style: { width: '80px', textAlign: 'right' },
      },
      {
        key: 'staffing_ratio',
        header: TABLE_COLUMNS.STAFFING_RATIO,
        sortable: false,
        rowType: 'sub',
        inputType: 'select',
        options: STAFFING_RATIO_OPTIONS,
        style: { minWidth: '110px' },
      },
    ];
  }, [serviceTypes]);

  const handleBatchSave = async (drafts: OfficeWithServiceTypes[], deletedIds: string[]) => {
    try {
      // 1. 論理削除: チェックされた設定レコードの deleted_at を現在時刻に更新
      if (deletedIds.length > 0) {
        const nowIso = new Date().toISOString();
        const { error: delErr } = await supabase
          .from('office_service_type_settings')
          .update({ deleted_at: nowIso })
          .in('id', deletedIds);
        if (delErr) throw delErr;
      }

      // 2. 有効なサブ行（支援種別割当データ）を収集して一括保存（upsert）
      const activeSubItems: {
        id: string;
        office_id: string;
        service_type_id: string;
        office_number: string | null;
        capacity: number;
        staffing_ratio: string | null;
        valid_from: string | null;
        valid_to: string | null;
        deleted_at: null;
        updated_at: string;
      }[] = [];

      drafts.forEach(office => {
        (office.serviceTypes || []).forEach(st => {
          if (!deletedIds.includes(st.id) && st.service_type_id) {
            activeSubItems.push({
              id: st.id,
              office_id: office.id,
              service_type_id: st.service_type_id,
              office_number: st.office_number ? String(st.office_number).trim() : null,
              capacity: Number(st.capacity) || 0,
              staffing_ratio: st.staffing_ratio || null,
              valid_from: st.valid_from || '2024-04-01',
              valid_to: st.valid_to || null,
              deleted_at: null,
              updated_at: new Date().toISOString(),
            });
          }
        });
      });

      if (activeSubItems.length > 0) {
        const { error: upsertErr } = await supabase
          .from('office_service_type_settings')
          .upsert(activeSubItems);
        if (upsertErr) throw upsertErr;
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
      title="事業所支援種別割当"
      data={data}
      columns={columns}
      subItemsKey="serviceTypes"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={handleRecomputeSubItems}
      onBatchSave={handleBatchSave}
      emptyMessage="事業所データがありません"
      initialSort={{ key: 'code', direction: 'asc' }}
      hideAddButton={true}
      hideDeleteColumn={false}
      canDeleteRow={(item: any) => !item.code}
      hideHeader={true}
    />
  );
}
