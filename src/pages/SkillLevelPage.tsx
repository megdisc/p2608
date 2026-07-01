import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { SkillLevelItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useSkillLevels } from '../hooks';

export function SkillLevelPage() {
  const { items, loading, fetchSkillLevels, batchSaveSkillLevels } = useSkillLevels();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSkillLevels().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchSkillLevels, showAlert]);

  const columns: Column<SkillLevelItem>[] = [
    { 
      key: 'levelValue', 
      header: TABLE_COLUMNS.SKILL_LEVEL,
    },
    { key: 'name', header: TABLE_COLUMNS.SKILL_LEVEL_NAME, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: SkillLevelItem[], deletedIds: string[]) => {
    try {
      await batchSaveSkillLevels(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = (currentData: SkillLevelItem[] = []) => {
    const maxLevel = currentData.length > 0 ? Math.max(...currentData.map(i => i.levelValue || 0)) : 0;
    return {
      id: `SKL-L-${Date.now()}`,
      levelValue: maxLevel + 1,
      name: '',
      description: '',
    } as SkillLevelItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.SKILL_LEVEL}
      data={items}
      columns={columns}
      emptyMessage="スキルレベルが登録されていません。"
      initialSort={{ key: 'levelValue', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
