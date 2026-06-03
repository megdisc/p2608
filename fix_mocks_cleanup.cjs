const fs = require('fs');
const path = require('path');

const tablesDir = path.join(__dirname, 'src', 'mock', 'tables');
['inventory.ts', 'transaction.ts', 'stocktaking.ts'].forEach(file => {
    let content = fs.readFileSync(path.join(tablesDir, file), 'utf8');
    content = content.replace(/,\s*code:\s*'[^']+'/g, '');
    fs.writeFileSync(path.join(tablesDir, file), content);
});
console.log("Cleanup done");
