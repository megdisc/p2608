import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StaffItem } from '../types';
import { mockProjectUsers } from '../mocks/projectUsers';
import { useAlert } from '../contexts/AlertContext';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, STAFF_ROLE_OPTIONS } from '../constants';

export function ProjectUserPage() {
  const [items, setItems] = useState<StaffItem[]>(mockProjectUsers);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const columns: Column<StaffItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'role', header: TABLE_COLUMNS.ROLE, editable: true, inputType: 'select', options: STAFF_ROLE_OPTIONS },
    { key: 'email', header: TABLE_COLUMNS.EMAIL, editable: true, inputType: 'email' },
    { key: 'password', header: TABLE_COLUMNS.PASSWORD, editable: true, inputType: 'password' },
  ];

  const handleBatchSave = async (drafts: StaffItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newItems = drafts.filter(item => !deletedIds.includes(item.id));
      setItems(newItems);
      
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `USR-${Date.now()}`,
      name: '',
      yomigana: '',
      email: '',
      password: '',
      role: ''
    } as unknown as StaffItem;
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
