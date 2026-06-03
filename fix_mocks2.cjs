const fs = require('fs');
const path = require('path');

const tablesDir = path.join(__dirname, 'src', 'mock', 'tables');
const files = fs.readdirSync(tablesDir);

files.forEach(file => {
    if (!file.endsWith('.ts')) return;
    let content = fs.readFileSync(path.join(tablesDir, file), 'utf8');
    
    // Add code: '...' where id: '...' is found.
    content = content.replace(/id:\s*('[^']+')/g, 'id: $1, code: $1');
    
    // And in index.ts, the relations might need to be fixed if I change the camelCases.
    // wait, I already changed camelCase to snake_case! Let me fix src/mock/index.ts!
    fs.writeFileSync(path.join(tablesDir, file), content);
});

let indexTs = fs.readFileSync(path.join(__dirname, 'src', 'mock', 'index.ts'), 'utf8');
indexTs = indexTs.replace(/\.categoryId/g, '.category_id');
indexTs = indexTs.replace(/\.locationId/g, '.location_id');
indexTs = indexTs.replace(/\.supplierId/g, '.supplier_id');
indexTs = indexTs.replace(/\.itemId/g, '.item_id');
indexTs = indexTs.replace(/\.staffId/g, '.staff_id');
indexTs = indexTs.replace(/\.contentAmount/g, '.content_amount');
indexTs = indexTs.replace(/\.contentUnit/g, '.unit_id');
indexTs = indexTs.replace(/\.standardPrice/g, '.standard_price');
indexTs = indexTs.replace(/\.standardPurchaseQty/g, '.standard_purchase_qty');
fs.writeFileSync(path.join(__dirname, 'src', 'mock', 'index.ts'), indexTs);

console.log("Fixed mock code fields and index.ts");
