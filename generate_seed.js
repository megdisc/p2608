const fs = require('fs');

const tasks = [
  'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', // 要件定義
  '3334e7a8-684e-4695-a503-5cccdc2b0e50', // 基本・詳細設計
  '8daa6b8b-ddb2-462a-9594-1738f004832f', // 構築・テスト
  'adc26f10-909b-4ae1-b255-a86a5014dd3d', // サーバー構築
  '9f95bc37-68fb-43ab-99b0-49eb8d0f500e', // UI/UXデザイン
  'b6ed11d0-6084-48d5-bda3-6971fa912e5f', // フロントエンド実装
  'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', // データ移行計画
  'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a', // 製造業務
  '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c', // 販売・接客業務
  '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', // マニュアル作成
  'a1234567-89ab-cdef-0123-456789abcdef', // 保守運用業務
];

const members = [
  'b362ad61-3ab9-42b3-a53c-1b77f985b85a', // 山田 太郎
  'a1b2c3d4-e5f6-7890-1234-56789abcdef0', // 佐藤 花子
  'e98c7634-1eb3-4e42-b062-841f39c043e0', // 鈴木 一郎
  'f0e9d8c7-b6a5-4321-0987-6543210fedc2', // 高橋 次郎
];

let sql = `\n-- === COMPREHENSIVE GENERATED SEED DATA FOR 2026-06 to 2026-08 ===\n`;

const months = ['2026-06', '2026-07', '2026-08'];

tasks.forEach((t, i) => {
  months.forEach((m, j) => {
    // Generate some status: mix of in_progress, completed, canceled
    let status = 'in_progress';
    if (j === 1 && i % 3 === 0) status = 'completed'; // some complete in July
    if (j === 2 && i % 4 === 0) status = 'canceled'; // some cancel in Aug
    if (j === 2 && status === 'in_progress') status = 'completed'; // complete rest in Aug
    
    // override to make it interesting
    if (i === 1 && j === 2) status = 'completed'; 
    if (i === 2 && j === 2) status = 'canceled';
    if (j > 0 && sql.includes(`VALUES ('${months[j-1]}', '${t}', 'completed')`)) status = 'completed';
    if (j > 0 && sql.includes(`VALUES ('${months[j-1]}', '${t}', 'canceled')`)) status = 'canceled';
    
    sql += `INSERT INTO monthly_task_progress (year_month, task_id, status) VALUES ('${m}', '${t}', '${status}') ON CONFLICT (year_month, task_id) DO UPDATE SET status = EXCLUDED.status;\n`;

    // Add contributions
    if (status === 'in_progress' || (status === 'completed' && !sql.includes(`VALUES ('${months[j-1]}', '${t}', 'completed')`))) {
       const mem1 = members[i % members.length];
       const mem2 = members[(i+1) % members.length];
       const amount1 = (i + 1) * 10000;
       const amount2 = (i + 1) * 5000;
       
       sql += `INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('${m}', '${mem1}', '${t}', 60, ${amount1}) ON CONFLICT (year_month, member_id, task_id) DO UPDATE SET deduction_amount = EXCLUDED.deduction_amount;\n`;
       sql += `INSERT INTO monthly_member_contributions (year_month, member_id, task_id, contribution_ratio, deduction_amount) VALUES ('${m}', '${mem2}', '${t}', 40, ${amount2}) ON CONFLICT (year_month, member_id, task_id) DO UPDATE SET deduction_amount = EXCLUDED.deduction_amount;\n`;
    }
  });
});

fs.appendFileSync('supabase/seed.sql', sql);
