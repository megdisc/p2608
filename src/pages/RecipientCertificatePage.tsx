import { useState, useEffect } from 'react';
import { DataPage, Button, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import {
  MESSAGES,
  TABLE_COLUMNS,
  BUTTON_LABELS,
  INCOME_CATEGORY_OPTIONS,
  DISABILITY_CLASS_OPTIONS,
  COPAYMENT_MGMT_OPTIONS,
  WORDS_COMMON,
} from '../constants';
import { useRecipientCertificates, type MemberRecipientCertificateGridRow } from '../hooks/useRecipientCertificates';
import { recomputeHistoryPeriods } from '../utils';
import type { MemberRecipientCertificateItem } from '../types';
import type { OfficeTableItem } from '../types/db';

export function RecipientCertificatePage() {
  const { items, loading, fetchCertificates, batchSaveCertificates } = useRecipientCertificates();
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchCertificates().catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });

    supabase
      .from('offices')
      .select('*')
      .eq('is_deleted', false)
      .order('code', { ascending: true })
      .then(({ data }) => {
        if (data) setOffices(data);
      });
  }, [fetchCertificates, showAlert]);

  const officeOptions = [
    { label: WORDS_COMMON.UNSELECTED, value: WORDS_COMMON.EMPTY_VALUE },
    ...offices.map(o => ({ label: o.short_name || o.name, value: o.id }))
  ];

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: TABLE_COLUMNS.MEMBER_ID,
      sortKey: 'code',
      editable: false,
      rowType: 'main',
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.NAME,
      sortKey: 'yomigana',
      editable: false,
      rowType: 'main',
    },
    {
      key: 'certificateNumber',
      header: TABLE_COLUMNS.CERTIFICATE_NUMBER,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
      mainRender: (_item, addSubRow) => (
        <Button onClick={addSubRow}>
          {BUTTON_LABELS.ADD_CERTIFICATE}
        </Button>
      ),
    },
    {
      key: 'issuingMunicipality',
      header: TABLE_COLUMNS.ISSUING_MUNICIPALITY,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'incomeCategory',
      header: TABLE_COLUMNS.INCOME_CATEGORY,
      editable: true,
      inputType: 'select',
      options: INCOME_CATEGORY_OPTIONS,
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentLimitAmount',
      header: TABLE_COLUMNS.COPAYMENT_LIMIT_AMOUNT,
      editable: true,
      inputType: 'number',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'disabilitySupportClass',
      header: TABLE_COLUMNS.DISABILITY_SUPPORT_CLASS,
      editable: true,
      inputType: 'select',
      options: DISABILITY_CLASS_OPTIONS,
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentManagementType',
      header: TABLE_COLUMNS.COPAYMENT_MANAGEMENT_TYPE,
      editable: true,
      inputType: 'select',
      options: COPAYMENT_MGMT_OPTIONS,
      rowType: 'sub',
      sortable: false,
      onCellChange: (value: any) => {
        if (value === 'self_internal') {
          return { copaymentOfficeCode: '', copaymentOfficeName: '' };
        } else if (value === 'other') {
          return { copaymentOfficeId: null };
        } else {
          return { copaymentOfficeId: null, copaymentOfficeCode: '', copaymentOfficeName: '' };
        }
      },
    },
    {
      key: 'copaymentOfficeId',
      header: TABLE_COLUMNS.SELF_COPAYMENT_OFFICE,
      editable: (cert: any) => cert.copaymentManagementType === 'self_internal',
      inputType: 'select',
      options: officeOptions,
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentOfficeCode',
      header: TABLE_COLUMNS.OTHER_CORP_OFFICE_NUMBER,
      editable: (cert: any) => cert.copaymentManagementType === 'other',
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentOfficeName',
      header: TABLE_COLUMNS.OTHER_CORP_OFFICE_NAME,
      editable: (cert: any) => cert.copaymentManagementType === 'other',
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'validFrom',
      header: TABLE_COLUMNS.VALID_FROM,
      editable: true,
      inputType: 'date',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'validTo',
      header: TABLE_COLUMNS.VALID_TO,
      editable: true,
      inputType: 'date',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'remarks',
      header: TABLE_COLUMNS.REMARKS,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
  ];

  const handleBatchSave = async (drafts: MemberRecipientCertificateGridRow[], deletedIds: string[]) => {
    try {
      await batchSaveCertificates(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAddSubRow = (_parentId: string) => {
    const today = new Date().toISOString().substring(0, 10);

    return {
      id: `CRT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      certificateNumber: '',
      issuingMunicipality: '',
      incomeCategory: 'welfare',
      copaymentLimitAmount: 0,
      disabilitySupportClass: 'none',
      copaymentManagementType: 'self_internal',
      copaymentOfficeId: null,
      copaymentOfficeCode: '',
      copaymentOfficeName: '',
      validFrom: today,
      validTo: '',
      remarks: '',
    } as MemberRecipientCertificateItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="受給者証"
      data={items}
      columns={columns}
      emptyMessage="利用者が登録されていません。"
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      subItemsKey="certificates"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={(subItems, _parent, deletedIds) =>
        recomputeHistoryPeriods(subItems, { fromKey: 'validFrom', toKey: 'validTo', deletedIds })
      }
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
