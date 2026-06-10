import type { ProjectItem } from '../types';

export const mockProjects: ProjectItem[] = [
  {
    id: 'PRJ-2023-001',
    name: '本社オフィスネットワーク構築',
    clientName: '株式会社アルファ',
    status: '進行中',
    startDate: '2023-09-01',
    endDate: '2023-12-31',
    manager: '佐藤健',
  },
  {
    id: 'PRJ-2023-002',
    name: '支社サーバーリプレイス',
    clientName: 'ベータソリューションズ',
    status: '完了',
    startDate: '2023-05-15',
    endDate: '2023-08-20',
    manager: '鈴木花子',
  },
  {
    id: 'PRJ-2023-003',
    name: '新規Webサービス開発支援',
    clientName: 'ガンマテクノロジー',
    status: '進行中',
    startDate: '2023-11-01',
    manager: '高橋次郎',
  },
  {
    id: 'PRJ-2023-004',
    name: '社内基幹システム移行',
    clientName: '株式会社デルタ',
    status: '保留',
    startDate: '2023-10-10',
    manager: '伊藤三郎',
  },
  {
    id: 'PRJ-2024-001',
    name: 'セキュリティ監査と対策実装',
    clientName: '株式会社アルファ',
    status: '計画中',
    startDate: '2024-01-15',
    manager: '佐藤健',
  },
];
