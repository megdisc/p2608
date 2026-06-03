const fs = require('fs');

let content = fs.readFileSync('supabase/seed.sql', 'utf8');

// Replace wrong UUIDs for units
// kg
content = content.replace(/b0b9cbe1-6053-46a8-857f-aa209092b1fb/g, '8953b541-e95b-43e3-9fef-fa2dbf2bd307');
// g
content = content.replace(/36f9a9bf-f926-4327-92a1-e1b0bf12b6a8/g, '52b63cbb-d945-4cc2-b777-813dc7c96693');
// ml
content = content.replace(/16e5759f-3ad1-4ecd-8197-0ba6ff3ac678/g, 'ee75e3af-1166-4292-86a5-c9fd3d033a12');

fs.writeFileSync('supabase/seed.sql', content);
console.log('Fixed unit_ids in seed.sql');
