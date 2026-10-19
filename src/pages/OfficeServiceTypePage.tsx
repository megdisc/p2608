import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import {
  MESSAGES,
  TABLE_COLUMNS,
  STAFFING_RATIO_OPTIONS,
  WAGE_ACHIEVEMENT_TIER_OPTIONS,
} from '../constants';
import type {
  OfficeTableItem,
  ServiceTypeTableItem,
  OfficeServiceTypeSettingTableItem,
  RegionalGradeTableItem,
} from '../types/db';

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

/**
 * 事業所の所在地（都道府県・市区町村）と支援種別（人件費割合）に基づき、
 * 地域区分（級地）および1単位あたり単価（円）を自動算出する
 */
export const calculateRegionalGradeAndUnitPrice = (
  officeAddress: { prefecture?: string; city?: string } | undefined,
  serviceType: ServiceTypeTableItem | undefined,
  regionalGrades: RegionalGradeTableItem[]
): { regional_grade: string; unit_price_per_point: number } => {
  if (!officeAddress || !officeAddress.prefecture || !officeAddress.city) {
    return { regional_grade: 'その他', unit_price_per_point: 10.00 };
  }

  const pref = officeAddress.prefecture.trim();
  const city = officeAddress.city.trim();

  // 1. 都道府県と市区町村の完全一致
  let matched = regionalGrades.find(
    rg => rg.prefecture === pref && rg.city === city
  );

  // 2. 前方一致・部分一致（「広島市中区」と「広島市」など政令指定都市等の配慮）
  if (!matched) {
    matched = regionalGrades.find(
      rg => rg.prefecture === pref && (city.startsWith(rg.city) || rg.city.startsWith(city))
    );
  }

  const grade = matched?.grade || 'その他';
  const premiumRate = matched?.premium_rate !== undefined ? Number(matched.premium_rate) : 0;
  const ratio = serviceType?.personnel_cost_ratio !== undefined ? Number(serviceType.personnel_cost_ratio) : 0.57;

  // 1単位単価 = 10円 + 10円 × 所在地上乗せ割合 × 支援種別人件費割合 (小数第2位まで四捨五入)
  const unitPrice = Math.round((10 + 10 * premiumRate * ratio) * 100) / 100;

  return {
    regional_grade: grade,
    unit_price_per_point: unitPrice,
  };
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
  const [regionalGrades, setRegionalGrades] = useState<RegionalGradeTableItem[]>([]);
  const [officeAddressMap, setOfficeAddressMap] = useState<Record<string, { prefecture?: string; city?: string }>>({});
  const [data, setData] = useState<OfficeWithServiceTypes[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [officeRes, serviceTypeRes, settingsRes, regionalRes, addressRes] = await Promise.all([
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('service_types').select('*').order('code', { ascending: true }),
        supabase.from('office_service_type_settings').select('*').eq('is_deleted', false),
        supabase.from('regional_grades').select('*').eq('is_deleted', false),
        supabase.from('entity_address_settings').select('owner_id, addresses(prefecture, city)').eq('owner_type', 'office'),
      ]);

      if (officeRes.error) throw officeRes.error;
      if (serviceTypeRes.error) throw serviceTypeRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (regionalRes.error) throw regionalRes.error;
      if (addressRes.error) throw addressRes.error;

      const activeOffices: OfficeTableItem[] = officeRes.data || [];
      const activeSTs: ServiceTypeTableItem[] = serviceTypeRes.data || [];
      const settings: OfficeServiceTypeSettingTableItem[] = settingsRes.data || [];
      const regionalList: RegionalGradeTableItem[] = regionalRes.data || [];

      const addrMap: Record<string, { prefecture?: string; city?: string }> = {};
      type AddressSettingItem = {
        owner_id: string;
        addresses?: { prefecture?: string; city?: string } | { prefecture?: string; city?: string }[];
      };
      ((addressRes.data || []) as unknown as AddressSettingItem[]).forEach(item => {
        if (item.owner_id && item.addresses) {
          const addr = Array.isArray(item.addresses) ? item.addresses[0] : item.addresses;
          if (addr) {
            addrMap[item.owner_id] = {
              prefecture: addr.prefecture || '',
              city: addr.city || '',
            };
          }
        }
      });

      setServiceTypes(activeSTs);
      setRegionalGrades(regionalList);
      setOfficeAddressMap(addrMap);

      const rows: OfficeWithServiceTypes[] = activeOffices.map(office => {
        const officeSettings = settings.filter(s => s.office_id === office.id);
        const officeAddr = addrMap[office.id];
        return {
          id: office.id,
          code: office.code || '',
          name: office.name,
          short_name: office.short_name || '',
          serviceTypes: officeSettings.map(s => {
            const st = activeSTs.find(t => t.id === s.service_type_id);
            const derived = calculateRegionalGradeAndUnitPrice(officeAddr, st, regionalList);
            return {
              id: s.id || generateId(),
              office_id: office.id,
              service_type_id: s.service_type_id,
              office_number: s.office_number || '',
              capacity: s.capacity ?? 20,
              staffing_ratio: s.staffing_ratio || '7.5:1',
              wage_achievement_tier: s.wage_achievement_tier || '4万5千円以上',
              regional_grade: s.regional_grade || derived.regional_grade,
              unit_price_per_point: s.unit_price_per_point ?? derived.unit_price_per_point,
            };
          }),
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
    const officeAddr = officeAddressMap[parentId];
    const derived = calculateRegionalGradeAndUnitPrice(officeAddr, bType, regionalGrades);
    return {
      id: generateId(),
      office_id: parentId,
      service_type_id: bType ? bType.id : '11111111-0000-0000-0000-000000000001',
      office_number: '',
      capacity: 20,
      staffing_ratio: '7.5:1',
      wage_achievement_tier: '4万5千円以上',
      regional_grade: derived.regional_grade,
      unit_price_per_point: derived.unit_price_per_point,
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
        onCellChange: (val: unknown, rowItem: unknown) => {
          const stId = String(val);
          const row = rowItem as OfficeServiceTypeRow;
          const st = serviceTypes.find(s => s.id === stId);
          const officeAddr = officeAddressMap[row.office_id];
          const derived = calculateRegionalGradeAndUnitPrice(officeAddr, st, regionalGrades);
          return {
            regional_grade: derived.regional_grade,
            unit_price_per_point: derived.unit_price_per_point,
          } as Partial<OfficeServiceTypeRow>;
        },
        render: (subItem: unknown) => {
          const row = subItem as OfficeServiceTypeRow;
          const st = serviceTypes.find(s => s.id === row.service_type_id);
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
        editable: false,
        style: { minWidth: '100px', textAlign: 'center' },
        render: (subItem: unknown) => (subItem as OfficeServiceTypeRow).regional_grade || 'その他',
      },
      {
        key: 'unit_price_per_point',
        header: TABLE_COLUMNS.UNIT_PRICE_PER_POINT,
        sortable: false,
        rowType: 'sub',
        editable: false,
        className: 'quantity',
        style: { width: '130px', textAlign: 'right' },
        render: (subItem: unknown) => {
          const row = subItem as OfficeServiceTypeRow;
          return row.unit_price_per_point !== undefined && row.unit_price_per_point !== null
            ? `${Number(row.unit_price_per_point).toFixed(2)}円`
            : '';
        },
      },
    ];
  }, [serviceTypes, regionalGrades, officeAddressMap]);

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
