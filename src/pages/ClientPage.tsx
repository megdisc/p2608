import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { ClientItem } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { mockClients } from '../mocks/clients';

export function ClientPage() {
  const [items, setItems] = useState<ClientItem[]>(mockClients);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const columns: Column<ClientItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.CLIENT_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'contactPerson', header: TABLE_COLUMNS.CONTACT_PERSON, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, editable: true, inputType: 'number' },
  ];

  const handleBatchSave = async (drafts: ClientItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newItems = drafts.filter(item => !deletedIds.includes(item.id));
      setItems(newItems);
      
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
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
