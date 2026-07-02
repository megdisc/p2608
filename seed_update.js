const fs = require('fs');
let seed = fs.readFileSync('supabase/seed.sql', 'utf8');
seed = seed.replace(
  "INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 50);",
  "INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', 'aaceaea1-43df-42c1-bfc6-1794a4eb9e16', 100);"
);
seed = seed.replace(
  "INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 80);",
  "INSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', 'd6b67bb1-5d17-4ca3-aa4d-f9a80c4409b1', 100);\nINSERT INTO monthly_task_progress (year_month, task_id, current_progress) VALUES ('2026-06', '3334e7a8-684e-4695-a503-5cccdc2b0e50', 100);"
);
fs.writeFileSync('supabase/seed.sql', seed);
