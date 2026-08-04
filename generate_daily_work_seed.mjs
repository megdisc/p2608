import fs from 'fs';

const tasks = [
  'aaceaea1-43df-42c1-bfc6-1794a4eb9e16',
  '3334e7a8-684e-4695-a503-5cccdc2b0e50',
  '8daa6b8b-ddb2-462a-9594-1738f004832f',
  'adc26f10-909b-4ae1-b255-a86a5014dd3d',
  '9f95bc37-68fb-43ab-99b0-49eb8d0f500e',
  'b6ed11d0-6084-48d5-bda3-6971fa912e5f',
  'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1',
  'e2d4d8c2-3f1a-4d9c-a123-1b94d1f0e21a',
  '1b8d2b7a-9a6c-4f5c-8b1a-2e3d4f5a6b7c',
  '884d9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d',
  'a1234567-89ab-cdef-0123-456789abcdef',
];

const members = [
  'b362ad61-3ab9-42b3-a53c-1b77f985b85a', // 山田 太郎
  'a1b2c3d4-e5f6-7890-1234-56789abcdef0', // 佐藤 花子
  'e98c7634-1eb3-4e42-b062-841f39c043e0', // 鈴木 一郎
  'f0e9d8c7-b6a5-4321-0987-6543210fedc2', // 高橋 次郎
];

let sql = `\n-- === GENERATED DAILY WORK RECORDS FOR 2026-08 ===\n`;

for (let d = 1; d <= 20; d++) {
  // Let's generate a couple of entries per day for some random members
  const dateStr = `2026-08-${d.toString().padStart(2, '0')}`;
  
  // Pick 2 random members
  const dailyMembers = [members[d % 4], members[(d+1) % 4]];
  
  for (const member_id of dailyMembers) {
    const task_id = tasks[(d + members.indexOf(member_id)) % tasks.length];
    const work_time = (d % 4) + 1; // 1 to 4 hours
    
    sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('${dateStr}', '${member_id}', '${task_id}', ${work_time});\n`;
  }
}

fs.appendFileSync('supabase/seed.sql', sql);
