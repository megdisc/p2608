import fs from 'fs';
import crypto from 'crypto';

const uuid = () => crypto.randomUUID();

const clients = [
  { name: '株式会社テクノソリューションズ', yomigana: 'かぶしきがいしゃてくのそりゅーしょんず', contactPerson: '佐々木 凛', phone: '0312345678' },
  { name: 'グローバルインダストリー株式会社', yomigana: 'ぐろーばるいんだすとりーかぶしきがいしゃ', contactPerson: '清水 蒼', phone: '0698765432' },
  { name: '合同会社イノベーションラボ', yomigana: 'ごうどうがいしゃいのべーしょんらぼ', contactPerson: '杉山 結愛', phone: '05011112222' }
].map((c, i) => ({ ...c, id: uuid(), code: `CLI-00${i+1}` }));

const skills = [
  { name: 'ネットワーク設計', yomigana: 'ねっとわーくせっけい', description: 'ネットワーク構成の設計・構築' },
  { name: 'Cisco', yomigana: 'しすこ', description: 'Cisco製ネットワーク機器の設定・管理' },
  { name: 'Linux', yomigana: 'りなっくす', description: 'Linuxサーバーの構築・運用' },
  { name: 'Windows Server', yomigana: 'うぃんどうずさーばー', description: 'Windows Serverの構築・運用' },
  { name: 'React', yomigana: 'りあくと', description: 'Reactによるフロントエンド開発' },
  { name: 'TypeScript', yomigana: 'たいぷすくりぷと', description: 'TypeScriptによる静的型付け' },
  { name: 'Figma', yomigana: 'ふぃぐま', description: 'Figmaを用いたUI/UXデザイン' },
  { name: 'Oracle', yomigana: 'おらくる', description: 'Oracle Databaseの設計・運用' },
  { name: 'PL/SQL', yomigana: 'ぴーえるえすきゅーえる', description: 'PL/SQLによるデータベースプログラミング' },
  { name: 'Python', yomigana: 'ぱいそん', description: 'Pythonによるバックエンド開発・データ処理' },
  { name: 'セキュリティ監査', yomigana: 'せきゅりてぃかんさ', description: '情報セキュリティの監査・評価' },
  { name: 'ペネトレーションテスト', yomigana: 'ぺねとれーしょんてすと', description: 'システムへの侵入テスト' }
].map((s, i) => ({ ...s, id: uuid(), code: `SKL-0${(i+1).toString().padStart(2, '0')}` }));

// Assuming members:
// Member 1: b362ad61-3ab9-42b3-a53c-1b77f985b85a (江口 春奈)
// Member 2: e98c7634-1eb3-4e42-b062-841f39c043e0 (大西 智也)
const member1 = 'b362ad61-3ab9-42b3-a53c-1b77f985b85a';
const member2 = 'e98c7634-1eb3-4e42-b062-841f39c043e0';

const projects = [
  {
    name: '本社オフィスネットワーク構築', yomigana: 'ほんしゃおふぃすねっとわーくこうちく', client: clients[0].id, start: '2026-01-01', end: '2026-12-31',
    tasks: [
      { name: '要件定義', type: 'inhouse', assignees: [member1], skills: ['ネットワーク設計', 'Cisco'] },
      { name: '基本・詳細設計', type: 'outsource', assignees: [clients[1].id], skills: ['ネットワーク設計', 'Cisco'] },
      { name: '構築・テスト', type: 'inhouse', assignees: [member2], skills: ['Cisco', 'Linux'] }
    ]
  },
  {
    name: '支社サーバーリプレイス', yomigana: 'ししゃさーばーりぷれいす', client: clients[1].id, start: '2026-04-01', end: '2026-08-20',
    tasks: [
      { name: 'サーバー構築', type: 'outsource', assignees: [clients[2].id], skills: ['Linux', 'Windows Server'] }
    ]
  }
].map(p => ({ ...p, id: uuid(), tasks: p.tasks.map(t => ({ ...t, id: uuid() })) }));

let sql = '\n-- Clients\n';
for (const c of clients) {
  sql += `INSERT INTO clients (id, code, name, yomigana, contact_person, phone) VALUES ('${c.id}', '${c.code}', '${c.name}', '${c.yomigana}', '${c.contactPerson}', '${c.phone}');\n`;
}

sql += '\n-- Skills\n';
for (const s of skills) {
  sql += `INSERT INTO skills (id, code, name, yomigana, description) VALUES ('${s.id}', '${s.code}', '${s.name}', '${s.yomigana}', '${s.description}');\n`;
}

sql += '\n-- Projects\n';
for (const p of projects) {
  sql += `INSERT INTO projects (id, name, yomigana, client_id, start_date, end_date) VALUES ('${p.id}', '${p.name}', '${p.yomigana}', '${p.client}', '${p.start}', '${p.end}');\n`;
  for (const t of p.tasks) {
    sql += `INSERT INTO project_tasks (id, project_id, name, assignee_type) VALUES ('${t.id}', '${p.id}', '${t.name}', '${t.type}');\n`;
    for (const skillName of t.skills) {
      const skillId = skills.find(s => s.name === skillName)?.id;
      sql += `INSERT INTO project_task_skills (task_id, skill_id) VALUES ('${t.id}', '${skillId}');\n`;
    }
    for (const assignee of t.assignees) {
      if (t.type === 'inhouse') {
        sql += `INSERT INTO project_task_assignees (task_id, member_id) VALUES ('${t.id}', '${assignee}');\n`;
      } else {
        sql += `INSERT INTO project_task_assignees (task_id, client_id) VALUES ('${t.id}', '${assignee}');\n`;
      }
    }
  }
}

fs.appendFileSync('supabase/seed.sql', sql);
console.log('Seed SQL appended.');
