import { useState, useEffect } from 'react';
import { DataPage, Button, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useRecipientCertificates, type MemberRecipientCertificateGridRow } from '../hooks/useRecipientCertificates';
import type { MemberRecipientCertificateItem } from '../types';
import type { OfficeTableItem } from '../types/db';

const INCOME_CATEGORY_OPTIONS = [
  { label: '生活保護', value: 'welfare' },
  { label: '低所得', value: 'low_income' },
  { label: '一般1', value: 'general_1' },
  { label: '一般2', value: 'general_2' },
];

const DISABILITY_CLASS_OPTIONS = [
  { label: '区分なし', value: 'none' },
  { label: '区分1', value: 'class_1' },
  { label: '区分2', value: 'class_2' },
  { label: '区分3', value: 'class_3' },
  { label: '区分4', value: 'class_4' },
  { label: '区分5', value: 'class_5' },
  { label: '区分6', value: 'class_6' },
];

const COPAYMENT_MGMT_OPTIONS = [
  { label: '自法人内管理', value: 'self_internal' },
  { label: '他法人管理', value: 'other' },
  { label: '管理なし', value: 'none' },
];

export function RecipientCertificatePage() {
  const { items, loading, fetchCertificates, batchSaveCertificates } = useRecipientCertificates();
  const [offices, setOffices] = useState<OfficeTableItem[]>([]);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchCertificates().catch(() => {
      showAlert('受給者証データの取得に失敗しました', 'error');
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
    { label: '（未選択）', value: '' },
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
      header: '受給者証番号',
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
      mainRender: (_item, addSubRow) => (
        <Button onClick={addSubRow}>
          ＋ 受給者証追加
        </Button>
      ),
    },
    {
      key: 'issuingMunicipality',
      header: '交付市町村',
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'incomeCategory',
      header: '所得階層区分',
      editable: true,
      inputType: 'select',
      options: INCOME_CATEGORY_OPTIONS,
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentLimitAmount',
      header: '負担上限月額（円）',
      editable: true,
      inputType: 'number',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'disabilitySupportClass',
      header: '障害支援区分',
      editable: true,
      inputType: 'select',
      options: DISABILITY_CLASS_OPTIONS,
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentManagementType',
      header: '上限額管理区分',
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
      header: '管理自事業所',
      editable: (cert: any) => cert.copaymentManagementType === 'self_internal',
      inputType: 'select',
      options: officeOptions,
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentOfficeCode',
      header: '他法人事業所番号',
      editable: (cert: any) => cert.copaymentManagementType === 'other',
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'copaymentOfficeName',
      header: '他法人事業所名',
      editable: (cert: any) => cert.copaymentManagementType === 'other',
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'validFrom',
      header: '支給決定開始日',
      editable: true,
      inputType: 'date',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'validTo',
      header: '支給決定終了日',
      editable: true,
      inputType: 'date',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'remarks',
      header: '備考',
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
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10);

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
      validTo: nextYear,
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
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
