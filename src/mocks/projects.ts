import type { ProjectItem } from '../types';

export const mockProjects: ProjectItem[] = [
  {
    id: 'PRJ-2023-001',
    name: '本社オフィスネットワーク構築',
    yomigana: 'ほんしゃおふぃすねっとわーくこうちく',
    deliveryDate: '2023-12-31',
    estimatedRevenue: 5000000,
    tasks: [
      {
        id: 'PRJ-2023-001-TASK-1',
        task: '要件定義',
        requiredSkills: 'ネットワーク設計, Cisco',
        estimatedIncentive: 100000,
      }
    ],
  },
  {
    id: 'PRJ-2023-002',
    name: '支社サーバーリプレイス',
    yomigana: 'ししゃさーばーりぷれいす',
    deliveryDate: '2023-08-20',
    estimatedRevenue: 3500000,
    tasks: [
      {
        id: 'PRJ-2023-002-TASK-1',
        task: 'サーバー構築',
        requiredSkills: 'Linux, Windows Server',
        estimatedIncentive: 70000,
      }
    ],
  },
  {
    id: 'PRJ-2023-003',
    name: '新規Webサービス開発支援',
    yomigana: 'しんきうぇぶさーびすかいはつしえん',
    deliveryDate: '2024-03-31',
    estimatedRevenue: 12000000,
    tasks: [
      {
        id: 'PRJ-2023-003-TASK-1',
        task: 'UI/UXデザイン',
        requiredSkills: 'React, TypeScript, Figma',
        estimatedIncentive: 240000,
      }
    ],
  },
  {
    id: 'PRJ-2023-004',
    name: '社内基幹システム移行',
    yomigana: 'しゃないきかんしすてむいこう',
    deliveryDate: '2024-06-30',
    estimatedRevenue: 25000000,
    tasks: [
      {
        id: 'PRJ-2023-004-TASK-1',
        task: 'データ移行計画',
        requiredSkills: 'Oracle, PL/SQL, Python',
        estimatedIncentive: 500000,
      }
    ],
  },
  {
    id: 'PRJ-2024-001',
    name: 'セキュリティ監査と対策実装',
    yomigana: 'せきゅりてぃかんさとたいさくじっそう',
    deliveryDate: '2024-04-15',
    estimatedRevenue: 4000000,
    tasks: [
      {
        id: 'PRJ-2024-001-TASK-1',
        task: '脆弱性診断',
        requiredSkills: 'セキュリティ監査, ペネトレーションテスト',
        estimatedIncentive: 80000,
      }
    ],
  },
];
