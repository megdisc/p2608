import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { CategoryItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useCategories } from '../hooks';

export function CategoryPage() {
  const { items, loading, fetchCategories, batchSaveCategories } = useCategories();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchCategories().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchCategories, showAlert]);

  const columns: Column<CategoryItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.CATEGORY_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: CategoryItem[], deletedIds: string[]) => {
    try {
      await batchSaveCategories(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `CAT-${Date.now()}`,
      name: '',
      yomigana: '',
      description: ''
    } as CategoryItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.CATEGORY}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_CATEGORY} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
