import { DataPage, Button, type Column } from '../components';
import { useEffect } from 'react';
import type { ClientItem, PartnerContactItem } from '../types';
import { useAlert } from '../contexts';
import {
  TABLE_COLUMNS,
  PAGE_NAMES,
  MESSAGES,
  CLOSING_DAY_STRING_OPTIONS,
  CLOSING_MONTH_TYPE_OPTIONS,
  formatClosingDay,
  formatClosingMonthType,
} from '../constants';
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
      rowType: 'main',
      onCellChange: (val) => {
        if (!val) {
          return { customerPaymentMonthType: null, customerPaymentDay: null };
        } else {
          return { customerPaymentMonthType: 'next', customerPaymentDay: 99 };
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
          return { subcontractorPaymentMonthType: null, subcontractorPaymentDay: null };
        } else {
          return { subcontractorPaymentMonthType: 'next', subcontractorPaymentDay: 99 };
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
      key: 'customerPaymentMonthType', 
      header: TABLE_COLUMNS.CUSTOMER_PAYMENT_MONTH, 
      editable: (item) => Boolean(item.isCustomer),
      inputType: 'select',
      options: CLOSING_MONTH_TYPE_OPTIONS,
      rowType: 'main',
      render: (item) => item.isCustomer ? formatClosingMonthType(item.customerPaymentMonthType) : '-'
    },
    { 
      key: 'customerPaymentDay', 
      header: TABLE_COLUMNS.CUSTOMER_PAYMENT_DAY, 
      editable: (item) => Boolean(item.isCustomer),
      inputType: 'select',
      options: CLOSING_DAY_STRING_OPTIONS,
      rowType: 'main',
      render: (item) => item.isCustomer ? formatClosingDay(item.customerPaymentDay) : '-'
    },
    { 
      key: 'subcontractorPaymentMonthType', 
      header: TABLE_COLUMNS.SUBCONTRACTOR_PAYMENT_MONTH, 
      editable: (item) => Boolean(item.isSubcontractor),
      inputType: 'select',
      options: CLOSING_MONTH_TYPE_OPTIONS,
      rowType: 'main',
      render: (item) => item.isSubcontractor ? formatClosingMonthType(item.subcontractorPaymentMonthType) : '-'
    },
    { 
      key: 'subcontractorPaymentDay', 
      header: TABLE_COLUMNS.SUBCONTRACTOR_PAYMENT_DAY, 
      editable: (item) => Boolean(item.isSubcontractor),
      inputType: 'select',
      options: CLOSING_DAY_STRING_OPTIONS,
      rowType: 'main',
      render: (item) => item.isSubcontractor ? formatClosingDay(item.subcontractorPaymentDay) : '-'
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
      customerPaymentMonthType: 'next',
      customerPaymentDay: 99,
      subcontractorPaymentMonthType: 'next',
      subcontractorPaymentDay: 99,
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
