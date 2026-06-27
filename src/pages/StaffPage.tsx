import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { StaffItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, STAFF_ROLE_OPTIONS } from '../constants';
import { useStaffs } from '../hooks';

export function StaffPage() {
  const { items, loading, fetchStaffs, batchSaveStaffs } = useStaffs();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchStaffs().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchStaffs, showAlert]);

  const columns: Column<StaffItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'role', header: TABLE_COLUMNS.ROLE, editable: true, inputType: 'radio', options: STAFF_ROLE_OPTIONS },
    { key: 'email', header: TABLE_COLUMNS.EMAIL, editable: true, inputType: 'email' },
    { key: 'password', header: TABLE_COLUMNS.PASSWORD, editable: true, inputType: 'password' },
  ];

  const handleBatchSave = async (drafts: StaffItem[], deletedIds: string[]) => {
    try {
      await batchSaveStaffs(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `STF-${Date.now()}`,
      name: '',
      yomigana: '',
      email: '',
      password: '',
      role: '職員'
    } as unknown as StaffItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.STAFF}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_STAFF}
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
