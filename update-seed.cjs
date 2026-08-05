const fs = require('fs');
let seed = fs.readFileSync('supabase/seed.sql', 'utf8');

seed = seed.replace(/'売上'/g, "'就労支援事業収益'");
seed = seed.replace(/'労務費（その他）'/g, "'労務費（利用者工賃以外）'");
seed = seed.replace(/'その他費用'/g, "'経費'");

fs.writeFileSync('supabase/seed.sql', seed);
