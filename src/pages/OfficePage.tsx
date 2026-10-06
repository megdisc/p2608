import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { OfficeItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useOffices } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function OfficePage() {
  const { items, loading, fetchOffices, batchSaveOffices } = useOffices();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchOffices().catch(() => {
      showAlert('事業所データの取得に失敗しました', 'error');
    });
  }, [fetchOffices, showAlert]);

  const columns: Column<OfficeItem>[] = [
    { key: 'code', header: TABLE_COLUMNS.OFFICE_ID, sortable: false, editable: true, inputType: 'text' },
    { key: 'name', header: TABLE_COLUMNS.OFFICE_NAME, sortable: false, editable: true, inputType: 'text' },
    { key: 'short_name', header: TABLE_COLUMNS.OFFICE_SHORT_NAME, sortable: false, editable: true, inputType: 'text' },
    { key: 'unit_price', header: TABLE_COLUMNS.UNIT_PRICE_REGIONAL, sortable: false, editable: true, inputType: 'number' },
    { key: 'postal_code_prefix', header: TABLE_COLUMNS.POSTAL_CODE_PREFIX, sortable: false, editable: true, inputType: 'text' },
    { key: 'postal_code_suffix', header: TABLE_COLUMNS.POSTAL_CODE_SUFFIX, sortable: false, editable: true, inputType: 'text' },
    { key: 'prefecture', header: TABLE_COLUMNS.PREFECTURE, sortable: false, editable: true, inputType: 'text' },
    { key: 'city', header: TABLE_COLUMNS.CITY, sortable: false, editable: true, inputType: 'text' },
    { key: 'town_street', header: TABLE_COLUMNS.TOWN_STREET, sortable: false, editable: true, inputType: 'text' },
    { key: 'building', header: TABLE_COLUMNS.BUILDING, sortable: false, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, sortable: false, editable: true, inputType: 'text' },
    { key: 'fax', header: TABLE_COLUMNS.FAX, sortable: false, editable: true, inputType: 'text' },
    { key: 'email', header: TABLE_COLUMNS.EMAIL, sortable: false, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: OfficeItem[], deletedIds: string[]) => {
    try {
      await batchSaveOffices(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: OfficeItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    return {
      id: `OFF-${Date.now()}-${Math.random()}`,
      code: generateNextUnifiedCode(existingCodes, 'OFF-'),
      name: '',
      short_name: '',
      unit_price: 10.68,
      postal_code_prefix: '',
      postal_code_suffix: '',
      prefecture: '',
      city: '',
      town_street: '',
      building: '',
      phone: '',
      fax: '',
      email: '',
    } as OfficeItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="事業所管理"
      data={items} 
      columns={columns} 
      emptyMessage="登録されている事業所がありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
