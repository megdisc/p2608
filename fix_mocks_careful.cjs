const fs = require('fs');
const path = require('path');

const tablesDir = path.join(__dirname, 'src', 'mock', 'tables');
const files = fs.readdirSync(tablesDir);

files.forEach(file => {
    if (!file.endsWith('.ts')) return;
    let content = fs.readFileSync(path.join(tablesDir, file), 'utf8');
    
    // Change camelCase to snake_case
    content = content.replace(/itemId:/g, 'item_id:');
    content = content.replace(/locationId:/g, 'location_id:');
    content = content.replace(/supplierId:/g, 'supplier_id:');
    content = content.replace(/categoryId:/g, 'category_id:');
    content = content.replace(/staffId:/g, 'staff_id:');
    content = content.replace(/contentAmount:/g, 'content_amount:');
    content = content.replace(/contentUnit:/g, 'unit_id:');
    content = content.replace(/standardPrice:/g, 'standard_price:');
    content = content.replace(/standardPurchaseQty:/g, 'standard_purchase_qty:');
    content = content.replace(/contactPerson:/g, 'contact_person:');
    content = content.replace(/systemQty:/g, 'system_qty:');
    content = content.replace(/actualQty:/g, 'actual_qty:');
    
    // Add code field based on id
    // Match exact word boundary so we don't hit item_id
    content = content.replace(/\bid:\s*('[^']+')/g, 'id: $1, code: $1');
    
    fs.writeFileSync(path.join(tablesDir, file), content);
});

// For index.ts, replace camelCase property access
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

console.log("Careful replace done");
