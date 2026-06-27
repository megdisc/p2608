import { DataPage, type Column } from '../components';
import { useMemo, useEffect } from 'react';
import type { MasterItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useMasterItems } from '../hooks';

export function MasterPage() {
  const { items, categories, suppliers, locations, loading, fetchMasterItems, batchSaveMasterItems } = useMasterItems();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMasterItems().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchMasterItems, showAlert]);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...categories.map(c => ({ label: c.name, value: c.name }))], [categories]);
  const supplierOptions = useMemo(() => [{ label: '', value: '' }, ...suppliers.map(s => ({ label: s.name, value: s.name }))], [suppliers]);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...locations.map(l => ({ label: l.name, value: l.name }))], [locations]);

  const columns: Column<MasterItem>[] = [
    { key: 'category', header: TABLE_COLUMNS.CATEGORY, sortKey: 'categoryYomigana', editable: true, inputType: 'select', options: categoryOptions },
    { key: 'name', header: TABLE_COLUMNS.ITEM, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
    { 
      key: 'location', 
      header: TABLE_COLUMNS.STANDARD_LOCATION, 
      sortKey: 'locationYomigana', 
      editable: true, 
      inputType: 'select', 
      options: locationOptions 
    },
    { key: 'supplier', header: TABLE_COLUMNS.SUPPLIER, editable: true, inputType: 'select', options: supplierOptions },
    { key: 'standardPrice', header: TABLE_COLUMNS.STANDARD_PRICE, editable: true, inputType: 'number' },
    { key: 'standardPurchaseQty', header: TABLE_COLUMNS.STANDARD_PURCHASE_QTY, editable: true, inputType: 'number' },
  ];

  const handleBatchSave = async (drafts: MasterItem[], deletedIds: string[]) => {
    try {
      await batchSaveMasterItems(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `MST-${Date.now()}`,
      name: '',
      yomigana: '',
      description: '',
      supplier: '',
      standardPrice: 0,
      standardPurchaseQty: 0,
      category: '',
      location: ''
    } as MasterItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.MASTER}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_MASTER} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
