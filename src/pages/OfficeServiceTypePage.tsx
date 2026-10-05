import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import type { OfficeServiceTypeSettingTableItem, OfficeTableItem, ServiceTypeTableItem } from '../types/db';

type OfficeServiceTypeGridRow = {
  id: string; // office_id
  code: string;
  name: string;
  short_name: string;
  [serviceTypeId: string]: any;
};

export function OfficeServiceTypePage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeTableItem[]>([]);
  const [matrixData, setMatrixData] = useState<OfficeServiceTypeGridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchMatrixData = useCallback(async () => {
    try {
      setLoading(true);
      const [officeRes, serviceTypeRes, settingsRes] = await Promise.all([
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('service_types').select('*').eq('is_active', true).order('code', { ascending: true }),
        supabase.from('office_service_type_settings').select('*'),
      ]);

      if (officeRes.error) throw officeRes.error;
      if (serviceTypeRes.error) throw serviceTypeRes.error;
      if (settingsRes.error) throw settingsRes.error;

      const activeOffices: OfficeTableItem[] = officeRes.data || [];
      const activeSTs: ServiceTypeTableItem[] = serviceTypeRes.data || [];
      const settings: OfficeServiceTypeSettingTableItem[] = settingsRes.data || [];

      setServiceTypes(activeSTs);

      const rows: OfficeServiceTypeGridRow[] = activeOffices.map(office => {
        const row: OfficeServiceTypeGridRow = {
          id: office.id,
          code: office.code || '',
          name: office.name,
          short_name: office.short_name || '',
        };
        activeSTs.forEach(st => {
          const exists = settings.some(s => s.office_id === office.id && s.service_type_id === st.id);
          row[st.id] = exists;
        });

        return row;
      });

      setMatrixData(rows);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '事業所支援種別割当データの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  const columns: Column<OfficeServiceTypeGridRow>[] = useMemo(() => {
    const cols: Column<OfficeServiceTypeGridRow>[] = [
      {
        key: 'code',
        header: TABLE_COLUMNS.OFFICE_ID,
        sortable: true,
        sortKey: 'code',
        editable: false,
      },
      {
        key: 'name',
        header: TABLE_COLUMNS.OFFICE_NAME,
        sortable: true,
        sortKey: 'name',
        editable: false,
      },
    ];

    serviceTypes.forEach(st => {
      cols.push({
        key: st.id,
        header: st.name,
        sortable: false,
        editable: true,
        inputType: 'checkbox',
        style: { textAlign: 'center' },
        onCellChange: (newValue, _item, updateRow) => {
          updateRow({ [st.id]: Boolean(newValue) });
        },
      });
    });

    return cols;
  }, [serviceTypes]);

  const handleBatchSave = async (drafts: OfficeServiceTypeGridRow[]) => {
    try {
      const { data: currentSettings, error: fetchErr } = await supabase
        .from('office_service_type_settings')
        .select('*');

      if (fetchErr) throw fetchErr;

      const existingMap = new Set<string>();
      (currentSettings || []).forEach(s => {
        existingMap.add(`${s.office_id}_${s.service_type_id}`);
      });

      const toInsert: { office_id: string; service_type_id: string; capacity: number }[] = [];
      const toDeletePairs: { office_id: string; service_type_id: string }[] = [];

      drafts.forEach(row => {
        serviceTypes.forEach(st => {
          const key = `${row.id}_${st.id}`;
          const isSelected = Boolean(row[st.id]);
          const existsInDb = existingMap.has(key);

          if (isSelected && !existsInDb) {
            toInsert.push({ office_id: row.id, service_type_id: st.id, capacity: 0 });
          } else if (!isSelected && existsInDb) {
            toDeletePairs.push({ office_id: row.id, service_type_id: st.id });
          }
        });
      });

      for (const pair of toDeletePairs) {
        const { error: delErr } = await supabase
          .from('office_service_type_settings')
          .delete()
          .eq('office_id', pair.office_id)
          .eq('service_type_id', pair.service_type_id);
        if (delErr) throw delErr;
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase
          .from('office_service_type_settings')
          .insert(toInsert);
        if (insErr) throw insErr;
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchMatrixData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="事業所支援種別割当"
      data={matrixData}
      columns={columns}
      emptyMessage={
        serviceTypes.length === 0
          ? '適用済の支援種別マスタが登録されていません。「福祉制度」画面で支援種別を登録・適用してください。'
          : '事業所データがありません'
      }
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
