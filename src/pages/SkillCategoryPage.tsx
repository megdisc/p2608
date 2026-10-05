import { DataPage, Button, type Column } from '../components';
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
      sortable: false,
    },
    {
      key: 'description',
      header: TABLE_COLUMNS.DESCRIPTION,
      editable: true,
      inputType: 'text',
      sortable: false,
    },
    {
      key: 'reorder',
      header: TABLE_COLUMNS.REORDER,
      sortable: false,
      render: (item: SkillCategoryItem, draftData: SkillCategoryItem[], updateData?: (newData: SkillCategoryItem[]) => void) => {
        if (!updateData) return null;
        
        const index = draftData.findIndex(d => d.id === item.id);
        
        const handleUp = () => {
          if (index > 0) {
            const newData = [...draftData];
            const temp = newData[index - 1];
            newData[index - 1] = newData[index];
            newData[index] = temp;
            newData.forEach((d, idx) => {
              d.sort_order = idx;
            });
            updateData(newData);
          }
        };

        const handleDown = () => {
          if (index >= 0 && index < draftData.length - 1) {
            const newData = [...draftData];
            const temp = newData[index + 1];
            newData[index + 1] = newData[index];
            newData[index] = temp;
            newData.forEach((d, idx) => {
              d.sort_order = idx;
            });
            updateData(newData);
          }
        };

        return (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <Button onClick={handleUp} disabled={index <= 0} style={{ padding: '4px 8px', minWidth: 'auto' }}>↑</Button>
            <Button onClick={handleDown} disabled={index === -1 || index >= draftData.length - 1} style={{ padding: '4px 8px', minWidth: 'auto' }}>↓</Button>
          </div>
        );
      }
    }
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
      initialSort={{ key: '', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
