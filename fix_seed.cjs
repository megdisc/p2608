const fs = require('fs');
const crypto = require('crypto');
let content = fs.readFileSync('supabase/seed.sql', 'utf8');

let lines = content.split('\n');
let newLines = lines.map(line => {
    if (line.startsWith('INSERT INTO ')) {
        // We know that `code` is always the second parameter after `id` in our seed generation.
        // e.g. VALUES ('uuid', '''', ...)
        let match = line.match(/VALUES \('([^']+)', ''''/);
        if (match) {
            // Replace the first '''' with a random code
            let randomCode = 'CODE-' + crypto.randomBytes(4).toString('hex');
            return line.replace(/VALUES \('([^']+)', ''''/, `VALUES ('$1', '${randomCode}'`);
        }
    }
    return line;
});

fs.writeFileSync('supabase/seed.sql', newLines.join('\n'));
console.log('Fixed seed.sql');
