import { useEffect, useState } from 'react';
import { DataPage, type Column } from '../components';
import type { ServiceSchemeItem, ServiceDetailItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useServiceSchemes } from '../hooks';

export function ServiceSchemePage() {
  const { schemes, items, loading, fetchServiceData, batchSaveSchemes, batchSaveItems } = useServiceSchemes();
  const { showAlert } = useAlert();
  const [subTab, setSubTab] = useState<'schemes' | 'items'>('schemes');

  useEffect(() => {
    fetchServiceData().catch(() => {
      showAlert('サービス体系データの取得に失敗しました', 'error');
    });
  }, [fetchServiceData, showAlert]);

  const schemeColumns: Column<ServiceSchemeItem>[] = [
    { key: 'name', header: 'サービス体系名', editable: true, inputType: 'text' },
    { key: 'service_type_label', header: 'サービス種別', editable: false },
    { key: 'basic_reward_unit', header: '給付費基本報酬(単位/日)', editable: true, inputType: 'number' },
    { key: 'description', header: '体系の説明・適用条件', editable: true, inputType: 'text' },
  ];

  const itemColumns: Column<ServiceDetailItem>[] = [
    { key: 'scheme_name', header: '所属サービス体系', editable: false },
    { key: 'name', header: 'サービス項目名', editable: true, inputType: 'text' },
    { key: 'item_category_label', header: '項目分類区分', editable: false },
    { key: 'occurrence_type_label', header: '発生単位', editable: false },
    { key: 'unit_value', header: '標準単価/単位数', editable: true, inputType: 'number' },
    { key: 'calc_rate', header: '定率算定率[%]', editable: true, inputType: 'number' },
    { key: 'value_type_label', header: '値種別区分', editable: false },
    { key: 'monthly_limit_count', header: '月間算定上限回数', editable: true, inputType: 'number' },
    { key: 'affects_reward_units', header: '給付費連動', editable: true, inputType: 'checkbox' },
    { key: 'is_auto_calculated', header: '自動計算', editable: true, inputType: 'checkbox' },
  ];

  const handleSaveSchemes = async (drafts: ServiceSchemeItem[], deletedIds: string[]) => {
    try {
      await batchSaveSchemes(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleSaveItems = async (drafts: ServiceDetailItem[], deletedIds: string[]) => {
    try {
      await batchSaveItems(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAddScheme = () => {
    return {
      id: `SCH-${Date.now()}-${Math.random()}`,
      name: '新規サービス体系',
      service_type: 'type_b',
      service_type_label: '就労継続支援B型',
      description: '',
      basic_reward_unit: 580
    } as ServiceSchemeItem;
  };

  const handleAddItem = () => {
    return {
      id: `ITM-${Date.now()}-${Math.random()}`,
      service_scheme_id: '33333333-3333-3333-3333-333333333333',
      scheme_name: '就労継続支援B型標準サービス体系',
      name: '',
      item_category: 'reward_addition',
      item_category_label: '給付費体制加算',
      occurrence_type: 'daily',
      occurrence_type_label: '日次',
      unit_value: 0,
      calc_rate: 0,
      value_type: 'unit',
      value_type_label: '給付費単位数[単位]',
      monthly_limit_count: null,
      affects_reward_units: true,
      is_auto_calculated: false
    } as ServiceDetailItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        <button
          onClick={() => setSubTab('schemes')}
          style={{
            padding: '6px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'var(--weight-heading)',
            backgroundColor: subTab === 'schemes' ? 'var(--color-bg-inverse)' : 'transparent',
            color: subTab === 'schemes' ? 'var(--color-text-inverse)' : 'var(--color-text-main)'
          }}
        >
          給付費サービス体系マスタ ({schemes.length})
        </button>
        <button
          onClick={() => setSubTab('items')}
          style={{
            padding: '6px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'var(--weight-heading)',
            backgroundColor: subTab === 'items' ? 'var(--color-bg-inverse)' : 'transparent',
            color: subTab === 'items' ? 'var(--color-text-inverse)' : 'var(--color-text-main)'
          }}
        >
          給付費体制加減算・手当・控除項目マスタ ({items.length})
        </button>
      </div>

      {subTab === 'schemes' ? (
        <DataPage 
          title="給付費サービス体系定義"
          data={schemes} 
          columns={schemeColumns} 
          emptyMessage="登録されているサービス体系がありません" 
          onBatchSave={handleSaveSchemes}
          onAddRow={handleAddScheme}
          hideHeader={true}
        />
      ) : (
        <DataPage 
          title="サービス項目・体制加減算マスタ"
          data={items} 
          columns={itemColumns} 
          emptyMessage="登録されているサービス項目がありません" 
          onBatchSave={handleSaveItems}
          onAddRow={handleAddItem}
          hideHeader={true}
        />
      )}
    </div>
  );
}
