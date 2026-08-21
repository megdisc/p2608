import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { ClientItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useClients } from '../hooks';
import { generateNextCode } from '../utils';

export function ClientPage() {
  const { items, lastDbCode, loading, fetchClients, batchSaveClients } = useClients();
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
    { key: 'contactPerson', header: TABLE_COLUMNS.CONTACT_PERSON, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: ClientItem[], deletedIds: string[]) => {
    try {
      await batchSaveClients(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = (currentDrafts?: ClientItem[]) => {
    let lastDraftCode: string | null = null;
    if (currentDrafts && currentDrafts.length > 0) {
      for (let i = currentDrafts.length - 1; i >= 0; i--) {
        if (currentDrafts[i].code && currentDrafts[i].code!.trim() !== '') {
          lastDraftCode = currentDrafts[i].code!.trim();
          break;
        }
      }
    }
    const baseCode = lastDraftCode || lastDbCode;

    return {
      id: `CLI-${Date.now()}-${Math.random()}`,
      code: generateNextCode(baseCode, 'C-'),
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
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
