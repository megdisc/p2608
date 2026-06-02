import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StaffItem } from '../types';
import { db } from '../mock';

export function StaffPage() {
  const [items] = useState<StaffItem[]>(db.staff);

  const columns: Column<StaffItem>[] = [
    { key: 'name', header: '氏名' },
    { key: 'role', header: '権限ロール' },
    { 
      key: 'status', 
      header: 'ステータス',
      render: (item) => item.status === 'active' ? '有効' : '無効' 
    },
  ];

  return (
    <DataPage 
      title="スタッフ設定"
      data={items} 
      columns={columns} 
      emptyMessage="スタッフデータがありません" 
    />
  );
}
