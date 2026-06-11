import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { SkillItem } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';

const mockSkills: SkillItem[] = [
  { id: 'SKL-001', name: 'React', yomigana: 'りあくと', description: 'Reactによるフロントエンド開発' },
  { id: 'SKL-002', name: 'TypeScript', yomigana: 'たいぷすくりぷと', description: 'TypeScriptによる静的型付け' },
];

export function SkillPage() {
  const [items, setItems] = useState<SkillItem[]>(mockSkills);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const columns: Column<SkillItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.SKILL_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: SkillItem[], deletedIds: string[]) => {
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
