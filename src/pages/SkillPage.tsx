import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { SkillItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useSkills } from '../hooks';

export function SkillPage() {
  const { items, loading, fetchSkills, batchSaveSkills } = useSkills();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSkills().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchSkills, showAlert]);

  const columns: Column<SkillItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.SKILL_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: SkillItem[], deletedIds: string[]) => {
    try {
      await batchSaveSkills(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `SKL-${Date.now()}`,
      name: '',
      yomigana: '',
      description: '',
    } as SkillItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.SKILL}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_SKILL}
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
