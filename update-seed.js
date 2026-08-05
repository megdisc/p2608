import fs from 'fs';

const content = fs.readFileSync('supabase/seed.sql', 'utf8');
const lines = content.split('\n');

const taskAssignees = {}; // taskId -> { hasMember: false, hasClient: false }

for (const line of lines) {
  if (line.includes('INSERT INTO project_task_assignees')) {
    const match = line.match(/VALUES \('([^']+)',\s*'([^']+)'\)/);
    if (match) {
      const taskId = match[1];
      const assigneeId = match[2];
      
      if (!taskAssignees[taskId]) {
        taskAssignees[taskId] = { hasMember: false, hasClient: false };
      }
      if (line.includes('member_id')) {
        taskAssignees[taskId].hasMember = true;
      } else if (line.includes('client_id')) {
        taskAssignees[taskId].hasClient = true;
      }
    }
  }
}

const newLines = lines.map(line => {
  if (line.includes('INSERT INTO project_tasks')) {
    const match = line.match(/VALUES \('([^']+)',/);
    if (match) {
      const taskId = match[1];
      const assigneeInfo = taskAssignees[taskId] || { hasMember: false, hasClient: false };
      let assigneeType = 'internal'; // default
      if (assigneeInfo.hasClient) {
        assigneeType = 'external';
      }
      
      // Update the INSERT statement
      // Find the column list
      const colMatch = line.match(/INSERT INTO project_tasks \(([^)]+)\)/);
      if (colMatch) {
         let cols = colMatch[1];
         let valuesStr = line.substring(line.indexOf('VALUES (') + 8, line.lastIndexOf(')'));
         
         // Only add if not already there
         if (!cols.includes('assignee_type')) {
           cols += ', assignee_type';
           valuesStr += `, '${assigneeType}'`;
           const updatedLine = `INSERT INTO project_tasks (${cols}) VALUES (${valuesStr});`;
           return updatedLine;
         }
      }
    }
  }
  return line;
});

fs.writeFileSync('supabase/seed.sql', newLines.join('\n'), 'utf8');
console.log('Done!');
