import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import {
  MESSAGES,
  TABLE_COLUMNS,
  STAFFING_RATIO_OPTIONS,
  REGIONAL_GRADE_OPTIONS,
  REGIONAL_GRADE_UNIT_PRICES,
  WAGE_ACHIEVEMENT_TIER_OPTIONS,
} from '../constants';
import type { OfficeTableItem, ServiceTypeTableItem, OfficeServiceTypeSettingTableItem } from '../types/db';

export type OfficeServiceTypeRow = {
  id: string; // UUID of office_service_type_settings
  office_id: string;
  service_type_id: string;
  office_number: string;
  capacity: number;
  staffing_ratio: string;
  wage_achievement_tier: string;
  regional_grade: string;
  unit_price_per_point: number;
};

export type OfficeWithServiceTypes = {
  id: string; // office_id
  code: string;
  name: string;
  short_name: string;
  serviceTypes: OfficeServiceTypeRow[];
};

export const isBTypeServiceType = (st: { code?: string; name?: string }) => {
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
      const settings: OfficeServiceTypeSettingTableItem[] = settingsRes.data || [];

      setServiceTypes(activeSTs);

      const rows: OfficeWithServiceTypes[] = activeOffices.map(office => {
        const officeSettings = settings.filter(s => s.office_id === office.id);
        return {
          id: office.id,
          code: office.code || '',
          name: office.name,
          short_name: office.short_name || '',
          serviceTypes: officeSettings.map(s => ({
            id: s.id || generateId(),
            office_id: office.id,
            service_type_id: s.service_type_id,
            office_number: s.office_number || '',
            capacity: s.capacity ?? 20,
            staffing_ratio: s.staffing_ratio || '7.5:1',
            wage_achievement_tier: s.wage_achievement_tier || '4万5千円以上',
            regional_grade: s.regional_grade || 'その他',
            unit_price_per_point: s.unit_price_per_point ?? 10.00,
          })),
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
    const bType = serviceTypes.find(isBTypeServiceType);
    return {
      id: generateId(),
      office_id: parentId,
      service_type_id: bType ? bType.id : '11111111-0000-0000-0000-000000000001',
      office_number: '',
      capacity: 20,
      staffing_ratio: '7.5:1',
      wage_achievement_tier: '4万5千円以上',
      regional_grade: 'その他',
      unit_price_per_point: 10.00,
    };
  };

  const columns: Column<OfficeWithServiceTypes>[] = useMemo(() => {
    const bTypes = serviceTypes.filter(isBTypeServiceType);
    const serviceTypeOptions = bTypes.map(st => ({
      label: st.name,
      value: st.id,
    }));

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
        key: 'service_type_id',
        header: TABLE_COLUMNS.SERVICE_TYPE,
        sortable: false,
        rowType: 'sub',
        inputType: 'select',
        options: serviceTypeOptions,
        render: (subItem: any) => {
          const st = serviceTypes.find(s => s.id === subItem.service_type_id);
          return st ? st.name : '';
        },
        mainRender: (_item, addSubRow) => (
          <Button onClick={addSubRow}>
            ＋ 支援種別追加
          </Button>
        ),
        style: { minWidth: '160px' },
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
      {
        key: 'wage_achievement_tier',
        header: TABLE_COLUMNS.WAGE_ACHIEVEMENT_TIER,
        sortable: false,
        rowType: 'sub',
        inputType: 'select',
        options: WAGE_ACHIEVEMENT_TIER_OPTIONS,
        style: { minWidth: '190px' },
      },
      {
        key: 'regional_grade',
        header: TABLE_COLUMNS.REGIONAL_GRADE,
        sortable: false,
        rowType: 'sub',
        inputType: 'select',
        options: REGIONAL_GRADE_OPTIONS,
        onCellChange: (val: any) => {
          const defaultPrice = REGIONAL_GRADE_UNIT_PRICES[val];
          if (defaultPrice !== undefined) {
            return { unit_price_per_point: defaultPrice } as any;
          }
        },
        style: { minWidth: '100px' },
      },
      {
        key: 'unit_price_per_point',
        header: TABLE_COLUMNS.UNIT_PRICE_PER_POINT,
        sortable: false,
        rowType: 'sub',
        inputType: 'number',
        className: 'quantity',
        style: { width: '120px', textAlign: 'right' },
        render: (subItem: any) =>
          subItem.unit_price_per_point !== undefined && subItem.unit_price_per_point !== null && subItem.unit_price_per_point !== ''
            ? Number(subItem.unit_price_per_point).toFixed(2)
            : '',
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
        wage_achievement_tier: string | null;
        regional_grade: string | null;
        unit_price_per_point: number;
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
              wage_achievement_tier: st.wage_achievement_tier || null,
              regional_grade: st.regional_grade || null,
              unit_price_per_point: Number(st.unit_price_per_point) || 10.00,
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
      onBatchSave={handleBatchSave}
      emptyMessage="事業所データがありません"
      initialSort={{ key: 'code', direction: 'asc' }}
      hideAddButton={true}
      hideDeleteColumn={false}
      canDeleteRow={() => false}
      hideHeader={true}
    />
  );
}
