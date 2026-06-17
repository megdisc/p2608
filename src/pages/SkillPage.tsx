import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { SkillItem } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { supabase } from '../lib/supabase';

export function SkillPage() {
  const [items, setItems] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('is_deleted', false);
      
      if (error) throw error;
      
      const formatted = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        yomigana: d.yomigana || '',
        description: d.description || ''
      }));
      setItems(formatted);
    } catch (error) {
      console.error(error);
      showAlert('データ取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const columns: Column<SkillItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.SKILL_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: SkillItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        await supabase.from('skills').update({ is_deleted: true }).in('id', deletedIds);
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        id: item.id.startsWith('SKL-') ? undefined : item.id,
        name: item.name,
        yomigana: item.yomigana,
        description: item.description
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('skills').upsert(upserts);
        if (error) throw error;
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchSkills();
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
