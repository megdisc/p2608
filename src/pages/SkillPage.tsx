import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { SkillItem } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';

const mockSkills: SkillItem[] = [
  { id: 'SKL-001', name: 'ネットワーク設計', yomigana: 'ねっとわーくせっけい', description: 'ネットワーク構成の設計・構築' },
  { id: 'SKL-002', name: 'Cisco', yomigana: 'しすこ', description: 'Cisco製ネットワーク機器の設定・管理' },
  { id: 'SKL-003', name: 'Linux', yomigana: 'りなっくす', description: 'Linuxサーバーの構築・運用' },
  { id: 'SKL-004', name: 'Windows Server', yomigana: 'うぃんどうずさーばー', description: 'Windows Serverの構築・運用' },
  { id: 'SKL-005', name: 'React', yomigana: 'りあくと', description: 'Reactによるフロントエンド開発' },
  { id: 'SKL-006', name: 'TypeScript', yomigana: 'たいぷすくりぷと', description: 'TypeScriptによる静的型付け' },
  { id: 'SKL-007', name: 'Figma', yomigana: 'ふぃぐま', description: 'Figmaを用いたUI/UXデザイン' },
  { id: 'SKL-008', name: 'Oracle', yomigana: 'おらくる', description: 'Oracle Databaseの設計・運用' },
  { id: 'SKL-009', name: 'PL/SQL', yomigana: 'ぴーえるえすきゅーえる', description: 'PL/SQLによるデータベースプログラミング' },
  { id: 'SKL-010', name: 'Python', yomigana: 'ぱいそん', description: 'Pythonによるバックエンド開発・データ処理' },
  { id: 'SKL-011', name: 'セキュリティ監査', yomigana: 'せきゅりてぃかんさ', description: '情報セキュリティの監査・評価' },
  { id: 'SKL-012', name: 'ペネトレーションテスト', yomigana: 'ぺねとれーしょんてすと', description: 'システムへの侵入テスト' },
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
