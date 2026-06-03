import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { UnitItem } from '../types';
import { supabase } from '../lib/supabase';

export function UnitPage() {
  const [items, setItems] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('units').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<UnitItem>[] = [
    { key: 'name', header: '単位名', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = (drafts: UnitItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('UI上での保存を反映しました。（※DB更新処理は未実装）');
  };

  const handleAdd = () => {
    return {
      id: `UNIT-${Date.now()}`,
      name: '',
      description: ''
    } as UnitItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title="単位設定"
      data={items} 
      columns={columns} 
      emptyMessage="単位データがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
