import { DataPage, type Column, Button } from '../components';
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
      sortable: false
    },
    { key: 'name', header: TABLE_COLUMNS.SKILL_LEVEL_NAME, editable: true, inputType: 'text', sortable: false },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text', sortable: false },
    {
      key: 'reorder',
      header: '順序変更',
      sortable: false,
      render: (item: SkillLevelItem, draftData: SkillLevelItem[], updateData?: (newData: SkillLevelItem[]) => void) => {
        if (!updateData) return null;
        
        const sortedData = [...draftData].sort((a, b) => (a.levelValue || 0) - (b.levelValue || 0));
        const index = sortedData.findIndex(d => d.id === item.id);
        
        const handleUp = () => {
          if (index > 0) {
            const prevItem = sortedData[index - 1];
            const newLevel = prevItem.levelValue;
            const oldLevel = item.levelValue;
            
            const newData = draftData.map(d => {
              if (d.id === item.id) return { ...d, levelValue: newLevel };
              if (d.id === prevItem.id) return { ...d, levelValue: oldLevel };
              return d;
            });
            updateData(newData);
          }
        };

        const handleDown = () => {
          if (index >= 0 && index < sortedData.length - 1) {
            const nextItem = sortedData[index + 1];
            const newLevel = nextItem.levelValue;
            const oldLevel = item.levelValue;
            
            const newData = draftData.map(d => {
              if (d.id === item.id) return { ...d, levelValue: newLevel };
              if (d.id === nextItem.id) return { ...d, levelValue: oldLevel };
              return d;
            });
            updateData(newData);
          }
        };

        return (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <Button onClick={handleUp} disabled={index <= 0} style={{ padding: '4px 8px', minWidth: 'auto' }}>↑</Button>
            <Button onClick={handleDown} disabled={index === -1 || index >= sortedData.length - 1} style={{ padding: '4px 8px', minWidth: 'auto' }}>↓</Button>
          </div>
        );
      }
    }
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
