import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts';
import { useBaseWageAssignments } from '../hooks';
import type { MemberItem } from '../types';

export function BaseWageAssignmentPage() {
  const { items, baseWages, loading, fetchAssignments, batchSaveAssignments } = useBaseWageAssignments();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchAssignments().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchAssignments, showAlert]);

  const columns: Column<MemberItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.NAME, editable: false, inputType: 'text' },
    { 
      key: 'baseWageId', 
      header: TABLE_COLUMNS.BASE_WAGE, 
      editable: true, 
      inputType: 'radio',
      options: baseWages.map(w => ({ label: `¥${w.wage.toLocaleString()}`, value: w.id }))
    },
  ];

  const handleBatchSave = async (drafts: MemberItem[], _deletedIds: string[]) => {
    try {
      await batchSaveAssignments(drafts);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.BASE_WAGE_ASSIGNMENT}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_BASE_WAGE_ASSIGNMENT}
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
    />
  );
}
