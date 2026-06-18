import fs from 'fs';

const member1 = 'b362ad61-3ab9-42b3-a53c-1b77f985b85a'; // 江口 春奈
const member2 = 'e98c7634-1eb3-4e42-b062-841f39c043e0'; // 大西 智也

const member1Tasks = [
  'aaceaea1-43df-42c1-bfc6-1794a4eb9e16',
  '9f95bc37-68fb-43ab-99b0-49eb8d0f500e',
  'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1'
];

const member2Tasks = [
  '8daa6b8b-ddb2-462a-9594-1738f004832f',
  'b6ed11d0-6084-48d5-bda3-6971fa912e5f',
  'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1'
];

const sharedTask = 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1';

let sql = '\n-- Additional Progress Records\n';

// 2026-05
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-05', '${member1}', '${member1Tasks[0]}', 10, 100);\n`;
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-05', '${member1}', '${member1Tasks[1]}', 20, 100);\n`;

// Shared Task 2026-05
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-05', '${member1}', '${sharedTask}', 15, 40);\n`;
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-05', '${member2}', '${sharedTask}', 15, 60);\n`;

sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-05', '${member2}', '${member2Tasks[0]}', 30, 100);\n`;
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-05', '${member2}', '${member2Tasks[1]}', 40, 100);\n`;

// 2026-06
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-06', '${member1}', '${member1Tasks[0]}', 50, 100);\n`;
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-06', '${member1}', '${member1Tasks[1]}', 100, 100);\n`;

// Shared Task 2026-06
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-06', '${member1}', '${sharedTask}', 80, 50);\n`;
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-06', '${member2}', '${sharedTask}', 80, 50);\n`;

sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-06', '${member2}', '${member2Tasks[0]}', 100, 100);\n`;
sql += `INSERT INTO monthly_progress_records (year_month, member_id, task_id, current_progress, contribution_ratio) VALUES ('2026-06', '${member2}', '${member2Tasks[1]}', 70, 100);\n`;

fs.appendFileSync('supabase/seed.sql', sql);
console.log('Appended progress records seed data to seed.sql');
