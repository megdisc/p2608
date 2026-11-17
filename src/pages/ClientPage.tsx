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

  const paymentDayOptions = [
    { value: '', label: '未設定' },
    { value: 'next_99', label: '翌月末日' },
    { value: 'next_10', label: '翌月10日' },
    { value: 'next_15', label: '翌月15日' },
    { value: 'next_20', label: '翌月20日' },
    { value: 'next_25', label: '翌月25日' },
    { value: 'current_99', label: '当月末日' },
    { value: 'current_25', label: '当月25日' },
    { value: 'next_next_10', label: '翌々月10日' },
    { value: 'next_next_99', label: '翌々月末日' },
    ...Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      return { value: `next_${day}`, label: `翌月${day}日` };
    }).filter(o => !['next_10', 'next_15', 'next_20', 'next_25'].includes(o.value))
  ];

  const getPaymentDayLabel = (val?: string | null) => {
    if (!val) return '';
    const opt = paymentDayOptions.find(o => o.value === val);
    return opt ? opt.label : val;
  };

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
      rowType: 'main',
      onCellChange: (val) => {
        if (!val) {
          return { customerPaymentDay: '' };
        } else {
          return { customerPaymentDay: 'next_99' };
        }
      }
    },
    { 
      key: 'isSubcontractor', 
      header: TABLE_COLUMNS.IS_SUBCONTRACTOR, 
      editable: true, 
      inputType: 'checkbox',
      rowType: 'main',
      onCellChange: (val) => {
        if (!val) {
          return { subcontractorPaymentDay: '' };
        } else {
          return { subcontractorPaymentDay: 'next_99' };
        }
      }
    },
    { 
      key: 'isOther', 
      header: TABLE_COLUMNS.IS_OTHER, 
      editable: true, 
      inputType: 'checkbox',
      rowType: 'main'
    },
    { 
      key: 'customerPaymentDay', 
      header: TABLE_COLUMNS.CUSTOMER_PAYMENT_DAY, 
      editable: (item) => Boolean(item.isCustomer),
      inputType: 'select',
      options: paymentDayOptions,
      rowType: 'main',
      render: (item) => item.isCustomer ? (getPaymentDayLabel(item.customerPaymentDay) || '-') : '-'
    },
    { 
      key: 'subcontractorPaymentDay', 
      header: TABLE_COLUMNS.SUBCONTRACTOR_PAYMENT_DAY, 
      editable: (item) => Boolean(item.isSubcontractor),
      inputType: 'select',
      options: paymentDayOptions,
      rowType: 'main',
      render: (item) => item.isSubcontractor ? (getPaymentDayLabel(item.subcontractorPaymentDay) || '-') : '-'
    },
    { 
      key: 'contactName', 
      header: TABLE_COLUMNS.CONTACT_NAME, 
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
      header: TABLE_COLUMNS.DEPARTMENT, 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'position', 
      header: TABLE_COLUMNS.POSITION, 
      editable: true, 
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'contactPhone', 
      header: TABLE_COLUMNS.DIRECT_PHONE, 
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
      header: TABLE_COLUMNS.EMAIL, 
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
      customerPaymentDay: 'next_99',
      subcontractorPaymentDay: 'next_99',
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
