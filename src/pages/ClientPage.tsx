import { DataPage, Button, type Column } from '../components';
import { useEffect } from 'react';
import type { ClientItem, PartnerContactItem } from '../types';
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
    { 
      key: 'code', 
      header: TABLE_COLUMNS.CLIENT_ID, 
      sortKey: 'code', 
      editable: true, 
      inputType: 'text',
      rowType: 'main'
    },
    { 
      key: 'name', 
      header: TABLE_COLUMNS.CLIENT_NAME, 
      sortKey: 'yomigana', 
      editable: true, 
      inputType: 'text',
      rowType: 'main'
    },
    { 
      key: 'yomigana', 
      header: TABLE_COLUMNS.YOMIGANA, 
      editable: true, 
      inputType: 'text',
      rowType: 'main'
    },
    { 
      key: 'isCustomer', 
      header: TABLE_COLUMNS.IS_CUSTOMER, 
      editable: true, 
      inputType: 'checkbox',
      rowType: 'main'
    },
    { 
      key: 'isSubcontractor', 
      header: TABLE_COLUMNS.IS_SUBCONTRACTOR, 
      editable: true, 
      inputType: 'checkbox',
      rowType: 'main'
    },
    { 
      key: 'isOther', 
      header: TABLE_COLUMNS.IS_OTHER, 
      editable: true, 
      inputType: 'checkbox',
      rowType: 'main'
    },
    { 
      key: 'contactName', 
      header: '担当者名', 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
      mainRender: (_item, addSubRow) => (
        <Button onClick={addSubRow}>
          ＋ 担当者追加
        </Button>
      )
    },
    { 
      key: 'yomigana', 
      header: TABLE_COLUMNS.YOMIGANA, 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'department', 
      header: '部署', 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'position', 
      header: '役職', 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'contactPhone', 
      header: '直通電話番号', 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'contactFax', 
      header: TABLE_COLUMNS.FAX, 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'email', 
      header: 'メールアドレス', 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    }
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
      id: `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: generateNextUnifiedCode(existingCodes, 'C-'),
      name: '',
      yomigana: '',
      isCustomer: true,
      isSubcontractor: true,
      isOther: false,
      contacts: []
    } as ClientItem;
  };

  const handleAddSubRow = (_parentId: string) => {
    return {
      id: `CNT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      contactName: '',
      yomigana: '',
      department: '',
      position: '',
      contactPhone: '',
      contactFax: '',
      email: ''
    } as PartnerContactItem;
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
      subItemsKey="contacts"
      onAddSubRow={handleAddSubRow}
      hideHeader={true}
    />
  );
}
