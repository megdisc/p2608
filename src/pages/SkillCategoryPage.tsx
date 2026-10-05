import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { SkillCategoryItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useSkillCategories } from '../hooks';

export function SkillCategoryPage() {
  const { categories, loading, fetchCategories, batchSaveCategories } = useSkillCategories();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchCategories(selectedOfficeId).catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchCategories, selectedOfficeId, showAlert]);

  const columns: Column<SkillCategoryItem>[] = [
    {
      key: 'name',
      header: TABLE_COLUMNS.CATEGORY_NAME,
      editable: true,
      inputType: 'text',
      sortable: true,
    },
    {
      key: 'description',
      header: TABLE_COLUMNS.DESCRIPTION,
      editable: true,
      inputType: 'text',
      sortable: false,
    },
  ];

  const handleBatchSave = async (drafts: SkillCategoryItem[], deletedIds: string[]) => {
    try {
      await batchSaveCategories(drafts, deletedIds, selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `CAT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: '',
      description: '',
    } as SkillCategoryItem;
  };

  if (loading && categories.length === 0) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.SKILL_CATEGORY}
      data={categories}
      columns={columns}
      emptyMessage="カテゴリが登録されていません。"
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
