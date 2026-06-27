import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { ClientItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useClients } from '../hooks';

export function ClientPage() {
  const { items, loading, fetchClients, batchSaveClients } = useClients();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchClients().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchClients, showAlert]);

  const columns: Column<ClientItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.CLIENT_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'contactPerson', header: TABLE_COLUMNS.CONTACT_PERSON, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: ClientItem[], deletedIds: string[]) => {
    try {
      await batchSaveClients(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `CLI-${Date.now()}`,
      name: '',
      yomigana: '',
      contactPerson: '',
      phone: ''
    } as ClientItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.CLIENT}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_CLIENT} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
