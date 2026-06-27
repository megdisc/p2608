import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { MemberItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, MEMBER_ROLE_OPTIONS } from '../constants';
import { useMembers } from '../hooks';

export function ProjectUserPage() {
  const { items, loading, fetchMembers, batchSaveMembers } = useMembers();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMembers().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchMembers, showAlert]);

  const columns: Column<MemberItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'role', header: TABLE_COLUMNS.ROLE, editable: true, inputType: 'radio', options: MEMBER_ROLE_OPTIONS },
    { key: 'email', header: TABLE_COLUMNS.EMAIL, editable: true, inputType: 'email' },
    { key: 'password', header: TABLE_COLUMNS.PASSWORD, editable: true, inputType: 'password' },
  ];

  const handleBatchSave = async (drafts: MemberItem[], deletedIds: string[]) => {
    try {
      await batchSaveMembers(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `MBR-${Date.now()}`,
      name: '',
      yomigana: '',
      email: '',
      password: '',
      role: '利用者'
    } as MemberItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.PROJECT_USER}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_PROJECT_USER}
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
