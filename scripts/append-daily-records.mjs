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

let sql = '\n-- Additional Daily Work Records\n';

// 15th: everyone worked 2 hours on all their tasks
for (const taskId of member1Tasks) {
  sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', '${member1}', '${taskId}', 2);\n`;
}
for (const taskId of member2Tasks) {
  sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-15', '${member2}', '${taskId}', 2);\n`;
}

// 16th: everyone worked 3 hours on all their tasks
for (const taskId of member1Tasks) {
  sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', '${member1}', '${taskId}', 3);\n`;
}
for (const taskId of member2Tasks) {
  sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-16', '${member2}', '${taskId}', 3);\n`;
}

// 17th: some worked 4 hours, some 0 hours (0 hours means we just don't insert, or insert 0)
// For member1, task1 is 4 hours, task2 is not inserted (0 hours), task3 is 1 hour
sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-17', '${member1}', '${member1Tasks[0]}', 4);\n`;
sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-17', '${member1}', '${member1Tasks[2]}', 1);\n`;

// For member2, task1 is not inserted (0 hours), task2 is 2 hours, task3 is not inserted (0 hours)
sql += `INSERT INTO daily_work_records (date, member_id, task_id, work_time) VALUES ('2026-06-17', '${member2}', '${member2Tasks[1]}', 2);\n`;

fs.appendFileSync('supabase/seed.sql', sql);
console.log('Appended daily work records seed data to seed.sql');
