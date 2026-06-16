import type { ProjectItem } from '../types';

export const mockProjects: ProjectItem[] = [
  {
    id: 'PRJ-2023-001',
    name: '本社オフィスネットワーク構築',
    yomigana: 'ほんしゃおふぃすねっとわーくこうちく',
    deliveryDate: '2023-12-31',
    tasks: [
      {
        id: 'PRJ-2023-001-TASK-1',
        task: '要件定義',
        requiredSkills: [
          { id: 'PRJ-2023-001-TASK-1-SKILL-1', skill: 'ネットワーク設計' },
          { id: 'PRJ-2023-001-TASK-1-SKILL-2', skill: 'Cisco' }
        ]
      },
      {
        id: 'PRJ-2023-001-TASK-2',
        task: '基本・詳細設計',
        requiredSkills: [
          { id: 'PRJ-2023-001-TASK-2-SKILL-1', skill: 'ネットワーク設計' },
          { id: 'PRJ-2023-001-TASK-2-SKILL-2', skill: 'Cisco' }
        ]
      },
      {
        id: 'PRJ-2023-001-TASK-3',
        task: '構築・テスト',
        requiredSkills: [
          { id: 'PRJ-2023-001-TASK-3-SKILL-1', skill: 'Cisco' },
          { id: 'PRJ-2023-001-TASK-3-SKILL-2', skill: 'Linux' }
        ]
      }
    ],
  },
  {
    id: 'PRJ-2023-002',
    name: '支社サーバーリプレイス',
    yomigana: 'ししゃさーばーりぷれいす',
    deliveryDate: '2023-08-20',
    tasks: [
      {
        id: 'PRJ-2023-002-TASK-1',
        task: 'サーバー構築',
        requiredSkills: [
          { id: 'PRJ-2023-002-TASK-1-SKILL-1', skill: 'Linux' },
          { id: 'PRJ-2023-002-TASK-1-SKILL-2', skill: 'Windows Server' }
        ]
      }
    ],
  },
  {
    id: 'PRJ-2023-003',
    name: '新規Webサービス開発支援',
    yomigana: 'しんきうぇぶさーびすかいはつしえん',
    deliveryDate: '2024-03-31',
    tasks: [
      {
        id: 'PRJ-2023-003-TASK-1',
        task: 'UI/UXデザイン',
        requiredSkills: [
          { id: 'PRJ-2023-003-TASK-1-SKILL-1', skill: 'React' },
          { id: 'PRJ-2023-003-TASK-1-SKILL-2', skill: 'TypeScript' },
          { id: 'PRJ-2023-003-TASK-1-SKILL-3', skill: 'Figma' }
        ]
      }
    ],
  },
  {
    id: 'PRJ-2023-004',
    name: '社内基幹システム移行',
    yomigana: 'しゃないきかんしすてむいこう',
    deliveryDate: '2024-06-30',
    tasks: [
      {
        id: 'PRJ-2023-004-TASK-1',
        task: 'データ移行計画',
        requiredSkills: [
          { id: 'PRJ-2023-004-TASK-1-SKILL-1', skill: 'Oracle' },
          { id: 'PRJ-2023-004-TASK-1-SKILL-2', skill: 'PL/SQL' },
          { id: 'PRJ-2023-004-TASK-1-SKILL-3', skill: 'Python' }
        ]
      }
    ],
  },
  {
    id: 'PRJ-2024-001',
    name: 'セキュリティ監査と対策実装',
    yomigana: 'せきゅりてぃかんさとたいさくじっそう',
    deliveryDate: '2024-04-15',
    tasks: [
      {
        id: 'PRJ-2024-001-TASK-1',
        task: '脆弱性診断',
        requiredSkills: [
          { id: 'PRJ-2024-001-TASK-1-SKILL-1', skill: 'セキュリティ監査' },
          { id: 'PRJ-2024-001-TASK-1-SKILL-2', skill: 'ペネトレーションテスト' }
        ]
      },
      {
        id: 'PRJ-2024-001-TASK-2',
        task: '対策実装',
        requiredSkills: [
          { id: 'PRJ-2024-001-TASK-2-SKILL-1', skill: 'Linux' },
          { id: 'PRJ-2024-001-TASK-2-SKILL-2', skill: 'Windows Server' }
        ]
      },
      {
        id: 'PRJ-2024-001-TASK-3',
        task: '再診断・完了報告',
        requiredSkills: [
          { id: 'PRJ-2024-001-TASK-3-SKILL-1', skill: 'セキュリティ監査' }
        ]
      }
    ],
  },
];
