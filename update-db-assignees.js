import fs from 'fs';
import { execSync } from 'child_process';

const content = fs.readFileSync('supabase/seed.sql', 'utf8');
const lines = content.split('\n');
const taskAssignees = {}; 

for (const line of lines) {
  if (line.includes('INSERT INTO project_task_assignees')) {
    const match = line.match(/VALUES \('([^']+)',\s*'([^']+)'\)/);
    if (match) {
      const taskId = match[1];
      
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

for (const line of lines) {
  if (line.includes('INSERT INTO project_tasks')) {
    const match = line.match(/VALUES \('([^']+)',/);
    if (match) {
      const taskId = match[1];
      const assigneeInfo = taskAssignees[taskId] || { hasMember: false, hasClient: false };
      let assigneeType = 'internal'; // default
      if (assigneeInfo.hasClient) {
        assigneeType = 'external';
      }
      
      try {
        console.log(`Updating ${taskId} to ${assigneeType}`);
        execSync(`docker exec supabase_db_p2608 psql -U postgres -d postgres -c "UPDATE public.project_tasks SET assignee_type = '${assigneeType}' WHERE id = '${taskId}';"`);
      } catch (err) {
        console.error(`Error updating ${taskId}`);
      }
    }
  }
}
console.log('Done updating DB!');
