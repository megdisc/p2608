import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { OfficeItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useOffices } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function OfficePage() {
  const { items, activeServiceTypes, loading, fetchOffices, batchSaveOffices } = useOffices();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchOffices().catch(() => {
      showAlert('事業所データの取得に失敗しました', 'error');
    });
  }, [fetchOffices, showAlert]);

  const columns: Column<OfficeItem>[] = [
    { key: 'code', header: '事業所コード', sortable: false, editable: true, inputType: 'text' },
    { key: 'name', header: '事業所名', sortable: false, editable: true, inputType: 'text' },
    { key: 'short_name', header: '通称', sortable: false, editable: true, inputType: 'text' },
    { key: 'unit_price', header: '地域区分単価(円)', sortable: false, editable: true, inputType: 'number' },
    {
      key: 'service_type_ids',
      header: '支援種別',
      sortable: false,
      editable: true,
      inputType: 'checkbox',
      customEditRender: (value: string[] = [], _item, onChange) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px', padding: '4px 0' }}>
          {activeServiceTypes.map(st => {
            const checked = (value || []).includes(st.id);
            return (
              <label key={st.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const currentArr = value || [];
                    const next = e.target.checked
                      ? [...currentArr, st.id]
                      : currentArr.filter(id => id !== st.id);
                    onChange(next);
                  }}
                  className="custom-checkbox"
                />
                {st.name}
              </label>
            );
          })}
        </div>
      ),
      render: (item) => {
        const assignedNames = activeServiceTypes
          .filter(st => (item.service_type_ids || []).includes(st.id))
          .map(st => st.name);
        return assignedNames.join('、') || '-';
      }
    },
    { key: 'postal_code_prefix', header: '郵便番号（前3桁）', sortable: false, editable: true, inputType: 'text' },
    { key: 'postal_code_suffix', header: '郵便番号（後4桁）', sortable: false, editable: true, inputType: 'text' },
    { key: 'prefecture', header: '都道府県', sortable: false, editable: true, inputType: 'text' },
    { key: 'city', header: '市区町村・郡', sortable: false, editable: true, inputType: 'text' },
    { key: 'town_street', header: '町名・番地', sortable: false, editable: true, inputType: 'text' },
    { key: 'building', header: '建物名・部屋番号', sortable: false, editable: true, inputType: 'text' },
    { key: 'phone', header: '電話番号', sortable: false, editable: true, inputType: 'text' },
    { key: 'fax', header: 'FAX番号', sortable: false, editable: true, inputType: 'text' },
    { key: 'email', header: 'メールアドレス', sortable: false, editable: true, inputType: 'text' },
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

    const defaultSTIds = activeServiceTypes.length > 0 ? [activeServiceTypes[0].id] : [];

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
      service_type_ids: defaultSTIds
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
