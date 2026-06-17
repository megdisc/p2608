import fs from 'fs';
import crypto from 'crypto';

const uuid = () => crypto.randomUUID();

const staff1 = '563bb18c-8d3b-44ca-8fec-1fb32a71c8aa'; // 相澤 翔太
const staff2 = 'de2d336b-254d-4af7-8e49-5acbda340e67'; // 井上 結衣
const member1 = 'b362ad61-3ab9-42b3-a53c-1b77f985b85a'; // 江口 春奈
const member2 = 'e98c7634-1eb3-4e42-b062-841f39c043e0'; // 大西 智也
const client1 = '73ab0c05-9915-4894-a083-6bccf7a66d2a'; // テクノソリューションズ
const skill1 = '676fa8f0-b4d8-4035-ae3f-de391ece3a63'; // React
const skill2 = '38eb7141-55bd-43d0-a6a5-7d028233eb17'; // TypeScript

const newProjects = [
  {
    name: '新規Webサービス開発支援', yomigana: 'しんきうぇぶさーびすかいはつしえん', client: client1, start: '2025-10-01', end: '2026-09-30',
    tasks: [
      { name: 'UI/UXデザイン', type: 'inhouse', assignees: [{id: staff2, type: 'staff'}, {id: member1, type: 'member'}], skills: [skill1, skill2] },
      { name: 'フロントエンド実装', type: 'inhouse', assignees: [{id: staff1, type: 'staff'}, {id: member2, type: 'member'}], skills: [skill1, skill2] }
    ]
  },
  {
    name: '社内基幹システム移行', yomigana: 'しゃないきかんしすてむいこう', client: client1, start: '2026-01-01', end: '2026-11-30',
    tasks: [
      { name: 'データ移行計画', type: 'inhouse', assignees: [{id: staff1, type: 'staff'}, {id: member1, type: 'member'}, {id: member2, type: 'member'}], skills: [] }
    ]
  }
].map(p => ({ ...p, id: uuid(), tasks: p.tasks.map(t => ({ ...t, id: uuid() })) }));

let sql = '\n-- Additional Projects with Staff and Members\n';
for (const p of newProjects) {
  sql += `INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('${p.id}', '${p.name}', '${p.yomigana}', '${p.client}', '${p.start}', '${p.end}');\n`;
  for (const t of p.tasks) {
    sql += `INSERT INTO project_tasks (id, project_id, name, assignee_type) VALUES ('${t.id}', '${p.id}', '${t.name}', '${t.type}');\n`;
    for (const skillId of t.skills) {
      sql += `INSERT INTO project_task_skills (task_id, skill_id) VALUES ('${t.id}', '${skillId}');\n`;
    }
    for (const assignee of t.assignees) {
      if (assignee.type === 'staff') {
        sql += `INSERT INTO project_task_assignees (task_id, staff_id) VALUES ('${t.id}', '${assignee.id}');\n`;
      } else if (assignee.type === 'member') {
        sql += `INSERT INTO project_task_assignees (task_id, member_id) VALUES ('${t.id}', '${assignee.id}');\n`;
      }
    }
  }
}

fs.appendFileSync('supabase/seed.sql', sql);
console.log('Appended more seed data to seed.sql');
