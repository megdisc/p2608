import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { CategoryItem } from '../types';
import { supabase } from '../lib/supabase';

export function CategoryPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('categories').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<CategoryItem>[] = [
    { key: 'name', header: 'カテゴリ名', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = (drafts: CategoryItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('UI上での保存を反映しました。（※DB更新処理は未実装）');
  };

  const handleAdd = () => {
    return {
      id: `CAT-${Date.now()}`,
      name: '',
      description: ''
    } as CategoryItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title="カテゴリ設定"
      data={items} 
      columns={columns} 
      emptyMessage="カテゴリデータがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
