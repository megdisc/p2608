const fs = require('fs');

const members = [
  { id: 'b362ad61-3ab9-42b3-a53c-1b77f985b85a', name: '江口春奈' },
  { id: 'e98c7634-1eb3-4e42-b062-841f39c043e0', name: '大西健太' },
  { id: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', name: '佐藤花子' },
  { id: 'f0e9d8c7-b6a5-4321-0987-6543210fedc2', name: '高橋次郎' }
];

const skills = [
  { id: 'ec4310ed-27ab-4c2f-8d93-3ea31ce2a642', name: 'ネットワーク設計' },
  { id: '817f8df7-05bc-4610-8a37-9609ff4ae89d', name: 'Cisco' },
  { id: 'f3b0d9b2-ab80-48e1-abf2-7f7b6653b6d2', name: 'Linux' },
  { id: '8172c05b-207d-4ca4-82e5-c8e51328accc', name: 'Windows Server' },
  { id: '676fa8f0-b4d8-4035-ae3f-de391ece3a63', name: 'React' },
  { id: '38eb7141-55bd-43d0-a6a5-7d028233eb17', name: 'TypeScript' },
  { id: '9322b5f6-fbb0-4a6e-a365-b814fbca7d49', name: 'Figma' },
  { id: '3beb5767-f4b8-4c92-a9b8-be10e94ac7d6', name: 'Oracle' },
  { id: '740001dd-4b33-4d53-8b05-f08d178a408c', name: 'PL/SQL' },
  { id: 'baf4f0c2-954d-46ac-a3e4-a0ad211155c8', name: 'Python' },
  { id: '074ce5ed-005a-4a3d-8681-a9eed17c4986', name: 'セキュリティ監査' },
  { id: 'f0624c11-e56b-4267-a730-75dd6980b578', name: 'ペネトレーションテスト' },
  { id: '128b9cc4-7e82-4f3b-b2ab-94f83b1c67d3', name: '製パン技術' },
  { id: '874c9f1a-5d6b-4e2c-9a3e-781f2a5b0c9d', name: '接客・販売' }
];

const skillLevels = [
  { id: 'e24bd35c-7833-41c3-ab5b-5136db6d75d1', name: '1.初級' },
  { id: 'cdfc7a4d-c124-41d3-98cb-fb1b15ad39bb', name: '2.中級' },
  { id: '9b139db0-a352-4f38-89c0-9dff60a4f66a', name: '3.上級' }
];

let sql = `-- Member Skill Evaluations\n`;

let totalCombinations = members.length * skills.length;
let targetCount = Math.floor(totalCombinations * 0.93); 
let added = 0;

for (let member of members) {
  for (let skill of skills) {
    if (added >= targetCount && Math.random() > 0.1) continue; 
    if (Math.random() > 0.95 && added >= 51) continue; // leave some empty
    
    // Choose a random skill level, somewhat weighted based on member to look somewhat realistic
    // Or just fully random
    let level = skillLevels[Math.floor(Math.random() * skillLevels.length)];
    
    sql += `INSERT INTO member_skill_evaluations (member_id, skill_id, skill_level_id) VALUES ('${member.id}', '${skill.id}', '${level.id}'); -- ${member.name}: ${skill.name} (${level.name})\n`;
    added++;
  }
}

fs.writeFileSync('generated_evals.sql', sql);
console.log(`Generated ${added} evaluations.`);
