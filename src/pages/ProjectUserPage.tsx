import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { MemberItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, MEMBER_ROLE_OPTIONS } from '../constants';
import { useMembers } from '../hooks';
import { generateNextCode } from '../utils';

export function ProjectUserPage() {
  const { items, lastDbCode, loading, fetchMembers, batchSaveMembers } = useMembers();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMembers().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchMembers, showAlert]);

  const columns: Column<MemberItem>[] = [
    { key: 'code', header: TABLE_COLUMNS.MEMBER_ID, sortKey: 'code', editable: true, inputType: 'text' },
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
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = (currentDrafts?: MemberItem[]) => {
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
      id: `MBR-${Date.now()}-${Math.random()}`,
      code: generateNextCode(baseCode, 'M-'),
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
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
