import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { SupplierItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useSuppliers } from '../hooks';

export function SupplierPage() {
  const { items, loading, fetchSuppliers, batchSaveSuppliers } = useSuppliers();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSuppliers().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchSuppliers, showAlert]);

  const columns: Column<SupplierItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.SUPPLIER_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'contactPerson', header: TABLE_COLUMNS.CONTACT_PERSON, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, editable: true, inputType: 'number' },
  ];

  const handleBatchSave = async (drafts: SupplierItem[], deletedIds: string[]) => {
    try {
      await batchSaveSuppliers(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `SUP-${Date.now()}`,
      name: '',
      yomigana: '',
      contactPerson: '',
      phone: ''
    } as SupplierItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.SUPPLIER}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_SUPPLIER} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
