import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { StaffItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, STAFF_ROLE_OPTIONS, WORDS_PERSON } from '../constants';
import { useStaffs } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function StaffPage() {
  const { items, loading, fetchStaffs, batchSaveStaffs } = useStaffs();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchStaffs().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchStaffs, showAlert]);

  const columns: Column<StaffItem>[] = [
    { key: 'code', header: TABLE_COLUMNS.STAFF_ID, sortKey: 'code', editable: true, inputType: 'text' },
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
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: StaffItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    return {
      id: `STF-${Date.now()}-${Math.random()}`,
      code: generateNextUnifiedCode(existingCodes, 'S-'),
      name: '',
      yomigana: '',
      email: '',
      password: '',
      role: WORDS_PERSON.ROLE_STAFF
    } as unknown as StaffItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.STAFF}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_STAFF}
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
