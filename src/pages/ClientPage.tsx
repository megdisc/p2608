import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { ClientItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useClients } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function ClientPage() {
  const { items, loading, fetchClients, batchSaveClients } = useClients();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchClients().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchClients, showAlert]);

  const columns: Column<ClientItem>[] = [
    { key: 'code', header: TABLE_COLUMNS.CLIENT_ID, sortKey: 'code', editable: true, inputType: 'text' },
    { key: 'name', header: TABLE_COLUMNS.CLIENT_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'isCustomer', header: TABLE_COLUMNS.IS_CUSTOMER, editable: true, inputType: 'checkbox' },
    { key: 'isSubcontractor', header: TABLE_COLUMNS.IS_SUBCONTRACTOR, editable: true, inputType: 'checkbox' },
    { key: 'contactPerson', header: TABLE_COLUMNS.CONTACT_PERSON, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: ClientItem[], deletedIds: string[]) => {
    try {
      await batchSaveClients(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: ClientItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    return {
      id: `CLI-${Date.now()}-${Math.random()}`,
      code: generateNextUnifiedCode(existingCodes, 'C-'),
      name: '',
      yomigana: '',
      isCustomer: true,
      isSubcontractor: true,
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
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
